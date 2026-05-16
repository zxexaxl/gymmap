import type { MetadataRoute } from "next";

import { getLocations, getProgramLandingSlugs } from "@/lib/data";
import { buildProgramPath, getSiteUrl } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const [locations, programSlugs] = await Promise.all([
    getLocations(),
    getProgramLandingSlugs(),
  ]);
  const now = new Date();

  return [
    {
      url: siteUrl,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    ...locations.map((location) => ({
      url: `${siteUrl}/locations/${location.slug}`,
      lastModified: location.last_verified_at || location.updated_at,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...programSlugs.map((slug) => ({
      url: `${siteUrl}${buildProgramPath(slug)}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
