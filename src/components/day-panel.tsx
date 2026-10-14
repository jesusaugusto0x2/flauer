import Link from "next/link";
import type { Entry } from "@/db/schema";
import { mediumDate, weekday } from "@/lib/dates";
import { countLabel, displayTitle, firstLine } from "@/lib/kinds";
import type { Mode } from "@/lib/session";
import { NoteCard, PoemCardLink } from "./entry-cards";
import { Flower } from "./icons";
import { WriteList } from "./write-list";

/**
 * A day's poems and notes. On phones it is the whole day page; on desktop it
 * sits next to the calendar.
 */
export function DayPanel({
  date,
  entries,
  mode,
  todayDate,
  heading: Heading = "h1",
  backHref,
  className = "",
}: {
  date: string;
  entries: Entry[];
  mode: Mode;
  todayDate: string;
  heading?: "h1" | "h2";
  /** Shown under the empty-day message on phones, where the calendar isn't visible. */
  backHref?: string;
  className?: string;
}) {
  const isToday = date === todayDate;
  const poems = entries.filter((e) => e.kind === "poem").length;
  const notes = entries.length - poems;

  return (
    <section aria-labelledby={`day-${date}`} className={className}>
      <header>
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
            {poems > 0 && (
              <span className="flex items-center gap-1.5 text-pink">
                <Flower kind="poem" size={14} />
                {countLabel("poem", poems)}
              </span>
            )}
            {notes > 0 && (
              <span className="flex items-center gap-1.5 text-gold">
                <Flower kind="note" size={14} />
                {countLabel("note", notes)}
              </span>
            )}
          </p>
        )}
      </header>

      {mode === "write" ? (
        <WriteList
          date={date}
          entries={entries.map((e) => ({
            id: e.id,
            kind: e.kind,
            title: e.kind === "poem" ? displayTitle(e) : e.title,
            firstLine: firstLine(e.body),
            body: e.kind === "note" ? e.body : "",
          }))}
        />
      ) : entries.length === 0 ? (
        <div className="mt-12 text-center lg:mt-8 lg:text-left">
          <p className="text-[19px] text-secondary italic">
            {isToday
              ? "Hoy todavía no florece nada."
              : "Este día no tiene poemas ni notas. Quizá fue un día de silencio."}
          </p>
          {backHref && (
            <Link href={backHref} className="pill mt-8 lg:hidden">
              <span aria-hidden="true">←</span> Volver al calendario
            </Link>
          )}
        </div>
      ) : (
        <ul className="mt-6 flex flex-col gap-3.5 lg:mt-[18px] lg:gap-[18px]">
          {entries.map((e) => (
            <li key={e.id}>
              {e.kind === "poem" ? (
                <PoemCardLink
                  id={e.id}
                  title={displayTitle(e)}
                  firstLine={firstLine(e.body)}
                />
              ) : (
                <NoteCard title={e.title} body={e.body} />
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
