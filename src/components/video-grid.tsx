import Link from "next/link";
import type { Video } from "@/db/schema";
import {
  compactWeekdayDate,
  monthOf,
  monthTitle,
  tinyDate,
  weekdayDate,
} from "@/lib/dates";
import { formatDuration } from "@/lib/duration";
import { thumbnailUrl } from "@/lib/video-links";
import { Flower } from "./icons";
import { VideoThumbnail } from "./video-thumbnail";

/**
 * The videos as a grid of squares, by month, the newest first: two across on
 * phones, as many as fit on desktop. Each one opens its page.
 */
export function VideoGrid({ videos }: { videos: Video[] }) {
  const months: { month: string; videos: Video[] }[] = [];
  for (const video of videos) {
    const month = monthOf(video.date);
    if (months.at(-1)?.month !== month) months.push({ month, videos: [] });
    months.at(-1)!.videos.push(video);
  }

  return (
    <div className="flex flex-col gap-9 lg:gap-12">
      {months.map(({ month, videos }) => (
        <section
          key={month}
          aria-labelledby={`month-${month}`}
          className="flex flex-col gap-3 lg:gap-4"
        >
          <h2
            id={`month-${month}`}
            className="text-[13px] tracking-[0.24em] text-secondary uppercase lg:text-[14px]"
          >
            {monthTitle(month)}
          </h2>
          <ul className="grid grid-cols-2 gap-x-3 gap-y-5 lg:grid-cols-[repeat(auto-fill,minmax(min(240px,100%),1fr))] lg:gap-x-6 lg:gap-y-8">
            {videos.map((video) => (
              <li key={video.id} className="min-w-0">
                <VideoCard video={video} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function VideoCard({ video }: { video: Video }) {
  return (
    <Link
      href={`/videos/${video.id}`}
      className="group flex min-w-0 flex-col gap-2.5 lg:gap-3"
    >
      <VideoThumbnail
        src={thumbnailUrl(video)}
        day={tinyDate(video.date)}
        duration={video.durationSeconds ? formatDuration(video.durationSeconds) : null}
      />
      <span className="flex min-w-0 items-start gap-2 lg:gap-3">
        <span
          aria-hidden="true"
          className="flex size-7 shrink-0 items-center justify-center rounded-full border border-pink/40 bg-night-soft lg:size-9"
        >
          <Flower size={14} center="#221f3d" className="lg:size-[18px]" />
        </span>
        <span className="flex min-w-0 flex-col gap-0.5 lg:gap-[3px]">
          <span className="line-clamp-2 text-[18px] leading-[1.2] font-semibold break-words underline-offset-4 group-hover:underline lg:text-[21px]">
            {video.title}
          </span>
          <span className="text-[14px] text-secondary italic lg:text-[16px]">
            <span className="lg:hidden">{compactWeekdayDate(video.date)}</span>
            <span className="hidden lg:inline">{weekdayDate(video.date)}</span>
          </span>
        </span>
      </span>
    </Link>
  );
}
