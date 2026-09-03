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
  release: "data/hyrox/h3-11d-cohort3-golds-production-release.json",
  r2: "data/hyrox/h3-11d-r2-raw-fact-freshness-authority.json",
};

const EXPECTED = {
  release: "3db87da19adcae5899a9590f7a2d9ffb892844a97e95ffd2e070467f0c742f56",
  db: "8ca4ea82696b5fa6a5fff9e516abe33c3d0912ff5717acc5d32ef28c237d7020",
  canonicalDelta: "cc278f187c82caa6e73ed7589437fc7cf5f305865de17da7284505ab244e2bbd",
  rawDelta: "c5d5f3898c231a3f93c9f7da01aa046778add8eeb7da12b69d73108c13c48d44",
  canonicalBefore: "614048ba7d0890c8fbadfc0318ea37fa3e6da06e72dc15710800e7544f00ad2f",
  rawBefore: "02b076a08a666ac66b7623bb817417ce9a5051fae46b01fff92bc9ec26588903",
  canonicalAfter: "48aafdfb2ecb07be07266078ed4765cc1bfa04de1709c21b3e102d59f54a5808",
  rawPacketAfter: "73734b5fb1ce362b0422a102345aac803c04dd2e2aba73309736225d5c999e0c",
  rawCoherenceAfter: "7747143d726537209595a4c2492241f3313d281ead469a6d0b4b237247aa2adb",
  rawAfter: "6dcef897338c20a756ed8d0694ab6cedfb19eab4f55b886c4726f03f9f9471e9",
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
    release.hashes.COHORT3_RELEASE_COHERENCE_SHA256 !== EXPECTED.release
    || release.hashes.DB_IMPORT_PACKET_SHA256 !== EXPECTED.db
    || release.hashes.CANONICAL_MONITOR_DELTA_SHA256 !== EXPECTED.canonicalDelta
    || release.hashes.RAW_MONITOR_DELTA_SHA256 !== EXPECTED.rawDelta
  ) throw new Error("Accepted Cohort 3 release identity mismatch");

  const alreadyCanonical = canonical.counts.claims === 235;
  if (!alreadyCanonical && canonical.manifestHash !== EXPECTED.canonicalBefore) {
    throw new Error("Existing canonical live authority conflicts with Cohort 3 activation");
  }
  const projectedCanonical: EnrichmentAuthorityManifest = alreadyCanonical ? canonical : {
    ...canonical,
    counts: {
      sources: 45,
      uniqueExternalUrls: 34,
      equipment: 170,
      capabilities: 65,
      claims: 235,
      enrichedLocations: 41,
    },
    sources: [...canonical.sources, ...release.canonicalMonitorDelta.sources],
    claims: [...canonical.claims, ...release.canonicalMonitorDelta.claims],
    manifestHash: "",
  };
  projectedCanonical.manifestHash = enrichmentManifestHash(projectedCanonical);
  validateEnrichmentManifest(projectedCanonical);
  if (projectedCanonical.manifestHash !== EXPECTED.canonicalAfter) {
    throw new Error("Canonical Cohort 3 live authority identity mismatch");
  }

  validateR2FreshnessAuthority(r2);
  const alreadyRaw = raw.counts.entries === 50;
  if (!alreadyRaw && raw.manifestHash !== EXPECTED.rawBefore) {
    throw new Error("Existing raw live authority conflicts with Cohort 3 activation");
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
  ) throw new Error("Raw Cohort 3 live authority identity mismatch");

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
