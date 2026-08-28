import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  assertCompleteH2Candidate,
  buildReviewedImportCandidate,
  type DiscoveryArtifact,
  type LocationInventoryArtifact,
  type ResolutionArtifact,
  type ReviewedImportCandidate,
} from "../../src/lib/hyrox-import-candidate";
import { renderRollbackOnlyImportRehearsal } from "../../src/lib/hyrox-import-sql";

function cliValue(name: string, fallback: string): string {
  const prefix = `--${name}=`;
  return process.argv.find((value) => value.startsWith(prefix))?.slice(prefix.length) ?? fallback;
}

function renderMarkdown(candidate: ReviewedImportCandidate): string {
  const lines = [
    "# HYROX H2-2 — Reviewed Official Training Club Import Candidate",
    "",
    `Observed/reviewed at: ${candidate.observed_at}`,
    "",
    "This package is a deterministic preview. It has no production write path and creates no locations, equipment, capabilities, programs, or schedules.",
    "",
    "## Validation",
    "",
    `- Confirmed H2-1 input: ${candidate.validation.confirmed_input_count}`,
    `- Included after revalidation: ${candidate.validation.included_count}`,
    `- Excluded: ${candidate.validation.excluded.length}`,
    `- Duplicate external IDs: ${candidate.validation.duplicate_external_ids.length}`,
    `- Duplicate target locations: ${candidate.validation.duplicate_location_ids.length}`,
    "",
    "## Import graph",
    "",
    "| Table | Candidate count |",
    "| --- | ---: |",
    `| training_sources | ${candidate.counts.training_sources} |`,
    `| location_external_identifiers | ${candidate.counts.location_external_identifiers} |`,
    `| location_training_disciplines | ${candidate.counts.location_training_disciplines} |`,
    `| training_affiliations | ${candidate.counts.training_affiliations} |`,
    `| training_evidence | ${candidate.counts.training_evidence} |`,
    "",
    "## Reviewed facilities",
    "",
    "| Official HYROX name | HGY external ID | GymMap location | GymMap ID | Source | Observed at | Stale at | Evidence | Conflict |",
    "| --- | --- | --- | --- | --- | --- | --- | ---: | --- |",
    ...candidate.records.map((record) =>
      `| ${record.official_name} | ${record.official_external_id} | ${record.matched_location.name} (${record.matched_location.slug}) | ${record.matched_location.id} | [finder](${record.official_source_url}) | ${record.observed_at} | ${record.stale_at} | ${record.evidence.length} | ${record.conflict_status} |`),
    "",
    "## Frozen import policy",
    "",
    `- Serialization: ${candidate.import_policy.serialization}`,
    `- Source reuse: ${candidate.import_policy.source_reuse}`,
    `- Freshness: ${candidate.import_policy.freshness}`,
    `- Identity conflict: ${candidate.import_policy.identity_conflict}`,
    `- Affiliation conflict: ${candidate.import_policy.affiliation_conflict}`,
    `- Evidence dedupe: ${candidate.import_policy.evidence_dedupe}`,
    "",
    "The SQL companion is rollback-only and exists solely for local import rehearsal. Production import is deferred to H2-3.",
    "",
  ];
  return lines.join("\n");
}

async function readJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await readFile(filePath, "utf8")) as T;
}

async function main(): Promise<void> {
  const dataDir = path.resolve(cliValue("data-dir", "data/hyrox"));
  const resolution = await readJson<ResolutionArtifact>(
    path.join(dataDir, "official-training-club-resolution.json"),
  );
  const discovery = await readJson<DiscoveryArtifact>(
    path.join(dataDir, "official-training-clubs-japan.json"),
  );
  const inventory = await readJson<LocationInventoryArtifact>(
    path.join(dataDir, "gymmap-location-inventory.json"),
  );
  const candidate = buildReviewedImportCandidate(resolution, discovery, inventory);
  assertCompleteH2Candidate(candidate);

  await mkdir(dataDir, { recursive: true });
  await Promise.all([
    writeFile(
      path.join(dataDir, "h2-2-reviewed-import-candidate.json"),
      `${JSON.stringify(candidate, null, 2)}\n`,
      "utf8",
    ),
    writeFile(
      path.join(dataDir, "h2-2-reviewed-import-candidate.md"),
      renderMarkdown(candidate),
      "utf8",
    ),
    writeFile(
      path.join(dataDir, "h2-2-reviewed-import-candidate.rehearsal.sql"),
      renderRollbackOnlyImportRehearsal(candidate),
      "utf8",
    ),
  ]);
  console.log(`Built H2-2 reviewed candidate: ${candidate.records.length} facilities, ${candidate.counts.training_evidence} evidence records`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
