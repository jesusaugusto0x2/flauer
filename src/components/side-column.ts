/**
 * Desktop side columns (the day next to the calendar, the day's list while
 * reading or writing). They start below the site header (~161px), so their height
 * is capped to fit the window from there; long lists scroll inside. Sticky keeps
 * them in view when a short window makes the page itself scroll.
 */
export const SIDE_COLUMN = "lg:sticky lg:top-6 lg:max-h-[calc(100dvh-11.5rem)]";
