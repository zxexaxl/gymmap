import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const evidence = JSON.parse(
  fs.readFileSync("data/hyrox/h3-11d-cohort1-raw-evidence.json", "utf8"),
);
const mapping = JSON.parse(
  fs.readFileSync("data/hyrox/h3-11d-r1-gap-persistence-map.json", "utf8"),
);
const migration = fs.readFileSync(
  "supabase/migrations/0015_add_training_raw_fact_persistence.sql",
  "utf8",
);
const databaseTypes = fs.readFileSync("src/lib/database.types.ts", "utf8");

const rawGapIds = evidence.facts
  .filter((fact: { persistence: { fit: string } }) =>
    fact.persistence.fit === "RAW_FACT_PERSISTENCE_GAP")
  .map((fact: { fact_id: string }) => fact.fact_id)
  .sort();
const restrictionGapIds = evidence.facts
  .filter((fact: { persistence: { fit: string } }) =>
    fact.persistence.fit === "RESTRICTION_PERSISTENCE_GAP")
  .map((fact: { fact_id: string }) => fact.fact_id)
  .sort();

test("H3-11D-R1 accounts for every accepted gap exactly once", () => {
  assert.equal(rawGapIds.length, 19);
  assert.equal(restrictionGapIds.length, 4);
  assert.deepEqual(
    mapping.raw_fact_gaps.map((row: { fact_id: string }) => row.fact_id).sort(),
    rawGapIds,
  );
  assert.deepEqual(
    mapping.restriction_gaps.map((row: { fact_id: string }) => row.fact_id).sort(),
    restrictionGapIds,
  );
  assert.equal(new Set(mapping.raw_fact_gaps.map((row: { fact_id: string }) => row.fact_id)).size, 19);
  assert.equal(new Set(mapping.restriction_gaps.map((row: { fact_id: string }) => row.fact_id)).size, 4);
  assert.deepEqual(mapping.unresolved_blockers, []);
});

test("new taxonomy is constrained to raw components, spaces, usage, and source assertions", () => {
  const mappedTypes = new Set<string>(
    mapping.raw_fact_gaps.flatMap((row: { fact_type_slugs: string[] }) => row.fact_type_slugs),
  );
  for (const slug of mappedTypes) {
    assert.match(migration, new RegExp(`\\('${slug.replaceAll("-", "\\-")}'`));
  }
  assert.match(migration, /PHYSICAL_COMPONENT/);
  assert.match(migration, /SPACE_ENVIRONMENT/);
  assert.match(migration, /USAGE_ACCESS/);
  assert.match(migration, /SOURCE_ASSERTION/);
  assert.doesNotMatch(migration, /SLED_PUSH_SUPPORTED|SLED_PULL_SUPPORTED|station_capability|station_score|completeness_score/i);
});

test("positive raw facts and explicit restrictions remain structurally separate", () => {
  assert.match(migration, /create table public\.training_raw_facts/);
  assert.match(migration, /create table public\.training_access_restrictions/);
  assert.match(migration, /restriction_type in \([\s\S]*MEMBERSHIP_ELIGIBILITY[\s\S]*RESERVATION_REQUIRED[\s\S]*PROGRAM_HOUR_EXCLUSION[\s\S]*PLAN_DEPENDENT_ACCESS/);
  assert.doesNotMatch(migration, /fact_present|availability_state|NO_POSITIVE_FOUND/);
  assert.equal(mapping.authority.public_publication, false);
  assert.equal(mapping.authority.station_derivation, false);
});

test("all new semantics remain freshness-fail-closed pending H3-11D-R2", () => {
  for (const row of [...mapping.raw_fact_gaps, ...mapping.restriction_gaps]) {
    assert.equal(row.freshness_policy_key, null);
  }
  assert.equal(mapping.freshness_authority.new_horizons_introduced, false);
  assert.equal(mapping.freshness_authority.all_new_semantics_fail_closed_without_policy, true);
  assert.equal(
    mapping.freshness_authority.next_gate,
    "H3-11D-R2_RAW_FACT_FRESHNESS_POLICY_REQUIRED",
  );
  assert.match(migration, /freshness_expires_at is null[\s\S]*freshness_policy_key is not null/);
});

test("existing canonical observations are neither duplicated nor retyped", () => {
  const mappedIds = new Set([
    ...mapping.raw_fact_gaps.map((row: { fact_id: string }) => row.fact_id),
    ...mapping.restriction_gaps.map((row: { fact_id: string }) => row.fact_id),
  ]);
  const canonical = evidence.facts.filter(
    (fact: { persistence: { fit: string } }) =>
      fact.persistence.fit === "EXISTING_CANONICAL_PERSISTENCE",
  );
  assert.equal(canonical.length, 38);
  for (const fact of canonical) assert.equal(mappedIds.has(fact.fact_id), false);
  assert.doesNotMatch(
    migration,
    /insert into public\.(location_equipment|location_training_capabilities|training_evidence)/i,
  );
});

test("review-ledger provenance and cross-scope integrity are mandatory", () => {
  assert.match(migration, /training_raw_facts_cycle_location_discipline_fk/);
  assert.match(migration, /training_raw_facts_unit_scope_fk/);
  assert.match(migration, /training_raw_facts_unit_source_fk/);
  assert.match(migration, /training_raw_fact_dimensions_unit_scope_fk/);
  assert.match(migration, /training_access_restrictions_unit_source_fk/);
  assert.match(migration, /on delete restrict/g);
});

test("0015 handles production default ACL explicitly and remains internal", () => {
  for (const table of [
    "training_raw_fact_types",
    "training_raw_facts",
    "training_raw_fact_dimensions",
    "training_access_restrictions",
  ]) {
    assert.match(migration, new RegExp(`alter table public\\.${table} enable row level security`));
    assert.match(migration, new RegExp(`revoke all privileges on table public\\.${table} from service_role`));
  }
  assert.doesNotMatch(migration, /alter default privileges/i);
  assert.doesNotMatch(migration, /create (?:or replace )?(?:view|function)/i);
});

test("committed database types contain only the four schema-derived R1 objects", () => {
  for (const table of [
    "training_raw_fact_types",
    "training_raw_facts",
    "training_raw_fact_dimensions",
    "training_access_restrictions",
  ]) {
    assert.match(databaseTypes, new RegExp(`^      ${table}: \\{$`, "m"));
  }
  for (const relationship of [
    "training_raw_facts_cycle_location_discipline_fk",
    "training_raw_facts_unit_scope_fk",
    "training_raw_facts_unit_source_fk",
    "training_raw_facts_type_aspect_fk",
    "training_raw_fact_dimensions_fact_scope_fk",
    "training_raw_fact_dimensions_unit_scope_fk",
    "training_raw_fact_dimensions_unit_source_fk",
    "training_access_restrictions_cycle_location_discipline_fk",
    "training_access_restrictions_unit_scope_fk",
    "training_access_restrictions_unit_source_fk",
  ]) {
    assert.match(databaseTypes, new RegExp(`foreignKeyName: "${relationship}"`));
  }
  assert.doesNotMatch(databaseTypes, /derived_station_rows|station_capability|fact_present/);
});

test("R1 artifacts have no runtime import", () => {
  const artifact = "data/hyrox/h3-11d-r1-gap-persistence-map.json";
  const walk = (directory: string): string[] =>
    fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) =>
      entry.isDirectory()
        ? walk(`${directory}/${entry.name}`)
        : [`${directory}/${entry.name}`]);
  for (const file of walk("src").filter((file) =>
    /\.(ts|tsx)$/.test(file) && !file.includes("/__tests__/"))) {
    assert.equal(fs.readFileSync(file, "utf8").includes(artifact), false);
  }
});
