import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import test from "node:test";

const originalMigrationPath = "supabase/migrations/0013_add_training_review_ledger.sql";
const correctionMigrationPath =
  "supabase/migrations/0014_restrict_training_review_ledger_service_role_privileges.sql";

const originalMigration = fs.readFileSync(originalMigrationPath, "utf8");
const correctionMigration = fs.readFileSync(correctionMigrationPath, "utf8");
const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

test("already-applied migration 0013 remains byte-identical", () => {
  assert.equal(
    sha256(originalMigration),
    "aa3a34f090dc8f3406ea7e10ab0658dbb770dfc279120a8802a3876f4410aa0d",
  );
});

test("0014 is an object-specific ACL correction with no schema or data mutation", () => {
  assert.match(correctionMigration, /revoke all privileges on table[\s\S]+from service_role;/i);
  assert.match(
    correctionMigration,
    /grant select on table[\s\S]+training_review_protocols[\s\S]+training_review_dimensions[\s\S]+to service_role;/i,
  );
  assert.match(
    correctionMigration,
    /grant select, insert on table[\s\S]+training_review_cycles[\s\S]+training_review_units[\s\S]+training_review_unit_sources[\s\S]+training_review_invalidations[\s\S]+to service_role;/i,
  );
  assert.doesNotMatch(correctionMigration, /alter default privileges/i);
  assert.doesNotMatch(
    correctionMigration,
    /\b(create|alter|drop|truncate|insert|update|delete)\s+(?:table|into|from|public\.)/i,
  );
  assert.doesNotMatch(correctionMigration, /\b(?:anon|authenticated)\b/i);
});
