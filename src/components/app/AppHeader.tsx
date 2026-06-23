"use client";

import { usePathname } from "next/navigation";
import { useCredits } from "@/context/CreditsContext";

const TITLES: Record<string, { title: string; description: string }> = {
  "/app":              { title: "Overview",   description: "Network activity and your account at a glance." },
  "/app/chat":         { title: "Chat",       description: "Private inference with no logs, no filters." },
  "/app/earn":         { title: "Earn",       description: "Share your GPU and earn USDG per completed job." },
  "/app/jobs":         { title: "Jobs",       description: "Every inference job you have submitted on-chain." },
  "/app/settings":     { title: "Settings",   description: "Account, API keys, and credit management." },
  "/app/wallets":      { title: "Wallets",    description: "All agent wallets in your organisation." },
  "/app/transactions": { title: "Transactions", description: "On-chain transaction history." },
  "/app/policies":     { title: "Policies",   description: "Spending rules applied to your agent wallets." },
};

export function AppHeader() {
  const pathname = usePathname();
  const meta = TITLES[pathname] ?? { title: "", description: "" };
  const { credits, loading } = useCredits();

  return (
    <header className="flex h-[52px] shrink-0 items-center justify-between px-2">

      <div>
        <h1 className="text-[15px] font-[500] text-white">{meta.title}</h1>
        <p className="text-[12px] text-white/35">{meta.description}</p>
      </div>

      <div className="flex items-center gap-3">
        {/* Credits pill */}
        <div
          className="flex items-center gap-2 rounded-full px-3 py-1.5"
          style={{ border: "1px solid oklch(1 0 0 / 0.10)", background: "oklch(1 0 0 / 0.05)" }}
        >
          <span className="font-mono text-[13px] font-[500] text-white/80">
            {loading ? "-" : `${credits.toLocaleString()} credits`}
          </span>
        </div>

        {/* Notification bell */}
        <button
          type="button"
          aria-label="Notifications"
          className="relative flex h-8 w-8 items-center justify-center rounded-[6px] text-white/30 transition hover:bg-white/[0.06] hover:text-white/70"
        >
          <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
            <path d="M10 2a5 5 0 0 1 5 5v2l1.5 3H3.5L5 9V7a5 5 0 0 1 5-5z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
            <path d="M8 16a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.6" />
          </svg>
        </button>

        {/* Avatar */}
        <div
          className="flex h-8 w-8 items-center justify-center rounded-full"
          style={{ background: "var(--gold)" }}
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" style={{ color: "var(--surface-dark)" }}>
            <path d="M10 10a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" />
            <path d="M3 17c0-3.314 3.134-6 7-6s7 2.686 7 6H3z" />
          </svg>
        </div>
      </div>
    </header>
  );
}
