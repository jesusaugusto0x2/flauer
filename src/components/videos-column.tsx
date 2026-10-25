import type { Video } from "@/db/schema";
import { mediumDate, plural } from "@/lib/dates";
import type { Mode } from "@/lib/session";
import { SIDE_COLUMN, SIDE_COLUMN_LIST } from "./side-column";
import { AddVideo } from "./video-form";
import { VideoList, type VideoSummary } from "./video-list";

/**
 * Every video, with the form to add one in write mode. On phones it is the
 * /videos page; on desktop it stays at the side of the player.
 */
export function VideosColumn({
  videos,
  mode,
  todayDate,
  currentId,
  heading: Heading = "h1",
  desktopOnly = false,
  className = "",
}: {
  videos: Video[];
  mode: Mode;
  todayDate: string;
  currentId?: string;
  heading?: "h1" | "h2";
  /** Hidden on phones (a video's page shows only the video there). */
  desktopOnly?: boolean;
  className?: string;
}) {
  const writing = mode === "write";
  const summaries: VideoSummary[] = videos.map((v) => ({
    id: v.id,
    title: v.title,
    note: v.note,
    source: v.source,
    dateLabel: mediumDate(v.date),
  }));

  return (
    <section
      aria-label="Videos"
      className={`${desktopOnly ? "hidden lg:flex" : "flex"} flex-col ${SIDE_COLUMN} ${className}`}
    >
      <header className="shrink-0">
        <Heading className="font-hand text-[46px] leading-[1.05] font-semibold">
          Videos
        </Heading>
        <p className="mt-1 text-[17px] text-secondary italic">
          {videos.length > 0
            ? plural(videos.length, "video", "videos")
            : writing
              ? "Todavía no hay videos. Agrega el primero."
              : "Todavía no hay videos."}
        </p>
      </header>

      {/* On desktop "+ Agregar video" scrolls along with the list. */}
      {(writing || summaries.length > 0) && (
        <div
          className={`mt-6 flex flex-col gap-5 lg:mt-5 lg:scroll-py-4 ${SIDE_COLUMN_LIST}`}
        >
          {writing && (
            <AddVideo
              dateNote={`Se guarda con la fecha de hoy: ${mediumDate(todayDate)}.`}
              startOpen={videos.length === 0}
            />
          )}
          {summaries.length > 0 && (
            <VideoList videos={summaries} currentId={currentId} writing={writing} />
          )}
        </div>
      )}
    </section>
  );
}
