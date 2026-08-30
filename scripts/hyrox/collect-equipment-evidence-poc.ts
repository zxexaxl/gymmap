import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { verifySourcesBounded } from "../../src/lib/hyrox-equipment-source-verifier";
import type { PocReviewArtifact } from "../../src/lib/hyrox-equipment-evidence";

async function main() {
  const root = process.cwd();
  const artifact = JSON.parse(
    await readFile(path.join(root, "data/hyrox/h3-3-equipment-evidence-poc.json"), "utf8"),
  ) as PocReviewArtifact;
  const urls = artifact.facilities.flatMap((facility) => facility.sources.map((source) => source.url));
  const checkedAt = new Date().toISOString();
  const results = await verifySourcesBounded(urls, 4, { retries: 1, checkedAt });
  const output = {
    schemaVersion: 1,
    checkedAt,
    readOnly: true,
    concurrency: 4,
    requestBudget: { uniqueUrls: results.length, maxAttemptsPerUrl: 2 },
    results,
  };
  const outputDir = path.join(root, ".artifacts/hyrox-equipment-poc");
  await mkdir(outputDir, { recursive: true });
  await writeFile(path.join(outputDir, "source-verification.json"), `${JSON.stringify(output, null, 2)}\n`);
  const statuses: Record<string, number> = {};
  for (const result of results) statuses[result.status] = (statuses[result.status] ?? 0) + 1;
  console.log(JSON.stringify({ checkedAt, urls: results.length, statuses }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
