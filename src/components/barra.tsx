import Link from "next/link";
import type { ReactNode } from "react";

/** Barra superior: volver a la izquierda y algo a la derecha. */
export function Barra({
  volver,
  textoVolver,
  children,
}: {
  volver: string;
  textoVolver: string;
  children?: ReactNode;
}) {
  return (
    <nav className="mb-8 flex min-h-[48px] items-center justify-between gap-3">
      <Link href={volver} className="pildora shrink-0 px-4">
        <span aria-hidden="true">←</span> {textoVolver}
      </Link>
      <div className="flex min-w-0 items-center justify-end">{children}</div>
    </nav>
  );
}
