import fs from "node:fs/promises";
import path from "node:path";
import { loadEnvConfig } from "@next/env";
import { buildMonitorRun, summarizeMonitorRun, type FacilityObservation, type FinderObservation, type HyroxMonitorBaseline } from "../../src/lib/hyrox-monitor";
import { runLiveHyroxMonitor } from "../../src/lib/hyrox-monitor-source";

type Fixture = {
  baselines: HyroxMonitorBaseline[];
  finderHealthAvailable: boolean;
  finderObservations: FinderObservation[];
  facilityObservations: FacilityObservation[];
};

function option(name: string): string | null {
  const prefix = `--${name}=`;
  return process.argv.find((value) => value.startsWith(prefix))?.slice(prefix.length) ?? null;
}

async function main(): Promise<void> {
  loadEnvConfig(process.cwd());
  const checkedAt = option("checked-at") ?? new Date().toISOString();
  if (Number.isNaN(Date.parse(checkedAt))) throw new Error("--checked-at must be an ISO timestamp");
  const outputDirectory = path.resolve(option("output-dir") ?? ".artifacts/hyrox-monitoring");
  const fixturePath = option("fixture");
  if (!fixturePath && (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required");
  }
  const run = fixturePath
    ? await (async () => {
      const fixture = JSON.parse(await fs.readFile(path.resolve(fixturePath), "utf8")) as Fixture;
      return buildMonitorRun({
        baselines: fixture.baselines,
        finderObservations: new Map(fixture.finderObservations.map((item) => [item.hgyId ?? "", item])),
        facilityObservations: new Map(fixture.facilityObservations.map((item, index) => [fixture.baselines[index].hgyId, item])),
        checkedAt,
        finderHealthAvailable: fixture.finderHealthAvailable,
      });
    })()
    : await runLiveHyroxMonitor({
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
      supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
      checkedAt,
    });
  await fs.mkdir(outputDirectory, { recursive: true });
  const json = `${JSON.stringify(run, null, 2)}\n`;
  const queue = `${JSON.stringify({ schemaVersion: 1, checkedAt, records: run.reviewQueue }, null, 2)}\n`;
  const markdown = `${summarizeMonitorRun(run)}\n`;
  await Promise.all([
    fs.writeFile(path.join(outputDirectory, "hyrox-freshness-monitor-latest.json"), json),
    fs.writeFile(path.join(outputDirectory, "hyrox-freshness-review-queue.json"), queue),
    fs.writeFile(path.join(outputDirectory, "hyrox-freshness-monitor-latest.md"), markdown),
  ]);
  process.stdout.write(markdown);
  if (run.runIssues.length > 0) process.exitCode = 1;
  else if (process.argv.includes("--ci") && run.records.some((record) => ["HIGH", "CRITICAL"].includes(record.severity))) {
    process.exitCode = 2;
  }
}

main().catch((error) => {
  process.stderr.write(`HYROX monitor failed: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
