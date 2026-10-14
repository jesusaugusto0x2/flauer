import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { Flowers } from "@/components/icons";
import { Loading } from "@/components/loading";
import { ModeSwitch } from "@/components/mode-switch";
import { TopBar } from "@/components/top-bar";
import { APP_NAME } from "@/lib/config";
import { isValidDate, mediumDate, monthOf, plural, today, weekday } from "@/lib/dates";
import { displayTitle, firstLine, poemsOnDay } from "@/lib/poems";
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

  const [{ session, mode }, poems] = await Promise.all([currentMode(), poemsOnDay(date)]);
  const isToday = date === todayDate;
  const backHref =
    monthOf(date) === monthOf(todayDate) ? "/" : `/?month=${monthOf(date)}`;

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
        <p className="text-secondary text-[13px] tracking-[0.2em] uppercase">
          {weekday(date)}
          {isToday && " · hoy"}
        </p>
        <h1 className="font-hand mt-1 text-[46px] leading-tight font-semibold">
          {mediumDate(date)}
        </h1>
        {poems.length > 0 && (
          <p className="text-pink mt-1 flex items-center gap-2 text-[17px]">
            <Flowers count={poems.length} />
            <span>{plural(poems.length, "poema", "poemas")}</span>
          </p>
        )}
      </header>

      {mode === "write" ? (
        <WriteList
          date={date}
          poems={poems.map((p) => ({
            id: p.id,
            title: displayTitle(p),
            firstLine: firstLine(p.body),
          }))}
        />
      ) : poems.length === 0 ? (
        <div className="mt-12 text-center">
          <p className="text-secondary text-[19px] italic">
            {isToday
              ? "Hoy todavía no florece ningún poema."
              : "Este día no tiene poemas. Quizá fue un día de silencio."}
          </p>
          <Link href={backHref} className="pill mt-8">
            <span aria-hidden="true">←</span> Volver al calendario
          </Link>
        </div>
      ) : (
        <>
          <p className="text-secondary mt-6 text-[18px] italic">Elige qué poema leer.</p>
          <ul className="mt-5 flex flex-col gap-5">
            {poems.map((p, i) => (
              <li key={p.id}>
                <Link href={`/poem/${p.id}`} className="paper block px-6 pt-4 pb-4">
                  <span className="font-hand text-wine block text-[20px] leading-8 font-semibold">
                    Poema {i + 1}
                  </span>
                  <span className="text-ink-title block text-[26px] leading-8 font-semibold">
                    {displayTitle(p)}
                  </span>
                  <span className="text-ink-soft block truncate text-[18px] leading-8 italic">
                    {firstLine(p.body)}
                  </span>
                  <span className="text-wine block text-right text-[17px] leading-8 font-semibold">
                    Leer <span aria-hidden="true">→</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}
