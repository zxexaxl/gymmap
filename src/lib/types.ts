export type Weekday =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export type GymBrand = {
  id: string;
  name: string;
  slug: string;
  official_url: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type GymLocation = {
  id: string;
  brand_id: string;
  name: string;
  slug: string;
  location_type?: string | null;
  postal_code: string | null;
  prefecture: string | null;
  city: string | null;
  address_line: string | null;
  latitude: number | null;
  longitude: number | null;
  nearest_station: string | null;
  official_url: string | null;
  source_url: string | null;
  is_active: boolean;
  last_verified_at: string | null;
  created_at: string;
  updated_at: string;
  brand?: GymBrand;
};

export type Program = {
  id: string;
  name: string;
  slug: string;
  category: string | null;
  description: string | null;
  intensity_level: number | null;
  beginner_friendly: boolean;
  default_duration_minutes: number | null;
  created_at: string;
  updated_at: string;
};

export type ProgramAlias = {
  id: string;
  program_id: string;
  alias_name: string;
  created_at: string;
};

export type ClassSchedule = {
  id: string;
  location_id: string;
  program_id: string;
  raw_program_name: string;
  canonical_program_name?: string | null;
  normalized_text?: string;
  comparison_key?: string;
  weekday: Weekday;
  start_time: string;
  end_time: string;
  duration_minutes: number | null;
  program_brand?: string | null;
  category_primary?: string | null;
  tags?: string[];
  match_method?: "exact" | "similar" | "unresolved";
  confidence?: number;
  needs_review?: boolean;
  manually_confirmed?: boolean;
  source_of_truth?: "manual_confirmed" | "master_catalog" | "ai_candidate" | "raw_unresolved";
  brand_candidate?: string | null;
  category_candidate?: string | null;
  normalization_notes?: string | null;
  studio_name: string | null;
  instructor_name: string | null;
  source_page_url: string | null;
  source_snapshot_id: string | null;
  valid_from: string | null;
  valid_to: string | null;
  extracted_at: string | null;
  created_at: string;
  updated_at: string;
  location?: GymLocation;
  program?: Program;
};

export type SourcePage = {
  id: string;
  location_id: string;
  source_type: string;
  url: string;
  format: string | null;
  parser_key: string | null;
  last_fetched_at: string | null;
  last_parsed_at: string | null;
  fetch_status: string | null;
  parse_status: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type IngestionRun = {
  id: string;
  started_at: string;
  finished_at: string | null;
  trigger_type: string;
  status: string;
  total_sources: number;
  success_count: number;
  failed_count: number;
  warning_count: number;
  logs_json: Record<string, unknown> | null;
};

export type IngestionItem = {
  id: string;
  run_id: string;
  source_page_id: string | null;
  status: string;
  detected_records: number;
  inserted_records: number;
  updated_records: number;
  error_message: string | null;
  raw_output_json: Record<string, unknown> | null;
  created_at: string;
};

export type SearchFilters = {
  q: string;
  weekday: string;
  timeRange: string;
  durationRange: string;
  brand: string;
  area: string;
};

export type SearchResult = {
  schedule: ClassSchedule;
  location: GymLocation;
  brand: GymBrand;
  program: Program;
};

export type LocationDetail = {
  location: GymLocation;
  brand: GymBrand;
  schedules: SearchResult[];
};

export type AdminDataset = {
  gym_brands: GymBrand[];
  gym_locations: GymLocation[];
  programs: Program[];
  class_schedules: ClassSchedule[];
  source_pages: SourcePage[];
  ingestion_runs: IngestionRun[];
  ingestion_items: IngestionItem[];
};
