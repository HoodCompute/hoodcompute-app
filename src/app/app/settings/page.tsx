"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useCredits } from "@/context/CreditsContext";
import { Modal } from "@/components/app/Modal";

const ESCROW_ADDRESS = "0xb2e17d4f8a9c035e6b7d21f4c8a90e3d5f16b8a4";

const CARD = { background: "oklch(0.245 0.018 244)", border: "1px solid oklch(1 0 0 / 0.08)" };
const BORDER = { borderColor: "oklch(1 0 0 / 0.08)" };
const INPUT_STYLE = { background: "oklch(0.185 0.015 245)", border: "1px solid oklch(1 0 0 / 0.12)", color: "#fff" };

const OUTLINE_BTN = "rounded-[6px] px-4 py-2 text-[13px] font-[500] text-white/50 transition hover:bg-white/[0.06] hover:text-white/80";
const OUTLINE_BTN_STYLE = { border: "1px solid oklch(1 0 0 / 0.12)" };

type CreditTransaction = {
  id: string;
  type: string;
  amount: number;
  usdg_value: number | null;
  description: string | null;
  created_at: string;
};

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[10px] overflow-hidden" style={CARD}>
      <div className="border-b px-5 py-4" style={BORDER}>
        <h2 className="text-[15px] font-[500] text-white/90">{title}</h2>
        {description && <p className="mt-0.5 text-[12px] text-white/35">{description}</p>}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

const API_KEYS = [
  { id: "key_live_a7k2", name: "Production", prefix: "hoodc_live_•••••••••••••••••••••••", created: "Jun 1, 2026", lastUsed: "14 sec ago" },
  { id: "key_test_b3m9", name: "Sandbox",    prefix: "hoodc_test_•••••••••••••••••••••••", created: "Jun 1, 2026", lastUsed: "3 days ago" },
];

const WEBHOOKS_DEFAULT = [
  { id: "wh_a1b2", url: "http://localhost:3000/hoodcompute/events", events: ["job.completed", "job.failed", "credit.low"], status: "active", lastDelivery: "14 sec ago" },
];

export default function SettingsPage() {
  const supabase = createClient();
  const { credits, totalPurchased, totalSpent, addCredits } = useCredits();

  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [creditTxs, setCreditTxs] = useState<CreditTransaction[]>([]);
  const [showTopUp, setShowTopUp] = useState(false);
  const [showNewKey, setShowNewKey] = useState(false);
  const [showNewWebhook, setShowNewWebhook] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState("");
  const [topUpStep, setTopUpStep] = useState<"form" | "verifying" | "confirmed">("form");
  const [addressCopied, setAddressCopied] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      setUserId(user.id);
      setUserEmail(user.email ?? "");
      supabase.from("credit_transactions")
        .select("id, type, amount, usdg_value, description, created_at")
        .eq("user_id", user.id).order("created_at", { ascending: false }).limit(8)
        .then(({ data }) => setCreditTxs(data ?? []));
    });
  }, [supabase]);

  function copyAddress() {
    navigator.clipboard.writeText(ESCROW_ADDRESS);
    setAddressCopied(true);
    setTimeout(() => setAddressCopied(false), 2000);
  }

  async function handlePaymentMade() {
    setTopUpStep("verifying");
    await new Promise(r => setTimeout(r, 3500));
    const amount = Math.round(parseFloat(topUpAmount || "0") * 100);
    await addCredits(amount, parseFloat(topUpAmount || "0"));
    setTopUpStep("confirmed");
  }

  function closeTopUp() {
    setShowTopUp(false);
    setTopUpAmount("");
    setTopUpStep("form");
  }

  function txTypeLabel(type: string) {
    return { purchase: "Purchase", spend: "Spent", refund: "Refund", bonus: "Bonus" }[type] ?? type;
  }

  function txTypeColor(type: string) {
    return type === "spend" ? "oklch(0.80 0.18 35)" : "oklch(0.75 0.17 150)";
  }

  return (
    <div className="mx-auto max-w-[720px] p-6 space-y-5">

      {/* Account */}
      <Section title="Account" description="Your HoodCompute account details.">
        <div className="space-y-3">
          {[
            { label: "Email",   value: userEmail || "-" },
            { label: "User ID", value: userId ?? "-", mono: true },
          ].map(row => (
            <div key={row.label}>
              <label className="mb-1.5 block text-[12px] font-[500] text-white/50">{row.label}</label>
              <div className="flex items-center rounded-[6px] px-3.5 py-2.5"
                style={{ background: "oklch(0.185 0.015 245)", border: "1px solid oklch(1 0 0 / 0.08)" }}>
                <span className={`flex-1 truncate text-[13px] text-white/40 ${row.mono ? "font-mono text-[12px]" : ""}`}>
                  {row.value}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Credits */}
      <Section title="Credits" description="1 credit = $0.01 USDG. Credits are used for every inference job.">
        <div className="flex items-center justify-between rounded-[8px] px-5 py-4 mb-5"
          style={{ background: "oklch(0.185 0.015 245)", border: "1px solid oklch(1 0 0 / 0.10)" }}>
          <div>
            <p className="text-[11px] font-[500] uppercase tracking-widest text-white/25">Credit balance</p>
            <p className="my-2 font-mono text-[32px] font-[500] leading-none text-white">{credits.toLocaleString()}</p>
            <p className="text-[12px] text-white/35">${(credits * 0.01).toFixed(2)} USD value</p>
          </div>
          <button onClick={() => setShowTopUp(false)} className="gl-btn-primary !text-[13px] !py-2 !px-4">
            Top up credits
          </button>
        </div>

        <div className="space-y-2 mb-5">
          {[
            { label: "Total purchased", value: `${totalPurchased.toLocaleString()} cr ($${(totalPurchased * 0.01).toFixed(2)})` },
            { label: "Total spent",     value: `${totalSpent.toLocaleString()} cr ($${(totalSpent * 0.01).toFixed(2)})` },
          ].map(row => (
            <div key={row.label} className="flex items-center justify-between">
              <span className="text-[13px] text-white/40">{row.label}</span>
              <span className="font-mono text-[13px] font-[500] text-white/70">{row.value}</span>
            </div>
          ))}
        </div>

        {creditTxs.length > 0 && (
          <div>
            <p className="mb-2 text-[12px] font-[500] text-white/25 uppercase tracking-widest">Transaction history</p>
            <div className="rounded-[8px] overflow-hidden" style={{ border: "1px solid oklch(1 0 0 / 0.08)" }}>
              {creditTxs.map((tx, i) => (
                <div key={tx.id}
                  className={`flex items-center justify-between px-4 py-2.5 ${i < creditTxs.length - 1 ? "border-b" : ""}`}
                  style={{ borderColor: "oklch(1 0 0 / 0.06)" }}>
                  <div>
                    <p className="text-[12px] font-[500] text-white/70">{tx.description ?? txTypeLabel(tx.type)}</p>
                    <p className="text-[11px] text-white/25 mt-0.5">{new Date(tx.created_at).toLocaleDateString()}</p>
                  </div>
                  <span className="font-mono text-[13px] font-[500]" style={{ color: txTypeColor(tx.type) }}>
                    {tx.amount > 0 ? "+" : ""}{tx.amount.toLocaleString()} cr
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Section>

      {/* API keys */}
      <Section title="API keys" description="Use these to authenticate requests to the HoodCompute OpenAI-compatible API.">
        <div className="space-y-3 mb-4">
          {API_KEYS.map((key) => (
            <div key={key.id} className="rounded-[8px] p-4" style={{ border: "1px solid oklch(1 0 0 / 0.08)" }}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-[500] text-white/90">{key.name}</span>
                    <span className="rounded-full px-2 py-0.5 text-[10px] font-[500]"
                      style={{ background: "oklch(0.75 0.17 150 / 0.15)", color: "oklch(0.75 0.17 150)" }}>
                      Active
                    </span>
                  </div>
                  <p className="mt-1.5 font-mono text-[12px] text-white/30">{key.prefix}</p>
                  <p className="mt-1 text-[11px] text-white/20">Created {key.created} · Last used {key.lastUsed}</p>
                </div>
                <button className="shrink-0 rounded-[6px] px-2.5 py-1 text-[12px] font-[500] transition"
                  style={{ color: "oklch(0.80 0.18 35)", border: "1px solid oklch(0.80 0.18 35 / 0.25)" }}>
                  Revoke
                </button>
              </div>
            </div>
          ))}
        </div>
        <button onClick={() => setShowNewKey(false)} className={OUTLINE_BTN} style={OUTLINE_BTN_STYLE}>
          + Generate new key
        </button>
      </Section>

      {/* Webhooks */}
      <Section title="Webhooks" description="HoodCompute posts to your endpoints for every job and credit event.">
        <div className="space-y-3 mb-4">
          {WEBHOOKS_DEFAULT.map((wh) => (
            <div key={wh.id} className="rounded-[8px] p-4" style={{ border: "1px solid oklch(1 0 0 / 0.08)" }}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-mono text-[12px] font-[500] text-white/70">{wh.url}</p>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {wh.events.map((e) => (
                      <span key={e} className="rounded-full px-2 py-0.5 font-mono text-[10px] text-white/40"
                        style={{ background: "oklch(1 0 0 / 0.06)", border: "1px solid oklch(1 0 0 / 0.08)" }}>
                        {e}
                      </span>
                    ))}
                  </div>
                  <p className="mt-1.5 text-[11px] text-white/25">Last delivery: {wh.lastDelivery}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button className={OUTLINE_BTN} style={OUTLINE_BTN_STYLE}>Edit</button>
                  <button className="rounded-[6px] px-2.5 py-1 text-[12px] font-[500] transition"
                    style={{ color: "oklch(0.80 0.18 35)", border: "1px solid oklch(0.80 0.18 35 / 0.25)" }}>
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <button onClick={() => setShowNewWebhook(true)} className={OUTLINE_BTN} style={OUTLINE_BTN_STYLE}>
          + Add endpoint
        </button>
      </Section>

      {/* Beta */}
      <Section title="Beta programme" description="Your membership in the HoodCompute open beta.">
        <div className="flex items-center justify-between rounded-[8px] px-5 py-4"
          style={{ background: "oklch(0.86 0.13 200 / 0.08)", border: "1px solid oklch(0.86 0.13 200 / 0.20)" }}>
          <div>
            <p className="text-[13px] font-[500] text-white/90">Active beta member</p>
            <p className="text-[12px] text-white/40 mt-0.5">
              2x $HCOMPUTE provider multiplier active · No platform fees until beta ends.
            </p>
          </div>
          <span className="rounded-full px-3 py-1 text-[12px] font-[500] uppercase tracking-widest"
            style={{ background: "oklch(0.86 0.13 200 / 0.15)", color: "var(--gold)" }}>
            Beta
          </span>
        </div>
      </Section>

      {/* Danger zone */}
      <Section title="Danger zone">
        <div className="flex items-center justify-between rounded-[8px] px-4 py-3"
          style={{ background: "oklch(0.72 0.18 35 / 0.06)", border: "1px solid oklch(0.72 0.18 35 / 0.20)" }}>
          <div>
            <p className="text-[13px] font-[500] text-white/80">Delete account</p>
            <p className="text-[12px] text-white/35">Permanently delete your account and forfeit remaining credits.</p>
          </div>
          <button className="rounded-[6px] px-3 py-1.5 text-[13px] font-[500] transition"
            style={{ color: "oklch(0.80 0.18 35)", border: "1px solid oklch(0.80 0.18 35 / 0.30)" }}>
            Delete
          </button>
        </div>
      </Section>

      {/* Top-up modal */}
      <Modal open={showTopUp} onClose={closeTopUp} className="max-w-[440px]">
        <div className="flex items-center justify-between border-b px-6 py-4" style={BORDER}>
          <div>
            <h3 className="text-[16px] font-[500] text-white/90">Top up credits</h3>
            <p className="mt-0.5 text-[12px] text-white/35">Send USDG on Robinhood Chain to buy credits</p>
          </div>
          {topUpStep !== "verifying" && (
            <button onClick={closeTopUp} className="text-white/30 hover:text-white/70 transition-colors">
              <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4">
                <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>

        {topUpStep === "form" && (
          <div className="p-6 space-y-5">
            <div className="rounded-[8px] p-4 space-y-2"
              style={{ background: "oklch(1 0 0 / 0.04)", border: "1px solid oklch(1 0 0 / 0.08)" }}>
              {[
                { step: "1", text: "Enter the amount of USDG to convert into credits. 1 USDG = 100 credits." },
                { step: "2", text: "Send exactly that amount to the escrow address below on Robinhood Chain." },
                { step: "3", text: "Click \"I've made the payment\" and we will verify on-chain." },
              ].map((s) => (
                <div key={s.step} className="flex items-start gap-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-[500]"
                    style={{ background: "var(--gold)", color: "var(--surface-dark)" }}>{s.step}</span>
                  <p className="text-[13px] text-white/45 leading-snug">{s.text}</p>
                </div>
              ))}
            </div>

            <div>
              <label className="mb-1.5 block text-[12px] font-[500] text-white/50">Amount (USDG)</label>
              <div className="flex items-center rounded-[6px]" style={INPUT_STYLE}>
                <span className="pl-3.5 font-mono text-[14px] text-white/30">$</span>
                <input type="number" min="0" step="0.01" placeholder="0.00" value={topUpAmount}
                  onChange={e => setTopUpAmount(e.target.value)}
                  className="flex-1 bg-transparent px-2 py-2.5 font-mono text-[14px] text-white outline-none placeholder:text-white/20" />
                <span className="pr-3.5 font-mono text-[12px] font-[500] text-white/30">USDG</span>
              </div>
              {topUpAmount && parseFloat(topUpAmount) > 0 && (
                <p className="mt-1 text-[11px] text-white/35">
                  = {Math.round(parseFloat(topUpAmount) * 100).toLocaleString()} credits
                </p>
              )}
              <div className="mt-2 flex gap-2">
                {["5", "10", "25", "50"].map(amt => (
                  <button key={amt} type="button" onClick={() => setTopUpAmount(amt)}
                    className="rounded-full px-2.5 py-0.5 text-[11px] font-[500] text-white/35 transition hover:text-white/70"
                    style={{ border: "1px solid oklch(1 0 0 / 0.12)" }}>
                    ${amt}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-[12px] font-[500] text-white/50">Escrow address</label>
                <span className="rounded-full px-2 py-0.5 text-[10px] font-[500]"
                  style={{ background: "oklch(0.75 0.17 150 / 0.15)", color: "oklch(0.75 0.17 150)" }}>
                  Robinhood Chain
                </span>
              </div>
              <div className="flex items-center gap-2 rounded-[6px] px-3.5 py-2.5"
                style={{ background: "oklch(0.185 0.015 245)", border: "1px solid oklch(1 0 0 / 0.10)" }}>
                <span className="flex-1 truncate font-mono text-[12px] text-white/45">{ESCROW_ADDRESS}</span>
                <button type="button" onClick={copyAddress}
                  className="shrink-0 rounded-[4px] px-2 py-0.5 text-[11px] font-[500] text-white/40 transition hover:text-white/80"
                  style={{ border: "1px solid oklch(1 0 0 / 0.12)" }}>
                  {addressCopied ? "Copied" : "Copy"}
                </button>
              </div>
              <p className="mt-1.5 text-[11px] text-white/25">
                Only send <span className="font-[500] text-white/50">USDG</span> on{" "}
                <span className="font-[500] text-white/50">Robinhood Chain</span> to this address.
              </p>
            </div>

            <button type="button" onClick={handlePaymentMade}
              disabled={!topUpAmount || parseFloat(topUpAmount) <= 0}
              className="gl-btn-primary w-full !text-[14px] disabled:opacity-40 disabled:cursor-not-allowed">
              I've made the payment
            </button>
          </div>
        )}

        {topUpStep === "verifying" && (
          <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
            <div className="relative mb-6 h-16 w-16">
              <svg className="animate-spin h-16 w-16" viewBox="0 0 64 64" fill="none">
                <circle cx="32" cy="32" r="28" stroke="oklch(1 0 0 / 0.08)" strokeWidth="4" />
                <path d="M32 4a28 28 0 0 1 28 28" stroke="var(--gold)" strokeWidth="4" strokeLinecap="round" />
              </svg>
            </div>
            <p className="text-[17px] font-[500] text-white">Verifying on-chain</p>
            <p className="mt-2 max-w-[260px] text-[13px] text-white/40 leading-relaxed">
              Scanning Robinhood Chain for your transfer of{" "}
              <span className="font-mono font-[500] text-white/80">
                ${parseFloat(topUpAmount || "0").toFixed(2)} USDG
              </span>{" "}
              to the escrow wallet.
            </p>
            <div className="mt-6 flex items-center gap-2 rounded-full px-4 py-1.5"
              style={{ background: "oklch(1 0 0 / 0.05)", border: "1px solid oklch(1 0 0 / 0.10)" }}>
              <span className="h-1.5 w-1.5 rounded-full bg-[oklch(0.75_0.17_150)] animate-pulse" />
              <span className="font-mono text-[11px] text-white/30">Polling Robinhood Chain...</span>
            </div>
          </div>
        )}

        {topUpStep === "confirmed" && (
          <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full"
              style={{ background: "oklch(0.75 0.17 150 / 0.15)" }}>
              <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8" style={{ color: "oklch(0.75 0.17 150)" }}>
                <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="text-[17px] font-[500] text-white">Credits added</p>
            <p className="mt-2 max-w-[260px] text-[13px] text-white/40 leading-relaxed">
              <span className="font-mono font-[500] text-white/80">
                {Math.round(parseFloat(topUpAmount || "0") * 100).toLocaleString()} credits
              </span>{" "}
              have been added to your account.
            </p>
            <button type="button" onClick={closeTopUp} className="gl-btn-primary mt-8 !text-[14px] !py-2 !px-8">
              Done
            </button>
          </div>
        )}
      </Modal>

      {/* New API key modal */}
      <Modal open={showNewKey} onClose={() => setShowNewKey(false)} className="max-w-[400px] p-6">
        <h3 className="text-[16px] font-[500] text-white/90 mb-4">Generate API key</h3>
        <div className="rounded-[8px] p-4 font-mono text-[13px] text-white/50 mb-4"
          style={{ background: "oklch(0.185 0.015 245)", border: "1px solid oklch(1 0 0 / 0.08)" }}>
          hoodc_live_xK9mR3QrLs2nBvTkWj4hYe...
        </div>
        <p className="text-[12px] text-white/30 mb-4">Copy this key now. You will not be able to see it again.</p>
        <div className="flex gap-2">
          <button className={`flex-1 ${OUTLINE_BTN}`} style={OUTLINE_BTN_STYLE}>Copy key</button>
          <button onClick={() => setShowNewKey(false)} className="flex-1 gl-btn-primary !text-[13px] !py-2">Done</button>
        </div>
      </Modal>

      {/* Add webhook modal */}
      <Modal open={showNewWebhook} onClose={() => setShowNewWebhook(false)} className="max-w-[440px]">
        <div className="flex items-center justify-between border-b px-6 py-4" style={BORDER}>
          <h3 className="text-[16px] font-[500] text-white/90">Add webhook endpoint</h3>
          <button onClick={() => setShowNewWebhook(false)} className="text-white/30 hover:text-white/70 transition-colors">
            <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-[12px] font-[500] text-white/50">Endpoint URL</label>
            <input placeholder="https://your-server.com/hoodcompute-events"
              className="w-full rounded-[6px] px-3 py-2.5 font-mono text-[13px] placeholder:text-white/20 outline-none"
              style={INPUT_STYLE} />
          </div>
          <div>
            <label className="mb-1.5 block text-[12px] font-[500] text-white/50">Events</label>
            <div className="space-y-2">
              {["job.completed", "job.failed", "job.disputed", "credit.low", "credit.purchase", "provider.online", "provider.slashed"].map(e => (
                <label key={e} className="flex items-center gap-2.5 cursor-pointer">
                  <input type="checkbox" defaultChecked={e.startsWith("job")} className="rounded accent-[var(--gold)]" />
                  <span className="font-mono text-[12px] text-white/50">{e}</span>
                </label>
              ))}
            </div>
          </div>
          <button onClick={() => setShowNewWebhook(false)} className="gl-btn-primary w-full !text-[14px]">
            Add endpoint
          </button>
        </div>
      </Modal>
    </div>
  );
}
