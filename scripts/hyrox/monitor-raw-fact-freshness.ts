import fs from "node:fs/promises";
import path from "node:path";
import {
  buildRawMonitorRun,
  summarizeRawMonitorRun,
  validateRawMonitorManifest,
  type R2FreshnessAuthority,
  type RawMonitorManifest,
} from "../../src/lib/hyrox-raw-fact-monitor";
import { observeRawMonitorSources } from "../../src/lib/hyrox-raw-fact-monitor-source";
import type { EnrichmentSourceObservation } from "../../src/lib/hyrox-enrichment-monitor";

function option(name: string) {
  const prefix = `--${name}=`;
  return process.argv.find((value) => value.startsWith(prefix))?.slice(prefix.length) ?? null;
}

async function main() {
  const checkedAt = option("checked-at") ?? new Date().toISOString();
  if (Number.isNaN(Date.parse(checkedAt))) throw new Error("--checked-at must be an ISO timestamp");
  const manifestPath = path.resolve(option("manifest") ?? "data/hyrox/h3-11d-r3-raw-monitor-live-authority.json");
  const authorityPath = path.resolve(option("authority") ?? "data/hyrox/h3-11d-r2-raw-fact-freshness-authority.json");
  const authority = JSON.parse(await fs.readFile(authorityPath, "utf8")) as R2FreshnessAuthority;
  const manifest = validateRawMonitorManifest(
    JSON.parse(await fs.readFile(manifestPath, "utf8")) as RawMonitorManifest,
    authority,
  );
  const fixturePath = option("source-fixture");
  const started = Date.now();
  const sourceResult = fixturePath
    ? JSON.parse(await fs.readFile(path.resolve(fixturePath), "utf8")) as {
      observations: EnrichmentSourceObservation[];
      stats: { entries: number; uniqueSources: number; requestsAfterDedup: number; retries: number; concurrency: number };
    }
    : await observeRawMonitorSources(manifest);
  const run = buildRawMonitorRun({
    manifest,
    authority,
    sourceObservations: sourceResult.observations,
    checkedAt,
    durationMs: Date.now() - started,
    requestStats: sourceResult.stats,
  });
  const outputDirectory = path.resolve(option("output-dir") ?? ".artifacts/hyrox-raw-fact-monitoring");
  await fs.mkdir(outputDirectory, { recursive: true });
  const markdown = `${summarizeRawMonitorRun(run)}\n`;
  await Promise.all([
    fs.writeFile(path.join(outputDirectory, "hyrox-raw-fact-freshness-monitor-latest.json"), `${JSON.stringify(run, null, 2)}\n`),
    fs.writeFile(path.join(outputDirectory, "hyrox-raw-fact-freshness-monitor-latest.md"), markdown),
    fs.writeFile(path.join(outputDirectory, "hyrox-raw-fact-freshness-review-queue.json"), `${JSON.stringify({ schemaVersion: 1, checkedAt, records: run.reviewQueue }, null, 2)}\n`),
  ]);
  process.stdout.write(markdown);
  if (run.runIssues.length > 0) process.exitCode = 1;
  else if (process.argv.includes("--ci") && run.records.some((record) => ["HIGH", "CRITICAL"].includes(record.severity))) process.exitCode = 2;
}

main().catch((error) => {
  process.stderr.write(`HYROX raw fact monitor failed: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
