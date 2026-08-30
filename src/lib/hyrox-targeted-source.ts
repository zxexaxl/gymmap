import type { H36CohortArtifact, H36CohortLocation, H36TargetSlug } from "./hyrox-targeted-evidence";

export type H36DiscoveryPage = {
  locationId: string;
  hgyId: string;
  adapter: H36CohortLocation["expectedAdapter"];
  url: string;
  role: "facility" | "hyrox-brand" | "hyrox-facility";
  expectedQuality: "Q1" | "Q2";
  expectedFacilitySpecific: boolean;
};

export type H36CollectedPage = {
  url: string;
  finalUrl: string | null;
  status: "AVAILABLE" | "REDIRECTED_VALID" | "ACCESS_RESTRICTED" | "NOT_FOUND" | "TEMPORARILY_UNREACHABLE" | "UNKNOWN";
  httpStatus: number | null;
  attempts: number;
  title: string;
  normalizedText: string;
  signals: Array<{ slug: H36TargetSlug; contexts: string[] }>;
};

export type H36DiscoveryRun = {
  schemaVersion: 1;
  checkedAt: string;
  readOnly: true;
  concurrency: number;
  plans: H36DiscoveryPage[];
  pages: H36CollectedPage[];
  requestStats: { uniqueUrls: number; attempts: number; retries: number };
};

const keywordPatterns: Record<H36TargetSlug, RegExp[]> = {
  "ski-erg": [/\bski\s*erg\b/gi, /スキーエルゴ/gi],
  "row-erg": [/\brow\s*erg\b/gi, /\brower\b/gi, /rowing machine/gi, /ローイングマシン/gi, /ウォーターローワー/gi],
  "weighted-sled": [/\bsled\b/gi, /スレッド/gi],
  "wall-ball-target": [/wall\s*ball/gi, /ウォールボール/gi],
  "farmers-carry-implements": [/farmer'?s?\s*carry/gi, /ファーマーズキャリー/gi, /\bkettlebell\b/gi, /ケトルベル/gi],
  sandbag: [/sand\s*bag/gi, /サンドバッグ/gi, /サンドバック/gi],
  "functional-training-lane": [/training lane/gi, /トレーニングレーン/gi, /\bturf\b/gi, /ターフ/gi],
  treadmill: [/\btreadmill\b/gi, /トレッドミル/gi, /トレッドマシン/gi],
  "running-track": [/running track/gi, /ランニングトラック/gi, /ランニング走路/gi],
  "open-training": [/open gym/gi, /self training/gi, /自主トレ(?:ーニング)?/gi, /自主練/gi, /フリー利用/gi],
  "discipline-coaching": [/hyrox\s*(?:class|coach|coaching)/gi, /hyrox(?:クラス|コーチ|トレーニング指導)/gi, /認定コーチ/gi],
  "competition-simulation": [/hyrox\s*simulation/gi, /race simulation/gi, /模擬レース/gi, /本番さながら/gi],
  "sled-push-pull-space": [/sled\s*(?:lane|track|space)/gi, /スレッド(?:専用)?(?:レーン|スペース)/gi],
  "outdoor-running-access": [/outdoor running/gi, /屋外ランニング/gi, /ランニングコース/gi],
};

export function buildH36DiscoveryPlan(cohort: H36CohortArtifact): H36DiscoveryPage[] {
  const plans = cohort.locations.flatMap((location): H36DiscoveryPage[] => {
    const base: H36DiscoveryPage = { locationId: location.locationId, hgyId: location.hgyId, adapter: location.expectedAdapter,
      url: location.officialUrl, role: "facility", expectedQuality: location.expectedAdapter === "ufc-gym" ? "Q1" : "Q2", expectedFacilitySpecific: true };
    if (location.expectedAdapter === "orangetheory") return [base, { ...base, url: "https://www.orangetheoryfitness.co.jp/hyrox/", role: "hyrox-brand", expectedFacilitySpecific: false }];
    if (location.expectedAdapter === "gym-field") return [
      { ...base, expectedFacilitySpecific: false },
      { ...base, url: "https://www.gym-field.com/hyrox/", role: "hyrox-brand", expectedFacilitySpecific: false },
    ];
    if (location.expectedAdapter === "ufc-gym") return [base, { ...base, url: new URL("hyrox/", location.officialUrl).toString(), role: "hyrox-facility", expectedFacilitySpecific: true }];
    return [base];
  }).sort((a, b) => a.hgyId.localeCompare(b.hgyId) || a.url.localeCompare(b.url));
  const counts = new Map<string, number>(); for (const plan of plans) counts.set(plan.locationId, (counts.get(plan.locationId) ?? 0) + 1);
  if ([...counts.values()].some((count) => count > 3)) throw new Error("H3-6 discovery page budget exceeded");
  return plans;
}

export function normalizeH36Text(html: string) {
  return html.normalize("NFKC").replace(/[\uD800-\uDFFF]/g, " ").replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ").replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ").replace(/&nbsp;|&#160;/gi, " ").replace(/&amp;/gi, "&").replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'").replace(/\s+/g, " ").trim();
}

function contexts(text: string, patterns: RegExp[]) {
  const found = new Set<string>();
  for (const pattern of patterns) {
    pattern.lastIndex = 0;
    for (let match = pattern.exec(text); match && found.size < 4; match = pattern.exec(text)) {
      found.add(text.slice(Math.max(0, match.index - 110), Math.min(text.length, match.index + match[0].length + 150)).trim());
      if (match[0].length === 0) break;
    }
  }
  return [...found];
}

export function extractH36Signals(text: string) {
  return (Object.entries(keywordPatterns) as Array<[H36TargetSlug, RegExp[]]>).map(([slug, patterns]) => ({ slug, contexts: contexts(text, patterns) }))
    .filter((item) => item.contexts.length > 0);
}

export function h36BranchIdentityMatch(location: Pick<H36CohortLocation, "locationName" | "officialUrl" | "expectedAdapter">, text: string, title = "") {
  const compact = normalizeH36Text(`${title} ${text}`).replace(/[\s`'’・]/g, "").toLocaleLowerCase();
  if (location.expectedAdapter === "orangetheory") {
    const branchPath = new URL(location.officialUrl).pathname.split("/").filter(Boolean)[0]?.toLocaleLowerCase();
    const branchName = location.locationName.replace(/オレンジセオリーフィットネス|\s/g, "").toLocaleLowerCase();
    return !!branchPath && (compact.includes(branchPath) || compact.includes(branchName));
  }
  if (location.expectedAdapter === "ufc-gym") return compact.includes(location.locationName.replace(/ufc\s*gym|\s/gi, "").toLocaleLowerCase());
  if (location.expectedAdapter === "golds-gym") {
    const normalizedName = location.locationName.normalize("NFKC").replace(/[`'’・]/g, "");
    const name = normalizedName.replace(/powered\s*by\s*gold\s*s\s*gym|ゴールドジム|gold\s*s\s*gym|\s|[()（）]/gi, "").toLocaleLowerCase();
    return name.length >= 3 && compact.includes(name);
  }
  return true;
}

function statusFor(httpStatus: number, redirected: boolean): H36CollectedPage["status"] {
  if (httpStatus >= 200 && httpStatus < 400) return redirected ? "REDIRECTED_VALID" : "AVAILABLE";
  if (httpStatus === 401 || httpStatus === 403 || httpStatus === 429) return "ACCESS_RESTRICTED";
  if (httpStatus === 404 || httpStatus === 410) return "NOT_FOUND";
  if (httpStatus === 408 || httpStatus >= 500) return "TEMPORARILY_UNREACHABLE";
  return "UNKNOWN";
}

async function fetchPage(url: string, checkedAt: string, options: { fetchImpl?: typeof fetch; timeoutMs?: number; retries?: number }) {
  const fetchImpl = options.fetchImpl ?? fetch; const retries = options.retries ?? 1; let attempts = 0;
  for (;;) {
    attempts += 1;
    try {
      const response = await fetchImpl(url, { method: "GET", redirect: "follow", signal: AbortSignal.timeout(options.timeoutMs ?? 15_000),
        headers: { Accept: "text/html,*/*;q=0.5", "User-Agent": "GymMap-HYROX-targeted-evidence/1.0 (+https://gymmap.vercel.app/training/hyrox)" } });
      const status = statusFor(response.status, response.redirected || (!!response.url && response.url !== url));
      if (status === "TEMPORARILY_UNREACHABLE" && attempts <= retries) continue;
      const html = response.ok ? (await response.text()).slice(0, 2_000_000) : ""; const text = normalizeH36Text(html);
      const title = normalizeH36Text(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "");
      return { url, finalUrl: response.url || url, status, httpStatus: response.status, attempts, title, normalizedText: text, signals: extractH36Signals(text), checkedAt };
    } catch {
      if (attempts <= retries) continue;
      return { url, finalUrl: null, status: "TEMPORARILY_UNREACHABLE" as const, httpStatus: null, attempts, title: "", normalizedText: "", signals: [], checkedAt };
    }
  }
}

async function mapConcurrent<T, R>(values: T[], concurrency: number, operation: (value: T) => Promise<R>) {
  const results = new Array<R>(values.length); let cursor = 0;
  await Promise.all(Array.from({ length: Math.min(concurrency, values.length) }, async () => {
    for (;;) { const index = cursor++; if (index >= values.length) return; results[index] = await operation(values[index]); }
  }));
  return results;
}

export async function collectH36Sources(cohort: H36CohortArtifact, options: { checkedAt: string; concurrency?: number; fetchImpl?: typeof fetch; timeoutMs?: number; retries?: number }): Promise<H36DiscoveryRun> {
  const plans = buildH36DiscoveryPlan(cohort); const urls = [...new Set(plans.map((plan) => plan.url))].sort(); const concurrency = options.concurrency ?? 4;
  if (concurrency < 1 || concurrency > 6) throw new Error("H3-6 source concurrency must be 1-6");
  const pages = await mapConcurrent(urls, concurrency, (url) => fetchPage(url, options.checkedAt, options));
  const attempts = pages.reduce((sum, page) => sum + page.attempts, 0);
  return { schemaVersion: 1, checkedAt: options.checkedAt, readOnly: true, concurrency, plans, pages: pages.map((page) => ({
    url: page.url, finalUrl: page.finalUrl, status: page.status, httpStatus: page.httpStatus, attempts: page.attempts,
    title: page.title, normalizedText: page.normalizedText, signals: page.signals,
  })),
    requestStats: { uniqueUrls: urls.length, attempts, retries: attempts - urls.length } };
}
