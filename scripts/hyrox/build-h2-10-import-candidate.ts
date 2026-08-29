import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { assertH210Candidate, buildH210Candidate, type H210Candidate, type H210ProductionPreflight,
  type H210ReadyRecord, type H210Revalidation } from "../../src/lib/hyrox-h2-10-candidate";
import { renderH210Baseline, renderH210Rehearsal } from "../../src/lib/hyrox-h2-10-rehearsal-sql";

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

function markdown(candidate: H210Candidate): string {
  const prefectures = [...new Set(candidate.locations.map((record) => record.prefecture))].sort();
  const types = [...new Set(candidate.locations.map((record) => record.location_type))].sort();
  const tokorozawa = candidate.locations.find((record) => record.hgy_external_id === "HGY_8sKmKHEiaR8tARb6zZUUbaYjU");
  return [
    "# HYROX H2-10 — Authority-Resolved New Location Import Candidate", "",
    `Candidate hash: \`${candidate.candidate_hash}\``,
    `Reconciled contract: \`${candidate.authority.reconciled_contract_sha256}\``,
    `Production observed: ${candidate.authority.production_observed_at}`,
    `Source authority observed: ${candidate.authority.source_revalidated_at}`, "",
    "Preview only: this package has no production write path and contains no equipment, capability, program, or class inference.", "",
    "## Import graph", "", "| Object | Count |", "| --- | ---: |",
    `| Existing brands reused | ${candidate.counts.existing_brand_reuse} |`,
    `| New chain brands | ${candidate.counts.new_chain_brands} |`,
    `| New single-location brands | ${candidate.counts.new_single_location_brands} |`,
    `| New gym_brands | ${candidate.counts.gym_brands} |`,
    `| gym_locations | ${candidate.counts.gym_locations} |`,
    `| training_sources | ${candidate.counts.training_sources} |`,
    `| location_external_identifiers | ${candidate.counts.location_external_identifiers} |`,
    `| location_training_disciplines | ${candidate.counts.location_training_disciplines} |`,
    `| training_affiliations | ${candidate.counts.training_affiliations} |`,
    `| training_evidence | ${candidate.counts.training_evidence} |`, "",
    "## Tokorozawa reconciliation", "",
    "- Retired authority: https://www.gym-field.com/studio/所沢/ (HTTP 404)",
    `- Current official locator authority: ${tokorozawa?.official_url ?? "MISSING"}`,
    "- HGY identity, canonical facility identity, address, postal code, and coordinates remain unchanged.", "",
    "## Brand graph", "", "| Name | Slug | Resolution | Members | Authority | Collision |", "| --- | --- | --- | ---: | --- | --- |",
    ...candidate.brand_resolutions.map((brand) => `| ${brand.name} | ${brand.slug} | ${brand.resolution} | ${brand.location_refs.length} | ${brand.official_url} | ${brand.collision_status} |`), "",
    "## Location review", "", "| HGY ID | HYROX / GymMap name | Slug | Brand | Area | Full address | Postal | Type | Facility authority | Governing authority | Coordinates | Confirmed | Stale | Collision |", "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |",
    ...candidate.locations.map((record) => `| ${record.hgy_external_id} | ${record.hyrox_official_name} / ${record.name} | ${record.slug} | ${record.brand_ref.replace("brand:", "")} (${record.brand_resolution}) | ${record.prefecture} ${record.city} | ${record.address_line} | ${record.postal_code} | ${record.location_type} | ${record.official_url} | ${record.source_url} | ${record.latitude}, ${record.longitude} | ${record.location_training_discipline.last_confirmed_at} | ${record.location_training_discipline.stale_at} | ${record.collision_status} |`), "",
    "## Prefecture breakdown", "", "| Prefecture | Count |", "| --- | ---: |",
    ...prefectures.map((prefecture) => `| ${prefecture} | ${candidate.locations.filter((record) => record.prefecture === prefecture).length} |`), "",
    "## Location type breakdown", "", "| Type | Count |", "| --- | ---: |",
    ...types.map((type) => `| ${type} | ${candidate.locations.filter((record) => record.location_type === type).length} |`), "",
    "## Idempotency and conflict contract", "",
    ...Object.entries(candidate.import_policy).map(([key, value]) => `- ${key}: ${value}`), "",
    "## Static publication", "",
    "All 58 locations are active and are route/sitemap eligible after a fresh deployment. H2-10 does not deploy.", "",
  ].join("\n");
}

async function main(): Promise<void> {
  const dataDir = path.resolve(cliValue("data-dir", "data/hyrox"));
  const [ready, resolution, preflight, revalidation] = await Promise.all([
    readJson<{ schema_version: number; preview_only: boolean; records: H210ReadyRecord[] }>(path.join(dataDir, "h2-9-new-location-ready.json")),
    readJson<{ deterministic_contract_sha256: string; summary: Record<string, number>; records: Array<{ final_classification: string; hgy_external_id: string; hyrox_official_name: string }> }>(path.join(dataDir, "h2-9-location-authority-gap-resolution.json")),
    readJson<H210ProductionPreflight>(path.join(dataDir, "h2-10-production-preflight.json")),
    readJson<H210Revalidation>(path.join(dataDir, "h2-10r-ready-set-revalidation.json")),
  ]);
  const candidate = buildH210Candidate({ ready, resolution, preflight, revalidation });
  assertH210Candidate(candidate);
  const headers = ["hgy_external_id", "hyrox_official_name", "name", "slug", "brand_ref", "brand_resolution", "postal_code",
    "prefecture", "city", "address_line", "latitude", "longitude", "official_url", "source_url", "location_type",
    "last_verified_at", "stale_at", "collision_status", "candidate_hash"] as const;
  const csvText = [headers.map(csv).join(","), ...candidate.locations.map((record) => headers.map((header) => csv(
    header === "stale_at" ? record.location_training_discipline.stale_at : record[header])).join(","))].join("\n") + "\n";
  await mkdir(dataDir, { recursive: true });
  await Promise.all([
    writeFile(path.join(dataDir, "h2-10-reviewed-new-location-import-candidate.json"), `${JSON.stringify(candidate, null, 2)}\n`),
    writeFile(path.join(dataDir, "h2-10-reviewed-new-location-import-candidate.md"), markdown(candidate)),
    writeFile(path.join(dataDir, "h2-10-reviewed-new-location-import-candidate.csv"), csvText),
    writeFile(path.join(dataDir, "h2-10-reviewed-new-location-import-candidate.baseline.sql"), renderH210Baseline(preflight)),
    writeFile(path.join(dataDir, "h2-10-reviewed-new-location-import-candidate.rehearsal.sql"), renderH210Rehearsal(candidate)),
  ]);
  console.log(JSON.stringify({ candidate_hash: candidate.candidate_hash, brands: candidate.counts.gym_brands,
    locations: candidate.counts.gym_locations, evidence: candidate.counts.training_evidence }));
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
