import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import {
  HYROX_API_BASE_URL,
  HYROX_FINDER_URL,
  buildMonitorRun,
  type FacilityObservation,
  type FinderObservation,
  type HyroxMonitorBaseline,
  type HyroxMonitorRun,
  type SourceStatus,
} from "@/lib/hyrox-monitor";

export type MonitorRequestOptions = {
  concurrency?: number;
  timeoutMs?: number;
  maxAttempts?: number;
  fetchImpl?: typeof fetch;
  sleep?: (milliseconds: number) => Promise<void>;
};

type FinderGymPayload = {
  hyroxEntityId?: string;
  gymName?: string;
  geoCoordinates?: { lat?: number; lon?: number };
  socialMedia?: { website?: string };
  address?: {
    country?: string;
    state?: string;
    city?: string;
    street?: string;
    postalCode?: string;
    geoCoordinates?: { lat?: number; lon?: number };
  };
};

type RequestStats = HyroxMonitorRun["requestStats"];

const HGY_ID_PATTERN = /^HGY_[A-Za-z0-9]+$/;
const USER_AGENT = "GymMap-HYROX-freshness-monitor/1.0 (+https://gymmap.vercel.app/training/hyrox)";

function sourceStatusForHttp(status: number): SourceStatus {
  if (status >= 200 && status < 400) return "AVAILABLE";
  if (status === 403) return "ACCESS_RESTRICTED";
  if (status === 404 || status === 410) return "NOT_FOUND";
  if (status === 408 || status === 429 || status >= 500) return "TEMPORARILY_UNREACHABLE";
  return "UNKNOWN";
}

function retryableStatus(status: number): boolean {
  return status === 408 || status === 429 || status >= 500;
}

function retryDelay(response: Response | null, attempt: number): number {
  const retryAfter = response?.headers.get("retry-after");
  if (retryAfter) {
    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds)) return Math.min(seconds * 1_000, 30_000);
  }
  return 500 * (2 ** (attempt - 1));
}

async function fetchWithPolicy(
  url: string,
  options: MonitorRequestOptions,
  stats: RequestStats,
): Promise<{ response: Response | null; error: string | null; attempts: number }> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const sleep = options.sleep ?? ((milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)));
  const maxAttempts = options.maxAttempts ?? 3;
  let lastError: string | null = null;
  let lastResponse: Response | null = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 15_000);
    try {
      lastResponse = await fetchImpl(url, {
        method: "GET",
        redirect: "follow",
        signal: controller.signal,
        headers: {
          Accept: "application/json,text/html;q=0.8,*/*;q=0.5",
          "User-Agent": USER_AGENT,
        },
      });
      lastError = null;
      if (!retryableStatus(lastResponse.status) || attempt === maxAttempts) {
        return { response: lastResponse, error: null, attempts: attempt };
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      if (attempt === maxAttempts) return { response: null, error: lastError, attempts: attempt };
    } finally {
      clearTimeout(timeout);
    }
    stats.retries += 1;
    await sleep(retryDelay(lastResponse, attempt));
  }
  return { response: lastResponse, error: lastError, attempts: maxAttempts };
}

async function mapConcurrent<T, R>(
  values: T[],
  concurrency: number,
  operation: (value: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(values.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(concurrency, values.length) }, async () => {
    while (cursor < values.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await operation(values[index]);
    }
  });
  await Promise.all(workers);
  return results;
}

function finderAddress(gym: FinderGymPayload): string | null {
  const address = gym.address;
  if (!address) return null;
  return [address.postalCode, address.state, address.city, address.street].filter(Boolean).join(", ") || null;
}

export async function checkFinderHealth(
  options: MonitorRequestOptions,
  stats: RequestStats,
): Promise<boolean> {
  const url = new URL(`${HYROX_API_BASE_URL}/v1/gyms/map`);
  url.searchParams.set("latitude", "35.681236");
  url.searchParams.set("longitude", "139.767125");
  url.searchParams.set("radiusMeters", "100000");
  url.searchParams.set("limit", "5");
  stats.finderHealth += 1;
  const result = await fetchWithPolicy(url.toString(), options, stats);
  if (!result.response?.ok) return false;
  try {
    const payload = await result.response.json() as { gyms?: unknown[] };
    return Array.isArray(payload.gyms);
  } catch {
    return false;
  }
}

export async function observeFinder(
  baseline: HyroxMonitorBaseline,
  options: MonitorRequestOptions,
  stats: RequestStats,
): Promise<FinderObservation> {
  const detailUrl = `${HYROX_API_BASE_URL}/v1/gyms/${encodeURIComponent(baseline.hgyId)}`;
  stats.finderDetail += 1;
  const result = await fetchWithPolicy(detailUrl, options, stats);
  const status = result.response ? sourceStatusForHttp(result.response.status) : "TEMPORARILY_UNREACHABLE";
  if (!result.response?.ok) {
    return {
      status,
      httpStatus: result.response?.status ?? null,
      hgyId: null,
      country: null,
      name: null,
      address: null,
      postalCode: null,
      prefecture: null,
      city: null,
      latitude: null,
      longitude: null,
      facilityUrl: null,
      detailUrl,
      error: result.error,
      attempts: result.attempts,
    };
  }
  try {
    const payload = await result.response.json() as { gym?: FinderGymPayload };
    const gym = payload.gym;
    if (!gym) throw new Error("Finder detail response is missing gym");
    const coordinates = gym.address?.geoCoordinates ?? gym.geoCoordinates;
    const identityMatches = gym.hyroxEntityId === baseline.hgyId;
    return {
      status: identityMatches ? "AVAILABLE" : "IDENTITY_MISMATCH",
      httpStatus: result.response.status,
      hgyId: gym.hyroxEntityId ?? null,
      country: gym.address?.country ?? null,
      name: gym.gymName?.trim() || null,
      address: finderAddress(gym),
      postalCode: gym.address?.postalCode?.trim() || null,
      prefecture: gym.address?.state?.trim() || null,
      city: gym.address?.city?.trim() || null,
      latitude: typeof coordinates?.lat === "number" ? coordinates.lat : null,
      longitude: typeof coordinates?.lon === "number" ? coordinates.lon : null,
      facilityUrl: gym.socialMedia?.website?.trim() || null,
      detailUrl: `${HYROX_FINDER_URL}gym/${encodeURIComponent(baseline.hgyId)}`,
      error: null,
      attempts: result.attempts,
    };
  } catch (error) {
    return {
      status: "UNKNOWN",
      httpStatus: result.response.status,
      hgyId: null,
      country: null,
      name: null,
      address: null,
      postalCode: null,
      prefecture: null,
      city: null,
      latitude: null,
      longitude: null,
      facilityUrl: null,
      detailUrl,
      error: error instanceof Error ? error.message : String(error),
      attempts: result.attempts,
    };
  }
}

async function readHtmlPrefix(response: Response, maximumBytes = 65_536): Promise<string> {
  if (!response.body) return "";
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let bytes = 0;
  let result = "";
  while (bytes < maximumBytes) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    result += decoder.decode(value, { stream: true });
    if (bytes >= maximumBytes) {
      await reader.cancel();
      break;
    }
  }
  return result.slice(0, maximumBytes);
}

function canonicalFromHtml(html: string, baseUrl: string): string | null {
  const match = html.match(/<link\b[^>]*\brel=["']canonical["'][^>]*\bhref=["']([^"']+)["'][^>]*>/i)
    ?? html.match(/<link\b[^>]*\bhref=["']([^"']+)["'][^>]*\brel=["']canonical["'][^>]*>/i);
  if (!match?.[1]) return null;
  try {
    return new URL(match[1], baseUrl).toString();
  } catch {
    return null;
  }
}

export async function observeFacility(
  baseline: HyroxMonitorBaseline,
  options: MonitorRequestOptions,
  stats: RequestStats,
): Promise<FacilityObservation> {
  if (!baseline.officialUrl) {
    return {
      status: "UNKNOWN",
      requestedUrl: null,
      finalUrl: null,
      canonicalUrl: null,
      httpStatus: null,
      error: "Production location has no official URL",
      attempts: 0,
    };
  }
  stats.facility += 1;
  const result = await fetchWithPolicy(baseline.officialUrl, options, stats);
  if (!result.response) {
    return {
      status: "TEMPORARILY_UNREACHABLE",
      requestedUrl: baseline.officialUrl,
      finalUrl: null,
      canonicalUrl: null,
      httpStatus: null,
      error: result.error,
      attempts: result.attempts,
    };
  }
  const baseStatus = sourceStatusForHttp(result.response.status);
  const finalUrl = result.response.url || baseline.officialUrl;
  const html = result.response.ok ? await readHtmlPrefix(result.response) : "";
  const redirected = result.response.ok && new URL(finalUrl).toString() !== new URL(baseline.officialUrl).toString();
  return {
    status: redirected ? "REDIRECTED_VALID" : baseStatus,
    requestedUrl: baseline.officialUrl,
    finalUrl,
    canonicalUrl: canonicalFromHtml(html, finalUrl),
    httpStatus: result.response.status,
    error: result.error,
    attempts: result.attempts,
  };
}

function chunks<T>(values: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(values.length / size) }, (_, index) =>
    values.slice(index * size, (index + 1) * size));
}

export async function loadPublishedHyroxBaselines(env: {
  supabaseUrl: string;
  supabaseAnonKey: string;
}): Promise<HyroxMonitorBaseline[]> {
  const client = createClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: affiliations, error: affiliationError } = await client
    .from("published_training_affiliations")
    .select("location_id,external_identifier,last_confirmed_at,stale_at")
    .eq("discipline_slug", "hyrox")
    .eq("is_official", true)
    .order("location_id");
  if (affiliationError) throw new Error(`Published affiliation baseline failed: ${affiliationError.message}`);
  const { data: disciplines, error: disciplineError } = await client
    .from("published_location_training_disciplines")
    .select("location_id,last_confirmed_at,stale_at")
    .eq("discipline_slug", "hyrox")
    .order("location_id");
  if (disciplineError) throw new Error(`Published discipline baseline failed: ${disciplineError.message}`);

  const locationIds = [...new Set((affiliations ?? []).map((item) => item.location_id).filter(Boolean))] as string[];
  const locations: Database["public"]["Tables"]["gym_locations"]["Row"][] = [];
  for (const group of chunks(locationIds, 100)) {
    const { data, error } = await client.from("gym_locations")
      .select("id,slug,name,brand_id,address_line,postal_code,prefecture,city,latitude,longitude,official_url,is_active,created_at,updated_at,last_verified_at,location_type,nearest_station,source_url")
      .in("id", group);
    if (error) throw new Error(`Public location baseline failed: ${error.message}`);
    locations.push(...(data ?? []));
  }
  const brandIds = [...new Set(locations.map((item) => item.brand_id))];
  const brands = new Map<string, string>();
  for (const group of chunks(brandIds, 100)) {
    const { data, error } = await client.from("gym_brands").select("id,name").in("id", group);
    if (error) throw new Error(`Public brand baseline failed: ${error.message}`);
    for (const brand of data ?? []) brands.set(brand.id, brand.name);
  }
  const disciplineByLocation = new Map((disciplines ?? []).map((item) => [item.location_id, item]));
  const locationById = new Map(locations.map((item) => [item.id, item]));
  const seenHgy = new Set<string>();
  return (affiliations ?? []).map((affiliation) => {
    const locationId = affiliation.location_id;
    const hgyId = affiliation.external_identifier;
    if (!locationId || !hgyId || !HGY_ID_PATTERN.test(hgyId)) {
      throw new Error(`Published official affiliation has invalid location/HGY identity: ${locationId ?? "missing"}/${hgyId ?? "missing"}`);
    }
    if (seenHgy.has(hgyId)) throw new Error(`Duplicate published HGY identity: ${hgyId}`);
    seenHgy.add(hgyId);
    const location = locationById.get(locationId);
    const discipline = disciplineByLocation.get(locationId);
    if (!location?.is_active || !discipline?.last_confirmed_at || !discipline.stale_at ||
        !affiliation.last_confirmed_at || !affiliation.stale_at) {
      throw new Error(`Incomplete published baseline for ${hgyId}`);
    }
    return {
      locationId,
      locationSlug: location.slug,
      locationName: location.name,
      brandName: brands.get(location.brand_id) ?? "",
      hgyId,
      address: location.address_line,
      postalCode: location.postal_code,
      prefecture: location.prefecture,
      city: location.city,
      latitude: location.latitude,
      longitude: location.longitude,
      officialUrl: location.official_url,
      discipline: { lastConfirmedAt: discipline.last_confirmed_at, staleAt: discipline.stale_at },
      affiliation: { lastConfirmedAt: affiliation.last_confirmed_at, staleAt: affiliation.stale_at },
    };
  }).sort((a, b) => a.hgyId.localeCompare(b.hgyId));
}

export async function runLiveHyroxMonitor(args: {
  supabaseUrl: string;
  supabaseAnonKey: string;
  checkedAt: string;
  requestOptions?: MonitorRequestOptions;
}): Promise<HyroxMonitorRun> {
  const startedAt = Date.now();
  const baselines = await loadPublishedHyroxBaselines(args);
  const options = args.requestOptions ?? {};
  const concurrency = options.concurrency ?? 5;
  const stats: RequestStats = { finderHealth: 0, finderDetail: 0, facility: 0, retries: 0 };
  const finderHealthAvailable = await checkFinderHealth(options, stats);
  const finderValues = await mapConcurrent(baselines, concurrency, (baseline) => observeFinder(baseline, options, stats));
  const facilityValues = await mapConcurrent(baselines, concurrency, (baseline) => observeFacility(baseline, options, stats));
  return buildMonitorRun({
    baselines,
    finderObservations: new Map(finderValues.map((item, index) => [baselines[index].hgyId, item])),
    facilityObservations: new Map(facilityValues.map((item, index) => [baselines[index].hgyId, item])),
    checkedAt: args.checkedAt,
    finderHealthAvailable,
    requestStats: stats,
    durationMs: Date.now() - startedAt,
  });
}
