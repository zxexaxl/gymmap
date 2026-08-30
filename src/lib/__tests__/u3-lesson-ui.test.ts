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

test("U3-LB preserves program and area route, loader, canonical, and discovery contracts", () => {
  const program = read("src/app/programs/[slug]/page.tsx");
  const areaProgram = read("src/app/areas/[area]/[program]/page.tsx");

  assert.match(program, /getProgramLandingBySlug\(slug\)/);
  assert.match(program, /canonical: buildProgramPath\(page\.program\.slug\)/);
  assert.match(program, /export const dynamicParams = false/);
  assert.match(program, /id="program-locations"/);
  assert.match(program, /buildSearchQuery\(\{/);
  for (const parameter of ["q", "area", "weekday", "timeRange", "durationRange", "brand"]) {
    assert.match(program, new RegExp(`${parameter}:`));
  }
  assert.match(program, /buildAreaProgramPath\(area\.areaName, page\.program\.slug\)/);
  assert.match(program, /href=\{`\/locations\/\$\{first\.location\.slug\}`\}/);

  assert.match(areaProgram, /getAreaProgramLandingByParams\(area, program\)/);
  assert.match(areaProgram, /canonical: buildAreaProgramPath\(page\.areaName, page\.program\.slug\)/);
  assert.match(areaProgram, /export const dynamicParams = false/);
  assert.match(areaProgram, /buildAreaProgramPath\(city\.cityName, page\.program\.slug\)/);
  assert.match(areaProgram, /href=\{`\/locations\/\$\{item\.location\.slug\}`\}/);
});

test("U3-LB keeps brand discovery on the existing Search query rather than adding a route", () => {
  const program = read("src/app/programs/[slug]/page.tsx");

  assert.match(program, /function buildBrandSearchPath\(brandName: string\)/);
  assert.match(program, /brand: brandName/);
  assert.equal(fs.existsSync("src/app/brands"), false);
  assert.equal(fs.existsSync("src/app/brand"), false);
});
