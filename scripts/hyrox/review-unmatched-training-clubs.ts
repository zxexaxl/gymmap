import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  duplicateValues,
  normalizedAddressKey,
  reviewUnmatchedRecord,
  type GymBrandRecord,
  type H24LocationRecord,
  type H24ReviewRecord,
  type PostalObservation,
  type ReviewClassification,
  type ReviewOverride,
  type WebsiteObservation,
} from "../../src/lib/hyrox-unmatched-review";
import { normalizeAddress, normalizeName, normalizePostalCode, type OfficialClubRecord, type ResolutionRecord } from "../../src/lib/hyrox-official-clubs";

type DiscoveryArtifact = { records: OfficialClubRecord[] };
type ResolutionArtifact = { records: ResolutionRecord[] };
type InventoryArtifact = { observed_at: string; locations: H24LocationRecord[]; brands: GymBrandRecord[] };

const CLASSIFICATIONS: ReviewClassification[] = [
  "EXISTING_LOCATION_CONFIRMED_MATCH", "NEW_LOCATION_READY", "NEW_LOCATION_NEEDS_REVIEW",
  "EXISTING_LOCATION_AMBIGUOUS", "NON_STANDARD_LOCATION", "SOURCE_CONFLICT",
];

function cliValue(name: string, fallback: string): string {
  const prefix = `--${name}=`;
  return process.argv.find((value) => value.startsWith(prefix))?.slice(prefix.length) ?? fallback;
}

async function readJson<T>(file: string): Promise<T> {
  return JSON.parse(await readFile(file, "utf8")) as T;
}

function cleanText(html: string): string {
  return html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .slice(0, 500_000);
}

function htmlValue(html: string, pattern: RegExp): string | null {
  return html.match(pattern)?.[1]?.replace(/&amp;/gi, "&").trim() ?? null;
}

function addressTokens(source: OfficialClubRecord): string[] {
  const values = [source.city, source.source_metadata.source_city, source.address]
    .filter((value): value is string => Boolean(value));
  return [...new Set(values.flatMap((value) => value.split(/[\s,、]+/))
    .map((value) => normalizeAddress(value)).filter((value) => value.length >= 4))].slice(0, 8);
}

async function observeWebsite(source: OfficialClubRecord, fetchedAt: string): Promise<WebsiteObservation | null> {
  if (!source.external_id || !source.facility_url) return null;
  try {
    const response = await fetch(source.facility_url, {
      redirect: "follow",
      headers: { "User-Agent": "GymMap-HYROX-H2-4-location-review/1.0", Accept: "text/html,application/xhtml+xml" },
      signal: AbortSignal.timeout(12_000),
    });
    const contentType = response.headers.get("content-type");
    const html = contentType?.includes("text/html") ? await response.text() : "";
    const text = cleanText(html);
    const normalizedPage = normalizeName(text);
    const normalizedAddressPage = normalizeAddress(text);
    const postal = normalizePostalCode(source.postal_code);
    const pagePostals = [...new Set([...text.matchAll(/(?:〒|郵便番号|postal(?:\s*code)?)[^\d]{0,12}(\d{3}[-‐‑‒–—―−]?\d{4})/gi)]
      .map((match) => normalizePostalCode(match[1])))].sort();
    const tokens = addressTokens(source);
    return {
      external_id: source.external_id,
      requested_url: source.facility_url,
      final_url: response.url || source.facility_url,
      status: response.status,
      content_type: contentType,
      title: htmlValue(html, /<title[^>]*>([\s\S]*?)<\/title>/i),
      canonical_url: htmlValue(html, /<link[^>]+rel=["'][^"']*canonical[^"']*["'][^>]+href=["']([^"']+)["']/i)
        ?? htmlValue(html, /<link[^>]+href=["']([^"']+)["'][^>]+rel=["'][^"']*canonical[^"']*["']/i),
      fetched_at: fetchedAt,
      official_name_match: normalizeName(source.official_name).length >= 4 && normalizedPage.includes(normalizeName(source.official_name)),
      postal_code_match: postal.length === 7 && new RegExp(`(?:^|\\D)${postal.slice(0, 3)}[-‐‑‒–—―−]?${postal.slice(3)}(?:\\D|$)`).test(text),
      address_token_match: tokens.some((token) => normalizedAddressPage.includes(token)),
      page_postal_codes: pagePostals,
      error: response.ok ? null : `HTTP ${response.status}`,
    };
  } catch (error) {
    return {
      external_id: source.external_id,
      requested_url: source.facility_url,
      final_url: null,
      status: null,
      content_type: null,
      title: null,
      canonical_url: null,
      fetched_at: fetchedAt,
      official_name_match: false,
      postal_code_match: false,
      address_token_match: false,
      page_postal_codes: [],
      error: error instanceof Error ? error.name : "request failed",
    };
  }
}

async function observePostal(postalCode: string): Promise<PostalObservation> {
  const normalized = normalizePostalCode(postalCode);
  if (normalized.length !== 7) return { postal_code: normalized, prefecture: null, city: null, town: null, status: "missing" };
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${encodeURIComponent(normalized)}`, {
        headers: { "User-Agent": "GymMap-HYROX-H2-4-location-review/1.0", Accept: "application/json" },
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const body = await response.json() as { results?: Array<{ address1: string; address2: string; address3: string }> | null };
      const result = body.results?.[0];
      return result
        ? { postal_code: normalized, prefecture: result.address1, city: result.address2, town: result.address3, status: "resolved" }
        : { postal_code: normalized, prefecture: null, city: null, town: null, status: "missing" };
    } catch {
      if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 1_000 * (attempt + 1)));
    }
  }
  return { postal_code: normalized, prefecture: null, city: null, town: null, status: "unavailable" };
}

async function mapWithConcurrency<T, R>(values: T[], concurrency: number, fn: (value: T) => Promise<R>): Promise<R[]> {
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

function csv(value: unknown): string {
  const text = value === null || value === undefined ? "" : Array.isArray(value) ? value.join(" | ") : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

function haversineMeters(a: H24ReviewRecord, b: H24ReviewRecord): number | null {
  if (a.latitude === null || a.longitude === null || b.latitude === null || b.longitude === null) return null;
  const rad = (value: number) => value * Math.PI / 180;
  const dLat = rad(b.latitude - a.latitude); const dLon = rad(b.longitude - a.longitude);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 6_371_000 * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function markdown(review: { reviewed_at: string; records: H24ReviewRecord[]; duplicate_audit: Record<string, unknown>; inventory_observed_at: string }): string {
  const counts = Object.fromEntries(CLASSIFICATIONS.map((key) => [key, review.records.filter((record) => record.final_classification === key).length]));
  const brandCounts = Object.fromEntries(["EXISTING_BRAND_MATCH", "NEW_BRAND_CANDIDATE", "INDEPENDENT_FACILITY", "BRAND_AMBIGUOUS"].map((key) => [key, review.records.filter((record) => record.brand_resolution === key).length]));
  const ready = review.records.filter((record) => record.final_classification === "NEW_LOCATION_READY");
  const prefectures = [...new Set(ready.map((record) => record.prefecture ?? "UNKNOWN"))].sort().map((prefecture) => [prefecture, ready.filter((record) => (record.prefecture ?? "UNKNOWN") === prefecture).length]);
  const allPrefectures = [...new Set(review.records.map((record) => record.prefecture ?? "UNKNOWN"))].sort().map((prefecture) => [prefecture, review.records.filter((record) => (record.prefecture ?? "UNKNOWN") === prefecture).length]);
  return [
    "# HYROX H2-4 — Unmatched Official Training Club Location Review", "",
    `Reviewed at: ${review.reviewed_at}`, `GymMap inventory observed at: ${review.inventory_observed_at}`, "",
    "## Classification", "", "| Classification | Count |", "| --- | ---: |",
    ...CLASSIFICATIONS.map((key) => `| ${key} | ${counts[key]} |`),
    `| **Total** | **${review.records.length}** |`, "",
    "## Brand resolution", "", "| Result | Count |", "| --- | ---: |",
    ...Object.entries(brandCounts).map(([key, count]) => `| ${key} | ${count} |`), "",
    "## All reviewed records by prefecture", "", "| Prefecture | Count |", "| --- | ---: |",
    ...allPrefectures.map(([key, count]) => `| ${key} | ${count} |`), "",
    "## NEW_LOCATION_READY prefectures", "", "| Prefecture | Count |", "| --- | ---: |",
    ...prefectures.map(([key, count]) => `| ${key} | ${count} |`), "",
    "## Audit", "", "```json", JSON.stringify(review.duplicate_audit, null, 2), "```", "",
    "## Existing-location corrections", "",
    ...review.records.filter((record) => record.final_classification === "EXISTING_LOCATION_CONFIRMED_MATCH")
      .map((record) => `- ${record.hyrox_official_name} (${record.hgy_external_id}) → ${record.matched_location_name} (${record.matched_location_slug}): ${record.match_method}`),
    "", "## Fail-closed review queue", "",
    ...review.records.filter((record) => record.manual_review_required)
      .map((record) => `- ${record.hyrox_official_name} (${record.hgy_external_id}): ${record.final_classification} — ${record.conflicts.join("; ")}`), "",
    "SOURCE_INCOMPLETE excluded: 21. No production mutation, equipment inference, capability inference, program mapping, or class import was performed.", "",
  ].join("\n");
}

async function main(): Promise<void> {
  const dataDir = path.resolve(cliValue("data-dir", "data/hyrox"));
  const reviewedAt = cliValue("reviewed-at", new Date().toISOString());
  const refreshLive = cliValue("refresh-live", "false") === "true";
  const [discovery, resolution, inventory] = await Promise.all([
    readJson<DiscoveryArtifact>(path.join(dataDir, "official-training-clubs-japan.json")),
    readJson<ResolutionArtifact>(path.join(dataDir, "official-training-club-resolution.json")),
    readJson<InventoryArtifact>(path.join(dataDir, "h2-4-gymmap-inventory.json")),
  ]);
  const unmatched = resolution.records.filter((record) => record.resolution_status === "UNMATCHED");
  const incomplete = resolution.records.filter((record) => record.resolution_status === "SOURCE_INCOMPLETE");
  if (unmatched.length !== 163 || incomplete.length !== 21) throw new Error(`Input isolation mismatch: unmatched=${unmatched.length}, incomplete=${incomplete.length}`);
  const sources = new Map(discovery.records.map((record) => [record.external_id, record]));
  if (duplicateValues(unmatched.map((record) => record.official_external_id)).length) throw new Error("Duplicate unmatched HGY IDs");
  const sourceRows = unmatched.map((record) => sources.get(record.official_external_id) ?? null);
  if (sourceRows.some((record) => !record)) throw new Error("Unmatched record missing discovery authority");
  const officialRows = sourceRows as OfficialClubRecord[];

  const websitePath = path.join(dataDir, "h2-4-official-site-observations.json");
  const postalPath = path.join(dataDir, "h2-4-postal-observations.json");
  let websites: WebsiteObservation[];
  let postals: PostalObservation[];
  if (refreshLive) {
    websites = (await mapWithConcurrency(officialRows.filter((record) => record.facility_url), 4, (record) => observeWebsite(record, reviewedAt)))
      .filter((value): value is WebsiteObservation => Boolean(value));
    const postalCodes = [...new Set(officialRows.map((record) => normalizePostalCode(record.postal_code)).filter((value) => value.length === 7))].sort();
    postals = await mapWithConcurrency(postalCodes, 1, observePostal);
    await Promise.all([
      writeFile(websitePath, `${JSON.stringify({ schema_version: 1, observed_at: reviewedAt, records: websites }, null, 2)}\n`),
      writeFile(postalPath, `${JSON.stringify({ schema_version: 1, observed_at: reviewedAt, records: postals }, null, 2)}\n`),
    ]);
  } else {
    websites = (await readJson<{ records: WebsiteObservation[] }>(websitePath)).records;
    postals = (await readJson<{ records: PostalObservation[] }>(postalPath)).records;
  }
  const websiteMap = new Map(websites.map((record) => [record.external_id, record]));
  const postalMap = new Map(postals.map((record) => [record.postal_code, record]));
  const overridesPath = path.join(dataDir, "h2-4-location-review-overrides.json");
  let overrides: ReviewOverride[] = [];
  try { overrides = (await readJson<{ records: ReviewOverride[] }>(overridesPath)).records; } catch { /* optional */ }
  const overrideMap = new Map(overrides.map((record) => [record.external_id, record]));
  const reservedSlugs = new Set(inventory.locations.map((location) => location.slug));
  const records = unmatched.map((record) => {
    const source = sources.get(record.official_external_id)!;
    return reviewUnmatchedRecord({
      resolution: record,
      source,
      locations: inventory.locations,
      brands: inventory.brands,
      website: websiteMap.get(source.external_id!),
      postal: postalMap.get(normalizePostalCode(source.postal_code)),
      override: overrideMap.get(source.external_id!),
      reservedSlugs,
    });
  });

  const duplicateAddresses = duplicateValues(records.map((record) => normalizedAddressKey(record.address)));
  const duplicateUrls = duplicateValues(records.map((record) => record.canonical_facility_url ? record.canonical_facility_url.replace(/\/$/, "") : null));
  const coordinateClusters: Array<{ external_ids: [string, string]; distance_meters: number }> = [];
  for (let left = 0; left < records.length; left += 1) for (let right = left + 1; right < records.length; right += 1) {
    const distance = haversineMeters(records[left], records[right]);
    if (distance !== null && distance <= 25) coordinateClusters.push({ external_ids: [records[left].hgy_external_id, records[right].hgy_external_id], distance_meters: Math.round(distance) });
  }
  const duplicateIds = new Set([
    ...records.filter((record) => duplicateAddresses.includes(normalizedAddressKey(record.address) ?? "")).map((record) => record.hgy_external_id),
    ...records.filter((record) => duplicateUrls.includes(record.canonical_facility_url?.replace(/\/$/, "") ?? "")).map((record) => record.hgy_external_id),
    ...coordinateClusters.flatMap((cluster) => cluster.external_ids),
  ]);
  for (const record of records) {
    if (record.final_classification === "NEW_LOCATION_READY" && duplicateIds.has(record.hgy_external_id)) {
      record.final_classification = "NEW_LOCATION_NEEDS_REVIEW";
      record.manual_review_required = true;
      record.is_active_candidate = false;
      record.proposed_slug = null;
      record.conflicts.push("Candidate duplicate/coordinate-cluster audit requires manual resolution");
    }
  }
  if (records.length !== 163 || records.some((record) => !CLASSIFICATIONS.includes(record.final_classification))) throw new Error("Every unmatched record must have exactly one classification");
  const duplicateAudit = {
    duplicate_hgy_ids: duplicateValues(records.map((record) => record.hgy_external_id)),
    duplicate_existing_location_targets: duplicateValues(records.map((record) => record.matched_location_id)),
    duplicate_candidate_addresses: duplicateAddresses,
    duplicate_candidate_urls: duplicateUrls,
    duplicate_proposed_slugs: duplicateValues(records.map((record) => record.proposed_slug)),
    coordinate_clusters_25m: coordinateClusters,
  };
  const ready = records.filter((record) => record.final_classification === "NEW_LOCATION_READY");
  const corrections = records.filter((record) => record.final_classification === "EXISTING_LOCATION_CONFIRMED_MATCH");
  const brandCandidates = [...new Map(ready.filter((record) => !record.proposed_brand_id && record.proposed_brand_slug)
    .map((record) => [record.proposed_brand_slug!, { name: record.proposed_brand_name, slug: record.proposed_brand_slug, resolution: record.brand_resolution }])).values()];
  const review = {
    schema_version: 1,
    phase: "H2-4",
    reviewed_at: reviewedAt,
    inventory_observed_at: inventory.observed_at,
    input: { unmatched: 163, source_incomplete_excluded: 21, confirmed_imported_excluded: 6 },
    classification_counts: Object.fromEntries(CLASSIFICATIONS.map((key) => [key, records.filter((record) => record.final_classification === key).length])),
    duplicate_audit: duplicateAudit,
    records,
  };
  const csvHeaders = ["hgy_external_id","hyrox_official_name","final_classification","matched_location_id","matched_location_slug","canonical_facility_url","official_site_status","canonical_name","address","postal_code","prefecture","city","address_verification_status","latitude","longitude","coordinate_confidence","brand_resolution","proposed_brand_id","proposed_brand_name","proposed_brand_slug","proposed_slug","proposed_location_type","match_method","reasons","conflicts","source_authorities","manual_review_required"] as const;
  const csvText = [csvHeaders.map(csv).join(","), ...records.map((record) => csvHeaders.map((header) => csv(record[header])).join(","))].join("\n") + "\n";
  await mkdir(dataDir, { recursive: true });
  await Promise.all([
    writeFile(path.join(dataDir, "h2-4-unmatched-location-review.json"), `${JSON.stringify(review, null, 2)}\n`),
    writeFile(path.join(dataDir, "h2-4-unmatched-location-review.csv"), csvText),
    writeFile(path.join(dataDir, "h2-4-unmatched-location-review.md"), markdown(review)),
    writeFile(path.join(dataDir, "h2-4-new-location-candidates.json"), `${JSON.stringify({ schema_version: 1, count: ready.length, records: ready }, null, 2)}\n`),
    writeFile(path.join(dataDir, "h2-4-existing-match-corrections.json"), `${JSON.stringify({ schema_version: 1, count: corrections.length, records: corrections }, null, 2)}\n`),
    writeFile(path.join(dataDir, "h2-4-brand-candidates.json"), `${JSON.stringify({ schema_version: 1, count: brandCandidates.length, records: brandCandidates }, null, 2)}\n`),
  ]);
  console.log(JSON.stringify({ total: records.length, classifications: review.classification_counts, ready: ready.length, corrections: corrections.length, brand_candidates: brandCandidates.length }));
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
