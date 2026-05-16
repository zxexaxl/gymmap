import { getLocations } from "@/lib/data";
import { getSiteUrl } from "@/lib/site";

export const revalidate = 3600;

export async function GET() {
  const siteUrl = getSiteUrl();
  const locations = await getLocations();

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${locations
  .map(
    (location) => `  <url>
    <loc>${siteUrl}/locations/${location.slug}</loc>
    <lastmod>${location.last_verified_at || location.updated_at}</lastmod>
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
