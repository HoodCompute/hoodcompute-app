import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

export function HoodComputeLogo({ className = "h-8 w-8", ...props }: IconProps & { className?: string }) {
  return (
    <svg
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
      {...props}
    >
      <path d="M18 32.86 24.62 12.5h-13.24L18 32.86Z" fill="#E24329" />
      <path d="M18 32.86 11.38 12.5H2.11L18 32.86Z" fill="#FC6D26" />
      <path
        d="M2.11 12.5.6 17.16a1.27 1.27 0 0 0 .46 1.42L18 32.86 2.11 12.5Z"
        fill="#FCA326"
      />
      <path
        d="M2.11 12.5h9.27L7.4 2.27a.65.65 0 0 0-1.23 0L2.11 12.5Z"
        fill="#E24329"
      />
      <path d="M18 32.86 24.62 12.5h9.27L18 32.86Z" fill="#FC6D26" />
      <path
        d="M33.89 12.5 35.4 17.16a1.27 1.27 0 0 1-.46 1.42L18 32.86 33.89 12.5Z"
        fill="#FCA326"
      />
      <path
        d="M33.89 12.5h-9.27L28.6 2.27a.65.65 0 0 1 1.23 0L33.89 12.5Z"
        fill="#E24329"
      />
    </svg>
  );
}

export function HoodComputeWordmark({ className = "h-7 w-auto" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <HoodComputeLogo className="h-7 w-7" />
      <span className="text-2xl font-[660] tracking-tight">
        HoodCompute<sup className="text-xs font-normal align-super">®</sup>
      </span>
    </span>
  );
}

export function ChevronRight(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="m9 6 6 6-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ChevronLeft(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="m15 6-6 6 6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ChevronDown(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="m6 9 6 6 6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path
        d="m20 20-3.5-3.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function PlayIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

export function GlobeIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  );
}

export function XLogo(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M18.244 2H21.5l-7.46 8.523L23 22h-7.04l-5.51-7.196L4.16 22H.9l7.98-9.115L1 2h7.22l4.98 6.586L18.244 2Zm-2.46 18.04h1.95L7.31 3.86H5.22l10.564 16.18Z" />
    </svg>
  );
}

export function FacebookLogo(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M22 12.06C22 6.51 17.52 2 12 2S2 6.51 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.51 1.49-3.9 3.77-3.9 1.09 0 2.24.2 2.24.2v2.47h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.45 2.91h-2.33V22c4.78-.76 8.44-4.92 8.44-9.94Z" />
    </svg>
  );
}

export function YouTubeLogo(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M23.5 7.2a3 3 0 0 0-2.1-2.13C19.6 4.6 12 4.6 12 4.6s-7.6 0-9.4.47A3 3 0 0 0 .5 7.2 31.7 31.7 0 0 0 0 12.5a31.7 31.7 0 0 0 .5 5.3 3 3 0 0 0 2.1 2.13c1.8.47 9.4.47 9.4.47s7.6 0 9.4-.47a3 3 0 0 0 2.1-2.13c.34-1.74.5-3.51.5-5.3 0-1.79-.16-3.56-.5-5.3ZM9.6 15.83V9.17l6.4 3.33-6.4 3.33Z" />
    </svg>
  );
}

export function LinkedInLogo(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.36V9h3.41v1.56h.05c.47-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12Zm1.78 13.02H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.55C0 23.23.79 24 1.77 24h20.46c.97 0 1.77-.77 1.77-1.72V1.73C24 .77 23.2 0 22.22 0Z" />
    </svg>
  );
}

/* Industry icons (orange line-art). All 24x24. */
export function IndustryFinancialIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 3v18M3 12h18" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

export function IndustryPublicSectorIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <circle cx="12" cy="9" r="6" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="m9 14-2 7 5-3 5 3-2-7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IndustryTelecomIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <rect
        x="3"
        y="4"
        width="18"
        height="13"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M8 21h8M12 17v4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IndustryAutomotiveIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M4 14h16l-1.6-4.7A2 2 0 0 0 16.5 8h-9a2 2 0 0 0-1.9 1.3L4 14Zm0 0v4h2v-2h12v2h2v-4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="7.5" cy="14.5" r="1.4" fill="currentColor" />
      <circle cx="16.5" cy="14.5" r="1.4" fill="currentColor" />
    </svg>
  );
}

export function IndustryEducationIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M5 5h12a3 3 0 0 1 3 3v12H8a3 3 0 0 1-3-3V5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M5 17a3 3 0 0 1 3-3h12" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

export function IndustryAerospaceIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M3 12 21 4l-2 9-7 1-2 6-2-4-5-4Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SparkleIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="m12 3 2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function PlatformIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M3 14h18l-3 6H6l-3-6Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M5 11h14M7 8h10"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ShieldIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}
