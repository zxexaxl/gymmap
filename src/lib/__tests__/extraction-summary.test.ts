import test from "node:test";
import assert from "node:assert/strict";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { summarizeJexerExtractionResult } from "../extraction/jexer-summary";
import type { JexerExtractionResult } from "../extraction/jexer-types";

function buildResult({
  fetchedAt,
  records,
}: {
  fetchedAt: string;
  records: JexerExtractionResult["records"];
}): JexerExtractionResult {
  return {
    location_name: "JEXER 東京都内クラブ一括",
    source_url: "https://example.com",
    fetched_at: fetchedAt,
    model_id: "test-model",
    usage_metadata: null,
    records,
  };
}

test("summary compares against previous extraction in same output directory", async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "gymmap-summary-"));
  const outputDir = path.join(tempDir, "output", "jexer");
  await mkdir(outputDir, { recursive: true });

  const previousPath = path.join(outputDir, "tokyo-2026-03.json");
  const currentPath = path.join(outputDir, "tokyo-2026-04.json");

  const previous = buildResult({
    fetchedAt: "2026-03-01T00:00:00.000Z",
    records: [
      {
        location_name: "JEXER 大井町",
        weekday: "friday",
        start_time: "19:40",
        end_time: "20:25",
        raw_program_name: "BODYPUMP",
        instructor_name: "A",
        source_url: "https://example.com/prev",
        normalized_text: "bodypump",
        comparison_key: "bodypump",
        duration_minutes: 45,
        canonical_program_name: "BODYPUMP",
        program_brand: "Les Mills",
        category_primary: "strength",
        tags: [],
        match_method: "exact",
        confidence: 1,
        needs_review: false,
        entry_type: "regular_class",
        entry_type_reason: "regular",
        section_or_area: "スタジオA",
        excluded_candidate: false,
        suspect_non_regular: false,
        included_in_schedule_results: true,
      },
    ],
  });

  const current = buildResult({
    fetchedAt: "2026-04-01T00:00:00.000Z",
    records: [
      {
        ...previous.records[0],
        raw_program_name: "BODYCOMBAT",
        canonical_program_name: "BODYCOMBAT",
        comparison_key: "bodycombat",
        normalized_text: "bodycombat",
        category_primary: "cardio",
        start_time: "20:50",
        end_time: "21:35",
        weekday: "friday",
      },
      {
        ...previous.records[0],
        raw_program_name: "ZUMBA",
        canonical_program_name: "ZUMBA",
        comparison_key: "zumba",
        normalized_text: "zumba",
        program_brand: "ZUMBA",
        category_primary: "dance",
        start_time: "10:00",
        end_time: "10:45",
        weekday: "monday",
      },
    ],
  });

  await writeFile(previousPath, JSON.stringify(previous, null, 2), "utf-8");
  await writeFile(currentPath, JSON.stringify(current, null, 2), "utf-8");

  const summary = await summarizeJexerExtractionResult(current, {
    currentOutputPath: currentPath,
  });

  assert.equal(summary.previous_summary_found, true);
  assert.equal(summary.comparison_target.previous_file_path, previousPath);
  assert.equal(summary.by_location_delta[0]?.location_name, "JEXER 大井町");
  assert.equal(summary.by_location_delta[0]?.previous_total_records, 1);
  assert.equal(summary.by_location_delta[0]?.current_total_records, 2);
  assert.match(JSON.stringify(summary.new_top_programs), /BODYCOMBAT|ZUMBA/);
  assert.match(JSON.stringify(summary.missing_top_programs), /BODYPUMP/);
});
