import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path: string) => fs.readFileSync(path, "utf8");

test("U3-LA preserves the facility route, loader, SEO canonical, and map boundary", () => {
  const page = read("src/app/locations/[slug]/page.tsx");

  assert.match(page, /getLocationBySlug\(slug\)/);
  assert.match(page, /canonical: `\/locations\/\$\{slug\}`/);
  assert.match(page, /export const dynamicParams = false/);
  assert.match(page, /FavoriteProgramButton/);
  assert.match(page, /buildProgramPath/);
  assert.match(page, /brand: brand\.name/);
  assert.doesNotMatch(page, /components\/map|LeafletGymMap|AppleGymMap|LocationMapSection/);
});

test("U3-LA schedule presentation keeps the existing schedule fields and program route", () => {
  const table = read("src/components/location/location-schedule-table.tsx");

  for (const field of [
    "schedule.weekday",
    "schedule.start_time",
    "schedule.end_time",
    "schedule.raw_program_name",
    "schedule.duration_minutes",
    "schedule.studio_name",
    "schedule.instructor_name",
  ]) {
    assert.match(table, new RegExp(field.replaceAll(".", "\\.")));
  }

  assert.match(table, /buildProgramPath\(item\.program\.slug\)/);
  assert.match(table, /<table/);
  assert.match(table, /scope="col"/);
});
