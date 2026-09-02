import type { SourceStatus } from "./hyrox-monitor";
import { normalizeSupportText, type EnrichmentSourceObservation } from "./hyrox-enrichment-monitor";
import { rawMonitorRequestKey, type RawMonitorManifest } from "./hyrox-raw-fact-monitor";

export type RawMonitorRequestOptions = {
  concurrency?: number;
  timeoutMs?: number;
  maxAttempts?: number;
  fetchImpl?: typeof fetch;
  sleep?: (milliseconds: number) => Promise<void>;
};

const USER_AGENT = "GymMap-HYROX-raw-fact-freshness-monitor/1.0 (+https://gymmap.vercel.app/training/hyrox)";

function sourceStatus(status: number): SourceStatus {
  if (status >= 200 && status < 400) return "AVAILABLE";
  if (status === 403) return "ACCESS_RESTRICTED";
  if (status === 404 || status === 410) return "NOT_FOUND";
  if (status === 408 || status === 429 || status >= 500) return "TEMPORARILY_UNREACHABLE";
  return "UNKNOWN";
}

function retryable(status: number) {
  return status === 408 || status === 429 || status >= 500;
}

function retryDelay(response: Response | null, attempt: number) {
  const value = response?.headers.get("retry-after")?.trim();
  if (value) {
    const seconds = Number(value);
    if (Number.isFinite(seconds)) return Math.min(Math.max(seconds * 1_000, 0), 10_000);
    const date = Date.parse(value);
    if (Number.isFinite(date)) return Math.min(Math.max(date - Date.now(), 0), 10_000);
  }
  return Math.min(500 * attempt, 2_000);
}

async function fetchWithPolicy(
  url: string,
  options: RawMonitorRequestOptions,
  stats: { retries: number },
) {
  const fetchImpl = options.fetchImpl ?? fetch;
  const sleep = options.sleep ?? ((milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds)));
  const maxAttempts = options.maxAttempts ?? 2;
  let response: Response | null = null;
  let error: string | null = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? 20_000);
    try {
      response = await fetchImpl(url, {
        method: "GET",
        redirect: "follow",
        signal: controller.signal,
        headers: { Accept: "text/html,*/*;q=0.5", "User-Agent": USER_AGENT },
      });
      error = null;
      if (!retryable(response.status) || attempt === maxAttempts) return { response, error, attempts: attempt };
    } catch (caught) {
      error = caught instanceof Error ? caught.message : String(caught);
      if (attempt === maxAttempts) return { response: null, error, attempts: attempt };
    } finally {
      clearTimeout(timer);
    }
    stats.retries += 1;
    await sleep(retryDelay(response, attempt));
  }
  return { response, error, attempts: maxAttempts };
}

function canonicalFromHtml(html: string, base: string) {
  const match = html.match(/<link\b[^>]*\brel=["']canonical["'][^>]*\bhref=["']([^"']+)["'][^>]*>/i)
    ?? html.match(/<link\b[^>]*\bhref=["']([^"']+)["'][^>]*\brel=["']canonical["'][^>]*>/i);
  if (!match?.[1]) return null;
  try { return new URL(match[1], base).toString(); } catch { return null; }
}

async function mapConcurrent<T, R>(items: T[], concurrency: number, operation: (item: T) => Promise<R>) {
  const output = new Array<R>(items.length);
  let cursor = 0;
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    for (;;) {
      const index = cursor++;
      if (index >= items.length) return;
      output[index] = await operation(items[index]);
    }
  }));
  return output;
}

export async function observeRawMonitorSources(
  manifest: RawMonitorManifest,
  options: RawMonitorRequestOptions = {},
) {
  const grouped = new Map<string, typeof manifest.sources>();
  for (const source of manifest.sources) {
    const key = rawMonitorRequestKey(source.url);
    grouped.set(key, [...(grouped.get(key) ?? []), source]);
  }
  const groups = [...grouped.values()];
  const concurrency = Math.min(options.concurrency ?? 4, 4);
  const stats = {
    entries: manifest.entries.length,
    uniqueSources: groups.length,
    requestsAfterDedup: groups.length,
    retries: 0,
    concurrency,
  };
  const observations = (await mapConcurrent(groups, concurrency, async (sources) => {
    const requestedUrl = sources[0].url;
    const result = await fetchWithPolicy(requestedUrl, options, stats);
    if (!result.response) {
      return sources.map((source): EnrichmentSourceObservation => ({
        sourceKey: source.sourceKey,
        status: "TEMPORARILY_UNREACHABLE",
        requestedUrl,
        finalUrl: null,
        canonicalUrl: null,
        httpStatus: null,
        attempts: result.attempts,
        error: result.error,
        materialRedirect: false,
      }));
    }
    const status = sourceStatus(result.response.status);
    const finalUrl = result.response.url || requestedUrl;
    const html = result.response.ok ? (await result.response.text()).slice(0, 2_000_000) : "";
    const canonicalUrl = html ? canonicalFromHtml(html, finalUrl) : null;
    return sources.map((source): EnrichmentSourceObservation => ({
      sourceKey: source.sourceKey,
      status: result.response!.ok && rawMonitorRequestKey(finalUrl) !== rawMonitorRequestKey(requestedUrl) ? "REDIRECTED_VALID" : status,
      requestedUrl,
      finalUrl,
      canonicalUrl,
      httpStatus: result.response!.status,
      attempts: result.attempts,
      error: result.error,
      materialRedirect: result.response!.ok && rawMonitorRequestKey(finalUrl) !== rawMonitorRequestKey(source.canonicalUrl),
      normalizedContent: html ? normalizeSupportText(html) : undefined,
    }));
  })).flat();
  return { observations, stats };
}
