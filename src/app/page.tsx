import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { Flower } from "@/components/icons";
import { Loading } from "@/components/loading";
import { ModeSwitch } from "@/components/mode-switch";
import { APP_NAME, APP_SUBTITLE } from "@/lib/config";
import type { EntryKind } from "@/db/schema";
import {
  addMonths,
  isValidMonth,
  monthOf,
  monthTitle,
  shortDate,
  today,
  weeksOfMonth,
} from "@/lib/dates";
import { countByDay, countOnDay } from "@/lib/entries";
import { countLabel, describeCounts, ENTRY_KINDS, type KindCounts } from "@/lib/kinds";
import { currentMode, type Mode } from "@/lib/session";

const WEEKDAYS = [
  { short: "L", long: "lunes" },
  { short: "M", long: "martes" },
  { short: "X", long: "miércoles" },
  { short: "J", long: "jueves" },
  { short: "V", long: "viernes" },
  { short: "S", long: "sábado" },
  { short: "D", long: "domingo" },
];

export default function Home({ searchParams }: PageProps<"/">) {
  return (
    <main>
      <header className="pt-4 text-center">
        <p className="eyebrow">Diario de poemas</p>
        <h1 className="mt-1 font-hand text-[64px] leading-none font-semibold">
          {APP_NAME}
        </h1>
        <p className="mt-2 text-[17px] text-secondary italic">{APP_SUBTITLE}</p>
      </header>
      <Suspense fallback={<Loading />}>
        <Calendar searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

const monthHref = (month: string, currentMonth: string) =>
  month === currentMonth ? "/" : `/?month=${month}`;

async function Calendar({ searchParams }: Pick<PageProps<"/">, "searchParams">) {
  await connection();
  const [{ month: requested }, { session, mode }] = await Promise.all([
    searchParams,
    currentMode(),
  ]);
  const todayDate = today();
  const currentMonth = monthOf(todayDate);
  const month =
    typeof requested === "string" && isValidMonth(requested) && requested <= currentMonth
      ? requested
      : currentMonth;

  const [counts, todayCountElsewhere] = await Promise.all([
    countByDay(month),
    month === currentMonth ? undefined : countOnDay(todayDate),
  ]);
  const todayCounts = counts[todayDate];
  const todayCount =
    todayCountElsewhere ?? (todayCounts ? todayCounts.poem + todayCounts.note : 0);
  const monthTotals: KindCounts = { poem: 0, note: 0 };
  for (const day of Object.values(counts)) {
    monthTotals.poem += day.poem;
    monthTotals.note += day.note;
  }
  const monthSummary =
    monthTotals.note > 0
      ? `${countLabel("poem", monthTotals.poem)} · ${countLabel("note", monthTotals.note)}`
      : countLabel("poem", monthTotals.poem);
  const previous = addMonths(month, -1);
  const next = addMonths(month, 1);
  const isCurrentMonth = month === currentMonth;

  const navButton =
    "flex size-[44px] items-center justify-center rounded-full border border-soft-border text-[22px]";

  return (
    <>
      {session && (
        <div className="mt-6 flex justify-center">
          <ModeSwitch mode={mode} />
        </div>
      )}

      <section aria-labelledby="month-title" className="mt-8">
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
            className="font-hand text-[34px] leading-none font-semibold"
          >
            {monthTitle(month)}
          </h2>
          {isCurrentMonth ? (
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

        <div className="mt-6 grid grid-cols-7 gap-[6px]" aria-hidden="true">
          {WEEKDAYS.map((d) => (
            <abbr
              key={d.short}
              title={d.long}
              className="text-center text-[13px] text-secondary no-underline"
            >
              {d.short}
            </abbr>
          ))}
        </div>

        <ol
          className="mt-2 grid grid-cols-7 gap-[6px]"
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
                  />
                )}
              </li>
            ))}
        </ol>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-x-3.5 gap-y-2 text-[16px] text-secondary">
          <span className="flex items-center gap-3.5">
            <span className="inline-flex items-center gap-1.5">
              <Flower kind="poem" size={14} /> poema
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Flower kind="note" size={14} /> nota
            </span>
          </span>
          <span className="italic">{monthSummary}</span>
        </div>
      </section>

      <div className="mt-10 flex justify-center">
        {mode === "write" ? (
          <Link href="/write" className="pill pill-wine px-6">
            + Escribir hoy
          </Link>
        ) : (
          todayCount > 0 && (
            <Link href={`/day/${todayDate}`} className="pill px-6">
              Leer lo de hoy <span aria-hidden="true">→</span>
            </Link>
          )
        )}
      </div>
    </>
  );
}

const CELL_BASE =
  "flex h-[62px] flex-col items-center gap-[5px] rounded-[10px] pt-[7px] text-[18px] leading-none";

const NO_ENTRIES: KindCounts = { poem: 0, note: 0 };

/** Up to three flowers (poems first); with more, one per kind present and the total. */
function CellFlowers({ counts }: { counts: KindCounts }) {
  const total = counts.poem + counts.note;
  const flowers: EntryKind[] =
    total <= 3
      ? ENTRY_KINDS.flatMap((kind) => Array<EntryKind>(counts[kind]).fill(kind))
      : ENTRY_KINDS.filter((kind) => counts[kind] > 0);

  return (
    <span className="inline-flex items-center gap-px" aria-hidden="true">
      {flowers.map((kind, i) => (
        <Flower key={i} kind={kind} />
      ))}
      {total > 3 && <span className="ml-0.5 text-[12px] text-light">{total}</span>}
    </span>
  );
}

function DayCell({
  date,
  counts,
  todayDate,
  mode,
}: {
  date: string;
  counts: KindCounts;
  todayDate: string;
  mode: Mode;
}) {
  const day = Number(date.slice(8));
  const isToday = date === todayDate;
  const dayLabel = `${shortDate(date)}${isToday ? ", hoy" : ""}`;
  const total = counts.poem + counts.note;

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
        className={`${CELL_BASE} ${
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
        className={`${CELL_BASE} ${todayClass} ${
          isToday ? "" : "border border-dashed border-light/25"
        } hover:bg-light/7`}
      >
        <span>{day}</span>
        <span className="text-[15px] text-secondary" aria-hidden="true">
          +
        </span>
      </Link>
    );
  }

  return (
    <div
      role="img"
      aria-label={`${dayLabel}: sin entradas`}
      className={`${CELL_BASE} ${todayClass}`}
    >
      {day}
    </div>
  );
}
