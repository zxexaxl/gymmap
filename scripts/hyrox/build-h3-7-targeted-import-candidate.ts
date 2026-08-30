import { readFile, writeFile } from "node:fs/promises";
import { buildH37Release, type H37ProductionPreflight } from "../../src/lib/hyrox-h3-7-import-candidate";
import type { EnrichmentAuthorityManifest } from "../../src/lib/hyrox-enrichment-monitor";
import type { H37SourceRevalidation } from "../../src/lib/hyrox-h3-7-source-revalidation";

async function json<T>(path: string) { return JSON.parse(await readFile(path, "utf8")) as T; }
async function main() {
  const equipment = await json<{ candidates: never[] }>("data/hyrox/h3-6-confirmed-equipment-candidates.json");
  const capabilities = await json<{ candidates: never[] }>("data/hyrox/h3-6-confirmed-capability-candidates.json");
  const review = await json<never>("data/hyrox/h3-6-targeted-equipment-evidence.json");
  const preflight = await json<H37ProductionPreflight>("data/hyrox/h3-7-production-preflight.json");
  const revalidation = await json<H37SourceRevalidation>("data/hyrox/h3-7-targeted-source-revalidation.json");
  const currentManifest = await json<EnrichmentAuthorityManifest>("data/hyrox/h3-5a-enrichment-monitor-authority.json");
  const built = buildH37Release({ equipment: equipment.candidates, capabilities: capabilities.candidates, review, preflight, revalidation, currentManifest });
  const summary = `# H3-7 targeted equipment import candidate\n\nProduction write: **NO**\n\n- Release hash: \`${built.release.releaseHash}\`\n- DB candidate hash: \`${built.candidate.candidateHash}\`\n- Monitor delta hash: \`${built.monitorDelta.deltaHash}\`\n- Projected monitor manifest hash: \`${built.projectedManifest.manifestHash}\`\n- Sources / equipment / capabilities / evidence: 16 / 73 / 25 / 98\n- Current / new / projected monitored claims: 52 / 98 / 150\n- Projected equipment / capabilities: 109 / 41\n- HYROX locations: 82 (unchanged)\n\nThe package excludes all 12 review-required and 14 observed-only H3-6 signals and creates no negative facts.\n`;
  await Promise.all([
    writeFile("data/hyrox/h3-7-targeted-equipment-import-candidate.json", `${JSON.stringify({ ...built.candidate, releaseAuthority: built.release }, null, 2)}\n`),
    writeFile("data/hyrox/h3-7-targeted-equipment-import-candidate.md", summary),
    writeFile("data/hyrox/h3-7-enrichment-monitor-onboarding-delta.json", `${JSON.stringify(built.monitorDelta, null, 2)}\n`),
    writeFile("data/hyrox/h3-7-projected-enrichment-monitor-manifest.json", `${JSON.stringify({ ...built.projectedManifest, releaseAuthority: built.release }, null, 2)}\n`),
  ]);
  console.log(JSON.stringify({ ...built.release, counts: built.candidate.counts, projectedMonitor: built.projectedManifest.counts }, null, 2));
}
main().catch((error) => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; });
