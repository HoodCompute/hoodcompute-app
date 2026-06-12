import type { CSSProperties } from "react";

type Stat = {
  value: string;
  label: string;
  featured?: boolean;
  compact?: boolean;
};

const STATS: Stat[] = [
  { value: "0", label: "prompts logged or retained", featured: true },
  { value: "98%", label: "of every job paid to the provider" },
  { value: "100%", label: "of payments settled on-chain" },
  { value: "100ms", label: "Robinhood Chain block time" },
  { value: "<$0.01", label: "to settle a job on Robinhood Chain" },
  { value: "real-time", label: "token streaming from worker to user", compact: true },
  { value: "70B+", label: "largest open models on the network" },
];

const dotGrid: CSSProperties = {
  backgroundImage: "radial-gradient(circle, oklch(1 0 0 / 0.05) 1px, transparent 1px)",
  backgroundSize: "22px 22px",
};

export function StatsCarousel() {
  return (
    <section
      className="relative overflow-hidden py-20 lg:py-28"
      aria-labelledby="stats-heading"
      style={{ background: "var(--surface-dark)" }}
    >
      {/* Abstract layers */}
      <div className="pointer-events-none absolute inset-0" style={dotGrid} />
      <div
        className="pointer-events-none absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full opacity-[0.07] blur-3xl"
        style={{ background: "var(--gold)" }}
      />

      {/* Node motif field: scattered graphs at varied scale, rotation, and opacity */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <NodeMotif className="absolute right-6 top-6 hidden h-40 w-64 text-[var(--gold)] opacity-30 lg:block" />
        <NodeMotif
          className="absolute -left-16 top-20 h-36 w-56 text-white opacity-[0.06]"
          style={{ transform: "rotate(-12deg)" }}
        />
        <NodeMotif
          className="absolute left-[38%] -bottom-10 hidden h-44 w-72 text-[var(--gold)] opacity-[0.08] md:block"
          style={{ transform: "rotate(8deg)" }}
        />
        <NodeMotifAlt
          className="absolute -bottom-8 -right-10 h-40 w-64 text-white opacity-[0.07]"
          style={{ transform: "rotate(-6deg)" }}
        />
        <NodeMotifAlt
          className="absolute left-8 top-[46%] hidden h-28 w-44 text-[var(--gold)] opacity-[0.09] lg:block"
          style={{ transform: "rotate(4deg)" }}
        />
        <NodeMotif
          className="absolute right-[30%] top-4 hidden h-24 w-40 text-white opacity-[0.05] xl:block"
          style={{ transform: "rotate(18deg) scale(0.9)" }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-[1200px] px-6">
        <div className="mb-12 lg:mb-16">
          <span className="font-mono text-[12px] uppercase tracking-[0.25em] text-[var(--gold)]">
            Live on Robinhood Chain
          </span>
          <h2
            id="stats-heading"
            className="mt-4 max-w-[820px] text-[40px] leading-[1.02] tracking-[-0.03em] text-white sm:text-[64px] md:text-[80px] lg:text-[92px]"
          >
            Receipts, not promises.
          </h2>
        </div>

        <div className="flex flex-wrap gap-3">
          {STATS.map((stat, i) => (
            <StatCell key={stat.label} stat={stat} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function StatCell({ stat, index }: { stat: Stat; index: number }) {
  const sizing = stat.featured
    ? "min-h-[180px] grow basis-full p-7 lg:basis-[calc(50%-0.75rem)]"
    : "min-h-[150px] grow basis-[calc(50%-0.375rem)] p-6 lg:basis-[220px]";

  return (
    <article
      className={`group relative flex flex-col justify-center overflow-hidden rounded-2xl border border-white/10 transition-all duration-300 hover:border-[var(--gold)]/40 ${sizing}`}
      style={{ background: "var(--surface-dark-2)" }}
    >
      {stat.featured && <div className="pointer-events-none absolute inset-0" style={dotGrid} />}

      <span className="absolute right-5 top-5 font-mono text-[11px] tracking-[0.2em] text-white/20">
        {String(index + 1).padStart(2, "0")}
      </span>
      <span className="absolute right-5 bottom-5 h-1.5 w-1.5 rounded-full bg-white/15 transition-colors duration-300 group-hover:bg-[var(--gold)]" />

      <div className="relative">
        <div
          className={`font-mono leading-[0.95] tracking-[-0.02em] tabular-nums whitespace-nowrap ${
            stat.featured
              ? "text-[72px] text-[var(--gold)] sm:text-[88px] lg:text-[104px]"
              : stat.compact
                ? "text-[26px] text-white sm:text-[30px] lg:text-[32px]"
                : "text-[40px] text-white lg:text-[48px]"
          }`}
        >
          {stat.value}
        </div>
        <p
          className={`mt-3 max-w-[22ch] leading-snug text-white/45 ${
            stat.featured ? "text-[16px] lg:text-[18px]" : "text-[14px] lg:text-[15px]"
          }`}
        >
          {stat.label}
        </p>
      </div>
    </article>
  );
}

function NodeMotif({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 256 160" fill="none" aria-hidden="true">
      <g stroke="currentColor" strokeWidth="1">
        <path d="M32 128 L96 40 L176 96 L232 24" />
        <path d="M96 40 L232 24" />
        <path d="M32 128 L176 96" />
      </g>
      <g fill="currentColor">
        <circle cx="32" cy="128" r="4" />
        <circle cx="96" cy="40" r="5" />
        <circle cx="176" cy="96" r="4" />
        <circle cx="232" cy="24" r="6" />
      </g>
    </svg>
  );
}

function NodeMotifAlt({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 256 160" fill="none" aria-hidden="true">
      <g stroke="currentColor" strokeWidth="1">
        <path d="M24 40 L104 112 L168 32 L240 120" />
        <path d="M24 40 L168 32" />
        <path d="M104 112 L240 120" />
      </g>
      <g fill="currentColor">
        <circle cx="24" cy="40" r="4" />
        <circle cx="104" cy="112" r="6" />
        <circle cx="168" cy="32" r="4" />
        <circle cx="240" cy="120" r="5" />
      </g>
    </svg>
  );
}
