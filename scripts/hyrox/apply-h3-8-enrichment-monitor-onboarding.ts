import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { writeFile } from "node:fs/promises";
import { enrichmentManifestHash, validateEnrichmentManifest, type EnrichmentAuthorityManifest } from "../../src/lib/hyrox-enrichment-monitor";

const execFileAsync = promisify(execFile);
const H3_7_COMMIT = "864b049107e6a3535fa4d0b17e47ef216f39487b";
const PROJECTED_HASH = "65a7e36c81f52d72b6215e26ab03caecac3d036e73a378a740fc8c3a03e34df2";
const RELEASE_HASH = "dc97df4fd675d29e71425c7720ede609234c749da305aa5249f8dcfc3c32c255";

async function main() {
  const { stdout } = await execFileAsync("git", ["show", `${H3_7_COMMIT}:data/hyrox/h3-7-projected-enrichment-monitor-manifest.json`], { maxBuffer: 2_000_000 });
  const projected = JSON.parse(stdout) as EnrichmentAuthorityManifest & { releaseAuthority?: Record<string, string> };
  const manifest = Object.fromEntries(Object.entries(projected).filter(([key]) => key !== "releaseAuthority")) as EnrichmentAuthorityManifest;
  if (manifest.manifestHash !== PROJECTED_HASH || enrichmentManifestHash(manifest) !== PROJECTED_HASH) throw new Error("H3-7 projected manifest hash mismatch");
  validateEnrichmentManifest(manifest);
  await Promise.all([
    writeFile("data/hyrox/h3-5a-enrichment-monitor-authority.json", `${JSON.stringify(manifest, null, 2)}\n`),
    writeFile("data/hyrox/h3-8-enrichment-monitor-release-authority.json", `${JSON.stringify({
      schemaVersion: 1,
      h3_7Commit: H3_7_COMMIT,
      dbCandidateHash: "9610b5ea03d43c78823857620d4813203f6db2a1e12632c5c559dffec19ba83e",
      monitorDeltaHash: "f3cfeca4db5828308e6cb85d4c370153d61a489d11429ad6618d4bae0b02e79a",
      projectedManifestHash: PROJECTED_HASH,
      releaseCoherenceHash: RELEASE_HASH,
      claims: 150,
      sourceRelations: 26,
      uniqueExternalUrls: 15,
    }, null, 2)}\n`),
  ]);
  console.log(JSON.stringify({ manifestHash: manifest.manifestHash, counts: manifest.counts, releaseHash: RELEASE_HASH }, null, 2));
}

main().catch((error) => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; });
