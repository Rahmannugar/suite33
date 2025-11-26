import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "euacyohjjhbyixgajxdn.supabase.co",
      },
    ],
  },

  typescript: {
    ignoreBuildErrors: true,
  },

  eslint: {
    ignoreDuringBuilds: true,
  },

  serverExternalPackages: ["@prisma/client", "prisma"],
};

export default nextConfig;
