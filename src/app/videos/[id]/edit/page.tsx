import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { DesktopHeader } from "@/components/desktop-header";
import { Loading } from "@/components/loading";
import { ModeSwitch } from "@/components/mode-switch";
import { TopBar } from "@/components/top-bar";
import { VideoForm } from "@/components/video-form";
import { mediumDate } from "@/lib/dates";
import { formatDuration } from "@/lib/duration";
import { currentMode } from "@/lib/session";
import { openUrl } from "@/lib/video-links";
import { getVideo } from "@/lib/videos";

export const metadata: Metadata = { title: "Editar video", robots: { index: false } };

export default function EditVideoPage({ params }: PageProps<"/videos/[id]/edit">) {
  return (
    <Suspense fallback={<Loading />}>
      <EditVideo params={params} />
    </Suspense>
  );
}

async function EditVideo({ params }: Pick<PageProps<"/videos/[id]/edit">, "params">) {
  await connection();
  const [{ id }, { session, mode }] = await Promise.all([params, currentMode()]);
  // Without a session this page doesn't exist.
  if (!session) notFound();

  const video = await getVideo(id);
  if (!video) notFound();
  const videoHref = `/videos/${video.id}`;

  return (
    <main>
      <DesktopHeader session={session} mode={mode} section="videos" />
      <TopBar backHref={videoHref} backLabel="Video">
        <ModeSwitch mode={mode} />
      </TopBar>

      <div className="lg:mx-auto lg:max-w-[640px]">
        <h1 className="mb-5 font-hand text-[44px] leading-[1.05] font-semibold">
          Editar video
        </h1>
        <div className="rounded-[12px] border border-soft-border bg-light/5 px-5 pt-5 pb-6 lg:px-7 lg:pt-6 lg:pb-7">
          <VideoForm
            // Remount when the video changes so the fields never show an older version.
            key={`${video.id}:${video.updatedAt.getTime()}`}
            video={{
              id: video.id,
              link: openUrl(video),
              title: video.title,
              note: video.note ?? "",
              duration: video.durationSeconds
                ? formatDuration(video.durationSeconds)
                : "",
              vertical: video.vertical,
            }}
            dateNote={`Agregado el ${mediumDate(video.date)}. Esa fecha no cambia.`}
            cancelHref={videoHref}
          />
        </div>
      </div>
    </main>
  );
}
