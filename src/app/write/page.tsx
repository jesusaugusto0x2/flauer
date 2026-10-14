import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { DesktopHeader } from "@/components/desktop-header";
import { EntryForm } from "@/components/entry-form";
import { Loading } from "@/components/loading";
import { ModeSwitch } from "@/components/mode-switch";
import { TopBar } from "@/components/top-bar";
import { WriteAside } from "@/components/write-aside";
import { isValidDate, monthOf, today } from "@/lib/dates";
import { entriesOnDay } from "@/lib/entries";
import { isEntryKind } from "@/lib/kinds";
import { currentMode } from "@/lib/session";

export const metadata: Metadata = { title: "Escribir", robots: { index: false } };

export default function WritePage({ searchParams }: PageProps<"/write">) {
  return (
    <Suspense fallback={<Loading />}>
      <Write searchParams={searchParams} />
    </Suspense>
  );
}

async function Write({ searchParams }: Pick<PageProps<"/write">, "searchParams">) {
  await connection();
  const [{ date: requested, kind: requestedKind }, { session, mode }] = await Promise.all(
    [searchParams, currentMode()],
  );
  // Without a session this page doesn't exist.
  if (!session) notFound();

  const todayDate = today();
  const date =
    typeof requested === "string" && isValidDate(requested) && requested <= todayDate
      ? requested
      : todayDate;
  const kind = isEntryKind(requestedKind) ? requestedKind : "poem";
  const backHref =
    monthOf(date) === monthOf(todayDate) ? "/" : `/?month=${monthOf(date)}`;

  const dayEntries = await entriesOnDay(date);

  return (
    <main>
      <DesktopHeader session={session} mode={mode} writeButton={false} />
      <TopBar backHref={backHref} backLabel="Calendario">
        <ModeSwitch mode={mode} />
      </TopBar>
      <EntryForm
        // A new date or kind is a new form, not the same one with stale fields.
        key={`${date}:${kind}`}
        today={todayDate}
        initialDate={date}
        initialKind={kind}
        aside={
          <WriteAside
            backHref={backHref}
            eyebrow="Escribiendo para"
            date={date}
            entries={dayEntries}
          />
        }
      />
    </main>
  );
}
