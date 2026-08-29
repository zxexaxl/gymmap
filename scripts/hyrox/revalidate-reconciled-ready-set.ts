import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  HYROX_API_BASE_URL,
  normalizeAddress,
  normalizeName,
  normalizePostalCode,
  normalizeUrl,
  type OfficialFinderGymPayload,
} from "../../src/lib/hyrox-official-clubs";
import type { H29ResolutionRecord } from "../../src/lib/hyrox-location-authority-resolution";
import type { H24LocationRecord } from "../../src/lib/hyrox-unmatched-review";

type ResolutionArtifact = { deterministic_contract_sha256: string; classification_counts: Record<string, number>; records: H29ResolutionRecord[] };
type ReconciliationArtifact = {
  target_hgy_id: string;
  reconciliation: { identity_continuity: string; new_authority_url: string };
  replacement_authority: { checks: Record<string, boolean> };
};
type LocationInventory = { observed_at: string; location_count: number; brand_count: number; locations: H24LocationRecord[] };
type TrainingInventory = {
  observed_at: string;
  counts: { external_identifiers: number; published_locations: number; official_affiliations: number };
  external_identifiers: Array<{ external_identifier: string; location_id: string }>;
};

function cliValue(name: string): string {
  const prefix = `--${name}=`;
  const value = process.argv.find((entry) => entry.startsWith(prefix))?.slice(prefix.length);
  if (!value) throw new Error(`Missing required ${prefix}<value>`);
  return value;
}

function optionalCliValue(name: string, fallback: string): string {
  const prefix = `--${name}=`;
  return process.argv.find((entry) => entry.startsWith(prefix))?.slice(prefix.length) ?? fallback;
}

async function fetchWithRetry(url: string, accept: string): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(url, {
        redirect: "follow",
        headers: { Accept: accept, "User-Agent": "GymMap-HYROX-H2-10R-ready-set-revalidation/1.0" },
        signal: AbortSignal.timeout(15_000),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response;
    } catch (error) {
      lastError = error;
      if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, 750 * attempt));
    }
  }
  throw lastError instanceof Error ? lastError : new Error("request failed");
}

function cleanHtml(html: string): string {
  return html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ").replace(/&nbsp;|&#160;/gi, " ").replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ").slice(0, 500_000);
}

function distanceMeters(left: { latitude: number | null; longitude: number | null }, right: { latitude: number | null; longitude: number | null }): number | null {
  if (left.latitude === null || left.longitude === null || right.latitude === null || right.longitude === null) return null;
  const rad = (value: number) => value * Math.PI / 180;
  const dLat = rad(right.latitude - left.latitude);
  const dLon = rad(right.longitude - left.longitude);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(left.latitude)) * Math.cos(rad(right.latitude)) * Math.sin(dLon / 2) ** 2;
  return 6_371_000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function mapBounded<T, R>(values: T[], concurrency: number, fn: (value: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(values.length);
  let index = 0;
  await Promise.all(Array.from({ length: concurrency }, async () => {
    while (index < values.length) {
      const current = index++;
      results[current] = await fn(values[current]);
      await new Promise((resolve) => setTimeout(resolve, 150));
    }
  }));
  return results;
}

async function main(): Promise<void> {
  const observedAt = cliValue("observed-at");
  const outputPath = path.resolve(optionalCliValue("output", "data/hyrox/h2-10r-ready-set-revalidation.json"));
  const productionLocationsPath = path.resolve(cliValue("production-locations"));
  const productionTrainingPath = path.resolve(cliValue("production-training"));
  const dataDir = path.resolve("data/hyrox");
  const [resolution, reconciliation, inventory, training] = await Promise.all([
    readFile(path.join(dataDir, "h2-9-location-authority-gap-resolution.json"), "utf8").then((value) => JSON.parse(value) as ResolutionArtifact),
    readFile(path.join(dataDir, "h2-10r-tokorozawa-authority-reconciliation.json"), "utf8").then((value) => JSON.parse(value) as ReconciliationArtifact),
    readFile(productionLocationsPath, "utf8").then((value) => JSON.parse(value) as LocationInventory),
    readFile(productionTrainingPath, "utf8").then((value) => JSON.parse(value) as TrainingInventory),
  ]);
  const expectedCounts = { NEW_LOCATION_READY: 58, EXISTING_LOCATION_CONFIRMED_MATCH: 0, REMAINS_NEEDS_REVIEW: 83, NON_STANDARD_LOCATION: 0, SOURCE_CONFLICT: 3 };
  if (JSON.stringify(resolution.classification_counts) !== JSON.stringify(expectedCounts)) throw new Error("Reconciled H2-9 classification counts drifted");
  const ready = resolution.records.filter((record) => record.final_classification === "NEW_LOCATION_READY")
    .sort((left, right) => left.hgy_external_id.localeCompare(right.hgy_external_id));
  if (ready.length !== 58 || new Set(ready.map((record) => record.hgy_external_id)).size !== 58) throw new Error("Reconciled READY set is not exactly 58 unique HGY identities");
  if (inventory.location_count !== 386 || inventory.brand_count !== 23 || training.counts.external_identifiers !== 24
      || training.counts.published_locations !== 24 || training.counts.official_affiliations !== 24) {
    throw new Error("Production baseline drifted before H2-10R collision recheck");
  }
  const imported = new Set(training.external_identifiers.map((record) => record.external_identifier));
  const productionSlugs = new Set(inventory.locations.map((record) => record.slug));
  const productionUrls = new Map(inventory.locations.filter((record) => record.official_url).map((record) => [normalizeUrl(record.official_url), record]));
  const productionAddresses = new Map(inventory.locations.filter((record) => record.address).map((record) => [normalizeAddress(record.address), record]));

  const records = await mapBounded(ready, 4, async (candidate) => {
    const governingBlockers: string[] = [];
    const facilityBlockers: string[] = [];
    let governingStatus: number | null = null;
    let facilityStatus: number | null = null;
    let facilityFinalUrl: string | null = null;
    try {
      const response = await fetchWithRetry(`${HYROX_API_BASE_URL}/v1/gyms/${encodeURIComponent(candidate.hgy_external_id)}`, "application/json");
      governingStatus = response.status;
      const body = await response.json() as { gym: OfficialFinderGymPayload };
      const gym = body.gym;
      const address = gym.address;
      const officialAddress = [address?.postalCode, address?.state, address?.city, address?.street].filter(Boolean).join(", ");
      const distance = distanceMeters(candidate, { latitude: address?.geoCoordinates?.lat ?? null, longitude: address?.geoCoordinates?.lon ?? null });
      if (gym.hyroxEntityId !== candidate.hgy_external_id) governingBlockers.push("HGY identity changed");
      if (address?.country !== "JP") governingBlockers.push("country is not JP");
      if (normalizeName(gym.gymName) !== normalizeName(candidate.hyrox_official_name)) governingBlockers.push("name changed");
      if (normalizePostalCode(address?.postalCode) !== normalizePostalCode(candidate.postal_code)) governingBlockers.push("postal changed");
      if (normalizeAddress(officialAddress) !== normalizeAddress(candidate.canonical_address)) governingBlockers.push("address changed");
      if (distance === null || distance > 50) governingBlockers.push("coordinates changed");
    } catch (error) {
      governingBlockers.push(error instanceof Error ? error.message : "governing-body request failed");
    }
    try {
      const response = await fetchWithRetry(candidate.facility_authority_url!, "text/html,application/xhtml+xml");
      facilityStatus = response.status;
      facilityFinalUrl = response.url;
      const html = (response.headers.get("content-type") ?? "").includes("text/html") ? await response.text() : "";
      const text = cleanHtml(html);
      const identitySignal = normalizeName(text).includes(normalizeName(candidate.hyrox_official_name))
        || normalizeName(text).includes(normalizeName(candidate.canonical_name))
        || text.replace(/\D/g, "").includes(normalizePostalCode(candidate.postal_code));
      if (candidate.facility_authority_kind === "facility_site" && !identitySignal) facilityBlockers.push("facility page identity signal missing");
      if (candidate.hgy_external_id === reconciliation.target_hgy_id) {
        if (candidate.facility_authority_url !== reconciliation.reconciliation.new_authority_url
            || reconciliation.reconciliation.identity_continuity !== "confirmed"
            || Object.values(reconciliation.replacement_authority.checks).some((value) => !value)) {
          facilityBlockers.push("target reconciliation authority mismatch");
        }
      }
    } catch (error) {
      facilityBlockers.push(error instanceof Error ? error.message : "facility request failed");
    }
    const collisionBlockers: string[] = [];
    if (imported.has(candidate.hgy_external_id)) collisionBlockers.push("HGY already imported");
    if (candidate.proposed_slug && productionSlugs.has(candidate.proposed_slug)) collisionBlockers.push("production slug collision");
    if (candidate.facility_authority_url && productionUrls.has(normalizeUrl(candidate.facility_authority_url))) collisionBlockers.push("production official URL collision");
    if (candidate.canonical_address && productionAddresses.has(normalizeAddress(candidate.canonical_address))) collisionBlockers.push("production address collision");
    const near = inventory.locations.map((location) => ({ location, distance_meters: distanceMeters(candidate, location) }))
      .filter((entry) => (entry.distance_meters ?? Infinity) <= 100);
    const plausibleNear = near.filter(({ location }) => normalizeName(location.name) === normalizeName(candidate.canonical_name)
      || normalizeAddress(location.address) === normalizeAddress(candidate.canonical_address)
      || normalizeUrl(location.official_url) === normalizeUrl(candidate.facility_authority_url));
    if (plausibleNear.length) collisionBlockers.push(`production identity-supported proximity collision: ${plausibleNear.map(({ location }) => location.slug).join(",")}`);
    return {
      hgy_external_id: candidate.hgy_external_id,
      governing_body_status: governingBlockers.length ? "BLOCKED" : "PASS",
      facility_authority_status: facilityBlockers.length ? "BLOCKED" : "PASS",
      collision_status: collisionBlockers.length ? "BLOCKED" : "PASS",
      governing_http_status: governingStatus,
      facility_http_status: facilityStatus,
      facility_authority_url: candidate.facility_authority_url,
      facility_final_url: facilityFinalUrl,
      nearby_nonmatching_locations: near.filter((entry) => !plausibleNear.includes(entry)).map(({ location, distance_meters }) => ({
        location_id: location.id,
        slug: location.slug,
        name: location.name,
        distance_meters: distance_meters === null ? null : Math.round(distance_meters * 10) / 10,
        identity_signals: { name_exact: false, address_exact: false, official_url_exact: false },
      })),
      blockers: [...governingBlockers, ...facilityBlockers, ...collisionBlockers],
    };
  });
  const governingPass = records.filter((record) => record.governing_body_status === "PASS").length;
  const facilityPass = records.filter((record) => record.facility_authority_status === "PASS").length;
  const collisionPass = records.filter((record) => record.collision_status === "PASS").length;
  const result = {
    schema_version: 1,
    phase: "H2-10R",
    observed_at: observedAt,
    reconciled_h2_9_contract_sha256: resolution.deterministic_contract_sha256,
    input_count: ready.length,
    governing_body_pass_count: governingPass,
    facility_authority_pass_count: facilityPass,
    collision_pass_count: collisionPass,
    remaining_authority_drift_count: records.filter((record) => record.blockers.length > 0).length,
    production_baseline: {
      observed_at: inventory.observed_at,
      training_observed_at: training.observed_at,
      gym_brands: inventory.brand_count,
      gym_locations: inventory.location_count,
      external_identifiers: training.counts.external_identifiers,
      published_hyrox: training.counts.published_locations,
      official_hyrox: training.counts.official_affiliations,
    },
    policy: { first_import_strict: true, shared_brand_locator_urls_allowed: true, facility_specific_url_duplicates_block: true, near_coordinate_threshold_meters: 100 },
    records,
  };
  await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify({ input: ready.length, governing_pass: governingPass, facility_pass: facilityPass, collision_pass: collisionPass, drift: result.remaining_authority_drift_count }));
  if (governingPass !== 58 || facilityPass !== 58 || collisionPass !== 58 || result.remaining_authority_drift_count !== 0) process.exitCode = 2;
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
