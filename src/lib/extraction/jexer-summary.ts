import type { JexerExtractionResult } from "./jexer-types";

export type JexerExtractionSummary = {
  total_records: number;
  needs_review_count: number;
  unresolved_count: number;
  by_program_brand: Array<{ key: string; count: number }>;
  by_category_primary: Array<{ key: string; count: number }>;
  top_raw_program_names: Array<{ key: string; count: number }>;
};

function countBy(values: string[]) {
  const counts = new Map<string, number>();

  values.forEach((value) => {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  });

  return Array.from(counts.entries())
    .map(([key, count]) => ({ key, count }))
    .sort((left, right) => right.count - left.count || left.key.localeCompare(right.key, "ja"));
}

export function summarizeJexerExtractionResult(result: JexerExtractionResult, topN = 10): JexerExtractionSummary {
  return {
    total_records: result.records.length,
    needs_review_count: result.records.filter((record) => record.needs_review).length,
    unresolved_count: result.records.filter((record) => record.match_method === "unresolved").length,
    by_program_brand: countBy(result.records.map((record) => record.program_brand ?? "null")),
    by_category_primary: countBy(result.records.map((record) => record.category_primary ?? "null")),
    top_raw_program_names: countBy(result.records.map((record) => record.raw_program_name)).slice(0, topN),
  };
}
