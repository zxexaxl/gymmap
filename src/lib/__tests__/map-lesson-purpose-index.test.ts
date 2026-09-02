import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { filterLatestSchedulePeriods } from "../latest-schedule-period";
import {
  buildMapLessonPurposeIndex,
  formatMapLessonMatchPreview,
  getMapLessonQueryMatches,
  type MapLessonPurposeSourceRow,
} from "../map-lesson-purpose-index";
import { normalizeProgramName } from "../normalizeProgramName";
import { normalizeSearchKeyword } from "../search-query";
import type { MapLocationLessonIndex } from "../types";

const sourceRows: MapLessonPurposeSourceRow[] = [
  { location_id: "dated", raw_program_name: "OLD PROGRAM", valid_from: "2026-07-01" },
  { location_id: "dated", raw_program_name: "BODYCOMBAT 45", valid_from: "2026-08-01" },
  { location_id: "dated", raw_program_name: "BODYCOMBAT 45", valid_from: "2026-08-01" },
  { location_id: "dated", raw_program_name: "BODYCOMBAT 60", valid_from: "2026-08-01" },
  { location_id: "dated", raw_program_name: "BODYPUMP 45", valid_from: "2026-08-01" },
  { location_id: "dated", raw_program_name: "BODYATTACK 30", valid_from: "2026-08-01" },
  { location_id: "dated", raw_program_name: "legacy hidden", valid_from: null },
  { location_id: "legacy", raw_program_name: "BODYCOMBAT", valid_from: null },
  { location_id: "legacy", raw_program_name: "ヨガ", valid_from: null },
];

function buildUnaggregatedOracle(rows: MapLessonPurposeSourceRow[]): MapLocationLessonIndex[] {
  const locations = new Map<string, MapLocationLessonIndex>();

  for (const row of filterLatestSchedulePeriods(rows)) {
    const normalized = normalizeProgramName({ rawProgramName: row.raw_program_name });
    const entry = locations.get(row.location_id) ?? { locationId: row.location_id, lessons: [] };
    entry.lessons.push([
      row.raw_program_name,
      normalized.canonical_program_name,
      normalized.program_brand,
      1,
    ]);
    locations.set(row.location_id, entry);
  }

  return Array.from(locations.values());
}

function summarize(index: MapLocationLessonIndex[], query: string) {
  const { matchesByLocationId, matchedLessonCount } = getMapLessonQueryMatches(
    index,
    normalizeSearchKeyword(query),
  );

  return {
    locationIds: Array.from(matchesByLocationId.keys()),
    matchedLessonCount,
    locations: Array.from(matchesByLocationId, ([locationId, matches]) => ({
      locationId,
      scheduleCount: matches.reduce((count, item) => count + item[3], 0),
      rawNames: Array.from(new Set(matches.map((item) => item[0]))),
      preview: formatMapLessonMatchPreview(matches),
    })),
  };
}

test("Map-purpose index preserves latest periods, insertion order, and schedule multiplicity", () => {
  const index = buildMapLessonPurposeIndex(sourceRows);

  assert.deepEqual(index, [
    {
      locationId: "dated",
      lessons: [
        ["BODYCOMBAT 45", "BODYCOMBAT", "Les Mills", 2],
        ["BODYCOMBAT 60", "BODYCOMBAT", "Les Mills", 1],
        ["BODYPUMP 45", "BODYPUMP", "Les Mills", 1],
        ["BODYATTACK 30", null, null, 1],
      ],
    },
    {
      locationId: "legacy",
      lessons: [
        ["BODYCOMBAT", "BODYCOMBAT", "Les Mills", 1],
        ["ヨガ", "ヨガ", null, 1],
      ],
    },
  ]);
});

test("Map-purpose aggregate is equivalent to the former schedule-array oracle", () => {
  const aggregate = buildMapLessonPurposeIndex(sourceRows);
  const oracle = buildUnaggregatedOracle(sourceRows);
  const queries = ["", "BODYCOMBAT 45", "BODYCOMBAT", "ボディコンバット", "Les Mills", "レズミルズ", "body", "combat"];

  for (const query of queries) {
    assert.deepEqual(summarize(aggregate, query), summarize(oracle, query), query || "blank query");
  }
});

test("program identity and brand do not depend on schedule times", () => {
  const withoutTimes = normalizeProgramName({ rawProgramName: "BODYCOMBAT 45" });
  const withTimes = normalizeProgramName({
    rawProgramName: "BODYCOMBAT 45",
    startTime: "10:00:00",
    endTime: "10:45:00",
  });

  assert.equal(withTimes.canonical_program_name, withoutTimes.canonical_program_name);
  assert.equal(withTimes.program_brand, withoutTimes.program_brand);
});

test("Home Map source is direct, minimal, membership-positive, and cache-isolated", () => {
  const dataSource = readFileSync(new URL("../data.ts", import.meta.url), "utf8");
  const fetchSource = dataSource.match(
    /async function fetchMapLessonPurposeIndex[\s\S]*?const getMapLessonPurposeIndexFromDataCache/,
  )?.[0];
  const getterSource = dataSource.match(
    /export async function getMapLessonSearchIndex[\s\S]*?\n\}/,
  )?.[0];

  assert.ok(fetchSource);
  assert.ok(getterSource);
  assert.match(fetchSource, /location_id, raw_program_name, valid_from, gym_locations!inner\(lesson_location_memberships!inner\(\)\)/);
  assert.match(fetchSource, /\.eq\("gym_locations\.is_active", true\)/);
  assert.match(fetchSource, /\.order\("id", \{ ascending: true \}\)/);
  assert.doesNotMatch(fetchSource, /weekday|start_time|end_time|duration_minutes|extracted_at|updated_at/);
  assert.match(dataSource, /\["lesson-map-program-aggregate-v1-membership"\]/);
  assert.match(dataSource, /"lesson-map-program-aggregate"/);
  assert.doesNotMatch(getterSource, /getLessonSearchIndexFromDataCache|getSearchResultPageLegacy/);

  const purposeSource = readFileSync(new URL("../map-lesson-purpose-index.ts", import.meta.url), "utf8");
  assert.match(purposeSource, /scoreProgramTextValues/);

  const legacySource = dataSource.match(/async function getSearchResultPageLegacy[\s\S]*?\n\}/)?.[0];
  assert.ok(legacySource);
  assert.match(legacySource, /getLessonSearchIndexFromDataCache/);
});
