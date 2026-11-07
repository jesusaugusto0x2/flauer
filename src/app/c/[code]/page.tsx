import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { Loading } from "@/components/loading";
import { openShare } from "@/lib/shares";

export const metadata: Metadata = { robots: { index: false } };

/**
 * A share link: /c/<code> opens the one poem, note or video it was made for,
 * without the reader's password. A wrong or withdrawn code finds nothing.
 */
export default function SharedPage({ params }: PageProps<"/c/[code]">) {
  return (
    <Suspense fallback={<Loading />}>
      <OpenShared params={params} />
    </Suspense>
  );
}

async function OpenShared({ params }: Pick<PageProps<"/c/[code]">, "params">) {
  await connection();
  const { code } = await params;
  const target = await openShare(code);
  if (!target) notFound();

  // The item's own page takes the code along (?c=) and checks it again.
  return redirect(
    target.kind === "entry"
      ? `/entry/${target.id}?c=${code}`
      : `/videos/${target.id}?c=${code}`,
  );
}
