import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { APP_DESCRIPTION, APP_NAME } from "@/lib/config";
import "./globals.css";

// Google Fonts' own latin files, kept in ./fonts (SIL Open Font License) so the
// build doesn't have to download them. Cormorant's are variable: one file per style.
const cormorant = localFont({
  variable: "--font-cormorant",
  src: [
    {
      path: "./fonts/cormorant-garamond-latin.woff2",
      weight: "400 600",
      style: "normal",
    },
    {
      path: "./fonts/cormorant-garamond-latin-italic.woff2",
      weight: "400 600",
      style: "italic",
    },
  ],
  adjustFontFallback: "Times New Roman",
});

const caveat = localFont({
  variable: "--font-caveat",
  src: "./fonts/caveat-latin.woff2",
  weight: "600",
});

const baseUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: { default: APP_NAME, template: `%s · ${APP_NAME}` },
  description: APP_DESCRIPTION,
  applicationName: APP_NAME,
  openGraph: {
    title: APP_NAME,
    description: APP_DESCRIPTION,
    siteName: APP_NAME,
    locale: "es_VE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: APP_NAME,
    description: APP_DESCRIPTION,
  },
};

export const viewport: Viewport = {
  themeColor: "#15142a",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${cormorant.variable} ${caveat.variable}`}>
      <body className="min-h-dvh">
        {/* A ~440px column on phones and tablets; a wider page from 1024px up. */}
        <div className="mx-auto w-full max-w-[440px] px-4 pt-6 pb-16 lg:max-w-[1248px] lg:px-6 lg:pt-8 lg:pb-14">
          {children}
        </div>
      </body>
    </html>
  );
}
