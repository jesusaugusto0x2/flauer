import Link from "next/link";
import type { ReactNode } from "react";

/** Top bar: back link on the left, anything on the right. */
export function TopBar({
  backHref,
  backLabel,
  children,
}: {
  backHref: string;
  backLabel: string;
  children?: ReactNode;
}) {
  return (
    <nav className="mb-8 flex min-h-[48px] items-center justify-between gap-3">
      <Link href={backHref} className="pill shrink-0 px-4">
        <span aria-hidden="true">←</span> {backLabel}
      </Link>
      <div className="flex min-w-0 items-center justify-end">{children}</div>
    </nav>
  );
}
