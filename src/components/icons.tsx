import type { EntryKind } from "@/db/schema";

// Flower colors per entry kind. "light" is for dark backgrounds, "deep" for paper.
const FLOWER_COLORS: Record<EntryKind, { light: string; deep: string }> = {
  poem: { light: "#e9b8c3", deep: "#c25d74" },
  note: { light: "#e6c27a", deep: "#c19a3c" },
  song: { light: "#b9a9f2", deep: "#7e6cc9" },
};

/** One entry = one flower: pink for a poem, gold for a note, lilac for a song. */
export function Flower({
  kind = "poem",
  tone = "light",
  center = "#15142a",
  size = 12,
  className,
}: {
  kind?: EntryKind;
  tone?: "light" | "deep";
  /** Color of the flower's middle; matches the surface it sits on. */
  center?: string;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 12 12"
      width={size}
      height={size}
      aria-hidden="true"
      className={className}
    >
      <g fill={FLOWER_COLORS[kind][tone]}>
        <circle cx="6" cy="3.1" r="2" />
        <circle cx="8.8" cy="5.1" r="2" />
        <circle cx="7.7" cy="8.4" r="2" />
        <circle cx="4.3" cy="8.4" r="2" />
        <circle cx="3.2" cy="5.1" r="2" />
      </g>
      <circle cx="6" cy="6" r="1.3" fill={center} />
    </svg>
  );
}

/** A play triangle, for videos. Takes the text color. */
export function PlayIcon({
  size = 12,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 12 12"
      width={size}
      height={size}
      aria-hidden="true"
      className={className}
    >
      <path
        d="M3.5 1.8v8.4c0 .5.5.8.9.5l6.3-4.2a.6.6 0 0 0 0-1L4.4 1.3c-.4-.3-.9 0-.9.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

/** Line-drawn flower that decorates the corner of the paper. */
export function OutlineFlower({
  className,
  color = "#8a3b4c",
}: {
  className?: string;
  color?: string;
}) {
  return (
    <svg
      viewBox="0 0 92 120"
      width={56}
      height={74}
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M46 44 C40 30 42 18 46 12 C50 18 52 30 46 44 Z" />
      <path d="M46 44 C32 40 24 32 22 24 C30 24 40 30 46 44 Z" />
      <path d="M46 44 C60 40 68 32 70 24 C62 24 52 30 46 44 Z" />
      <path d="M46 44 C36 52 26 54 20 50 C26 44 36 42 46 44 Z" />
      <path d="M46 44 C56 52 66 54 72 50 C66 44 56 42 46 44 Z" />
      <circle cx="46" cy="44" r="3.2" />
      <path d="M46 48 C47 70 44 92 48 116" />
    </svg>
  );
}
