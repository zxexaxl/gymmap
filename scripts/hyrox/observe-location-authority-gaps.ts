import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  HYROX_API_BASE_URL,
  normalizeAddress,
  normalizeName,
  normalizePostalCode,
  type OfficialFinderGymPayload,
} from "../../src/lib/hyrox-official-clubs";
import type { H24ReviewRecord, WebsiteObservation } from "../../src/lib/hyrox-unmatched-review";

type H24ReviewArtifact = { records: H24ReviewRecord[] };
type DetailResponse = { gym: OfficialFinderGymPayload };

function cliValue(name: string, fallback: string): string {
  const prefix = `--${name}=`;
  return process.argv.find((value) => value.startsWith(prefix))?.slice(prefix.length) ?? fallback;
}

function cleanText(html: string): string {
  return html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&#0?39;|&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, " ")
    .slice(0, 500_000);
}

function htmlValue(html: string, pattern: RegExp): string | null {
  return html.match(pattern)?.[1]?.replace(/&amp;/gi, "&").replace(/&#0?39;|&apos;/gi, "'").trim() ?? null;
}

function siteKind(url: string): "facility_site" | "social" | "booking" | "hosted_landing" {
  let host = "";
  try { host = new URL(url).hostname.toLowerCase().replace(/^www\./, ""); } catch { return "facility_site"; }
  if (["instagram.com", "facebook.com", "x.com"].some((value) => host === value || host.endsWith(`.${value}`))) return "social";
  if (["stores.jp", "hacomono.jp"].some((value) => host === value || host.endsWith(`.${value}`))) return "booking";
  if (["vercel.app", "canva.site", "linktr.ee"].some((value) => host === value || host.endsWith(`.${value}`))) return "hosted_landing";
  return "facility_site";
}

function requestUrl(value: string | null | undefined): string | null {
  const candidate = value?.trim();
  if (!candidate || /\s/.test(candidate)) return null;
  const withScheme = /^https?:\/\//i.test(candidate) ? candidate : `https://${candidate}`;
  try { return new URL(withScheme).toString(); } catch { return null; }
}

async function fetchJson<T>(url: string): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { Accept: "application/json", "User-Agent": "GymMap-HYROX-H2-9-authority-resolution/1.0" },
        signal: AbortSignal.timeout(15_000),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json() as T;
    } catch (error) {
      lastError = error;
      if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 750));
    }
  }
  throw lastError;
}

async function observeWebsite(record: H24ReviewRecord, url: string, observedAt: string): Promise<WebsiteObservation & { site_kind: ReturnType<typeof siteKind>; source_url_kind: "governing_body_current" | "h2_4_reviewed" }> {
  const sourceUrlKind = record.canonical_facility_url === url ? "h2_4_reviewed" : "governing_body_current";
  try {
    const response = await fetch(url, {
      redirect: "follow",
      headers: { Accept: "text/html,application/xhtml+xml", "User-Agent": "GymMap-HYROX-H2-9-authority-resolution/1.0" },
      signal: AbortSignal.timeout(15_000),
    });
    const contentType = response.headers.get("content-type");
    const html = contentType?.includes("text/html") ? await response.text() : "";
    const text = cleanText(html);
    const normalizedPage = normalizeName(text);
    const normalizedAddressPage = normalizeAddress(text);
    const postal = normalizePostalCode(record.postal_code);
    const tokens = [record.city, record.address]
      .filter((value): value is string => Boolean(value))
      .flatMap((value) => value.split(/[\s,、]+/))
      .map((value) => normalizeAddress(value)).filter((value) => value.length >= 4).slice(0, 8);
    return {
      external_id: record.hgy_external_id,
      requested_url: url,
      final_url: response.url || url,
      status: response.status,
      content_type: contentType,
      title: htmlValue(html, /<title[^>]*>([\s\S]*?)<\/title>/i),
      canonical_url: htmlValue(html, /<link[^>]+rel=["'][^"']*canonical[^"']*["'][^>]+href=["']([^"']+)["']/i)
        ?? htmlValue(html, /<link[^>]+href=["']([^"']+)["'][^>]+rel=["'][^"']*canonical[^"']*["']/i),
      fetched_at: observedAt,
      official_name_match: normalizeName(record.hyrox_official_name).length >= 4 && normalizedPage.includes(normalizeName(record.hyrox_official_name)),
      postal_code_match: postal.length === 7 && new RegExp(`(?:^|\\D)${postal.slice(0, 3)}[-‐‑‒–—―−]?${postal.slice(3)}(?:\\D|$)`).test(text),
      address_token_match: tokens.some((token) => normalizedAddressPage.includes(token)),
      page_postal_codes: [...new Set([...text.matchAll(/(?:〒|郵便番号|postal(?:\s*code)?)[^\d]{0,12}(\d{3}[-‐‑‒–—―−]?\d{4})/gi)]
        .map((match) => normalizePostalCode(match[1])))].sort(),
      error: response.ok ? null : `HTTP ${response.status}`,
      site_kind: siteKind(url),
      source_url_kind: sourceUrlKind,
    };
  } catch (error) {
    return {
      external_id: record.hgy_external_id, requested_url: url, final_url: null, status: null,
      content_type: null, title: null, canonical_url: null, fetched_at: observedAt,
      official_name_match: false, postal_code_match: false, address_token_match: false,
      page_postal_codes: [], error: error instanceof Error ? `${error.name}: ${error.message}` : "request failed",
      site_kind: siteKind(url), source_url_kind: sourceUrlKind,
    };
  }
}

async function mapBounded<T, R>(values: T[], concurrency: number, delayMs: number, fn: (value: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(values.length);
  let index = 0;
  await Promise.all(Array.from({ length: concurrency }, async () => {
    while (index < values.length) {
      const current = index++;
      results[current] = await fn(values[current]);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }));
  return results;
}

async function main(): Promise<void> {
  const inputPath = path.resolve(cliValue("input", "data/hyrox/h2-4-unmatched-location-review.json"));
  const outputPath = path.resolve(cliValue("output", "data/hyrox/h2-9-live-authority-observations.json"));
  const observedAt = cliValue("observed-at", new Date().toISOString());
  const input = JSON.parse(await readFile(inputPath, "utf8")) as H24ReviewArtifact;
  const records = input.records.filter((record) => record.final_classification === "NEW_LOCATION_NEEDS_REVIEW")
    .sort((a, b) => a.hgy_external_id.localeCompare(b.hgy_external_id));
  if (records.length !== 144 || new Set(records.map((record) => record.hgy_external_id)).size !== 144) {
    throw new Error(`H2-9 input isolation mismatch: ${records.length}`);
  }

  const governing = await mapBounded(records, 4, 125, async (record) => {
    try {
      const response = await fetchJson<DetailResponse>(`${HYROX_API_BASE_URL}/v1/gyms/${encodeURIComponent(record.hgy_external_id)}`);
      const gym = response.gym;
      return {
        external_id: record.hgy_external_id,
        fetched_at: observedAt,
        found: true,
        error: null,
        hyrox_entity_id: gym.hyroxEntityId ?? null,
        official_name: gym.gymName?.trim() ?? null,
        facility_url: gym.socialMedia?.website?.trim() || null,
        address: gym.address ? {
          country: gym.address.country ?? null,
          state: gym.address.state ?? null,
          city: gym.address.city ?? null,
          street: gym.address.street ?? null,
          postalCode: gym.address.postalCode ?? null,
          geoCoordinates: gym.address.geoCoordinates ? {
            lat: gym.address.geoCoordinates.lat ?? null,
            lon: gym.address.geoCoordinates.lon ?? null,
          } : null,
        } : null,
        discovery_queries: [
          `\"${record.hyrox_official_name}\" official ${record.city ?? "Japan"}`,
          `\"${record.hyrox_official_name}\" ${record.postal_code ?? ""}`.trim(),
        ],
      };
    } catch (error) {
      return {
        external_id: record.hgy_external_id, fetched_at: observedAt, found: false,
        error: error instanceof Error ? `${error.name}: ${error.message}` : "request failed",
        hyrox_entity_id: null, official_name: null, facility_url: null, address: null,
        discovery_queries: [
          `\"${record.hyrox_official_name}\" official ${record.city ?? "Japan"}`,
          `\"${record.hyrox_official_name}\" ${record.postal_code ?? ""}`.trim(),
        ],
      };
    }
  });
  const governingMap = new Map(governing.map((row) => [row.external_id, row]));
  const siteTargets = records.flatMap((record) => {
    const current = requestUrl(governingMap.get(record.hgy_external_id)?.facility_url);
    const url = current || requestUrl(record.canonical_facility_url);
    return url ? [{ record, url }] : [];
  });
  const websites = await mapBounded(siteTargets, 4, 175, ({ record, url }) => observeWebsite(record, url, observedAt));
  await writeFile(outputPath, `${JSON.stringify({
    schema_version: 1,
    observed_at: observedAt,
    input_count: records.length,
    governing_body_endpoint: `${HYROX_API_BASE_URL}/v1/gyms/{HGY_ID}`,
    request_policy: { concurrency: 4, governing_delay_ms: 125, website_delay_ms: 175, attempts: 2, timeout_ms: 15_000 },
    governing_body_records: governing,
    website_observations: websites,
  }, null, 2)}\n`);
  console.log(JSON.stringify({ input: records.length, governing_found: governing.filter((row) => row.found).length,
    current_facility_urls: governing.filter((row) => row.facility_url).length, websites_checked: websites.length,
    websites_ok: websites.filter((row) => !row.error && row.status && row.status < 400).length }));
}

main().catch((error) => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; });
