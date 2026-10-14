import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { DayEntriesNav, SideColumnHeader } from "@/components/day-entries-nav";
import { DesktopHeader } from "@/components/desktop-header";
import { KIND_THEME, SpotifyLink } from "@/components/entry-cards";
import { OutlineFlower } from "@/components/icons";
import { Loading } from "@/components/loading";
import { SIDE_COLUMN } from "@/components/side-column";
import { TopBar } from "@/components/top-bar";
import { SIGNATURE } from "@/lib/config";
import { longDate, shortDate, today, weekday } from "@/lib/dates";
import { entriesOnDay, getEntry } from "@/lib/entries";
import { displayTitle, kindLabel } from "@/lib/kinds";
import { currentMode } from "@/lib/session";

export default function EntryPage({ params }: PageProps<"/entry/[id]">) {
  return (
    <Suspense fallback={<Loading />}>
      <EntryReader params={params} />
    </Suspense>
  );
}

/**
 * One reading view for poems, notes and songs; only the look changes. Poems sit
 * on ruled paper with the text on the lines; notes on warm, unruled paper; songs
 * on lilac paper, with their artist and the way to Spotify.
 */
const READER = {
  poem: {
    sheet: "paper lg:[--rule:38px]",
    scrollThumb: "[--scroll-thumb:rgba(42,36,51,0.35)]",
    // Every block is a whole number of lines (32px, 38px on desktop), so the
    // poem's verses land on the ruling.
    meta: "leading-8 lg:leading-[38px]",
    title: "leading-8 lg:leading-[38px]",
    body: "mt-8 text-[19px] leading-8 lg:mt-[38px] lg:text-[23px] lg:leading-[38px]",
    navLabel: "Poemas de este día",
    next: "Siguiente poema",
  },
  note: {
    sheet: "note-paper",
    scrollThumb: "[--scroll-thumb:rgba(58,47,28,0.35)]",
    meta: "leading-8",
    title: "mt-1 leading-[1.15]",
    body: "mt-5 text-[19px] leading-[1.6] lg:mt-7 lg:text-[21px]",
    navLabel: "Notas de este día",
    next: "Siguiente nota",
  },
  song: {
    sheet: "song-paper",
    scrollThumb: "[--scroll-thumb:rgba(42,38,71,0.35)]",
    meta: "leading-8",
    title: "mt-1 leading-[1.15]",
    body: "mt-5 text-[19px] leading-[1.6] lg:mt-7 lg:text-[21px]",
    navLabel: "Canciones de este día",
    next: "Siguiente canción",
  },
} as const;

const NAV_PILL = "pill px-4 lg:px-[18px] lg:text-[18px]";

async function EntryReader({ params }: Pick<PageProps<"/entry/[id]">, "params">) {
  await connection();
  const [{ id }, { session, mode }] = await Promise.all([params, currentMode()]);
  const entry = await getEntry(id);
  if (!entry) notFound();

  const kind = entry.kind;
  const look = READER[kind];
  const theme = KIND_THEME[kind];
  const dayEntries = await entriesOnDay(entry.date);
  const sameKind = dayEntries.filter((e) => e.kind === kind);
  const index = sameKind.findIndex((e) => e.id === entry.id);
  const previous = sameKind[index - 1];
  const next = sameKind[index + 1];
  const position = `${kindLabel(kind)} ${index + 1} de ${sameKind.length}`;
  const dayHref = `/day/${entry.date}`;

  return (
    <main>
      <DesktopHeader session={session} mode={mode} />
      <TopBar backHref={dayHref} backLabel={shortDate(entry.date)}>
        <span className="text-[17px] text-secondary italic">{position}</span>
      </TopBar>

      <div className="lg:flex lg:flex-wrap lg:items-start lg:gap-12">
        {/* Desktop: the day's list stays at hand to jump between entries. */}
        <aside
          aria-label="Este día"
          className={`hidden min-w-0 flex-col gap-[18px] lg:flex ${SIDE_COLUMN} lg:flex-[1_1_280px]`}
        >
          <SideColumnHeader
            backHref={dayHref}
            eyebrow={`${weekday(entry.date)}${entry.date === today() ? " · hoy" : ""}`}
            date={entry.date}
          />
          <DayEntriesNav
            entries={dayEntries}
            currentId={entry.id}
            label="Entradas de este día"
            className="min-h-0 scroll-area"
          />
        </aside>

        <div className="flex min-w-0 flex-col gap-8 lg:max-w-[760px] lg:flex-[999_1_600px] lg:gap-5">
          {/* Phones: the page scrolls. Desktop: the sheet keeps to the window and
              scrolls inside, with its ruling moving along with the text. */}
          <article
            className={`${look.sheet} ${look.scrollThumb} px-6 pt-8 pb-8 shadow-[0_20px_40px_rgba(0,0,0,0.45)] lg:max-h-[max(24rem,calc(100dvh-17rem))] lg:scroll-area lg:[background-attachment:local] lg:px-16 lg:pt-[38px] lg:pb-14 lg:shadow-[0_30px_60px_rgba(0,0,0,0.45)]`}
          >
            <OutlineFlower
              color={theme.outline}
              className="absolute top-3 right-3 opacity-55 lg:top-7 lg:right-7 lg:h-[104px] lg:w-20 lg:stroke-[1.6]"
            />
            <p
              className={`pr-14 text-[16px] italic lg:pr-24 lg:text-[18px] ${theme.soft} ${look.meta}`}
            >
              {longDate(entry.date)}
              <span className="hidden lg:inline"> · {position}</span>
            </p>
            <h1
              className={`pr-14 text-[32px] font-semibold lg:pr-24 lg:text-[42px] ${theme.title} ${look.title}`}
            >
              {displayTitle(entry)}
            </h1>
            {kind === "song" && entry.artist && (
              <p className={`mt-1 text-[20px] italic lg:text-[24px] ${theme.soft}`}>
                {entry.artist}
              </p>
            )}
            {entry.body && (
              <div className={`whitespace-pre-line ${theme.text} ${look.body}`}>
                {entry.body}
              </div>
            )}
            {kind === "song" && entry.spotifyUrl && (
              <p className="mt-6 lg:mt-8">
                <SpotifyLink url={entry.spotifyUrl} name={displayTitle(entry)} />
              </p>
            )}
            {kind === "poem" && SIGNATURE && (
              <p className="mt-8 text-right font-hand text-[24px] leading-8 font-semibold text-wine lg:mt-[38px] lg:text-[30px] lg:leading-[38px]">
                {SIGNATURE}
              </p>
            )}
          </article>

          <nav aria-label={look.navLabel} className="flex justify-between gap-3">
            {previous ? (
              <Link href={`/entry/${previous.id}`} className={NAV_PILL}>
                <span aria-hidden="true">←</span> Anterior
              </Link>
            ) : (
              <span className={`${NAV_PILL} opacity-35`} aria-disabled="true">
                <span aria-hidden="true">←</span> Anterior
              </span>
            )}
            {next ? (
              <Link href={`/entry/${next.id}`} className={NAV_PILL}>
                {look.next} <span aria-hidden="true">→</span>
              </Link>
            ) : (
              <span className={`${NAV_PILL} opacity-35`} aria-disabled="true">
                {look.next} <span aria-hidden="true">→</span>
              </span>
            )}
          </nav>
        </div>
      </div>
    </main>
  );
}
