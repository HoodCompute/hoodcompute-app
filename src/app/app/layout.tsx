import type { Metadata } from "next";
import { AppSidebar } from "@/components/app/AppSidebar";
import { AppHeader } from "@/components/app/AppHeader";
import { BalanceProvider } from "@/context/BalanceContext";
import { CreditsProvider } from "@/context/CreditsContext";

export const metadata: Metadata = {
  title: "HoodCompute",
  description: "Decentralized AI compute on Robinhood Chain.",
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <BalanceProvider>
      <CreditsProvider>
        <div
          className="dark flex h-screen gap-3 overflow-hidden p-3 [&_h1]:font-sans [&_h2]:font-sans [&_h3]:font-sans [&_h4]:font-sans [&_h5]:font-sans [&_h6]:font-sans"
          style={{ background: "oklch(0.165 0.015 245)" }}
        >
          <AppSidebar />
          <div className="flex flex-1 flex-col gap-3 overflow-hidden">
            <AppHeader />
            <main
              className="flex-1 overflow-hidden rounded-2xl border"
              style={{
                background: "var(--surface-dark)",
                borderColor: "oklch(1 0 0 / 0.08)",
                boxShadow: "0 1px 3px oklch(0 0 0 / 0.35)",
              }}
            >
              <div className="h-full overflow-y-auto">{children}</div>
            </main>
          </div>
        </div>
      </CreditsProvider>
    </BalanceProvider>
  );
}
