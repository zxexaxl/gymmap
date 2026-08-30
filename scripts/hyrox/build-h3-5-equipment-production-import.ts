import { readFile, writeFile } from "node:fs/promises";
import { renderH35PostVerify, renderH35ProductionImport, renderH35ProductionPreflight } from "../../src/lib/hyrox-h3-5-production-sql";
import type { H34Candidate } from "../../src/lib/hyrox-h3-4-import-candidate";

async function main() {
  const input = "data/hyrox/h3-4-equipment-evidence-import-candidate.json";
  const output = "data/hyrox/h3-5-equipment-evidence-production-import.sql";
  const preflight = "data/hyrox/h3-5-equipment-evidence-production-preflight.sql";
  const postVerify = "data/hyrox/h3-5-equipment-evidence-production-postverify.sql";
  const candidate = JSON.parse(await readFile(input, "utf8")) as H34Candidate;
  const sql = renderH35ProductionImport(candidate);
  await Promise.all([
    writeFile(output, sql),
    writeFile(preflight, renderH35ProductionPreflight(candidate)),
    writeFile(postVerify, renderH35PostVerify(candidate)),
  ]);
  console.log(JSON.stringify({
    candidate_hash: candidate.candidate_hash,
    sources: candidate.sources.length,
    equipment: candidate.equipment.length,
    capabilities: candidate.capabilities.length,
    evidence: candidate.evidence.length,
    output,
    preflight,
    postVerify,
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
