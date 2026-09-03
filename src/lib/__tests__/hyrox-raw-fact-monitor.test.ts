import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {
  ACCEPTED_R2_HASHES,
  buildRawMonitorRun,
  rawMonitorManifestHash,
  rawMonitorPacketHash,
  rawMonitorReleaseCoherenceHash,
  validateR2FreshnessAuthority,
  validateRawMonitorManifest,
  type R2FreshnessAuthority,
  type RawMonitorEntry,
  type RawMonitorManifest,
} from "../hyrox-raw-fact-monitor";
import { observeRawMonitorSources } from "../hyrox-raw-fact-monitor-source";
import type { EnrichmentSourceObservation } from "../hyrox-enrichment-monitor";

const r2 = JSON.parse(
  fs.readFileSync("data/hyrox/h3-11d-r2-raw-fact-freshness-authority.json", "utf8"),
) as R2FreshnessAuthority;
const live = JSON.parse(
  fs.readFileSync("data/hyrox/h3-11d-r3-raw-monitor-live-authority.json", "utf8"),
) as RawMonitorManifest;
const candidate = JSON.parse(
  fs.readFileSync("data/hyrox/h3-11d-r3-cohort1-monitor-candidate.json", "utf8"),
) as RawMonitorManifest;
const fixture = JSON.parse(
  fs.readFileSync("data/hyrox/h3-11d-r3-cohort1-source-observation-fixture.json", "utf8"),
) as { observations: EnrichmentSourceObservation[]; stats: { entries: number; uniqueSources: number; requestsAfterDedup: number; retries: number; concurrency: number } };

function rehash(manifest: RawMonitorManifest) {
  manifest.authority.monitorPacketHash = rawMonitorPacketHash(manifest);
  manifest.manifestHash = rawMonitorManifestHash(manifest);
  return manifest;
}

function changed(mutator: (manifest: RawMonitorManifest) => void) {
  const manifest = structuredClone(candidate);
  mutator(manifest);
  return rehash(manifest);
}

function healthyRun(manifest = candidate, checkedAt = "2026-09-03T00:00:00.000Z", observations = fixture.observations) {
  return buildRawMonitorRun({ manifest, authority: r2, sourceObservations: observations, checkedAt, requestStats: fixture.stats });
}

function record(run: ReturnType<typeof healthyRun>, key: string) {
  return run.records.find((item) => item.observationKey === key)!;
}

function oneSourceManifest(key: string) {
  const manifest = structuredClone(candidate);
  const entry = manifest.entries.find((item) => item.observationKey === key)!;
  manifest.entries = manifest.entries.filter((item) => item.sourceKeys[0] === entry.sourceKeys[0]);
  manifest.sources = manifest.sources.filter((source) => source.sourceKey === entry.sourceKeys[0]);
  manifest.counts = {
    sources: manifest.sources.length,
    entries: manifest.entries.length,
    rawFacts: manifest.entries.filter((item) => item.kind === "raw_fact").length,
    restrictions: manifest.entries.filter((item) => item.kind === "restriction").length,
  };
  return rehash(manifest);
}

test("accepted R2 authority and both monitor manifests are deterministic", () => {
  validateR2FreshnessAuthority(r2);
  validateRawMonitorManifest(live, r2);
  validateRawMonitorManifest(candidate, r2);
  assert.deepEqual(r2.deterministic_hashes, {
    freshness_policy_authority_sha256: ACCEPTED_R2_HASHES.freshnessPolicy,
    fact_policy_mapping_sha256: ACCEPTED_R2_HASHES.factMapping,
    restriction_policy_mapping_sha256: ACCEPTED_R2_HASHES.restrictionMapping,
    cohort1_freshness_mapping_sha256: ACCEPTED_R2_HASHES.cohort1Mapping,
  });
  assert.equal(rawMonitorManifestHash(live), live.manifestHash);
  assert.equal(rawMonitorManifestHash(candidate), candidate.manifestHash);
  assert.equal(rawMonitorPacketHash(live), live.authority.monitorPacketHash);
  assert.equal(rawMonitorPacketHash(candidate), candidate.authority.monitorPacketHash);
  const corrupted = structuredClone(r2);
  corrupted.policies[0].horizon_days += 1;
  assert.throws(() => validateR2FreshnessAuthority(corrupted), /authority hash mismatch/);
});

test("live inventory contains both released Cohorts while the accepted Cohort 1 candidate remains frozen", () => {
  assert.deepEqual(live.counts, { sources: 15, entries: 45, rawFacts: 33, restrictions: 12 });
  assert.equal(live.mode, "LIVE_MONITORED");
  assert.equal(candidate.mode, "CANDIDATE_NOT_IMPORTED");
  assert.deepEqual(candidate.counts, { sources: 9, entries: 23, rawFacts: 19, restrictions: 4 });
  assert.equal(candidate.entries.every((entry) => entry.expectedPersistenceKey === null), true);
  const run = healthyRun();
  assert.equal(run.records.length, 23);
  assert.equal(run.records.every((item) => item.timeState === "FRESH" && item.currentForDependencyEvaluation), true);
  assert.equal(run.records.every((item) => item.reconfirmed === false), true);
});

test("all 13 raw types and four restriction types consume the accepted policy map", () => {
  const candidateRawTypes = new Set(candidate.entries.filter((entry) => entry.kind === "raw_fact").flatMap((entry) => entry.typeKeys));
  const candidateRestrictionTypes = new Set(candidate.entries.filter((entry) => entry.kind === "restriction").flatMap((entry) => entry.typeKeys));
  const acceptedRawTypes = new Set(r2.fact_type_mappings.map((row) => row.fact_type));
  assert.equal(acceptedRawTypes.size, 13);
  assert.equal([...candidateRawTypes].every((type) => acceptedRawTypes.has(type)), true);
  assert.equal(candidateRawTypes.size, 12, "appointment-use has no accepted Cohort 1 observation and is not manufactured");
  assert.equal(candidateRawTypes.has("appointment-use-confirmed"), false);
  assert.deepEqual(candidateRestrictionTypes, new Set(r2.restriction_type_mappings.map((row) => row.restriction_type)));
  assert.equal(r2.policies.length, 5);
});

test("A: a 180-day wall-ball fact remains fresh without reconfirmation", () => {
  const target = "HGY_Cl8QF5olON4Y0D7mho4iGg34L-equipment-wall-ball";
  const result = record(healthyRun(), target);
  assert.equal(result.timeState, "FRESH");
  assert.equal(result.currentForDependencyEvaluation, true);
  assert.equal(result.reconfirmed, false);
  assert.equal(result.reviewedAt, "2026-09-02T10:00:00.000Z");
});

test("B-C: DUE_SOON and URGENT use the existing inclusive boundaries", () => {
  const carry = candidate.entries.find((entry) => entry.observationKey.endsWith("space-farmers-carry"))!;
  const usage = candidate.entries.find((entry) => entry.observationKey.endsWith("usage-program-simulation"))!;
  const dueAt = new Date(Date.parse(carry.freshnessExpiresAt) - 30 * 86_400_000 + 1_000).toISOString();
  const urgentAt = new Date(Date.parse(usage.freshnessExpiresAt) - 14 * 86_400_000 + 1_000).toISOString();
  assert.equal(record(healthyRun(candidate, dueAt), carry.observationKey).timeState, "DUE_SOON");
  assert.equal(record(healthyRun(candidate, urgentAt), usage.observationKey).timeState, "URGENT");
});

test("D: an explicit restriction end date wins over the generic horizon", () => {
  const key = "HGY_CKpn4DHneWfrqTUVaA7D5Whop-restriction-reservation";
  const manifest = changed((value) => {
    const entry = value.entries.find((item) => item.observationKey === key)!;
    entry.sourceExplicitEndsAt = "2026-09-12T10:00:00.000Z";
    entry.freshnessExpiresAt = entry.sourceExplicitEndsAt;
  });
  const result = record(healthyRun(manifest, "2026-09-12T09:59:59.000Z"), key);
  assert.equal(result.effectiveFreshnessExpiresAt, "2026-09-12T10:00:00.000Z");
  assert.equal(result.timeState, "URGENT");
});

test("E and N: time expiry is historical-only and stale restriction never means unrestricted", () => {
  const raw = candidate.entries.find((entry) => entry.kind === "raw_fact")!;
  const restriction = candidate.entries.find((entry) => entry.kind === "restriction")!;
  const rawResult = record(healthyRun(candidate, raw.freshnessExpiresAt), raw.observationKey);
  const restrictionResult = record(healthyRun(candidate, restriction.freshnessExpiresAt), restriction.observationKey);
  assert.equal(rawResult.timeState, "TIME_EXPIRED");
  assert.equal(rawResult.currentForDependencyEvaluation, false);
  assert.ok(restrictionResult.classifications.includes("NO_CURRENT_RESTRICTION_AUTHORITY"));
  assert.equal(JSON.stringify(restrictionResult).includes("UNRESTRICTED"), false);
});

test("F: removed support becomes SUPPORT_DRIFT before expiry without a negative fact", () => {
  const key = "HGY_6lR3pcwsQaSGSlsQTdrNrO1jc-space-push-pull-carry";
  const entry = candidate.entries.find((item) => item.observationKey === key)!;
  const source = candidate.sources.find((item) => item.sourceKey === entry.sourceKeys[0])!;
  const observations = structuredClone(fixture.observations);
  const observation = observations.find((item) => item.sourceKey === source.sourceKey)!;
  observation.normalizedContent = source.facilityIdentityPatternGroups.map((group) => group[0]).join(" ");
  const result = record(healthyRun(candidate, "2026-09-03T00:00:00.000Z", observations), key);
  assert.ok(result.classifications.includes("SUPPORT_DRIFT"));
  assert.equal(result.currentForDependencyEvaluation, false);
  assert.equal(JSON.stringify(result).includes("unavailable"), false);
});

test("G and M: generic binding drift is distinct from an unreviewed bound replacement", () => {
  const key = "HGY_4GF2DeDJoIzNRU4jn9scAv65V-usage-program-simulation";
  const entry = candidate.entries.find((item) => item.observationKey === key)!;
  const source = candidate.sources.find((item) => item.sourceKey === entry.sourceKeys[0])!;
  let observations = structuredClone(fixture.observations);
  let observation = observations.find((item) => item.sourceKey === source.sourceKey)!;
  observation.finalUrl = "https://www.club360.jp/";
  observation.materialRedirect = true;
  observation.normalizedContent = "generic booking home";
  let result = record(healthyRun(candidate, "2026-09-03T00:00:00.000Z", observations), key);
  assert.ok(result.classifications.includes("FACILITY_BINDING_DRIFT"));
  assert.equal(result.currentForDependencyEvaluation, false);

  observations = structuredClone(fixture.observations);
  observation = observations.find((item) => item.sourceKey === source.sourceKey)!;
  observation.finalUrl = "https://www.club360.jp/new-hyrox";
  observation.materialRedirect = true;
  result = record(healthyRun(candidate, "2026-09-03T00:00:00.000Z", observations), key);
  assert.ok(result.classifications.includes("SOURCE_REVIEW_REQUIRED"));
  assert.equal(result.reconfirmed, false);
  assert.equal(result.reviewedAt, entry.reviewedAt);
});

test("H: 429 honors Retry-After and succeeds on the bounded second attempt", async () => {
  const manifest = oneSourceManifest("HGY_6lR3pcwsQaSGSlsQTdrNrO1jc-equipment-sled-rope");
  let calls = 0;
  const waits: number[] = [];
  const result = await observeRawMonitorSources(manifest, {
    maxAttempts: 2,
    sleep: async (milliseconds) => { waits.push(milliseconds); },
    fetchImpl: async (input) => {
      calls += 1;
      const response = new Response(calls === 1 ? "rate limited" : "fitone shibuya 渋谷 sled rope push pull carry run", {
        status: calls === 1 ? 429 : 200,
        headers: calls === 1 ? { "Retry-After": "2" } : undefined,
      });
      Object.defineProperty(response, "url", { value: String(input) });
      return response;
    },
  });
  assert.equal(calls, 2);
  assert.deepEqual(waits, [2_000]);
  assert.equal(result.stats.retries, 1);
  assert.equal(result.observations[0].status, "AVAILABLE");

  const exhausted = await observeRawMonitorSources(manifest, {
    maxAttempts: 2,
    sleep: async () => {},
    fetchImpl: async (input) => {
      const response = new Response("rate limited", { status: 429, headers: { "Retry-After": "1" } });
      Object.defineProperty(response, "url", { value: String(input) });
      return response;
    },
  });
  const run = buildRawMonitorRun({ manifest, authority: r2, sourceObservations: exhausted.observations, checkedAt: "2026-09-03T00:00:00.000Z", requestStats: exhausted.stats });
  assert.ok(run.records.every((item) => item.classifications.includes("MONITOR_ERROR")));
  assert.ok(run.records.every((item) => !item.classifications.includes("SUPPORT_DRIFT")));
});

test("I: timeout after the bounded retry is MONITOR_ERROR, not expiry or support drift", async () => {
  const manifest = oneSourceManifest("HGY_4GF2DeDJoIzNRU4jn9scAv65V-usage-program-simulation");
  const observed = await observeRawMonitorSources(manifest, {
    maxAttempts: 2,
    sleep: async () => {},
    fetchImpl: async () => { throw new DOMException("timed out", "AbortError"); },
  });
  const result = buildRawMonitorRun({ manifest, authority: r2, sourceObservations: observed.observations, checkedAt: "2026-09-03T00:00:00.000Z", requestStats: observed.stats });
  assert.equal(observed.observations[0].attempts, 2);
  assert.ok(result.records[0].classifications.includes("MONITOR_ERROR"));
  assert.equal(result.records[0].classifications.includes("SUPPORT_DRIFT"), false);
  assert.equal(result.records[0].timeState, "FRESH");
});

test("source unavailable remains distinct from monitor error and does not assert falsity", () => {
  const manifest = oneSourceManifest("HGY_4GF2DeDJoIzNRU4jn9scAv65V-usage-program-simulation");
  const source = manifest.sources[0];
  const observation: EnrichmentSourceObservation = {
    sourceKey: source.sourceKey,
    status: "NOT_FOUND",
    requestedUrl: source.url,
    finalUrl: source.url,
    canonicalUrl: null,
    httpStatus: 404,
    attempts: 1,
    error: null,
    materialRedirect: false,
  };
  const run = buildRawMonitorRun({ manifest, authority: r2, sourceObservations: [observation], checkedAt: "2026-09-03T00:00:00.000Z" });
  assert.ok(run.records.every((item) => item.classifications.includes("SOURCE_UNAVAILABLE")));
  assert.ok(run.records.every((item) => !item.classifications.includes("MONITOR_ERROR")));
  assert.ok(run.records.every((item) => item.timeState === "FRESH"));
  assert.equal(JSON.stringify(run).includes("fact false"), false);
});

test("J-K: missing policy and unknown fact types fail closed as AUTHORITY_MISSING", () => {
  for (const mutate of [
    (entry: RawMonitorEntry) => { entry.policyKey = "missing-policy"; },
    (entry: RawMonitorEntry) => { entry.typeKeys = ["unknown-raw-type"]; },
  ]) {
    const manifest = changed((value) => mutate(value.entries.find((entry) => entry.kind === "raw_fact")!));
    const target = manifest.entries.find((entry) => entry.kind === "raw_fact")!;
    const result = record(healthyRun(manifest), target.observationKey);
    assert.ok(result.classifications.includes("AUTHORITY_MISSING"));
    assert.equal(result.currentForDependencyEvaluation, false);
  }
});

test("L: visual/manual support checks remain unavailable without automated positive inference", () => {
  const manifest = changed((value) => {
    value.entries[0].supportCheck = { mode: "CHECK_UNAVAILABLE", reason: "Visual evidence requires reviewed interpretation" };
  });
  const result = record(healthyRun(manifest), manifest.entries[0].observationKey);
  assert.equal(result.supportStatus, "CHECK_UNAVAILABLE");
  assert.ok(result.classifications.includes("CHECK_UNAVAILABLE"));
  assert.equal(result.reconfirmed, false);
});

test("O: multiple entries sharing one source produce exactly one request", async () => {
  const manifest = oneSourceManifest("HGY_6lR3pcwsQaSGSlsQTdrNrO1jc-equipment-sled-rope");
  assert.ok(manifest.entries.length > 1);
  let calls = 0;
  const result = await observeRawMonitorSources(manifest, {
    maxAttempts: 1,
    fetchImpl: async (input) => {
      calls += 1;
      const response = new Response("fitone shibuya 渋谷 sled rope open gym unlimited push pull carry run", { status: 200 });
      Object.defineProperty(response, "url", { value: String(input) });
      return response;
    },
  });
  assert.equal(calls, 1);
  assert.equal(result.stats.requestsAfterDedup, 1);
  assert.equal(result.stats.entries, manifest.entries.length);
});

test("future-effective evidence stays held and live activation requires release coherence", () => {
  const future = changed((value) => { value.entries[0].sourceExplicitStartsAt = "2026-10-01T00:00:00.000Z"; });
  const result = record(healthyRun(future), future.entries[0].observationKey);
  assert.equal(result.timeState, "FUTURE_EFFECTIVE_HOLD");
  assert.equal(result.currentForDependencyEvaluation, false);

  const unsafeLive = changed((value) => { value.mode = "LIVE_MONITORED"; });
  assert.throws(() => validateRawMonitorManifest(unsafeLive, r2), /release coherence authority/);
  unsafeLive.authority.dbImportPacketHash = "db-packet-hash";
  unsafeLive.authority.releaseCoherenceHash = rawMonitorReleaseCoherenceHash(
    unsafeLive.authority.dbImportPacketHash,
    unsafeLive.authority.monitorPacketHash,
  );
  unsafeLive.manifestHash = rawMonitorManifestHash(unsafeLive);
  assert.doesNotThrow(() => validateRawMonitorManifest(unsafeLive, r2));
});

test("R3 adds no privileged secret, database write, public endpoint, or automatic reconfirmation", () => {
  const workflow = fs.readFileSync(".github/workflows/hyrox-freshness-monitor.yml", "utf8");
  const script = fs.readFileSync("scripts/hyrox/monitor-raw-fact-freshness.ts", "utf8");
  const monitor = fs.readFileSync("src/lib/hyrox-raw-fact-monitor.ts", "utf8");
  assert.doesNotMatch(`${workflow}\n${script}\n${monitor}`, /SUPABASE_SERVICE_ROLE_KEY|service_role|createClient|\.from\(["']/i);
  assert.match(workflow, /npm run hyrox:monitor:raw/);
  assert.match(workflow, /NEXT_PUBLIC_SUPABASE_ANON_KEY/);
  assert.doesNotMatch(script, /NEXT_PUBLIC_SUPABASE|loadEnvConfig|createClient/);
  assert.match(monitor, /reconfirmed: false/);
  for (const directory of ["src/app", "src/components"]) {
    const stack = [directory];
    while (stack.length > 0) {
      const current = stack.pop()!;
      for (const item of fs.readdirSync(current, { withFileTypes: true })) {
        const target = `${current}/${item.name}`;
        if (item.isDirectory()) stack.push(target);
        else if (/\.(?:ts|tsx|js|jsx)$/.test(item.name)) {
          assert.equal(fs.readFileSync(target, "utf8").includes("hyrox-raw-fact-monitor"), false, target);
        }
      }
    }
  }
});

test("canonical monitor inventory contains both released Cohort deltas and remains separate from raw observations", () => {
  const enrichment = JSON.parse(fs.readFileSync("data/hyrox/h3-5a-enrichment-monitor-authority.json", "utf8"));
  assert.equal(enrichment.counts.claims, 226);
  assert.equal(enrichment.counts.equipment, 164);
  assert.equal(enrichment.counts.capabilities, 62);
  assert.equal(candidate.entries.some((entry) => "claimKey" in entry), false);
});
