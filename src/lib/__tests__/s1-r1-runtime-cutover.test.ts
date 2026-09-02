import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const dataSource = fs.readFileSync(path.join(root, "src/lib/data.ts"), "utf8");
const databaseTypes = fs.readFileSync(path.join(root, "src/lib/database.types.ts"), "utf8");

test("structured Lesson searches use only the structured server RPC", () => {
  assert.match(
    dataSource,
    /const fetchPage = isStructuredSearch\s*\? fetchStructuredSearchSchedulePageRpc\s*:\s*fetchSearchSchedulePageRpc/,
  );
  assert.match(dataSource, /supabase\.rpc\("search_structured_lesson_class_schedule_page"/);
  assert.doesNotMatch(
    dataSource,
    /if \(filters\.prefecture\) \{\s*return getSearchResultPageLegacy/,
  );
});

test("structured RPC failure stays fail-closed without the full-index fallback", () => {
  const structuredFailure = dataSource.slice(
    dataSource.indexOf("if (isStructuredSearch) {", dataSource.indexOf("export async function getSearchResultPage")),
    dataSource.indexOf("Failed to use database-backed paginated search; falling back", dataSource.indexOf("export async function getSearchResultPage")),
  );

  assert.match(structuredFailure, /totalResults: 0/);
  assert.doesNotMatch(structuredFailure, /getSearchResultPageLegacy/);
});

test("free-text search keeps the existing RPC and legacy error fallback", () => {
  assert.match(dataSource, /supabase\.rpc\("search_lesson_class_schedule_page"/);
  assert.match(
    dataSource,
    /Failed to use database-backed paginated search; falling back to the legacy search/,
  );
  assert.match(dataSource, /return getSearchResultPageLegacy\(filters, requestedPage, pageSize\)/);
});

test("committed database types expose the approved structured RPC arguments", () => {
  assert.match(databaseTypes, /search_structured_lesson_class_schedule_page:/);
  for (const argument of ["p_prefecture", "p_municipality", "p_query", "p_offset", "p_limit"]) {
    assert.match(databaseTypes, new RegExp(`${argument}\\?:`));
  }
});
