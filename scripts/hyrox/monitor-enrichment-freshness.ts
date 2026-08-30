import fs from "node:fs/promises";
import path from "node:path";
import { loadEnvConfig } from "@next/env";
import { buildEnrichmentMonitorRun, summarizeEnrichmentMonitorRun, validateEnrichmentManifest, type EnrichmentAuthorityManifest, type EnrichmentSourceObservation, type PublishedEnrichmentClaim } from "../../src/lib/hyrox-enrichment-monitor";
import { runLiveEnrichmentMonitor } from "../../src/lib/hyrox-enrichment-monitor-source";

function option(name: string) { const prefix = `--${name}=`; return process.argv.find((value) => value.startsWith(prefix))?.slice(prefix.length) ?? null; }

async function main() {
  loadEnvConfig(process.cwd());
  const checkedAt = option("checked-at") ?? new Date().toISOString();
  if (Number.isNaN(Date.parse(checkedAt))) throw new Error("--checked-at must be an ISO timestamp");
  const manifestPath = path.resolve(option("manifest") ?? "data/hyrox/h3-5a-enrichment-monitor-authority.json");
  const manifest = validateEnrichmentManifest(JSON.parse(await fs.readFile(manifestPath, "utf8")) as EnrichmentAuthorityManifest);
  const fixturePath = option("fixture");
  if (!fixturePath && (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)) throw new Error("NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required");
  const run = fixturePath
    ? await (async () => {
      const fixture = JSON.parse(await fs.readFile(path.resolve(fixturePath), "utf8")) as { publishedClaims: PublishedEnrichmentClaim[]; sourceObservations: EnrichmentSourceObservation[]; requestStats?: { sources: number; retries: number; concurrency: number } };
      return buildEnrichmentMonitorRun({ manifest, publishedClaims: fixture.publishedClaims, sourceObservations: fixture.sourceObservations,
        checkedAt, requestStats: fixture.requestStats });
    })()
    : await runLiveEnrichmentMonitor({ manifest, supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "", supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "", checkedAt });
  const outputDirectory = path.resolve(option("output-dir") ?? ".artifacts/hyrox-enrichment-monitoring");
  await fs.mkdir(outputDirectory, { recursive: true });
  const markdown = `${summarizeEnrichmentMonitorRun(run)}\n`;
  await Promise.all([
    fs.writeFile(path.join(outputDirectory, "hyrox-enrichment-freshness-monitor-latest.json"), `${JSON.stringify(run, null, 2)}\n`),
    fs.writeFile(path.join(outputDirectory, "hyrox-enrichment-freshness-monitor-latest.md"), markdown),
    fs.writeFile(path.join(outputDirectory, "hyrox-enrichment-freshness-review-queue.json"), `${JSON.stringify({ schemaVersion: 1, checkedAt, records: run.reviewQueue }, null, 2)}\n`),
  ]);
  process.stdout.write(markdown);
  if (run.runIssues.length > 0) process.exitCode = 1;
  else if (process.argv.includes("--ci") && run.records.some((record) => ["HIGH", "CRITICAL"].includes(record.severity))) process.exitCode = 2;
}

main().catch((error) => { process.stderr.write(`HYROX enrichment monitor failed: ${error instanceof Error ? error.message : String(error)}\n`); process.exitCode = 1; });
