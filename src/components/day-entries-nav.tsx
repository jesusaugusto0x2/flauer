import Link from "next/link";
import type { Entry, EntryKind } from "@/db/schema";
import { shortDate } from "@/lib/dates";
import { displayTitle } from "@/lib/kinds";
import { Flower } from "./icons";

const ROW_STYLE: Record<EntryKind, { color: string; font: string; current: string }> = {
  poem: { color: "text-light", font: "", current: "bg-pink/15" },
  note: { color: "text-gold", font: "italic", current: "bg-gold/15" },
  song: { color: "text-lilac", font: "italic", current: "bg-lilac/15" },
};

/**
 * Desktop side list of a day's entries. Poems and notes open their own page;
 * songs live on their day, so they link to their card there.
 */
export function DayEntriesNav({
  date,
  entries,
  currentId,
  label,
  dense = false,
  className = "",
}: {
  date: string;
  entries: Pick<Entry, "id" | "kind" | "title">[];
  currentId?: string;
  label: string;
  dense?: boolean;
  className?: string;
}) {
  const row = `flex items-center gap-2.5 rounded-md px-3 ${
    dense ? "min-h-11 py-1.5 text-[18px]" : "min-h-12 py-2 text-[19px]"
  }`;

  return (
    <nav aria-label={label} className={className}>
      <ul className="flex flex-col gap-1">
        {entries.map((e) => {
          const style = ROW_STYLE[e.kind];
          const content = (
            <>
              <Flower kind={e.kind} size={14} className="shrink-0" />
              <span className="min-w-0 truncate">{displayTitle(e)}</span>
            </>
          );
          return (
            <li key={e.id}>
              {e.id === currentId ? (
                <span
                  aria-current="page"
                  className={`${row} ${style.current} ${style.font} text-white`}
                >
                  {content}
                </span>
              ) : (
                <Link
                  href={
                    e.kind === "song" ? `/day/${date}#entry-${e.id}` : `/entry/${e.id}`
                  }
                  className={`${row} ${style.color} ${style.font} hover:bg-light/7`}
                >
                  {content}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Top of the desktop side column: back to the calendar, then which day this is. */
export function SideColumnHeader({
  backHref,
  eyebrow,
  date,
}: {
  backHref: string;
  eyebrow: string;
  date: string;
}) {
  return (
    <>
      <Link href={backHref} className="pill shrink-0 self-start px-4">
        <span aria-hidden="true">←</span> Calendario
      </Link>
      <div className="shrink-0">
        <p className="text-[13px] tracking-[0.24em] text-secondary uppercase">
          {eyebrow}
        </p>
        <p className="mt-0.5 font-hand text-[38px] leading-[1.05] font-semibold">
          {shortDate(date)}
        </p>
      </div>
    </>
  );
}
