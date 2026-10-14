import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { Loading } from "@/components/loading";
import { ModeSwitch } from "@/components/mode-switch";
import { PoemForm } from "@/components/poem-form";
import { TopBar } from "@/components/top-bar";
import { shortDate, today } from "@/lib/dates";
import { getPoem } from "@/lib/poems";
import { currentMode } from "@/lib/session";

export const metadata: Metadata = { title: "Editar poema", robots: { index: false } };

export default function EditPage({ params }: PageProps<"/poem/[id]/edit">) {
  return (
    <Suspense fallback={<Loading />}>
      <Edit params={params} />
    </Suspense>
  );
}

async function Edit({ params }: Pick<PageProps<"/poem/[id]/edit">, "params">) {
  await connection();
  const [{ id }, { session, mode }] = await Promise.all([params, currentMode()]);
  // Without a session this page doesn't exist.
  if (!session) notFound();

  const poem = await getPoem(id);
  if (!poem) notFound();
  const dayHref = `/day/${poem.date}`;

  return (
    <main>
      <TopBar backHref={dayHref} backLabel={shortDate(poem.date)}>
        <ModeSwitch mode={mode} />
      </TopBar>
      <h1 className="font-hand mb-6 text-[44px] leading-tight font-semibold">
        Editar poema
      </h1>
      <PoemForm
        today={today()}
        cancelHref={dayHref}
        poem={{ id: poem.id, date: poem.date, title: poem.title ?? "", body: poem.body }}
      />
    </main>
  );
}
