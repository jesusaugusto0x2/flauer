"use client";

import Image from "next/image";
import { useState } from "react";
import { OutlineFlower } from "./icons";

const SIZES = {
  // A square in the list, with the length in the corner.
  card: {
    box: "rounded-[12px] border-light/10 lg:rounded-[14px]",
    play: "h-9 w-[52px] rounded-[11px] lg:h-12 lg:w-[68px] lg:rounded-[14px]",
    icon: "size-3.5 lg:size-[18px]",
  },
  // The small square beside "Anterior" / "Siguiente".
  mini: {
    box: "rounded-[8px] border-light/12",
    play: "h-[18px] w-[26px] rounded-[6px]",
    icon: "size-[9px]",
  },
} as const;

/**
 * A video's picture: its own still from Drive or YouTube or, when that doesn't
 * load, the diary's: a dark square with the flower, the day written by hand and
 * a play button.
 */
export function VideoThumbnail({
  src,
  day,
  duration,
  size = "card",
}: {
  src: string;
  /** "24 oct", written on the diary's picture. */
  day: string;
  /** "1:23", when it's known. */
  duration?: string | null;
  size?: keyof typeof SIZES;
}) {
  const [failed, setFailed] = useState(false);
  const look = SIZES[size];
  const card = size === "card";

  return (
    <span
      className={`relative flex aspect-square w-full items-center justify-center overflow-hidden border bg-night-soft ${look.box}`}
    >
      {failed ? (
        <>
          {card && (
            <>
              <OutlineFlower
                color="#e9b8c3"
                className="absolute -right-[8%] -bottom-[14%] h-auto w-[64%] opacity-[0.22]"
              />
              <span className="absolute top-2 left-2.5 font-hand text-[18px] font-semibold text-light/75 lg:top-2.5 lg:left-3.5 lg:text-[24px]">
                {day}
              </span>
            </>
          )}
          <span
            aria-hidden="true"
            className={`relative flex items-center justify-center bg-wine shadow-[0_6px_16px_rgba(0,0,0,0.35)] ${look.play}`}
          >
            <svg viewBox="0 0 16 16" className={look.icon}>
              <path d="M4.5 2.5 L13.5 8 L4.5 13.5 Z" fill="#ffffff" />
            </svg>
          </span>
        </>
      ) : (
        <Image
          src={src}
          alt=""
          fill
          unoptimized
          sizes={card ? "(min-width: 1024px) 300px, 50vw" : "76px"}
          className="object-cover"
          onError={() => setFailed(true)}
        />
      )}
      {card && duration && (
        <span className="absolute right-2 bottom-2 rounded-[4px] bg-black/78 px-1.5 py-0.5 font-sans text-[12px] font-semibold text-white lg:right-2.5 lg:bottom-2.5 lg:rounded-[5px] lg:px-[7px] lg:py-[3px] lg:text-[13px]">
          <span className="sr-only">Duración: </span>
          {duration}
        </span>
      )}
    </span>
  );
}
