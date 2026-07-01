"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

type Job = {
  id: string;
  model_name: string;
  model_slug: string;
  tier: string;
  status: string;
  input_tokens: number;
  output_tokens: number;
  credits_charged: number;
  usdg_value: number;
  latency_ms: number | null;
  tx_hash: string | null;
  block_number: number | null;
  created_at: string;
  completed_at: string | null;
};

const CARD = { background: "oklch(0.245 0.018 244)", border: "1px solid oklch(1 0 0 / 0.08)" };
const BORDER = { borderColor: "oklch(1 0 0 / 0.08)" };
const STATUS_OPTIONS = ["all", "completed", "running", "pending", "failed", "disputed"] as const;

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; bg: string; color: string }> = {
    completed: { label: "Completed", bg: "oklch(0.7 0.17 150 / 0.15)",  color: "oklch(0.75 0.17 150)" },
    running:   { label: "Running",   bg: "oklch(0.60 0.18 250 / 0.15)", color: "oklch(0.74 0.15 250)" },
    pending:   { label: "Pending",   bg: "oklch(1 0 0 / 0.08)",          color: "oklch(1 0 0 / 0.50)" },
    failed:    { label: "Failed",    bg: "oklch(0.72 0.18 35 / 0.15)",   color: "oklch(0.80 0.18 35)" },
    disputed:  { label: "Disputed",  bg: "oklch(0.72 0.18 35 / 0.15)",   color: "oklch(0.80 0.18 35)" },
  };
  const s = map[status] ?? map.pending;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-[500] whitespace-nowrap"
      style={{ background: s.bg, color: s.color }}>
      <span className="h-1 w-1 rounded-full" style={{ background: s.color }} />
      {s.label}
    </span>
  );
}

function TierBadge({ tier }: { tier: string }) {
  const colors: Record<string, string> = {
    lite:     "oklch(0.75 0.17 150)",
    standard: "oklch(0.74 0.15 250)",
    pro:      "oklch(0.74 0.15 290)",
    max:      "var(--gold)",
  };
  return (
    <span className="inline-block rounded-full px-2 py-0.5 text-[10px] font-[500] uppercase tracking-wide"
      style={{ background: "oklch(1 0 0 / 0.07)", color: colors[tier] ?? "oklch(1 0 0 / 0.50)" }}>
      {tier}
    </span>
  );
}

export default function JobsPage() {
  const supabase = createClient();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedHash, setCopiedSig] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    let query = supabase.from("jobs")
      .select("id, model_name, model_slug, tier, status, input_tokens, output_tokens, credits_charged, usdg_value, latency_ms, tx_hash, block_number, created_at, completed_at")
      .eq("user_id", user.id).order("created_at", { ascending: false }).limit(50);
    if (statusFilter !== "all") query = query.eq("status", statusFilter);
    const { data } = await query;
    setJobs(data ?? []);
    setLoading(false);
  }, [supabase, statusFilter]);

  useEffect(() => {
    load();
    const channel = supabase.channel("jobs-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "jobs" }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [load, supabase]);

  async function copyHash(sig: string) {
    await navigator.clipboard.writeText(sig);
    setCopiedSig(sig);
    setTimeout(() => setCopiedSig(null), 2000);
  }

  const totalCredits = jobs.reduce((sum, j) => sum + (j.credits_charged ?? 0), 0);
  const completedCount = jobs.filter(j => j.status === "completed").length;

  return (
    <div className="p-6 space-y-5 max-w-[1100px]">

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total jobs",    value: jobs.length.toString() },
          { label: "Completed",     value: completedCount.toString() },
          { label: "Credits spent", value: totalCredits.toLocaleString() },
        ].map((s) => (
          <div key={s.label} className="rounded-[10px] p-4" style={CARD}>
            <p className="text-[11px] font-[500] uppercase tracking-widest text-white/30">{s.label}</p>
            <p className="mt-1.5 font-mono text-[24px] font-[500] leading-none text-white">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-[10px] overflow-hidden" style={CARD}>

        {/* Filters */}
        <div className="flex items-center gap-2 border-b px-4 py-3" style={BORDER}>
          <span className="text-[12px] font-[500] text-white/30 mr-1">Status</span>
          {STATUS_OPTIONS.map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`rounded-full px-3 py-1 text-[12px] font-[500] capitalize transition ${statusFilter === s
                ? "bg-white/[0.12] text-white"
                : "text-white/40 hover:text-white/70 hover:bg-white/[0.06]"}`}>
              {s}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/10 border-t-white/40" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full"
              style={{ background: "oklch(1 0 0 / 0.05)" }}>
              <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5 text-white/25">
                <rect x="3" y="3" width="14" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
                <path d="M7 7h6M7 10h6M7 13h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </div>
            <p className="text-[14px] font-[500] text-white/35">
              {statusFilter !== "all" ? `No ${statusFilter} jobs` : "No jobs yet"}
            </p>
            <p className="mt-1 text-[12px] text-white/25">
              {statusFilter !== "all" ? "Try a different filter." : "Start a chat to submit your first inference job."}
            </p>
          </div>
        ) : (
          <div className="divide-y" style={BORDER}>
            {/* Header */}
            <div className="grid grid-cols-[1fr_80px_80px_80px_100px_90px] gap-3 px-5 py-2.5">
              {["Model", "Status", "Tokens", "Credits", "TX", "Time"].map((h) => (
                <span key={h} className="text-[10px] font-[500] uppercase tracking-widest text-white/25">{h}</span>
              ))}
            </div>

            {jobs.map((job) => (
              <div key={job.id}>
                <button
                  onClick={() => setExpandedId(expandedId === job.id ? null : job.id)}
                  className="grid w-full grid-cols-[1fr_80px_80px_80px_100px_90px] gap-3 px-5 py-3 text-left transition hover:bg-white/[0.03]">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="truncate text-[13px] font-[500] text-white/90">{job.model_name}</span>
                    <TierBadge tier={job.tier} />
                  </div>
                  <div><StatusBadge status={job.status} /></div>
                  <div className="font-mono text-[12px] text-white/50 flex items-center">
                    {(job.input_tokens + job.output_tokens).toLocaleString()}
                  </div>
                  <div className="font-mono text-[13px] font-[500] text-white/80 flex items-center">
                    {job.credits_charged}
                  </div>
                  <div className="flex items-center">
                    {job.tx_hash ? (
                      <span className="font-mono text-[11px] text-white/30 truncate">
                        {job.tx_hash.slice(0, 10)}...
                      </span>
                    ) : (
                      <span className="text-[11px] text-white/20">Pending</span>
                    )}
                  </div>
                  <div className="text-[12px] text-white/30 flex items-center justify-end">
                    {timeAgo(job.created_at)}
                  </div>
                </button>

                {/* Expanded row */}
                {expandedId === job.id && (
                  <div className="border-t px-5 py-4 space-y-3"
                    style={{ background: "oklch(0.185 0.015 245)", borderColor: "oklch(1 0 0 / 0.06)" }}>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                      {[
                        { label: "Job ID",        value: job.id.slice(0, 16) + "..." },
                        { label: "Input tokens",  value: job.input_tokens.toLocaleString() },
                        { label: "Output tokens", value: job.output_tokens.toLocaleString() },
                        { label: "Latency",       value: job.latency_ms ? `${job.latency_ms}ms` : "-" },
                        { label: "USDG value",    value: `$${Number(job.usdg_value).toFixed(4)}` },
                        { label: "Block",         value: job.block_number ? job.block_number.toLocaleString() : "-" },
                        { label: "Submitted",     value: new Date(job.created_at).toLocaleString() },
                        { label: "Completed",     value: job.completed_at ? new Date(job.completed_at).toLocaleString() : "-" },
                      ].map((row) => (
                        <div key={row.label}>
                          <p className="text-[10px] font-[500] uppercase tracking-widest text-white/25">{row.label}</p>
                          <p className="mt-0.5 font-mono text-[12px] text-white/70">{row.value}</p>
                        </div>
                      ))}
                    </div>

                    {job.tx_hash && (
                      <div className="flex items-center gap-3 rounded-[8px] px-4 py-3"
                        style={{ background: "oklch(1 0 0 / 0.03)", border: "1px solid oklch(1 0 0 / 0.08)" }}>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-[500] uppercase tracking-widest text-white/25 mb-1">
                            Transaction hash
                          </p>
                          <p className="font-mono text-[12px] text-white/50 truncate">{job.tx_hash}</p>
                        </div>
                        <button onClick={() => copyHash(job.tx_hash!)}
                          className="shrink-0 rounded-[6px] px-3 py-1.5 text-[12px] font-[500] text-white/40 transition hover:text-white/80"
                          style={{ border: "1px solid oklch(1 0 0 / 0.10)" }}>
                          {copiedHash === job.tx_hash ? "Copied" : "Copy"}
                        </button>
                        <a href={`https://robinhoodchain.blockscout.com/tx/${job.tx_hash}`} target="_blank" rel="noopener noreferrer"
                          className="shrink-0 rounded-[6px] px-3 py-1.5 text-[12px] font-[500] text-white/40 transition hover:text-white/80 flex items-center gap-1"
                          style={{ border: "1px solid oklch(1 0 0 / 0.10)" }}>
                          Blockscout
                          <svg viewBox="0 0 12 12" fill="none" className="h-2.5 w-2.5">
                            <path d="M2 10L10 2M10 2H5M10 2v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                          </svg>
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
