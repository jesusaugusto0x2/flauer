import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { Calendar } from "@/components/calendar";
import { DayPanel } from "@/components/day-panel";
import { DesktopHeader } from "@/components/desktop-header";
import { Loading } from "@/components/loading";
import { ModeSwitch } from "@/components/mode-switch";
import { TopBar } from "@/components/top-bar";
import { APP_NAME } from "@/lib/config";
import { isValidDate, monthOf, today } from "@/lib/dates";
import { countByDay, entriesOnDay } from "@/lib/entries";
import { currentMode } from "@/lib/session";

export default function DayPage({ params }: PageProps<"/day/[date]">) {
  return (
    <Suspense fallback={<Loading />}>
      <Day params={params} />
    </Suspense>
  );
}

async function Day({ params }: Pick<PageProps<"/day/[date]">, "params">) {
  await connection();
  const { date } = await params;
  const todayDate = today();
  if (!isValidDate(date) || date > todayDate) notFound();

  const month = monthOf(date);
  const [{ session, mode }, dayEntries, counts] = await Promise.all([
    currentMode(),
    entriesOnDay(date),
    countByDay(month),
  ]);
  const backHref = month === monthOf(todayDate) ? "/" : `/?month=${month}`;

  return (
    <main>
      <DesktopHeader session={session} mode={mode} />
      <TopBar backHref={backHref} backLabel="Calendario">
        {session ? (
          <ModeSwitch mode={mode} />
        ) : (
          <span className="font-hand text-[28px] leading-none font-semibold">
            {APP_NAME}
          </span>
        )}
      </TopBar>

      <div className="lg:flex lg:flex-wrap lg:items-start lg:gap-10">
        {/* Desktop: the month stays in view, with this day open next to it. */}
        <Calendar
          month={month}
          counts={counts}
          todayDate={todayDate}
          mode={mode}
          selectedDate={date}
          className="hidden min-w-0 lg:block lg:flex-[1_1_640px]"
        />
        <DayPanel
          date={date}
          entries={dayEntries}
          mode={mode}
          todayDate={todayDate}
          backHref={backHref}
          className="min-w-0 lg:flex-[1_1_420px]"
        />
      </div>
    </main>
  );
}
