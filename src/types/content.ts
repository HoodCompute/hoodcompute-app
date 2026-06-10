export type NavItem = { label: string; href: string };

export type Logo = {
  name: string;
  src: string;
  alt: string;
  /** Optional intrinsic size, used to set sensible heights in marquees. */
  width?: number;
  height?: number;
};

export type StackingCard = {
  title: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
  image: { src: string; alt: string };
};

export type IndustryItem = {
  iconName:
    | "financial"
    | "publicSector"
    | "telecom"
    | "automotive"
    | "education"
    | "aerospace";
  title: string;
  body: string;
  href: string;
};

export type Quote = {
  text: string;
  author: string;
  role: string;
  avatar?: string;
  companyLogo?: { src: string; alt: string; width?: number; height?: number };
};

export type Stat = {
  value: string;
  label: string;
};

export type FooterColumn = {
  heading: string;
  links: { label: string; href: string }[];
};
