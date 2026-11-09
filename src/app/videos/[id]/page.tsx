import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense, type ReactNode } from "react";
import { DesktopHeader } from "@/components/desktop-header";
import { Loading } from "@/components/loading";
import { ShareControl } from "@/components/share-control";
import { ShareViewBeacon } from "@/components/visit-beacons";
import { TopBar } from "@/components/top-bar";
import { UnlockForm } from "@/components/unlock-form";
import { VideoActions } from "@/components/video-actions";
import { VideoPlayer, VideoPoster } from "@/components/video-player";
import { VideoThumbnail } from "@/components/video-thumbnail";
import type { Video } from "@/db/schema";
import { mediumDate, shortDate, tinyDate, weekday } from "@/lib/dates";
import { currentMode } from "@/lib/session";
import { codeOpens, shareCode } from "@/lib/shares";
import { siteOrigin } from "@/lib/site";
import { openUrl, SOURCE_NAME, thumbnailUrl } from "@/lib/video-links";
import { listVideos } from "@/lib/videos";

export const metadata: Metadata = { title: "Video" };

export default function VideoPage({ params, searchParams }: PageProps<"/videos/[id]">) {
  return (
    <Suspense fallback={<Loading />}>
      <Watch params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function Watch({ params, searchParams }: PageProps<"/videos/[id]">) {
  await connection();
  const [{ id }, { c: code }, { session, mode, canRead }, videos] = await Promise.all([
    params,
    searchParams,
    currentMode(),
    listVideos(),
  ]);
  const index = videos.findIndex((v) => v.id === id);
  if (index === -1) notFound();

  const video = videos[index];
  const position = `${index + 1} de ${videos.length}`;
  // The reader's password opens every video; a share link (?c=) only this one.
  // Without either, nothing that leads to the video (player, Drive or YouTube
  // address, still, note) leaves the server. When the link opens it for anyone
  // but the owner, the page tells the server once a browser shows it
  // (ShareViewBeacon), and the owner gets an email.
  const sharedCode =
    !session && (await codeOpens(code, { kind: "video", id: video.id }))
      ? (code as string)
      : null;
  const open = canRead || sharedCode !== null;
  const sharing = session && mode === "write";
  const [savedCode, origin] = sharing
    ? await Promise.all([shareCode({ kind: "video", id: video.id }), siteOrigin()])
    : [null, ""];

  return (
    <main>
      <DesktopHeader session={session} mode={mode} section="videos" />
      <TopBar backHref="/videos" backLabel="Videos">
        <span className="text-[16px] text-secondary italic">{position}</span>
      </TopBar>
      <Link href="/videos" className="pill mb-7 hidden px-4 lg:inline-flex">
        <span aria-hidden="true">←</span> Todos los videos
      </Link>

      {/* Phones: the video across the screen with its words below. Desktop: side
          by side and centered. */}
      <article className="flex flex-col gap-[18px] lg:flex-row lg:flex-wrap lg:items-start lg:justify-center lg:gap-14">
        <div
          className={`w-full lg:flex-none ${
            video.vertical
              ? "lg:w-[min(400px,calc(78dvh*9/16))]"
              : "lg:w-[min(640px,54%)]"
          }`}
        >
          {open ? <VideoPlayer video={video} /> : <VideoPoster video={video} />}
        </div>

        <div className="flex min-w-0 flex-col gap-2 lg:max-w-[520px] lg:flex-[1_1_380px] lg:gap-3.5 lg:pt-3">
          <p className="text-[13px] tracking-[0.22em] text-secondary uppercase lg:text-[14px]">
            {weekday(video.date)} · {mediumDate(video.date)}
          </p>
          <h1 className="text-[34px] leading-[1.12] font-semibold text-balance break-words lg:text-[54px] lg:leading-[1.05]">
            {video.title}
          </h1>
          {!open && (
            <div className="mt-3 lg:mt-4">
              <UnlockForm prompt="Este video tiene clave. Escríbela para verlo." />
            </div>
          )}
          {open && video.note && (
            <p className="mt-0.5 text-[19px] leading-[1.55] whitespace-pre-line text-light-soft lg:mt-1.5 lg:text-[23px] lg:leading-[1.6]">
              {video.note}
            </p>
          )}
          {open && (
            <div className="mt-1 flex flex-wrap items-center gap-2.5 lg:mt-1.5">
              <a
                href={openUrl(video)}
                target="_blank"
                rel="noopener noreferrer"
                className="pill px-4 text-[15px] lg:px-[18px] lg:text-[16px]"
              >
                Abrir en {SOURCE_NAME[video.source]} <span aria-hidden="true">↗</span>
                <span className="sr-only">(se abre en otra pestaña)</span>
              </a>
              {mode === "write" && (
                <VideoActions id={video.id} sourceName={SOURCE_NAME[video.source]} />
              )}
            </div>
          )}
          {sharing && (
            <div className="mt-2">
              <ShareControl
                target={{ kind: "video", id: video.id }}
                code={savedCode}
                origin={origin}
              />
            </div>
          )}

          {open && (
            <div className="mt-4 border-t border-light/18 pt-4 lg:mt-7 lg:pt-5">
              <p className="mb-3 hidden text-[16px] text-secondary italic lg:block">
                Video {position}
              </p>
              {/* Same order as the list: "Anterior" is newer, "Siguiente" older. */}
              <nav
                aria-label="Otros videos"
                className="grid grid-cols-2 gap-2.5 lg:gap-3"
              >
                <Neighbor
                  video={videos[index - 1]}
                  label={
                    <>
                      <span aria-hidden="true">←</span> Anterior
                    </>
                  }
                  none="Es el más nuevo"
                  stills={canRead}
                />
                <Neighbor
                  video={videos[index + 1]}
                  label={
                    <>
                      Siguiente <span aria-hidden="true">→</span>
                    </>
                  }
                  none="Es el más antiguo"
                  stills={canRead}
                  end
                />
              </nav>
            </div>
          )}
        </div>
      </article>
      {sharedCode && <ShareViewBeacon kind="video" id={video.id} code={sharedCode} />}
    </main>
  );
}

const NEIGHBOR =
  "flex min-h-14 min-w-0 flex-col justify-center gap-0.5 rounded-[10px] border px-3.5 py-2.5 lg:min-h-24 lg:flex-row lg:items-center lg:justify-start lg:gap-3 lg:rounded-[12px] lg:p-2.5";
const NEIGHBOR_LABEL = "text-[13px] tracking-[0.16em] uppercase";

/** The video before or after this one, with its picture on desktop. */
function Neighbor({
  video,
  label,
  none,
  stills,
  end = false,
}: {
  video?: Video;
  label: ReactNode;
  /** Shown when there is no video on that side. */
  none: string;
  /** Its own still, only for whoever may watch it (a share link opens one video). */
  stills: boolean;
  /** Phones: aligned to the right, like an arrow pointing on. */
  end?: boolean;
}) {
  const align = end ? "text-right lg:text-left" : "";

  if (!video) {
    return (
      <span
        aria-disabled="true"
        className={`${NEIGHBOR} ${align} border-light/18 opacity-35`}
      >
        <span className={NEIGHBOR_LABEL}>{label}</span>
        <span className="text-[16px] italic lg:hidden">{none}</span>
      </span>
    );
  }

  return (
    <Link
      href={`/videos/${video.id}`}
      className={`${NEIGHBOR} ${align} border-light/30 hover:bg-light/7`}
    >
      <span className="hidden w-[76px] shrink-0 lg:block">
        <VideoThumbnail
          src={stills ? thumbnailUrl(video) : null}
          day={tinyDate(video.date)}
          size="mini"
        />
      </span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className={`${NEIGHBOR_LABEL} text-secondary`}>{label}</span>
        <span className="line-clamp-2 text-[17px] leading-[1.2] font-semibold break-words lg:text-[18px]">
          {video.title}
        </span>
        <span className="hidden text-[14px] text-secondary italic lg:block">
          {shortDate(video.date)}
        </span>
      </span>
    </Link>
  );
}
