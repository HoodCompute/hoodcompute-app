import Link from "next/link";
import { SparkleIcon, PlatformIcon, ShieldIcon } from "./icons";
import { EarnPreview } from "./stacking-previews/EarnPreview";
import { ChatPreview } from "./stacking-previews/ChatPreview";
import { JobsPreview } from "./stacking-previews/JobsPreview";
import type { ReactNode } from "react";
import type { StackingCard } from "@/types/content";

const CARDS: (Omit<StackingCard, "image"> & { iconSlot: ReactNode; previewSlot: ReactNode })[] = [
  {
    iconSlot: <SparkleIcon className="h-7 w-7 text-gold" />,
    title: "Connect your GPU and start earning USDG.",
    body: "Browser workers join with a single tab open and nothing to install. Native workers run a lightweight daemon and earn more for every job they complete. Either way you are paid in USDG for the inference you handle, and staking $HCOMPUTE raises your share to 85 percent of each job's value.",
    ctaLabel: "Start earning",
    ctaHref: "/app",
    previewSlot: <EarnPreview />,
  },
  {
    iconSlot: <PlatformIcon className="h-7 w-7 text-gold" />,
    title: "Run private inference with no logs and no filters.",
    body: "Your prompts are encrypted before they leave your browser, and workers run the model locally without ever learning who you are. Nothing is stored once the session ends. You choose from a growing set of open-weight models including Llama, Qwen, DeepSeek, and Mistral, and no one applies a content filter to what you ask.",
    ctaLabel: "Try for free",
    ctaHref: "/app",
    previewSlot: <ChatPreview />,
  },
  {
    iconSlot: <ShieldIcon className="h-7 w-7 text-gold" />,
    title: "See every job and every payout on-chain.",
    body: "When you submit a job, the payment is locked on Robinhood Chain before any work begins. The moment the job is verified as complete, the worker is paid automatically. You can check every transaction yourself on Blockscout without taking anything HoodCompute says on trust.",
    ctaLabel: "View the network",
    ctaHref: "/app",
    previewSlot: <JobsPreview />,
  },
];

export function StackingCards() {
  return (
    <section
      id="features"
      className="py-12 lg:py-20"
      style={{ background: "var(--surface-dark)" }}
      aria-label="HoodCompute core capabilities"
    >
      <div className="mx-auto max-w-[1300px] px-6">
        <div className="space-y-6 lg:space-y-8">
          {CARDS.map((card, idx) => (
            <Card key={idx} card={card} />
          ))}
        </div>
      </div>
    </section>
  );
}

function Card({ card }: { card: Omit<StackingCard, "image"> & { iconSlot: ReactNode; previewSlot: ReactNode } }) {
  return (
    <article
      className="overflow-hidden rounded-[16px]"
      style={{
        background: "var(--surface-dark-2)",
        border: "1px solid oklch(1 0 0 / 0.08)",
        boxShadow: "0 1px 4px oklch(0 0 0 / 0.3)",
      }}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2">
        <div className="flex flex-col justify-center p-8 lg:p-12">
          <div className="mb-4">{card.iconSlot}</div>
          <h3 className="mb-6 text-[28px] leading-[1.15] tracking-[-0.02em] text-white md:text-[34px] lg:text-[38px]">
            {card.title}
          </h3>
          <p className="mb-8 text-[16px] leading-[1.65] text-white/50 lg:text-[17px]">
            {card.body}
          </p>
          <div>
            <Link href={card.ctaHref} className="gl-btn-outline-light">
              {card.ctaLabel}
            </Link>
          </div>
        </div>

        <div
          className="relative flex aspect-[4/3] items-stretch justify-stretch overflow-hidden lg:aspect-auto lg:min-h-[491px]"
          style={{ background: "#111" }}
        >
          {card.previewSlot}
        </div>
      </div>
    </article>
  );
}
