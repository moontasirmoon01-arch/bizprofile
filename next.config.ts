import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
    ],
  },
  experimental: {
    outputFileTracingIncludes: {
      "/api/ai/generate-image": ["./public/fonts/**/*"],
    },
  },
};

export default nextConfig;
