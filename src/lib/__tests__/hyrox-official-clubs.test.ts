import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  HYROX_SOURCE_NAMESPACE,
  duplicateValues,
  inferExplicitPrefecture,
  normalizeAddress,
  normalizeName,
  parseOfficialFinderRecord,
  resolveClubIdentity,
  resolveAllClubIdentities,
  type GymMapLocationRecord,
  type OfficialClubRecord,
} from "../hyrox-official-clubs";

const source = (overrides: Partial<OfficialClubRecord> = {}): OfficialClubRecord => ({
  source_namespace: HYROX_SOURCE_NAMESPACE,
  external_id: "HGY_test",
  external_id_status: "stable",
  official_name: "CLUB 360",
  country: "JP",
  prefecture: "東京都",
  city: "港区",
  address: "〒106-0046 東京都港区元麻布3-1-35",
  postal_code: "106-0046",
  latitude: 35.658,
  longitude: 139.7275,
  official_source_url: "https://hyrox-training-finder.hyrox.com/gym/HGY_test",
  facility_url: "https://www.club360.jp/hyrox/",
  observed_at: "2026-08-29T00:00:00.000Z",
  source_url: "https://onefiit-api.platform.onefiit.com/hyrox365/v1/gyms/map",
  source_metadata: { htcx: false, third_party_integration_id: null, source_city: "港区", source_region: "東京都" },
  ...overrides,
});

const location = (overrides: Partial<GymMapLocationRecord> = {}): GymMapLocationRecord => ({
  id: "11111111-1111-1111-1111-111111111111",
  slug: "club-360",
  name: "CLUB 360",
  brand_id: "22222222-2222-2222-2222-222222222222",
  brand_name: "CLUB 360",
  brand_slug: "club-360",
  address: "東京都港区元麻布3丁目1番35号",
  postal_code: "1060046",
  prefecture: "東京都",
  city: "港区",
  latitude: 35.65801,
  longitude: 139.72751,
  official_url: "https://club360.jp/hyrox",
  source_url: null,
  is_active: true,
  ...overrides,
});

test("normalizes width, whitespace, punctuation, and safe gym suffixes", () => {
  assert.equal(normalizeName(" ＣＬＵＢ・３６０ GYM "), normalizeName("club 360"));
  assert.equal(normalizeAddress("東京都 港区 1丁目2番3号"), normalizeAddress("東京都港区1-2-3"));
});

test("extracts only explicitly present Japanese or English prefectures", () => {
  assert.equal(inferExplicitPrefecture("Kanagawa-ken Yokohama"), "神奈川県");
  assert.equal(inferExplicitPrefecture("東京都港区"), "東京都");
  assert.equal(inferExplicitPrefecture("Minato City"), null);
});

test("detects duplicate source IDs without silently deduplicating", () => {
  assert.deepEqual(duplicateValues(["HGY_a", "HGY_b", "HGY_a", null]), ["HGY_a"]);
});

test("parses the official source fixture without retaining contact or image metadata", () => {
  const record = parseOfficialFinderRecord({
    hyroxEntityId: "HGY_fixture",
    gymName: "Fixture Training Club",
    htcx: true,
    geoCoordinates: { lat: 35.1, lon: 139.1 },
    address: { country: "JP", state: "Tokyo", city: "Shibuya", street: "1-2-3", postalCode: "150-0001" },
  }, {
    hyroxEntityId: "HGY_fixture",
    gymName: "Fixture Training Club",
    thirdPartyIntegrationId: "fixture-third-party-id",
    socialMedia: { website: "https://fixture.example/" },
    address: { country: "JP", state: "Tokyo", city: "Shibuya", street: "1-2-3", postalCode: "150-0001", geoCoordinates: { lat: 35.1, lon: 139.1 } },
  }, "2026-08-29T00:00:00.000Z");
  assert.equal(record.external_id, "HGY_fixture");
  assert.equal(record.prefecture, "東京都");
  assert.equal(record.facility_url, "https://fixture.example/");
  assert.equal("contactDetails" in record.source_metadata, false);
  assert.equal("images" in record.source_metadata, false);
});

test("parses missing external ID, coordinates, and address without inventing values", () => {
  const record = parseOfficialFinderRecord({ gymName: "Incomplete Club", address: { country: "JP" } }, null, "2026-08-29T00:00:00.000Z");
  assert.equal(record.external_id_status, "missing");
  assert.equal(record.latitude, null);
  assert.equal(record.longitude, null);
  assert.equal(record.address, null);
});

test("classifies missing stable source identity as SOURCE_INCOMPLETE", () => {
  const result = resolveClubIdentity(source({ external_id: null, external_id_status: "missing" }), [location()]);
  assert.equal(result.resolution_status, "SOURCE_INCOMPLETE");
});

test("allows missing coordinates when name and postal/address identity are strong", () => {
  const result = resolveClubIdentity(source({ latitude: null, longitude: null }), [location()]);
  assert.equal(result.resolution_status, "CONFIRMED_MATCH");
});

test("classifies missing address and coordinates as SOURCE_INCOMPLETE", () => {
  const result = resolveClubIdentity(source({ address: null, postal_code: null, latitude: null, longitude: null }), [location()]);
  assert.equal(result.resolution_status, "SOURCE_INCOMPLETE");
});

test("exact official URL is a deterministic CONFIRMED_MATCH", () => {
  const result = resolveClubIdentity(source({ official_name: "Different display name" }), [location()]);
  assert.equal(result.resolution_status, "CONFIRMED_MATCH");
  assert.equal(result.match_method, "official-url-exact");
});

test("exact normalized name and postal identity is CONFIRMED_MATCH", () => {
  const result = resolveClubIdentity(source({ facility_url: null }), [location({ official_url: null })]);
  assert.equal(result.resolution_status, "CONFIRMED_MATCH");
});

test("near coordinates support rather than independently confirm identity", () => {
  const result = resolveClubIdentity(
    source({ official_name: "Club Three Sixty", facility_url: null, postal_code: null, address: "Tokyo" }),
    [location({ official_url: null, name: "CLUB 360", postal_code: null, address: "Minato" })],
  );
  assert.notEqual(result.resolution_status, "CONFIRMED_MATCH");
});

test("conflicting prefecture produces AMBIGUOUS instead of confirmed", () => {
  const result = resolveClubIdentity(source({ facility_url: null, prefecture: "大阪府" }), [location({ official_url: null })]);
  assert.equal(result.resolution_status, "AMBIGUOUS");
});

test("multiple equally plausible candidates are AMBIGUOUS", () => {
  const result = resolveClubIdentity(source({ facility_url: null }), [
    location(),
    location({ id: "33333333-3333-3333-3333-333333333333", slug: "club-360-annex" }),
  ]);
  assert.equal(result.resolution_status, "AMBIGUOUS");
});

test("a moderate single candidate is PROBABLE_MATCH", () => {
  const result = resolveClubIdentity(
    source({ official_name: "Golds Gym Harajuku", facility_url: null, postal_code: "1500001", latitude: null, longitude: null }),
    [location({ name: "Gold Gym Harajuku", brand_name: "Golds Gym", official_url: null, postal_code: "150-0001", latitude: null, longitude: null })],
  );
  assert.equal(result.resolution_status, "PROBABLE_MATCH");
});

test("no plausible location is UNMATCHED", () => {
  const result = resolveClubIdentity(source({ official_name: "Entirely New Club", facility_url: null }), [
    location({ name: "Unrelated Facility", official_url: null, postal_code: "9999999", latitude: 43, longitude: 141 }),
  ]);
  assert.equal(result.resolution_status, "UNMATCHED");
});

test("repeated coordinates without address are treated as source placeholders", () => {
  const records = resolveAllClubIdentities([
    source({ external_id: "HGY_placeholder_a", official_name: "Club A", address: null, postal_code: null, city: null }),
    source({ external_id: "HGY_placeholder_b", official_name: "Club B", address: null, postal_code: null, city: null }),
  ], [location()]);
  assert.deepEqual(records.map((record) => record.resolution_status), ["SOURCE_INCOMPLETE", "SOURCE_INCOMPLETE"]);
  assert.ok(records.every((record) => record.conflicts.some((conflict) => conflict.includes("placeholder"))));
});

test("H2-1 scripts contain no Supabase or SQL mutation operation", () => {
  const scripts = [
    "scripts/hyrox/discover-official-training-clubs.ts",
    "scripts/hyrox/export-gymmap-location-inventory.ts",
    "scripts/hyrox/resolve-training-club-identities.ts",
  ].map((file) => readFileSync(file, "utf8")).join("\n");
  assert.doesNotMatch(scripts, /\.(?:insert|update|delete|upsert)\s*\(/i);
  assert.doesNotMatch(scripts, /\b(?:insert|update|delete)\s+(?:into|from|public\.)/i);
  assert.doesNotMatch(scripts, /supabase\s+(?:db push|migration repair)/i);
});
