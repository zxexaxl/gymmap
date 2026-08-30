import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import type { H34Candidate } from "../hyrox-h3-4-import-candidate";
import { H3_4_CANDIDATE_HASH, renderH35ProductionImport } from "../hyrox-h3-5-production-sql";

async function candidate() {
  return JSON.parse(await readFile("data/hyrox/h3-4-equipment-evidence-import-candidate.json", "utf8")) as H34Candidate;
}

test("H3-5 SQL freezes the exact candidate and one atomic transaction", async () => {
  const value = await candidate();
  const sql = renderH35ProductionImport(value);
  assert.equal(value.candidate_hash, H3_4_CANDIDATE_HASH);
  assert.equal((sql.match(/\bbegin;/gi) ?? []).length, 1);
  assert.equal((sql.match(/\bcommit;/gi) ?? []).length, 1);
  assert.match(sql, /pg_advisory_xact_lock/);
  assert.match(sql, /row\(10::bigint,36::bigint,16::bigint,52::bigint,9::bigint\)/);
  assert.doesNotMatch(sql, /on conflict|do update|\bupdate\s+(public\.)?(gym_locations|gym_brands|training_)/i);
});

test("H3-5 SQL is first-import fail-closed and freshness-exact", async () => {
  const sql = renderH35ProductionImport(await candidate());
  for (const gate of ["first-import production baseline drift","source collision","equipment collision","capability collision","evidence collision","unrelated production data changed","search projection mismatch"]) {
    assert.match(sql, new RegExp(gate));
  }
  assert.match(sql, /2026-08-30T09:20:04Z/);
  assert.match(sql, /interval '180 days'/);
  assert.match(sql, /competition-simulation' then 30 else 90/);
  assert.doesNotMatch(sql, /now\(\)|current_timestamp/);
});

test("H3-5 SQL inserts only the four authorized graph tables", async () => {
  const sql = renderH35ProductionImport(await candidate());
  const targets = [...sql.matchAll(/insert into\s+([a-z0-9_]+)/gi)].map((match) => match[1]).filter((name) => !name.startsWith("h35_"));
  assert.deepEqual([...new Set(targets)].sort(), ["location_equipment","location_training_capabilities","training_evidence","training_sources"]);
  assert.doesNotMatch(sql, /insert into\s+(gym_locations|gym_brands|program_training_disciplines|class_schedules)/i);
});

test("tampered logical candidate is rejected", async () => {
  const value = await candidate();
  value.equipment[0].stale_at = "2027-02-25T09:20:04Z";
  assert.throws(() => renderH35ProductionImport(value), /logical candidate hash mismatch/);
});
