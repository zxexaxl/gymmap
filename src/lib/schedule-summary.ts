import type { Program } from "@/lib/types";

export type LatestSchedulePeriodSummaryRow = {
  location_id: string;
  latest_valid_from: string;
};

export type PopularProgramSummaryRow = Program & {
  schedule_count: number | string;
};

/**
 * Keeps fetchLatestSchedulePeriodEntries' existing [locationId, validFrom]
 * interface while the aggregation itself happens in PostgreSQL.
 */
export function latestSchedulePeriodEntriesFromSummary(rows: LatestSchedulePeriodSummaryRow[]) {
  return rows.map(({ location_id, latest_valid_from }) => [location_id, latest_valid_from] as [string, string]);
}

/**
 * Preserves the old program-name eligibility and Japanese tie-break ordering.
 * The RPC has already counted only schedules in each location's visible period.
 */
export function popularProgramsFromSummary(
  rows: PopularProgramSummaryRow[],
  eligibleProgramNames: ReadonlySet<string>,
): Program[] {
  return rows
    .filter((row) => eligibleProgramNames.has(row.name) && Number(row.schedule_count) > 0)
    .sort((left, right) => {
      const countDiff = Number(right.schedule_count) - Number(left.schedule_count);
      return countDiff || left.name.localeCompare(right.name, "ja");
    })
    .map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      category: row.category,
      description: row.description,
      intensity_level: row.intensity_level,
      beginner_friendly: row.beginner_friendly,
      default_duration_minutes: row.default_duration_minutes,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));
}
