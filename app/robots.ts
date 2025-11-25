import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/auth/",
          "/dashboard/",
          "/onboarding/",
          "/api/",
          "/unathorized",
        ],
      },
    ],
    sitemap: "https://suite33.vercel.app/sitemap.xml",
  };
}
