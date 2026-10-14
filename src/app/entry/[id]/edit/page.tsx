import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { EntryForm } from "@/components/entry-form";
import { Loading } from "@/components/loading";
import { ModeSwitch } from "@/components/mode-switch";
import { TopBar } from "@/components/top-bar";
import { shortDate, today } from "@/lib/dates";
import { getEntry } from "@/lib/entries";
import { currentMode } from "@/lib/session";

export const metadata: Metadata = { title: "Editar", robots: { index: false } };

export default function EditPage({ params }: PageProps<"/entry/[id]/edit">) {
  return (
    <Suspense fallback={<Loading />}>
      <Edit params={params} />
    </Suspense>
  );
}

async function Edit({ params }: Pick<PageProps<"/entry/[id]/edit">, "params">) {
  await connection();
  const [{ id }, { session, mode }] = await Promise.all([params, currentMode()]);
  // Without a session this page doesn't exist.
  if (!session) notFound();

  const entry = await getEntry(id);
  if (!entry) notFound();
  const dayHref = `/day/${entry.date}`;

  return (
    <main>
      <TopBar backHref={dayHref} backLabel={shortDate(entry.date)}>
        <ModeSwitch mode={mode} />
      </TopBar>
      <EntryForm
        // Remount when the entry changes so the fields never show an older version.
        key={`${entry.id}:${entry.updatedAt.getTime()}`}
        today={today()}
        cancelHref={dayHref}
        entry={{
          id: entry.id,
          kind: entry.kind,
          date: entry.date,
          title: entry.title ?? "",
          body: entry.body,
        }}
      />
    </main>
  );
}
