import {
  IndustryFinancialIcon,
  IndustryPublicSectorIcon,
  IndustryTelecomIcon,
  IndustryAutomotiveIcon,
  IndustryEducationIcon,
  IndustryAerospaceIcon,
} from "./icons";
import type { ReactNode } from "react";

type Item = {
  icon: ReactNode;
  title: string;
  body: string;
};

const ITEMS: Item[] = [
  {
    icon: <IndustryFinancialIcon className="h-7 w-7 text-gold" />,
    title: "GPU owners",
    body: "You do not need a data center to take part. Connect a gaming PC, laptop, or workstation through your browser and earn USDG for every job you complete. Run the native worker instead and you can host larger models and earn even more.",
  },
  {
    icon: <IndustryPublicSectorIcon className="h-7 w-7 text-gold" />,
    title: "Developers",
    body: "Point your existing code at HoodCompute by changing a single base URL. You get OpenAI-compatible inference with on-chain billing, no content filters, and no surprise rate limits handed down by a policy team.",
  },
  {
    icon: <IndustryTelecomIcon className="h-7 w-7 text-gold" />,
    title: "Privacy-conscious users",
    body: "Every prompt is encrypted before it leaves your device. There is no account to create, no email to hand over, and no data kept once you are done. You connect a wallet, load credits, and ask what you need.",
  },
  {
    icon: <IndustryAutomotiveIcon className="h-7 w-7 text-gold" />,
    title: "Researchers",
    body: "Run open-weight models for red-teaming, security research, and dataset work without hitting an arbitrary content wall. The protocol stays neutral and the models stay open, so your tools keep up with the work.",
  },
  {
    icon: <IndustryEducationIcon className="h-7 w-7 text-gold" />,
    title: "Creators and writers",
    body: "Draft, script, and experiment without your words becoming training data for someone else's model. Every session is ephemeral by design, so the ideas you put in are still yours when you leave.",
  },
  {
    icon: <IndustryAerospaceIcon className="h-7 w-7 text-gold" />,
    title: "Teams running inference",
    body: "Link an API key to an Ethereum wallet, top it up with USDG, and let the network handle the rest. Every request becomes a verifiable on-chain event, so you can audit exactly what you spent from any explorer.",
  },
];

export function IndustryGrid() {
  return (
    <section
      id="use-cases"
      className="py-16 lg:py-24"
      style={{ background: "var(--surface-dark)" }}
      aria-labelledby="industry-heading"
    >
      <div className="mx-auto max-w-[1168px] px-6">
        <h2
          id="industry-heading"
          className="max-w-[820px] text-[44px] leading-[1.04] tracking-[-0.025em] text-white sm:text-[64px] md:text-[80px] lg:text-[96px] lg:leading-[100px] lg:tracking-[-2.88px]"
        >
          For everyone who uses AI, and everyone who powers it.
        </h2>
        <p className="mt-6 max-w-[640px] text-[18px] leading-[1.6] text-white/50 md:text-[20px]">
          GPU owners share compute and earn USDG, while everyone else reaches private, uncensored AI. It all runs on one network and settles on Robinhood Chain.
        </p>

        <ul className="my-12 grid grid-cols-1 gap-x-8 gap-y-12 md:grid-cols-2 lg:my-16 lg:grid-cols-3">
          {ITEMS.map((item) => (
            <li key={item.title}>
              <div className="flex flex-col gap-4">
                <div>{item.icon}</div>
                <p className="text-[18px] font-[500] text-white">{item.title}</p>
                <p className="text-[16px] leading-[1.6] text-white/50">
                  {item.body}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
