import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { createClient } from "@supabase/supabase-js";

import { programMaster } from "@/lib/program-master";
import { buildProgramPath, getSiteUrl } from "@/lib/site";

type GymLocationRow = {
  slug: string;
  is_active: boolean;
  last_verified_at: string | null;
  updated_at: string;
};

type ProgramRow = {
  name: string;
  slug: string;
};

function loadDotEnvFile(filename: string) {
  const filepath = join(process.cwd(), filename);

  if (!existsSync(filepath)) {
    return;
  }

  const source = readFileSync(filepath, "utf8");

  source.split(/\r?\n/).forEach((line) => {
    if (!line || line.trim().startsWith("#")) {
      return;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex <= 0) {
      return;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();

    if (!process.env[key]) {
      process.env[key] = value;
    }
  });
}

function xmlEscape(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function buildUrlSet(
  entries: Array<{
    loc: string;
    lastmod: string;
    changefreq: "daily" | "weekly";
    priority: number;
  }>,
) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(
    (entry) => `  <url>
    <loc>${xmlEscape(entry.loc)}</loc>
    <lastmod>${xmlEscape(entry.lastmod)}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`,
  )
  .join("\n")}
</urlset>
`;
}

function buildSitemapIndex(urls: string[]) {
  const now = new Date().toISOString();

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `  <sitemap>
    <loc>${xmlEscape(url)}</loc>
    <lastmod>${xmlEscape(now)}</lastmod>
  </sitemap>`,
  )
  .join("\n")}
</sitemapindex>
`;
}

async function main() {
  loadDotEnvFile(".env.local");
  loadDotEnvFile(".env");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase environment variables are not configured.");
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
  const siteUrl = getSiteUrl();
  const now = new Date().toISOString();
  const publicDir = join(process.cwd(), "public");
  const seoProgramNameSet = new Set(programMaster.map((entry) => entry.canonicalProgramName));

  mkdirSync(publicDir, { recursive: true });

  const { data: locations, error: locationsError } = await supabase
    .from("gym_locations")
    .select("slug, is_active, last_verified_at, updated_at")
    .eq("is_active", true)
    .order("slug");

  if (locationsError) {
    throw locationsError;
  }

  const { data: programs, error: programsError } = await supabase
    .from("programs")
    .select("name, slug")
    .in("name", Array.from(seoProgramNameSet))
    .order("name");

  if (programsError) {
    throw programsError;
  }

  const locationEntries = ((locations as GymLocationRow[] | null) ?? []).map((location) => ({
    loc: `${siteUrl}/locations/${location.slug}`,
    lastmod: location.last_verified_at || location.updated_at,
    changefreq: "weekly" as const,
    priority: 0.8,
  }));

  const programEntries = ((programs as ProgramRow[] | null) ?? []).map((program) => ({
    loc: `${siteUrl}${buildProgramPath(program.slug)}`,
    lastmod: now,
    changefreq: "weekly" as const,
    priority: 0.8,
  }));

  const coreEntries = [
    {
      loc: `${siteUrl}/`,
      lastmod: now,
      changefreq: "daily" as const,
      priority: 1,
    },
    {
      loc: `${siteUrl}/programs/bodycombat`,
      lastmod: now,
      changefreq: "weekly" as const,
      priority: 0.8,
    },
    {
      loc: `${siteUrl}/locations/jexer-shinjuku`,
      lastmod: now,
      changefreq: "weekly" as const,
      priority: 0.8,
    },
  ];

  writeFileSync(join(publicDir, "sitemap-core.xml"), buildUrlSet(coreEntries), "utf8");
  writeFileSync(join(publicDir, "sitemap-locations.xml"), buildUrlSet(locationEntries), "utf8");
  writeFileSync(join(publicDir, "sitemap-programs.xml"), buildUrlSet(programEntries), "utf8");
  writeFileSync(
    join(publicDir, "sitemap.xml"),
    buildSitemapIndex([
      `${siteUrl}/sitemap-core.xml`,
      `${siteUrl}/sitemap-programs.xml`,
    ]),
    "utf8",
  );
}

void main().catch((error) => {
  console.error("[generate-static-sitemaps]", error instanceof Error ? error.message : String(error));
  process.exit(1);
});
