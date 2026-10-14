import Link from "next/link";
import type { ReactNode } from "react";
import type { EntryKind } from "@/db/schema";
import { Flower } from "./icons";

/** "Poema" / "Nota" label with its flower, at the top of each card. */
export function KindTag({ kind }: { kind: EntryKind }) {
  return kind === "poem" ? (
    <span className="flex items-center gap-1.5 font-hand text-[20px] leading-tight font-semibold text-wine">
      <Flower kind="poem" tone="deep" center="#f4eee3" size={14} />
      Poema
    </span>
  ) : (
    <span className="flex items-center gap-1.5 font-hand text-[20px] leading-tight font-semibold text-note-accent">
      <Flower kind="note" tone="deep" center="#f3e9cf" size={14} />
      Nota
    </span>
  );
}

const POEM_CARD = "paper flex flex-col gap-1 px-5 pt-[18px] pb-4";
const NOTE_CARD = "note-paper flex flex-col gap-1.5 px-5 pt-4 pb-[18px]";

/** Reading mode: the whole card opens the poem. */
export function PoemCardLink({
  id,
  title,
  firstLine,
}: {
  id: string;
  title: string;
  firstLine: string;
}) {
  return (
    <Link href={`/poem/${id}`} className={`${POEM_CARD} text-ink`}>
      <KindTag kind="poem" />
      <span className="text-[26px] leading-[1.15] font-semibold text-ink-title">
        {title}
      </span>
      <span className="truncate text-[18px] text-ink-soft italic">{firstLine}</span>
      <span className="self-end text-[17px] font-semibold text-wine">
        Leer <span aria-hidden="true">→</span>
      </span>
    </Link>
  );
}

/** Notes are read right on the card, in full. */
export function NoteBody({ title, body }: { title: string | null; body: string }) {
  return (
    <>
      {title && (
        <h2 className="text-[22px] leading-[1.2] font-semibold text-note-ink">{title}</h2>
      )}
      <p className="text-[18px] leading-normal whitespace-pre-line text-note-ink">
        {body}
      </p>
    </>
  );
}

export function NoteCard({
  title,
  body,
  children,
  className = "",
}: {
  title: string | null;
  body: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <article className={`${NOTE_CARD} ${className}`}>
      <KindTag kind="note" />
      <NoteBody title={title} body={body} />
      {children}
    </article>
  );
}

export const CARD_CLASS = { poem: POEM_CARD, note: NOTE_CARD } as const;
