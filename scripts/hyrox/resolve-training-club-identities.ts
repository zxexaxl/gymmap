import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  duplicateValues,
  normalizeName,
  resolveAllClubIdentities,
  type GymMapLocationRecord,
  type OfficialClubRecord,
  type ResolutionRecord,
  type ResolutionStatus,
} from "../../src/lib/hyrox-official-clubs";

type DiscoveryArtifact = {
  observed_at: string;
  records: OfficialClubRecord[];
  coverage_duplicate_observation_count?: number;
  conflicting_external_id_records?: string[];
};
type InventoryArtifact = { observed_at: string; records: GymMapLocationRecord[] };

function cliValue(name: string, fallback: string): string {
  const prefix = `--${name}=`;
  return process.argv.find((value) => value.startsWith(prefix))?.slice(prefix.length) ?? fallback;
}

function csvCell(value: unknown): string {
  const text = Array.isArray(value) ? value.join("; ") : value === null || value === undefined ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

function addDays(iso: string, days: number): string {
  const date = new Date(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
}

function statusCounts(records: ResolutionRecord[]): Record<ResolutionStatus, number> {
  return {
    CONFIRMED_MATCH: records.filter((record) => record.resolution_status === "CONFIRMED_MATCH").length,
    PROBABLE_MATCH: records.filter((record) => record.resolution_status === "PROBABLE_MATCH").length,
    AMBIGUOUS: records.filter((record) => record.resolution_status === "AMBIGUOUS").length,
    UNMATCHED: records.filter((record) => record.resolution_status === "UNMATCHED").length,
    SOURCE_INCOMPLETE: records.filter((record) => record.resolution_status === "SOURCE_INCOMPLETE").length,
  };
}

async function main(): Promise<void> {
  const discoveryPath = path.resolve(cliValue("discovery", "data/hyrox/official-training-clubs-japan.json"));
  const inventoryPath = path.resolve(cliValue("inventory", "data/hyrox/gymmap-location-inventory.json"));
  const outputDir = path.resolve(cliValue("output-dir", "data/hyrox"));
  const discovery = JSON.parse(await readFile(discoveryPath, "utf8")) as DiscoveryArtifact;
  const inventory = JSON.parse(await readFile(inventoryPath, "utf8")) as InventoryArtifact;
  const records = resolveAllClubIdentities(discovery.records, inventory.records);
  const counts = statusCounts(records);
  const duplicateExternalIds = duplicateValues(discovery.records.map((record) => record.external_id));
  const duplicateDetailUrls = duplicateValues(discovery.records.map((record) => record.official_source_url));
  const duplicateAddresses = duplicateValues(discovery.records.map((record) => record.address));
  const duplicateNames = duplicateValues(discovery.records.map((record) => normalizeName(record.official_name)));
  const duplicateCoordinates = duplicateValues(discovery.records.map((record) =>
    record.latitude !== null && record.longitude !== null
      ? `${record.latitude.toFixed(6)},${record.longitude.toFixed(6)}`
      : null,
  ));
  const duplicateSourceRecords = duplicateValues(discovery.records.map((record) =>
    `${normalizeName(record.official_name)}|${record.address ?? ""}`,
  ));
  const multiplyMatchedLocationIds = duplicateValues(
    records
      .filter((record) => record.gymmap_location_id)
      .map((record) => record.gymmap_location_id),
  );
  const prefectureCounts = new Map<string, number>();
  for (const record of discovery.records) {
    const key = record.prefecture ?? "SOURCE_NOT_PROVIDED";
    prefectureCounts.set(key, (prefectureCounts.get(key) ?? 0) + 1);
  }

  const resolutionArtifact = {
    schema_version: 1,
    generated_from: { discovery: path.basename(discoveryPath), inventory: path.basename(inventoryPath) },
    observed_at: discovery.observed_at,
    source_record_count: discovery.records.length,
    gymmap_location_count: inventory.records.length,
    status_counts: counts,
    prefecture_counts: Object.fromEntries([...prefectureCounts.entries()].sort()),
    duplicate_audit: {
      external_ids: duplicateExternalIds,
      official_detail_urls: duplicateDetailUrls,
      exact_source_addresses: duplicateAddresses,
      normalized_official_names: duplicateNames,
      exact_coordinates: duplicateCoordinates,
      normalized_name_and_address_records: duplicateSourceRecords,
      gymmap_locations_matched_multiple_times: multiplyMatchedLocationIds,
      coverage_duplicate_observation_count: discovery.coverage_duplicate_observation_count ?? null,
      conflicting_external_id_records: discovery.conflicting_external_id_records ?? [],
    },
    matching_policy: {
      coordinate_thresholds_meters: { strong: 50, supporting: 200, weak_support: 500, candidate: 1000, conflict: 5000 },
      confirmed_rules: [
        "unique exact facility official URL",
        "exact normalized name plus exact normalized address or postal code",
        "exact normalized name plus <=200m and matching area/postal signal",
        "name similarity >=0.85 plus exact postal code and <=500m",
      ],
      score_alone_never_confirms: true,
    },
    records,
  };

  const confirmed = records.filter((record) => record.resolution_status === "CONFIRMED_MATCH");
  const sourcePreview = confirmed.map((record) => ({
    source_ref: `hyrox-finder:${record.official_external_id}`,
    location_id: record.gymmap_location_id,
    url: record.official_source_url,
    canonical_url: record.official_source_url,
    source_kind: "finder",
    publisher_authority: "governing_body",
    availability_state: "available",
    review_required: false,
    last_checked_at: discovery.observed_at,
    metadata_json: {
      namespace: "hyrox-training-club",
      external_identifier: record.official_external_id,
      facility_url: record.facility_url,
    },
  }));
  const preview = {
    schema_version: 1,
    preview_only: true,
    no_database_writes: true,
    observed_at: discovery.observed_at,
    semantics: {
      affiliation: "An active listing in the HYROX governing-body Training Finder supports Official Training Club affiliation.",
      discipline: "Official Training Club affiliation supports HYROX discipline availability, but does not imply equipment, open training, coaching, or classes.",
    },
    training_sources: sourcePreview,
    location_external_identifiers: confirmed.map((record) => ({
      location_id: record.gymmap_location_id,
      namespace: "hyrox-training-club",
      external_identifier: record.official_external_id,
      training_source_ref: `hyrox-finder:${record.official_external_id}`,
      verification_status: "confirmed",
      verified_at: discovery.observed_at,
    })),
    training_affiliations: confirmed.map((record) => ({
      location_id: record.gymmap_location_id,
      discipline_slug: "hyrox",
      affiliation_type: "training_club",
      awarding_organization: "HYROX",
      external_identifier: record.official_external_id,
      affiliation_state: "active",
      verification_status: "confirmed",
      last_confirmed_at: discovery.observed_at,
      stale_at: addDays(discovery.observed_at, 90),
    })),
    location_training_disciplines: confirmed.map((record) => ({
      location_id: record.gymmap_location_id,
      discipline_slug: "hyrox",
      support_state: "available",
      verification_status: "confirmed",
      last_confirmed_at: discovery.observed_at,
      stale_at: addDays(discovery.observed_at, 90),
    })),
    training_evidence: confirmed.flatMap((record) => ([
      {
        training_source_ref: `hyrox-finder:${record.official_external_id}`,
        target_type: "training_affiliation",
        target_ref: `${record.gymmap_location_id}:hyrox:training_club:HYROX`,
        assertion: "supports",
        review_status: "accepted",
        observed_at: discovery.observed_at,
        reviewed_at: discovery.observed_at,
      },
      {
        training_source_ref: `hyrox-finder:${record.official_external_id}`,
        target_type: "location_training_discipline",
        target_ref: `${record.gymmap_location_id}:hyrox`,
        assertion: "supports",
        review_status: "accepted",
        observed_at: discovery.observed_at,
        reviewed_at: discovery.observed_at,
      },
    ])),
  };

  const csvHeaders = [
    "official_name", "official_external_id", "official_address", "official_source_url",
    "gymmap_location_id", "gymmap_slug", "gymmap_name", "resolution_status", "match_method",
    "score", "coordinate_distance_meters", "reasons", "conflicts", "manual_review_required",
  ];
  const csv = [csvHeaders.map(csvCell).join(","), ...records.map((record) => csvHeaders.map((header) =>
    csvCell(record[header as keyof ResolutionRecord])).join(","))].join("\n") + "\n";
  const summary = [
    "# HYROX Official Training Club — Japan identity resolution",
    "",
    `Observed at: ${discovery.observed_at}`,
    `Official source records: ${discovery.records.length}`,
    `GymMap locations inspected: ${inventory.records.length}`,
    "",
    "## Resolution status",
    "",
    ...Object.entries(counts).map(([status, count]) => `- ${status}: ${count}`),
    "",
    "## Duplicate/conflict audit",
    "",
    `- Duplicate external IDs: ${duplicateExternalIds.length}`,
    `- Duplicate official detail URLs: ${duplicateDetailUrls.length}`,
    `- Duplicate exact source addresses: ${duplicateAddresses.length}`,
    `- Duplicate normalized official names: ${duplicateNames.length}`,
    `- Duplicate exact coordinates: ${duplicateCoordinates.length}`,
    `- Duplicate normalized name/address records: ${duplicateSourceRecords.length}`,
    `- GymMap locations matched multiple times: ${multiplyMatchedLocationIds.length}`,
    `- Conflicting repeated external-ID observations: ${discovery.conflicting_external_id_records?.length ?? 0}`,
    "",
    "## Prefecture breakdown",
    "",
    ...[...prefectureCounts.entries()].sort().map(([prefecture, count]) => `- ${prefecture}: ${count}`),
    "",
    "## Manual review queue",
    "",
    ...records.filter((record) => record.manual_review_required).map((record) =>
      `- ${record.resolution_status}: ${record.official_name} (${record.official_external_id ?? "missing ID"})` +
      `${record.gymmap_name ? ` → ${record.gymmap_name}` : ""}`),
    "",
    "No equipment, capability, class schedule, production database, UI, or SEO changes are included.",
    "",
  ].join("\n");

  await mkdir(outputDir, { recursive: true });
  await Promise.all([
    writeFile(path.join(outputDir, "official-training-club-resolution.json"), `${JSON.stringify(resolutionArtifact, null, 2)}\n`, "utf8"),
    writeFile(path.join(outputDir, "official-training-club-resolution.csv"), csv, "utf8"),
    writeFile(path.join(outputDir, "official-training-club-resolution.md"), summary, "utf8"),
    writeFile(path.join(outputDir, "h2-2-import-preview.json"), `${JSON.stringify(preview, null, 2)}\n`, "utf8"),
  ]);
  console.log(`Resolved ${records.length} records: ${JSON.stringify(counts)}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
