import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { collectH36Sources } from "../../src/lib/hyrox-targeted-source";
import { validateH36Cohort, type H36CohortArtifact } from "../../src/lib/hyrox-targeted-evidence";

function option(name: string) { const prefix = `--${name}=`; return process.argv.find((value) => value.startsWith(prefix))?.slice(prefix.length) ?? null; }

async function main() {
  const cohort = validateH36Cohort(JSON.parse(await readFile(option("cohort") ?? "data/hyrox/h3-6-targeted-equipment-scaleout-cohort.json", "utf8")) as H36CohortArtifact);
  const checkedAt = option("checked-at") ?? new Date().toISOString(); const outputDir = option("output-dir") ?? ".artifacts/hyrox-h3-6";
  const run = await collectH36Sources(cohort, { checkedAt, concurrency: 4, retries: 1 });
  await mkdir(outputDir, { recursive: true }); await writeFile(path.join(outputDir, "targeted-source-discovery.json"), `${JSON.stringify(run, null, 2)}\n`);
  console.log(JSON.stringify({ checkedAt, cohort: cohort.counts.facilities, ...run.requestStats,
    statuses: Object.fromEntries([...new Set(run.pages.map((page) => page.status))].sort().map((status) => [status, run.pages.filter((page) => page.status === status).length])),
    pagesWithSignals: run.pages.filter((page) => page.signals.length > 0).length }, null, 2));
}

main().catch((error) => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; });
