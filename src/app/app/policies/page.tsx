"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Modal } from "@/components/app/Modal";

type Policy = {
  id: string;
  user_id: string;
  name: string;
  description: string;
  max_per_tx: number;
  max_per_day: number;
  max_per_month: number;
  velocity_cap: number;
  require_co_sign: number;
  expiry: string | null;
  allowed_recipients: string[];
  blocked_categories: string[];
  created_at: string;
  updated_at: string;
};

const PARAM_ROWS: { key: keyof Policy; label: string; prefix: string; suffix: string }[] = [
  { key: "max_per_tx", label: "Max per transaction", prefix: "$", suffix: " USDG" },
  { key: "max_per_day", label: "Max per day (rolling 24h)", prefix: "$", suffix: " USDG" },
  { key: "max_per_month", label: "Max per month", prefix: "$", suffix: " USDG" },
  { key: "velocity_cap", label: "Velocity cap (txs/hr)", prefix: "", suffix: " txs" },
  { key: "require_co_sign", label: "Co-sign threshold", prefix: "$", suffix: " USDG" },
];

const CATEGORY_OPTIONS = ["EXCH", "GAMB", "EXT", "P2P", "NFT", "DeFi"];

const card = { background: "oklch(0.245 0.018 244)", border: "1px solid oklch(1 0 0 / 0.08)" };
const borderStyle = { borderColor: "oklch(1 0 0 / 0.08)" };
const inputStyle = { background: "oklch(0.245 0.018 244)", border: "1px solid oklch(1 0 0 / 0.10)" };
const inputClass = "w-full rounded-[6px] px-3 py-2 text-[13px] text-white placeholder:text-white/30 outline-none";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function PoliciesPage() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Policy | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [newForm, setNewForm] = useState({
    name: "", description: "", max_per_tx: "", max_per_day: "", max_per_month: "",
    velocity_cap: "", require_co_sign: "", expiry: "", blocked_categories: [] as string[],
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const supabase = createClient();

  const fetchPolicies = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("policies").select("*").order("created_at", { ascending: true });
    if (!error && data) {
      setPolicies(data);
      if (!selected && data.length > 0) setSelected(data[0]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchPolicies(); }, [fetchPolicies]);

  function startEditing() {
    if (!selected) return;
    setEditValues({
      max_per_tx: String(selected.max_per_tx), max_per_day: String(selected.max_per_day),
      max_per_month: String(selected.max_per_month), velocity_cap: String(selected.velocity_cap),
      require_co_sign: String(selected.require_co_sign),
    });
    setSaveError(null);
    setEditing(true);
  }

  async function handleSave() {
    if (!selected) return;
    setSaving(true);
    setSaveError(null);
    const updates = {
      max_per_tx: parseFloat(editValues.max_per_tx) || 0,
      max_per_day: parseFloat(editValues.max_per_day) || 0,
      max_per_month: parseFloat(editValues.max_per_month) || 0,
      velocity_cap: parseInt(editValues.velocity_cap) || 0,
      require_co_sign: parseFloat(editValues.require_co_sign) || 0,
    };
    const { data, error } = await supabase.from("policies").update(updates).eq("id", selected.id).select().single();
    if (error) { setSaveError(error.message); setSaving(false); return; }
    setPolicies((prev) => prev.map((p) => (p.id === selected.id ? data : p)));
    setSelected(data);
    setEditing(false);
    setSaving(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setCreateError("Not authenticated."); setCreating(false); return; }
    const { data, error } = await supabase.from("policies").insert({
      user_id: user.id, name: newForm.name,
      description: newForm.description || "Custom policy.",
      max_per_tx: parseFloat(newForm.max_per_tx) || 25,
      max_per_day: parseFloat(newForm.max_per_day) || 500,
      max_per_month: parseFloat(newForm.max_per_month) || 5000,
      velocity_cap: parseInt(newForm.velocity_cap) || 50,
      require_co_sign: parseFloat(newForm.require_co_sign) || 500,
      expiry: newForm.expiry || null, allowed_recipients: [],
      blocked_categories: newForm.blocked_categories,
    }).select().single();
    if (error) { setCreateError(error.message); setCreating(false); return; }
    setPolicies((prev) => [...prev, data]);
    setSelected(data);
    setNewForm({ name: "", description: "", max_per_tx: "", max_per_day: "", max_per_month: "", velocity_cap: "", require_co_sign: "", expiry: "", blocked_categories: [] });
    setShowNew(false);
    setCreating(false);
  }

  function toggleCategory(cat: string) {
    setNewForm((f) => ({
      ...f,
      blocked_categories: f.blocked_categories.includes(cat)
        ? f.blocked_categories.filter((c) => c !== cat)
        : [...f.blocked_categories, cat],
    }));
  }

  return (
    <div className="flex h-full">
      {/* Policy list */}
      <div className="w-[260px] shrink-0 overflow-y-auto border-r" style={{ background: "oklch(0.185 0.015 245)", ...borderStyle }}>
        <div className="border-b px-4 py-4" style={borderStyle}>
          <button onClick={() => setShowNew(true)} className="gl-btn-primary w-full !text-[13px] !py-2 !px-4">
            + New policy
          </button>
        </div>
        <div className="p-3 space-y-1.5">
          {loading && <p className="px-2 py-4 text-[13px] text-white/40">Loading...</p>}
          {!loading && policies.length === 0 && (
            <p className="px-2 py-4 text-[13px] text-white/40">No policies yet. Create one above.</p>
          )}
          {!loading && policies.map((p) => (
            <button
              key={p.id}
              onClick={() => { setSelected(p); setEditing(false); }}
              className="w-full rounded-[8px] p-3 text-left transition hover:bg-white/[0.04]"
              style={selected?.id === p.id ? { background: "oklch(1 0 0 / 0.06)", border: "1px solid oklch(1 0 0 / 0.10)" } : undefined}
            >
              <span className={`text-[16px] font-[500] ${selected?.id === p.id ? "text-white" : "text-white/70"}`}>
                {p.name}
              </span>
              <p className="mt-1 text-[12px] leading-snug text-white/40">{p.description || "No description."}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Policy detail */}
      {selected ? (
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[22px] tracking-[-0.02em] text-white">{selected.name}</h2>
              <p className="text-[13px] text-white/40">Updated {formatDate(selected.updated_at)}</p>
            </div>
            <div className="flex gap-2">
              {editing ? (
                <>
                  <button onClick={() => { setEditing(false); setSaveError(null); }} className="rounded-[6px] px-4 py-2 text-[13px] font-[500] text-white/70 transition hover:bg-white/[0.04] hover:text-white" style={{ border: "1px solid oklch(1 0 0 / 0.12)" }}>
                    Cancel
                  </button>
                  <button onClick={handleSave} disabled={saving} className="gl-btn-primary !text-[13px] !py-2 !px-4 disabled:opacity-60">
                    {saving ? "Saving..." : "Save changes"}
                  </button>
                </>
              ) : (
                <button onClick={startEditing} className="rounded-[6px] px-4 py-2 text-[13px] font-[500] text-white/70 transition hover:bg-white/[0.04] hover:text-white" style={{ border: "1px solid oklch(1 0 0 / 0.12)" }}>
                  Edit
                </button>
              )}
            </div>
          </div>

          {saveError && (
            <div className="rounded-[6px] px-4 py-3" style={{ background: "oklch(0.72 0.18 35 / 0.10)", border: "1px solid oklch(0.72 0.18 35 / 0.40)" }}>
              <p className="text-[13px]" style={{ color: "oklch(0.72 0.18 35)" }}>{saveError}</p>
            </div>
          )}

          {/* Spend limits */}
          <div className="rounded-[10px] overflow-hidden" style={card}>
            <div className="border-b px-5 py-3.5" style={borderStyle}>
              <h3 className="text-[16px] font-[500] text-white">Spend limits</h3>
              <p className="text-[12px] text-white/40">Enforced on-chain before any transaction fires.</p>
            </div>
            <div>
              {PARAM_ROWS.map((row, i) => {
                const val = selected[row.key];
                return (
                  <div key={row.key} className={`flex items-center justify-between px-5 py-4 ${i !== PARAM_ROWS.length - 1 ? "border-b" : ""}`} style={i !== PARAM_ROWS.length - 1 ? { borderColor: "oklch(1 0 0 / 0.06)" } : undefined}>
                    <span className="text-[13px] text-white/50">{row.label}</span>
                    {editing ? (
                      <input
                        value={editValues[row.key] ?? String(val)}
                        onChange={(e) => setEditValues((v) => ({ ...v, [row.key]: e.target.value }))}
                        className="w-32 rounded-[6px] px-2.5 py-1 font-mono text-[13px] text-right text-white outline-none"
                        style={inputStyle}
                      />
                    ) : (
                      <span className="font-mono text-[16px] font-[500] text-white">
                        {row.prefix}{String(val)}{row.suffix}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Allowed recipients */}
          <div className="rounded-[10px] p-5" style={card}>
            <h3 className="text-[16px] font-[500] text-white mb-1">Allowed recipients</h3>
            <p className="text-[12px] text-white/40 mb-4">
              {selected.allowed_recipients.length > 0
                ? "Only these addresses or domains can receive payments from this policy."
                : "No allowlist set. All non-blocked recipients are payable."}
            </p>
            <div className="flex flex-wrap gap-2">
              {selected.allowed_recipients.map((r) => (
                <span key={r} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-[12px] text-white/70" style={{ background: "oklch(1 0 0 / 0.06)", border: "1px solid oklch(1 0 0 / 0.10)" }}>{r}</span>
              ))}
              {selected.allowed_recipients.length === 0 && (
                <span className="text-[13px] text-white/30 italic">No allowlist configured</span>
              )}
            </div>
          </div>

          {/* Blocked categories */}
          <div className="rounded-[10px] p-5" style={card}>
            <h3 className="text-[16px] font-[500] text-white mb-1">Blocked categories</h3>
            <p className="text-[12px] text-white/40 mb-4">Transaction types that will be blocked regardless of amount.</p>
            <div className="flex flex-wrap gap-2">
              {selected.blocked_categories.length > 0
                ? selected.blocked_categories.map((c) => (
                    <span key={c} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-[12px] font-[500]" style={{ background: "oklch(0.72 0.18 35 / 0.10)", color: "oklch(0.72 0.18 35)" }}>{c}</span>
                  ))
                : <span className="text-[13px] text-white/30 italic">No blocked categories</span>
              }
            </div>
          </div>

          {/* Expiry & co-sign */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-[10px] p-5" style={card}>
              <h3 className="text-[13px] font-[500] text-white/40 uppercase tracking-widest mb-2">Policy expiry</h3>
              {selected.expiry
                ? <p className="font-mono text-[16px] font-[500]" style={{ color: "oklch(0.72 0.18 35)" }}>{selected.expiry}</p>
                : <p className="font-mono text-[16px] font-[500] text-white">No expiry</p>
              }
              <p className="mt-1 text-[12px] text-white/40">Wallet freezes at expiry timestamp.</p>
            </div>
            <div className="rounded-[10px] p-5" style={card}>
              <h3 className="text-[13px] font-[500] text-white/40 uppercase tracking-widest mb-2">Co-sign threshold</h3>
              <p className="font-mono text-[16px] font-[500] text-white">${selected.require_co_sign} USDG</p>
              <p className="mt-1 text-[12px] text-white/40">2-of-2 MPC required above this amount.</p>
            </div>
          </div>
        </div>
      ) : (
        !loading && (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <p className="text-[16px] font-[500] text-white">No policies yet</p>
              <p className="mt-1 text-[13px] text-white/40">Create a policy to control agent spending.</p>
              <button onClick={() => setShowNew(true)} className="gl-btn-primary mt-6 !text-[13px] !py-2 !px-4">+ New policy</button>
            </div>
          </div>
        )
      )}

      {/* New policy modal */}
      <Modal open={showNew} onClose={() => { setShowNew(false); setCreateError(null); }} className="max-w-[480px] max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b px-6 py-4 sticky top-0 z-10" style={{ background: "oklch(0.245 0.018 244)", ...borderStyle }}>
          <h3 className="text-[16px] font-[500] text-white">Create policy</h3>
          <button onClick={() => { setShowNew(false); setCreateError(null); }} className="text-white/40 hover:text-white transition-colors">
            <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleCreate} className="p-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-[12px] font-[500] text-white/70">Policy name</label>
            <input required placeholder="e.g. High Trust" value={newForm.name} onChange={(e) => setNewForm((f) => ({ ...f, name: e.target.value }))} className={inputClass} style={inputStyle} />
          </div>
          <div>
            <label className="mb-1.5 block text-[12px] font-[500] text-white/70">Description</label>
            <input placeholder="Brief description of this policy" value={newForm.description} onChange={(e) => setNewForm((f) => ({ ...f, description: e.target.value }))} className={inputClass} style={inputStyle} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Max per transaction (USDG)", key: "max_per_tx", placeholder: "25.00" },
              { label: "Max per day (USDG)", key: "max_per_day", placeholder: "500.00" },
              { label: "Max per month (USDG)", key: "max_per_month", placeholder: "5000.00" },
              { label: "Velocity cap (txs/hr)", key: "velocity_cap", placeholder: "50" },
              { label: "Co-sign threshold (USDG)", key: "require_co_sign", placeholder: "500.00" },
            ].map((f) => (
              <div key={f.key}>
                <label className="mb-1.5 block text-[12px] font-[500] text-white/70">{f.label}</label>
                <input type="number" min="0" step="0.01" placeholder={f.placeholder} value={newForm[f.key as keyof typeof newForm] as string} onChange={(e) => setNewForm((fm) => ({ ...fm, [f.key]: e.target.value }))} className={inputClass} style={inputStyle} />
              </div>
            ))}
            <div>
              <label className="mb-1.5 block text-[12px] font-[500] text-white/70">Expiry date (optional)</label>
              <input type="date" value={newForm.expiry} onChange={(e) => setNewForm((f) => ({ ...f, expiry: e.target.value }))} className={inputClass} style={inputStyle} />
            </div>
          </div>
          <div>
            <label className="mb-2 block text-[12px] font-[500] text-white/70">Blocked categories</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_OPTIONS.map((cat) => {
                const active = newForm.blocked_categories.includes(cat);
                return (
                  <button key={cat} type="button" onClick={() => toggleCategory(cat)}
                    className="rounded-full px-3 py-1 font-mono text-[12px] font-[500] transition"
                    style={active
                      ? { background: "oklch(0.72 0.18 35 / 0.15)", color: "oklch(0.72 0.18 35)" }
                      : { border: "1px solid oklch(1 0 0 / 0.12)", color: "rgba(0,0,0,0.5)" }
                    }
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>
          {createError && (
            <div className="rounded-[6px] px-4 py-3" style={{ background: "oklch(0.72 0.18 35 / 0.10)", border: "1px solid oklch(0.72 0.18 35 / 0.40)" }}>
              <p className="text-[13px]" style={{ color: "oklch(0.72 0.18 35)" }}>{createError}</p>
            </div>
          )}
          <button type="submit" disabled={creating} className="gl-btn-primary w-full !text-[16px] disabled:opacity-60">
            {creating ? "Creating..." : "Create policy"}
          </button>
        </form>
      </Modal>
    </div>
  );
}
