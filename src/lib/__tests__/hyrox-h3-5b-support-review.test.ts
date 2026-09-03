/* eslint-disable @typescript-eslint/no-explicit-any -- assertions inspect frozen authority JSON */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import test from "node:test";
import { buildRawMonitorRun, validateRawMonitorManifest, type R2FreshnessAuthority, type RawMonitorManifest } from "../hyrox-raw-fact-monitor";
import { claimSupportPresent, validateEnrichmentManifest, type EnrichmentAuthorityManifest, type EnrichmentSourceObservation } from "../hyrox-enrichment-monitor";

const read = (path: string) => JSON.parse(fs.readFileSync(path, "utf8"));
const review = read("data/hyrox/h3-5b-cohort1-support-review.json");
const canonical = read("data/hyrox/h3-5a-enrichment-monitor-authority.json") as EnrichmentAuthorityManifest;
const raw = read("data/hyrox/h3-11d-r3-raw-monitor-live-authority.json") as RawMonitorManifest;
const r2 = read("data/hyrox/h3-11d-r2-raw-fact-freshness-authority.json") as R2FreshnessAuthority;
const fixture = read("data/hyrox/h3-11d-r3-cohort1-source-observation-fixture.json") as { observations: EnrichmentSourceObservation[]; stats: any };

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value as Record<string, unknown>)
    .sort(([a], [b]) => a.localeCompare(b)).map(([key, child]) => [key, canonicalize(child)]));
  return value;
}

test("H3-5B target set freezes exactly one canonical and three raw support signals", () => {
  assert.equal(review.targets.length, 4);
  assert.equal(new Set(review.targets.map((row: any) => row.id)).size, 4);
  const hash = createHash("sha256").update(JSON.stringify(canonicalize(review.targets.map((row: any) => ({
    id: row.id, facility: row.facility, locationId: row.locationId, hgyId: row.hgyId, kind: row.kind, type: row.type,
    sourceRef: row.sourceRef, sourceUrl: row.sourceUrl, productionId: row.productionId, monitorSignal: row.monitorSignal,
  }))))).digest("hex");
  assert.equal(hash, "f768cef6903a6402398ec738cfe4773363e3c44ac8169ae3d55346f8071aafa5");
  assert.equal(review.authority.targetSetSha256, hash);
});

test("all source bodies and facility bindings match the accepted review exactly", () => {
  assert.equal(review.sourceChecks.length, 3);
  assert.ok(review.sourceChecks.every((row: any) => row.httpStatus === 200 && row.facilityBinding === "BOUND"));
  assert.ok(review.sourceChecks.every((row: any) => row.currentContentSha256 === row.acceptedContentSha256));
  assert.ok(review.sourceChecks.every((row: any) => row.attempts === 1));
});

test("all four signals are narrow monitor false positives without data or freshness mutation", () => {
  assert.ok(review.targets.every((row: any) => row.classification === "MONITOR_FALSE_POSITIVE"));
  assert.ok(review.targets.every((row: any) => row.requiredAction === "MONITOR_MATCHER_CORRECTION_REQUIRED"));
  assert.ok(review.targets.every((row: any) => row.timeState === "FRESH" && row.expiresAt === "2026-12-01T10:00:00.000Z"));
  assert.equal(review.authority.productionWrites, false);
  assert.equal(review.authority.timestampExtension, false);
  assert.equal(review.authority.negativeInference, false);
  assert.equal(review.decision.productionDataMutationRequired, false);
});

test("canonical Ashiya matcher recognizes only the exact continuing turf and sled support", () => {
  validateEnrichmentManifest(canonical);
  const claim = canonical.claims.find((row) => row.claimKey === "capability:9d7ac2ff-be49-4219-bcde-75e3745df6a4:sled-push-pull-space")!;
  assert.ok(claimSupportPresent(claim, "当ジムではSled Push/Pullを練習できます。HYROX ターフを導入しております。"));
  assert.equal(claimSupportPresent(claim, "Sled Push/Pullの種目を紹介します。"), false);
});

test("corrected raw target matchers pass the accepted source fixture without hiding other checks", () => {
  validateRawMonitorManifest(raw, r2);
  const run = buildRawMonitorRun({ manifest: raw, authority: r2, sourceObservations: fixture.observations,
    checkedAt: "2026-09-03T00:30:00.000Z", requestStats: fixture.stats });
  const ids = new Set(review.targets.filter((row: any) => row.kind === "raw_fact").map((row: any) => row.id));
  const records = run.records.filter((row) => ids.has(row.observationKey));
  assert.equal(records.length, 3);
  assert.ok(records.every((row) => row.supportStatus === "PRESENT" && !row.classifications.includes("SUPPORT_DRIFT")));
  assert.ok(records.every((row) => row.reconfirmed === false));
});

test("correction artifacts contain no Production write or broad monitor suppression", () => {
  const script = fs.readFileSync("scripts/hyrox/apply-h3-5b-cohort1-support-monitor-correction.ts", "utf8");
  assert.doesNotMatch(script, /createClient|SUPABASE_SERVICE_ROLE_KEY|\.from\([^)]*\)\.(?:insert|update|delete)/i);
  assert.doesNotMatch(script, /supportCheck\s*=\s*\{\s*mode:\s*"CHECK_UNAVAILABLE"/);
});
