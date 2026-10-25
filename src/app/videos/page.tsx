import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { DesktopHeader } from "@/components/desktop-header";
import { Loading } from "@/components/loading";
import { ModeSwitch } from "@/components/mode-switch";
import { TopBar } from "@/components/top-bar";
import { PlayerPlaceholder } from "@/components/video-player";
import { VideosColumn } from "@/components/videos-column";
import { APP_NAME } from "@/lib/config";
import { today } from "@/lib/dates";
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

  return (
    <main>
      <DesktopHeader session={session} mode={mode} section="videos" />
      <TopBar backHref="/" backLabel="Calendario">
        {session ? (
          <ModeSwitch mode={mode} />
        ) : (
          <span className="font-hand text-[28px] leading-none font-semibold">
            {APP_NAME}
          </span>
        )}
      </TopBar>

      <div className="lg:flex lg:items-start lg:gap-10">
        <VideosColumn
          videos={videos}
          mode={mode}
          todayDate={today()}
          className="min-w-0 lg:max-w-[460px] lg:flex-[1_1_380px]"
        />
        {/* Desktop: the chosen video plays here, next to the list. */}
        <div className="hidden min-w-0 lg:sticky lg:top-6 lg:block lg:flex-[2_1_600px]">
          <PlayerPlaceholder>
            {videos.length > 0
              ? "Elige un video para verlo aquí."
              : "Aquí se verá el video que elijas."}
          </PlayerPlaceholder>
        </div>
      </div>
    </main>
  );
}
