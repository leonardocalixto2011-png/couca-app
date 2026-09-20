import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "*.public.blob.vercel-storage.com" }],
  },
  experimental: {
    // Inspo photos are downsized in the browser (~300 KB each, max 3), but
    // leave headroom above the 1 MB default.
    serverActions: { bodySizeLimit: "8mb" },
  },
};

export default nextConfig;
