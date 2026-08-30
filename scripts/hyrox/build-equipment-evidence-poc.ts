import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  HYROX_CAPABILITY_SLUGS,
  HYROX_EQUIPMENT_SLUGS,
  buildCandidateGraph,
  buildPublicationPreview,
  expandReviewedClaims,
  type PocReviewArtifact,
} from "../../src/lib/hyrox-equipment-evidence";

const root = process.cwd();
const samplePath = path.join(root, "data/hyrox/h3-3-equipment-poc-sample.json");
const reviewPath = path.join(root, "data/hyrox/h3-3-equipment-evidence-poc.json");
const markdownPath = path.join(root, "data/hyrox/h3-3-equipment-evidence-poc.md");
const csvPath = path.join(root, "data/hyrox/h3-3-equipment-evidence-poc.csv");
const equipmentPath = path.join(root, "data/hyrox/h3-3-equipment-confirmed-candidates.json");
const capabilityPath = path.join(root, "data/hyrox/h3-3-capability-confirmed-candidates.json");
const graphPath = path.join(root, "data/hyrox/h3-3-equipment-evidence-graph-preview.json");

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function csvCell(value: unknown) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function countBy<T>(items: T[], key: (item: T) => string) {
  const result: Record<string, number> = {};
  for (const item of items) result[key(item)] = (result[key(item)] ?? 0) + 1;
  return result;
}

function taxonomyRows(
  slugs: readonly string[],
  claims: ReturnType<typeof expandReviewedClaims>,
  targetType: "equipment" | "capability",
  facilityCount: number,
) {
  return slugs.map((slug) => {
    const relevant = claims.filter((claim) => claim.targetType === targetType && claim.targetSlug === slug);
    const confirmed = new Set(relevant.filter((claim) => claim.classification === "CONFIRMED_CANDIDATE").map((claim) => claim.locationId));
    const review = new Set(relevant.filter((claim) => claim.classification === "REVIEW_REQUIRED").map((claim) => claim.locationId));
    const observed = new Set(relevant.filter((claim) => claim.classification === "OBSERVED_NOT_CANDIDATE").map((claim) => claim.locationId));
    return {
      slug,
      confirmed: confirmed.size,
      reviewRequired: review.size,
      observedNotCandidate: observed.size,
      noEvidence: facilityCount - new Set([...confirmed, ...review, ...observed]).size,
    };
  });
}

async function main() {
  const [sampleText, reviewText] = await Promise.all([
    readFile(samplePath, "utf8"),
    readFile(reviewPath, "utf8"),
  ]);
  const sample = JSON.parse(sampleText) as { locations: Array<{ locationId: string; hgyId: string; officialUrl: string }> };
  const review = JSON.parse(reviewText) as PocReviewArtifact;
  const actualSampleHash = sha256(sampleText);
  if (actualSampleHash !== review.sampleSha256) {
    throw new Error(`Sample hash mismatch: ${actualSampleHash} != ${review.sampleSha256}`);
  }
  if (sample.locations.length !== 15 || review.facilities.length !== 15) throw new Error("PoC requires exactly 15 facilities");
  const sampleIdentity = sample.locations.map((item) => `${item.hgyId}:${item.locationId}`).sort();
  const reviewIdentity = review.facilities.map((item) => `${item.hgyId}:${item.locationId}`).sort();
  if (JSON.stringify(sampleIdentity) !== JSON.stringify(reviewIdentity)) throw new Error("Review facilities differ from frozen sample");

  const claims = expandReviewedClaims(review);
  const graph = buildCandidateGraph(review);
  const publication = buildPublicationPreview(review);
  const equipmentRows = taxonomyRows(HYROX_EQUIPMENT_SLUGS, claims, "equipment", 15);
  const capabilityRows = taxonomyRows(HYROX_CAPABILITY_SLUGS, claims, "capability", 15);
  const sourceSurface = countBy(review.facilities, (item) => item.sourceSurface);
  const automation = countBy(review.facilities, (item) => item.automationClass);
  const quality = countBy(claims, (item) => item.source.quality);
  const confirmed = claims.filter((claim) => claim.classification === "CONFIRMED_CANDIDATE");
  const reviewed = claims.filter((claim) => claim.classification === "REVIEW_REQUIRED");
  const anyEquipment = new Set(confirmed.filter((claim) => claim.targetType === "equipment").map((claim) => claim.locationId));
  const anyCapability = new Set(confirmed.filter((claim) => claim.targetType === "capability").map((claim) => claim.locationId));
  const anyConfirmed = new Set([...anyEquipment, ...anyCapability]);
  const anyReviewed = new Set(reviewed.map((claim) => claim.locationId));
  const officialHosts = new Set(sample.locations.map((item) => new URL(item.officialUrl).hostname));
  const reviewedHosts = new Set(review.facilities.flatMap((item) => item.sources.map((source) => new URL(source.url).hostname)));
  const pagesInspected = review.facilities.reduce((sum, item) => sum + item.pagesInspected, 0);
  const reviewActions = review.facilities.reduce((sum, item) => sum + item.reviewActions, 0);

  const metrics = {
    facilities: 15,
    sourceSurface,
    automation,
    pagesInspected,
    reviewActions,
    officialUrlHosts: officialHosts.size,
    reviewedSourceHosts: reviewedHosts.size,
    anyConfirmedEquipmentFacilities: anyEquipment.size,
    anyConfirmedCapabilityFacilities: anyCapability.size,
    anyConfirmedFacilities: anyConfirmed.size,
    ambiguousOnlyFacilities: [...anyReviewed].filter((id) => !anyConfirmed.has(id)).length,
    noUsefulSourceFacilities: sourceSurface.no_useful_source ?? 0,
    quality,
    confirmedClaims: confirmed.length,
    reviewRequiredClaims: reviewed.length,
    equipmentRows,
    capabilityRows,
    candidateGraph: {
      trainingSources: graph.trainingSources.length,
      equipment: graph.equipment.length,
      capabilities: graph.capabilities.length,
      evidence: graph.evidence.length,
    },
  };

  const equipmentArtifact = {
    schemaVersion: 1,
    sampleSha256: actualSampleHash,
    generatedFrom: "h3-3-equipment-evidence-poc.json",
    productionWrite: false,
    suggestedFreshnessDays: 180,
    candidates: graph.equipment,
  };
  const capabilityArtifact = {
    schemaVersion: 1,
    sampleSha256: actualSampleHash,
    generatedFrom: "h3-3-equipment-evidence-poc.json",
    productionWrite: false,
    suggestedFreshnessDays: 90,
    candidates: graph.capabilities,
  };
  await Promise.all([
    writeFile(equipmentPath, `${JSON.stringify(equipmentArtifact, null, 2)}\n`),
    writeFile(capabilityPath, `${JSON.stringify(capabilityArtifact, null, 2)}\n`),
    writeFile(graphPath, `${JSON.stringify({
      schemaVersion: 1,
      sampleSha256: actualSampleHash,
      productionWrite: false,
      dependencyOrder: ["training_sources", "location_equipment", "location_training_capabilities", "training_evidence"],
      graph,
      publicationPreview: publication,
    }, null, 2)}\n`),
  ]);

  const csvHeader = ["hgy_id", "location_slug", "target_type", "target_slug", "classification", "quality", "source_url", "evidence_hash"];
  const csv = [csvHeader, ...claims.map((claim) => [
    claim.hgyId,
    claim.locationSlug,
    claim.targetType,
    claim.targetSlug,
    claim.classification,
    claim.source.quality,
    claim.source.url,
    claim.evidenceHash,
  ])].map((row) => row.map(csvCell).join(",")).join("\n");
  await writeFile(csvPath, `${csv}\n`);

  const markdown = `# H3-3 HYROX equipment evidence PoC\n\n` +
    `Frozen sample SHA-256: \`${actualSampleHash}\`\n\n` +
    `Production write: **NO**\n\n` +
    `## Measured result\n\n` +
    `- Facilities: 15\n` +
    `- Pages inspected: ${pagesInspected}\n` +
    `- Recorded review actions: ${reviewActions}\n` +
    `- Facilities with confirmed equipment: ${anyEquipment.size}\n` +
    `- Facilities with confirmed capability: ${anyCapability.size}\n` +
    `- Confirmed claims: ${confirmed.length}\n` +
    `- Review-required claims: ${reviewed.length}\n` +
    `- Candidate sources: ${graph.trainingSources.length}\n\n` +
    `## Frozen sample\n\n| HGY | location | prefecture | source surface | automation | pages | review actions |\n|---|---|---|---|---|---:|---:|\n` +
    review.facilities.map((facility) => `| ${facility.hgyId} | ${facility.name} | ${facility.prefecture} | ${facility.sourceSurface} | ${facility.automationClass} | ${facility.pagesInspected} | ${facility.reviewActions} |`).join("\n") +
    `\n\n## Source availability and economics\n\n` +
    `- Rich first-party: ${sourceSurface.rich_first_party ?? 0}\n` +
    `- Partial first-party: ${sourceSurface.partial_first_party ?? 0}\n` +
    `- Official secondary only: ${sourceSurface.official_secondary_only ?? 0}\n` +
    `- No useful first-party source: ${sourceSurface.no_useful_source ?? 0}\n` +
    `- Automatable / semi-automated / manual-heavy: ${automation.AUTOMATABLE ?? 0} / ${automation.SEMI_AUTOMATED ?? 0} / ${automation.MANUAL_HEAVY ?? 0}\n` +
    `- Official URL hosts / reviewed evidence hosts: ${officialHosts.size} / ${reviewedHosts.size}\n` +
    `- Human minutes were not timed; no minute estimate is asserted. Review actions are page inspections plus explicit claim decisions.\n\n` +
    `## Equipment\n\n| type | confirmed | review required | observed only | no evidence |\n|---|---:|---:|---:|---:|\n` +
    equipmentRows.map((row) => `| ${row.slug} | ${row.confirmed} | ${row.reviewRequired} | ${row.observedNotCandidate} | ${row.noEvidence} |`).join("\n") +
    `\n\n## Capabilities\n\n| type | confirmed | review required | observed only | no evidence |\n|---|---:|---:|---:|---:|\n` +
    capabilityRows.map((row) => `| ${row.slug} | ${row.confirmed} | ${row.reviewRequired} | ${row.observedNotCandidate} | ${row.noEvidence} |`).join("\n") +
    `\n\n## Publication preview\n\nOnly confirmed positive claims populate arrays. Empty arrays remain unknown/no published positive evidence, never negative claims.\n\n` +
    publication.filter((row) => row.equipmentSlugs.length || row.capabilitySlugs.length).map((row) =>
      `- ${row.locationId}: equipment=${row.equipmentSlugs.join("|") || "[]"}; capabilities=${row.capabilitySlugs.join("|") || "[]"}; open_training=${row.openTrainingAvailable}`).join("\n") +
    `\n\n## Decision\n\n**GO_TARGETED** — expand stable first-party text/branch adapters first; keep social/image/sparse surfaces in human review.\n`;
  await writeFile(markdownPath, markdown);

  console.log(JSON.stringify(metrics, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
