import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { Calendar } from "@/components/calendar";
import { DayPanel } from "@/components/day-panel";
import { DesktopHeader } from "@/components/desktop-header";
import { Loading } from "@/components/loading";
import { ModeSwitch } from "@/components/mode-switch";
import { APP_NAME, APP_SUBTITLE } from "@/lib/config";
import { isValidMonth, monthOf, today } from "@/lib/dates";
import { countByDay, entriesOnDay } from "@/lib/entries";
import { currentMode } from "@/lib/session";

export default function Home({ searchParams }: PageProps<"/">) {
  return (
    <main>
      {/* Phone header. On desktop, DesktopHeader below takes its place. */}
      <header className="pt-4 text-center lg:hidden">
        <p className="eyebrow">Diario de poemas</p>
        <h1 className="mt-1 font-hand text-[64px] leading-none font-semibold">
          {APP_NAME}
        </h1>
        <p className="mt-2 text-[17px] text-secondary italic">{APP_SUBTITLE}</p>
      </header>
      <Suspense fallback={<Loading />}>
        <CalendarHome searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function CalendarHome({ searchParams }: Pick<PageProps<"/">, "searchParams">) {
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
  const isCurrentMonth = month === currentMonth;

  const [counts, todayEntries] = await Promise.all([
    countByDay(month),
    entriesOnDay(todayDate),
  ]);

  return (
    <>
      <DesktopHeader session={session} mode={mode} home />

      {session && (
        <div className="mt-6 flex justify-center lg:hidden">
          <ModeSwitch mode={mode} />
        </div>
      )}

      <div className="mt-8 lg:mt-0 lg:flex lg:flex-wrap lg:items-start lg:gap-10">
        <Calendar
          month={month}
          counts={counts}
          todayDate={todayDate}
          mode={mode}
          className="min-w-0 lg:flex-[1_1_640px]"
        />

        {/* Desktop: today's page sits next to the calendar. */}
        {isCurrentMonth ? (
          <DayPanel
            date={todayDate}
            entries={todayEntries}
            mode={mode}
            todayDate={todayDate}
            heading="h2"
            desktopOnly
            className="min-w-0 lg:flex-[1_1_420px]"
          />
        ) : (
          <p className="hidden min-w-0 pt-2 text-[19px] text-secondary italic lg:block lg:flex-[1_1_420px]">
            {mode === "write"
              ? "Elige un día para ver lo que escribiste o escribir algo nuevo."
              : "Elige un día con flores para leerlo."}
          </p>
        )}
      </div>

      <div className="mt-10 flex justify-center lg:hidden">
        {mode === "write" ? (
          <Link href="/write" className="pill pill-wine px-6">
            + Escribir hoy
          </Link>
        ) : (
          todayEntries.length > 0 && (
            <Link href={`/day/${todayDate}`} className="pill px-6">
              Leer lo de hoy <span aria-hidden="true">→</span>
            </Link>
          )
        )}
      </div>
    </>
  );
}
