import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  assertH25Candidate,
  buildH25Candidate,
  type H25Candidate,
  type H25ProductionPreflight,
  type H25SourceRevalidation,
} from "../../src/lib/hyrox-new-location-import-candidate";
import type { H24ReviewRecord } from "../../src/lib/hyrox-unmatched-review";
import type { ReviewedImportCandidate } from "../../src/lib/hyrox-import-candidate";
import { renderH25RollbackRehearsal } from "../../src/lib/hyrox-new-location-import-sql";

function cliValue(name: string, fallback: string): string {
  const prefix = `--${name}=`;
  return process.argv.find((value) => value.startsWith(prefix))?.slice(prefix.length) ?? fallback;
}

async function readJson<T>(file: string): Promise<T> {
  return JSON.parse(await readFile(file, "utf8")) as T;
}

function csv(value: unknown): string {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

function markdown(candidate: H25Candidate): string {
  const prefectures = [...new Set(candidate.locations.map((record) => record.prefecture))].sort();
  const types = [...new Set(candidate.locations.map((record) => record.location_type))].sort();
  return [
    "# HYROX H2-5 — Reviewed New Location Import Candidate", "",
    `Candidate hash: \`${candidate.candidate_hash}\``,
    `Production observed at: ${candidate.authority.production_observed_at}`,
    `Sources revalidated at: ${candidate.authority.source_revalidated_at}`, "",
    "This package is preview-only. It has no production write path and contains no equipment, capability, program, or class inference.", "",
    "## Import graph", "", "| Table | Candidate count |", "| --- | ---: |",
    `| gym_brands | ${candidate.counts.gym_brands} |`,
    `| gym_locations | ${candidate.counts.gym_locations} |`,
    `| training_sources | ${candidate.counts.training_sources} |`,
    `| location_external_identifiers | ${candidate.counts.location_external_identifiers} |`,
    `| location_training_disciplines | ${candidate.counts.location_training_disciplines} |`,
    `| training_affiliations | ${candidate.counts.training_affiliations} |`,
    `| training_evidence | ${candidate.counts.training_evidence} |`, "",
    "## Brand candidates", "", "| Name | Slug | Semantic | Locations | Official authority | Collision |", "| --- | --- | --- | ---: | --- | --- |",
    ...candidate.brands.map((brand) => `| ${brand.name} | ${brand.slug} | ${brand.semantic} | ${brand.location_refs.length} | ${brand.official_url} | ${brand.collision_status} |`), "",
    "## Location candidates", "", "| HGY ID | HYROX / canonical name | Slug | Brand | Area | Address | Type | Official URL | Confirmed | Stale | Hash |", "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |",
    ...candidate.locations.map((record) => `| ${record.hgy_external_id} | ${record.hyrox_official_name} / ${record.name} | ${record.slug} | ${record.brand_ref.replace("brand:", "")} | ${record.prefecture} ${record.city} | ${record.address_line} | ${record.location_type} | ${record.official_url} | ${record.last_verified_at} | ${record.location_training_discipline.stale_at} | ${record.candidate_hash} |`), "",
    "## Prefecture breakdown", "", "| Prefecture | Count |", "| --- | ---: |",
    ...prefectures.map((prefecture) => `| ${prefecture} | ${candidate.locations.filter((record) => record.prefecture === prefecture).length} |`), "",
    "## Location type breakdown", "", "| Type | Count |", "| --- | ---: |",
    ...types.map((type) => `| ${type} | ${candidate.locations.filter((record) => record.location_type === type).length} |`), "",
    "## Frozen idempotency and conflict policy", "",
    ...Object.entries(candidate.import_policy).map(([key, value]) => `- ${key}: ${value}`), "",
    "## Existing GymMap publication impact", "",
    ...Object.entries(candidate.publication_impact).map(([key, value]) => `- ${key}: ${value}`), "",
    "The production import is deferred to H2-6 and must use one atomic transaction.", "",
  ].join("\n");
}

async function main(): Promise<void> {
  const dataDir = path.resolve(cliValue("data-dir", "data/hyrox"));
  const [review, ready, preflight, revalidation, h23] = await Promise.all([
    readJson<{ records: H24ReviewRecord[] }>(path.join(dataDir, "h2-4-unmatched-location-review.json")),
    readJson<{ count: number; records: H24ReviewRecord[] }>(path.join(dataDir, "h2-4-new-location-candidates.json")),
    readJson<H25ProductionPreflight>(path.join(dataDir, "h2-5-production-preflight.json")),
    readJson<H25SourceRevalidation>(path.join(dataDir, "h2-5-source-revalidation.json")),
    readJson<ReviewedImportCandidate>(path.join(dataDir, "h2-2-reviewed-import-candidate.json")),
  ]);
  const candidate = buildH25Candidate({ review, ready, preflight, revalidation, h23ExternalIds: h23.records.map((record) => record.official_external_id) });
  assertH25Candidate(candidate);
  const headers = ["hgy_external_id", "hyrox_official_name", "name", "slug", "brand_ref", "postal_code", "prefecture", "city", "address_line", "latitude", "longitude", "official_url", "source_url", "location_type", "last_verified_at", "stale_at", "candidate_hash"] as const;
  const csvText = [headers.map(csv).join(","), ...candidate.locations.map((record) => headers.map((header) => csv(header === "stale_at" ? record.location_training_discipline.stale_at : record[header])).join(","))].join("\n") + "\n";
  await mkdir(dataDir, { recursive: true });
  await Promise.all([
    writeFile(path.join(dataDir, "h2-5-reviewed-new-location-import-candidate.json"), `${JSON.stringify(candidate, null, 2)}\n`),
    writeFile(path.join(dataDir, "h2-5-reviewed-new-location-import-candidate.md"), markdown(candidate)),
    writeFile(path.join(dataDir, "h2-5-reviewed-new-location-import-candidate.csv"), csvText),
    writeFile(path.join(dataDir, "h2-5-reviewed-new-location-import-candidate.rehearsal.sql"), renderH25RollbackRehearsal(candidate, preflight, h23)),
  ]);
  console.log(JSON.stringify({ candidate_hash: candidate.candidate_hash, brands: candidate.counts.gym_brands, locations: candidate.counts.gym_locations, evidence: candidate.counts.training_evidence }));
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
