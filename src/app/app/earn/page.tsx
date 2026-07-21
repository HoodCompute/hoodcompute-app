"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

type Model = {
  slug: string;
  name: string;
  tier: string;
  credits_per_request: number;
};

type Provider = {
  id: string;
  display_name: string;
  tier: string;
  gpu_model: string | null;
  vram_gb: number | null;
  status: string;
  reputation_score: number;
  total_jobs_completed: number;
  total_earned_usdg: number;
  hoodc_staked: number;
  uptime_pct: number;
  hosted_models: string[];
  payout_wallet: string | null;
  created_at: string;
};

type RecentJob = {
  id: string;
  model_name: string;
  status: string;
  output_tokens: number;
  provider_payout: number;
  created_at: string;
};

const CARD = { background: "oklch(0.245 0.018 244)", border: "1px solid oklch(1 0 0 / 0.08)" };
const BORDER = { borderColor: "oklch(1 0 0 / 0.08)" };
const INPUT_STYLE = { background: "oklch(0.185 0.015 245)", border: "1px solid oklch(1 0 0 / 0.12)", color: "#fff" };

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`;
}

const REPUTATION_TIERS = [
  { min: 800, label: "Elite",       color: "var(--gold)" },
  { min: 600, label: "Trusted",     color: "oklch(0.75 0.17 150)" },
  { min: 400, label: "Established", color: "oklch(0.74 0.15 250)" },
  { min: 0,   label: "New",         color: "oklch(1 0 0 / 0.40)" },
];

function repTier(score: number) {
  return REPUTATION_TIERS.find(t => score >= t.min) ?? REPUTATION_TIERS[REPUTATION_TIERS.length - 1];
}

export default function EarnPage() {
  const supabase = createClient();

  const [provider, setProvider] = useState<Provider | null>(null);
  const [models, setModels] = useState<Model[]>([]);
  const [recentJobs, setRecentJobs] = useState<RecentJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [toggling, setToggling] = useState(false);
  const [saving, setSaving] = useState(false);
  const [registrationError, setRegistrationError] = useState<string | null>(null);

  const [form, setForm] = useState({
    display_name: "",
    tier: "browser" as "browser" | "native",
    gpu_model: "",
    vram_gb: "",
    hosted_models: [] as string[],
    payout_wallet: "",
  });

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);

    const [providerRes, modelsRes] = await Promise.all([
      supabase.from("providers")
        .select("id, display_name, tier, gpu_model, vram_gb, status, reputation_score, total_jobs_completed, total_earned_usdg, hoodc_staked, uptime_pct, hosted_models, payout_wallet, created_at")
        .eq("user_id", user.id).single(),
      supabase.from("models").select("slug, name, tier, credits_per_request")
        .eq("is_active", true).order("credits_per_request"),
    ]);

    setProvider(providerRes.data ?? null);
    setModels(modelsRes.data ?? []);

    if (providerRes.data) {
      const jobsRes = await supabase.from("jobs")
        .select("id, model_name, status, output_tokens, provider_payout, created_at")
        .eq("provider_id", providerRes.data.id)
        .order("created_at", { ascending: false }).limit(5);
      setRecentJobs(jobsRes.data ?? []);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  function toggleModel(slug: string) {
    setForm(prev => ({
      ...prev,
      hosted_models: prev.hosted_models.includes(slug)
        ? prev.hosted_models.filter(s => s !== slug)
        : [...prev.hosted_models, slug],
    }));
  }

  async function register() {
    if (!userId) return;
    if (!form.display_name.trim()) { setRegistrationError("Display name is required."); return; }
    if (form.hosted_models.length === 0) { setRegistrationError("Select at least one model to host."); return; }
    setSaving(true);
    setRegistrationError(null);
    const { error } = await supabase.from("providers").insert({
      user_id: userId, display_name: form.display_name.trim(), tier: form.tier,
      gpu_model: form.gpu_model.trim() || null, vram_gb: form.vram_gb ? parseInt(form.vram_gb) : null,
      hosted_models: form.hosted_models, payout_wallet: form.payout_wallet.trim() || null, status: "offline",
    });
    if (error) { setRegistrationError(error.message); } else { await load(); }
    setSaving(false);
  }

  async function toggleStatus() {
    if (!provider || toggling) return;
    setToggling(true);
    const newStatus = provider.status === "online" ? "offline" : "online";
    const { error } = await supabase.from("providers")
      .update({ status: newStatus, updated_at: new Date().toISOString() }).eq("id", provider.id);
    if (!error) setProvider(prev => prev ? { ...prev, status: newStatus } : null);
    setToggling(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/10 border-t-white/40" />
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="p-6 max-w-[680px] space-y-6">
        <div>
          <h1 className="text-[22px] font-[600] text-white">Register as a provider</h1>
          <p className="mt-1.5 text-[14px] text-white/40 leading-relaxed">
            Share your GPU and earn USDG for every inference job you complete. Browser workers need no install.
            Native workers run a daemon and earn more per job.
          </p>
        </div>

        {/* Tier cards */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {(["browser", "native"] as const).map((t) => (
            <button key={t} onClick={() => setForm(p => ({ ...p, tier: t }))}
              className="rounded-[10px] p-4 text-left transition"
              style={form.tier === t
                ? { ...CARD, boxShadow: `0 0 0 2px var(--gold)`, border: "1px solid var(--gold)" }
                : { ...CARD, opacity: 0.7 }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[14px] font-[600] text-white capitalize">{t} worker</span>
                {form.tier === t && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full"
                    style={{ background: "var(--gold)" }}>
                    <svg viewBox="0 0 12 12" fill="none" className="h-3 w-3" style={{ color: "var(--surface-dark)" }}>
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                )}
              </div>
              <p className="text-[12px] text-white/40 leading-relaxed">
                {t === "browser"
                  ? "Run via WebGPU in a browser tab. No install needed. Supports 1B–8B models. Lower earnings."
                  : "Install the hoodcompute-node daemon. Supports all model sizes. Requires staking. Higher earnings."}
              </p>
              <p className="mt-2 text-[12px] font-[500]" style={{ color: "oklch(0.75 0.17 150)" }}>
                {t === "browser" ? "98% of job value" : "85% of job value (with stake)"}
              </p>
            </button>
          ))}
        </div>

        {/* Form */}
        <div className="rounded-[10px] overflow-hidden" style={CARD}>
          <div className="border-b px-5 py-3.5" style={BORDER}>
            <h2 className="text-[13px] font-[500] text-white/80">Provider details</h2>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label className="mb-1.5 block text-[12px] font-[500] text-white/50">Display name</label>
              <input value={form.display_name} onChange={e => setForm(p => ({ ...p, display_name: e.target.value }))}
                placeholder="e.g. RTX-4090-Berlin"
                className="w-full rounded-[6px] px-3 py-2.5 text-[14px] placeholder:text-white/20 outline-none"
                style={INPUT_STYLE} />
            </div>

            {form.tier === "native" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-[12px] font-[500] text-white/50">GPU model (optional)</label>
                  <input value={form.gpu_model} onChange={e => setForm(p => ({ ...p, gpu_model: e.target.value }))}
                    placeholder="RTX 4090"
                    className="w-full rounded-[6px] px-3 py-2.5 text-[14px] placeholder:text-white/20 outline-none"
                    style={INPUT_STYLE} />
                </div>
                <div>
                  <label className="mb-1.5 block text-[12px] font-[500] text-white/50">VRAM (GB)</label>
                  <input type="number" value={form.vram_gb} onChange={e => setForm(p => ({ ...p, vram_gb: e.target.value }))}
                    placeholder="24"
                    className="w-full rounded-[6px] px-3 py-2.5 text-[14px] placeholder:text-white/20 outline-none"
                    style={INPUT_STYLE} />
                </div>
              </div>
            )}

            <div>
              <label className="mb-2 block text-[12px] font-[500] text-white/50">Models to host</label>
              <div className="grid grid-cols-2 gap-2">
                {models.map(m => {
                  const checked = form.hosted_models.includes(m.slug);
                  return (
                    <label key={m.slug}
                      className="flex items-center gap-2.5 cursor-pointer rounded-[6px] p-2.5 transition"
                      style={{ border: `1px solid ${checked ? "var(--gold)" : "oklch(1 0 0 / 0.08)"}`, background: checked ? "oklch(0.86 0.13 200 / 0.08)" : "transparent" }}>
                      <input type="checkbox" checked={checked} onChange={() => toggleModel(m.slug)} className="rounded accent-[var(--gold)]" />
                      <div>
                        <p className="text-[12px] font-[500] text-white/90">{m.name}</p>
                        <p className="text-[10px] text-white/30">{m.tier} · {m.credits_per_request} cr/req</p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-[12px] font-[500] text-white/50">Ethereum wallet (for payouts)</label>
              <input value={form.payout_wallet} onChange={e => setForm(p => ({ ...p, payout_wallet: e.target.value }))}
                placeholder="0x..."
                className="w-full rounded-[6px] px-3 py-2.5 font-mono text-[13px] placeholder:text-white/20 outline-none"
                style={INPUT_STYLE} />
              <p className="mt-1 text-[11px] text-white/25">USDG payouts go here after each completed job.</p>
            </div>

            {registrationError && (
              <div className="rounded-[6px] px-3 py-2.5"
                style={{ background: "oklch(0.72 0.18 35 / 0.10)", border: "1px solid oklch(0.72 0.18 35 / 0.30)" }}>
                <p className="text-[12px] text-white/60">{registrationError}</p>
              </div>
            )}

            <button onClick={register} disabled={saving}
              className="gl-btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed">
              {saving ? "Registering..." : "Register as provider"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const tier = repTier(provider.reputation_score);

  return (
    <div className="p-6 space-y-6 max-w-[1000px]">

      {/* Provider header */}
      <div className="rounded-[10px] p-5" style={CARD}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-[20px] font-[600] text-white">{provider.display_name}</h1>
              <span className="rounded-full px-2.5 py-0.5 text-[11px] font-[500]"
                style={{ background: `oklch(from ${tier.color} l c h / 0.15)`, color: tier.color,
                  backgroundColor: `oklch(0.86 0.13 200 / 0.15)` }}>
                {tier.label}
              </span>
            </div>
            <p className="mt-1 text-[13px] text-white/40">
              {provider.tier === "browser" ? "Browser worker (WebGPU)" : `Native worker${provider.gpu_model ? ` · ${provider.gpu_model}` : ""}${provider.vram_gb ? ` · ${provider.vram_gb}GB VRAM` : ""}`}
            </p>
          </div>

          <button onClick={toggleStatus} disabled={toggling}
            className={`flex items-center gap-2 rounded-[8px] px-4 py-2.5 text-[13px] font-[500] transition`}
            style={provider.status === "online"
              ? { border: "1px solid oklch(1 0 0 / 0.12)", color: "oklch(1 0 0 / 0.60)" }
              : { background: "var(--gold)", color: "var(--surface-dark)" }}>
            <span className={`h-2 w-2 rounded-full ${provider.status === "online" ? "animate-pulse" : ""}`}
              style={{ background: provider.status === "online" ? "oklch(0.75 0.17 150)" : "oklch(0.20 0.015 245 / 0.50)" }} />
            {toggling ? "Updating..." : provider.status === "online" ? "Online · Click to go offline" : "Offline · Click to go online"}
          </button>
        </div>

        {/* Key metrics */}
        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Reputation",     value: `${provider.reputation_score}/1000` },
            { label: "Jobs completed", value: provider.total_jobs_completed.toLocaleString() },
            { label: "Total earned",   value: `$${Number(provider.total_earned_usdg).toFixed(2)} USDG` },
            { label: "Uptime",         value: `${Number(provider.uptime_pct).toFixed(1)}%` },
          ].map((row) => (
            <div key={row.label} className="rounded-[8px] px-4 py-3"
              style={{ background: "oklch(1 0 0 / 0.04)", border: "1px solid oklch(1 0 0 / 0.08)" }}>
              <p className="text-[11px] text-white/25 uppercase tracking-widest">{row.label}</p>
              <p className="mt-1 font-mono text-[18px] font-[500] text-white leading-none">{row.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

        {/* Recent jobs */}
        <div className="lg:col-span-2 rounded-[10px] overflow-hidden" style={CARD}>
          <div className="border-b px-5 py-3.5" style={BORDER}>
            <h2 className="text-[13px] font-[500] text-white/80">Jobs routed to you</h2>
          </div>
          {recentJobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-6">
              <p className="text-[13px] text-white/35">
                {provider.status === "online"
                  ? "Waiting for jobs to be routed to you..."
                  : "Go online to start receiving inference jobs."}
              </p>
              {provider.status === "offline" && (
                <button onClick={toggleStatus} className="mt-3 gl-btn-primary !text-[13px] !py-2">
                  Go online
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y" style={BORDER}>
              {recentJobs.map((job) => (
                <div key={job.id} className="flex items-center justify-between px-5 py-3 hover:bg-white/[0.02] transition">
                  <div>
                    <p className="text-[13px] font-[500] text-white/90">{job.model_name}</p>
                    <p className="text-[11px] text-white/30 mt-0.5">{timeAgo(job.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-[12px] text-white/40">{job.output_tokens} tok</span>
                    <span className="font-mono text-[13px] font-[500]" style={{ color: "oklch(0.75 0.17 150)" }}>
                      +${Number(job.provider_payout).toFixed(4)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info panel */}
        <div className="space-y-4">

          {/* Staking */}
          <div className="rounded-[10px] overflow-hidden" style={CARD}>
            <div className="border-b px-5 py-3.5" style={BORDER}>
              <h2 className="text-[13px] font-[500] text-white/80">$HCOMPUTE stake</h2>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex justify-between">
                <span className="text-[12px] text-white/35">Staked</span>
                <span className="font-mono text-[13px] font-[500] text-white/80">
                  {Number(provider.hoodc_staked).toLocaleString()} $HCOMPUTE
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[12px] text-white/35">Reward rate</span>
                <span className="font-mono text-[13px] font-[500] text-white/80">
                  {Number(provider.hoodc_staked) >= 1000 ? "85%" : "98%"}
                </span>
              </div>
              {Number(provider.hoodc_staked) < 1000 && (
                <div className="rounded-[6px] px-3 py-2.5"
                  style={{ background: "oklch(0.86 0.13 200 / 0.10)", border: "1px solid oklch(0.86 0.13 200 / 0.25)" }}>
                  <p className="text-[12px] text-white/50 leading-relaxed">
                    Stake 1,000+ $HCOMPUTE to boost earnings to 85% of each job.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Hosted models */}
          <div className="rounded-[10px] overflow-hidden" style={CARD}>
            <div className="border-b px-5 py-3.5" style={BORDER}>
              <h2 className="text-[13px] font-[500] text-white/80">Hosted models</h2>
            </div>
            <div className="p-3 space-y-1">
              {provider.hosted_models.length === 0 ? (
                <p className="px-2 py-2 text-[12px] text-white/25">None configured.</p>
              ) : (
                provider.hosted_models.map(slug => {
                  const m = models.find(x => x.slug === slug);
                  return (
                    <div key={slug} className="flex items-center justify-between rounded-[6px] px-3 py-2"
                      style={{ background: "oklch(1 0 0 / 0.04)" }}>
                      <span className="text-[12px] font-[500] text-white/80">{m?.name ?? slug}</span>
                      <span className="text-[11px] text-white/25">{m?.tier}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Wallet */}
          <div className="rounded-[10px] overflow-hidden" style={CARD}>
            <div className="border-b px-5 py-3.5" style={BORDER}>
              <h2 className="text-[13px] font-[500] text-white/80">Payout wallet</h2>
            </div>
            <div className="p-5">
              {provider.payout_wallet ? (
                <p className="font-mono text-[12px] text-white/50 break-all">{provider.payout_wallet}</p>
              ) : (
                <p className="text-[12px] text-white/25">No wallet set. Add one to receive USDG payouts.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
