import assert from "node:assert/strict";
import test from "node:test";

import { filterLatestSchedulePeriods, getLatestSchedulePeriodByLocation } from "../latest-schedule-period";
import {
  latestSchedulePeriodEntriesFromSummary,
  popularProgramsFromSummary,
  type PopularProgramSummaryRow,
} from "../schedule-summary";
import type { Program } from "../types";

const makeProgram = (id: string, name: string): Program => ({
  id,
  name,
  slug: id,
  category: null,
  description: null,
  intensity_level: null,
  beginner_friendly: false,
  default_duration_minutes: null,
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
});

test("latest-period summary matches the legacy per-location map", () => {
  const schedules = [
    { location_id: "alpha", valid_from: null },
    { location_id: "alpha", valid_from: "2026-05-01" },
    { location_id: "alpha", valid_from: "2026-08-01" },
    { location_id: "alpha", valid_from: "2026-08-01" },
    { location_id: "beta", valid_from: "2026-07-01" },
    { location_id: "legacy", valid_from: null },
    { location_id: "legacy", valid_from: null },
    // "empty" deliberately has no schedule row and must not appear.
  ];

  const legacyEntries = Array.from(getLatestSchedulePeriodByLocation(schedules).entries());
  const rpcRows = [
    { location_id: "alpha", latest_valid_from: "2026-08-01" },
    { location_id: "beta", latest_valid_from: "2026-07-01" },
  ];

  assert.deepEqual(latestSchedulePeriodEntriesFromSummary(rpcRows), legacyEntries);
  assert.equal(new Map(latestSchedulePeriodEntriesFromSummary(rpcRows)).has("legacy"), false);
  assert.equal(new Map(latestSchedulePeriodEntriesFromSummary(rpcRows)).has("empty"), false);
});

test("popular-program summary matches legacy latest-period counts and ranking", () => {
  const programs = [
    makeProgram("alpha", "Alpha"),
    makeProgram("bravo", "Bravo"),
    makeProgram("charlie", "Charlie"),
    makeProgram("delta", "Delta"),
    makeProgram("no-current", "No Current"),
    makeProgram("unlisted", "Unlisted"),
  ];
  const eligibleNames = new Set(["Alpha", "Bravo", "Charlie", "Delta", "No Current"]);
  const schedules = [
    { location_id: "north", program_id: "alpha", valid_from: "2026-05-01" },
    { location_id: "north", program_id: "alpha", valid_from: "2026-08-01" },
    { location_id: "north", program_id: "alpha", valid_from: "2026-08-01" },
    { location_id: "north", program_id: "bravo", valid_from: "2026-08-01" },
    { location_id: "north", program_id: "charlie", valid_from: null },
    { location_id: "south", program_id: "bravo", valid_from: "2026-07-01" },
    { location_id: "south", program_id: "charlie", valid_from: "2026-06-01" },
    { location_id: "south", program_id: "charlie", valid_from: "2026-08-01" },
    { location_id: "legacy", program_id: "alpha", valid_from: null },
    { location_id: "legacy", program_id: "delta", valid_from: null },
    { location_id: "other", program_id: "unlisted", valid_from: "2026-08-01" },
    // "empty" has no schedule; therefore No Current is not returned.
  ];

  const legacyCounts = new Map<string, number>();
  filterLatestSchedulePeriods(schedules).forEach(({ program_id }) => {
    legacyCounts.set(program_id, (legacyCounts.get(program_id) ?? 0) + 1);
  });
  const legacyPrograms = programs
    .filter((program) => eligibleNames.has(program.name) && legacyCounts.has(program.id))
    .sort((left, right) => {
      const countDiff = (legacyCounts.get(right.id) ?? 0) - (legacyCounts.get(left.id) ?? 0);
      return countDiff || left.name.localeCompare(right.name, "ja");
    });

  const rpcRows: PopularProgramSummaryRow[] = [
    { ...programs[3], schedule_count: "1" },
    { ...programs[1], schedule_count: "2" },
    { ...programs[5], schedule_count: "1" },
    { ...programs[2], schedule_count: "1" },
    { ...programs[0], schedule_count: "3" },
  ];

  const summarizedPrograms = popularProgramsFromSummary(rpcRows, eligibleNames);
  assert.deepEqual(summarizedPrograms, legacyPrograms);
  assert.deepEqual(summarizedPrograms.slice(0, 3).map((program) => program.id), ["alpha", "bravo", "charlie"]);
  assert.equal(summarizedPrograms.some((program) => program.id === "no-current"), false);
});
