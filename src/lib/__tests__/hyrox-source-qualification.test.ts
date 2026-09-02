import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import test from "node:test";

const manifestPath = "data/hyrox/h3-11c-source-qualification.json";
const authorityPath = "data/hyrox/h3-11a-station-evidence-authority.json";

type Source = {
  source_url: string;
  final_url: string;
  source_class: string;
  facility_binding: string;
  access_state: string;
  extraction_surface: string;
  stability_notes: string;
  js_browser_rendering_required: boolean;
  authentication_required: boolean;
  facility_specific_content_present: boolean;
};

type Facility = {
  identity: {
    hgy_id: string;
    location_id: string;
    slug: string;
    facility_name: string;
    current_official: boolean;
    current_positive_enrichment_count: number;
  };
  extraction_strategy: string;
  cohort_id: string;
  official_sources: Source[];
};

type Cohort = {
  id: string;
  priority: number;
  strategy: string;
  hgy_ids: string[];
  facility_count: number;
  official_source_entrypoints: Array<{ hgy_id: string; urls: string[] }>;
};

type Manifest = {
  target_set: { target_count: number; target_set_sha256: string };
  facilities: Facility[];
  cohorts: Cohort[];
  holds: unknown[];
  legacy_review: { legacy_review_available: number; no_prior_review_authority: number };
  vocabularies: { source_classes: string[]; facility_bindings: string[]; extraction_strategies: string[] };
  invariants: Record<string, boolean>;
  deterministic_hashes: {
    target_set_sha256: string;
    source_url_set_sha256: string;
    cohort_plan_sha256: string;
    qualification_manifest_sha256: string | null;
  };
  [key: string]: unknown;
};

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as Manifest;
const authority = JSON.parse(fs.readFileSync(authorityPath, "utf8")) as { sourceClasses: Array<{ id: string }> };

function stable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return Object.fromEntries(Object.keys(record).sort().map((key) => [key, stable(record[key])]));
  }
  return value;
}

function sha(value: unknown): string {
  return crypto.createHash("sha256").update(`${JSON.stringify(stable(value))}\n`).digest("hex");
}

test("H3-11C target set is complete, unique, and deterministically ordered", () => {
  const facilities = manifest.facilities;
  assert.equal(manifest.target_set.target_count, 57);
  assert.equal(facilities.length, 57);
  assert.equal(new Set(facilities.map((row) => row.identity.hgy_id)).size, 57);
  assert.equal(new Set(facilities.map((row) => row.identity.location_id)).size, 57);
  assert.deepEqual(
    facilities.map((row) => row.identity.hgy_id),
    facilities.map((row) => row.identity.hgy_id).toSorted(),
  );
  for (const facility of facilities) {
    assert.equal(facility.identity.current_official, true);
    assert.equal(facility.identity.current_positive_enrichment_count, 0);
    assert.ok(facility.identity.hgy_id);
    assert.ok(facility.identity.location_id);
    assert.ok(facility.identity.slug);
    assert.ok(facility.identity.facility_name);
  }

  const identity = facilities.map((row) => ({
    hgy_id: row.identity.hgy_id,
    location_id: row.identity.location_id,
    slug: row.identity.slug,
  }));
  assert.equal(sha(identity), manifest.target_set.target_set_sha256);
  assert.equal(manifest.target_set.target_set_sha256, manifest.deterministic_hashes.target_set_sha256);
});

test("H3-11C source taxonomy, bindings, access, URLs, and strategies fail closed", () => {
  const authorityClasses = authority.sourceClasses.map((row) => row.id).toSorted();
  assert.deepEqual(manifest.vocabularies.source_classes.toSorted(), authorityClasses);

  const sourceClasses = new Set(manifest.vocabularies.source_classes);
  const bindings = new Set(manifest.vocabularies.facility_bindings);
  const strategies = new Set(manifest.vocabularies.extraction_strategies);
  const accessStates = new Set(["AVAILABLE", "MONITORED_AVAILABLE", "ACCESS_BLOCKED", "HTTP_ERROR", "NETWORK_ERROR", "TIMEOUT"]);
  const seenUrls = new Set<string>();

  for (const facility of manifest.facilities) {
    assert.ok(strategies.has(facility.extraction_strategy));
    assert.ok(facility.official_sources.length >= 2);
    assert.ok(facility.cohort_id);
    for (const source of facility.official_sources) {
      assert.ok(sourceClasses.has(source.source_class), source.source_class);
      assert.ok(bindings.has(source.facility_binding), source.facility_binding);
      assert.ok(accessStates.has(source.access_state), source.access_state);
      const parsed = new URL(source.source_url);
      assert.ok(["http:", "https:"].includes(parsed.protocol));
      assert.ok(source.final_url);
      assert.ok(source.extraction_surface);
      assert.ok(source.stability_notes);
      assert.equal(typeof source.js_browser_rendering_required, "boolean");
      assert.equal(typeof source.authentication_required, "boolean");
      assert.equal(source.facility_specific_content_present, ["FACILITY_SPECIFIC", "BRAND_FACILITY_SPECIFIC"].includes(source.facility_binding));
      seenUrls.add(source.source_url);
    }
  }

  assert.equal(sha([...seenUrls].toSorted()), manifest.deterministic_hashes.source_url_set_sha256);
});

test("H3-11C cohort plan is a complete non-overlapping partition", () => {
  const target = new Set(manifest.facilities.map((row) => row.identity.hgy_id));
  const members = manifest.cohorts.flatMap((cohort) => cohort.hgy_ids);
  assert.equal(members.length, 57);
  assert.equal(new Set(members).size, 57);
  assert.deepEqual(new Set(members), target);

  for (const cohort of manifest.cohorts) {
    assert.equal(cohort.facility_count, cohort.hgy_ids.length);
    assert.equal(cohort.official_source_entrypoints.length, cohort.hgy_ids.length);
  }
  const plan = manifest.cohorts.map(({ id, priority, strategy, hgy_ids }) => ({ id, priority, strategy, hgy_ids }));
  assert.equal(sha(plan), manifest.deterministic_hashes.cohort_plan_sha256);
});

test("H3-11C preserves legacy-review and no-production semantic boundaries", () => {
  assert.equal(manifest.legacy_review.legacy_review_available, 11);
  assert.equal(manifest.legacy_review.no_prior_review_authority, 46);
  assert.equal(manifest.holds.length, 0);
  assert.deepEqual(manifest.invariants, {
    source_qualification_is_review_complete: false,
    review_ledger_writes: false,
    no_positive_found_recorded: false,
    station_derivation: false,
    equipment_or_capability_claims_recorded: false,
    production_mutation: false,
  });

  const prohibitedKeys = new Set([
    "review_progress",
    "source_sufficiency",
    "positive_outcome",
    "station_claims",
    "station_state",
    "confirmed_equipment",
    "confirmed_capabilities",
    "review_unit",
  ]);
  const walk = (value: unknown): void => {
    if (Array.isArray(value)) return value.forEach(walk);
    if (!value || typeof value !== "object") return;
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      assert.equal(prohibitedKeys.has(key), false, `prohibited semantic field: ${key}`);
      walk(child);
    }
  };
  walk(manifest);
});

test("H3-11C manifest hash is reproducible under the documented null-self-hash rule", () => {
  const copy = structuredClone(manifest);
  const observed = copy.deterministic_hashes.qualification_manifest_sha256;
  copy.deterministic_hashes.qualification_manifest_sha256 = null;
  assert.equal(sha(copy), observed);
});
