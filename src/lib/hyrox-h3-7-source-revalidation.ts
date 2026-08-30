import { h36BranchIdentityMatch, normalizeH36Text } from "./hyrox-targeted-source";

export type H37SourceClaim = {
  locationId: string;
  locationSlug: string;
  locationName: string;
  hgyId: string;
  brandName: string;
  targetSlug: string;
  source: { sourceKey: string; url: string; canonicalUrl: string; quality: "Q1" | "Q2"; publisherAuthority: string; observedAt: string };
  evidence: { supportFingerprint: string[]; observedAt: string; reviewedAt: string; evidenceHash: string };
};

export type H37SourceRevalidation = {
  schemaVersion: 1;
  checkedAt: string;
  readOnly: true;
  uniqueUrls: number;
  requestAttempts: number;
  driftCount: number;
  urls: Array<{ url: string; finalUrl: string | null; httpStatus: number | null; status: "AVAILABLE" | "DRIFT" | "UNAVAILABLE"; attempts: number }>;
  relations: Array<{ sourceKey: string; locationId: string; hgyId: string; url: string; authorityMatch: boolean; branchMatch: boolean; supportBasisPresent: boolean; claimCount: number }>;
};

function adapterFor(brandName: string) {
  if (brandName === "Orangetheory Fitness") return "orangetheory" as const;
  if (brandName === "Gold's Gym") return "golds-gym" as const;
  if (brandName === "UFC GYM") return "ufc-gym" as const;
  return "generic" as const;
}

async function fetchSource(url: string, fetchImpl: typeof fetch, retries: number) {
  let attempts = 0;
  for (;;) {
    attempts += 1;
    try {
      const response = await fetchImpl(url, { redirect: "follow", signal: AbortSignal.timeout(15_000), headers: {
        Accept: "text/html,*/*;q=0.5", "User-Agent": "GymMap-HYROX-H3-7-source-gate/1.0 (+https://gymmap.vercel.app/training/hyrox)",
      } });
      if ((response.status === 408 || response.status === 429 || response.status >= 500) && attempts <= retries) continue;
      const html = response.ok ? (await response.text()).slice(0, 2_000_000) : "";
      return { finalUrl: response.url || url, httpStatus: response.status, attempts, text: normalizeH36Text(html), title: normalizeH36Text(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "") };
    } catch {
      if (attempts <= retries) continue;
      return { finalUrl: null, httpStatus: null, attempts, text: "", title: "" };
    }
  }
}

export async function revalidateH37Sources(claims: H37SourceClaim[], options: { checkedAt: string; fetchImpl?: typeof fetch; retries?: number }): Promise<H37SourceRevalidation> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const groups = new Map<string, H37SourceClaim[]>();
  for (const claim of claims) groups.set(claim.source.url, [...(groups.get(claim.source.url) ?? []), claim]);
  const observations = new Map<string, Awaited<ReturnType<typeof fetchSource>>>();
  for (const url of [...groups.keys()].sort()) observations.set(url, await fetchSource(url, fetchImpl, options.retries ?? 1));
  const relations = [...new Map(claims.map((claim) => [claim.source.sourceKey, claim])).values()].sort((a, b) => a.source.sourceKey.localeCompare(b.source.sourceKey)).map((claim) => {
    const observation = observations.get(claim.source.url)!;
    const relationClaims = claims.filter((item) => item.source.sourceKey === claim.source.sourceKey);
    const authorityMatch = observation.httpStatus !== null && observation.httpStatus >= 200 && observation.httpStatus < 400 &&
      !!observation.finalUrl && new URL(observation.finalUrl).hostname.replace(/^www\./, "") === new URL(claim.source.canonicalUrl).hostname.replace(/^www\./, "");
    const branchToken = claim.locationName.replace(/オレンジセオリーフィットネス|\s/g, "").toLocaleLowerCase("ja-JP");
    const branchMatch = authorityMatch && (claim.brandName === "Orangetheory Fitness"
      ? normalizeH36Text(`${observation.title} ${observation.text}`).replace(/\s/g, "").toLocaleLowerCase("ja-JP").includes(branchToken)
      : h36BranchIdentityMatch({ locationName: claim.locationName, officialUrl: claim.source.url,
        expectedAdapter: adapterFor(claim.brandName) }, observation.text, observation.title));
    const normalized = observation.text.toLocaleLowerCase("ja-JP");
    const supportBasisPresent = relationClaims.every((item) => item.evidence.supportFingerprint.every((token) => normalized.includes(normalizeH36Text(token).toLocaleLowerCase("ja-JP"))));
    return { sourceKey: claim.source.sourceKey, locationId: claim.locationId, hgyId: claim.hgyId, url: claim.source.url,
      authorityMatch, branchMatch, supportBasisPresent, claimCount: relationClaims.length };
  });
  const urls = [...observations.entries()].map(([url, item]) => ({ url, finalUrl: item.finalUrl, httpStatus: item.httpStatus, attempts: item.attempts,
    status: (item.httpStatus && item.httpStatus >= 200 && item.httpStatus < 400 ? "AVAILABLE" : "UNAVAILABLE") as "AVAILABLE" | "UNAVAILABLE" }));
  const driftCount = relations.filter((item) => !item.authorityMatch || !item.branchMatch || !item.supportBasisPresent).length;
  return { schemaVersion: 1, checkedAt: options.checkedAt, readOnly: true, uniqueUrls: urls.length,
    requestAttempts: urls.reduce((sum, row) => sum + row.attempts, 0), driftCount, urls, relations };
}
