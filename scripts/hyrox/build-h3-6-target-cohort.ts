import { execFileSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { selectH36Cohort, type H33SampleLocation } from "../../src/lib/hyrox-targeted-evidence";
import type { HyroxMonitorBaseline } from "../../src/lib/hyrox-monitor";
import type { PublishedEnrichmentClaim } from "../../src/lib/hyrox-enrichment-monitor";

function option(name: string) { const prefix = `--${name}=`; return process.argv.find((value) => value.startsWith(prefix))?.slice(prefix.length) ?? null; }
function sha256(value: string) { return createHash("sha256").update(value).digest("hex"); }

async function main() {
  const baselinePath = option("baseline");
  if (!baselinePath) throw new Error("--baseline=<read-only production snapshot> is required");
  const baseline = JSON.parse(await readFile(baselinePath, "utf8")) as { checkedAt: string; baselines: HyroxMonitorBaseline[]; publishedClaims: PublishedEnrichmentClaim[] };
  const sampleText = execFileSync("git", ["show", "7a90c9db0bc43039d4c02bdfe377fab5bfb34e12:data/hyrox/h3-3-equipment-poc-sample.json"], { encoding: "utf8" });
  const sample = JSON.parse(sampleText) as { locations: H33SampleLocation[] };
  const sampleHash = sha256(sampleText);
  if (sampleHash !== "d58b83b254e32a564443bbae46d832e1d5a74ae56f6e24dcf3a2ac854733e9ce") throw new Error("H3-3 sample hash mismatch");
  const cohort = selectH36Cohort({ baselines: baseline.baselines, h3Sample: sample.locations, publishedClaims: baseline.publishedClaims,
    selectedAt: baseline.checkedAt, originMain: "8a54e393842dd0d467381add27b0c1f9010d9bf7", h3SampleSha256: sampleHash });
  const output = option("output") ?? "data/hyrox/h3-6-targeted-equipment-scaleout-cohort.json";
  await writeFile(output, `${JSON.stringify(cohort, null, 2)}\n`);
  console.log(JSON.stringify({ output, cohortHash: cohort.cohortHash, counts: cohort.counts,
    brands: Object.fromEntries([...new Set(cohort.locations.map((row) => row.brandName))].sort().map((brand) => [brand, cohort.locations.filter((row) => row.brandName === brand).length])) }, null, 2));
}

main().catch((error) => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; });
