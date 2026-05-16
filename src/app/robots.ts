import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/"],
      },
    ],
    sitemap: [`${getSiteUrl()}/sitemap-core.xml`, `${getSiteUrl()}/sitemap-programs.xml`],
    host: getSiteUrl(),
  };
}
