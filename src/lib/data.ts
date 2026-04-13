import {
  buildAdminSampleDataset,
  buildSampleSearchResults,
  sampleBrands,
  sampleLocations,
} from "@/lib/sample-data";
import { getProgramSearchAliases } from "@/lib/program-master";
import { enrichScheduleWithNormalization, enrichSchedulesWithNormalization } from "@/lib/schedule-normalization";
import { hasSupabaseEnv, getSupabaseClient } from "@/lib/supabase";
import type {
  AdminDataset,
  ClassSchedule,
  GymBrand,
  GymLocation,
  LocationDetail,
  Program,
  SearchFilters,
  SearchResult,
  SourcePage,
  IngestionItem,
  IngestionRun,
} from "@/lib/types";
import { getLocationAddress, isDurationInRange, isTimeInRange } from "@/lib/utils";

type SupabaseJoinedSchedule = ClassSchedule & {
  gym_locations: GymLocation & {
    gym_brands: GymBrand;
  };
  programs: Program;
};

function mapJoinedSchedule(row: SupabaseJoinedSchedule): SearchResult {
  const normalizedSchedule = enrichScheduleWithNormalization({
    ...row,
    location: undefined,
    program: undefined,
  });

  return {
    schedule: normalizedSchedule,
    location: {
      ...row.gym_locations,
      brand: row.gym_locations.gym_brands,
    },
    brand: row.gym_locations.gym_brands,
    program: row.programs,
  };
}

function filterResults(results: SearchResult[], filters: SearchFilters) {
  const keyword = normalizeSearchKeyword(filters.q);
  const brandKeyword = filters.brand.toLowerCase();
  const areaKeyword = filters.area.toLowerCase();

  return results
    .map((item) => {
      if (filters.weekday && item.schedule.weekday !== filters.weekday) {
        return null;
      }

      if (!isTimeInRange(item.schedule.start_time, filters.timeRange)) {
        return null;
      }

      if (!isDurationInRange(item.schedule.duration_minutes, filters.durationRange)) {
        return null;
      }

      if (keyword) {
        const score = scoreKeywordMatch(item, keyword);

        if (score <= 0) {
          return null;
        }

        return { item, score };
      }

      if (brandKeyword && !item.brand.name.toLowerCase().includes(brandKeyword)) {
        return null;
      }

      if (areaKeyword) {
        const locationText = [
          item.location.name,
          item.location.prefecture,
          item.location.city,
          item.location.address_line,
          getLocationAddress(item.location.prefecture, item.location.city, item.location.address_line),
        ]
          .join(" ")
          .toLowerCase();

        if (!locationText.includes(areaKeyword)) {
          return null;
        }
      }

      return { item, score: 0 };
    })
    .filter((value): value is { item: SearchResult; score: number } => Boolean(value))
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return left.item.schedule.start_time.localeCompare(right.item.schedule.start_time);
    })
    .map((entry) => entry.item);
}

function normalizeSearchKeyword(value: string) {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[／/]/g, " ")
    .replace(/[()（）【】\[\]]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function compactSearchKeyword(value: string) {
  return normalizeSearchKeyword(value).replace(/\s+/g, "");
}

function getMatchScore(query: string, candidate?: string | null) {
  if (!candidate) {
    return 0;
  }

  const normalizedCandidate = normalizeSearchKeyword(candidate);
  const compactCandidate = compactSearchKeyword(candidate);
  const compactQuery = query.replace(/\s+/g, "");

  if (normalizedCandidate === query || compactCandidate === compactQuery) {
    return 3;
  }

  if (normalizedCandidate.startsWith(query) || compactCandidate.startsWith(compactQuery)) {
    return 2;
  }

  if (normalizedCandidate.includes(query) || compactCandidate.includes(compactQuery)) {
    return 1;
  }

  return 0;
}

function scoreKeywordMatch(item: SearchResult, query: string) {
  const aliases = getProgramSearchAliases(item.schedule.canonical_program_name);
  let bestScore = 0;

  bestScore = Math.max(bestScore, getMatchScore(query, item.schedule.raw_program_name) * 100);
  bestScore = Math.max(bestScore, getMatchScore(query, item.schedule.canonical_program_name) * 90);
  bestScore = Math.max(bestScore, ...aliases.map((alias) => getMatchScore(query, alias) * 80), 0);
  bestScore = Math.max(bestScore, getMatchScore(query, item.schedule.program_brand) * 50);
  bestScore = Math.max(bestScore, ...(item.schedule.tags ?? []).map((tag) => getMatchScore(query, tag) * 30), 0);

  return bestScore;
}

export async function getSearchResults(filters: SearchFilters): Promise<SearchResult[]> {
  if (!hasSupabaseEnv()) {
    return filterResults(buildSampleSearchResults(), filters);
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("class_schedules")
    .select(
      `
        *,
        gym_locations (
          *,
          gym_brands (*)
        ),
        programs (*)
      `,
    )
    .order("start_time", { ascending: true });

  if (error) {
    console.error("Failed to load schedules from Supabase:", error.message);
    return filterResults(buildSampleSearchResults(), filters);
  }

  return filterResults((data as SupabaseJoinedSchedule[]).map(mapJoinedSchedule), filters);
}

export async function getBrands(): Promise<GymBrand[]> {
  if (!hasSupabaseEnv()) {
    return sampleBrands;
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from("gym_brands").select("*").order("name");

  if (error || !data) {
    return sampleBrands;
  }

  return data;
}

export async function getLocations(): Promise<GymLocation[]> {
  if (!hasSupabaseEnv()) {
    return sampleLocations;
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("gym_locations")
    .select("*, gym_brands(*)")
    .order("name");

  if (error || !data) {
    return sampleLocations;
  }

  return (data as Array<GymLocation & { gym_brands: GymBrand }>).map((row) => ({
    ...row,
    brand: row.gym_brands,
  }));
}

export async function getLocationBySlug(slug: string): Promise<LocationDetail | null> {
  const results = await getSearchResults({
    q: "",
    weekday: "",
    timeRange: "",
    durationRange: "",
    brand: "",
    area: "",
  });

  const schedules = results.filter((item) => item.location.slug === slug);
  const first = schedules[0];

  if (!first) {
    return null;
  }

  return {
    location: first.location,
    brand: first.brand,
    schedules: schedules.sort((a, b) => {
      if (a.schedule.weekday === b.schedule.weekday) {
        return a.schedule.start_time.localeCompare(b.schedule.start_time);
      }

      return a.schedule.weekday.localeCompare(b.schedule.weekday);
    }),
  };
}

async function fetchTable<T>(table: string): Promise<T[]> {
  if (!hasSupabaseEnv()) {
    return [] as T[];
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from(table).select("*").limit(100).order("created_at", { ascending: false });

  if (error || !data) {
    return [] as T[];
  }

  return data as T[];
}

export async function getAdminDataset(): Promise<AdminDataset> {
  if (!hasSupabaseEnv()) {
    return buildAdminSampleDataset();
  }

  const [gym_brands, gym_locations, programs, class_schedules, source_pages, ingestion_runs, ingestion_items] =
    await Promise.all([
      fetchTable<GymBrand>("gym_brands"),
      fetchTable<GymLocation>("gym_locations"),
      fetchTable<Program>("programs"),
      fetchTable<ClassSchedule>("class_schedules"),
      fetchTable<SourcePage>("source_pages"),
      fetchTable<IngestionRun>("ingestion_runs"),
      fetchTable<IngestionItem>("ingestion_items"),
    ]);

  return {
    gym_brands: gym_brands.length ? gym_brands : buildAdminSampleDataset().gym_brands,
    gym_locations: gym_locations.length ? gym_locations : buildAdminSampleDataset().gym_locations,
    programs: programs.length ? programs : buildAdminSampleDataset().programs,
    class_schedules: class_schedules.length
      ? enrichSchedulesWithNormalization(class_schedules)
      : buildAdminSampleDataset().class_schedules,
    source_pages: source_pages.length ? source_pages : buildAdminSampleDataset().source_pages,
    ingestion_runs: ingestion_runs.length ? ingestion_runs : buildAdminSampleDataset().ingestion_runs,
    ingestion_items: ingestion_items.length ? ingestion_items : buildAdminSampleDataset().ingestion_items,
  };
}
