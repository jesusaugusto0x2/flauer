"use client";

import { useEffect } from "react";
import { sharedView } from "@/app/actions";
import type { ShareTarget } from "@/lib/shares";

// Reported in this page load: once per item, even if the effect runs again
// (React's development double run, or the page coming back into view).
const reported = new Set<string>();

/**
 * On a page opened through a share link: tells the server once a browser
 * really shows it, so the owner hears about the visit. Link previews and
 * scanners only fetch the page and never run this; a page Chrome prerenders
 * waits until it's actually opened. Renders nothing.
 */
export function ShareViewBeacon({
  kind,
  id,
  code,
}: {
  kind: ShareTarget["kind"];
  id: string;
  code: string;
}) {
  useEffect(() => {
    const key = `${kind}:${id}:${code}`;
    const report = () => {
      const prerendering = (document as Document & { prerendering?: boolean })
        .prerendering;
      if (reported.has(key) || prerendering || document.visibilityState !== "visible") {
        return;
      }
      reported.add(key);
      void sharedView(kind, id, code);
    };
    report();
    document.addEventListener("visibilitychange", report);
    document.addEventListener("prerenderingchange", report);
    return () => {
      document.removeEventListener("visibilitychange", report);
      document.removeEventListener("prerenderingchange", report);
    };
  }, [kind, id, code]);

  return null;
}
