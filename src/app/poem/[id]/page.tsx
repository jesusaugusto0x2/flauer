import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { OutlineFlower } from "@/components/icons";
import { Loading } from "@/components/loading";
import { TopBar } from "@/components/top-bar";
import { SIGNATURE } from "@/lib/config";
import { longDate, shortDate } from "@/lib/dates";
import { displayTitle, getPoem, poemsOnDay } from "@/lib/poems";

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
  const poem = await getPoem(id);
  if (!poem) notFound();

  const sameDay = await poemsOnDay(poem.date);
  const index = sameDay.findIndex((p) => p.id === poem.id);
  const previous = sameDay[index - 1];
  const next = sameDay[index + 1];

  return (
    <main>
      <TopBar backHref={`/day/${poem.date}`} backLabel={shortDate(poem.date)}>
        <span className="text-secondary text-[17px] italic">
          Poema {index + 1} de {sameDay.length}
        </span>
      </TopBar>

      <article className="paper px-6 pt-8 pb-8">
        <OutlineFlower className="absolute top-3 right-3 opacity-55" />
        <p className="text-ink-soft pr-14 text-[16px] leading-8 italic">
          {longDate(poem.date)}
        </p>
        <h1 className="text-ink-title pr-14 text-[32px] leading-8 font-semibold">
          {displayTitle(poem)}
        </h1>
        <div className="mt-8 text-[19px] leading-8 whitespace-pre-line">{poem.body}</div>
        {SIGNATURE && (
          <p className="font-hand text-wine mt-8 text-right text-[24px] leading-8 font-semibold">
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
