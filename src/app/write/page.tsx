import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { Loading } from "@/components/loading";
import { ModeSwitch } from "@/components/mode-switch";
import { PoemForm } from "@/components/poem-form";
import { TopBar } from "@/components/top-bar";
import { isValidDate, monthOf, today } from "@/lib/dates";
import { currentMode } from "@/lib/session";

export const metadata: Metadata = { title: "Nuevo poema", robots: { index: false } };

export default function WritePage({ searchParams }: PageProps<"/write">) {
  return (
    <Suspense fallback={<Loading />}>
      <Write searchParams={searchParams} />
    </Suspense>
  );
}

async function Write({ searchParams }: Pick<PageProps<"/write">, "searchParams">) {
  await connection();
  const [{ date: requested }, { session, mode }] = await Promise.all([
    searchParams,
    currentMode(),
  ]);
  // Without a session this page doesn't exist.
  if (!session) notFound();

  const todayDate = today();
  const date =
    typeof requested === "string" && isValidDate(requested) && requested <= todayDate
      ? requested
      : todayDate;
  const backHref =
    monthOf(date) === monthOf(todayDate) ? "/" : `/?month=${monthOf(date)}`;

  return (
    <main>
      <TopBar backHref={backHref} backLabel="Calendario">
        <ModeSwitch mode={mode} />
      </TopBar>
      <h1 className="font-hand mb-6 text-[44px] leading-tight font-semibold">
        Nuevo poema
      </h1>
      <PoemForm today={todayDate} initialDate={date} />
    </main>
  );
}
