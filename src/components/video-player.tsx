import type { ReactNode } from "react";
import type { Video } from "@/db/schema";
import { embedUrl } from "@/lib/video-links";

const FRAME =
  "overflow-hidden rounded-[6px] bg-black shadow-[0_20px_40px_rgba(0,0,0,0.45)] lg:shadow-[0_30px_60px_rgba(0,0,0,0.45)]";

/**
 * Drive's or YouTube's own player, in a frame shaped like the video: 16:9, or
 * 9:16 for one recorded upright (no taller than most of the window).
 */
export function VideoPlayer({
  video,
}: {
  video: Pick<Video, "source" | "externalId" | "title" | "vertical">;
}) {
  return (
    <div
      className={`${FRAME} ${
        video.vertical
          ? "mx-auto aspect-[9/16] w-full max-w-[calc(min(78dvh,720px)*9/16)]"
          : "aspect-video w-full"
      }`}
    >
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

/** Where the player goes on desktop until a video is chosen. */
export function PlayerPlaceholder({ children }: { children: ReactNode }) {
  return (
    <div className="flex aspect-video w-full items-center justify-center rounded-[6px] border border-dashed border-light/25 px-8 text-center text-[19px] text-secondary italic">
      {children}
    </div>
  );
}
