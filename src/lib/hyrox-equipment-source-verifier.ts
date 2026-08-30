export type SourceCheckStatus =
  | "AVAILABLE"
  | "REDIRECTED_VALID"
  | "ACCESS_RESTRICTED"
  | "NOT_FOUND"
  | "TEMPORARILY_UNREACHABLE"
  | "UNKNOWN";

export type SourceCheckResult = {
  url: string;
  finalUrl: string | null;
  httpStatus: number | null;
  status: SourceCheckStatus;
  attempts: number;
  checkedAt: string;
};

export type SourceVerifierOptions = {
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  retries?: number;
  checkedAt?: string;
};

function classify(status: number, redirected: boolean): SourceCheckStatus {
  if (status >= 200 && status < 400) return redirected ? "REDIRECTED_VALID" : "AVAILABLE";
  if (status === 401 || status === 403 || status === 429) return "ACCESS_RESTRICTED";
  if (status === 404 || status === 410) return "NOT_FOUND";
  if (status >= 500) return "TEMPORARILY_UNREACHABLE";
  return "UNKNOWN";
}

export async function verifyOfficialSource(
  url: string,
  options: SourceVerifierOptions = {},
): Promise<SourceCheckResult> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const retries = options.retries ?? 1;
  const timeoutMs = options.timeoutMs ?? 12_000;
  const checkedAt = options.checkedAt ?? new Date().toISOString();
  let attempts = 0;
  for (;;) {
    attempts += 1;
    try {
      const response = await fetchImpl(url, {
        method: "GET",
        redirect: "follow",
        signal: AbortSignal.timeout(timeoutMs),
        headers: { "User-Agent": "GymMap-HYROX-Evidence-PoC/1.0 (+https://gymmap.vercel.app)" },
      });
      const status = classify(response.status, response.redirected || response.url !== url);
      if (status === "TEMPORARILY_UNREACHABLE" && attempts <= retries) continue;
      return { url, finalUrl: response.url || null, httpStatus: response.status, status, attempts, checkedAt };
    } catch {
      if (attempts <= retries) continue;
      return {
        url,
        finalUrl: null,
        httpStatus: null,
        status: "TEMPORARILY_UNREACHABLE",
        attempts,
        checkedAt,
      };
    }
  }
}

export async function verifySourcesBounded(
  urls: string[],
  concurrency = 4,
  options: SourceVerifierOptions = {},
) {
  if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 8) {
    throw new Error("Source verification concurrency must be between 1 and 8");
  }
  const unique = [...new Set(urls)].sort();
  const results: SourceCheckResult[] = new Array(unique.length);
  let next = 0;
  async function worker() {
    for (;;) {
      const index = next++;
      if (index >= unique.length) return;
      results[index] = await verifyOfficialSource(unique[index], options);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, unique.length) }, () => worker()));
  return results;
}
