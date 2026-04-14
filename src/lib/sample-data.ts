import type {
  AdminDataset,
  ClassSchedule,
  GymBrand,
  GymLocation,
  IngestionItem,
  IngestionRun,
  Program,
  ProgramAlias,
  SearchResult,
  SourcePage,
} from "@/lib/types";

// 旧サンプルデータは削除済みです。
// 実データは Supabase の seed、または抽出/import スクリプトで投入してください。

export const sampleBrands: GymBrand[] = [];
export const sampleLocations: GymLocation[] = [];
export const samplePrograms: Program[] = [];
export const sampleProgramAliases: ProgramAlias[] = [];
export const sampleSchedules: ClassSchedule[] = [];
export const sampleSourcePages: SourcePage[] = [];
export const sampleIngestionRuns: IngestionRun[] = [];
export const sampleIngestionItems: IngestionItem[] = [];

export function buildSampleSearchResults(): SearchResult[] {
  return [];
}

export function buildAdminSampleDataset(): AdminDataset {
  return {
    gym_brands: [],
    gym_locations: [],
    programs: [],
    class_schedules: [],
    source_pages: [],
    ingestion_runs: [],
    ingestion_items: [],
  };
}
