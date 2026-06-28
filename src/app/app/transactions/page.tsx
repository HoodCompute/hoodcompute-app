"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Transaction = {
  id: string;
  sig: string;
  wallet_label: string;
  recipient: string;
  recipient_addr: string;
  amount: number;
  status: string;
  block_number: number;
  fee: number;
  memo: string;
  created_at: string;
};

const STATUS_STYLES: Record<string, { badge: string; icon: string; iconColor: string }> = {
  confirmed: {
    badge: "bg-[oklch(0.7_0.17_150)]/15 text-[oklch(0.7_0.17_150)]",
    icon: "M3 8.5l3 3 7-7",
    iconColor: "text-[oklch(0.7_0.17_150)]",
  },
  blocked: {
    badge: "bg-[oklch(0.72_0.18_35)]/15 text-[oklch(0.72_0.18_35)]",
    icon: "M8 5v4M8 11h.01",
    iconColor: "text-[oklch(0.72_0.18_35)]",
  },
};

const borderStyle = { borderColor: "oklch(1 0 0 / 0.08)" };

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [filter, setFilter] = useState("all");
  const [walletFilter, setWalletFilter] = useState("all");

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("transactions")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setTransactions(data ?? []);
        setLoading(false);
      });
  }, []);

  const walletLabels = Array.from(new Set(transactions.map((t) => t.wallet_label)));

  const filtered = transactions.filter((t) => {
    const statusMatch = filter === "all" || t.status === filter;
    const walletMatch = walletFilter === "all" || t.wallet_label === walletFilter;
    return statusMatch && walletMatch;
  });

  return (
    <div className="flex h-full">
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Filters */}
        <div className="flex items-center justify-between border-b px-6 py-4" style={{ background: "oklch(0.185 0.015 245)", ...borderStyle }}>
          <div className="flex items-center gap-2">
            {["all", "confirmed", "blocked"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-full px-3 py-1 text-[13px] font-[500] capitalize transition ${
                  filter === f ? "text-white" : "text-white/50 hover:text-white"
                }`}
                style={filter === f ? { background: "oklch(1 0 0 / 0.12)" } : undefined}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <select
              value={walletFilter}
              onChange={(e) => setWalletFilter(e.target.value)}
              className="rounded-[6px] px-2.5 py-1.5 text-[13px] text-white outline-none"
              style={{ background: "oklch(0.245 0.018 244)", border: "1px solid oklch(1 0 0 / 0.10)" }}
            >
              <option value="all">All wallets</option>
              {walletLabels.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
            <button
              className="rounded-[6px] px-3 py-1.5 text-[13px] font-[500] text-white/70 transition hover:bg-white/[0.04] hover:text-white"
              style={{ border: "1px solid oklch(1 0 0 / 0.10)" }}
            >
              Export CSV
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto">
          <table className="w-full">
            <thead className="sticky top-0 z-10 border-b" style={{ background: "oklch(0.245 0.018 244)", ...borderStyle }}>
              <tr>
                {["", "Tx hash", "Agent", "Recipient", "Amount", "Status", "Time"].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-[11px] font-[500] uppercase tracking-widest text-white/30">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="px-5 py-20 text-center text-[13px] text-white/40">
                    Loading transactions…
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-20 text-center text-[13px] text-white/40">
                    No transactions yet.
                  </td>
                </tr>
              )}
              {filtered.map((tx, i) => {
                const s = STATUS_STYLES[tx.status] ?? STATUS_STYLES.confirmed;
                return (
                  <tr
                    key={tx.id}
                    onClick={() => setSelected(tx)}
                    className={`cursor-pointer transition hover:bg-white/[0.04] ${selected?.id === tx.id ? "bg-white/[0.04]" : ""} ${i !== filtered.length - 1 ? "border-b" : ""}`}
                    style={i !== filtered.length - 1 ? { borderColor: "oklch(1 0 0 / 0.06)" } : undefined}
                  >
                    <td className="w-8 pl-5 py-3.5">
                      <div
                        className="flex h-6 w-6 items-center justify-center rounded-full"
                        style={{ background: tx.status === "blocked" ? "oklch(0.72 0.18 35 / 0.15)" : "oklch(0.7 0.17 150 / 0.15)" }}
                      >
                        <svg viewBox="0 0 16 16" fill="none" className={`h-3 w-3 ${s.iconColor}`}>
                          <path d={s.icon} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                          {tx.status === "blocked" && <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4" />}
                        </svg>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-[13px] text-white/70">{tx.sig.slice(0, 14)}…</span>
                    </td>
                    <td className="px-4 py-3.5 text-[13px] text-white/70">{tx.wallet_label}</td>
                    <td className="px-4 py-3.5">
                      <div>
                        <p className="text-[13px] font-[500] text-white">{tx.recipient}</p>
                        <p className="font-mono text-[11px] text-white/40">{tx.recipient_addr}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`font-mono text-[14px] font-[500] ${tx.status === "blocked" ? "line-through" : "text-white"}`}
                        style={tx.status === "blocked" ? { color: "oklch(0.72 0.18 35)" } : undefined}
                      >
                        ${Number(tx.amount).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[12px] font-[500] capitalize ${s.badge}`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-[13px] text-white/40">{formatRelative(tx.created_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="w-[340px] shrink-0 overflow-y-auto border-l" style={{ background: "oklch(0.245 0.018 244)", ...borderStyle }}>
          <div className="flex items-center justify-between border-b px-5 py-4" style={borderStyle}>
            <h3 className="text-[14px] font-[500] text-white">Transaction detail</h3>
            <button onClick={() => setSelected(null)} className="text-white/40 hover:text-white transition-colors">
              <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4">
                <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <div className="p-5 space-y-5">
            <div
              className="flex items-center gap-2.5 rounded-[8px] px-4 py-3"
              style={{ background: selected.status === "blocked" ? "oklch(0.72 0.18 35 / 0.15)" : "oklch(0.7 0.17 150 / 0.15)" }}
            >
              <span
                className="text-[13px] font-[500] capitalize"
                style={{ color: selected.status === "blocked" ? "oklch(0.72 0.18 35)" : "oklch(0.7 0.17 150)" }}
              >
                {selected.status === "blocked" ? "Blocked by policy" : "Confirmed on-chain"}
              </span>
            </div>

            <div className="text-center">
              <p className="text-[12px] text-white/40">Amount</p>
              <p
                className={`font-mono text-[36px] font-[500] leading-none mt-1 ${selected.status === "blocked" ? "line-through" : "text-white"}`}
                style={selected.status === "blocked" ? { color: "oklch(0.72 0.18 35)" } : undefined}
              >
                ${Number(selected.amount).toFixed(2)}
              </p>
              <p className="mt-1 font-mono text-[12px] text-white/40">USDG</p>
            </div>

            <div className="space-y-3">
              {[
                { label: "Block",        value: selected.block_number?.toLocaleString() },
                { label: "Timestamp",    value: formatTimestamp(selected.created_at) },
                { label: "Network fee",  value: `${selected.fee} ETH` },
                { label: "From",         value: selected.wallet_label },
                { label: "To",           value: selected.recipient },
                { label: "Memo",         value: selected.memo || "-" },
              ].map((row) => (
                <div key={row.label} className="border-b pb-3 last:border-0 last:pb-0" style={{ borderColor: "oklch(1 0 0 / 0.06)" }}>
                  <p className="text-[11px] text-white/40">{row.label}</p>
                  <p className="mt-0.5 font-mono text-[12px] font-[500] text-white break-all">{row.value}</p>
                </div>
              ))}
            </div>

            <div>
              <p className="mb-1.5 text-[12px] font-[500] text-white/40">Transaction hash</p>
              <div className="rounded-[6px] p-3" style={{ background: "oklch(0.27 0.02 244)" }}>
                <p className="break-all font-mono text-[10px] text-white/60">{selected.sig}</p>
              </div>
            </div>

            <a
              href={`https://robinhoodchain.blockscout.com/tx/${selected.sig}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-[13px] font-[500] text-white/40 underline underline-offset-4 hover:text-white transition-colors"
            >
              View on Blockscout
              <svg viewBox="0 0 16 16" fill="none" className="h-3 w-3">
                <path d="M5 3h8v8M13 3L3 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
