import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  HYROX_API_BASE_URL,
  normalizeAddress,
  normalizeName,
  normalizePostalCode,
  type OfficialFinderGymPayload,
} from "../../src/lib/hyrox-official-clubs";
import type {
  AuthorityReconciliation,
  GoverningBodyObservation,
  H29Override,
  H29ResolutionRecord,
  H29WebsiteObservation,
} from "../../src/lib/hyrox-location-authority-resolution";

type ResolutionArtifact = { deterministic_contract_sha256: string; records: H29ResolutionRecord[] };
type OverrideArtifact = { schema_version: number; policy: string; records: H29Override[] };
type ObservationArtifact = {
  schema_version: number;
  governing_body_records: GoverningBodyObservation[];
  website_observations: H29WebsiteObservation[];
  [key: string]: unknown;
};

function cliValue(name: string): string {
  const prefix = `--${name}=`;
  const value = process.argv.find((entry) => entry.startsWith(prefix))?.slice(prefix.length);
  if (!value) throw new Error(`Missing required ${prefix}<value>`);
  return value;
}

function htmlValue(html: string, pattern: RegExp): string | null {
  return html.match(pattern)?.[1]?.replace(/&amp;/gi, "&").replace(/&#0?39;|&apos;/gi, "'").trim() ?? null;
}

function cleanHtml(html: string): string {
  return html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ").replace(/&nbsp;|&#160;/gi, " ").replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ").slice(0, 500_000);
}

async function request(url: string, accept: string): Promise<Response> {
  return fetch(url, {
    redirect: "follow",
    headers: { Accept: accept, "User-Agent": "GymMap-HYROX-H2-10R-authority-reconciliation/1.0" },
    signal: AbortSignal.timeout(20_000),
  });
}

function distanceMeters(left: { latitude: number | null; longitude: number | null }, right: { lat?: number; lon?: number }): number | null {
  if (left.latitude === null || left.longitude === null || typeof right.lat !== "number" || typeof right.lon !== "number") return null;
  const rad = (value: number) => value * Math.PI / 180;
  const dLat = rad(right.lat - left.latitude);
  const dLon = rad(right.lon - left.longitude);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(left.latitude)) * Math.cos(rad(right.lat)) * Math.sin(dLon / 2) ** 2;
  return 6_371_000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function main(): Promise<void> {
  const hgyId = cliValue("hgy-id");
  const oldUrl = new URL(cliValue("old-url")).toString();
  const newUrl = new URL(cliValue("new-url")).toString();
  const observedAt = cliValue("observed-at");
  if (Number.isNaN(Date.parse(observedAt))) throw new Error("--observed-at must be ISO-8601");
  const dataDir = path.resolve("data/hyrox");
  const resolutionPath = path.join(dataDir, "h2-9-location-authority-gap-resolution.json");
  const overridesPath = path.join(dataDir, "h2-9-authority-resolution-overrides.json");
  const observationsPath = path.join(dataDir, "h2-9-live-authority-observations.json");
  const [resolutionRaw, overridesRaw, observationsRaw] = await Promise.all([
    readFile(resolutionPath, "utf8"),
    readFile(overridesPath, "utf8"),
    readFile(observationsPath, "utf8"),
  ]);
  const [resolution, overrides, observations] = [
    JSON.parse(resolutionRaw) as ResolutionArtifact,
    JSON.parse(overridesRaw) as OverrideArtifact,
    JSON.parse(observationsRaw) as ObservationArtifact,
  ];
  if (resolution.deterministic_contract_sha256 !== "80c8714779aa16d9d6aa1901f4ca94f2cc70b3c5263b98914534e1a15d4575e6") {
    throw new Error("Original H2-9 contract hash mismatch");
  }
  const targets = resolution.records.filter((record) => record.hgy_external_id === hgyId);
  const overrideTargets = overrides.records.filter((record) => record.hgy_external_id === hgyId);
  if (targets.length !== 1 || overrideTargets.length !== 1) throw new Error("Target HGY must resolve to exactly one review and override record");
  const target = targets[0];
  const currentOverride = overrideTargets[0];
  if (target.final_classification !== "NEW_LOCATION_READY") throw new Error("Target is not H2-9 NEW_LOCATION_READY");
  if (new URL(target.facility_authority_url!).toString() !== oldUrl || new URL(currentOverride.facility_authority_url!).toString() !== oldUrl) {
    throw new Error("Frozen old authority URL does not match the target artifact");
  }

  const [governingResponse, oldResponse, newResponse] = await Promise.all([
    request(`${HYROX_API_BASE_URL}/v1/gyms/${encodeURIComponent(hgyId)}`, "application/json"),
    request(oldUrl, "text/html,application/xhtml+xml"),
    request(newUrl, "text/html,application/xhtml+xml"),
  ]);
  if (!governingResponse.ok) throw new Error(`Governing-body detail unavailable: HTTP ${governingResponse.status}`);
  if (oldResponse.status !== 404 || oldResponse.url !== oldUrl) throw new Error(`Old authority did not remain a direct 404: HTTP ${oldResponse.status} ${oldResponse.url}`);
  if (!newResponse.ok) throw new Error(`Replacement authority unavailable: HTTP ${newResponse.status}`);

  const body = await governingResponse.json() as { gym: OfficialFinderGymPayload };
  const gym = body.gym;
  const address = gym.address;
  const officialAddress = [address?.postalCode, address?.state, address?.city, address?.street].filter(Boolean).join(", ");
  const distance = distanceMeters(target, address?.geoCoordinates ?? {});
  const governingChecks = {
    external_id_unchanged: gym.hyroxEntityId === hgyId,
    country_jp: address?.country === "JP",
    name_unchanged: normalizeName(gym.gymName) === normalizeName(target.hyrox_official_name),
    address_unchanged: normalizeAddress(officialAddress) === normalizeAddress(target.canonical_address),
    postal_unchanged: normalizePostalCode(address?.postalCode) === normalizePostalCode(target.postal_code),
    coordinates_unchanged: distance !== null && distance <= 1,
  };
  if (Object.values(governingChecks).some((value) => !value)) throw new Error(`Governing-body identity drift: ${JSON.stringify(governingChecks)}`);

  const html = await newResponse.text();
  const text = cleanHtml(html);
  const normalizedText = normalizeName(text);
  const facilityChecks = {
    gym_field_first_party: new URL(newResponse.url).hostname.replace(/^www\./, "") === "gym-field.com",
    tokorozawa_hyrox_listed: normalizedText.includes(normalizeName("所沢スタジオ（HYROX）")),
    postal_listed: text.replace(/\D/g, "").includes(normalizePostalCode(target.postal_code)),
    address_listed: normalizeAddress(text).includes(normalizeAddress("埼玉県所沢市東所沢和田3丁目31-3")),
  };
  if (Object.values(facilityChecks).some((value) => !value)) throw new Error(`Replacement authority does not prove identity continuity: ${JSON.stringify(facilityChecks)}`);

  const oldCanonical = htmlValue(await oldResponse.text(), /<link[^>]+rel=["'][^"']*canonical[^"']*["'][^>]+href=["']([^"']+)["']/i);
  const newCanonical = htmlValue(html, /<link[^>]+rel=["'][^"']*canonical[^"']*["'][^>]+href=["']([^"']+)["']/i)
    ?? htmlValue(html, /<link[^>]+href=["']([^"']+)["'][^>]+rel=["'][^"']*canonical[^"']*["']/i);
  const title = htmlValue(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
  const replacementReason = "The reviewed facility-specific URL is retired (direct HTTP 404); the current Gym Field first-party studio locator explicitly lists Tokorozawa Studio (HYROX) and the unchanged physical address.";
  const reconciliation: AuthorityReconciliation = {
    classification: "FACILITY_SPECIFIC_URL_RETIRED",
    replacement_classification: "CURRENT_OFFICIAL_LOCATOR_AUTHORITY_CONFIRMED",
    old_authority_url: oldUrl,
    old_authority_state: "unavailable",
    old_http_status: oldResponse.status,
    old_redirect_url: oldResponse.url === oldUrl ? null : oldResponse.url,
    old_canonical_url: oldCanonical,
    new_authority_url: newUrl,
    new_authority_type: "brand_locator",
    identity_continuity: "confirmed",
    user_facing_url_decision: "use_current_official_locator",
    replacement_reason: replacementReason,
    observed_at: observedAt,
    reviewer_decision: "approved",
  };
  const reconciledOverride: H29Override = {
    ...currentOverride,
    facility_authority_url: newUrl,
    facility_authority_kind: "brand_locator",
    reason: replacementReason,
    authority_url: newUrl,
    reviewed_at: observedAt,
    authority_reconciliation: reconciliation,
  };
  overrides.records = overrides.records.map((record) => record.hgy_external_id === hgyId ? reconciledOverride : record);
  const escapedId = hgyId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const overrideLine = new RegExp(`^\\s*\\{[^\\n]*"hgy_external_id"\\s*:\\s*"${escapedId}"[^\\n]*\\}(,?)$`, "m");
  if (!overrideLine.test(overridesRaw)) throw new Error("Structured override source is not in the expected one-record-per-line form");
  const reconciledOverridesRaw = overridesRaw.replace(overrideLine, (line, comma: string) => {
    const indentation = line.match(/^\s*/)?.[0] ?? "    ";
    return `${indentation}${JSON.stringify(reconciledOverride)}${comma}`;
  });

  const websiteObservation: H29WebsiteObservation = {
    external_id: hgyId,
    requested_url: newUrl,
    final_url: newResponse.url,
    status: newResponse.status,
    content_type: newResponse.headers.get("content-type"),
    title,
    canonical_url: newCanonical,
    fetched_at: observedAt,
    official_name_match: facilityChecks.tokorozawa_hyrox_listed,
    postal_code_match: facilityChecks.postal_listed,
    address_token_match: facilityChecks.address_listed,
    page_postal_codes: [normalizePostalCode(target.postal_code)],
    error: null,
    site_kind: "facility_site",
    source_url_kind: "structured_authority_reconciliation",
  };
  observations.website_observations = [...observations.website_observations.filter((record) => record.external_id !== hgyId), websiteObservation]
    .sort((left, right) => left.external_id.localeCompare(right.external_id));

  const audit = {
    schema_version: 1,
    phase: "H2-10R",
    target_hgy_id: hgyId,
    observed_at: observedAt,
    old_h2_9_contract_sha256: resolution.deterministic_contract_sha256,
    governing_body: { url: `${HYROX_API_BASE_URL}/v1/gyms/${hgyId}`, checks: governingChecks, coordinate_distance_meters: distance },
    old_authority: { url: oldUrl, status: oldResponse.status, final_url: oldResponse.url, canonical_url: oldCanonical },
    replacement_authority: { url: newUrl, status: newResponse.status, final_url: newResponse.url, canonical_url: newCanonical, title, checks: facilityChecks },
    reconciliation,
    semantic_fields_unchanged: ["canonical_name", "canonical_address", "postal_code", "prefecture", "city", "latitude", "longitude", "brand_resolution", "proposed_brand_name", "proposed_brand_slug", "proposed_location_type", "proposed_slug"],
  };
  await Promise.all([
    writeFile(overridesPath, reconciledOverridesRaw),
    writeFile(observationsPath, `${JSON.stringify(observations, null, 2)}\n`),
    writeFile(path.join(dataDir, "h2-10r-tokorozawa-authority-reconciliation.json"), `${JSON.stringify(audit, null, 2)}\n`),
  ]);
  console.log(JSON.stringify({ hgy_id: hgyId, old_status: oldResponse.status, new_status: newResponse.status, continuity: "confirmed" }));
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
