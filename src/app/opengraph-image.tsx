import { ImageResponse } from "next/og";
import { APP_NAME, APP_SUBTITLE } from "@/lib/config";

export const alt = APP_NAME;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#15142a",
        color: "#efe7da",
      }}
    >
      <svg viewBox="0 0 12 12" width={140} height={140}>
        <g fill="#e9b8c3">
          <circle cx="6" cy="3.1" r="2" />
          <circle cx="8.8" cy="5.1" r="2" />
          <circle cx="7.7" cy="8.4" r="2" />
          <circle cx="4.3" cy="8.4" r="2" />
          <circle cx="3.2" cy="5.1" r="2" />
        </g>
        <circle cx="6" cy="6" r="1.3" fill="#15142a" />
      </svg>
      <div style={{ marginTop: 40, fontSize: 28, letterSpacing: 10, color: "#b9b0c4" }}>
        DIARIO DE POEMAS
      </div>
      <div style={{ marginTop: 12, fontSize: 110 }}>{APP_NAME}</div>
      <div style={{ marginTop: 8, fontSize: 40, color: "#b9b0c4", fontStyle: "italic" }}>
        {APP_SUBTITLE}
      </div>
    </div>,
    size,
  );
}
