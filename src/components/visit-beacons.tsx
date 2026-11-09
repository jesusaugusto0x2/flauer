"use client";

import { useEffect } from "react";
import { dayView, sharedView } from "@/app/actions";
import type { ShareTarget } from "@/lib/shares";

// Visits that email the owner are reported from the browser, once the page is
// really shown: link previews and scanners only fetch pages and never run this,
// and a page Chrome prerenders waits until it's actually opened. Each one is
// reported once per page load, even if the effect runs again (React's
// development double run, or the page coming back into view).
const reported = new Set<string>();

function reportWhenShown(key: string, report: () => void) {
  const send = () => {
    const prerendering = (document as Document & { prerendering?: boolean }).prerendering;
    if (reported.has(key) || prerendering || document.visibilityState !== "visible")
      return;
    reported.add(key);
    report();
  };
  send();
  document.addEventListener("visibilitychange", send);
  document.addEventListener("prerenderingchange", send);
  return () => {
    document.removeEventListener("visibilitychange", send);
    document.removeEventListener("prerenderingchange", send);
  };
}

/** On a page opened through a share link. Renders nothing. */
export function ShareViewBeacon({
  kind,
  id,
  code,
}: {
  kind: ShareTarget["kind"];
  id: string;
  code: string;
}) {
  useEffect(
    () =>
      reportWhenShown(
        `share:${kind}:${id}:${code}`,
        () => void sharedView(kind, id, code),
      ),
    [kind, id, code],
  );
  return null;
}

/** On a day's page, for anyone without the owner's session. Renders nothing. */
export function DayVisitBeacon({ date }: { date: string }) {
  useEffect(() => reportWhenShown(`day:${date}`, () => void dayView(date)), [date]);
  return null;
}
