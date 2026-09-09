import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

test("Home all-lessons CTA opens the program catalog instead of raw search", () => {
  const home = fs.readFileSync("src/app/page.tsx", "utf8");
  assert.match(home, /<Link href="\/programs">すべてのレッスンを見る/);
  assert.doesNotMatch(home, /<Link href="\/search">すべてのレッスンを見る/);
});

test("program catalog links cards to canonical detail routes and never renders schedule rows", () => {
  const page = fs.readFileSync("src/app/programs/page.tsx", "utf8");
  assert.match(page, /buildProgramPath\(item\.slug\)/);
  assert.match(page, /item\.facilityCount/);
  assert.doesNotMatch(page, /class_schedules|schedule\.start_time|SearchResult/);
});
