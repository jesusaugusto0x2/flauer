import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { OutlineFlower } from "@/components/icons";
import { Loading } from "@/components/loading";
import { TopBar } from "@/components/top-bar";
import { SIGNATURE } from "@/lib/config";
import { longDate, shortDate } from "@/lib/dates";
import { entriesOnDay, getEntry } from "@/lib/entries";
import { displayTitle } from "@/lib/kinds";

export default function PoemPage({ params }: PageProps<"/poem/[id]">) {
  return (
    <Suspense fallback={<Loading />}>
      <Poem params={params} />
    </Suspense>
  );
}

const NAV_PILL = "pill px-4";

async function Poem({ params }: Pick<PageProps<"/poem/[id]">, "params">) {
  await connection();
  const { id } = await params;
  const poem = await getEntry(id);
  if (!poem) notFound();
  // Notes are read in full on their day; they have no page of their own.
  if (poem.kind === "note") redirect(`/day/${poem.date}`);

  const sameDay = (await entriesOnDay(poem.date)).filter((e) => e.kind === "poem");
  const index = sameDay.findIndex((p) => p.id === poem.id);
  const previous = sameDay[index - 1];
  const next = sameDay[index + 1];

  return (
    <main>
      <TopBar backHref={`/day/${poem.date}`} backLabel={shortDate(poem.date)}>
        <span className="text-[17px] text-secondary italic">
          Poema {index + 1} de {sameDay.length}
        </span>
      </TopBar>

      <article className="paper px-6 pt-8 pb-8">
        <OutlineFlower className="absolute top-3 right-3 opacity-55" />
        <p className="pr-14 text-[16px] leading-8 text-ink-soft italic">
          {longDate(poem.date)}
        </p>
        <h1 className="pr-14 text-[32px] leading-8 font-semibold text-ink-title">
          {displayTitle(poem)}
        </h1>
        <div className="mt-8 text-[19px] leading-8 whitespace-pre-line">{poem.body}</div>
        {SIGNATURE && (
          <p className="mt-8 text-right font-hand text-[24px] leading-8 font-semibold text-wine">
            {SIGNATURE}
          </p>
        )}
      </article>

      <nav aria-label="Poemas de este día" className="mt-8 flex justify-between gap-3">
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
    </main>
  );
}
