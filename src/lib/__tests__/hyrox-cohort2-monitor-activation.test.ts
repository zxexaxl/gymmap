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
const release = read("data/hyrox/h3-11d-cohort2-beequick-production-release.json");
const r2 = read("data/hyrox/h3-11d-r2-raw-fact-freshness-authority.json");

test("Cohort 2 canonical monitor activation is exact and complete", () => {
  validateEnrichmentManifest(canonical);
  assert.equal(canonical.manifestHash, "614048ba7d0890c8fbadfc0318ea37fa3e6da06e72dc15710800e7544f00ad2f");
  assert.equal(enrichmentManifestHash(canonical), canonical.manifestHash);
  assert.deepEqual(canonical.counts, { sources: 42, uniqueExternalUrls: 31, equipment: 164, capabilities: 62, claims: 226, enrichedLocations: 39 });
  const keys = new Set(canonical.claims.map((row: { claimKey: string }) => row.claimKey));
  assert.ok(release.canonicalMonitorDelta.claims.every((row: { claimKey: string }) => keys.has(row.claimKey)));
});

test("Cohort 2 raw monitor activation is exact, coherent, and excludes the deferred visual gap", () => {
  validateRawMonitorManifest(raw, r2);
  assert.equal(raw.manifestHash, "02b076a08a666ac66b7623bb817417ce9a5051fae46b01fff92bc9ec26588903");
  assert.equal(rawMonitorManifestHash(raw), raw.manifestHash);
  assert.equal(rawMonitorPacketHash(raw), "d5e694d959172752ae1c2f9a1ae3be474072d6c75be08ddbd2948f46124d0df2");
  assert.equal(raw.authority.dbImportPacketHash, release.hashes.DB_IMPORT_PACKET_SHA256);
  assert.equal(raw.authority.releaseCoherenceHash, rawMonitorReleaseCoherenceHash(raw.authority.dbImportPacketHash, raw.authority.monitorPacketHash));
  assert.deepEqual(raw.counts, { sources: 15, entries: 45, rawFacts: 33, restrictions: 12 });
  const keys = new Set(raw.entries.map((row: { observationKey: string }) => row.observationKey));
  assert.ok(release.rawMonitorDelta.entries.every((row: { observationKey: string }) => keys.has(row.observationKey)));
  assert.equal(raw.entries.some((row: { observationKey: string }) => row.observationKey.includes("visual-sled-rope-lane")), false);
});
