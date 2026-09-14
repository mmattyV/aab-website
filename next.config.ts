import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.public.blob.vercel-storage.com",
        pathname: "/**",
      },
    ],
    // Profile photos are immutable — a new upload writes a new blob URL — so
    // letting the optimizer cache expire after the 4h default just means
    // paying the (slow) transform cost again on the next cold request.
    minimumCacheTTL: 31536000, // 1 year
    // Every distinct width is a separate transform + cache entry. Our largest
    // source is 2560px wide and nothing renders above 100vw, so the 750/1200/
    // 2048/3840 defaults only ever fragment the cache.
    deviceSizes: [640, 828, 1080, 1920, 2560],
    // 460 = the 230px card at 2x DPR.
    imageSizes: [32, 48, 64, 96, 128, 256, 384, 460],
    // Next 16 only serves qualities listed here. 75 is the default used by the
    // profile photos; 88 is for the full-bleed homepage photos, where the
    // default was visibly soft on faces and on the tie patterns.
    qualities: [75, 88],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb", // if you also needed to raise the body size
    },
  },
};

export default nextConfig;
