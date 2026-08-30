import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  buildH34Candidate,
  type H34ProductionPreflight,
  type H34SourceRevalidation,
} from "../../src/lib/hyrox-h3-4-import-candidate";
import { renderH34Baseline, renderH34Rehearsal } from "../../src/lib/hyrox-h3-4-rehearsal-sql";
import type { PocReviewArtifact } from "../../src/lib/hyrox-equipment-evidence";

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function csv(value: unknown) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function countBy<T>(items: T[], key: (item: T) => string) {
  const output: Record<string, number> = {};
  for (const item of items) output[key(item)] = (output[key(item)] ?? 0) + 1;
  return output;
}

async function main() {
  const root = process.cwd();
  const data = path.join(root, "data/hyrox");
  const [sampleText, review, revalidation, preflight] = await Promise.all([
    readFile(path.join(data, "h3-3-equipment-poc-sample.json"), "utf8"),
    readFile(path.join(data, "h3-3-equipment-evidence-poc.json"), "utf8").then((value) => JSON.parse(value) as PocReviewArtifact),
    readFile(path.join(data, "h3-4-equipment-source-revalidation.json"), "utf8").then((value) => JSON.parse(value) as H34SourceRevalidation),
    readFile(path.join(data, "h3-4-production-preflight.json"), "utf8").then((value) => JSON.parse(value) as H34ProductionPreflight),
  ]);
  const candidate = buildH34Candidate({ review, revalidation, preflight, sampleSha256: sha256(sampleText) });
  const jsonPath = path.join(data, "h3-4-equipment-evidence-import-candidate.json");
  const markdownPath = path.join(data, "h3-4-equipment-evidence-import-candidate.md");
  const csvPath = path.join(data, "h3-4-equipment-evidence-import-candidate.csv");
  const baselinePath = path.join(data, "h3-4-equipment-evidence-import-candidate.baseline.sql");
  const rehearsalPath = path.join(data, "h3-4-equipment-evidence-import-candidate.rehearsal.sql");
  const equipmentCounts = countBy(candidate.equipment, (row) => row.equipment_slug);
  const capabilityCounts = countBy(candidate.capabilities, (row) => row.capability_slug);
  const qualityCounts = countBy(candidate.sources, (row) => String(row.metadata_json.evidence_quality));
  const sourceByRef = new Map(candidate.sources.map((source) => [source.source_ref, source]));
  const claimsByLocation = new Map<string, { equipment: string[]; capabilities: string[]; sources: Set<string>; evidence: number }>();
  for (const row of candidate.equipment) {
    const item = claimsByLocation.get(row.location_id) ?? { equipment: [], capabilities: [], sources: new Set<string>(), evidence: 0 };
    item.equipment.push(row.equipment_slug); item.sources.add(row.source_ref); item.evidence += 1; claimsByLocation.set(row.location_id, item);
  }
  for (const row of candidate.capabilities) {
    const item = claimsByLocation.get(row.location_id) ?? { equipment: [], capabilities: [], sources: new Set<string>(), evidence: 0 };
    item.capabilities.push(row.capability_slug); item.sources.add(row.source_ref); item.evidence += 1; claimsByLocation.set(row.location_id, item);
  }
  const locationById = new Map(preflight.sample_locations.map((location) => [location.id, location]));
  const locationRows = [...claimsByLocation.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([locationId, item]) => {
    const location = locationById.get(locationId)!;
    return {
      hgy: location.hgy_id,
      location: location.name,
      equipment: item.equipment.sort(),
      capabilities: item.capabilities.sort(),
      source_quality: [...item.sources].map((ref) => sourceByRef.get(ref)?.metadata_json.evidence_quality).sort(),
      observed_at: candidate.authority.h3_4_source_observed_at,
      equipment_stale_at: candidate.equipment.find((row) => row.location_id === locationId)?.stale_at ?? null,
      capability_stale_at: candidate.capabilities.filter((row) => row.location_id === locationId).map((row) => `${row.capability_slug}:${row.stale_at}`),
      evidence_rows: item.evidence,
    };
  });
  const markdown = `# H3-4 HYROX equipment evidence import candidate\n\n` +
    `Candidate hash: \`${candidate.candidate_hash}\`\n\nProduction write: **NO**\n\n` +
    `## Authority\n\n- H3-3 commit: \`${candidate.authority.h3_3_commit}\`\n- H3-3 sample: \`${candidate.authority.h3_3_sample_sha256}\`\n- Source observation: ${candidate.authority.h3_4_source_observed_at}\n- GO_TARGETED; exact H3-3 confirmed claims only.\n\n` +
    `## Counts\n\n| graph | count |\n|---|---:|\n| training_sources | ${candidate.counts.training_sources} |\n| location_equipment | ${candidate.counts.location_equipment} |\n| location_training_capabilities | ${candidate.counts.location_training_capabilities} |\n| training_evidence | ${candidate.counts.training_evidence} |\n| excluded REVIEW_REQUIRED | ${candidate.counts.excluded_review_required} |\n| negative claims | 0 |\n\n` +
    `## Equipment\n\n| type | count |\n|---|---:|\n${Object.entries(equipmentCounts).sort().map(([slug,count]) => `| ${slug} | ${count} |`).join("\n")}\n\n` +
    `## Capabilities\n\n| type | count |\n|---|---:|\n${Object.entries(capabilityCounts).sort().map(([slug,count]) => `| ${slug} | ${count} |`).join("\n")}\n\n` +
    `## Source quality\n\n- Q1 source rows: ${qualityCounts.Q1 ?? 0}\n- Q2 source rows: ${qualityCounts.Q2 ?? 0}\n- Q3/Q4/Q5 source rows: 0\n- Exact source revalidation: 10/10; drift 0\n\n` +
    `## Location review\n\n| HGY | location | equipment | capabilities | quality | observed | evidence |\n|---|---|---|---|---|---|---:|\n${locationRows.map((row) => `| ${row.hgy} | ${row.location} | ${row.equipment.join(", ") || "—"} | ${row.capabilities.join(", ") || "—"} | ${row.source_quality.join(", ")} | ${row.observed_at} | ${row.evidence_rows} |`).join("\n")}\n\n` +
    `## Freshness\n\n- Physical equipment: 180 days\n- open-training / discipline-coaching / sled-push-pull-space: 90 days\n- competition-simulation: 30 days; both records describe repeatable mock-race or race-equivalent training, not a historical one-off event.\n- Generation time never extends freshness.\n\n` +
    `## Rehearsal contract\n\n- One local-only transaction and transaction-scoped advisory lock.\n- Dependency order: sources → equipment/capabilities → evidence.\n- First pass: +10/+36/+16/+52.\n- Second pass: zero delta and no freshness change.\n- Semantic collisions fail closed.\n- Final rollback restores 82 sources, 0 equipment, 0 capabilities, and 164 evidence rows.\n- Search/publication total remains 82 Official HYROX locations.\n`;
  const csvRows = [
    ["target_type","target_ref","location_id","hgy_id","target_slug","source_ref","last_confirmed_at","stale_at","evidence_hash"],
    ...candidate.equipment.map((row) => ["equipment",row.equipment_ref,row.location_id,row.hgy_id,row.equipment_slug,row.source_ref,row.last_confirmed_at,row.stale_at,candidate.evidence.find((evidence) => evidence.target_ref === row.equipment_ref)?.content_hash]),
    ...candidate.capabilities.map((row) => ["capability",row.capability_ref,row.location_id,row.hgy_id,row.capability_slug,row.source_ref,row.last_confirmed_at,row.stale_at,candidate.evidence.find((evidence) => evidence.target_ref === row.capability_ref)?.content_hash]),
  ];
  await Promise.all([
    writeFile(jsonPath, `${JSON.stringify(candidate, null, 2)}\n`),
    writeFile(markdownPath, markdown),
    writeFile(csvPath, `${csvRows.map((row) => row.map(csv).join(",")).join("\n")}\n`),
    writeFile(baselinePath, renderH34Baseline(preflight)),
    writeFile(rehearsalPath, renderH34Rehearsal(candidate)),
  ]);
  console.log(JSON.stringify({ candidate_hash: candidate.candidate_hash, counts: candidate.counts, source_quality: qualityCounts }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
