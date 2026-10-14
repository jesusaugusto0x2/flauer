import type { Metadata, Viewport } from "next";
import { Caveat, Cormorant_Garamond } from "next/font/google";
import { APP_DESCRIPTION, APP_NAME } from "@/lib/config";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "600"],
  style: ["normal", "italic"],
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
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
