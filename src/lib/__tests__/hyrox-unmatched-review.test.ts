import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  reviewUnmatchedRecord,
  semanticSlug,
  validJapanCoordinates,
  type GymBrandRecord,
  type H24LocationRecord,
  type PostalObservation,
  type WebsiteObservation,
} from "../hyrox-unmatched-review";
import { HYROX_SOURCE_NAMESPACE, type OfficialClubRecord, type ResolutionRecord } from "../hyrox-official-clubs";

const source = (overrides: Partial<OfficialClubRecord> = {}): OfficialClubRecord => ({
  source_namespace: HYROX_SOURCE_NAMESPACE,
  external_id: "HGY_h24_test",
  external_id_status: "stable",
  official_name: "Example Training Studio",
  country: "JP",
  prefecture: null,
  city: null,
  address: "〒150-0001 東京都渋谷区神宮前1-2-3",
  postal_code: "150-0001",
  latitude: 35.6701,
  longitude: 139.7051,
  official_source_url: "https://hyrox-training-finder.hyrox.com/gym/HGY_h24_test",
  facility_url: "https://example-training.jp/shibuya/",
  observed_at: "2026-08-29T00:00:00.000Z",
  source_url: "https://onefiit-api.platform.onefiit.com/hyrox365/v1/gyms/map",
  source_metadata: { htcx: false, third_party_integration_id: null, source_city: "渋谷区", source_region: "東京都" },
  ...overrides,
});

const resolution = (overrides: Partial<ResolutionRecord> = {}): ResolutionRecord => ({
  source_namespace: HYROX_SOURCE_NAMESPACE,
  official_external_id: "HGY_h24_test",
  official_name: "Example Training Studio",
  official_address: "〒150-0001 東京都渋谷区神宮前1-2-3",
  official_source_url: "https://hyrox-training-finder.hyrox.com/gym/HGY_h24_test",
  facility_url: "https://example-training.jp/shibuya/",
  gymmap_location_id: null,
  gymmap_slug: null,
  gymmap_name: null,
  resolution_status: "UNMATCHED",
  match_method: "no-plausible-candidate",
  score: null,
  coordinate_distance_meters: null,
  reasons: [],
  conflicts: [],
  manual_review_required: true,
  candidates: [],
  ...overrides,
});

const location = (overrides: Partial<H24LocationRecord> = {}): H24LocationRecord => ({
  id: "11111111-1111-1111-1111-111111111111",
  slug: "example-training-studio-shibuya",
  name: "Example Training Studio Shibuya",
  brand_id: "22222222-2222-2222-2222-222222222222",
  brand_name: "Example",
  brand_slug: "example",
  address: "東京都渋谷区神宮前1-2-3",
  postal_code: "1500001",
  prefecture: "東京都",
  city: "渋谷区",
  latitude: 35.6701,
  longitude: 139.7051,
  official_url: "https://example-training.jp/shibuya/",
  source_url: null,
  is_active: true,
  location_type: "fitness_studio",
  ...overrides,
});

const website = (overrides: Partial<WebsiteObservation> = {}): WebsiteObservation => ({
  external_id: "HGY_h24_test",
  requested_url: "https://example-training.jp/shibuya/",
  final_url: "https://example-training.jp/shibuya/",
  status: 200,
  content_type: "text/html",
  title: "Example Training Studio Shibuya",
  canonical_url: "https://example-training.jp/shibuya/",
  fetched_at: "2026-08-29T00:00:00.000Z",
  official_name_match: true,
  postal_code_match: true,
  address_token_match: true,
  page_postal_codes: ["1500001"],
  error: null,
  ...overrides,
});

const postal: PostalObservation = { postal_code: "1500001", prefecture: "東京都", city: "渋谷区", town: "神宮前", status: "resolved" };
const brands: GymBrandRecord[] = [{ id: "gold-id", name: "Gold's Gym", slug: "golds-gym", official_url: "https://www.goldsgym.jp/" }];

function review(options: {
  source?: OfficialClubRecord;
  locations?: H24LocationRecord[];
  website?: WebsiteObservation;
  postal?: PostalObservation;
  reservedSlugs?: Set<string>;
} = {}) {
  const sourceRecord = options.source ?? source();
  return reviewUnmatchedRecord({
    resolution: resolution({ official_external_id: sourceRecord.external_id }),
    source: sourceRecord,
    locations: options.locations ?? [],
    brands,
    website: options.website,
    postal: options.postal,
    reservedSlugs: options.reservedSlugs,
  });
}

test("classifies an exact official final-URL match as EXISTING_LOCATION_CONFIRMED_MATCH", () => {
  const result = review({ locations: [location()], website: website() });
  assert.equal(result.final_classification, "EXISTING_LOCATION_CONFIRMED_MATCH");
  assert.equal(result.matched_location_id, location().id);
  assert.equal(result.manual_review_required, false);
});

test("classifies multiple existing final-URL matches as EXISTING_LOCATION_AMBIGUOUS", () => {
  const result = review({ locations: [location(), location({ id: "33333333-3333-3333-3333-333333333333", slug: "duplicate" })], website: website() });
  assert.equal(result.final_classification, "EXISTING_LOCATION_AMBIGUOUS");
  assert.equal(result.manual_review_required, true);
});

test("classifies a verified official site, postal authority, and coordinates as NEW_LOCATION_READY", () => {
  const result = review({ website: website(), postal });
  assert.equal(result.final_classification, "NEW_LOCATION_READY");
  assert.equal(result.prefecture, "東京都");
  assert.equal(result.city, "渋谷区");
  assert.equal(result.is_active_candidate, true);
});

test("fails closed to NEW_LOCATION_NEEDS_REVIEW when the official facility URL is missing", () => {
  const result = review({ source: source({ facility_url: null }) });
  assert.equal(result.final_classification, "NEW_LOCATION_NEEDS_REVIEW");
});

test("classifies rental or virtual entities as NON_STANDARD_LOCATION", () => {
  const result = review({ source: source({ official_name: "Rental Gym BTB" }) });
  assert.equal(result.final_classification, "NON_STANDARD_LOCATION");
});

test("classifies a reviewed governing-body/facility conflict through a structured override", () => {
  const sourceRecord = source();
  const result = reviewUnmatchedRecord({
    resolution: resolution(),
    source: sourceRecord,
    locations: [],
    brands,
    website: website({ postal_code_match: false, page_postal_codes: ["5300001"] }),
    postal,
    override: {
      external_id: sourceRecord.external_id!,
      decision: "SOURCE_CONFLICT",
      reason: "Manual review confirmed that the two authorities identify different facilities",
      reviewed_source_url: sourceRecord.facility_url!,
      reviewed_at: "2026-08-29T00:00:00.000Z",
    },
  });
  assert.equal(result.final_classification, "SOURCE_CONFLICT");
  assert.equal(result.match_method, "structured-manual-override");
});

test("rejects missing address, invalid coordinates, and proposed slug collisions", () => {
  assert.equal(review({ source: source({ address: null }), website: website(), postal }).final_classification, "NEW_LOCATION_NEEDS_REVIEW");
  assert.equal(review({ source: source({ latitude: 5 }), website: website(), postal }).final_classification, "NEW_LOCATION_NEEDS_REVIEW");
  const slug = semanticSlug(source().official_name, source().postal_code)!;
  assert.equal(review({ website: website(), postal, reservedSlugs: new Set([slug]) }).final_classification, "NEW_LOCATION_NEEDS_REVIEW");
});

test("resolves existing, chain-candidate, and independent brand representations", () => {
  assert.equal(review({ source: source({ official_name: "Gold's Gym New Branch" }), website: website(), postal }).brand_resolution, "EXISTING_BRAND_MATCH");
  assert.equal(review({ source: source({ official_name: "Orangetheory Fitness New Branch" }), website: website(), postal }).brand_resolution, "NEW_BRAND_CANDIDATE");
  assert.equal(review({ website: website(), postal }).brand_resolution, "INDEPENDENT_FACILITY");
  const nota = review({ source: source({ official_name: "NOTA GYM 西京極店" }), website: website(), postal });
  assert.equal(nota.brand_resolution, "NEW_BRAND_CANDIDATE");
  assert.equal(nota.proposed_slug, "nota-gym-1500001");
});

test("validates Japan coordinate bounds and stable semantic slugs", () => {
  assert.equal(validJapanCoordinates(35.6, 139.7), true);
  assert.equal(validJapanCoordinates(10, 139.7), false);
  assert.equal(semanticSlug("Ｆ４５ Training 渋谷", "1500001"), "f45-training");
  assert.equal(semanticSlug("渋谷", "1500001"), "hyrox-training-club-1500001");
});

test("H2-4 tooling is read-only and does not infer out-of-scope facts", () => {
  const scripts = [
    "scripts/hyrox/export-h2-4-inventory.ts",
    "scripts/hyrox/review-unmatched-training-clubs.ts",
  ].map((file) => readFileSync(file, "utf8")).join("\n");
  assert.doesNotMatch(scripts, /\.(?:insert|update|delete|upsert)\s*\(/i);
  assert.doesNotMatch(scripts, /\b(?:insert|update|delete)\s+(?:into|from|public\.)/i);
  assert.doesNotMatch(scripts, /supabase\s+(?:db push|migration repair)/i);
  assert.doesNotMatch(scripts, /location_(?:equipment|training_capabilities)|class_schedules|program_training_disciplines/);
});
