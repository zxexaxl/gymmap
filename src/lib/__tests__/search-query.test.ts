import test from "node:test";
import assert from "node:assert/strict";

import { getProgramQueryDebug, scoreProgramQueryMatch, normalizeSearchKeyword } from "../search-query";
import type { SearchResult } from "../types";

const baseResult = (overrides: Partial<SearchResult["schedule"]>): SearchResult => ({
  schedule: {
    id: "schedule-1",
    location_id: "location-1",
    program_id: "program-1",
    raw_program_name: "BODYCOMBAT 45",
    canonical_program_name: "BODYCOMBAT",
    normalized_text: "bodycombat 45",
    comparison_key: "bodycombat",
    weekday: "monday",
    start_time: "19:00",
    end_time: "19:45",
    duration_minutes: 45,
    program_brand: "Les Mills",
    category_primary: "cardio",
    tags: ["cardio", "combat"],
    match_method: "exact",
    confidence: 0.99,
    needs_review: false,
    studio_name: null,
    instructor_name: null,
    source_page_url: null,
    source_snapshot_id: null,
    valid_from: null,
    valid_to: null,
    extracted_at: null,
    created_at: "2026-04-14T00:00:00Z",
    updated_at: "2026-04-14T00:00:00Z",
    ...overrides,
  },
  location: {
    id: "location-1",
    brand_id: "brand-1",
    name: "JEXER 新宿",
    slug: "jexer-shinjuku",
    postal_code: null,
    prefecture: "東京都",
    city: "渋谷区",
    address_line: "test",
    latitude: null,
    longitude: null,
    nearest_station: null,
    official_url: null,
    source_url: null,
    is_active: true,
    last_verified_at: null,
    created_at: "2026-04-14T00:00:00Z",
    updated_at: "2026-04-14T00:00:00Z",
  },
  brand: {
    id: "brand-1",
    name: "JEXER",
    slug: "jexer",
    official_url: null,
    description: null,
    created_at: "2026-04-14T00:00:00Z",
    updated_at: "2026-04-14T00:00:00Z",
  },
  program: {
    id: "program-1",
    name: "BODYCOMBAT",
    slug: "bodycombat",
    category: null,
    description: null,
    intensity_level: null,
    beginner_friendly: false,
    default_duration_minutes: 45,
    created_at: "2026-04-14T00:00:00Z",
    updated_at: "2026-04-14T00:00:00Z",
  },
});

test("body does not match yoga-only result", () => {
  const query = normalizeSearchKeyword("body");
  const yogaResult = baseResult({
    raw_program_name: "ホットヨガ",
    canonical_program_name: "ヨガ",
    normalized_text: "ホットヨガ",
    comparison_key: "ホットヨガ",
    program_brand: null,
    category_primary: "mind_body",
    tags: ["mind_body", "mobility"],
  });

  assert.equal(scoreProgramQueryMatch(yogaResult, query), 0);
});

test("ボディ query matches BODYCOMBAT through aliases", () => {
  const query = normalizeSearchKeyword("ボディ");
  const result = baseResult({});

  assert.ok(scoreProgramQueryMatch(result, query) > 0);
});

test("raw program name wins over canonical and aliases", () => {
  const query = normalizeSearchKeyword("bodycombat");
  const result = baseResult({});

  assert.equal(scoreProgramQueryMatch(result, query), 200);
});

test("program brand is searchable as part of the main query", () => {
  const query = normalizeSearchKeyword("les mills");
  const result = baseResult({});

  assert.equal(scoreProgramQueryMatch(result, query), 255);
});

test("query debug lists only the actual matching fields", () => {
  const query = normalizeSearchKeyword("body");
  const result = baseResult({});
  const hits = getProgramQueryDebug(result, query);

  assert.deepEqual(
    hits.map((hit) => hit.field),
    ["raw_program_name", "canonical_program_name", "searchAliases", "searchAliases"],
  );
  assert.deepEqual(
    hits.map((hit) => hit.value),
    ["BODYCOMBAT 45", "BODYCOMBAT", "body combat", "bodycombat"],
  );
});
