import type { SVGProps } from "react";

type IconName =
  | "menu"
  | "close"
  | "arrow"
  | "instagram"
  | "mail"
  | "check"
  | "spark"
  | "heart"
  | "gem"
  | "brush"
  | "nail"
  | "quote";

const PATHS: Record<IconName, { vb?: string; content: React.ReactNode }> = {
  menu: {
    content: (
      <path
        d="M3 6h18M3 12h18M3 18h18"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    ),
  },
  close: {
    content: (
      <path
        d="M6 6l12 12M18 6L6 18"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    ),
  },
  arrow: {
    content: (
      <path
        d="M5 12h14M13 6l6 6-6 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  instagram: {
    content: (
      <g fill="none" stroke="currentColor" strokeWidth="1.6">
        <rect x="3" y="3" width="18" height="18" rx="5.4" />
        <circle cx="12" cy="12" r="4.2" />
        <circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" stroke="none" />
      </g>
    ),
  },
  mail: {
    content: (
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="5" width="18" height="14" rx="3" />
        <path d="M4 7l8 6 8-6" />
      </g>
    ),
  },
  check: {
    content: (
      <path
        d="M5 13l4 4 10-11"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  spark: {
    content: (
      <path
        d="M12 2c.5 4.6 2.4 6.5 7 7-4.6.5-6.5 2.4-7 7-.5-4.6-2.4-6.5-7-7 4.6-.5 6.5-2.4 7-7z"
        fill="currentColor"
      />
    ),
  },
  heart: {
    content: (
      <path
        d="M12 20s-7-4.5-9.3-8.6C1 8.1 2.6 5 5.8 5 8 5 9.4 6.4 12 9.2 14.6 6.4 16 5 18.2 5 21.4 5 23 8.1 21.3 11.4 19 15.5 12 20 12 20z"
        fill="currentColor"
      />
    ),
  },
  gem: {
    content: (
      <g fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
        <path d="M6 3h12l4 6-10 12L2 9z" />
        <path d="M2 9h20M9 3 6 9l6 12 6-12-3-6" />
      </g>
    ),
  },
  brush: {
    content: (
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M15 4l5 5-8.5 8.5a3 3 0 0 1-1.6.8L4 20l1.7-5.4a3 3 0 0 1 .8-1.6z" />
        <path d="M13.5 5.5l5 5" />
      </g>
    ),
  },
  nail: {
    content: (
      <path
        d="M7 4.5C7 3 8.6 2 12 2s5 1 5 2.5c0 1.2-.4 4.3-.9 8.2-.5 3.8-1.1 7.3-4.1 7.3s-3.6-3.5-4.1-7.3C7.4 8.8 7 5.7 7 4.5z"
        fill="currentColor"
      />
    ),
  },
  quote: {
    content: (
      <path
        d="M10 7H6a3 3 0 0 0-3 3v7h7v-7H6c0-1.5 1.5-3 4-3zm11 0h-4a3 3 0 0 0-3 3v7h7v-7h-4c0-1.5 1.5-3 4-3z"
        fill="currentColor"
      />
    ),
  },
};

export function Icon({
  name,
  title,
  ...rest
}: { name: IconName; title?: string } & SVGProps<SVGSVGElement>) {
  const def = PATHS[name];
  return (
    <svg
      viewBox={def.vb ?? "0 0 24 24"}
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      focusable="false"
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      {def.content}
    </svg>
  );
}
