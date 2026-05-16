import { getSiteUrl } from "@/lib/site";

export const revalidate = 3600;

export async function GET() {
  const siteUrl = getSiteUrl();
  const urls = [
    `${siteUrl}/programs/bodycombat`,
    `${siteUrl}/programs/bodypump`,
    `${siteUrl}/programs/%E3%83%A8%E3%82%AC`,
    `${siteUrl}/programs/%E3%83%94%E3%83%A9%E3%83%86%E3%82%A3%E3%82%B9`,
    `${siteUrl}/programs/zumba`,
  ];
  const now = new Date().toISOString();

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `  <url>
    <loc>${url}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`,
  )
  .join("\n")}
</urlset>
`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
