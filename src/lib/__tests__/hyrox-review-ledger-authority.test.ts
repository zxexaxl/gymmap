import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import test from "node:test";

const authorityPath = "data/hyrox/h3-11a-station-evidence-authority.json";
const documentPath = "docs/hyrox-h3-11a-review-evidence-authority.md";
const migrationPath = "supabase/migrations/0013_add_training_review_ledger.sql";

const authoritySource = fs.readFileSync(authorityPath, "utf8");
const authority = JSON.parse(authoritySource) as {
  reviewContract: {
    aspects: string[];
    progress: string[];
    sourceSufficiency: string[];
    positiveOutcome: string[];
  };
  sourceClasses: Array<{ id: string }>;
  stations: Array<{ id: string; name: string }>;
  auxiliaryDimensions: Array<{ id: string; name: string; notAStation: boolean }>;
  legacyEquipmentMappings: unknown[];
  legacyCapabilityMappings: unknown[];
};
const documentSource = fs.readFileSync(documentPath, "utf8");
const migration = fs.readFileSync(migrationPath, "utf8");
const databaseTypes = fs.readFileSync("src/lib/database.types.ts", "utf8");

const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

test("ledger protocol pins the accepted H3-11A authority bytes", () => {
  assert.match(migration, /'0615892b7e228c7628e2e1859c8963bdaa669538'/);
  assert.match(migration, new RegExp(sha256(documentSource)));
  assert.match(migration, new RegExp(sha256(authoritySource)));
  assert.match(migration, /'hyrox-review-coverage',\s*'h3-11a-v1'/);
});

test("ledger seeds exactly the eight authority stations plus two non-station dimensions", () => {
  const stationIds = authority.stations.map(({ id }) => id);
  assert.equal(new Set(stationIds).size, 8);
  assert.deepEqual(stationIds, [
    "ski-erg",
    "sled-push",
    "sled-pull",
    "burpee-broad-jump",
    "row",
    "farmers-carry",
    "sandbag-lunges",
    "wall-balls",
  ]);

  for (const id of stationIds) {
    assert.match(migration, new RegExp(`\\('${id}', [^\\n]+, 'WORKOUT_STATION',`));
  }
  assert.match(migration, /\('running-environment', 'Running environment', 'AUXILIARY'/);
  assert.match(migration, /\('facility-identity', 'Facility identity', 'FACILITY_IDENTITY'/);
  assert.deepEqual(
    authority.auxiliaryDimensions.map(({ id, notAStation }) => ({ id, notAStation })),
    [{ id: "running-environment", notAStation: true }],
  );
});

test("database checks consume the frozen review axes and source taxonomy", () => {
  for (const value of [
    ...authority.reviewContract.aspects,
    ...authority.reviewContract.progress,
    ...authority.reviewContract.sourceSufficiency,
    ...authority.reviewContract.positiveOutcome,
    ...authority.sourceClasses.map(({ id }) => id),
  ]) {
    assert.match(migration, new RegExp(`'${value}'`), `${value} must be constrained by SQL`);
  }
  assert.match(migration, /review_progress <> 'COMPLETE' or source_sufficiency = 'SUFFICIENT'/);
  assert.match(migration, /positive_outcome <> 'NO_POSITIVE_FOUND'[\s\S]+review_progress = 'COMPLETE'[\s\S]+source_sufficiency = 'SUFFICIENT'/);
});

test("human and machine authority agree on every persistence taxonomy value", () => {
  for (const value of [
    ...authority.reviewContract.aspects,
    ...authority.reviewContract.progress,
    ...authority.reviewContract.sourceSufficiency,
    ...authority.reviewContract.positiveOutcome,
    ...authority.stations.map(({ name }) => name),
  ]) {
    assert.ok(documentSource.includes(value), `${value} must also appear in Markdown authority`);
  }
  assert.match(documentSource, /facility identity/i);
});

test("ledger remains internal, append-only, and separate from claim/derivation storage", () => {
  assert.doesNotMatch(migration, /\bis_current\b/i);
  assert.doesNotMatch(migration, /insert into public\.(location_equipment|location_training_capabilities|training_evidence)/i);
  assert.doesNotMatch(migration, /create (?:or replace )?(?:view|function)/i);
  assert.doesNotMatch(migration, /grant (?:select|insert|update|delete|all)[^;]+to (?:anon|authenticated)/i);
  assert.doesNotMatch(migration, /grant update|grant delete/i);
  assert.equal(authority.legacyEquipmentMappings.length, 9);
  assert.equal(authority.legacyCapabilityMappings.length, 5);
});

test("committed schema-derived types expose only the six new persistence objects", () => {
  for (const table of [
    "training_review_protocols",
    "training_review_dimensions",
    "training_review_cycles",
    "training_review_units",
    "training_review_unit_sources",
    "training_review_invalidations",
  ]) {
    assert.match(databaseTypes, new RegExp(`^      ${table}: \\{$`, "m"));
  }
  assert.doesNotMatch(databaseTypes, /derived_station|station_capability|is_current/);
});
