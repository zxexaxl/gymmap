import "./load-env";

import { readFile } from "node:fs/promises";
import path from "node:path";

import { createClient } from "@supabase/supabase-js";

import type { JexerExtractionResult, NormalizedExtractedJexerScheduleRecord } from "../../src/lib/extraction/jexer-types";

type ProgramRow = {
  id: string;
  name: string;
  slug: string;
  category: string | null;
  default_duration_minutes: number | null;
};

type LocationRow = {
  id: string;
  name: string;
};

type ClassScheduleRow = {
  id: string;
  location_id: string;
  weekday: string;
  start_time: string;
  end_time: string;
  raw_program_name: string;
  source_page_url: string | null;
};

function parseArgs(argv: string[]) {
  const args = argv.slice(2);
  const result: { file?: string; dryRun: boolean } = { dryRun: false };

  args.forEach((arg) => {
    if (arg.startsWith("--file=")) {
      result.file = arg.replace("--file=", "");
    }

    if (arg === "--dry-run") {
      result.dryRun = true;
    }
  });

  return result;
}

function getImportSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !serviceRoleKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured.");
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function getProjectRefFromUrl(url: string) {
  try {
    const hostname = new URL(url).hostname;
    return hostname.endsWith(".supabase.co") ? hostname.replace(/\.supabase\.co$/, "") : hostname;
  } catch {
    return null;
  }
}

function getEnvSource(key: string) {
  return process.env[`CODEX_ENV_SOURCE_${key}`] ?? "unknown";
}

async function logImportConnectionInfo() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const projectRef = url ? getProjectRefFromUrl(url) : null;

  console.log("[import:jexer] connection");
  console.log(`  supabase_url=${url || "(missing)"}`);
  console.log(`  project_ref=${projectRef ?? "(unknown)"}`);
  console.log(`  env_source:NEXT_PUBLIC_SUPABASE_URL=${getEnvSource("NEXT_PUBLIC_SUPABASE_URL")}`);
  console.log(`  env_source:SUPABASE_SERVICE_ROLE_KEY=${getEnvSource("SUPABASE_SERVICE_ROLE_KEY")}`);
}

async function logPostImportVerification({
  supabase,
  locationIds,
  locationNamesById,
  snapshotId,
}: {
  supabase: ReturnType<typeof getImportSupabaseClient>;
  locationIds: string[];
  locationNamesById: Map<string, string>;
  snapshotId: string;
}) {
  if (locationIds.length === 0) {
    return;
  }

  console.log("[import:jexer] verification");

  for (const locationId of locationIds) {
    const locationName = locationNamesById.get(locationId) ?? locationId;

    const [{ count: totalCount, error: totalError }, { count: snapshotCount, error: snapshotError }] = await Promise.all([
      supabase.from("class_schedules").select("*", { count: "exact", head: true }).eq("location_id", locationId),
      supabase
        .from("class_schedules")
        .select("*", { count: "exact", head: true })
        .eq("location_id", locationId)
        .eq("source_snapshot_id", snapshotId),
    ]);

    if (totalError || snapshotError) {
      console.warn(
        `[import:jexer] verification failed for ${locationName}: ${totalError?.message ?? snapshotError?.message ?? "unknown error"}`,
      );
      continue;
    }

    console.log(
      `  location=${locationName} total_schedule_count=${totalCount ?? 0} snapshot_schedule_count=${snapshotCount ?? 0}`,
    );
  }
}

function normalizeNameKey(value: string) {
  return value.normalize("NFKC").toLowerCase().replace(/\s+/g, "");
}

function buildProgramSlugBase(value: string) {
  const normalized = value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[／/]/g, "-")
    .replace(/[()（）【】\[\]]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9ぁ-んァ-ヶ一-龠-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return normalized || "program";
}

function buildUniqueSlug(base: string, existingSlugs: Set<string>) {
  let candidate = base;
  let suffix = 2;

  while (existingSlugs.has(candidate)) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }

  existingSlugs.add(candidate);
  return candidate;
}

function buildScheduleLookupKey(record: {
  location_id: string;
  weekday: string;
  start_time: string;
  end_time: string;
  raw_program_name: string;
  source_page_url: string | null;
}) {
  return [
    record.location_id,
    record.weekday,
    record.start_time,
    record.end_time,
    normalizeNameKey(record.raw_program_name),
    record.source_page_url ?? "",
  ].join("::");
}

async function readExtractionFile(filePath: string) {
  const resolvedPath = path.resolve(process.cwd(), filePath);
  const json = await readFile(resolvedPath, "utf-8");
  return JSON.parse(json) as JexerExtractionResult;
}

async function ensureProgramId({
  record,
  programsByName,
  slugs,
  supabase,
  dryRun,
}: {
  record: NormalizedExtractedJexerScheduleRecord;
  programsByName: Map<string, ProgramRow>;
  slugs: Set<string>;
  supabase: ReturnType<typeof getImportSupabaseClient>;
  dryRun: boolean;
}) {
  const preferredName = record.canonical_program_name || record.raw_program_name;
  const preferredKey = normalizeNameKey(preferredName);
  const rawKey = normalizeNameKey(record.raw_program_name);
  const existingProgram = programsByName.get(preferredKey) || programsByName.get(rawKey);

  if (existingProgram) {
    return existingProgram.id;
  }

  const slug = buildUniqueSlug(buildProgramSlugBase(preferredName), slugs);
  const newProgram = {
    name: preferredName,
    slug,
    category: record.category_primary ?? "other",
    description: record.canonical_program_name ? `Imported from JEXER extraction: ${record.canonical_program_name}` : "Imported from JEXER extraction",
    intensity_level: null,
    beginner_friendly: false,
    default_duration_minutes: record.duration_minutes,
  };

  if (dryRun) {
    const fakeProgram: ProgramRow = {
      id: `dry-run-${slug}`,
      name: newProgram.name,
      slug: newProgram.slug,
      category: newProgram.category,
      default_duration_minutes: newProgram.default_duration_minutes,
    };
    programsByName.set(preferredKey, fakeProgram);
    programsByName.set(rawKey, fakeProgram);
    console.log(`[dry-run] would create program: ${newProgram.name}`);
    return fakeProgram.id;
  }

  const { data, error } = await supabase
    .from("programs")
    .insert(newProgram as never)
    .select("id, name, slug, category, default_duration_minutes")
    .single();

  if (error || !data) {
    throw new Error(`Failed to create program "${preferredName}": ${error?.message ?? "unknown error"}`);
  }

  programsByName.set(preferredKey, data as ProgramRow);
  programsByName.set(rawKey, data as ProgramRow);
  return (data as ProgramRow).id;
}

async function main() {
  const args = parseArgs(process.argv);

  if (!args.file) {
    console.error("Usage: npm run import:jexer -- --file=output/jexer/shinjuku-xxxx.json");
    console.error("Optional: add --dry-run to validate without writing");
    process.exit(1);
  }

  const extraction = await readExtractionFile(args.file);
  await logImportConnectionInfo();
  const supabase = getImportSupabaseClient();

  const [{ data: locations, error: locationsError }, { data: programs, error: programsError }, { data: schedules, error: schedulesError }] =
    await Promise.all([
      supabase.from("gym_locations").select("id, name"),
      supabase.from("programs").select("id, name, slug, category, default_duration_minutes"),
      supabase.from("class_schedules").select("id, location_id, weekday, start_time, end_time, raw_program_name, source_page_url"),
    ]);

  if (locationsError || programsError || schedulesError || !locations || !programs || !schedules) {
    throw new Error(
      `Failed to load reference data: ${
        locationsError?.message || programsError?.message || schedulesError?.message || "unknown error"
      }`,
    );
  }

  const locationsByName = new Map<string, LocationRow>(
    locations.map((location) => [normalizeNameKey(location.name), location as LocationRow]),
  );
  const programsByName = new Map<string, ProgramRow>();
  const slugs = new Set<string>();

  programs.forEach((program) => {
    const typedProgram = program as ProgramRow;
    programsByName.set(normalizeNameKey(typedProgram.name), typedProgram);
    slugs.add(typedProgram.slug);
  });

  const existingSchedulesByKey = new Map<string, ClassScheduleRow>(
    schedules.map((schedule) => [buildScheduleLookupKey(schedule as ClassScheduleRow), schedule as ClassScheduleRow]),
  );

  let insertedCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;
  const warnings: string[] = [];
  const touchedLocationIds = new Set<string>();
  const locationNamesById = new Map<string, string>(locations.map((location) => [location.id, location.name]));
  const snapshotId = path.basename(args.file);

  for (const record of extraction.records) {
    const location = locationsByName.get(normalizeNameKey(record.location_name));

    if (!location) {
      warnings.push(`location not found: ${record.location_name} (${record.raw_program_name} ${record.weekday} ${record.start_time})`);
      skippedCount += 1;
      continue;
    }

    const programId = await ensureProgramId({
      record,
      programsByName,
      slugs,
      supabase,
      dryRun: args.dryRun,
    });

    const payload = {
      location_id: location.id,
      program_id: programId,
      raw_program_name: record.raw_program_name,
      canonical_program_name: record.canonical_program_name,
      normalized_text: record.normalized_text,
      comparison_key: record.comparison_key,
      weekday: record.weekday,
      start_time: record.start_time,
      end_time: record.end_time,
      duration_minutes: record.duration_minutes,
      program_brand: record.program_brand,
      category_primary: record.category_primary,
      tags: record.tags,
      match_method: record.match_method,
      confidence: record.confidence,
      needs_review: record.needs_review,
      instructor_name: record.instructor_name,
      source_page_url: record.source_url,
      source_snapshot_id: snapshotId,
      valid_from: null,
      valid_to: null,
      extracted_at: extraction.fetched_at,
    };

    const scheduleKey = buildScheduleLookupKey({
      location_id: payload.location_id,
      weekday: payload.weekday,
      start_time: payload.start_time,
      end_time: payload.end_time,
      raw_program_name: payload.raw_program_name,
      source_page_url: payload.source_page_url,
    });
    const existingSchedule = existingSchedulesByKey.get(scheduleKey);
    touchedLocationIds.add(location.id);

    if (args.dryRun) {
      if (existingSchedule) {
        updatedCount += 1;
        console.log(`[dry-run] would update schedule: ${record.raw_program_name} @ ${record.location_name} ${record.weekday} ${record.start_time}`);
      } else {
        insertedCount += 1;
        console.log(`[dry-run] would insert schedule: ${record.raw_program_name} @ ${record.location_name} ${record.weekday} ${record.start_time}`);
      }
      continue;
    }

    if (existingSchedule) {
      const { error } = await supabase.from("class_schedules").update(payload).eq("id", existingSchedule.id);

      if (error) {
        throw new Error(`Failed to update class_schedule "${record.raw_program_name}": ${error.message}`);
      }

      updatedCount += 1;
      continue;
    }

    const { data, error } = await supabase.from("class_schedules").insert(payload as never).select("id").single();

    if (error || !data) {
      throw new Error(`Failed to insert class_schedule "${record.raw_program_name}": ${error?.message ?? "unknown error"}`);
    }

    existingSchedulesByKey.set(scheduleKey, {
      id: data.id,
      location_id: payload.location_id,
      weekday: payload.weekday,
      start_time: payload.start_time,
      end_time: payload.end_time,
      raw_program_name: payload.raw_program_name,
      source_page_url: payload.source_page_url,
    });
    insertedCount += 1;
  }

  console.log(`Import summary: inserted=${insertedCount}, updated=${updatedCount}, skipped=${skippedCount}, warnings=${warnings.length}`);
  await logPostImportVerification({
    supabase,
    locationIds: Array.from(touchedLocationIds),
    locationNamesById,
    snapshotId,
  });

  if (warnings.length > 0) {
    console.warn("\nWarnings:");
    warnings.forEach((warning) => {
      console.warn(`- ${warning}`);
    });
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
