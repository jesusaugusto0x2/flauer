import "server-only";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { videos, type Video } from "@/db/schema";
import { today } from "./dates";
import { isValidId } from "./entries";
import type { VideoInput } from "./validation";

/** Every video, the newest first. */
export async function listVideos(): Promise<Video[]> {
  return db().select().from(videos).orderBy(desc(videos.createdAt), desc(videos.id));
}

export async function getVideo(id: string): Promise<Video | undefined> {
  if (!isValidId(id)) return undefined;
  const [video] = await db().select().from(videos).where(eq(videos.id, id)).limit(1);
  return video;
}

/** Saves a new video with today's date: the day it was added. */
export async function createVideo(data: VideoInput) {
  const [video] = await db()
    .insert(videos)
    .values({ ...data, date: today() })
    .returning({ id: videos.id });
  return video.id;
}

/** Changes what the video is and says; the day it was added stays. */
export async function updateVideo(id: string, data: VideoInput) {
  const rows = await db()
    .update(videos)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(videos.id, id))
    .returning({ id: videos.id });
  return rows.length > 0;
}

export async function deleteVideo(id: string) {
  const rows = await db()
    .delete(videos)
    .where(eq(videos.id, id))
    .returning({ id: videos.id });
  return rows.length > 0;
}
