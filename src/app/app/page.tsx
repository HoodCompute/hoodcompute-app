"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useCredits } from "@/context/CreditsContext";

type Job = {
  id: string;
  model_name: string;
  tier: string;
  status: string;
  output_tokens: number;
  credits_charged: number;
  tx_hash: string | null;
  created_at: string;
};

type Provider = {
  id: string;
  display_name: string;
  tier: string;
  status: string;
  reputation_score: number;
  total_jobs_completed: number;
  total_earned_usdg: number;
  gpu_model: string | null;
};

type NetworkStats = {
  active_providers: number;
  total_jobs_today: number;
  jobs_per_hour: number;
  avg_latency_ms: number;
  total_usdg_paid_today: number;
};

const CARD = { background: "oklch(0.245 0.018 244)", border: "1px solid oklch(1 0 0 / 0.08)" };
const BORDER = { borderColor: "oklch(1 0 0 / 0.08)" };

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
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
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-[500]"
      style={{ background: s.bg, color: s.color }}>
      <span className="h-1 w-1 rounded-full" style={{ background: s.color }} />
      {s.label}
    </span>
  );
}

export default function DashboardPage() {
  const supabase = createClient();
  const { credits, loading: creditsLoading } = useCredits();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [provider, setProvider] = useState<Provider | null>(null);
  const [networkStats, setNetworkStats] = useState<NetworkStats | null>(null);
  const [jobsToday, setJobsToday] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [jobsRes, countRes, providerRes, statsRes] = await Promise.all([
      supabase.from("jobs")
        .select("id, model_name, tier, status, output_tokens, credits_charged, tx_hash, created_at")
        .eq("user_id", user.id).order("created_at", { ascending: false }).limit(6),
      supabase.from("jobs")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id).gte("created_at", todayStart.toISOString()),
      supabase.from("providers")
        .select("id, display_name, tier, status, reputation_score, total_jobs_completed, total_earned_usdg, gpu_model")
        .eq("user_id", user.id).single(),
      supabase.from("network_stats")
        .select("active_providers, total_jobs_today, jobs_per_hour, avg_latency_ms, total_usdg_paid_today").single(),
    ]);

    setJobs(jobsRes.data ?? []);
    setJobsToday(countRes.count ?? 0);
    setProvider(providerRes.data ?? null);
    setNetworkStats(statsRes.data ?? null);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    load();
    const channel = supabase.channel("dashboard-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "jobs" }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [load, supabase]);

  const statsLoading = loading || creditsLoading;

  return (
    <div className="p-6 space-y-6 max-w-[1200px]">

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          {
            label: "Credits balance",
            value: statsLoading ? "-" : credits.toLocaleString(),
            sub: `$${statsLoading ? "-" : (credits * 0.01).toFixed(2)} USD value`,
            dot: "var(--gold)",
          },
          {
            label: "Jobs today",
            value: statsLoading ? "-" : jobsToday.toString(),
            sub: jobs.length > 0 ? `Last: ${timeAgo(jobs[0].created_at)}` : "None yet",
            dot: "oklch(0.74 0.15 250)",
          },
          {
            label: "USDG earned",
            value: statsLoading ? "-" : provider ? `$${Number(provider.total_earned_usdg).toFixed(2)}` : "-",
            sub: provider ? `${provider.total_jobs_completed.toLocaleString()} jobs completed` : "Not a provider",
            dot: "oklch(0.75 0.17 150)",
          },
          {
            label: "Network workers",
            value: statsLoading ? "-" : (networkStats?.active_providers ?? 0).toLocaleString(),
            sub: `${(networkStats?.jobs_per_hour ?? 0).toLocaleString()} jobs per hour`,
            dot: "oklch(0.74 0.15 320)",
          },
        ].map((s) => (
          <div key={s.label} className="rounded-[10px] p-5" style={CARD}>
            <div className="flex items-center gap-1.5 mb-2">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.dot }} />
              <p className="text-[11px] font-[500] uppercase tracking-widest text-white/30">{s.label}</p>
            </div>
            <p className="font-mono text-[28px] font-[500] leading-none text-white">{s.value}</p>
            <p className="mt-2 text-[12px] text-white/35">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Quick start */}
      {!loading && jobs.length === 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Link href="/app/chat"
            className="group flex flex-col gap-3 rounded-[10px] p-6 transition hover:opacity-90"
            style={{ background: "var(--gold)" }}>
            <div className="flex h-10 w-10 items-center justify-center rounded-[8px]"
              style={{ background: "oklch(0 0 0 / 0.15)" }}>
              <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" style={{ color: "var(--surface-dark)" }}>
                <path d="M3 4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H7l-4 3V4z"
                  stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <p className="text-[15px] font-[500]" style={{ color: "var(--surface-dark)" }}>Start a private chat</p>
              <p className="mt-0.5 text-[13px]" style={{ color: "oklch(0.20 0.015 245 / 0.55)" }}>
                Use any open-weight model with no logs and no filters. Costs credits per query.
              </p>
            </div>
            <p className="text-[12px] font-[500] transition-opacity opacity-40 group-hover:opacity-70"
              style={{ color: "var(--surface-dark)" }}>
              Open Chat
            </p>
          </Link>

          <Link href="/app/earn"
            className="group flex flex-col gap-3 rounded-[10px] p-6 transition"
            style={{ ...CARD, border: "1px solid oklch(1 0 0 / 0.10)" }}>
            <div className="flex h-10 w-10 items-center justify-center rounded-[8px]"
              style={{ background: "oklch(0.7 0.17 150 / 0.12)" }}>
              <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" style={{ color: "oklch(0.75 0.17 150)" }}>
                <rect x="2" y="6" width="16" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
                <circle cx="13.5" cy="11" r="1.5" stroke="currentColor" strokeWidth="1.4" />
                <path d="M6 11h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <p className="text-[15px] font-[500] text-white">Register as a provider</p>
              <p className="mt-0.5 text-[13px] text-white/40">
                Share your GPU and earn USDG per completed job. Browser workers need no install.
              </p>
            </div>
            <p className="text-[12px] font-[500] text-white/30 group-hover:text-white/60 transition-colors">
              Go to Earn
            </p>
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

        {/* Recent jobs */}
        <div className="lg:col-span-2 rounded-[10px] overflow-hidden" style={CARD}>
          <div className="flex items-center justify-between border-b px-5 py-3.5" style={BORDER}>
            <h2 className="text-[13px] font-[500] text-white/80">Recent jobs</h2>
            <Link href="/app/jobs" className="text-[12px] text-white/30 hover:text-white/60 transition-colors">
              View all
            </Link>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/10 border-t-white/40" />
            </div>
          ) : jobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-6">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full"
                style={{ background: "oklch(1 0 0 / 0.05)" }}>
                <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5 text-white/30">
                  <rect x="3" y="3" width="14" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
                  <path d="M7 7h6M7 10h6M7 13h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </div>
              <p className="text-[13px] font-[500] text-white/40">No jobs yet</p>
              <p className="mt-1 text-[12px] text-white/25">Send a message in Chat to submit your first inference job.</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: "oklch(1 0 0 / 0.06)" }}>
              {jobs.map((job) => (
                <div key={job.id} className="flex items-center gap-3 px-5 py-3 transition hover:bg-white/[0.02]">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-[500] text-white truncate">{job.model_name}</span>
                      <span className="rounded-full px-1.5 py-0.5 text-[10px] font-[500] uppercase tracking-wide"
                        style={{ background: "oklch(1 0 0 / 0.08)", color: "oklch(1 0 0 / 0.50)" }}>
                        {job.tier}
                      </span>
                    </div>
                    <p className="mt-0.5 font-mono text-[11px] text-white/25">
                      {job.tx_hash ? `tx: ${job.tx_hash.slice(0, 14)}...` : "Awaiting settlement"}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <span className="font-mono text-[12px] text-white/40">{job.output_tokens} tok</span>
                    <span className="font-mono text-[12px] font-[500] text-white/70">{job.credits_charged} cr</span>
                    <StatusBadge status={job.status} />
                    <span className="text-[11px] text-white/25 w-14 text-right">{timeAgo(job.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">

          {/* Provider status */}
          <div className="rounded-[10px] overflow-hidden" style={CARD}>
            <div className="border-b px-5 py-3.5" style={BORDER}>
              <h2 className="text-[13px] font-[500] text-white/80">Provider status</h2>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/10 border-t-white/40" />
              </div>
            ) : provider ? (
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[13px] font-[500] text-white">{provider.display_name}</p>
                    <p className="text-[11px] text-white/35 mt-0.5">
                      {provider.gpu_model ?? (provider.tier === "browser" ? "Browser worker" : "Native worker")}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full"
                      style={{ background: provider.status === "online" ? "oklch(0.75 0.17 150)" : "oklch(1 0 0 / 0.25)" }} />
                    <span className="text-[12px] font-[500] capitalize"
                      style={{ color: provider.status === "online" ? "oklch(0.75 0.17 150)" : "oklch(1 0 0 / 0.35)" }}>
                      {provider.status}
                    </span>
                  </div>
                </div>
                <div className="space-y-2.5">
                  {[
                    { label: "Reputation",     value: `${provider.reputation_score}/1000` },
                    { label: "Jobs completed", value: provider.total_jobs_completed.toLocaleString() },
                    { label: "Total earned",   value: `$${Number(provider.total_earned_usdg).toFixed(2)}` },
                  ].map((row) => (
                    <div key={row.label} className="flex justify-between">
                      <span className="text-[12px] text-white/35">{row.label}</span>
                      <span className="font-mono text-[12px] font-[500] text-white/80">{row.value}</span>
                    </div>
                  ))}
                </div>
                <Link href="/app/earn"
                  className="block w-full rounded-[6px] py-2 text-center text-[13px] font-[500] text-white/40 transition hover:bg-white/[0.05] hover:text-white/70"
                  style={{ border: "1px solid oklch(1 0 0 / 0.10)" }}>
                  Manage provider
                </Link>
              </div>
            ) : (
              <div className="p-5 text-center">
                <p className="text-[13px] text-white/35">You are not registered as a provider.</p>
                <Link href="/app/earn"
                  className="mt-3 block rounded-[6px] py-2 text-[13px] font-[500] text-white/60 transition hover:bg-white/[0.05] hover:text-white"
                  style={{ border: "1px solid oklch(1 0 0 / 0.10)" }}>
                  Start earning
                </Link>
              </div>
            )}
          </div>

          {/* Network stats */}
          <div className="rounded-[10px] overflow-hidden" style={CARD}>
            <div className="border-b px-5 py-3.5" style={BORDER}>
              <h2 className="text-[13px] font-[500] text-white/80">Network</h2>
            </div>
            <div className="p-5 space-y-3">
              {loading || !networkStats ? (
                <div className="flex justify-center py-4">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/10 border-t-white/40" />
                </div>
              ) : (
                <>
                  {[
                    { label: "Active providers", value: networkStats.active_providers.toLocaleString() },
                    { label: "Jobs today",        value: networkStats.total_jobs_today.toLocaleString() },
                    { label: "Avg latency",       value: `${(networkStats.avg_latency_ms / 1000).toFixed(1)}s` },
                    { label: "USDG paid today",   value: `$${Number(networkStats.total_usdg_paid_today).toFixed(0)}` },
                  ].map((row) => (
                    <div key={row.label} className="flex justify-between">
                      <span className="text-[12px] text-white/35">{row.label}</span>
                      <span className="font-mono text-[12px] font-[500] text-white/80">{row.value}</span>
                    </div>
                  ))}
                  <div className="pt-1 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full animate-pulse"
                      style={{ background: "oklch(0.75 0.17 150)" }} />
                    <span className="text-[11px] text-white/25">All settlements on Robinhood Chain</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
