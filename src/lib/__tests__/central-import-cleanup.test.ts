import test from "node:test";
import assert from "node:assert/strict";

import { prepareCentralImportRecords } from "../extraction/central-import-cleanup";
import type { NormalizedExtractedJexerScheduleRecord } from "../extraction/jexer-types";

function createRecord(overrides: Partial<NormalizedExtractedJexerScheduleRecord>): NormalizedExtractedJexerScheduleRecord {
  return {
    location_name: "セントラルフィットネスクラブ 府中",
    weekday: "friday",
    start_time: "09:15",
    end_time: "09:55",
    raw_program_name: "ヨガ",
    instructor_name: null,
    source_url: "https://www.central.co.jp/example",
    section_or_area: "スタジオ",
    normalized_text: "ヨガ",
    comparison_key: "ヨガ",
    duration_minutes: 40,
    canonical_program_name: "ヨガ",
    program_brand: null,
    category_primary: "mind_body",
    tags: [],
    match_method: "exact",
    confidence: 0.95,
    needs_review: false,
    entry_type: "regular_class",
    entry_type_reason: "default",
    excluded_candidate: false,
    suspect_non_regular: false,
    included_in_schedule_results: true,
    ...overrides,
  };
}

test("prepareCentralImportRecords removes decoration prefixes and extracts instructor", () => {
  const { preparedRecords, summary } = prepareCentralImportRecords([
    createRecord({
      raw_program_name: "有料セッション/フィールヨガ・羽藤",
    }),
  ]);

  assert.equal(preparedRecords[0]?.raw_program_name, "フィールヨガ");
  assert.equal(preparedRecords[0]?.instructor_name, "羽藤");
  assert.equal(preparedRecords[0]?.suspect_non_regular, true);
  assert.equal(summary.suspect_non_regular, 1);
});

test("prepareCentralImportRecords excludes obvious non-lesson lines", () => {
  const { preparedRecords, summary } = prepareCentralImportRecords([
    createRecord({
      raw_program_name: "未成年者利用不可",
    }),
  ]);

  assert.equal(preparedRecords[0]?.excluded_candidate, true);
  assert.equal(summary.excluded, 1);
});

test("prepareCentralImportRecords collapses OCR spacing noise", () => {
  const { preparedRecords, summary } = prepareCentralImportRecords([
    createRecord({
      raw_program_name: "Ｈ ＯＴヨガヨガ",
    }),
  ]);

  assert.equal(preparedRecords[0]?.raw_program_name, "HOTヨガヨガ");
  assert.equal(summary.normalized_only, 1);
});
