import Link from "next/link";
import type { Entry } from "@/db/schema";
import { mediumDate, weekday } from "@/lib/dates";
import { countLabel, emptyCounts, ENTRY_KINDS } from "@/lib/kinds";
import type { Mode } from "@/lib/session";
import { EntryCard, KIND_THEME, type EntrySummary } from "./entry-cards";
import { Flower } from "./icons";
import { SIDE_COLUMN } from "./side-column";
import { WriteList } from "./write-list";

/**
 * Desktop: the card list scrolls inside a column as tall as the window (minus a
 * margin), which stays in view while the page scrolls. Phones: the page scrolls.
 */
const LIST_SCROLL =
  "lg:-mx-3 lg:min-h-0 lg:flex-1 lg:scroll-area lg:px-3 lg:pt-1 lg:pb-6";

/**
 * A day's poems, notes and songs. On phones it is the whole day page; on desktop
 * it sits next to the calendar.
 */
export function DayPanel({
  date,
  entries,
  mode,
  todayDate,
  heading: Heading = "h1",
  backHref,
  desktopOnly = false,
  className = "",
}: {
  date: string;
  entries: Entry[];
  mode: Mode;
  todayDate: string;
  heading?: "h1" | "h2";
  /** Shown under the empty-day message on phones, where the calendar isn't visible. */
  backHref?: string;
  /** Hidden on phones (the calendar page shows only the month there). */
  desktopOnly?: boolean;
  className?: string;
}) {
  const isToday = date === todayDate;
  const counts = emptyCounts();
  for (const e of entries) counts[e.kind]++;
  const summaries: EntrySummary[] = entries.map((e) => ({
    id: e.id,
    kind: e.kind,
    title: e.title,
    body: e.body,
    artist: e.artist,
    spotifyUrl: e.spotifyUrl,
  }));

  return (
    <section
      aria-labelledby={`day-${date}`}
      className={`${desktopOnly ? "hidden lg:flex" : "flex"} flex-col ${SIDE_COLUMN} ${className}`}
    >
      <header className="shrink-0">
        <p className="text-[13px] tracking-[0.24em] text-secondary uppercase">
          {weekday(date)}
          {isToday && " · hoy"}
        </p>
        <Heading
          id={`day-${date}`}
          className="mt-1 font-hand text-[46px] leading-[1.05] font-semibold"
        >
          {mediumDate(date)}
        </Heading>
        {entries.length > 0 && (
          <p className="mt-1 flex flex-wrap items-center gap-x-3.5 gap-y-1.5 text-[17px]">
            {ENTRY_KINDS.filter((kind) => counts[kind] > 0).map((kind) => (
              <span
                key={kind}
                className={`flex items-center gap-1.5 ${KIND_THEME[kind].onNight}`}
              >
                <Flower kind={kind} size={14} />
                {countLabel(kind, counts[kind])}
              </span>
            ))}
          </p>
        )}
      </header>

      {mode === "write" ? (
        <WriteList date={date} entries={summaries} listClassName={LIST_SCROLL} />
      ) : entries.length === 0 ? (
        <div className="mt-12 text-center lg:mt-8 lg:text-left">
          <p className="text-[19px] text-secondary italic">
            {isToday
              ? "Hoy todavía no florece nada."
              : "Este día no tiene poemas, notas ni canciones. Quizá fue un día de silencio."}
          </p>
          {backHref && (
            <Link href={backHref} className="pill mt-8 lg:hidden">
              <span aria-hidden="true">←</span> Volver al calendario
            </Link>
          )}
        </div>
      ) : (
        <ul
          className={`mt-6 flex flex-col gap-3.5 lg:mt-[18px] lg:gap-[18px] ${LIST_SCROLL}`}
        >
          {summaries.map((e) => (
            <li key={e.id}>
              <EntryCard entry={e} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
