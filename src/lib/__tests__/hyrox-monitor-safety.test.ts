import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

test("monitor implementation has no Supabase mutation path or service-role dependency", () => {
  const root = process.cwd();
  const source = [
    "src/lib/hyrox-monitor-source.ts",
    "scripts/hyrox/monitor-freshness.ts",
    ".github/workflows/hyrox-freshness-monitor.yml",
  ].map((file) => fs.readFileSync(path.join(root, file), "utf8")).join("\n");
  for (const forbidden of [/\.insert\s*\(/, /\.update\s*\(/, /\.delete\s*\(/, /service_role/i, /SUPABASE_SERVICE_ROLE_KEY/]) {
    assert.equal(forbidden.test(source), false, `forbidden mutation/secret pattern: ${forbidden}`);
  }
});
