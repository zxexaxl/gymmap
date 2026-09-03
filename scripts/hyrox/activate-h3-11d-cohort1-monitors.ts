/* eslint-disable @typescript-eslint/no-explicit-any -- accepted release JSON is validated by frozen hashes before activation */
import fs from "node:fs/promises";
import { enrichmentManifestHash, validateEnrichmentManifest, type EnrichmentAuthorityManifest } from "../../src/lib/hyrox-enrichment-monitor";
import { validateR2FreshnessAuthority, validateRawMonitorManifest, type R2FreshnessAuthority, type RawMonitorManifest } from "../../src/lib/hyrox-raw-fact-monitor";

const paths = {
  canonical: "data/hyrox/h3-5a-enrichment-monitor-authority.json",
  raw: "data/hyrox/h3-11d-r3-raw-monitor-live-authority.json",
  release: "data/hyrox/h3-11d-cohort1-production-release.json",
  r2: "data/hyrox/h3-11d-r2-raw-fact-freshness-authority.json",
};
const EXPECTED = {
  release: "12c5669921f0ee745a19f01c404d3df2974fddbbdaa712885634e45683f22510",
  db: "c1c89a9716604fe8fd2d0b5ba3d2f11ee81b3723fdfb96652550c623029f6046",
  canonical: "1614549ec0a7d0fbf043c448cc25e508ec651198640d691504b06fe3ae42600f",
  raw: "507b170ca427438096298ddc55364394d11a915577f5077a4aa0c01b110837ed",
};

async function read<T>(path: string): Promise<T> { return JSON.parse(await fs.readFile(path, "utf8")) as T; }

async function main() {
  const [canonical, liveRaw, release, r2] = await Promise.all([
    read<EnrichmentAuthorityManifest>(paths.canonical), read<RawMonitorManifest>(paths.raw), read<any>(paths.release), read<R2FreshnessAuthority>(paths.r2),
  ]);
  if (release.hashes.COHORT1_RELEASE_COHERENCE_SHA256 !== EXPECTED.release || release.hashes.DB_IMPORT_PACKET_SHA256 !== EXPECTED.db) throw new Error("Accepted Cohort 1 release identity mismatch");
  const projectedCanonical: EnrichmentAuthorityManifest = canonical.counts.claims === 187 ? canonical : {
    ...canonical,
    counts: release.projectedCanonicalMonitor.counts,
    sources: [...canonical.sources, ...release.canonicalMonitorDelta.sources],
    claims: [...canonical.claims, ...release.canonicalMonitorDelta.claims],
    manifestHash: "",
  };
  projectedCanonical.manifestHash = enrichmentManifestHash(projectedCanonical);
  if (projectedCanonical.manifestHash !== EXPECTED.canonical || projectedCanonical.manifestHash !== release.projectedCanonicalMonitor.manifestHash) throw new Error("Canonical monitor release identity mismatch");
  validateEnrichmentManifest(projectedCanonical);

  const projectedRaw = release.rawMonitorDelta.projectedManifest as RawMonitorManifest;
  validateR2FreshnessAuthority(r2);
  validateRawMonitorManifest(projectedRaw, r2);
  if (projectedRaw.manifestHash !== EXPECTED.raw || projectedRaw.authority.dbImportPacketHash !== EXPECTED.db) throw new Error("Raw monitor release identity mismatch");
  if (liveRaw.counts.entries !== 0 && liveRaw.manifestHash !== projectedRaw.manifestHash) throw new Error("Existing raw live authority conflicts with accepted Cohort 1 release");

  await Promise.all([
    fs.writeFile(paths.canonical, `${JSON.stringify(projectedCanonical, null, 2)}\n`),
    fs.writeFile(paths.raw, `${JSON.stringify(projectedRaw, null, 2)}\n`),
  ]);
  process.stdout.write(`${JSON.stringify({ canonical: projectedCanonical.counts, canonicalHash: projectedCanonical.manifestHash, raw: projectedRaw.counts, rawHash: projectedRaw.manifestHash }, null, 2)}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
