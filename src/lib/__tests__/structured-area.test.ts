import assert from "node:assert/strict";
import test from "node:test";

import {
  buildStructuredAreaCatalog,
  deriveMunicipality,
  locationMatchesStructuredArea,
  rankStructuredAreas,
} from "../structured-area";
import type { GymLocation } from "../types";

function location(id: string, prefecture: string | null, city: string | null): GymLocation {
  return {
    id,
    brand_id: "brand-1",
    name: `店舗${id}`,
    slug: `store-${id}`,
    postal_code: null,
    prefecture,
    city,
    address_line: null,
    latitude: null,
    longitude: null,
    nearest_station: null,
    official_url: null,
    source_url: null,
    is_active: true,
    last_verified_at: null,
    created_at: "2026-09-01T00:00:00Z",
    updated_at: "2026-09-01T00:00:00Z",
  };
}

test("derives only the first municipality prefix from structured city data", () => {
  assert.equal(deriveMunicipality("渋谷区"), "渋谷区");
  assert.equal(deriveMunicipality("渋谷区広尾"), "渋谷区");
  assert.equal(deriveMunicipality("横浜市港南区上大岡西"), "横浜市");
  assert.equal(deriveMunicipality("さいたま市大宮区桜木町"), "さいたま市");
  assert.equal(deriveMunicipality("市"), "");
  assert.equal(deriveMunicipality(null), "");
});

test("catalog uses prefecture plus municipality identity and unique facility counts", () => {
  const catalog = buildStructuredAreaCatalog([
    location("1", "東京都", "渋谷区"),
    location("2", "東京都", "渋谷区広尾"),
    location("3", "東京都", "港区"),
    location("4", "神奈川県", "中区"),
    location("5", "東京都", null),
  ]);

  assert.deepEqual(catalog.find((area) => area.label === "東京都"), {
    type: "prefecture",
    prefecture: "東京都",
    municipality: "",
    label: "東京都",
    count: 4,
    searchableText: "東京都 東京",
  });
  assert.equal(catalog.find((area) => area.label === "東京都 渋谷区")?.count, 2);
  assert.ok(catalog.some((area) => area.label === "神奈川県 中区"));
});

test("area ranking preserves suffix aliases and disambiguated labels", () => {
  const catalog = buildStructuredAreaCatalog([
    location("1", "東京都", "港区"),
    location("2", "大阪府", "港区"),
    location("3", "東京都", "渋谷区"),
  ]);

  assert.deepEqual(rankStructuredAreas(catalog, "港区").map((area) => area.label), ["大阪府 港区", "東京都 港区"]);
  assert.equal(rankStructuredAreas(catalog, "渋谷")[0]?.label, "東京都 渋谷区");
  assert.equal(rankStructuredAreas(catalog, "東京")[0]?.label, "東京都");
});

test("structured matching is exact on identity rather than location substring", () => {
  assert.equal(locationMatchesStructuredArea(location("1", "東京都", "港区芝"), "東京都", "港区"), true);
  assert.equal(locationMatchesStructuredArea(location("2", "大阪府", "港区"), "東京都", "港区"), false);
  assert.equal(locationMatchesStructuredArea(location("3", "東京都", "渋谷区"), "東京都", "港区"), false);
});
