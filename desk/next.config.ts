import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pulse cards may hotlink X/CDN media; keep remote patterns open for P0.
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
