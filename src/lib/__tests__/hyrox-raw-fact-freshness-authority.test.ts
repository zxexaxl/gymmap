import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const authority = JSON.parse(
  fs.readFileSync(
    "data/hyrox/h3-11d-r2-raw-fact-freshness-authority.json",
    "utf8",
  ),
);
const r1Mapping = JSON.parse(
  fs.readFileSync("data/hyrox/h3-11d-r1-gap-persistence-map.json", "utf8"),
);
const evidence = JSON.parse(
  fs.readFileSync("data/hyrox/h3-11d-cohort1-raw-evidence.json", "utf8"),
);
const migration = fs.readFileSync(
  "supabase/migrations/0015_add_training_raw_fact_persistence.sql",
  "utf8",
);
const monitorSource = fs.readFileSync(
  "scripts/hyrox/monitor-enrichment-freshness.ts",
  "utf8",
);
const humanAuthority = fs.readFileSync(
  "docs/hyrox-h3-11d-r2-raw-fact-freshness-authority.md",
  "utf8",
);

function canonicalize(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(canonicalize).join(",")}]`;
  }
  if (value !== null && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, child]) => `${JSON.stringify(key)}:${canonicalize(child)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function hash(value: unknown): string {
  return crypto.createHash("sha256").update(canonicalize(value)).digest("hex");
}

function addDays(iso: string, days: number): string {
  return new Date(new Date(iso).getTime() + days * 86_400_000).toISOString();
}

function sourceFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(file);
    return /\.(?:ts|tsx|js|jsx)$/.test(entry.name) ? [file] : [];
  });
}

test("R2 deterministic hashes cover the frozen authority sections", () => {
  assert.equal(
    authority.deterministic_hashes.freshness_policy_authority_sha256,
    hash({
      currentness_contract: authority.currentness_contract,
      policies: authority.policies,
      monitoring_contract: authority.monitoring_contract,
      persistence_sufficiency: authority.persistence_sufficiency,
    }),
  );
  assert.equal(
    authority.deterministic_hashes.fact_policy_mapping_sha256,
    hash(authority.fact_type_mappings),
  );
  assert.equal(
    authority.deterministic_hashes.restriction_policy_mapping_sha256,
    hash(authority.restriction_type_mappings),
  );
  assert.equal(
    authority.deterministic_hashes.cohort1_freshness_mapping_sha256,
    hash({
      raw: authority.cohort1_raw_observation_mappings,
      restrictions: authority.cohort1_restriction_observation_mappings,
      existing_canonical_coherence: authority.existing_canonical_coherence,
    }),
  );
});

test("all 13 raw fact and four restriction types have exactly one accepted policy", () => {
  const factTypes = authority.fact_type_mappings.map(
    (row: { fact_type: string }) => row.fact_type,
  );
  const restrictionTypes = authority.restriction_type_mappings.map(
    (row: { restriction_type: string }) => row.restriction_type,
  );
  const policyKeys = new Set(
    authority.policies.map((policy: { policy_key: string }) => policy.policy_key),
  );

  assert.equal(factTypes.length, 13);
  assert.equal(new Set(factTypes).size, 13);
  assert.equal(restrictionTypes.length, 4);
  assert.equal(new Set(restrictionTypes).size, 4);
  assert.equal(new Set(authority.policies.map((row: { policy_key: string }) => row.policy_key)).size, 5);

  for (const row of [...authority.fact_type_mappings, ...authority.restriction_type_mappings]) {
    assert.equal(policyKeys.has(row.policy_key), true);
    assert.match(row.reuse_classification, /^(REUSE_PHYSICAL_180|REUSE_OPERATIONAL_90|NEW_POLICY_REQUIRED)$/);
    assert.ok(row.rationale.length > 0);
  }
  for (const policy of authority.policies) {
    assert.equal(policy.due_soon_days, 30);
    assert.equal(policy.urgent_days, 14);
    assert.equal(policy.monitor_requirement, "H3-11D-R3_REQUIRED_BEFORE_IMPORT");
    assert.ok(policy.derivation_eligibility.length > 0);
  }
  for (const type of factTypes) assert.match(migration, new RegExp(`\\('${type}'`));
  for (const type of restrictionTypes) assert.match(migration, new RegExp(type));
});

test("Cohort 1 maps every accepted R1 gap exactly once with matching typed semantics", () => {
  const rawById = new Map(
    authority.cohort1_raw_observation_mappings.map(
      (row: { fact_id: string }) => [row.fact_id, row],
    ),
  );
  const restrictionsById = new Map(
    authority.cohort1_restriction_observation_mappings.map(
      (row: { fact_id: string }) => [row.fact_id, row],
    ),
  );

  assert.equal(rawById.size, 19);
  assert.equal(restrictionsById.size, 4);
  for (const row of r1Mapping.raw_fact_gaps) {
    const mapped = rawById.get(row.fact_id) as { fact_types: string[] } | undefined;
    assert.ok(mapped, row.fact_id);
    assert.deepEqual(mapped.fact_types, row.fact_type_slugs);
  }
  for (const row of r1Mapping.restriction_gaps) {
    const mapped = restrictionsById.get(row.fact_id) as
      | { restriction_types: string[] }
      | undefined;
    assert.ok(mapped, row.fact_id);
    assert.deepEqual(mapped.restriction_types, row.restriction_types);
  }
});

test("Cohort 1 expiry clocks are deterministic and remain held for R3", () => {
  const policyByKey = new Map(
    authority.policies.map((policy: { policy_key: string; horizon_days: number }) => [
      policy.policy_key,
      policy,
    ]),
  );
  for (const row of [
    ...authority.cohort1_raw_observation_mappings,
    ...authority.cohort1_restriction_observation_mappings,
  ]) {
    const policy = policyByKey.get(row.policy_key) as { horizon_days: number };
    assert.equal(row.freshness_expires_at, addDays(row.reviewed_at, policy.horizon_days));
    assert.equal(row.currentness_eligibility, "CURRENT_IMPORT_ELIGIBLE");
    assert.equal(row.operational_gate, "HOLD_MONITOR_INTEGRATION");
  }
});

test("all existing canonical Cohort 1 observations retain an existing policy", () => {
  const canonical = evidence.facts.filter(
    (fact: { persistence: { fit: string } }) =>
      fact.persistence.fit === "EXISTING_CANONICAL_PERSISTENCE",
  );
  const counts = canonical.reduce((result: Record<string, number>, fact: { freshness_policy_key: string }) => {
    result[fact.freshness_policy_key] = (result[fact.freshness_policy_key] ?? 0) + 1;
    return result;
  }, {});
  assert.equal(canonical.length, 38);
  assert.equal(canonical.every((fact: { freshness_policy_key: string | null }) => fact.freshness_policy_key !== null), true);
  assert.deepEqual(counts, authority.existing_canonical_coherence.policy_counts);
  assert.equal(authority.existing_canonical_coherence.missing_policy, 0);
});

test("currentness is fail-closed and never changes fact meaning", () => {
  assert.equal(authority.currentness_contract.clock_anchor, "reviewed_at");
  assert.equal(authority.currentness_contract.null_policy_state, "AUTHORITY_MISSING_HISTORICAL_ONLY");
  assert.equal(authority.currentness_contract.expired_state, "TIME_EXPIRED_HISTORICAL_ONLY");
  assert.equal(authority.currentness_contract.stale_is_negative, false);
  assert.equal(authority.currentness_contract.restriction_expiry_means_unrestricted, false);
  assert.equal(authority.currentness_contract.http_fetch_reconfirms, false);
  assert.equal(authority.authority.station_derivation, false);
  assert.match(humanAuthority, /general-training-floor.*weak raw fact/i);
  assert.match(humanAuthority, /restriction.*never.*unrestricted/i);
});

test("R3 is required because the existing monitor has no raw-fact inventory path", () => {
  assert.equal(authority.monitoring_contract.existing_monitor_reads_raw_facts, false);
  assert.equal(authority.monitoring_contract.existing_monitor_reads_restrictions, false);
  assert.equal(
    authority.monitoring_contract.implementation_decision,
    "REQUIRED_BEFORE_COHORT1_IMPORT",
  );
  assert.doesNotMatch(monitorSource, /training_raw_facts|training_access_restrictions/);
  assert.match(humanAuthority, /RAW_FACT_MONITOR_IMPLEMENTATION: REQUIRED_BEFORE_COHORT1_IMPORT/);
});

test("A-L self-checks are complete and preserve historical/non-negative semantics", () => {
  assert.deepEqual(
    authority.edge_cases.map((row: { case: string }) => row.case),
    "ABCDEFGHIJKL".split(""),
  );
  const outcomes = authority.edge_cases.map((row: { outcome: string }) => row.outcome).join(" ");
  assert.match(outcomes, /TIME_EXPIRED_HISTORICAL_ONLY/);
  assert.match(outcomes, /AUTHORITY_MISSING_HISTORICAL_ONLY/);
  assert.match(outcomes, /NO_CURRENT_RESTRICTION_AUTHORITY/);
  assert.doesNotMatch(outcomes, /CONFIRMED_UNAVAILABLE|UNRESTRICTED$/);
});

test("0015 is sufficient and R2 creates no schema, runtime, or publication path", () => {
  assert.equal(authority.persistence_sufficiency.status, "YES");
  assert.equal(authority.persistence_sufficiency.no_migration_required, true);
  assert.match(migration, /reviewed_at timestamptz not null/);
  assert.match(migration, /freshness_policy_key text/);
  assert.match(migration, /freshness_expires_at timestamptz/);
  assert.match(migration, /training_review_units/);
  assert.equal(authority.authority.production_writes, false);
  assert.equal(authority.authority.public_publication, false);

  const runtimeReferences = sourceFiles("src")
    .filter((file) => !file.includes(`${path.sep}__tests__${path.sep}`))
    .filter((file) => fs.readFileSync(file, "utf8").includes("h3-11d-r2-raw-fact-freshness-authority"));
  assert.deepEqual(runtimeReferences, []);
});
