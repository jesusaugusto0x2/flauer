import Link from "next/link";
import { APP_NAME, APP_SUBTITLE } from "@/lib/config";
import type { Mode } from "@/lib/session";
import { PlayIcon } from "./icons";
import { ModeSwitch } from "./mode-switch";

/**
 * Desktop-only site header: the diary's name on the left; on the right, the
 * subtitle for visitors, or the mode switch (and "+ Escribir hoy") for the owner,
 * then the way to the other part of the site (the videos, or the calendar).
 */
export function DesktopHeader({
  session,
  mode,
  home = false,
  writeButton = true,
  section = "diary",
}: {
  session: boolean;
  mode: Mode;
  /** The calendar page, where the name is the page's heading. */
  home?: boolean;
  /** Show "+ Escribir hoy" in write mode. */
  writeButton?: boolean;
  /** Where the page is: the diary (calendar, days, entries) or the videos. */
  section?: "diary" | "videos";
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
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        {session ? (
          <div className="flex flex-wrap items-center gap-3.5">
            <ModeSwitch mode={mode} />
            {mode === "write" && writeButton && section === "diary" && (
              <Link href="/write" className="pill pill-wine px-6 text-[18px]">
                + Escribir hoy
              </Link>
            )}
          </div>
        ) : (
          <p className="text-[19px] text-secondary italic">{APP_SUBTITLE}</p>
        )}
        {section === "videos" ? (
          <Link href="/" className="pill px-5 text-[17px]">
            Calendario
          </Link>
        ) : (
          <Link href="/videos" className="pill px-5 text-[17px]">
            <PlayIcon size={11} /> Videos
          </Link>
        )}
      </div>
    </header>
  );
}
