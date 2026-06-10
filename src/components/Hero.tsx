import Link from "next/link";

export function Hero() {
  return (
    <section
      className="homepage-hero pt-20 pb-16 lg:py-52 min-h-[50vh] relative overflow-hidden"
      aria-labelledby="hero-heading"
    >
      <div className="absolute inset-0 scale-110" style={{ backgroundImage: "url('/images/hero.png')", backgroundSize: "cover" }} />
      <div className="absolute inset-0 bg-black/35" />
      <div className="relative z-10 mx-auto max-w-[1200px] px-6">
        <div className="flex flex-col items-start">
          <h1
            id="hero-heading"
            className="max-w-[1100px] text-[44px] leading-[1.05] text-white sm:text-[64px] md:text-[80px] lg:text-[96px] lg:leading-[100px]"
          >
            AI compute, owned by everyone.
          </h1>

          <p className="mt-8 max-w-[800px] text-[20px] leading-[1.65] text-white  md:text-[22px]">
            HoodCompute is an open network for AI inference. Share your GPU and earn USDG for the work it does, or run private, uncensored models with no account and nothing logged. Every payment settles transparently on Robinhood Chain.
            <br/><span className="text-base">$HOODCOMPUTE: </span>
          </p>

          <Link href="/app" className="nav-btn-cta mt-10">
            Get started
          </Link>
        </div>
      </div>
    </section>
  );
}
