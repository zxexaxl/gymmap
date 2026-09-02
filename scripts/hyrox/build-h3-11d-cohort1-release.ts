import fs from "node:fs/promises";
import { buildCohort1Release, validateCohort1Release } from "../../src/lib/hyrox-cohort1-release";

const paths = {
  raw: "data/hyrox/h3-11d-cohort1-raw-evidence.json",
  ledger: "data/hyrox/h3-11d-cohort1-review-ledger-candidate.json",
  positive: "data/hyrox/h3-11d-cohort1-positive-claim-candidate.json",
  r2: "data/hyrox/h3-11d-r2-raw-fact-freshness-authority.json",
  r3: "data/hyrox/h3-11d-r3-cohort1-monitor-candidate.json",
  enrichment: "data/hyrox/h3-5a-enrichment-monitor-authority.json",
  sourceRecheck: "data/hyrox/h3-11d-cohort1-source-recheck.json",
  output: "data/hyrox/h3-11d-cohort1-production-release.json",
};

async function read(path: string) { return JSON.parse(await fs.readFile(path, "utf8")); }

async function main() {
  const release = validateCohort1Release(buildCohort1Release({
    raw: await read(paths.raw),
    ledger: await read(paths.ledger),
    positive: await read(paths.positive),
    r2: await read(paths.r2),
    r3Candidate: await read(paths.r3),
    existingEnrichment: await read(paths.enrichment),
    sourceRecheck: await read(paths.sourceRecheck),
    sourceMain: "2636c838b57de55617f611064a90630eaf3d1408",
  }));
  const content = `${JSON.stringify(release, null, 2)}\n`;
  if (process.argv.includes("--check")) {
    if (await fs.readFile(paths.output, "utf8") !== content) throw new Error("Cohort 1 release artifact drift");
    process.stdout.write("Cohort 1 release artifact is deterministic.\n");
    return;
  }
  await fs.writeFile(paths.output, content);
  process.stdout.write(`${JSON.stringify({ projected: release.projected, hashes: release.hashes, manifestHash: release.manifestHash }, null, 2)}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
