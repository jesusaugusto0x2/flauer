import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { NoteCard, PoemCardLink } from "@/components/entry-cards";
import { Flower } from "@/components/icons";
import { Loading } from "@/components/loading";
import { ModeSwitch } from "@/components/mode-switch";
import { TopBar } from "@/components/top-bar";
import { APP_NAME } from "@/lib/config";
import { isValidDate, mediumDate, monthOf, today, weekday } from "@/lib/dates";
import { entriesOnDay } from "@/lib/entries";
import { countLabel, displayTitle, firstLine } from "@/lib/kinds";
import { currentMode } from "@/lib/session";
import { WriteList } from "./write-list";

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

  const [{ session, mode }, dayEntries] = await Promise.all([
    currentMode(),
    entriesOnDay(date),
  ]);
  const isToday = date === todayDate;
  const backHref =
    monthOf(date) === monthOf(todayDate) ? "/" : `/?month=${monthOf(date)}`;
  const poems = dayEntries.filter((e) => e.kind === "poem").length;
  const notes = dayEntries.length - poems;

  return (
    <main>
      <TopBar backHref={backHref} backLabel="Calendario">
        {session ? (
          <ModeSwitch mode={mode} />
        ) : (
          <span className="font-hand text-[28px] leading-none font-semibold">
            {APP_NAME}
          </span>
        )}
      </TopBar>

      <header>
        <p className="text-[13px] tracking-[0.24em] text-secondary uppercase">
          {weekday(date)}
          {isToday && " · hoy"}
        </p>
        <h1 className="mt-1 font-hand text-[46px] leading-[1.05] font-semibold">
          {mediumDate(date)}
        </h1>
        {dayEntries.length > 0 && (
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
          entries={dayEntries.map((e) => ({
            id: e.id,
            kind: e.kind,
            title: e.kind === "poem" ? displayTitle(e) : e.title,
            firstLine: firstLine(e.body),
            body: e.kind === "note" ? e.body : "",
          }))}
        />
      ) : dayEntries.length === 0 ? (
        <div className="mt-12 text-center">
          <p className="text-[19px] text-secondary italic">
            {isToday
              ? "Hoy todavía no florece nada."
              : "Este día no tiene poemas ni notas. Quizá fue un día de silencio."}
          </p>
          <Link href={backHref} className="pill mt-8">
            <span aria-hidden="true">←</span> Volver al calendario
          </Link>
        </div>
      ) : (
        <ul className="mt-6 flex flex-col gap-3.5">
          {dayEntries.map((e) => (
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
    </main>
  );
}
