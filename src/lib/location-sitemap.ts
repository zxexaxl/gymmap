export type LocationSitemapRow = {
  slug: string;
  is_active: boolean;
  last_verified_at: string | null;
  updated_at: string;
};

export function buildLocationSitemapEntries(locations: LocationSitemapRow[], siteUrl: string) {
  return locations
    .filter((location) => location.is_active)
    .map((location) => ({
      loc: `${siteUrl}/locations/${location.slug}`,
      lastmod: location.last_verified_at || location.updated_at,
      changefreq: "weekly" as const,
      priority: 0.8,
    }));
}
