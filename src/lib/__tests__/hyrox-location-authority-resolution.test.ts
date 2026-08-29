import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  buildJapanPostIndex,
  originalBlocker,
  parseJapanPostCsv,
  resolveAuthorityRecord,
  resolvePostalAuthority,
  websiteStrength,
  type GoverningBodyObservation,
  type H29WebsiteObservation,
} from "../hyrox-location-authority-resolution";
import { HYROX_SOURCE_NAMESPACE, type OfficialClubRecord } from "../hyrox-official-clubs";
import type { GymBrandRecord, H24LocationRecord, H24ReviewRecord } from "../hyrox-unmatched-review";

const reviewedAt = "2026-08-29T15:50:00.000Z";
const postalCsv = [
  '"13101","100  ","1500001","ﾄｳｷｮｳﾄ","ｼﾌﾞﾔｸ","ｼﾞﾝｸﾞｳﾏｴ","東京都","渋谷区","神宮前",0,0,0,0,0,0',
  '"13101","100  ","1500001","ﾄｳｷｮｳﾄ","ｼﾌﾞﾔｸ","ｼﾞﾝｸﾞｳﾏｴ","東京都","渋谷区","神宮前（次のビルを除く）",0,0,0,0,0,0',
  '"27100","530  ","5300001","ｵｵｻｶﾌ","ｵｵｻｶｼｷﾀｸ","ｳﾒﾀﾞ","大阪府","大阪市北区","梅田",0,0,0,0,0,0',
].join("\n");
const postalIndex = buildJapanPostIndex(parseJapanPostCsv(postalCsv));

function review(overrides: Partial<H24ReviewRecord> = {}): H24ReviewRecord {
  return {
    hgy_external_id: "HGY_h29_test", hyrox_official_name: "Example Training Studio",
    hyrox_source_url: "https://hyrox-training-finder.hyrox.com/gym/HGY_h29_test",
    final_classification: "NEW_LOCATION_NEEDS_REVIEW", matched_location_id: null, matched_location_slug: null,
    matched_location_name: null, canonical_facility_url: "https://example.jp/shibuya/", official_site_status: "insufficient_identity_evidence",
    canonical_name: "Example Training Studio", address: "1500001, Tokyo, Shibuya, Jingumae 1-2-3", postal_code: "1500001",
    prefecture: "東京都", city: "渋谷区", address_verification_status: "source_only", latitude: 35.67, longitude: 139.705,
    coordinate_source: "hyrox-governing-body-finder", coordinate_confidence: "high", brand_resolution: "INDEPENDENT_FACILITY",
    proposed_brand_id: null, proposed_brand_name: "Example Training Studio", proposed_brand_slug: "example-training-studio",
    proposed_slug: null, proposed_location_type: null, is_active_candidate: false, match_method: "fail-closed-source-review",
    reasons: [], conflicts: ["Postal authority did not resolve prefecture and city"], source_authorities: [], manual_review_required: true,
    ...overrides,
  };
}

function source(overrides: Partial<OfficialClubRecord> = {}): OfficialClubRecord {
  return {
    source_namespace: HYROX_SOURCE_NAMESPACE, external_id: "HGY_h29_test", external_id_status: "stable",
    official_name: "Example Training Studio", country: "JP", prefecture: "東京都", city: "渋谷区",
    address: "1500001, Tokyo, Shibuya, Jingumae 1-2-3", postal_code: "1500001", latitude: 35.67, longitude: 139.705,
    official_source_url: "https://hyrox-training-finder.hyrox.com/gym/HGY_h29_test", facility_url: "https://example.jp/shibuya/",
    observed_at: reviewedAt, source_url: "https://onefiit-api.platform.onefiit.com/hyrox365/v1/gyms/map",
    source_metadata: { htcx: false, third_party_integration_id: null, source_city: "渋谷区", source_region: "東京都" }, ...overrides,
  };
}

function governing(overrides: Partial<GoverningBodyObservation> = {}): GoverningBodyObservation {
  return { external_id: "HGY_h29_test", fetched_at: reviewedAt, found: true, error: null, hyrox_entity_id: "HGY_h29_test",
    official_name: "Example Training Studio", facility_url: "https://example.jp/shibuya/",
    address: { country: "JP", state: "tokyo", city: "shibuya", street: "Jingumae 1-2-3", postalCode: "1500001", geoCoordinates: { lat: 35.67, lon: 139.705 } },
    discovery_queries: [], ...overrides };
}

function website(overrides: Partial<H29WebsiteObservation> = {}): H29WebsiteObservation {
  return { external_id: "HGY_h29_test", requested_url: "https://example.jp/shibuya/", final_url: "https://example.jp/shibuya/",
    status: 200, content_type: "text/html", title: "Marketing headline | Example", canonical_url: "https://example.jp/shibuya/",
    fetched_at: reviewedAt, official_name_match: true, postal_code_match: true, address_token_match: true,
    page_postal_codes: ["1500001"], error: null, site_kind: "facility_site", source_url_kind: "governing_body_current", ...overrides };
}

const brands: GymBrandRecord[] = [];
function location(overrides: Partial<H24LocationRecord> = {}): H24LocationRecord {
  return { id: "11111111-1111-1111-1111-111111111111", slug: "example-training-studio", name: "Example Training Studio",
    brand_id: "22222222-2222-2222-2222-222222222222", brand_name: "Example", brand_slug: "example",
    address: "1500001, Tokyo, Shibuya, Jingumae 1-2-3", postal_code: "1500001", prefecture: "東京都", city: "渋谷区",
    latitude: 35.67, longitude: 139.705, official_url: "https://example.jp/shibuya/", source_url: null,
    is_active: true, location_type: "fitness_studio", ...overrides };
}

function resolve(options: { record?: H24ReviewRecord; locations?: H24LocationRecord[]; published?: Set<string>; site?: H29WebsiteObservation | null; gov?: GoverningBodyObservation } = {}) {
  const record = options.record ?? review();
  return resolveAuthorityRecord({ record, source: source({ external_id: record.hgy_external_id, official_name: record.hyrox_official_name }),
    governing: options.gov ?? governing({ external_id: record.hgy_external_id, hyrox_entity_id: record.hgy_external_id }),
    website: options.site === undefined ? website({ external_id: record.hgy_external_id }) : options.site,
    postalIndex, locations: options.locations ?? [], brands, publishedLocationIds: options.published ?? new Set(),
    reservedSlugs: new Set(), reviewedAt });
}

test("parses Japan Post UTF-8 CSV and resolves duplicate towns to one administrative authority", () => {
  const result = resolvePostalAuthority(review(), postalIndex);
  assert.equal(result.status, "POSTAL_AUTHORITY_CONFIRMED");
  assert.equal(result.candidate_count, 2);
  assert.equal(result.administrative_candidate_count, 1);
  assert.deepEqual([result.prefecture, result.city], ["東京都", "渋谷区"]);
  assert.equal(resolvePostalAuthority(review({ postal_code: "9999999" }), postalIndex).status, "POSTAL_AUTHORITY_UNRESOLVED");
  assert.equal(resolvePostalAuthority(review({ prefecture: "大阪府" }), postalIndex).status, "POSTAL_AUTHORITY_CONFLICT");
});

test("preserves all five H2-9 classifications under explicit fail-closed rules", () => {
  assert.equal(resolve().final_classification, "NEW_LOCATION_READY");
  assert.equal(resolve({ locations: [location()] }).final_classification, "EXISTING_LOCATION_CONFIRMED_MATCH");
  assert.equal(resolve({ site: null }).final_classification, "REMAINS_NEEDS_REVIEW");
  assert.equal(resolve({ record: review({ hyrox_official_name: "Virtual Gym Tokyo", canonical_name: "Virtual Gym Tokyo" }) }).final_classification, "NON_STANDARD_LOCATION");
  assert.equal(resolve({ gov: governing({ address: { postalCode: "1500001", geoCoordinates: { lat: 34, lon: 135 } } }) }).final_classification, "SOURCE_CONFLICT");
});

test("uses governing-body name rather than marketing page title and records canonical redirect", () => {
  const result = resolve({ site: website({ final_url: "https://www.example.jp/shibuya", canonical_url: "https://example.jp/shibuya/", title: "Best gym in Tokyo" }) });
  assert.equal(result.canonical_name, "Example Training Studio");
  assert.equal(result.facility_authority_url, "https://example.jp/shibuya/");
});

test("accepts strong facility and governing-linked secondary evidence, but rejects third-party-only evidence", () => {
  assert.equal(websiteStrength(website(), true), "FIRST_PARTY_STRONG");
  assert.equal(websiteStrength(website({ site_kind: "social" }), true), "OFFICIAL_SECONDARY_STRONG");
  assert.equal(websiteStrength(website({ site_kind: "booking", postal_code_match: false, official_name_match: false }), true), "INSUFFICIENT");
  assert.equal(websiteStrength(website({ status: 503, error: "HTTP 503" }), true), "UNAVAILABLE");
});

test("detects original five H2-4 blocker families exactly", () => {
  const blockers = [
    ["Facility official website is missing from the governing-body record", "MISSING_OFFICIAL_URL"],
    ["Postal authority did not resolve prefecture and city", "POSTAL_AUTHORITY_GAP"],
    ["Only a social, booking, or hosted landing-page URL is available", "SOCIAL_BOOKING_HOSTED_ONLY"],
    ["Official website did not expose enough name/address evidence for deterministic identity", "IDENTITY_ADDRESS_INSUFFICIENT"],
    ["Facility official website could not be verified live", "OFFICIAL_SITE_UNREACHABLE"],
  ] as const;
  for (const [message, expected] of blockers) assert.equal(originalBlocker(review({ conflicts: [message] })), expected);
});

test("committed artifact closes exactly the scoped 144 records and preserves blocker counts", () => {
  const artifact = JSON.parse(readFileSync("data/hyrox/h2-9-location-authority-gap-resolution.json", "utf8"));
  assert.equal(artifact.input_count, 144);
  assert.equal(artifact.records.length, 144);
  assert.equal(new Set(artifact.records.map((record: { hgy_external_id: string }) => record.hgy_external_id)).size, 144);
  assert.deepEqual(artifact.original_blocker_counts, {
    MISSING_OFFICIAL_URL: 70, POSTAL_AUTHORITY_GAP: 41, SOCIAL_BOOKING_HOSTED_ONLY: 15,
    IDENTITY_ADDRESS_INSUFFICIENT: 14, OFFICIAL_SITE_UNREACHABLE: 4,
  });
  assert.equal(Object.values(artifact.classification_counts).reduce((sum: number, value) => sum + Number(value), 0), 144);
  const training = JSON.parse(readFileSync("data/hyrox/h2-9-training-inventory.json", "utf8"));
  const imported = new Set(training.external_identifiers.map((record: { external_identifier: string }) => record.external_identifier));
  assert.equal(artifact.records.some((record: { hgy_external_id: string }) => imported.has(record.hgy_external_id)), false);
  assert.equal(artifact.records.some((record: { final_classification: string; unresolved_gaps: string[] }) =>
    record.final_classification === "SOURCE_CONFLICT" && record.unresolved_gaps.includes("duplicate canonical facility URL")), true);
});

test("H2-9 tooling is read-only and does not infer excluded training facts", () => {
  const scripts = ["scripts/hyrox/export-h2-9-training-inventory.ts", "scripts/hyrox/observe-location-authority-gaps.ts", "scripts/hyrox/resolve-location-authority-gaps.ts"]
    .map((file) => readFileSync(file, "utf8")).join("\n");
  assert.doesNotMatch(scripts, /\.(?:insert|delete|upsert)\s*\(/i);
  assert.doesNotMatch(scripts, /client[\s\S]{0,100}\.update\s*\(/i);
  assert.doesNotMatch(scripts, /\b(?:insert|update|delete)\s+(?:into|from|public\.)/i);
  assert.doesNotMatch(scripts, /supabase\s+(?:db push|migration repair)/i);
  assert.doesNotMatch(scripts, /location_(?:equipment|training_capabilities)|class_schedules|program_training_disciplines/);
});
