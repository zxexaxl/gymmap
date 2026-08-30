import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { normalizeUrl, type SourceStatus } from "./hyrox-monitor";
import {
  buildEnrichmentMonitorRun,
  normalizeSupportText,
  type EnrichmentAuthorityManifest,
  type EnrichmentMonitorRun,
  type EnrichmentSourceObservation,
  type PublishedEnrichmentClaim,
} from "./hyrox-enrichment-monitor";

export type EnrichmentRequestOptions = {
  concurrency?: number;
  timeoutMs?: number;
  maxAttempts?: number;
  fetchImpl?: typeof fetch;
  sleep?: (milliseconds: number) => Promise<void>;
};

const USER_AGENT = "GymMap-HYROX-enrichment-freshness-monitor/1.0 (+https://gymmap.vercel.app/training/hyrox)";

function sourceStatus(status: number): SourceStatus {
  if (status >= 200 && status < 400) return "AVAILABLE";
  if (status === 403) return "ACCESS_RESTRICTED";
  if (status === 404 || status === 410) return "NOT_FOUND";
  if (status === 408 || status === 429 || status >= 500) return "TEMPORARILY_UNREACHABLE";
  return "UNKNOWN";
}

function retryable(status: number) { return status === 408 || status === 429 || status >= 500; }

async function fetchSource(url: string, options: EnrichmentRequestOptions, stats: { retries: number }) {
  const fetchImpl = options.fetchImpl ?? fetch;
  const sleep = options.sleep ?? ((milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds)));
  const maxAttempts = options.maxAttempts ?? 2;
  let response: Response | null = null;
  let error: string | null = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? 20_000);
    try {
      response = await fetchImpl(url, { method: "GET", redirect: "follow", signal: controller.signal, headers: { Accept: "text/html,*/*;q=0.5", "User-Agent": USER_AGENT } });
      error = null;
      if (!retryable(response.status) || attempt === maxAttempts) return { response, error, attempts: attempt };
    } catch (caught) {
      error = caught instanceof Error ? caught.message : String(caught);
      if (attempt === maxAttempts) return { response: null, error, attempts: attempt };
    } finally { clearTimeout(timer); }
    stats.retries += 1;
    const retryAfter = response?.headers.get("retry-after");
    const wait = retryAfter && Number.isFinite(Number(retryAfter)) ? Math.min(Number(retryAfter) * 1_000, 10_000) : 500 * attempt;
    await sleep(wait);
  }
  return { response, error, attempts: maxAttempts };
}

function canonicalFromHtml(html: string, base: string) {
  const match = html.match(/<link\b[^>]*\brel=["']canonical["'][^>]*\bhref=["']([^"']+)["'][^>]*>/i)
    ?? html.match(/<link\b[^>]*\bhref=["']([^"']+)["'][^>]*\brel=["']canonical["'][^>]*>/i);
  if (!match?.[1]) return null;
  try { return new URL(match[1], base).toString(); } catch { return null; }
}

function hostname(value: string) { try { return new URL(value).hostname.toLowerCase().replace(/^www\./, ""); } catch { return ""; } }

async function mapConcurrent<T, R>(items: T[], concurrency: number, operation: (item: T) => Promise<R>) {
  const output = new Array<R>(items.length); let cursor = 0;
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    for (;;) { const index = cursor++; if (index >= items.length) return; output[index] = await operation(items[index]); }
  }));
  return output;
}

export async function observeEnrichmentSources(manifest: EnrichmentAuthorityManifest, options: EnrichmentRequestOptions = {}) {
  const stats = { sources: manifest.sources.length, retries: 0, concurrency: options.concurrency ?? 4 };
  const observations = await mapConcurrent(manifest.sources, stats.concurrency, async (source): Promise<EnrichmentSourceObservation> => {
    const result = await fetchSource(source.url, options, stats);
    if (!result.response) return { sourceKey: source.sourceKey, status: "TEMPORARILY_UNREACHABLE", requestedUrl: source.url, finalUrl: null, canonicalUrl: null, httpStatus: null, attempts: result.attempts, error: result.error, materialRedirect: false };
    const status = sourceStatus(result.response.status);
    const finalUrl = result.response.url || source.url;
    const html = result.response.ok ? (await result.response.text()).slice(0, 2_000_000) : "";
    const canonicalUrl = html ? canonicalFromHtml(html, finalUrl) : null;
    const redirected = result.response.ok && normalizeUrl(finalUrl) !== normalizeUrl(source.url);
    const canonicalMatches = canonicalUrl ? normalizeUrl(canonicalUrl) === normalizeUrl(source.canonicalUrl) : false;
    const finalMatches = normalizeUrl(finalUrl) === normalizeUrl(source.canonicalUrl);
    const materialRedirect = redirected && !finalMatches && !canonicalMatches && hostname(finalUrl) !== hostname(source.canonicalUrl);
    return {
      sourceKey: source.sourceKey, status: redirected ? "REDIRECTED_VALID" : status,
      requestedUrl: source.url, finalUrl, canonicalUrl, httpStatus: result.response.status,
      attempts: result.attempts, error: result.error, materialRedirect,
      normalizedContent: html ? normalizeSupportText(html) : undefined,
    };
  });
  return { observations, stats };
}

export async function loadPublishedEnrichmentClaims(env: { supabaseUrl: string; supabaseAnonKey: string }): Promise<PublishedEnrichmentClaim[]> {
  const client = createClient<Database>(env.supabaseUrl, env.supabaseAnonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const [{ data: equipment, error: equipmentError }, { data: capabilities, error: capabilityError }] = await Promise.all([
    client.from("published_location_equipment").select("location_id,equipment_slug,last_confirmed_at,stale_at").order("location_id").order("equipment_slug"),
    client.from("published_location_training_capabilities").select("location_id,capability_slug,last_confirmed_at,stale_at").order("location_id").order("capability_slug"),
  ]);
  if (equipmentError) throw new Error(`Published equipment load failed: ${equipmentError.message}`);
  if (capabilityError) throw new Error(`Published capability load failed: ${capabilityError.message}`);
  const convert = (kind: "equipment" | "capability", item: { location_id: string | null; last_confirmed_at: string | null; stale_at: string | null }, slug: string | null): PublishedEnrichmentClaim => {
    if (!item.location_id || !slug || !item.last_confirmed_at || !item.stale_at) throw new Error(`Incomplete published ${kind} claim`);
    return { kind, locationId: item.location_id, slug, lastConfirmedAt: item.last_confirmed_at, staleAt: item.stale_at };
  };
  return [
    ...(equipment ?? []).map((item) => convert("equipment", item, item.equipment_slug)),
    ...(capabilities ?? []).map((item) => convert("capability", item, item.capability_slug)),
  ];
}

export async function runLiveEnrichmentMonitor(args: {
  manifest: EnrichmentAuthorityManifest;
  supabaseUrl: string;
  supabaseAnonKey: string;
  checkedAt: string;
  requestOptions?: EnrichmentRequestOptions;
}): Promise<EnrichmentMonitorRun> {
  const started = Date.now();
  const [publishedClaims, sourceResult] = await Promise.all([
    loadPublishedEnrichmentClaims({ supabaseUrl: args.supabaseUrl, supabaseAnonKey: args.supabaseAnonKey }),
    observeEnrichmentSources(args.manifest, args.requestOptions),
  ]);
  return buildEnrichmentMonitorRun({ manifest: args.manifest, publishedClaims, sourceObservations: sourceResult.observations,
    checkedAt: args.checkedAt, durationMs: Date.now() - started, requestStats: sourceResult.stats });
}
