import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { enrichmentManifestHash, validateEnrichmentManifest } from "../hyrox-enrichment-monitor";
import {
  rawMonitorManifestHash,
  rawMonitorPacketHash,
  rawMonitorReleaseCoherenceHash,
  validateRawMonitorManifest,
} from "../hyrox-raw-fact-monitor";

const read = (path: string) => JSON.parse(fs.readFileSync(path, "utf8"));
const canonical = read("data/hyrox/h3-5a-enrichment-monitor-authority.json");
const raw = read("data/hyrox/h3-11d-r3-raw-monitor-live-authority.json");
const release = read("data/hyrox/h3-11d-cohort3-golds-production-release.json");
const r2 = read("data/hyrox/h3-11d-r2-raw-fact-freshness-authority.json");

test("Cohort 3 canonical monitor activation is exact and complete", () => {
  validateEnrichmentManifest(canonical);
  assert.equal(canonical.manifestHash, "48aafdfb2ecb07be07266078ed4765cc1bfa04de1709c21b3e102d59f54a5808");
  assert.equal(enrichmentManifestHash(canonical), canonical.manifestHash);
  assert.deepEqual(canonical.counts, { sources: 45, uniqueExternalUrls: 34, equipment: 170, capabilities: 65, claims: 235, enrichedLocations: 41 });
  const keys = new Set(canonical.claims.map((row: { claimKey: string }) => row.claimKey));
  assert.ok(release.canonicalMonitorDelta.claims.every((row: { claimKey: string }) => keys.has(row.claimKey)));
});

test("Cohort 3 raw monitor activation is exact, coherent, and excludes the deferred visual gap", () => {
  validateRawMonitorManifest(raw, r2);
  assert.equal(raw.manifestHash, "6dcef897338c20a756ed8d0694ab6cedfb19eab4f55b886c4726f03f9f9471e9");
  assert.equal(rawMonitorManifestHash(raw), raw.manifestHash);
  assert.equal(rawMonitorPacketHash(raw), "73734b5fb1ce362b0422a102345aac803c04dd2e2aba73309736225d5c999e0c");
  assert.equal(raw.authority.dbImportPacketHash, release.hashes.DB_IMPORT_PACKET_SHA256);
  assert.equal(raw.authority.releaseCoherenceHash, rawMonitorReleaseCoherenceHash(raw.authority.dbImportPacketHash, raw.authority.monitorPacketHash));
  assert.deepEqual(raw.counts, { sources: 18, entries: 50, rawFacts: 38, restrictions: 12 });
  const keys = new Set(raw.entries.map((row: { observationKey: string }) => row.observationKey));
  assert.ok(release.rawMonitorDelta.entries.every((row: { observationKey: string }) => keys.has(row.observationKey)));
  assert.equal(raw.entries.some((row: { observationKey: string }) => row.observationKey.includes("visual-hyrox-machine-poster")), false);
});
