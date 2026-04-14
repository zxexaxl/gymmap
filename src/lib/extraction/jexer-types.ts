import type { ProgramBrand, ProgramCategoryPrimary } from "../program-master";
import type { ScheduleEntryType } from "./entry-type-classifier";

export type GeminiUsageMetadata = {
  prompt_token_count: number | null;
  candidates_token_count: number | null;
  total_token_count: number | null;
  thoughts_token_count?: number | null;
  cached_content_token_count?: number | null;
  model_id?: string | null;
};

export type JexerUsageBreakdown = {
  classification: GeminiUsageMetadata | null;
  extraction: GeminiUsageMetadata | null;
};

export type ExtractedJexerScheduleRecord = {
  location_name: string;
  weekday: string;
  start_time: string;
  end_time: string;
  raw_program_name: string;
  instructor_name: string | null;
  source_url: string;
  section_or_area?: string | null;
  entry_type_candidate?: ScheduleEntryType | null;
  entry_type_reason?: string | null;
};

export type NormalizedExtractedJexerScheduleRecord = ExtractedJexerScheduleRecord & {
  normalized_text: string;
  comparison_key: string;
  duration_minutes: number | null;
  canonical_program_name: string | null;
  program_brand: ProgramBrand | null;
  category_primary: ProgramCategoryPrimary | null;
  tags: string[];
  match_method: "exact" | "similar" | "unresolved";
  confidence: number;
  needs_review: boolean;
  entry_type: ScheduleEntryType;
  entry_type_reason: string;
  section_or_area: string | null;
  excluded_candidate: boolean;
  suspect_non_regular: boolean;
  included_in_schedule_results: boolean;
};

export type JexerExtractionResult = {
  location_name: string;
  source_url: string;
  fetched_at: string;
  model_id: string;
  usage_metadata: GeminiUsageMetadata | null;
  usage_breakdown?: JexerUsageBreakdown;
  records: NormalizedExtractedJexerScheduleRecord[];
};
