import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { validateAuthorityEquivalences, type MonitorAuthorityEquivalence } from "../hyrox-monitor";

const review = JSON.parse(fs.readFileSync("data/hyrox/h3-2a-initial-monitor-review.json", "utf8")) as {
  scope: { unique_records: number; name_signals: number; source_url_signals: number; overlap: number };
  records: Array<{ hgy_id: string; name_review: string | null; url_review: string | null; material_drift: boolean }>;
};
const equivalenceArtifact = JSON.parse(
  fs.readFileSync("data/hyrox/h3-2a-monitor-authority-equivalences.json", "utf8"),
) as { equivalences: MonitorAuthorityEquivalence[] };

test("initial review artifact covers exactly 13 unique records and the 9/5/1 signal contract", () => {
  assert.equal(review.records.length, 13);
  assert.equal(new Set(review.records.map((item) => item.hgy_id)).size, 13);
  assert.deepEqual(review.scope, { unique_records: 13, name_signals: 9, source_url_signals: 5, overlap: 1 });
  assert.equal(review.records.filter((item) => item.name_review === "EXPECTED_EQUIVALENT_NAME").length, 9);
  assert.equal(review.records.filter((item) => item.url_review === "EXPECTED_EQUIVALENT_URL").length, 5);
  assert.equal(review.records.some((item) => item.material_drift), false);
});

test("equivalence artifact contains only exact reviewed exceptions in deterministic order", () => {
  const validated = validateAuthorityEquivalences(equivalenceArtifact.equivalences);
  assert.equal(validated.length, 14);
  assert.deepEqual(validated, equivalenceArtifact.equivalences);
  assert.equal(validated.filter((item) => item.dimension === "name").length, 9);
  assert.equal(validated.filter((item) => item.dimension !== "name").length, 5);
  assert.equal(validated.every((item) => item.hgyId.startsWith("HGY_") && item.authorityUrls.length >= 2), true);
});

test("Tokorozawa retired URL is not reintroduced as an equivalence", () => {
  const serialized = JSON.stringify(equivalenceArtifact);
  assert.equal(serialized.includes("https://www.gym-field.com/studio/所沢/"), false);
});
