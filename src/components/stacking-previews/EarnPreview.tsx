"use client";

import { useState } from "react";

const CARD = { background: "oklch(0.245 0.018 244)", border: "1px solid oklch(1 0 0 / 0.08)" };
const BORDER = { borderColor: "oklch(1 0 0 / 0.08)" };

type DemoJob = {
  id: string;
  model: string;
  tokens: number;
  payout: number;
  age: string;
};

const INITIAL_JOBS: DemoJob[] = [
  { id: "1", model: "Qwen3 8B", tokens: 612, payout: 0.0091, age: "2m ago" },
  { id: "2", model: "Llama 3.1 70B", tokens: 1204, payout: 0.0248, age: "14m ago" },
  { id: "3", model: "DeepSeek V3", tokens: 388, payout: 0.0062, age: "31m ago" },
];

const HOSTED_MODELS = [
  { name: "Qwen3 8B", tier: "lite" },
  { name: "Llama 3.1 70B", tier: "standard" },
  { name: "DeepSeek V3", tier: "pro" },
];

export function EarnPreview() {
  const [online, setOnline] = useState(true);
  const [jobs, setJobs] = useState(INITIAL_JOBS);
  const [earned, setEarned] = useState(186.42);
  const [jobsCompleted, setJobsCompleted] = useState(1284);

  function toggleStatus() {
    setOnline((prev) => !prev);
  }

  function simulateJob() {
    if (!online) return;
    const models = ["Qwen3 8B", "Llama 3.1 70B", "DeepSeek V3", "Mistral Large"];
    const model = models[Math.floor(Math.random() * models.length)];
    const tokens = 200 + Math.floor(Math.random() * 1200);
    const payout = Number((tokens * 0.000018).toFixed(4));
    const job: DemoJob = { id: crypto.randomUUID(), model, tokens, payout, age: "just now" };
    setJobs((prev) => [job, ...prev].slice(0, 4));
    setEarned((prev) => Number((prev + payout).toFixed(2)));
    setJobsCompleted((prev) => prev + 1);
  }

  return (
    <div className="flex h-full w-full flex-col overflow-hidden p-4 text-left sm:p-6" style={{ background: "var(--surface-dark)" }}>
      {/* Provider header */}
      <div className="rounded-[10px] p-4" style={CARD}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="truncate text-[15px] font-[600] text-white">RTX-4090-Berlin</h3>
              <span
                className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-[500]"
                style={{ background: "oklch(0.86 0.13 200 / 0.15)", color: "var(--gold)" }}
              >
                Trusted
              </span>
            </div>
            <p className="mt-0.5 text-[11px] text-white/40">Native worker · RTX 4090 · 24GB VRAM</p>
          </div>

          <button
            onClick={toggleStatus}
            className="flex shrink-0 items-center gap-1.5 rounded-[8px] px-3 py-2 text-[11px] font-[500] transition"
            style={
              online
                ? { border: "1px solid oklch(1 0 0 / 0.12)", color: "oklch(1 0 0 / 0.60)" }
                : { background: "var(--gold)", color: "var(--surface-dark)" }
            }
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${online ? "animate-pulse" : ""}`}
              style={{ background: online ? "oklch(0.75 0.17 150)" : "oklch(0.20 0.015 245 / 0.50)" }}
            />
            {online ? "Online" : "Offline"}
          </button>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2.5">
          {[
            { label: "Reputation", value: "742/1000" },
            { label: "Jobs done", value: jobsCompleted.toLocaleString() },
            { label: "Earned", value: `$${earned.toFixed(2)}` },
          ].map((row) => (
            <div key={row.label} className="rounded-[8px] px-3 py-2" style={{ background: "oklch(1 0 0 / 0.04)", border: "1px solid oklch(1 0 0 / 0.08)" }}>
              <p className="text-[9px] uppercase tracking-widest text-white/25">{row.label}</p>
              <p className="mt-0.5 font-mono text-[13px] font-[500] leading-none text-white">{row.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Jobs + models */}
      <div className="mt-3 grid flex-1 grid-cols-1 gap-3 overflow-hidden sm:grid-cols-5">
        <div className="flex flex-col overflow-hidden rounded-[10px] sm:col-span-3" style={CARD}>
          <div className="flex shrink-0 items-center justify-between border-b px-4 py-2.5" style={BORDER}>
            <h4 className="text-[11px] font-[500] text-white/70">Jobs routed to you</h4>
            <button
              onClick={simulateJob}
              disabled={!online}
              className="rounded-full px-2.5 py-1 text-[10px] font-[500] text-white/50 transition hover:text-white/90 disabled:cursor-not-allowed disabled:opacity-30"
              style={{ border: "1px solid oklch(1 0 0 / 0.10)" }}
            >
              Simulate job
            </button>
          </div>
          <div className="flex-1 divide-y overflow-y-auto" style={BORDER}>
            {jobs.map((job) => (
              <div key={job.id} className="flex items-center justify-between px-4 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-[12px] font-[500] text-white/90">{job.model}</p>
                  <p className="mt-0.5 text-[10px] text-white/30">{job.age}</p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="font-mono text-[11px] text-white/40">{job.tokens} tok</span>
                  <span className="font-mono text-[12px] font-[500]" style={{ color: "oklch(0.75 0.17 150)" }}>
                    +${job.payout.toFixed(4)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 overflow-hidden sm:col-span-2">
          <div className="rounded-[10px] p-3.5" style={CARD}>
            <p className="text-[11px] font-[500] text-white/70">$HCOMPUTE stake</p>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-[10px] text-white/35">Reward rate</span>
              <span className="font-mono text-[12px] font-[500] text-white/80">85%</span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full" style={{ background: "oklch(1 0 0 / 0.08)" }}>
              <div className="h-full rounded-full" style={{ width: "72%", background: "var(--gold)" }} />
            </div>
            <p className="mt-1.5 text-[10px] text-white/25">1,200 $HCOMPUTE staked</p>
          </div>

          <div className="flex-1 overflow-hidden rounded-[10px] p-3.5" style={CARD}>
            <p className="mb-2 text-[11px] font-[500] text-white/70">Hosted models</p>
            <div className="space-y-1.5">
              {HOSTED_MODELS.map((m) => (
                <div key={m.name} className="flex items-center justify-between rounded-[6px] px-2.5 py-1.5" style={{ background: "oklch(1 0 0 / 0.04)" }}>
                  <span className="truncate text-[11px] font-[500] text-white/80">{m.name}</span>
                  <span className="shrink-0 text-[10px] text-white/25">{m.tier}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
