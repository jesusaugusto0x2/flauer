/**
 * Desktop side columns (the day next to the calendar, the day's list while
 * reading or writing). They start below the site header (~161px), so their height
 * is capped to fit the window from there; long lists scroll inside. Sticky keeps
 * them in view when a short window makes the page itself scroll.
 */
export const SIDE_COLUMN = "lg:sticky lg:top-6 lg:max-h-[calc(100dvh-11.5rem)]";

/**
 * A list of cards that fills the rest of such a column and scrolls inside it
 * (with room for the cards' shadows). On phones the page scrolls instead.
 */
export const SIDE_COLUMN_LIST =
  "lg:-mx-3 lg:min-h-0 lg:flex-1 lg:scroll-area lg:px-3 lg:pt-1 lg:pb-6";
