import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { DayEntriesNav, SideColumnHeader } from "@/components/day-entries-nav";
import { DesktopHeader } from "@/components/desktop-header";
import { OutlineFlower } from "@/components/icons";
import { Loading } from "@/components/loading";
import { TopBar } from "@/components/top-bar";
import { SIGNATURE } from "@/lib/config";
import { longDate, shortDate, today, weekday } from "@/lib/dates";
import { entriesOnDay, getEntry } from "@/lib/entries";
import { displayTitle } from "@/lib/kinds";
import { currentMode } from "@/lib/session";

export default function PoemPage({ params }: PageProps<"/poem/[id]">) {
  return (
    <Suspense fallback={<Loading />}>
      <Poem params={params} />
    </Suspense>
  );
}

const NAV_PILL = "pill px-4 lg:px-[18px] lg:text-[18px]";

async function Poem({ params }: Pick<PageProps<"/poem/[id]">, "params">) {
  await connection();
  const [{ id }, { session, mode }] = await Promise.all([params, currentMode()]);
  const poem = await getEntry(id);
  if (!poem) notFound();
  // Notes are read in full on their day; they have no page of their own.
  if (poem.kind === "note") redirect(`/day/${poem.date}`);

  const dayEntries = await entriesOnDay(poem.date);
  const sameDay = dayEntries.filter((e) => e.kind === "poem");
  const index = sameDay.findIndex((p) => p.id === poem.id);
  const previous = sameDay[index - 1];
  const next = sameDay[index + 1];
  const position = `Poema ${index + 1} de ${sameDay.length}`;
  const dayHref = `/day/${poem.date}`;

  return (
    <main>
      <DesktopHeader session={session} mode={mode} />
      <TopBar backHref={dayHref} backLabel={shortDate(poem.date)}>
        <span className="text-[17px] text-secondary italic">{position}</span>
      </TopBar>

      <div className="lg:flex lg:flex-wrap lg:items-start lg:gap-12">
        {/* Desktop: the day's list stays at hand to jump between entries. */}
        <aside
          aria-label="Este día"
          className="hidden min-w-0 flex-col gap-[18px] lg:flex lg:flex-[1_1_280px]"
        >
          <SideColumnHeader
            backHref={dayHref}
            eyebrow={`${weekday(poem.date)}${poem.date === today() ? " · hoy" : ""}`}
            date={poem.date}
          />
          <DayEntriesNav
            date={poem.date}
            entries={dayEntries}
            currentId={poem.id}
            label="Entradas de este día"
          />
        </aside>

        <div className="flex min-w-0 flex-col gap-8 lg:max-w-[760px] lg:flex-[999_1_600px] lg:gap-5">
          {/* Lines every 32px on phones, 38px on desktop; the text sits on them. */}
          <article className="paper px-6 pt-8 pb-8 lg:px-16 lg:pt-[38px] lg:pb-14 lg:[--rule:38px]">
            <OutlineFlower className="absolute top-3 right-3 opacity-55 lg:top-7 lg:right-7 lg:h-[104px] lg:w-20 lg:stroke-[1.6]" />
            <p className="pr-14 text-[16px] leading-8 text-ink-soft italic lg:pr-24 lg:text-[18px] lg:leading-[38px]">
              {longDate(poem.date)}
              <span className="hidden lg:inline"> · {position}</span>
            </p>
            <h1 className="pr-14 text-[32px] leading-8 font-semibold text-ink-title lg:pr-24 lg:text-[42px] lg:leading-[38px]">
              {displayTitle(poem)}
            </h1>
            <div className="mt-8 text-[19px] leading-8 whitespace-pre-line lg:mt-[38px] lg:text-[23px] lg:leading-[38px]">
              {poem.body}
            </div>
            {SIGNATURE && (
              <p className="mt-8 text-right font-hand text-[24px] leading-8 font-semibold text-wine lg:mt-[38px] lg:text-[30px] lg:leading-[38px]">
                {SIGNATURE}
              </p>
            )}
          </article>

          <nav aria-label="Poemas de este día" className="flex justify-between gap-3">
            {previous ? (
              <Link href={`/poem/${previous.id}`} className={NAV_PILL}>
                <span aria-hidden="true">←</span> Anterior
              </Link>
            ) : (
              <span className={`${NAV_PILL} opacity-35`} aria-disabled="true">
                <span aria-hidden="true">←</span> Anterior
              </span>
            )}
            {next ? (
              <Link href={`/poem/${next.id}`} className={NAV_PILL}>
                Siguiente poema <span aria-hidden="true">→</span>
              </Link>
            ) : (
              <span className={`${NAV_PILL} opacity-35`} aria-disabled="true">
                Siguiente poema <span aria-hidden="true">→</span>
              </span>
            )}
          </nav>
        </div>
      </div>
    </main>
  );
}
