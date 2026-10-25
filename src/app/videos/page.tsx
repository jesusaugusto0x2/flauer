import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { DesktopHeader } from "@/components/desktop-header";
import { Loading } from "@/components/loading";
import { ModeSwitch } from "@/components/mode-switch";
import { AddVideo } from "@/components/video-form";
import { VideoGrid } from "@/components/video-grid";
import { APP_NAME } from "@/lib/config";
import { mediumDate, plural, today } from "@/lib/dates";
import { currentMode } from "@/lib/session";
import { listVideos } from "@/lib/videos";

export const metadata: Metadata = { title: "Videos" };

export default function VideosPage() {
  return (
    <Suspense fallback={<Loading />}>
      <Videos />
    </Suspense>
  );
}

async function Videos() {
  await connection();
  const [{ session, mode }, videos] = await Promise.all([currentMode(), listVideos()]);
  const writing = mode === "write";

  return (
    <main>
      <DesktopHeader session={session} mode={mode} section="videos" />
      {/* Phone header: the diary's name and the way back to the calendar. */}
      <header className="flex items-center justify-between gap-3 border-b border-light/18 pb-3.5 lg:hidden">
        <div>
          <p className="eyebrow text-[11px]">Diario de poemas</p>
          <p className="font-hand text-[42px] leading-none font-semibold">{APP_NAME}</p>
        </div>
        <Link href="/" className="pill shrink-0 px-4">
          Calendario
        </Link>
      </header>
      {session && (
        <div className="mt-5 flex justify-center lg:hidden">
          <ModeSwitch mode={mode} />
        </div>
      )}

      <div className="mt-[22px] flex items-baseline justify-between gap-3 lg:mt-0">
        <h1 className="font-hand text-[50px] leading-none font-semibold lg:text-[64px]">
          Videos
        </h1>
        {videos.length > 0 && (
          <span className="text-[17px] text-secondary italic lg:text-[19px]">
            {plural(videos.length, "video", "videos")}
          </span>
        )}
      </div>

      {writing && (
        <div className="mt-6 lg:mt-8 lg:max-w-[640px]">
          <AddVideo
            dateNote={`Se guarda con la fecha de hoy: ${mediumDate(today())}.`}
            startOpen={videos.length === 0}
          />
        </div>
      )}

      {videos.length > 0 ? (
        <div className="mt-[22px] lg:mt-8">
          <VideoGrid videos={videos} />
        </div>
      ) : (
        <p className="mt-8 text-[19px] text-secondary italic">
          {writing
            ? "Todavía no hay videos. Agrega el primero."
            : "Todavía no hay videos."}
        </p>
      )}
    </main>
  );
}
