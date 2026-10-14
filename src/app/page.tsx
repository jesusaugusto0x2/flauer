import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { Flower, Flowers } from "@/components/icons";
import { Loading } from "@/components/loading";
import { ModeSwitch } from "@/components/mode-switch";
import { APP_NAME, APP_SUBTITLE } from "@/lib/config";
import {
  addMonths,
  isValidMonth,
  monthName,
  monthOf,
  monthTitle,
  plural,
  shortDate,
  today,
  weeksOfMonth,
} from "@/lib/dates";
import { countByDay, countOnDay } from "@/lib/poems";
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
        <h1 className="font-hand mt-1 text-[64px] leading-none font-semibold">
          {APP_NAME}
        </h1>
        <p className="text-secondary mt-2 text-[17px] italic">{APP_SUBTITLE}</p>
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
  const todayCount = todayCountElsewhere ?? counts[todayDate] ?? 0;
  const monthTotal = Object.values(counts).reduce((a, b) => a + b, 0);
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
              className="text-secondary text-center text-[13px] no-underline"
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
                    count={counts[date] ?? 0}
                    todayDate={todayDate}
                    mode={mode}
                  />
                )}
              </li>
            ))}
        </ol>

        <div className="text-secondary mt-5 flex items-center justify-between text-[16px]">
          <span className="inline-flex items-center gap-2">
            <Flower /> <span>= un poema</span>
          </span>
          <span className="italic">
            {plural(monthTotal, "poema", "poemas")} en {monthName(month)}
          </span>
        </div>
      </section>

      <div className="mt-10 flex justify-center">
        {mode === "write" ? (
          <Link href="/write" className="pill pill-wine px-6">
            + Escribir el poema de hoy
          </Link>
        ) : (
          todayCount > 0 && (
            <Link href={`/day/${todayDate}`} className="pill px-6">
              Leer los poemas de hoy <span aria-hidden="true">→</span>
            </Link>
          )
        )}
      </div>
    </>
  );
}

const CELL_BASE =
  "flex h-[62px] flex-col items-center gap-[5px] rounded-[10px] pt-[7px] text-[18px] leading-none";

function DayCell({
  date,
  count,
  todayDate,
  mode,
}: {
  date: string;
  count: number;
  todayDate: string;
  mode: Mode;
}) {
  const day = Number(date.slice(8));
  const isToday = date === todayDate;
  const dayLabel = `${shortDate(date)}${isToday ? ", hoy" : ""}`;

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

  if (count > 0) {
    return (
      <Link
        href={`/day/${date}`}
        aria-label={`${dayLabel}: ${plural(count, "poema", "poemas")}`}
        className={`${CELL_BASE} ${
          isToday
            ? "border-pink bg-pink/14 border font-semibold text-white"
            : "bg-light/7 hover:bg-light/12"
        }`}
      >
        <span>{day}</span>
        {count <= 3 ? (
          <Flowers count={count} className="justify-center gap-[2px]" />
        ) : (
          <span className="inline-flex items-center gap-[3px]" aria-hidden="true">
            <Flower />
            <span className="text-pink text-[12px]">{count}</span>
          </span>
        )}
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
        aria-label={`${dayLabel}: sin poemas. Escribir uno`}
        className={`${CELL_BASE} ${todayClass} ${
          isToday ? "" : "border-light/25 border border-dashed"
        } hover:bg-light/7`}
      >
        <span>{day}</span>
        <span className="text-secondary text-[15px]" aria-hidden="true">
          +
        </span>
      </Link>
    );
  }

  return (
    <div
      role="img"
      aria-label={`${dayLabel}: sin poemas`}
      className={`${CELL_BASE} ${todayClass}`}
    >
      {day}
    </div>
  );
}
