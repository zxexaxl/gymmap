import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import type { GeminiUsageMetadata, JexerExtractionResult } from "./jexer-types";

type CountEntry = { key: string; count: number };
type WeekdayKey = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";

type NullRateSummary = {
  previous_count: number;
  current_count: number;
  previous_ratio: number;
  current_ratio: number;
  delta_ratio: number;
};

type LocationAggregate = {
  location_name: string;
  total_records: number;
  top_raw_program_names: string[];
  weekday_distribution: Record<WeekdayKey, number>;
  program_brand_null_count: number;
  program_brand_null_ratio: number;
  category_primary_null_count: number;
  category_primary_null_ratio: number;
};

type PreviousExtractionMatch = {
  filePath: string;
  result: JexerExtractionResult;
};

export type JexerExtractionSummary = {
  total_records: number;
  needs_review_count: number;
  unresolved_count: number;
  usage_metadata: GeminiUsageMetadata | null;
  total_prompt_tokens: number;
  total_output_tokens: number;
  total_tokens: number;
  by_program_brand: CountEntry[];
  by_category_primary: CountEntry[];
  top_raw_program_names: CountEntry[];
  previous_summary_found: boolean;
  comparison_target: {
    current_location_name: string;
    previous_file_path: string | null;
    previous_fetched_at: string | null;
  };
  by_location_delta: Array<{
    location_name: string;
    previous_total_records: number;
    current_total_records: number;
    delta_records: number;
    delta_ratio: number | null;
  }>;
  warning_locations: Array<{
    location_name: string;
    warnings: string[];
  }>;
  new_top_programs: Array<{
    location_name: string;
    programs: string[];
  }>;
  missing_top_programs: Array<{
    location_name: string;
    programs: string[];
  }>;
  weekday_distribution_delta: Array<{
    location_name: string;
    previous: Record<WeekdayKey, number>;
    current: Record<WeekdayKey, number>;
    delta: Record<WeekdayKey, number>;
    warnings: string[];
  }>;
  null_rate_delta: {
    overall: {
      program_brand_null: NullRateSummary;
      category_primary_null: NullRateSummary;
      warnings: string[];
    };
    by_location: Array<{
      location_name: string;
      program_brand_null: NullRateSummary;
      category_primary_null: NullRateSummary;
      warnings: string[];
    }>;
  };
};

const WEEKDAYS: WeekdayKey[] = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

export const SUMMARY_WARNING_THRESHOLDS = {
  recordDeltaRatioWarning: 0.2,
  extremeIncreaseRatioWarning: 1.0,
  nullRateDeltaWarning: 0.1,
  topProgramCompareCount: 5,
} as const;

function countBy(values: string[]) {
  const counts = new Map<string, number>();

  values.forEach((value) => {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  });

  return Array.from(counts.entries())
    .map(([key, count]) => ({ key, count }))
    .sort((left, right) => right.count - left.count || left.key.localeCompare(right.key, "ja"));
}

function safeRatio(count: number, total: number) {
  if (total <= 0) {
    return 0;
  }

  return Number((count / total).toFixed(4));
}

function buildWeekdayDistribution(records: JexerExtractionResult["records"]): Record<WeekdayKey, number> {
  const distribution = Object.fromEntries(WEEKDAYS.map((weekday) => [weekday, 0])) as Record<WeekdayKey, number>;

  records.forEach((record) => {
    const weekday = record.weekday as WeekdayKey;

    if (weekday in distribution) {
      distribution[weekday] += 1;
    }
  });

  return distribution;
}

function aggregateByLocation(result: JexerExtractionResult, topN: number) {
  const grouped = new Map<string, JexerExtractionResult["records"]>();

  result.records.forEach((record) => {
    const records = grouped.get(record.location_name) ?? [];
    records.push(record);
    grouped.set(record.location_name, records);
  });

  return Array.from(grouped.entries())
    .map(([location_name, records]) => {
      const programBrandNullCount = records.filter((record) => record.program_brand == null).length;
      const categoryPrimaryNullCount = records.filter((record) => record.category_primary == null).length;

      const aggregate: LocationAggregate = {
        location_name,
        total_records: records.length,
        top_raw_program_names: countBy(records.map((record) => record.raw_program_name))
          .slice(0, topN)
          .map((entry) => entry.key),
        weekday_distribution: buildWeekdayDistribution(records),
        program_brand_null_count: programBrandNullCount,
        program_brand_null_ratio: safeRatio(programBrandNullCount, records.length),
        category_primary_null_count: categoryPrimaryNullCount,
        category_primary_null_ratio: safeRatio(categoryPrimaryNullCount, records.length),
      };

      return aggregate;
    })
    .sort((left, right) => left.location_name.localeCompare(right.location_name, "ja"));
}

function toAggregateMap(aggregates: LocationAggregate[]) {
  return new Map(aggregates.map((aggregate) => [aggregate.location_name, aggregate]));
}

function buildNullRateSummary(previousCount: number, currentCount: number, previousTotal: number, currentTotal: number): NullRateSummary {
  const previousRatio = safeRatio(previousCount, previousTotal);
  const currentRatio = safeRatio(currentCount, currentTotal);

  return {
    previous_count: previousCount,
    current_count: currentCount,
    previous_ratio: previousRatio,
    current_ratio: currentRatio,
    delta_ratio: Number((currentRatio - previousRatio).toFixed(4)),
  };
}

function sortWarningLocations(items: Array<{ location_name: string; warnings: string[] }>) {
  return items
    .filter((item) => item.warnings.length > 0)
    .sort((left, right) => left.location_name.localeCompare(right.location_name, "ja"));
}

async function findPreviousExtractionResult(
  currentOutputPath: string,
  currentResult: JexerExtractionResult,
): Promise<PreviousExtractionMatch | null> {
  const outputDir = path.dirname(currentOutputPath);
  const currentResolvedPath = path.resolve(currentOutputPath);
  const entries = await readdir(outputDir, { withFileTypes: true });

  const candidates = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json") && !entry.name.endsWith(".summary.json"))
    .map((entry) => path.join(outputDir, entry.name))
    .filter((filePath) => path.resolve(filePath) !== currentResolvedPath);

  const parsed: PreviousExtractionMatch[] = [];

  for (const filePath of candidates) {
    try {
      const json = await readFile(filePath, "utf-8");
      const result = JSON.parse(json) as JexerExtractionResult;

      if (result.location_name !== currentResult.location_name) {
        continue;
      }

      if (Date.parse(result.fetched_at) >= Date.parse(currentResult.fetched_at)) {
        continue;
      }

      parsed.push({ filePath, result });
    } catch {
      continue;
    }
  }

  parsed.sort((left, right) => Date.parse(right.result.fetched_at) - Date.parse(left.result.fetched_at));

  return parsed[0] ?? null;
}

function buildComparisonSections(currentResult: JexerExtractionResult, previousResult: JexerExtractionResult | null, topN: number) {
  const currentByLocation = aggregateByLocation(currentResult, topN);
  const previousByLocation = previousResult ? aggregateByLocation(previousResult, topN) : [];
  const currentMap = toAggregateMap(currentByLocation);
  const previousMap = toAggregateMap(previousByLocation);
  const allLocations = Array.from(new Set([...currentMap.keys(), ...previousMap.keys()])).sort((left, right) =>
    left.localeCompare(right, "ja"),
  );

  const byLocationDelta = allLocations.map((location_name) => {
    const previous = previousMap.get(location_name);
    const current = currentMap.get(location_name);
    const previousTotal = previous?.total_records ?? 0;
    const currentTotal = current?.total_records ?? 0;

    return {
      location_name,
      previous_total_records: previousTotal,
      current_total_records: currentTotal,
      delta_records: currentTotal - previousTotal,
      delta_ratio:
        previousTotal > 0 ? Number(((currentTotal - previousTotal) / previousTotal).toFixed(4)) : currentTotal > 0 ? null : 0,
    };
  });

  const warningLocations = sortWarningLocations(
    allLocations.map((location_name) => {
      const previous = previousMap.get(location_name);
      const current = currentMap.get(location_name);
      const previousTotal = previous?.total_records ?? 0;
      const currentTotal = current?.total_records ?? 0;
      const deltaRatio =
        previousTotal > 0 ? (currentTotal - previousTotal) / previousTotal : currentTotal > 0 ? Number.POSITIVE_INFINITY : 0;
      const warnings: string[] = [];

      if (previousTotal > 0 && currentTotal === 0) {
        warnings.push("dropped_to_zero");
      } else if (previousTotal > 0 && Math.abs(deltaRatio) > SUMMARY_WARNING_THRESHOLDS.recordDeltaRatioWarning) {
        warnings.push("record_delta_ratio_exceeded");
      } else if (previousTotal === 0 && currentTotal > 0) {
        warnings.push("new_records_without_previous_baseline");
      }

      if (previousTotal > 0 && deltaRatio > SUMMARY_WARNING_THRESHOLDS.extremeIncreaseRatioWarning) {
        warnings.push("extreme_increase");
      }

      WEEKDAYS.forEach((weekday) => {
        const previousWeekdayCount = previous?.weekday_distribution[weekday] ?? 0;
        const currentWeekdayCount = current?.weekday_distribution[weekday] ?? 0;

        if (previousWeekdayCount > 0 && currentWeekdayCount === 0) {
          warnings.push(`weekday_became_zero:${weekday}`);
        }
      });

      if (
        (current?.program_brand_null_ratio ?? 0) - (previous?.program_brand_null_ratio ?? 0) >
        SUMMARY_WARNING_THRESHOLDS.nullRateDeltaWarning
      ) {
        warnings.push("program_brand_null_rate_worsened");
      }

      if (
        (current?.category_primary_null_ratio ?? 0) - (previous?.category_primary_null_ratio ?? 0) >
        SUMMARY_WARNING_THRESHOLDS.nullRateDeltaWarning
      ) {
        warnings.push("category_primary_null_rate_worsened");
      }

      return {
        location_name,
        warnings,
      };
    }),
  );

  const newTopPrograms = allLocations
    .map((location_name) => {
      const previousTopPrograms = new Set(previousMap.get(location_name)?.top_raw_program_names ?? []);
      const currentTopPrograms = currentMap.get(location_name)?.top_raw_program_names ?? [];
      const programs = currentTopPrograms
        .slice(0, SUMMARY_WARNING_THRESHOLDS.topProgramCompareCount)
        .filter((program) => !previousTopPrograms.has(program));

      return { location_name, programs };
    })
    .filter((item) => item.programs.length > 0);

  const missingTopPrograms = allLocations
    .map((location_name) => {
      const currentTopPrograms = new Set(currentMap.get(location_name)?.top_raw_program_names ?? []);
      const previousTopPrograms = previousMap.get(location_name)?.top_raw_program_names ?? [];
      const programs = previousTopPrograms
        .slice(0, SUMMARY_WARNING_THRESHOLDS.topProgramCompareCount)
        .filter((program) => !currentTopPrograms.has(program));

      return { location_name, programs };
    })
    .filter((item) => item.programs.length > 0);

  const weekdayDistributionDelta = allLocations.map((location_name) => {
    const previous = previousMap.get(location_name);
    const current = currentMap.get(location_name);
    const delta = Object.fromEntries(
      WEEKDAYS.map((weekday) => [weekday, (current?.weekday_distribution[weekday] ?? 0) - (previous?.weekday_distribution[weekday] ?? 0)]),
    ) as Record<WeekdayKey, number>;
    const warnings = WEEKDAYS.filter(
      (weekday) => (previous?.weekday_distribution[weekday] ?? 0) > 0 && (current?.weekday_distribution[weekday] ?? 0) === 0,
    ).map((weekday) => `weekday_became_zero:${weekday}`);

    return {
      location_name,
      previous: previous?.weekday_distribution ?? buildWeekdayDistribution([]),
      current: current?.weekday_distribution ?? buildWeekdayDistribution([]),
      delta,
      warnings,
    };
  });

  const previousProgramBrandNullCount = previousResult?.records.filter((record) => record.program_brand == null).length ?? 0;
  const currentProgramBrandNullCount = currentResult.records.filter((record) => record.program_brand == null).length;
  const previousCategoryPrimaryNullCount = previousResult?.records.filter((record) => record.category_primary == null).length ?? 0;
  const currentCategoryPrimaryNullCount = currentResult.records.filter((record) => record.category_primary == null).length;

  const overallProgramBrandNull = buildNullRateSummary(
    previousProgramBrandNullCount,
    currentProgramBrandNullCount,
    previousResult?.records.length ?? 0,
    currentResult.records.length,
  );
  const overallCategoryPrimaryNull = buildNullRateSummary(
    previousCategoryPrimaryNullCount,
    currentCategoryPrimaryNullCount,
    previousResult?.records.length ?? 0,
    currentResult.records.length,
  );
  const overallNullWarnings = [
    overallProgramBrandNull.delta_ratio > SUMMARY_WARNING_THRESHOLDS.nullRateDeltaWarning
      ? "program_brand_null_rate_worsened"
      : null,
    overallCategoryPrimaryNull.delta_ratio > SUMMARY_WARNING_THRESHOLDS.nullRateDeltaWarning
      ? "category_primary_null_rate_worsened"
      : null,
  ].filter((warning): warning is string => Boolean(warning));

  const nullRateDeltaByLocation = allLocations.map((location_name) => {
    const previous = previousMap.get(location_name);
    const current = currentMap.get(location_name);
    const programBrandNull = buildNullRateSummary(
      previous?.program_brand_null_count ?? 0,
      current?.program_brand_null_count ?? 0,
      previous?.total_records ?? 0,
      current?.total_records ?? 0,
    );
    const categoryPrimaryNull = buildNullRateSummary(
      previous?.category_primary_null_count ?? 0,
      current?.category_primary_null_count ?? 0,
      previous?.total_records ?? 0,
      current?.total_records ?? 0,
    );
    const warnings = [
      programBrandNull.delta_ratio > SUMMARY_WARNING_THRESHOLDS.nullRateDeltaWarning ? "program_brand_null_rate_worsened" : null,
      categoryPrimaryNull.delta_ratio > SUMMARY_WARNING_THRESHOLDS.nullRateDeltaWarning ? "category_primary_null_rate_worsened" : null,
    ].filter((warning): warning is string => Boolean(warning));

    return {
      location_name,
      program_brand_null: programBrandNull,
      category_primary_null: categoryPrimaryNull,
      warnings,
    };
  });

  return {
    byLocationDelta,
    warningLocations,
    newTopPrograms,
    missingTopPrograms,
    weekdayDistributionDelta,
    nullRateDelta: {
      overall: {
        program_brand_null: overallProgramBrandNull,
        category_primary_null: overallCategoryPrimaryNull,
        warnings: overallNullWarnings,
      },
      by_location: nullRateDeltaByLocation,
    },
  };
}

export async function summarizeJexerExtractionResult(
  result: JexerExtractionResult,
  options: {
    topN?: number;
    currentOutputPath?: string;
  } = {},
): Promise<JexerExtractionSummary> {
  const topN = options.topN ?? 10;
  const usageMetadata = result.usage_metadata ?? null;
  const previousMatch = options.currentOutputPath
    ? await findPreviousExtractionResult(options.currentOutputPath, result)
    : null;
  const comparison = buildComparisonSections(result, previousMatch?.result ?? null, topN);

  return {
    total_records: result.records.length,
    needs_review_count: result.records.filter((record) => record.needs_review).length,
    unresolved_count: result.records.filter((record) => record.match_method === "unresolved").length,
    usage_metadata: usageMetadata,
    total_prompt_tokens: usageMetadata?.prompt_token_count ?? 0,
    total_output_tokens: usageMetadata?.candidates_token_count ?? 0,
    total_tokens: usageMetadata?.total_token_count ?? 0,
    by_program_brand: countBy(result.records.map((record) => record.program_brand ?? "null")),
    by_category_primary: countBy(result.records.map((record) => record.category_primary ?? "null")),
    top_raw_program_names: countBy(result.records.map((record) => record.raw_program_name)).slice(0, topN),
    previous_summary_found: Boolean(previousMatch),
    comparison_target: {
      current_location_name: result.location_name,
      previous_file_path: previousMatch?.filePath ?? null,
      previous_fetched_at: previousMatch?.result.fetched_at ?? null,
    },
    by_location_delta: comparison.byLocationDelta,
    warning_locations: comparison.warningLocations,
    new_top_programs: comparison.newTopPrograms,
    missing_top_programs: comparison.missingTopPrograms,
    weekday_distribution_delta: comparison.weekdayDistributionDelta,
    null_rate_delta: comparison.nullRateDelta,
  };
}
