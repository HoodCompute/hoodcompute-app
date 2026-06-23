"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const NAV = [
  {
    label: "Overview",
    href: "/app",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
        <rect x="2" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
        <rect x="11" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
        <rect x="2" y="11" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
        <rect x="11" y="11" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    ),
  },
  {
    label: "Chat",
    href: "/app/chat",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
        <path d="M3 4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H7l-4 3V4z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M7 8h6M7 11h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "Earn",
    href: "/app/earn",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
        <rect x="2" y="6" width="16" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
        <path d="M5 6V5a3 3 0 0 1 6 0v1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="13.5" cy="11" r="1.5" stroke="currentColor" strokeWidth="1.4" />
        <path d="M6 11h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "Jobs",
    href: "/app/jobs",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
        <rect x="3" y="3" width="14" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
        <path d="M7 7h6M7 10h6M7 13h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "Settings",
    href: "/app/settings",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
        <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.6" />
        <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.22 4.22l1.42 1.42M14.36 14.36l1.42 1.42M4.22 15.78l1.42-1.42M14.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/app/login");
    router.refresh();
  }

  return (
    <aside
      className="flex h-full w-[224px] shrink-0 flex-col overflow-hidden rounded-2xl border"
      style={{
        background: "var(--surface-dark-2)",
        borderColor: "oklch(1 0 0 / 0.08)",
        boxShadow: "0 1px 3px oklch(0 0 0 / 0.35)",
      }}
    >
      {/* Logo */}
      <div
        className="flex h-[60px] items-center gap-2.5 border-b px-5"
        style={{ borderColor: "oklch(1 0 0 / 0.08)" }}
      >
        <Image src="/images/logo.png" alt="HoodCompute" width={100} height={100} className="h-10 w-10 object-contain" />
        <span className="text-[24px] font-heading text-white">HoodCompute</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <p className="mb-2 px-2 text-[10px] font-[500] uppercase tracking-widest text-white/25">
          Platform
        </p>
        <ul className="space-y-0.5">
          {NAV.map((item) => {
            const active =
              item.href === "/app"
                ? pathname === "/app"
                : pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-[6px] px-2.5 py-2 text-[14px] transition-colors",
                    active
                      ? "bg-white/[0.08] text-white font-[500]"
                      : "font-[440] text-white/40 hover:bg-white/[0.05] hover:text-white/80"
                  )}
                >
                  <span className={active ? "text-white" : "text-white/35"}>
                    {item.icon}
                  </span>
                  {item.label}
                  {active && (
                    <span className="ml-auto h-1 w-1 rounded-full" style={{ background: "var(--gold)" }} />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Sign out */}
      <div className="p-3" style={{ borderTop: "1px solid oklch(1 0 0 / 0.08)" }}>
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-[6px] px-2.5 py-2 text-[14px] font-[440] text-white/30 transition-colors hover:bg-white/[0.05] hover:text-white/60"
        >
          <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
            <path d="M7 3H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M13 14l3-4-3-4M16 10H8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Sign out
        </button>
      </div>
    </aside>
  );
}
