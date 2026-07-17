// A small, consistent line-icon set — 24x24, medium stroke weight, no fills,
// rounded caps/joins. Mirrors the minimalist school-icon reference style.
// Every icon accepts `className` so callers control size/color via Tailwind.

import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function Base({ children, ...props }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {children}
    </svg>
  );
}

export function IconClock(props: IconProps) {
  return <Base {...props}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Base>;
}

export function IconPalette(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 3a9 9 0 1 0 3.2 17.4c.9-.34 1-1.56.2-2.1a1.6 1.6 0 0 1 .9-2.9H17.5A3.5 3.5 0 0 0 21 12c0-5-4-9-9-9Z" />
      <circle cx="7.5" cy="10.5" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="10.2" cy="6.8" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="14.8" cy="7" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="17" cy="10.8" r="1.1" fill="currentColor" stroke="none" />
    </Base>
  );
}

export function IconLaptop(props: IconProps) {
  return <Base {...props}><rect x="3.5" y="4.5" width="17" height="11.5" rx="1.3" /><path d="M2 19h20" /></Base>;
}

export function IconCubes(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="3.5" y="10.5" width="7" height="7" rx="1" />
      <rect x="13.5" y="10.5" width="7" height="7" rx="1" />
      <rect x="8.5" y="3" width="7" height="7" rx="1" />
    </Base>
  );
}

export function IconGraduationCap(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 3 2 8l10 5 10-5-10-5Z" />
      <path d="M6 10.5V16c0 1.5 2.5 3 6 3s6-1.5 6-3v-5.5" />
      <path d="M22 8v6" />
    </Base>
  );
}

export function IconBook(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 5.2c-1.5-1-4-1.4-6-1.1C4.8 4.3 4 5 4 5.9v12c0 .8.8 1.3 1.6 1.1 1.9-.4 4.3 0 6.4.9 2-.9 4.5-1.3 6.4-.9.8.2 1.6-.3 1.6-1.1v-12c0-.9-.8-1.6-2-1.8-2-.3-4.5.1-6 1.1Z" />
      <path d="M12 5.2v14.7" />
    </Base>
  );
}

export function IconTestTube(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M9 2v13.2a3 3 0 0 0 6 0V2" />
      <path d="M7 2h10" />
      <path d="M9.5 12.5h5" />
    </Base>
  );
}

export function IconAtom(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <ellipse cx="12" cy="12" rx="9" ry="3.6" />
      <ellipse cx="12" cy="12" rx="9" ry="3.6" transform="rotate(60 12 12)" />
      <ellipse cx="12" cy="12" rx="9" ry="3.6" transform="rotate(120 12 12)" />
    </Base>
  );
}

export function IconGlobe(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3c2.4 2.5 3.7 6 3.7 9s-1.3 6.5-3.7 9c-2.4-2.5-3.7-6-3.7-9S9.6 5.5 12 3Z" />
    </Base>
  );
}

export function IconHeart(props: IconProps) {
  return <Base {...props}><path d="M12 20s-7-4.3-9.5-8.9C1 7.6 2.6 4 6 4c2 0 3.5 1.2 4 2.5C10.5 5.2 12 4 14 4c3.4 0 5 3.6 3.5 7.1C15 15.7 12 20 12 20Z" /></Base>;
}

export function IconWrench(props: IconProps) {
  return <Base {...props}><path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.8 2.8-2-2 2.8-2.8Z" /></Base>;
}

export function IconMusicNote(props: IconProps) {
  return <Base {...props}><path d="M9 18V5l11-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="17" cy="16" r="3" /></Base>;
}

export function IconCamera(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" />
      <circle cx="12" cy="13" r="3.4" />
    </Base>
  );
}

export function IconPencil(props: IconProps) {
  return <Base {...props}><path d="m14.5 4.5 5 5L8 21l-5.5 1L4 16.5 14.5 4.5Z" /><path d="m13 6 5 5" /></Base>;
}

export function IconVase(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M9 3h6l-1 4c1.8 1 3 3 3 5.5A5.5 5.5 0 0 1 11.5 18 5.5 5.5 0 0 1 6 12.5c0-2.5 1.2-4.5 3-5.5L9 3Z" />
      <path d="M8.5 21h7" />
      <path d="M9.7 18l-.4 3" />
      <path d="M14.3 18l.4 3" />
    </Base>
  );
}

export function IconMedal(props: IconProps) {
  return <Base {...props}><circle cx="12" cy="15" r="5.5" /><path d="m9 4-2 6 5 3 5-3-2-6" /></Base>;
}

export function IconUsers(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <circle cx="17.5" cy="9" r="2.3" />
      <path d="M15.8 14.3c2.4.5 4.2 2.6 4.2 5.2" />
    </Base>
  );
}

export function IconPersonCheck(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="10" cy="8" r="3.2" />
      <path d="M3.5 20c0-3.4 2.9-6 6.5-6" />
      <path d="m14 16 2.3 2.3L21 13.5" />
    </Base>
  );
}

export function IconRefresh(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
      <path d="M21 4v4h-4" />
      <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
      <path d="M3 20v-4h4" />
    </Base>
  );
}

export function IconStar(props: IconProps) {
  return <Base {...props}><path d="m12 3 2.6 5.8 6.4.6-4.8 4.3 1.4 6.3L12 16.9 6.4 20l1.4-6.3L3 9.4l6.4-.6L12 3Z" /></Base>;
}

export function IconBrain(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M9 4a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 2 5h1a3 3 0 0 0 3-3V6a2 2 0 0 0-1-2Z" />
      <path d="M15 4a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-2 5h-1a3 3 0 0 1-3-3V6a2 2 0 0 1 1-2Z" />
    </Base>
  );
}

export function IconChatBubble(props: IconProps) {
  return <Base {...props}><path d="M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9l-4 4v-4H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" /></Base>;
}

export function IconShieldCheck(props: IconProps) {
  return <Base {...props}><path d="M12 3 5 6v6c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6l-7-3Z" /><path d="m9 12 2 2 4-4" /></Base>;
}

export function IconDownload(props: IconProps) {
  return <Base {...props}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></Base>;
}

export function IconBookmark(props: IconProps) {
  return <Base {...props}><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></Base>;
}

export function IconMoreHorizontal(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="5" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="19" cy="12" r="1.4" fill="currentColor" stroke="none" />
    </Base>
  );
}

export function IconChevronRight(props: IconProps) {
  return <Base {...props}><path d="m9 6 6 6-6 6" /></Base>;
}

export function IconChevronDown(props: IconProps) {
  return <Base {...props}><path d="m6 9 6 6 6-6" /></Base>;
}

export function IconTrendingUp(props: IconProps) {
  return <Base {...props}><path d="M3 17l6-6 4 4 8-8" /><path d="M15 7h6v6" /></Base>;
}

export function IconFlag(props: IconProps) {
  return <Base {...props}><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" /></Base>;
}

export function IconLightbulb(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M9 18h6" />
      <path d="M10 22h4" />
      <path d="M12 2a7 7 0 0 0-4 12.7c.6.4 1 1.2 1 2.3h6c0-1.1.4-1.9 1-2.3A7 7 0 0 0 12 2Z" />
    </Base>
  );
}
