import {
  buildAdminSampleDataset,
  buildSampleSearchResults,
  sampleBrands,
  sampleLocations,
} from "@/lib/sample-data";
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
import { getLocationAddress, isTimeInRange } from "@/lib/utils";

type SupabaseJoinedSchedule = ClassSchedule & {
  gym_locations: GymLocation & {
    gym_brands: GymBrand;
  };
  programs: Program;
};

function mapJoinedSchedule(row: SupabaseJoinedSchedule): SearchResult {
  return {
    schedule: {
      ...row,
      location: undefined,
      program: undefined,
    },
    location: {
      ...row.gym_locations,
      brand: row.gym_locations.gym_brands,
    },
    brand: row.gym_locations.gym_brands,
    program: row.programs,
  };
}

function filterResults(results: SearchResult[], filters: SearchFilters) {
  const keyword = filters.q.toLowerCase();
  const brandKeyword = filters.brand.toLowerCase();
  const areaKeyword = filters.area.toLowerCase();

  return results
    .filter((item) => {
      if (filters.weekday && item.schedule.weekday !== filters.weekday) {
        return false;
      }

      if (!isTimeInRange(item.schedule.start_time, filters.timeRange)) {
        return false;
      }

      if (keyword) {
        const haystack = [
          item.program.name,
          item.schedule.raw_program_name,
          item.location.name,
          item.brand.name,
        ]
          .join(" ")
          .toLowerCase();

        if (!haystack.includes(keyword)) {
          return false;
        }
      }

      if (brandKeyword && !item.brand.name.toLowerCase().includes(brandKeyword)) {
        return false;
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
          return false;
        }
      }

      return true;
    })
    .sort((a, b) => a.schedule.start_time.localeCompare(b.schedule.start_time));
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
    class_schedules: class_schedules.length ? class_schedules : buildAdminSampleDataset().class_schedules,
    source_pages: source_pages.length ? source_pages : buildAdminSampleDataset().source_pages,
    ingestion_runs: ingestion_runs.length ? ingestion_runs : buildAdminSampleDataset().ingestion_runs,
    ingestion_items: ingestion_items.length ? ingestion_items : buildAdminSampleDataset().ingestion_items,
  };
}
