import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { DesktopHeader } from "@/components/desktop-header";
import { Loading } from "@/components/loading";
import { TopBar } from "@/components/top-bar";
import { VideoPlayer } from "@/components/video-player";
import { VideosColumn } from "@/components/videos-column";
import { longDate, today } from "@/lib/dates";
import { currentMode } from "@/lib/session";
import { openUrl, SOURCE_NAME } from "@/lib/video-links";
import { listVideos } from "@/lib/videos";

export const metadata: Metadata = { title: "Video" };

export default function VideoPage({ params }: PageProps<"/videos/[id]">) {
  return (
    <Suspense fallback={<Loading />}>
      <Watch params={params} />
    </Suspense>
  );
}

const NAV_PILL = "pill px-4 lg:px-[18px] lg:text-[18px]";

async function Watch({ params }: Pick<PageProps<"/videos/[id]">, "params">) {
  await connection();
  const [{ id }, { session, mode }, videos] = await Promise.all([
    params,
    currentMode(),
    listVideos(),
  ]);
  const index = videos.findIndex((v) => v.id === id);
  if (index === -1) notFound();

  const video = videos[index];
  // Same order as the list: newest first.
  const previous = videos[index - 1];
  const next = videos[index + 1];
  const position = `Video ${index + 1} de ${videos.length}`;

  return (
    <main>
      <DesktopHeader session={session} mode={mode} section="videos" />
      <TopBar backHref="/videos" backLabel="Videos">
        <span className="text-[17px] text-secondary italic">{position}</span>
      </TopBar>

      <div className="lg:flex lg:items-start lg:gap-10">
        {/* Desktop: the list stays at hand to jump between videos. */}
        <VideosColumn
          videos={videos}
          mode={mode}
          todayDate={today()}
          currentId={video.id}
          heading="h2"
          desktopOnly
          className="min-w-0 lg:max-w-[460px] lg:flex-[1_1_380px]"
        />

        {/* Desktop: a video recorded upright gets its words beside it, not below. */}
        <article
          className={`min-w-0 lg:flex-[2_1_600px] ${video.vertical ? "lg:flex lg:items-start lg:gap-10" : ""}`}
        >
          <div
            className={
              video.vertical ? "lg:w-[calc(min(78dvh,720px)*9/16)] lg:shrink-0" : ""
            }
          >
            <VideoPlayer video={video} />
          </div>

          <div
            className={`mt-6 min-w-0 ${video.vertical ? "lg:mt-0 lg:flex-1" : "lg:mt-7"}`}
          >
            <p className="text-[16px] text-secondary italic lg:text-[18px]">
              {longDate(video.date)}
              <span className="hidden lg:inline"> · {position}</span>
            </p>
            <h1 className="mt-1 text-[30px] leading-[1.15] font-semibold break-words lg:text-[38px]">
              {video.title}
            </h1>
            {video.note && (
              <p className="mt-3 text-[19px] leading-[1.6] whitespace-pre-line text-light/90 lg:text-[20px]">
                {video.note}
              </p>
            )}
            <p className="mt-4 text-[15px] text-secondary italic">
              ¿No carga?{" "}
              <a
                href={openUrl(video)}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-4 hover:text-light"
              >
                Ábrelo en {SOURCE_NAME[video.source]} <span aria-hidden="true">↗</span>
                <span className="sr-only">(se abre en otra pestaña)</span>
              </a>
            </p>
            {mode === "write" && (
              <Link href={`/videos/${video.id}/edit`} className="pill mt-5 px-5">
                Editar
              </Link>
            )}

            <nav
              aria-label="Más videos"
              className="mt-8 flex flex-wrap justify-between gap-3"
            >
              {previous ? (
                <Link href={`/videos/${previous.id}`} className={NAV_PILL}>
                  <span aria-hidden="true">←</span> Anterior
                </Link>
              ) : (
                <span className={`${NAV_PILL} opacity-35`} aria-disabled="true">
                  <span aria-hidden="true">←</span> Anterior
                </span>
              )}
              {next ? (
                <Link href={`/videos/${next.id}`} className={NAV_PILL}>
                  Siguiente video <span aria-hidden="true">→</span>
                </Link>
              ) : (
                <span className={`${NAV_PILL} opacity-35`} aria-disabled="true">
                  Siguiente video <span aria-hidden="true">→</span>
                </span>
              )}
            </nav>
          </div>
        </article>
      </div>
    </main>
  );
}
