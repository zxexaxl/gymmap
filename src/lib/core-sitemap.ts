export type CoreSitemapEntry = {
  loc: string;
  lastmod: string;
  changefreq: "daily" | "weekly";
  priority: number;
};

export function buildCoreSitemapEntries(siteUrl: string, lastmod: string): CoreSitemapEntry[] {
  return [
    {
      loc: `${siteUrl}/`,
      lastmod,
      changefreq: "daily",
      priority: 1,
    },
    {
      loc: `${siteUrl}/programs/bodycombat`,
      lastmod,
      changefreq: "weekly",
      priority: 0.8,
    },
    {
      loc: `${siteUrl}/locations/jexer-shinjuku`,
      lastmod,
      changefreq: "weekly",
      priority: 0.8,
    },
    {
      loc: `${siteUrl}/training/hyrox`,
      lastmod,
      changefreq: "weekly",
      priority: 0.9,
    },
  ];
}
