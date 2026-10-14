import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Poems used to live at /poem/[id]; every entry is read at /entry/[id] now.
  redirects() {
    return [{ source: "/poem/:id", destination: "/entry/:id", permanent: true }];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
