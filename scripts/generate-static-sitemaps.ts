import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { createClient } from "@supabase/supabase-js";

import { programMaster } from "@/lib/program-master";
import { filterLatestSchedulePeriods } from "@/lib/latest-schedule-period";
import { shouldIndexAreaProgramPage } from "@/lib/seo-indexing";
import { buildAreaProgramPath, buildProgramPath, getSiteUrl } from "@/lib/site";
import { getLocationAreaNames } from "@/lib/utils";

type GymLocationRow = {
  id: string;
  slug: string;
  is_active: boolean;
  prefecture: string | null;
  city: string | null;
  last_verified_at: string | null;
  updated_at: string;
};

type ProgramRow = {
  id: string;
  name: string;
  slug: string;
};

type ClassScheduleSitemapRow = {
  location_id: string;
  program_id: string;
  valid_from: string | null;
  updated_at: string;
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
    .select("id, slug, is_active, prefecture, city, last_verified_at, updated_at")
    .eq("is_active", true)
    .order("slug");

  if (locationsError) {
    throw locationsError;
  }

  const { data: programs, error: programsError } = await supabase
    .from("programs")
    .select("id, name, slug")
    .in("name", Array.from(seoProgramNameSet))
    .order("name");

  if (programsError) {
    throw programsError;
  }

  const scheduleRows: ClassScheduleSitemapRow[] = [];
  const schedulePageSize = 1000;
  let scheduleFrom = 0;

  while (true) {
    const { data: schedules, error: schedulesError } = await supabase
      .from("class_schedules")
      .select("location_id, program_id, valid_from, updated_at")
      .order("id", { ascending: true })
      .range(scheduleFrom, scheduleFrom + schedulePageSize - 1);

    if (schedulesError) {
      throw schedulesError;
    }

    const batch = (schedules as ClassScheduleSitemapRow[] | null) ?? [];
    scheduleRows.push(...batch);

    if (batch.length < schedulePageSize) {
      break;
    }

    scheduleFrom += schedulePageSize;
  }

  const activeLocations = new Map(
    ((locations as GymLocationRow[] | null) ?? []).map((location) => [location.id, location]),
  );
  const seoPrograms = new Map(
    ((programs as ProgramRow[] | null) ?? []).map((program) => [program.id, program]),
  );
  const areaGroups = new Map<
    string,
    {
      areaName: string;
      program: ProgramRow;
      scheduleCount: number;
      locationIds: Set<string>;
      lastmod: string;
    }
  >();

  const latestScheduleRows = filterLatestSchedulePeriods(scheduleRows);
  const scheduledLocationIds = new Set<string>();
  const scheduledSeoProgramIds = new Set<string>();

  latestScheduleRows.forEach((schedule) => {
    const location = activeLocations.get(schedule.location_id);
    const program = seoPrograms.get(schedule.program_id);

    if (location) {
      scheduledLocationIds.add(location.id);
    }

    if (program) {
      scheduledSeoProgramIds.add(program.id);
    }

    if (!location || !program) {
      return;
    }

    getLocationAreaNames(location.prefecture, location.city).forEach((areaName) => {
      const key = `${program.id}\u0000${areaName}`;
      const group = areaGroups.get(key) ?? {
        areaName,
        program,
        scheduleCount: 0,
        locationIds: new Set<string>(),
        lastmod: schedule.updated_at,
      };

      group.scheduleCount += 1;
      group.locationIds.add(location.id);

      if (new Date(schedule.updated_at).getTime() > new Date(group.lastmod).getTime()) {
        group.lastmod = schedule.updated_at;
      }

      areaGroups.set(key, group);
    });
  });

  const locationEntries = ((locations as GymLocationRow[] | null) ?? [])
    .filter((location) => scheduledLocationIds.has(location.id))
    .map((location) => ({
      loc: `${siteUrl}/locations/${location.slug}`,
      lastmod: location.last_verified_at || location.updated_at,
      changefreq: "weekly" as const,
      priority: 0.8,
    }));

  const programEntries = ((programs as ProgramRow[] | null) ?? [])
    .filter((program) => scheduledSeoProgramIds.has(program.id))
    .map((program) => ({
      loc: `${siteUrl}${buildProgramPath(program.slug)}`,
      lastmod: now,
      changefreq: "weekly" as const,
      priority: 0.8,
    }));
  const areaEntries = Array.from(areaGroups.values())
    .filter((group) =>
      shouldIndexAreaProgramPage({
        locationCount: group.locationIds.size,
        scheduleCount: group.scheduleCount,
      }),
    )
    .map((group) => ({
      loc: `${siteUrl}${buildAreaProgramPath(group.areaName, group.program.slug)}`,
      lastmod: group.lastmod,
      changefreq: "weekly" as const,
      priority: 0.7,
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
  writeFileSync(join(publicDir, "sitemap-areas.xml"), buildUrlSet(areaEntries), "utf8");
  writeFileSync(
    join(publicDir, "sitemap.xml"),
    buildSitemapIndex([
      `${siteUrl}/sitemap-core.xml`,
      `${siteUrl}/sitemap-locations.xml`,
      `${siteUrl}/sitemap-programs.xml`,
      `${siteUrl}/sitemap-areas.xml`,
    ]),
    "utf8",
  );
}

void main().catch((error) => {
  console.error("[generate-static-sitemaps]", error instanceof Error ? error.message : String(error));
  process.exit(1);
});
