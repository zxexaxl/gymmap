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

test("U3-LC preserves the Lesson favorites storage key, identifier format, limit, and event contract", () => {
  const favoritePrograms = read("src/lib/favorite-programs.ts");
  const subscription = read("src/components/favorites/use-favorite-programs.ts");

  assert.match(favoritePrograms, /gymmap:favorite-programs:v1/);
  assert.match(favoritePrograms, /id: string/);
  assert.match(favoritePrograms, /slug: string/);
  assert.match(favoritePrograms, /name: string/);
  assert.match(favoritePrograms, /maximumFavoritePrograms = 8/);
  assert.match(favoritePrograms, /window\.localStorage\.setItem/);
  assert.match(favoritePrograms, /favorites\.filter\(\(item\) => item\.id !== program\.id\)/);
  assert.match(favoritePrograms, /\[\.\.\.favorites, program\]/);
  assert.match(subscription, /addEventListener\("storage", callback\)/);
  assert.match(subscription, /favoriteProgramsChangedEvent/);
});

test("U3-LC keeps weekly schedule API and provides accessible populated and empty continuations", () => {
  const view = read("src/components/favorites/favorite-schedule-view.tsx");
  const route = read("src/app/api/favorites/schedules/route.ts");
  const button = read("src/components/favorites/favorite-program-button.tsx");

  assert.match(view, /programId/);
  assert.match(view, /startWeekday/);
  assert.match(view, /params\.set\("area", appliedArea\)/);
  assert.match(view, /href="\/#popular-programs"/);
  assert.match(view, /href="\/search"/);
  assert.match(view, /buildProgramPath\(program\.slug\)/);
  assert.match(view, /href=\{`\/locations\/\$\{item\.location\.slug\}`\}/);
  assert.match(route, /getFavoriteScheduleWeek\(programIds, area, startWeekday\)/);
  assert.match(route, /\.slice\(0, 8\)/);
  assert.match(route, /"Cache-Control": "private, no-store"/);
  assert.match(button, /aria-pressed=\{isFavorite\}/);
  assert.match(button, /aria-label=\{`\$\{name\}を\$\{isFavorite/);
});
