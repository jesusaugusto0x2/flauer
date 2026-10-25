// Links to videos on Google Drive or YouTube. Safe to import on the client.
import type { VideoSource } from "@/db/schema";

export type VideoRef = { source: VideoSource; externalId: string };

const DRIVE_ID_RE = /^[A-Za-z0-9_-]{20,100}$/;
const YOUTUBE_ID_RE = /^[A-Za-z0-9_-]{11}$/;
const MAX_LENGTH = 500;

const DRIVE_HOSTS = ["drive.google.com", "docs.google.com"];
const YOUTUBE_HOSTS = [
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
];
const DRIVE_FILE_VIEWS = ["view", "preview", "edit"];

export const SOURCE_NAME: Record<VideoSource, string> = {
  drive: "Drive",
  youtube: "YouTube",
};

/**
 * Reads a link to a video and returns where it is, or null when it isn't a link
 * to one. Accepted:
 *
 * - Drive: `drive.google.com/file/d/<id>/view` (also `/preview`, `/edit`, or with
 *   `/u/<n>/` when signed in to several accounts), `drive.google.com/open?id=<id>`
 *   and `drive.google.com/uc?id=<id>`. Folders and documents aren't videos.
 * - YouTube: `youtube.com/watch?v=<id>`, `youtu.be/<id>`, and `/shorts/<id>`,
 *   `/embed/<id>` or `/live/<id>` on youtube.com.
 */
export function parseVideoLink(input: string): VideoRef | null {
  const raw = input.trim();
  if (!raw || raw.length > MAX_LENGTH) return null;

  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  if (url.username || url.password || url.port) return null;

  const host = url.hostname.toLowerCase();
  const segments = url.pathname.split("/").filter(Boolean);

  if (DRIVE_HOSTS.includes(host)) return driveFile(segments, url.searchParams);
  if (host === "youtu.be") return segments.length === 1 ? youtube(segments[0]) : null;
  if (YOUTUBE_HOSTS.includes(host)) {
    if (segments.length === 1 && segments[0] === "watch") {
      return youtube(url.searchParams.get("v"));
    }
    if (segments.length === 2 && ["shorts", "embed", "live"].includes(segments[0])) {
      return youtube(segments[1]);
    }
  }
  return null;
}

function driveFile(segments: string[], params: URLSearchParams): VideoRef | null {
  // /file/u/1/d/<id>/view is the same file, opened from a second account.
  const path =
    segments[0] === "file" && segments[1] === "u" && /^\d+$/.test(segments[2] ?? "")
      ? ["file", ...segments.slice(3)]
      : segments;

  if (path[0] === "file" && path[1] === "d") {
    const [, , id, view, ...rest] = path;
    if (rest.length || (view !== undefined && !DRIVE_FILE_VIEWS.includes(view))) {
      return null;
    }
    return drive(id);
  }
  if (path.length === 1 && (path[0] === "open" || path[0] === "uc")) {
    return drive(params.get("id"));
  }
  return null;
}

function drive(id: string | null | undefined): VideoRef | null {
  return id && DRIVE_ID_RE.test(id) ? { source: "drive", externalId: id } : null;
}

function youtube(id: string | null | undefined): VideoRef | null {
  return id && YOUTUBE_ID_RE.test(id) ? { source: "youtube", externalId: id } : null;
}

/** What the page embeds: Drive's or YouTube's own player, never another site. */
export function embedUrl({ source, externalId }: VideoRef) {
  return source === "drive"
    ? `https://drive.google.com/file/d/${externalId}/preview`
    : `https://www.youtube-nocookie.com/embed/${externalId}?rel=0&playsinline=1`;
}

/**
 * A still of the video. Drive's address isn't documented and only works for files
 * shared publicly, so the page keeps a picture of its own for when it fails.
 */
export function thumbnailUrl({ source, externalId }: VideoRef) {
  return source === "drive"
    ? `https://drive.google.com/thumbnail?id=${externalId}&sz=w640`
    : `https://i.ytimg.com/vi/${externalId}/hqdefault.jpg`;
}

/**
 * The video on Drive or YouTube itself: for when the embedded player won't load,
 * and to fill the edit form (only the ID is stored).
 */
export function openUrl({ source, externalId }: VideoRef) {
  return source === "drive"
    ? `https://drive.google.com/file/d/${externalId}/view`
    : `https://www.youtube.com/watch?v=${externalId}`;
}
