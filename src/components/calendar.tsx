import Link from "next/link";
import type { EntryKind } from "@/db/schema";
import { addMonths, monthOf, monthTitle, shortDate, weeksOfMonth } from "@/lib/dates";
import {
  countLabel,
  describeCounts,
  emptyCounts,
  ENTRY_KINDS,
  totalCount,
  type KindCounts,
} from "@/lib/kinds";
import type { Mode } from "@/lib/session";
import { Flower } from "./icons";

const WEEKDAYS = [
  { short: "L", medium: "Lun", long: "lunes" },
  { short: "M", medium: "Mar", long: "martes" },
  { short: "X", medium: "Mié", long: "miércoles" },
  { short: "J", medium: "Jue", long: "jueves" },
  { short: "V", medium: "Vie", long: "viernes" },
  { short: "S", medium: "Sáb", long: "sábado" },
  { short: "D", medium: "Dom", long: "domingo" },
];

const NO_ENTRIES = emptyCounts();

const LEGEND: Record<EntryKind, string> = {
  poem: "poema",
  note: "nota",
  song: "canción",
};

const monthHref = (month: string, currentMonth: string) =>
  month === currentMonth ? "/" : `/?month=${month}`;

/** The month grid. Phone sizes by default, larger cells on desktop. */
export function Calendar({
  month,
  counts,
  todayDate,
  mode,
  selectedDate,
  className = "",
}: {
  month: string;
  counts: Record<string, KindCounts>;
  todayDate: string;
  mode: Mode;
  /** The day shown next to the calendar on desktop. */
  selectedDate?: string;
  className?: string;
}) {
  const currentMonth = monthOf(todayDate);
  const previous = addMonths(month, -1);
  const next = addMonths(month, 1);

  const totals = emptyCounts();
  for (const day of Object.values(counts)) {
    for (const kind of ENTRY_KINDS) totals[kind] += day[kind];
  }
  // "14 poemas · 5 notas · 6 canciones": poems always, the rest when there are any.
  const summary = ENTRY_KINDS.filter((kind) => kind === "poem" || totals[kind] > 0)
    .map((kind) => countLabel(kind, totals[kind]))
    .join(" · ");

  const navButton =
    "flex size-[44px] items-center justify-center rounded-full border border-soft-border text-[22px]";

  return (
    <section aria-labelledby="month-title" className={className}>
      <div className="flex items-center justify-between">
        <Link
          href={monthHref(previous, currentMonth)}
          className={`${navButton} hover:bg-light/8`}
          aria-label={`Mes anterior: ${monthTitle(previous)}`}
        >
          <span aria-hidden="true">‹</span>
        </Link>
        <h2
          id="month-title"
          className="font-hand text-[34px] leading-none font-semibold lg:text-[42px]"
        >
          {monthTitle(month)}
        </h2>
        {month >= currentMonth ? (
          <button
            type="button"
            disabled
            className={`${navButton} cursor-not-allowed opacity-35`}
            aria-label="Mes siguiente (no disponible)"
          >
            <span aria-hidden="true">›</span>
          </button>
        ) : (
          <Link
            href={monthHref(next, currentMonth)}
            className={`${navButton} hover:bg-light/8`}
            aria-label={`Mes siguiente: ${monthTitle(next)}`}
          >
            <span aria-hidden="true">›</span>
          </Link>
        )}
      </div>

      <div
        className="mt-6 grid grid-cols-7 gap-[6px] lg:mt-3.5 lg:gap-2"
        aria-hidden="true"
      >
        {WEEKDAYS.map((d) => (
          <abbr
            key={d.short}
            title={d.long}
            className="text-center text-[13px] text-secondary no-underline lg:text-[14px] lg:tracking-[0.14em] lg:uppercase"
          >
            <span className="lg:hidden">{d.short}</span>
            <span className="hidden lg:inline">{d.medium}</span>
          </abbr>
        ))}
      </div>

      <ol
        className="mt-2 grid grid-cols-7 gap-[6px] lg:mt-3.5 lg:gap-2"
        aria-label={`Días de ${monthTitle(month)}`}
      >
        {weeksOfMonth(month)
          .flat()
          .map((date, i) => (
            <li key={date ?? `empty-${i}`}>
              {date && (
                <DayCell
                  date={date}
                  counts={counts[date] ?? NO_ENTRIES}
                  todayDate={todayDate}
                  mode={mode}
                  selected={date === selectedDate}
                />
              )}
            </li>
          ))}
      </ol>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-x-3.5 gap-y-2 text-[16px] text-secondary lg:mt-3.5 lg:text-[17px]">
        <span className="flex flex-wrap items-center gap-x-3.5 gap-y-1 lg:gap-x-[18px]">
          {ENTRY_KINDS.map((kind) => (
            <span key={kind} className="inline-flex items-center gap-1.5">
              <Flower kind={kind} size={14} className="lg:size-[15px]" /> {LEGEND[kind]}
            </span>
          ))}
          {mode === "write" && (
            <span className="hidden items-center gap-1.5 lg:inline-flex">
              <span
                aria-hidden="true"
                className="size-[15px] rounded-[4px] border border-dashed border-light/40"
              />
              sin escribir
            </span>
          )}
        </span>
        <span className="italic">{summary}</span>
      </div>
    </section>
  );
}

const CELL_BASE =
  "flex h-[62px] flex-col items-center gap-[5px] rounded-[10px] pt-[7px] text-[18px] leading-none lg:h-[88px] lg:gap-3 lg:rounded-xl lg:pt-3.5 lg:text-[22px]";

/**
 * One flower per kind the day has, however many entries there are: three songs
 * show one lilac flower. The exact counts are in the cell's label and on the day.
 */
function CellFlowers({ counts }: { counts: KindCounts }) {
  return (
    <span className="inline-flex items-center gap-px lg:gap-0.5" aria-hidden="true">
      {ENTRY_KINDS.filter((kind) => counts[kind] > 0).map((kind) => (
        <Flower key={kind} kind={kind} className="lg:size-[15px]" />
      ))}
    </span>
  );
}

function DayCell({
  date,
  counts,
  todayDate,
  mode,
  selected,
}: {
  date: string;
  counts: KindCounts;
  todayDate: string;
  mode: Mode;
  selected: boolean;
}) {
  const day = Number(date.slice(8));
  const isToday = date === todayDate;
  const dayLabel = `${shortDate(date)}${isToday ? ", hoy" : ""}`;
  const total = totalCount(counts);
  // The day open next to the calendar (desktop) gets a soft ring unless it's today,
  // which is already framed.
  const current = selected ? "page" : isToday ? "date" : undefined;
  const ring = selected && !isToday ? "ring-1 ring-light/50 ring-inset" : "";

  if (date > todayDate) {
    return (
      <div
        role="img"
        aria-label={`${dayLabel}: aún no llega`}
        className={`${CELL_BASE} opacity-25`}
      >
        {day}
      </div>
    );
  }

  if (total > 0) {
    return (
      <Link
        href={`/day/${date}`}
        aria-label={`${dayLabel}: ${describeCounts(counts)}`}
        aria-current={current}
        className={`${CELL_BASE} ${ring} ${
          isToday
            ? "border border-pink bg-pink/14 font-semibold text-white"
            : "bg-light/7 hover:bg-light/12"
        }`}
      >
        <span>{day}</span>
        <CellFlowers counts={counts} />
      </Link>
    );
  }

  const todayClass = isToday
    ? "border border-pink font-semibold text-white"
    : "text-muted";

  if (mode === "write") {
    return (
      <Link
        href={`/write?date=${date}`}
        aria-label={`${dayLabel}: sin entradas. Escribir algo`}
        aria-current={current}
        className={`${CELL_BASE} ${todayClass} ${ring} ${
          isToday ? "" : "border border-dashed border-light/25"
        } hover:bg-light/7`}
      >
        <span>{day}</span>
        <span className="text-[15px] text-secondary lg:text-[18px]" aria-hidden="true">
          +
        </span>
      </Link>
    );
  }

  return (
    <div
      role="img"
      aria-label={`${dayLabel}: sin entradas`}
      className={`${CELL_BASE} ${todayClass} ${ring}`}
    >
      {day}
    </div>
  );
}
