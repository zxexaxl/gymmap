import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  HYROX_API_BASE_URL,
  normalizeAddress,
  normalizeName,
  normalizePostalCode,
  normalizeUrl,
  parseOfficialFinderRecord,
  type OfficialFinderGymPayload,
} from "../../src/lib/hyrox-official-clubs";
import { validJapanCoordinates, type H24ReviewRecord } from "../../src/lib/hyrox-unmatched-review";

type CandidateArtifact = { count: number; records: H24ReviewRecord[] };

function cliValue(name: string, fallback: string): string {
  const prefix = `--${name}=`;
  return process.argv.find((value) => value.startsWith(prefix))?.slice(prefix.length) ?? fallback;
}

async function fetchWithRetry(url: string, accept: string): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(url, {
        redirect: "follow",
        headers: { Accept: accept, "User-Agent": "GymMap-HYROX-H2-5-revalidation/1.0" },
        signal: AbortSignal.timeout(15_000),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response;
    } catch (error) {
      lastError = error;
      if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, attempt * 750));
    }
  }
  throw lastError instanceof Error ? lastError : new Error("request failed");
}

function meters(left: H24ReviewRecord, right: { latitude: number | null; longitude: number | null }): number | null {
  if (left.latitude === null || left.longitude === null || right.latitude === null || right.longitude === null) return null;
  const rad = (value: number) => value * Math.PI / 180;
  const dLat = rad(right.latitude - left.latitude);
  const dLon = rad(right.longitude - left.longitude);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(rad(left.latitude)) * Math.cos(rad(right.latitude)) * Math.sin(dLon / 2) ** 2;
  return 6_371_000 * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

async function main(): Promise<void> {
  const dataDir = path.resolve(cliValue("data-dir", "data/hyrox"));
  const observedAt = cliValue("observed-at", new Date().toISOString());
  if (Number.isNaN(Date.parse(observedAt))) throw new Error("--observed-at must be ISO-8601");
  const input = JSON.parse(await readFile(path.join(dataDir, "h2-4-new-location-candidates.json"), "utf8")) as CandidateArtifact;
  if (input.count !== 17 || input.records.length !== 17 || input.records.some((record) => record.final_classification !== "NEW_LOCATION_READY")) {
    throw new Error("H2-5 source revalidation requires exactly 17 READY records");
  }

  const records = [];
  for (const candidate of [...input.records].sort((a, b) => a.hgy_external_id.localeCompare(b.hgy_external_id))) {
    const blockers: string[] = [];
    let official: ReturnType<typeof parseOfficialFinderRecord> | null = null;
    let apiError: string | null = null;
    try {
      const response = await fetchWithRetry(`${HYROX_API_BASE_URL}/v1/gyms/${encodeURIComponent(candidate.hgy_external_id)}`, "application/json");
      const body = await response.json() as { gym: OfficialFinderGymPayload };
      official = parseOfficialFinderRecord(body.gym, body.gym, observedAt);
    } catch (error) {
      apiError = error instanceof Error ? error.message : "request failed";
      blockers.push("HYROX governing-body detail endpoint unavailable");
    }

    let facilityStatus: number | null = null;
    let facilityFinalUrl: string | null = null;
    let facilityError: string | null = null;
    try {
      const response = await fetchWithRetry(candidate.canonical_facility_url!, "text/html,application/xhtml+xml");
      facilityStatus = response.status;
      facilityFinalUrl = response.url;
    } catch (error) {
      facilityError = error instanceof Error ? error.message : "request failed";
      blockers.push("Reviewed facility official URL unavailable");
    }

    const distance = official ? meters(candidate, official) : null;
    if (official) {
      if (official.external_id !== candidate.hgy_external_id) blockers.push("HGY external identity changed");
      if (official.country !== "JP") blockers.push("Governing-body country is no longer JP");
      if (normalizeName(official.official_name) !== normalizeName(candidate.hyrox_official_name)) blockers.push("Official facility name materially changed");
      if (normalizePostalCode(official.postal_code) !== normalizePostalCode(candidate.postal_code)) blockers.push("Official postal code materially changed");
      if (normalizeAddress(official.address) !== normalizeAddress(candidate.address)) blockers.push("Official address materially changed");
      if (!validJapanCoordinates(official.latitude, official.longitude) || distance === null || distance > 200) blockers.push("Official coordinates materially changed");
      if (official.facility_url && candidate.canonical_facility_url && normalizeUrl(official.facility_url) !== normalizeUrl(candidate.canonical_facility_url)) {
        const reviewedFinal = normalizeUrl(facilityFinalUrl);
        if (!reviewedFinal || normalizeUrl(official.facility_url) !== reviewedFinal) blockers.push("Official facility URL materially changed");
      }
    }

    records.push({
      hgy_external_id: candidate.hgy_external_id,
      status: blockers.length ? "BLOCKED" : "PASS",
      observed_at: observedAt,
      governing_body: official ? {
        external_id: official.external_id,
        official_name: official.official_name,
        country: official.country,
        address: official.address,
        postal_code: official.postal_code,
        latitude: official.latitude,
        longitude: official.longitude,
        official_source_url: official.official_source_url,
        facility_url: official.facility_url,
        coordinate_distance_meters: distance === null ? null : Math.round(distance * 10) / 10,
      } : null,
      facility_site: {
        requested_url: candidate.canonical_facility_url,
        final_url: facilityFinalUrl,
        status: facilityStatus,
        error: facilityError,
      },
      api_error: apiError,
      blockers,
    });
    await new Promise((resolve) => setTimeout(resolve, 150));
  }

  const artifact = {
    schema_version: 1,
    phase: "H2-5",
    source_authority: "HYROX governing-body official detail endpoint plus reviewed facility official URL",
    observed_at: observedAt,
    input_count: input.records.length,
    pass_count: records.filter((record) => record.status === "PASS").length,
    blocked_count: records.filter((record) => record.status === "BLOCKED").length,
    records,
  };
  await mkdir(dataDir, { recursive: true });
  await writeFile(path.join(dataDir, "h2-5-source-revalidation.json"), `${JSON.stringify(artifact, null, 2)}\n`);
  console.log(JSON.stringify({ observed_at: observedAt, pass: artifact.pass_count, blocked: artifact.blocked_count }));
  if (artifact.blocked_count) process.exitCode = 2;
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
