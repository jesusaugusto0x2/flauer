import type { Video } from "@/db/schema";
import { embedUrl } from "@/lib/video-links";

const FRAME =
  "w-full overflow-hidden rounded-[12px] border border-light/12 bg-night-soft shadow-[0_24px_50px_rgba(0,0,0,0.45)] lg:rounded-[14px] lg:shadow-[0_30px_60px_rgba(0,0,0,0.5)]";

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
