import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  buildJapanPostIndex,
  duplicateValues,
  normalizedAddressKey,
  normalizedUrlKey,
  parseJapanPostCsv,
  resolveAuthorityRecord,
  type GoverningBodyObservation,
  type H29Classification,
  type H29Override,
  type H29ResolutionRecord,
  type H29WebsiteObservation,
  type OriginalAuthorityBlocker,
} from "../../src/lib/hyrox-location-authority-resolution";
import type { OfficialClubRecord } from "../../src/lib/hyrox-official-clubs";
import type { GymBrandRecord, H24LocationRecord, H24ReviewRecord } from "../../src/lib/hyrox-unmatched-review";

type H24Artifact = { records: H24ReviewRecord[] };
type DiscoveryArtifact = { records: OfficialClubRecord[] };
type InventoryArtifact = { observed_at: string; locations: H24LocationRecord[]; brands: GymBrandRecord[] };
type TrainingInventory = {
  observed_at: string;
  external_identifiers: Array<{ location_id: string; namespace: string; external_identifier: string }>;
  published_locations: Array<{ location_id: string; discipline_slug: string }>;
};
type ObservationArtifact = {
  observed_at: string;
  governing_body_endpoint: string;
  request_policy: unknown;
  governing_body_records: GoverningBodyObservation[];
  website_observations: H29WebsiteObservation[];
};
type OverrideArtifact = { records: H29Override[] };

const EXPECTED_BLOCKERS: Record<OriginalAuthorityBlocker, number> = {
  MISSING_OFFICIAL_URL: 70,
  POSTAL_AUTHORITY_GAP: 41,
  SOCIAL_BOOKING_HOSTED_ONLY: 15,
  IDENTITY_ADDRESS_INSUFFICIENT: 14,
  OFFICIAL_SITE_UNREACHABLE: 4,
};

function cliValue(name: string, fallback: string): string {
  const prefix = `--${name}=`;
  return process.argv.find((value) => value.startsWith(prefix))?.slice(prefix.length) ?? fallback;
}

function stableHash(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function addDays(iso: string, days: number): string {
  const date = new Date(iso); date.setUTCDate(date.getUTCDate() + days); return date.toISOString();
}

function counts<T extends string>(values: T[], keys: readonly T[]): Record<T, number> {
  return Object.fromEntries(keys.map((key) => [key, values.filter((value) => value === key).length])) as Record<T, number>;
}

function csvCell(value: unknown): string {
  const text = Array.isArray(value) ? value.join("; ") : value === null || value === undefined ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

function coordinateKey(record: H29ResolutionRecord): string | null {
  return record.latitude !== null && record.longitude !== null
    ? `${record.latitude.toFixed(5)},${record.longitude.toFixed(5)}` : null;
}

function stableResolutionRecord(record: H29ResolutionRecord): Partial<H29ResolutionRecord> {
  const stable = structuredClone(record) as Partial<H29ResolutionRecord>;
  delete stable.reviewed_at;
  delete stable.observed_at;
  if (stable.facility_observation) delete (stable.facility_observation as Partial<H29WebsiteObservation>).fetched_at;
  return stable;
}

function applyDuplicateConflicts(records: H29ResolutionRecord[]): void {
  const duplicateUrls = new Set(duplicateValues(records.map((record) => normalizedUrlKey(record.facility_authority_url))));
  const duplicateAddresses = new Set(duplicateValues(records.map((record) => normalizedAddressKey(record.canonical_address))));
  const duplicateSlugs = new Set(duplicateValues(records.map((record) => record.proposed_slug)));
  const duplicateCoordinates = new Set(duplicateValues(records.map(coordinateKey)));
  const duplicateMatched = new Set(duplicateValues(records.map((record) => record.matched_location_id)));
  for (const record of records) {
    const conflicts = [
      duplicateUrls.has(normalizedUrlKey(record.facility_authority_url) ?? "") ? "duplicate canonical facility URL" : null,
      duplicateAddresses.has(normalizedAddressKey(record.canonical_address) ?? "") ? "duplicate normalized address" : null,
      duplicateSlugs.has(record.proposed_slug ?? "") ? "duplicate proposed slug" : null,
      duplicateCoordinates.has(coordinateKey(record) ?? "") ? "duplicate rounded coordinates" : null,
      duplicateMatched.has(record.matched_location_id ?? "") ? "multiple HGY records resolve to one GymMap location" : null,
    ].filter((value): value is string => Boolean(value));
    if (conflicts.length > 0 && ["NEW_LOCATION_READY", "EXISTING_LOCATION_CONFIRMED_MATCH"].includes(record.final_classification)) {
      record.final_classification = "SOURCE_CONFLICT";
      record.resolution_reason = "Duplicate/conflict audit found a material identity collision";
      record.unresolved_gaps = [...new Set([...record.unresolved_gaps, ...conflicts])].sort();
      record.proposed_slug = null;
      record.proposed_location_type = null;
      record.matched_location_id = null;
      record.matched_location_slug = null;
      record.matched_location_name = null;
    }
  }
}

async function readJson<T>(file: string): Promise<T> {
  return JSON.parse(await readFile(path.resolve(file), "utf8")) as T;
}

async function main(): Promise<void> {
  const reviewPath = cliValue("review", "data/hyrox/h2-4-unmatched-location-review.json");
  const discoveryPath = cliValue("discovery", "data/hyrox/official-training-clubs-japan.json");
  const inventoryPath = cliValue("inventory", "data/hyrox/h2-9-gymmap-inventory.json");
  const trainingPath = cliValue("training-inventory", "data/hyrox/h2-9-training-inventory.json");
  const observationPath = cliValue("observations", "data/hyrox/h2-9-live-authority-observations.json");
  const overridePath = cliValue("overrides", "data/hyrox/h2-9-authority-resolution-overrides.json");
  const postalPath = cliValue("japan-post-csv", "/private/tmp/gymmap-h2-9-ken-all/utf_ken_all.csv");
  const outputDir = path.resolve(cliValue("output-dir", "data/hyrox"));
  const reviewedAt = cliValue("reviewed-at", "2026-08-29T15:50:00.000Z");
  const [review, discovery, inventory, training, observations, overrides, postalCsv] = await Promise.all([
    readJson<H24Artifact>(reviewPath), readJson<DiscoveryArtifact>(discoveryPath), readJson<InventoryArtifact>(inventoryPath),
    readJson<TrainingInventory>(trainingPath), readJson<ObservationArtifact>(observationPath), readJson<OverrideArtifact>(overridePath),
    readFile(path.resolve(postalPath), "utf8"),
  ]);
  const input = review.records.filter((record) => record.final_classification === "NEW_LOCATION_NEEDS_REVIEW")
    .sort((left, right) => left.hgy_external_id.localeCompare(right.hgy_external_id));
  if (input.length !== 144) throw new Error(`H2-9 requires exactly 144 records, found ${input.length}`);
  if (new Set(input.map((record) => record.hgy_external_id)).size !== 144) throw new Error("Duplicate HGY ID in H2-9 input");
  const importedIds = new Set(training.external_identifiers.filter((row) => row.namespace === "hyrox-training-club").map((row) => row.external_identifier));
  const overlap = input.filter((record) => importedIds.has(record.hgy_external_id));
  if (overlap.length) throw new Error(`H2-9 input overlaps imported HGY identities: ${overlap.map((row) => row.hgy_external_id).join(",")}`);

  const sourceById = new Map(discovery.records.map((record) => [record.external_id, record]));
  const governingById = new Map(observations.governing_body_records.map((record) => [record.external_id, record]));
  const websiteById = new Map(observations.website_observations.map((record) => [record.external_id, record]));
  const overrideById = new Map(overrides.records.map((record) => [record.hgy_external_id, record]));
  const postalIndex = buildJapanPostIndex(parseJapanPostCsv(postalCsv));
  const publishedLocationIds = new Set(training.published_locations.filter((row) => row.discipline_slug === "hyrox").map((row) => row.location_id));
  const reservedSlugs = new Set(inventory.locations.map((location) => location.slug));
  const records = input.map((record) => {
    const source = sourceById.get(record.hgy_external_id);
    const governing = governingById.get(record.hgy_external_id);
    if (!source || !governing) throw new Error(`Missing authority source for ${record.hgy_external_id}`);
    return resolveAuthorityRecord({ record, source, governing, website: websiteById.get(record.hgy_external_id) ?? null,
      postalIndex, locations: inventory.locations, brands: inventory.brands, publishedLocationIds, reservedSlugs,
      reviewedAt, override: overrideById.get(record.hgy_external_id) });
  });
  applyDuplicateConflicts(records);

  const classifications: H29Classification[] = ["NEW_LOCATION_READY", "EXISTING_LOCATION_CONFIRMED_MATCH", "REMAINS_NEEDS_REVIEW", "NON_STANDARD_LOCATION", "SOURCE_CONFLICT"];
  const blockerKeys = Object.keys(EXPECTED_BLOCKERS) as OriginalAuthorityBlocker[];
  const blockerCounts = counts(records.map((record) => record.original_blocker), blockerKeys);
  for (const blocker of blockerKeys) if (blockerCounts[blocker] !== EXPECTED_BLOCKERS[blocker]) {
    throw new Error(`Blocker count drift for ${blocker}: ${blockerCounts[blocker]} != ${EXPECTED_BLOCKERS[blocker]}`);
  }
  const duplicateAudit = {
    hgy_external_ids: duplicateValues(records.map((record) => record.hgy_external_id)),
    canonical_facility_urls: duplicateValues(records.map((record) => normalizedUrlKey(record.facility_authority_url))),
    normalized_addresses: duplicateValues(records.map((record) => normalizedAddressKey(record.canonical_address))),
    proposed_slugs: duplicateValues(records.map((record) => record.proposed_slug)),
    rounded_coordinates: duplicateValues(records.map(coordinateKey)),
    matched_location_ids: duplicateValues(records.map((record) => record.matched_location_id)),
  };
  const blockerOutcomes = Object.fromEntries(blockerKeys.map((blocker) => {
    const subset = records.filter((record) => record.original_blocker === blocker);
    return [blocker, { total: subset.length, ...counts(subset.map((record) => record.final_classification), classifications) }];
  }));
  const postalGapRecords = records.filter((record) => record.original_blocker === "POSTAL_AUTHORITY_GAP");
  const missingUrlRecords = records.filter((record) => record.original_blocker === "MISSING_OFFICIAL_URL");
  const overrideIds = new Set(overrides.records.map((record) => record.hgy_external_id));
  const postalGapMetrics = {
    total: postalGapRecords.length,
    official_postal_matches: postalGapRecords.filter((record) => record.postal_authority.status === "POSTAL_AUTHORITY_CONFIRMED").length,
    unresolved: postalGapRecords.filter((record) => record.postal_authority.status === "POSTAL_AUTHORITY_UNRESOLVED").length,
    address_mismatch: postalGapRecords.filter((record) => record.postal_authority.address_mismatch).length,
    multiple_raw_postal_rows: postalGapRecords.filter((record) => record.postal_authority.candidate_count > 1).length,
    multiple_administrative_candidates: postalGapRecords.filter((record) => record.postal_authority.administrative_candidate_count > 1).length,
  };
  const missingUrlMetrics = {
    total: missingUrlRecords.length,
    facility_official_site_found: missingUrlRecords.filter((record) => overrideIds.has(record.hgy_external_id) && record.facility_authority_kind === "facility_site").length,
    official_brand_locator_found: missingUrlRecords.filter((record) => overrideIds.has(record.hgy_external_id) && record.facility_authority_kind === "brand_locator").length,
    strong_official_hosted_or_social_found: missingUrlRecords.filter((record) => overrideIds.has(record.hgy_external_id) && ["social", "booking", "hosted_landing"].includes(record.facility_authority_kind ?? "")).length,
    no_reliable_first_party_url_found: missingUrlRecords.filter((record) => !overrideIds.has(record.hgy_external_id)).length,
  };
  const stableContract = records.map(stableResolutionRecord);
  const artifact = {
    schema_version: 1, phase: "H2-9", input_count: records.length,
    generated_from: { review: path.basename(reviewPath), discovery: path.basename(discoveryPath), inventory: path.basename(inventoryPath),
      training_inventory: path.basename(trainingPath), observations: path.basename(observationPath), overrides: path.basename(overridePath),
      japan_post_authority_url: "https://www.post.japanpost.jp/service/search/zipcode/download/utf-zip.html" },
    reviewed_at: reviewedAt, inventory_observed_at: inventory.observed_at, production_training_observed_at: training.observed_at,
    deterministic_contract_sha256: stableHash(stableContract),
    classification_counts: counts(records.map((record) => record.final_classification), classifications),
    original_blocker_counts: blockerCounts, blocker_outcomes: blockerOutcomes,
    postal_gap_metrics: postalGapMetrics, missing_url_discovery_metrics: missingUrlMetrics,
    postal_authority_counts: counts(records.map((record) => record.postal_authority.status), ["POSTAL_AUTHORITY_CONFIRMED", "POSTAL_AUTHORITY_UNRESOLVED", "POSTAL_AUTHORITY_CONFLICT"] as const),
    facility_authority_counts: counts(records.map((record) => record.facility_authority_strength), ["FIRST_PARTY_STRONG", "OFFICIAL_SECONDARY_STRONG", "INSUFFICIENT", "UNAVAILABLE", "MISSING"] as const),
    duplicate_audit: duplicateAudit,
    policy: { fail_closed: true, search_snippets_can_confirm: false, coordinates_alone_can_confirm: false,
      new_location_ready_requires: ["revalidated governing-body HGY identity", "strong facility-controlled identity/address authority", "confirmed Japan Post prefecture/city", "full address", "valid Japan coordinates", "resolved brand semantics", "collision-free semantic slug"],
      excluded_from_scope: ["SOURCE_INCOMPLETE (21)", "H2-4 original NON_STANDARD_LOCATION (1)", "H2-4 NEW_LOCATION_READY (17)", "H2-4 existing correction (1)", "24 already-imported HGY identities"] },
    records,
  };

  const ready = records.filter((record) => record.final_classification === "NEW_LOCATION_READY").map((record) => ({
    hgy_external_id: record.hgy_external_id, canonical_name: record.canonical_name, slug: record.proposed_slug,
    brand_id: record.proposed_brand_id, proposed_brand: record.proposed_brand_id ? null : { name: record.proposed_brand_name, slug: record.proposed_brand_slug },
    location_type: record.proposed_location_type, address: record.canonical_address, postal_code: record.postal_code,
    prefecture: record.prefecture, city: record.city, latitude: record.latitude, longitude: record.longitude,
    official_url: record.facility_authority_url, source_url: record.governing_body_url, is_active: true,
    import_preview: { external_identifier: record.hgy_external_id, affiliation_type: "training_club", awarding_organization: "HYROX",
      verification_status: "confirmed", last_confirmed_at: reviewedAt, stale_at: addDays(reviewedAt, 90),
      evidence: ["training_affiliation", "location_training_discipline"] },
    authority_trace: record.sources_checked,
  }));
  const corrections = records.filter((record) => record.final_classification === "EXISTING_LOCATION_CONFIRMED_MATCH").map((record) => ({
    hgy_external_id: record.hgy_external_id, location_id: record.matched_location_id, location_slug: record.matched_location_slug,
    location_name: record.matched_location_name, match_method: record.match_method, score: record.match_score,
    distance_meters: record.coordinate_distance_meters, authority_trace: record.sources_checked,
    import_preview: { external_identifier: record.hgy_external_id, affiliation_type: "training_club", awarding_organization: "HYROX",
      verification_status: "confirmed", evidence: ["training_affiliation", "location_training_discipline"] },
  }));
  const unresolved = records.filter((record) => !["NEW_LOCATION_READY", "EXISTING_LOCATION_CONFIRMED_MATCH"].includes(record.final_classification));
  const proposedBrands = ready.map((record) => record.proposed_brand)
    .filter((brand): brand is NonNullable<typeof brand> => brand !== null);
  const brandCandidates = [...new Map(proposedBrands.map((brand) => [brand.slug, brand])).values()]
    .sort((left, right) => (left.slug ?? "").localeCompare(right.slug ?? ""));

  const headers = ["hgy_external_id", "hyrox_official_name", "original_blocker", "facility_authority_url", "postal_code", "prefecture", "city", "canonical_name", "matched_location_id", "matched_location_slug", "proposed_slug", "final_classification", "resolution_reason", "unresolved_gaps"];
  const csv = [headers.map(csvCell).join(","), ...records.map((record) => headers.map((header) => csvCell(record[header as keyof H29ResolutionRecord])).join(","))].join("\n") + "\n";
  const markdown = ["# HYROX H2-9 — Location authority gap resolution", "", `Reviewed at: ${reviewedAt}`, `Scope: ${records.length} H2-4 NEW_LOCATION_NEEDS_REVIEW records`, "",
    "## Final classification", "", ...classifications.map((key) => `- ${key}: ${artifact.classification_counts[key]}`), "",
    "## Original blocker outcomes", "", ...blockerKeys.map((key) => `- ${key}: ${JSON.stringify(blockerOutcomes[key])}`), "",
    "## Authority summary", "", `- Governing-body records revalidated: ${records.filter((record) => record.governing_body_revalidated).length}/144`,
    `- Japan Post postal authority confirmed: ${artifact.postal_authority_counts.POSTAL_AUTHORITY_CONFIRMED}`,
    `- Strong first-party/secondary facility authority: ${records.filter((record) => ["FIRST_PARTY_STRONG", "OFFICIAL_SECONDARY_STRONG"].includes(record.facility_authority_strength)).length}`,
    `- Missing-URL first-party facility pages found: ${missingUrlMetrics.facility_official_site_found}`,
    `- Missing-URL official brand locator pages found: ${missingUrlMetrics.official_brand_locator_found}`,
    `- Missing-URL records left without reliable first-party URL: ${missingUrlMetrics.no_reliable_first_party_url_found}`,
    `- Deterministic contract SHA-256: ${artifact.deterministic_contract_sha256}`, "",
    "## Import boundary", "", `- New location import candidates: ${ready.length}`, `- Existing location correction candidates: ${corrections.length}`,
    "- No production writes, migrations, equipment, capability, class, program mapping, UI, SEO, or deployment are included.", ""].join("\n");

  await mkdir(outputDir, { recursive: true });
  await Promise.all([
    writeFile(path.join(outputDir, "h2-9-location-authority-gap-resolution.json"), `${JSON.stringify(artifact, null, 2)}\n`),
    writeFile(path.join(outputDir, "h2-9-location-authority-gap-resolution.csv"), csv),
    writeFile(path.join(outputDir, "h2-9-location-authority-gap-resolution.md"), markdown),
    writeFile(path.join(outputDir, "h2-9-new-location-ready.json"), `${JSON.stringify({ schema_version: 1, preview_only: true, records: ready }, null, 2)}\n`),
    writeFile(path.join(outputDir, "h2-9-existing-location-corrections.json"), `${JSON.stringify({ schema_version: 1, preview_only: true, records: corrections }, null, 2)}\n`),
    writeFile(path.join(outputDir, "h2-9-unresolved-authority-gaps.json"), `${JSON.stringify({ schema_version: 1, records: unresolved }, null, 2)}\n`),
    writeFile(path.join(outputDir, "h2-9-brand-candidates.json"), `${JSON.stringify({ schema_version: 1, preview_only: true, records: brandCandidates }, null, 2)}\n`),
  ]);
  console.log(JSON.stringify({ records: records.length, classifications: artifact.classification_counts, contract_sha256: artifact.deterministic_contract_sha256 }));
}

main().catch((error: unknown) => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; });
