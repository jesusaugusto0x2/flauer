import Link from "next/link";
import type { EntryKind } from "@/db/schema";
import { displayTitle, firstLine, kindLabel } from "@/lib/kinds";
import { Flower } from "./icons";

/** How each kind of entry looks on its own paper. */
export const KIND_THEME: Record<
  EntryKind,
  {
    paper: string;
    paperColor: string;
    /** Kind tag and "Leer →". */
    accent: string;
    title: string;
    text: string;
    soft: string;
    /** Counts and list rows on the night background. */
    onNight: string;
    /** Stroke of the corner flower on the reading sheet. */
    outline: string;
    /** Neutral pill (Editar, No) that reads on this paper. */
    pill: string;
  }
> = {
  poem: {
    paper: "paper",
    paperColor: "#f4eee3",
    accent: "text-wine",
    title: "text-ink-title",
    text: "text-ink",
    soft: "text-ink-soft",
    onNight: "text-pink",
    outline: "#8a3b4c",
    pill: "border-ink/30 text-ink-soft hover:bg-ink/5",
  },
  note: {
    paper: "note-paper",
    paperColor: "#f3e9cf",
    accent: "text-note-accent",
    title: "text-note-ink",
    text: "text-note-ink",
    soft: "text-note-ink-soft",
    onNight: "text-gold",
    outline: "#6e5212",
    pill: "border-note-ink/30 text-note-ink-soft hover:bg-note-ink/5",
  },
  song: {
    paper: "song-paper",
    paperColor: "#ebe7f6",
    accent: "text-song-accent",
    title: "text-song-ink-title",
    text: "text-song-ink",
    soft: "text-song-ink-soft",
    onNight: "text-lilac",
    outline: "#4b3f8f",
    pill: "border-song-ink/30 text-song-ink-soft hover:bg-song-ink/5",
  },
};

/** Card padding and spacing, shared by reading and writing lists. */
export const CARD_LAYOUT = "flex flex-col gap-1 px-5 pt-4 pb-4 lg:px-[22px]";

export type EntrySummary = {
  id: string;
  kind: EntryKind;
  title: string | null;
  body: string;
  artist: string | null;
  spotifyUrl: string | null;
};

/** "Poema" / "Nota" / "Canción" with its flower, at the top of each card. */
export function KindTag({ kind }: { kind: EntryKind }) {
  const theme = KIND_THEME[kind];
  return (
    <span
      className={`flex items-center gap-1.5 font-hand text-[20px] leading-tight font-semibold ${theme.accent}`}
    >
      <Flower kind={kind} tone="deep" center={theme.paperColor} size={14} />
      {kindLabel(kind)}
    </span>
  );
}

/** Opens a song on Spotify (the app on phones that have it) in a new tab. */
export function SpotifyLink({
  url,
  name,
  compact = false,
  className = "",
}: {
  url: string;
  name: string;
  compact?: boolean;
  className?: string;
}) {
  const label = compact ? "Spotify" : "Abrir en Spotify";
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${label}: ${name} (se abre en otra pestaña)`}
      className={`pill min-h-11 border-song-accent bg-song-accent text-white hover:bg-[#3d3375] ${
        compact ? "px-3.5 text-[15px]" : "px-4 text-[16px]"
      } ${className}`}
    >
      {label} <span aria-hidden="true">↗</span>
    </a>
  );
}

/**
 * Stretches a link over its whole card (paper is position: relative), so the
 * card opens like the others while a button raised above it still works. The
 * focus ring goes around the card.
 */
const STRETCHED_LINK =
  "after:absolute after:inset-0 after:rounded-[4px] focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-3 focus-visible:after:outline-pink";

/**
 * Reading mode: a summary that opens the entry's own page. A note is cut at
 * three lines and a song's "why" at two; the page shows them whole.
 */
export function EntryCard({ entry }: { entry: EntrySummary }) {
  const theme = KIND_THEME[entry.kind];

  if (entry.kind === "song") {
    // A link can't hold the Spotify button, so the song's name is the link.
    return (
      <article className={`${theme.paper} ${CARD_LAYOUT}`}>
        <KindTag kind="song" />
        <Link
          href={`/entry/${entry.id}`}
          className={`text-[24px] leading-[1.15] font-semibold lg:text-[25px] ${theme.title} ${STRETCHED_LINK}`}
        >
          {displayTitle(entry)}
        </Link>
        {entry.artist && (
          <p className={`text-[18px] italic ${theme.soft}`}>{entry.artist}</p>
        )}
        {entry.body && (
          <p
            className={`mt-1.5 line-clamp-2 text-[17px] leading-[1.45] whitespace-pre-line ${theme.text}`}
          >
            {entry.body}
          </p>
        )}
        <div className="mt-1.5 flex items-center justify-between gap-3">
          {entry.spotifyUrl && (
            <SpotifyLink
              url={entry.spotifyUrl}
              name={displayTitle(entry)}
              className="relative z-10"
            />
          )}
          <span
            aria-hidden="true"
            className={`ml-auto text-[17px] font-semibold ${theme.accent}`}
          >
            Leer →
          </span>
        </div>
      </article>
    );
  }

  return (
    <Link href={`/entry/${entry.id}`} className={`${theme.paper} ${CARD_LAYOUT}`}>
      <KindTag kind={entry.kind} />
      {entry.kind === "poem" ? (
        <>
          <span
            className={`block text-[26px] leading-[1.15] font-semibold lg:text-[27px] ${theme.title}`}
          >
            {displayTitle(entry)}
          </span>
          <span className={`block truncate text-[18px] italic ${theme.soft}`}>
            {firstLine(entry.body)}
          </span>
        </>
      ) : (
        <>
          {entry.title && (
            <span
              className={`block text-[22px] leading-[1.2] font-semibold ${theme.title}`}
            >
              {entry.title}
            </span>
          )}
          <span
            className={`line-clamp-3 text-[18px] leading-normal whitespace-pre-line ${theme.text}`}
          >
            {entry.body}
          </span>
        </>
      )}
      <span className={`self-end text-[17px] font-semibold ${theme.accent}`}>
        Leer <span aria-hidden="true">→</span>
      </span>
    </Link>
  );
}
