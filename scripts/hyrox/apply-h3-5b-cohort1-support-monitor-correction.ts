import fs from "node:fs/promises";
import { enrichmentManifestHash, validateEnrichmentManifest, type EnrichmentAuthorityManifest } from "../../src/lib/hyrox-enrichment-monitor";
import { rawMonitorManifestHash, rawMonitorPacketHash, rawMonitorReleaseCoherenceHash, validateR2FreshnessAuthority, validateRawMonitorManifest, type R2FreshnessAuthority, type RawMonitorManifest } from "../../src/lib/hyrox-raw-fact-monitor";

const paths = {
  canonical: "data/hyrox/h3-5a-enrichment-monitor-authority.json",
  raw: "data/hyrox/h3-11d-r3-raw-monitor-live-authority.json",
  r2: "data/hyrox/h3-11d-r2-raw-fact-freshness-authority.json",
};

async function read<T>(path: string): Promise<T> { return JSON.parse(await fs.readFile(path, "utf8")) as T; }

function exactEntry(manifest: RawMonitorManifest, observationKey: string) {
  const matches = manifest.entries.filter((entry) => entry.observationKey === observationKey);
  if (matches.length !== 1) throw new Error(`Expected one raw monitor entry: ${observationKey}`);
  return matches[0];
}

async function main() {
  const [canonical, raw, r2] = await Promise.all([
    read<EnrichmentAuthorityManifest>(paths.canonical), read<RawMonitorManifest>(paths.raw), read<R2FreshnessAuthority>(paths.r2),
  ]);
  validateEnrichmentManifest(canonical);
  validateRawMonitorManifest(raw, r2);
  validateR2FreshnessAuthority(r2);

  const claimKey = "capability:9d7ac2ff-be49-4219-bcde-75e3745df6a4:sled-push-pull-space";
  const claims = canonical.claims.filter((claim) => claim.claimKey === claimKey);
  if (claims.length !== 1) throw new Error(`Expected one canonical monitor claim: ${claimKey}`);
  claims[0].supportPatternGroups = [["sled", "スレッド"], ["turf", "ターフ", "lane", "space", "スペース", "1階"]];

  exactEntry(raw, "HGY_6lR3pcwsQaSGSlsQTdrNrO1jc-space-push-pull-carry").supportCheck = {
    mode: "TEXT_PATTERN",
    patternGroups: [["push", "押す"], ["pull", "引く"], ["carry", "担ぐ"]],
  };
  exactEntry(raw, "HGY_j1Szv4JmxytARCgfm48f0Z4xS-space-burpee-broad-jump").supportCheck = {
    mode: "TEXT_PATTERN",
    patternGroups: [["burpee broad jump", "burpees broad jump", "バーピーブロードジャンプ"]],
  };
  exactEntry(raw, "HGY_j1Szv4JmxytARCgfm48f0Z4xS-space-running").supportCheck = {
    mode: "TEXT_PATTERN",
    patternGroups: [["running", "ランニング", "走り", "走る"], ["indoor", "屋内", "館内"]],
  };

  canonical.manifestHash = enrichmentManifestHash(canonical);
  raw.authority.monitorPacketHash = rawMonitorPacketHash(raw);
  if (!raw.authority.dbImportPacketHash) throw new Error("Live raw monitor DB release authority is missing");
  raw.authority.releaseCoherenceHash = rawMonitorReleaseCoherenceHash(raw.authority.dbImportPacketHash, raw.authority.monitorPacketHash);
  raw.manifestHash = rawMonitorManifestHash(raw);
  validateEnrichmentManifest(canonical);
  validateRawMonitorManifest(raw, r2);

  const expected = await Promise.all([
    fs.readFile(paths.canonical, "utf8"), fs.readFile(paths.raw, "utf8"),
  ]);
  const next = [`${JSON.stringify(canonical, null, 2)}\n`, `${JSON.stringify(raw, null, 2)}\n`];
  if (process.argv.includes("--check")) {
    if (expected[0] !== next[0] || expected[1] !== next[1]) throw new Error("H3-5B support matcher correction drift");
  } else {
    await Promise.all([fs.writeFile(paths.canonical, next[0]), fs.writeFile(paths.raw, next[1])]);
  }
  process.stdout.write(`${JSON.stringify({ canonicalManifestHash: canonical.manifestHash, rawMonitorPacketHash: raw.authority.monitorPacketHash, rawManifestHash: raw.manifestHash }, null, 2)}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
