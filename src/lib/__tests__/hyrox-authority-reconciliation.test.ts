import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import type { H29Override, H29ResolutionRecord } from "../hyrox-location-authority-resolution";

const TARGET = "HGY_8sKmKHEiaR8tARb6zZUUbaYjU";
const OLD_HASH = "80c8714779aa16d9d6aa1901f4ca94f2cc70b3c5263b98914534e1a15d4575e6";
const NEW_HASH = "2f7c725e0dd81428115a815d7f79a1e2b30776764d94b5a973283cdcaec206aa";
const NON_TARGET_HASH = "6aa7cc90568a7dc032690055d849966c1d297a2b1fb1707a352971bdbfb83098";
const json = <T>(file: string): T => JSON.parse(readFileSync(file, "utf8")) as T;

type ReconciliationAudit = {
  target_hgy_id: string;
  old_h2_9_contract_sha256: string;
  old_authority: { status: number; final_url: string };
  replacement_authority: { status: number; final_url: string; checks: Record<string, boolean> };
  governing_body: { checks: Record<string, boolean> };
  reconciliation: { identity_continuity: string };
  semantic_fields_unchanged: string[];
};
type ResolutionArtifact = {
  deterministic_contract_sha256: string;
  classification_counts: Record<string, number>;
  duplicate_audit: { shared_brand_locator_urls: string[]; canonical_facility_urls: string[] };
  records: H29ResolutionRecord[];
};
type RevalidationArtifact = {
  input_count: number;
  reconciled_h2_9_contract_sha256: string;
  governing_body_pass_count: number;
  facility_authority_pass_count: number;
  collision_pass_count: number;
  remaining_authority_drift_count: number;
  records: Array<{ blockers: string[] }>;
};

test("records the retired facility URL and current first-party locator without changing location semantics", () => {
  const audit = json<ReconciliationAudit>("data/hyrox/h2-10r-tokorozawa-authority-reconciliation.json");
  assert.equal(audit.target_hgy_id, TARGET);
  assert.equal(audit.old_h2_9_contract_sha256, OLD_HASH);
  assert.equal(audit.old_authority.status, 404);
  assert.equal(audit.old_authority.final_url, "https://www.gym-field.com/studio/%E6%89%80%E6%B2%A2/");
  assert.equal(audit.replacement_authority.status, 200);
  assert.equal(audit.replacement_authority.final_url, "https://www.gym-field.com/studio/");
  assert.ok(Object.values(audit.governing_body.checks).every(Boolean));
  assert.ok(Object.values(audit.replacement_authority.checks).every(Boolean));
  assert.equal(audit.reconciliation.identity_continuity, "confirmed");
  assert.deepEqual(audit.semantic_fields_unchanged, [
    "canonical_name", "canonical_address", "postal_code", "prefecture", "city", "latitude", "longitude",
    "brand_resolution", "proposed_brand_name", "proposed_brand_slug", "proposed_location_type", "proposed_slug",
  ]);
});

test("updates exactly one structured override and preserves old-to-new authority history", () => {
  const artifact = json<{ records: H29Override[] }>("data/hyrox/h2-9-authority-resolution-overrides.json");
  const reconciled = artifact.records.filter((record) => record.authority_reconciliation);
  assert.equal(reconciled.length, 1);
  const target = reconciled[0];
  assert.ok(target?.authority_reconciliation);
  assert.equal(target.hgy_external_id, TARGET);
  assert.equal(target.facility_authority_url, "https://www.gym-field.com/studio/");
  assert.equal(target.authority_reconciliation.old_http_status, 404);
  assert.equal(target.authority_reconciliation.old_authority_state, "unavailable");
  assert.equal(target.authority_reconciliation.reviewer_decision, "approved");
});

test("re-freezes the same 58-record READY set and changes no non-target resolution record", () => {
  const artifact = json<ResolutionArtifact>("data/hyrox/h2-9-location-authority-gap-resolution.json");
  assert.equal(artifact.deterministic_contract_sha256, NEW_HASH);
  assert.deepEqual(artifact.classification_counts, {
    NEW_LOCATION_READY: 58,
    EXISTING_LOCATION_CONFIRMED_MATCH: 0,
    REMAINS_NEEDS_REVIEW: 83,
    NON_STANDARD_LOCATION: 0,
    SOURCE_CONFLICT: 3,
  });
  const target = artifact.records.find((record) => record.hgy_external_id === TARGET);
  assert.ok(target);
  assert.equal(target.final_classification, "NEW_LOCATION_READY");
  assert.equal(target.facility_authority_url, "https://www.gym-field.com/studio/");
  assert.equal(target.canonical_name, "ジムフィールド 所沢スタジオ");
  assert.equal(target.canonical_address, "3590023, 所沢市, 東所沢和田３丁目３１−３");
  assert.equal(target.proposed_brand_slug, "gym-field");
  assert.equal(target.proposed_slug, "hyrox-training-club-3590023");
  const nonTarget = artifact.records.filter((record) => record.hgy_external_id !== TARGET);
  assert.equal(createHash("sha256").update(JSON.stringify(nonTarget)).digest("hex"), NON_TARGET_HASH);
});

test("allows a shared official brand locator while retaining material facility URL conflicts", () => {
  const artifact = json<ResolutionArtifact>("data/hyrox/h2-9-location-authority-gap-resolution.json");
  assert.deepEqual(artifact.duplicate_audit.shared_brand_locator_urls, ["gym-field.com/studio"]);
  assert.deepEqual(artifact.duplicate_audit.canonical_facility_urls, ["orangetheoryfitness.co.jp/nagoya-yagoto-ikeshita"]);
  const shared = artifact.records.filter((record) => record.facility_authority_url === "https://www.gym-field.com/studio/");
  assert.equal(shared.length, 2);
  assert.ok(shared.every((record) => record.final_classification === "NEW_LOCATION_READY"));
});

test("passes all 58 governing-body, facility-authority, and production-collision gates", () => {
  const artifact = json<RevalidationArtifact>("data/hyrox/h2-10r-ready-set-revalidation.json");
  assert.equal(artifact.input_count, 58);
  assert.equal(artifact.reconciled_h2_9_contract_sha256, NEW_HASH);
  assert.equal(artifact.governing_body_pass_count, 58);
  assert.equal(artifact.facility_authority_pass_count, 58);
  assert.equal(artifact.collision_pass_count, 58);
  assert.equal(artifact.remaining_authority_drift_count, 0);
  assert.ok(artifact.records.every((record) => record.blockers.length === 0));
});

test("H2-10R tooling remains read-only and does not itself generate the H2-10 import graph", () => {
  const scripts = [
    "scripts/hyrox/reconcile-authority-drift.ts",
    "scripts/hyrox/revalidate-reconciled-ready-set.ts",
  ].map((file) => readFileSync(file, "utf8")).join("\n");
  assert.doesNotMatch(scripts, /\.(?:insert|update|delete|upsert)\s*\(/i);
  assert.doesNotMatch(scripts, /\b(?:insert|update|delete)\s+(?:into|from|public\.)/i);
  assert.doesNotMatch(scripts, /supabase\s+(?:db push|migration repair)/i);
  assert.doesNotMatch(scripts, /location_(?:equipment|training_capabilities)|class_schedules|program_training_disciplines/);
  assert.doesNotMatch(scripts, /h2-10-reviewed-new-location-import-candidate/);
});
