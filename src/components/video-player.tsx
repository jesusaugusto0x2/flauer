import type { Video } from "@/db/schema";
import { tinyDate } from "@/lib/dates";
import { embedUrl } from "@/lib/video-links";
import { OutlineFlower } from "./icons";

const FRAME =
  "relative w-full overflow-hidden rounded-[12px] border border-light/12 bg-night-soft shadow-[0_24px_50px_rgba(0,0,0,0.45)] lg:rounded-[14px] lg:shadow-[0_30px_60px_rgba(0,0,0,0.5)]";

/**
 * Drive's or YouTube's own player, in a frame shaped like the video: 16:9, or
 * 9:16 for one recorded upright. Its width is up to the page.
 */
export function VideoPlayer({
  video,
}: {
  video: Pick<Video, "source" | "externalId" | "title" | "vertical">;
}) {
  return (
    <div className={`${FRAME} ${video.vertical ? "aspect-[9/16]" : "aspect-video"}`}>
      <iframe
        src={embedUrl(video)}
        title={`Video: ${video.title}`}
        allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        className="size-full border-0"
      />
    </div>
  );
}

/**
 * In the player's place while the video is locked: the diary's own picture (the
 * flower, the day written by hand, a play button), with nothing that leads to it.
 */
export function VideoPoster({ video }: { video: Pick<Video, "date" | "vertical"> }) {
  return (
    <div
      className={`${FRAME} ${video.vertical ? "aspect-[9/16]" : "aspect-video"} flex items-center justify-center`}
    >
      <OutlineFlower
        color="#e9b8c3"
        className="absolute -right-[10%] -bottom-[4%] h-auto w-[78%] opacity-20"
      />
      <span className="absolute top-3 left-4 font-hand text-[26px] font-semibold text-light/75 lg:top-3.5 lg:left-[18px] lg:text-[30px]">
        {tinyDate(video.date)}
      </span>
      <span
        aria-hidden="true"
        className="relative flex h-14 w-20 items-center justify-center rounded-[16px] bg-wine shadow-[0_8px_20px_rgba(0,0,0,0.4)] lg:h-16 lg:w-[92px] lg:rounded-[18px]"
      >
        <svg viewBox="0 0 16 16" className="size-[22px] lg:size-[26px]">
          <path d="M4.5 2.5 L13.5 8 L4.5 13.5 Z" fill="#ffffff" />
        </svg>
      </span>
    </div>
  );
}
