/* eslint-disable @typescript-eslint/no-explicit-any -- accepted release JSON is hash-pinned before activation */
import fs from "node:fs/promises";
import {
  enrichmentManifestHash,
  validateEnrichmentManifest,
  type EnrichmentAuthorityManifest,
} from "../../src/lib/hyrox-enrichment-monitor";
import {
  rawMonitorManifestHash,
  rawMonitorPacketHash,
  rawMonitorReleaseCoherenceHash,
  validateR2FreshnessAuthority,
  validateRawMonitorManifest,
  type R2FreshnessAuthority,
  type RawMonitorManifest,
} from "../../src/lib/hyrox-raw-fact-monitor";

const paths = {
  canonical: "data/hyrox/h3-5a-enrichment-monitor-authority.json",
  raw: "data/hyrox/h3-11d-r3-raw-monitor-live-authority.json",
  release: "data/hyrox/h3-11d-cohort2-beequick-production-release.json",
  r2: "data/hyrox/h3-11d-r2-raw-fact-freshness-authority.json",
};

const EXPECTED = {
  release: "6134051349fcfe14ca7e9f53cdad529d052c027264d8029b2ddda6f0b14955f0",
  db: "8110a514eb2127f97be6c3c58e75da8638b99125b2a5c47e79bd1c55e7d8da1e",
  canonicalDelta: "8df109cb2d709b982c4ad3dee865768fed4a4722deac7faee4086d7bb23eff45",
  rawDelta: "3e3372279d9260c6e2b0254282b1c2b6d5492eff8b480ee24b6c73d616f95da3",
  canonicalBefore: "dfa64409699629929f648eadd023934be30d1ca8e9fbd2163e5e06a7e3dd9593",
  rawBefore: "791b6255c0819ee11e7fab8f022f0dbbfd2298949b22c50943501fc575f0d718",
  canonicalAfter: "614048ba7d0890c8fbadfc0318ea37fa3e6da06e72dc15710800e7544f00ad2f",
  rawPacketAfter: "d5e694d959172752ae1c2f9a1ae3be474072d6c75be08ddbd2948f46124d0df2",
  rawCoherenceAfter: "38df7a5a477b71c3c5c66dd8303853e5cd6a8af21ce8797111d1537d7de95e26",
  rawAfter: "02b076a08a666ac66b7623bb817417ce9a5051fae46b01fff92bc9ec26588903",
};

async function read<T>(path: string): Promise<T> {
  return JSON.parse(await fs.readFile(path, "utf8")) as T;
}

async function main() {
  const [canonical, raw, release, r2] = await Promise.all([
    read<EnrichmentAuthorityManifest>(paths.canonical),
    read<RawMonitorManifest>(paths.raw),
    read<any>(paths.release),
    read<R2FreshnessAuthority>(paths.r2),
  ]);
  if (
    release.hashes.COHORT2_RELEASE_COHERENCE_SHA256 !== EXPECTED.release
    || release.hashes.DB_IMPORT_PACKET_SHA256 !== EXPECTED.db
    || release.hashes.CANONICAL_MONITOR_DELTA_SHA256 !== EXPECTED.canonicalDelta
    || release.hashes.RAW_MONITOR_DELTA_SHA256 !== EXPECTED.rawDelta
  ) throw new Error("Accepted Cohort 2 release identity mismatch");

  const alreadyCanonical = canonical.counts.claims === 226;
  if (!alreadyCanonical && canonical.manifestHash !== EXPECTED.canonicalBefore) {
    throw new Error("Existing canonical live authority conflicts with Cohort 2 activation");
  }
  const projectedCanonical: EnrichmentAuthorityManifest = alreadyCanonical ? canonical : {
    ...canonical,
    counts: {
      sources: 42,
      uniqueExternalUrls: 31,
      equipment: 164,
      capabilities: 62,
      claims: 226,
      enrichedLocations: 39,
    },
    sources: [...canonical.sources, ...release.canonicalMonitorDelta.sources],
    claims: [...canonical.claims, ...release.canonicalMonitorDelta.claims],
    manifestHash: "",
  };
  projectedCanonical.manifestHash = enrichmentManifestHash(projectedCanonical);
  validateEnrichmentManifest(projectedCanonical);
  if (projectedCanonical.manifestHash !== EXPECTED.canonicalAfter) {
    throw new Error("Canonical Cohort 2 live authority identity mismatch");
  }

  validateR2FreshnessAuthority(r2);
  const alreadyRaw = raw.counts.entries === 45;
  if (!alreadyRaw && raw.manifestHash !== EXPECTED.rawBefore) {
    throw new Error("Existing raw live authority conflicts with Cohort 2 activation");
  }
  const projectedRaw: RawMonitorManifest = alreadyRaw ? raw : {
    ...raw,
    mode: "LIVE_MONITORED",
    authority: {
      ...raw.authority,
      monitorPacketHash: "",
      dbImportPacketHash: EXPECTED.db,
      releaseCoherenceHash: "",
    },
    counts: release.rawMonitorDelta.projectedCounts,
    sources: [...raw.sources, ...release.rawMonitorDelta.sources],
    entries: [...raw.entries, ...release.rawMonitorDelta.entries],
    manifestHash: "",
  };
  if (!alreadyRaw) {
    projectedRaw.authority.monitorPacketHash = rawMonitorPacketHash(projectedRaw);
    projectedRaw.authority.releaseCoherenceHash = rawMonitorReleaseCoherenceHash(
      EXPECTED.db,
      projectedRaw.authority.monitorPacketHash,
    );
    projectedRaw.manifestHash = rawMonitorManifestHash(projectedRaw);
  }
  validateRawMonitorManifest(projectedRaw, r2);
  if (
    projectedRaw.authority.monitorPacketHash !== EXPECTED.rawPacketAfter
    || projectedRaw.authority.releaseCoherenceHash !== EXPECTED.rawCoherenceAfter
    || projectedRaw.manifestHash !== EXPECTED.rawAfter
  ) throw new Error("Raw Cohort 2 live authority identity mismatch");

  await Promise.all([
    fs.writeFile(paths.canonical, `${JSON.stringify(projectedCanonical, null, 2)}\n`),
    fs.writeFile(paths.raw, `${JSON.stringify(projectedRaw, null, 2)}\n`),
  ]);
  process.stdout.write(`${JSON.stringify({
    canonical: projectedCanonical.counts,
    canonicalHash: projectedCanonical.manifestHash,
    raw: projectedRaw.counts,
    rawPacketHash: projectedRaw.authority.monitorPacketHash,
    rawReleaseCoherenceHash: projectedRaw.authority.releaseCoherenceHash,
    rawHash: projectedRaw.manifestHash,
  }, null, 2)}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
