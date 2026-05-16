import { getProgramLandingSlugs } from "@/lib/data";
import { buildProgramPath, getSiteUrl } from "@/lib/site";

export const revalidate = 3600;

export async function GET() {
  const siteUrl = getSiteUrl();
  const programSlugs = await getProgramLandingSlugs();
  const now = new Date().toISOString();

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${programSlugs
  .map(
    (slug) => `  <url>
    <loc>${siteUrl}${buildProgramPath(slug)}</loc>
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
