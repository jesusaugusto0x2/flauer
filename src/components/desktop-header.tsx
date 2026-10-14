import Link from "next/link";
import { APP_NAME, APP_SUBTITLE } from "@/lib/config";
import type { Mode } from "@/lib/session";
import { ModeSwitch } from "./mode-switch";

/**
 * Desktop-only site header: the diary's name on the left; on the right, the
 * subtitle for visitors, or the mode switch (and "+ Escribir hoy") for the owner.
 */
export function DesktopHeader({
  session,
  mode,
  home = false,
  writeButton = true,
}: {
  session: boolean;
  mode: Mode;
  /** The calendar page, where the name is the page's heading. */
  home?: boolean;
  /** Show "+ Escribir hoy" in write mode. */
  writeButton?: boolean;
}) {
  const Brand = home ? "h1" : "p";
  return (
    <header className="mb-8 hidden flex-wrap items-end justify-between gap-x-6 gap-y-3 border-b border-light/18 pb-[18px] lg:flex">
      <div>
        <p className="eyebrow">Diario de poemas</p>
        <Brand className="font-hand text-[60px] leading-none font-semibold">
          {home ? APP_NAME : <Link href="/">{APP_NAME}</Link>}
        </Brand>
      </div>
      {session ? (
        <div className="flex flex-wrap items-center gap-3.5">
          <ModeSwitch mode={mode} />
          {mode === "write" && writeButton && (
            <Link href="/write" className="pill pill-wine px-6 text-[18px]">
              + Escribir hoy
            </Link>
          )}
        </div>
      ) : (
        <p className="mb-1.5 text-[19px] text-secondary italic">{APP_SUBTITLE}</p>
      )}
    </header>
  );
}
