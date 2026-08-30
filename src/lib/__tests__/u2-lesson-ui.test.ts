import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function source(path: string) {
  return readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
}

test("Lesson search keeps every public query parameter and separates advanced controls", () => {
  const form = source("components/search/search-form.tsx");

  for (const name of ["q", "area", "weekday", "timeRange", "durationRange", "brand"]) {
    assert.match(form, new RegExp(`name=\\"${name}\\"`));
  }

  assert.match(form, /<details/);
  assert.match(form, /詳細条件/);
  assert.match(form, /initialValues\.timeRange/);
  assert.match(form, /initialValues\.durationRange/);
  assert.match(form, /initialValues\.brand/);
  assert.match(form, /action = "\/search"/);
});

test("Search page hydrates legacy URLs without changing normalization or paging", () => {
  const page = source("app/search/page.tsx");
  const results = source("components/search/results-list.tsx");

  assert.match(page, /normalizeSearchFilters\(resolvedSearchParams\)/);
  assert.match(page, /initialValues=\{filters\}/);
  assert.match(page, /getSearchResultPage\(filters, currentPage\)/);
  assert.match(results, /if \(key === "page"\) return/);
  assert.match(results, /params\.set\(key, value\)/);
  assert.match(results, /params\.set\("page", String\(page\)\)/);
  assert.match(results, /#search-results/);
});

test("Home preserves discovery anchors and adds only a secondary HYROX route", () => {
  const home = source("app/page.tsx");
  const hyroxEntry = source("components/lesson/hyrox-home-entry.tsx");

  assert.match(home, /id="search-section"/);
  assert.match(home, /id="popular-programs"/);
  assert.match(home, /LocationMapSection/);
  assert.match(hyroxEntry, /href="\/training\/hyrox"/);
  assert.doesNotMatch(hyroxEntry, /equipment|capability|freshness|filter/i);
});

test("Lesson results preserve favorite, program, area, and location actions", () => {
  const results = source("components/search/results-list.tsx");

  assert.match(results, /FavoriteProgramButton/);
  assert.match(results, /buildProgramPath/);
  assert.match(results, /buildAreaProgramPath/);
  assert.match(results, /href=\{`\/locations\/\$\{item\.location\.slug\}`\}/);
  assert.match(results, /CardSurface/);
  assert.match(results, /FreshnessIndicator/);
});

test("U2-L styles remain domain-local instead of mutating shared foundation classes", () => {
  const home = source("app/home.module.css");
  const form = source("components/search/search-form.module.css");
  const results = source("components/search/results-list.module.css");

  assert.ok(home.length > 0 && form.length > 0 && results.length > 0);
  assert.doesNotMatch(`${home}\n${form}\n${results}`, /\.site-header\s*\{|\.ui-button\s*\{|\.ui-card-surface\s*\{/);
});
