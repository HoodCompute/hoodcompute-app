"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

interface BalanceContextValue {
  balance: number | null;
  loading: boolean;
  addBalance: (amount: number) => Promise<void>;
}

const BalanceContext = createContext<BalanceContextValue>({
  balance: null,
  loading: true,
  addBalance: async () => {},
});

export function BalanceProvider({ children }: { children: React.ReactNode }) {
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const supabase = createClient();

  const fetchOrCreateAccount = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    setUserId(user.id);

    const { data, error } = await supabase
      .from("accounts")
      .select("balance")
      .eq("user_id", user.id)
      .single();

    if (error && error.code === "PGRST116") {
      const { data: newRow } = await supabase
        .from("accounts")
        .insert({ user_id: user.id, balance: 0 })
        .select("balance")
        .single();
      setBalance(newRow ? Number(newRow.balance) : 0);
    } else if (data) {
      setBalance(Number(data.balance));
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchOrCreateAccount();
  }, [fetchOrCreateAccount]);

  // Real-time subscription - only set up once userId is known, no async inside the effect
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`account-balance-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "accounts",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setBalance(Number((payload.new as { balance: number }).balance));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [supabase, userId]);

  const addBalance = useCallback(async (amount: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const current = balance ?? 0;
    const newBalance = current + amount;

    const { data } = await supabase
      .from("accounts")
      .update({ balance: newBalance })
      .eq("user_id", user.id)
      .select("balance")
      .single();

    if (data) setBalance(Number(data.balance));
  }, [supabase, balance]);

  return (
    <BalanceContext.Provider value={{ balance, loading, addBalance }}>
      {children}
    </BalanceContext.Provider>
  );
}

export function useBalance() {
  return useContext(BalanceContext);
}
