// Spotify links for song entries. Safe to import on the client.

const CONTENT_TYPES = [
  "track",
  "album",
  "playlist",
  "episode",
  "show",
  "artist",
] as const;

export type SpotifyContentType = (typeof CONTENT_TYPES)[number];

const ID_RE = /^[A-Za-z0-9]{22}$/;
const SHORT_CODE_RE = /^[A-Za-z0-9]{5,32}$/;
const MAX_LENGTH = 300;

const isContentType = (value: string): value is SpotifyContentType =>
  (CONTENT_TYPES as readonly string[]).includes(value);

/**
 * Checks that `input` is a link to something on Spotify and returns it in a clean
 * form, or null when it isn't one. Accepted:
 *
 * - `https://open.spotify.com/track/<id>` (also album, playlist, episode, show and
 *   artist), with or without `https://`, a regional `/intl-xx/` segment or the
 *   `?si=…` share parameter. Returned as `https://open.spotify.com/<type>/<id>`.
 * - `spotify:track:<id>` app URIs, returned as the web link above.
 * - `https://spotify.link/<code>` short links from the mobile app, returned as is.
 */
export function normalizeSpotifyUrl(input: string): string | null {
  const raw = input.trim();
  if (!raw || raw.length > MAX_LENGTH) return null;

  const uri = /^spotify:([a-z]+):([A-Za-z0-9]+)$/.exec(raw);
  if (uri) {
    const [, type, id] = uri;
    return isContentType(type) && ID_RE.test(id) ? webUrl(type, id) : null;
  }

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

  if (host === "spotify.link") {
    return segments.length === 1 && SHORT_CODE_RE.test(segments[0])
      ? `https://spotify.link/${segments[0]}`
      : null;
  }

  if (host !== "open.spotify.com" && host !== "play.spotify.com") return null;

  // Regional links look like /intl-es/track/<id>.
  if (segments[0]?.startsWith("intl-")) segments.shift();
  if (segments.length !== 2) return null;

  const [type, id] = segments;
  return isContentType(type) && ID_RE.test(id) ? webUrl(type, id) : null;
}

function webUrl(type: SpotifyContentType, id: string) {
  return `https://open.spotify.com/${type}/${id}`;
}
