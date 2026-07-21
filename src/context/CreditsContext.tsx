"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

type CreditsData = {
  balance: number;
  total_purchased: number;
  total_spent: number;
};

type CreditsContextValue = {
  credits: number;
  totalPurchased: number;
  totalSpent: number;
  loading: boolean;
  deductCredits: (amount: number, jobId?: string) => Promise<boolean>;
  addCredits: (amount: number, usdgValue?: number, txHash?: string) => Promise<void>;
  refresh: () => Promise<void>;
};

const CreditsContext = createContext<CreditsContextValue>({
  credits: 0,
  totalPurchased: 0,
  totalSpent: 0,
  loading: true,
  deductCredits: async () => false,
  addCredits: async () => {},
  refresh: async () => {},
});

export function CreditsProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<CreditsData>({ balance: 0, total_purchased: 0, total_spent: 0 });
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const supabase = createClient();

  const fetchOrCreate = useCallback(async (uid: string) => {
    const { data: row, error } = await supabase
      .from("credits")
      .select("balance, total_purchased, total_spent")
      .eq("user_id", uid)
      .single();

    if (error && error.code === "PGRST116") {
      const { data: created } = await supabase
        .from("credits")
        .insert({ user_id: uid, balance: 0, total_purchased: 0, total_spent: 0 })
        .select("balance, total_purchased, total_spent")
        .single();
      if (created) {
        setData(created);
      }
    } else if (row) {
      setData(row);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { setLoading(false); return; }
      setUserId(user.id);
      fetchOrCreate(user.id);
    });
  }, [fetchOrCreate, supabase.auth]);

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel("credits-realtime")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "credits", filter: `user_id=eq.${userId}` },
        (payload) => {
          const n = payload.new as CreditsData;
          setData({ balance: n.balance, total_purchased: n.total_purchased, total_spent: n.total_spent });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId, supabase]);

  async function deductCredits(amount: number, jobId?: string): Promise<boolean> {
    if (!userId || data.balance < amount) return false;
    const newBalance = data.balance - amount;
    const { error } = await supabase
      .from("credits")
      .update({ balance: newBalance, total_spent: data.total_spent + amount, updated_at: new Date().toISOString() })
      .eq("user_id", userId);
    if (!error) {
      setData(prev => ({ ...prev, balance: newBalance, total_spent: prev.total_spent + amount }));
      await supabase.from("credit_transactions").insert({
        user_id: userId,
        type: "spend",
        amount: -amount,
        job_id: jobId ?? null,
        description: "Inference job",
      });
    }
    return !error;
  }

  async function addCredits(amount: number, usdgValue?: number, txHash?: string) {
    if (!userId) return;
    const newBalance = data.balance + amount;
    const { error } = await supabase
      .from("credits")
      .update({ balance: newBalance, total_purchased: data.total_purchased + amount, updated_at: new Date().toISOString() })
      .eq("user_id", userId);
    if (!error) {
      setData(prev => ({ ...prev, balance: newBalance, total_purchased: prev.total_purchased + amount }));
      await supabase.from("credit_transactions").insert({
        user_id: userId,
        type: "purchase",
        amount,
        usdg_value: usdgValue ?? null,
        tx_hash: txHash ?? null,
        description: `Purchased ${amount} credits`,
      });
    }
  }

  async function refresh() {
    if (userId) await fetchOrCreate(userId);
  }

  return (
    <CreditsContext.Provider value={{
      credits: data.balance,
      totalPurchased: data.total_purchased,
      totalSpent: data.total_spent,
      loading,
      deductCredits,
      addCredits,
      refresh,
    }}>
      {children}
    </CreditsContext.Provider>
  );
}

export const useCredits = () => useContext(CreditsContext);
