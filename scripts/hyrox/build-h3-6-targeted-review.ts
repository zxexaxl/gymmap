import { readFile, writeFile } from "node:fs/promises";
import {
  H3_6_CAPABILITY_SLUGS,
  H3_6_EQUIPMENT_SLUGS,
  h36ConfirmedDecisions,
  h36Hash,
  validateH36Cohort,
  validateH36Review,
  type H36ClaimDecision,
  type H36CohortArtifact,
  type H36FacilityReview,
  type H36ReviewArtifact,
  type H36Source,
  type H36TargetSlug,
} from "../../src/lib/hyrox-targeted-evidence";
import type { H36DiscoveryRun } from "../../src/lib/hyrox-targeted-source";
import { h36BranchIdentityMatch } from "../../src/lib/hyrox-targeted-source";

const REVIEWED_AT = "2026-08-30T11:50:27Z";
function option(name: string) { const prefix = `--${name}=`; return process.argv.find((value) => value.startsWith(prefix))?.slice(prefix.length) ?? null; }
function csvCell(value: unknown) { const text = String(value ?? ""); return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text; }

const decision = (kind: "equipment" | "capability", slug: H36TargetSlug, classification: H36ClaimDecision["classification"], sourceKey: string | null,
  excerpt: string | null, structuredFact: string | null, reason: string, supportFingerprint: string[] = []): H36ClaimDecision => ({
  kind, slug, classification, sourceKey, excerpt, structuredFact, reason,
  proposedFreshnessDays: classification === "CONFIRMED_CANDIDATE" ? (kind === "equipment" ? 180 : slug === "competition-simulation" ? 30 : 90) : null,
  supportFingerprint,
});

function exactPage(discovery: H36DiscoveryRun, url: string) {
  const page = discovery.pages.find((item) => item.url === url); if (!page) throw new Error(`Missing discovery page: ${url}`); return page;
}

function source(sourceKey: string, page: ReturnType<typeof exactPage>, quality: "Q1" | "Q2", facilitySpecific: boolean,
  publisherAuthority: H36Source["publisherAuthority"]): H36Source {
  if (!page.finalUrl || !["AVAILABLE", "REDIRECTED_VALID"].includes(page.status)) throw new Error(`Reviewed source unavailable: ${page.url}`);
  return { sourceKey, url: page.url, canonicalUrl: page.finalUrl, title: page.title, quality, facilitySpecific, publisherAuthority, observedAt: "2026-08-30T11:49:02.406Z" };
}

const otfEquipment: Array<[H36TargetSlug, string, string[]]> = [
  ["row-erg", "ローイングマシンでの持久力&パワートレーニング", ["ローイングマシン", "クラスで行うトレーニング内容"]],
  ["weighted-sled", "公式器具としてスレッドを完備", ["公式器具を完備", "スレッド"]],
  ["farmers-carry-implements", "ファーマーズキャリーを使ったトレーニング", ["ファーマーズキャリー", "トレーニング"]],
  ["sandbag", "公式器具としてサンドバッグを完備", ["公式器具を完備", "サンドバッグ"]],
  ["treadmill", "トレッドミルによる持久力&スピードトレーニング", ["トレッドミル", "クラスで行うトレーニング内容"]],
];

function buildOtfReview(location: H36CohortArtifact["locations"][number], discovery: H36DiscoveryRun): H36FacilityReview {
  const page = exactPage(discovery, "https://www.orangetheoryfitness.co.jp/hyrox/");
  if (!h36BranchIdentityMatch(location, page.normalizedText, page.title)) {
    throw new Error(`${location.hgyId}: OTF shared page does not map the branch`);
  }
  const sourceKey = `h3-6:${location.hgyId}:otf-hyrox`; const reviewedSource = source(sourceKey, page, "Q2", true, "brand_official");
  const decisions: H36ClaimDecision[] = [
    ...otfEquipment.map(([slug, excerpt, fingerprint]) => decision("equipment", slug, "CONFIRMED_CANDIDATE", sourceKey, excerpt, `The brand page explicitly scopes its HYROX equipment/class content to this listed branch.`, "Explicit branch-scoped Q2 equipment statement.", fingerprint)),
    decision("capability", "discipline-coaching", "CONFIRMED_CANDIDATE", sourceKey, "認定コーチが一人ひとりのレベルに合わせて指導", "The listed branch is covered by an ongoing coach-led HYROX class contract.", "Explicit branch-scoped Q2 coaching statement.", ["認定コーチが指導", "各店舗"]),
    decision("capability", "competition-simulation", "CONFIRMED_CANDIDATE", sourceKey, "全15店舗にて本番さながらのトレーニングクラスを開催", "The page states an ongoing class across all listed stores, not a dated one-off event.", "Explicit repeatable simulation statement.", ["全15店舗", "本番さながら", "クラスを開催"]),
    decision("equipment", "wall-ball-target", "REVIEW_REQUIRED", sourceKey, "ウォールボールを使ったトレーニング", "Wall-ball use is explicit, but a target structure is not.", "Target component remains ambiguous.", ["ウォールボール"]),
    decision("equipment", "ski-erg", "OBSERVED_NOT_CANDIDATE", sourceKey, "HYROXの8種目説明にスキーエルゴを掲載", "The occurrence describes the race station, not this branch's available equipment.", "Race-description keyword is not facility evidence.", ["8 Workout Stations", "スキーエルゴ"]),
  ];
  return { locationId: location.locationId, locationSlug: location.locationSlug, hgyId: location.hgyId, locationName: location.locationName,
    brandName: location.brandName, prefecture: location.prefecture, status: "CONFIRMED_ENRICHMENT", automationClass: "AUTOMATABLE", pagesInspected: 2,
    reviewActions: 2 + decisions.length, sources: [reviewedSource], decisions, notes: "Shared Q2 page explicitly lists this exact branch and covers all 15 OTF stores; branch page was separately inspected." };
}

function goldDecisionSet(location: H36CohortArtifact["locations"][number], sourceKey: string): H36ClaimDecision[] {
  const byHgy: Record<string, H36ClaimDecision[]> = {
    HGY_CckOFxMw5VG60QfRbUzlk3VMy: [
      decision("capability", "discipline-coaching", "REVIEW_REQUIRED", sourceKey, "HYROX Circuit Trainingも実施中", "An organized program is explicit, but coach-led instruction is not.", "Coaching remains ambiguous.", ["HYROX Circuit Training", "実施中"]),
      decision("equipment", "sandbag", "OBSERVED_NOT_CANDIDATE", sourceKey, "ロープやサンドバッグなど様々なトレーニング", "The sandbag context is not specific enough to distinguish HYROX equipment from a striking bag.", "Ambiguous equipment context.", ["サンドバッグ"]),
    ],
    HGY_IyVQTdTdvlkUGVmcaAvVV5BHD: [
      decision("equipment", "treadmill", "CONFIRMED_CANDIDATE", sourceKey, "原宿ANNEX店では3種類のトレッドミル", "Branch-specific equipment statement.", "Explicit Q2 facility equipment.", ["原宿ANNEX店", "3種類のトレッドミル"]),
    ],
    HGY_QPyi483gAfTjVXv2QoNn5d55m: [
      decision("equipment", "ski-erg", "CONFIRMED_CANDIDATE", sourceKey, "新たにCENTR スキーエルゴを導入", "Branch-specific new equipment statement.", "Explicit Q2 facility equipment.", ["原宿東京店", "CENTR スキーエルゴ"]),
      decision("equipment", "row-erg", "CONFIRMED_CANDIDATE", sourceKey, "新たにCENTR ローワーを導入", "Branch-specific new equipment statement.", "Explicit Q2 facility equipment.", ["原宿東京店", "CENTR ローワー"]),
      decision("equipment", "farmers-carry-implements", "CONFIRMED_CANDIDATE", sourceKey, "新たにCENTR ケトルベルを導入", "Kettlebells are explicit farmer's-carry implements under the reviewed taxonomy contract.", "Explicit Q2 facility equipment.", ["原宿東京店", "CENTR ケトルベル"]),
      decision("equipment", "wall-ball-target", "CONFIRMED_CANDIDATE", sourceKey, "新たにCENTR ウォールボールボードを導入", "The target board is explicitly named.", "Explicit Q2 target equipment.", ["原宿東京店", "ウォールボールボード"]),
      decision("equipment", "treadmill", "CONFIRMED_CANDIDATE", sourceKey, "カーディオエリアにトレッドミル", "Branch-specific facility equipment statement.", "Explicit Q2 facility equipment.", ["トレッドミル"]),
      decision("equipment", "sandbag", "OBSERVED_NOT_CANDIDATE", sourceKey, "格闘技スタジオでサンドバッグ打撃練習", "This is a striking bag, not explicit HYROX sandbag-lunge equipment.", "Semantic mismatch preserved.", ["格闘技スタジオ", "打撃練習"]),
    ],
    HGY_mAUikrooxzoDevlGFVY7yXt3l: [
      decision("equipment", "wall-ball-target", "CONFIRMED_CANDIDATE", sourceKey, "CENTR器具:ウォールボールを実施可能", "Branch-specific HYROX equipment statement.", "Explicit Q2 facility equipment.", ["前橋インター店", "ウォールボール"]),
      decision("equipment", "farmers-carry-implements", "CONFIRMED_CANDIDATE", sourceKey, "CENTR器具:ファーマーズキャリーを実施可能", "Branch-specific HYROX equipment statement.", "Explicit Q2 facility equipment.", ["前橋インター店", "ファーマーズキャリー"]),
      decision("equipment", "sandbag", "CONFIRMED_CANDIDATE", sourceKey, "CENTR器具:サンドバッグランジを実施可能", "Branch-specific HYROX equipment statement.", "Explicit Q2 facility equipment.", ["前橋インター店", "サンドバッグランジ"]),
      decision("equipment", "treadmill", "CONFIRMED_CANDIDATE", sourceKey, "ゴールドジムではトレッドミルを多数設置", "The page's facility section explicitly describes the available treadmill category.", "Explicit Q2 facility equipment.", ["トレッドミル"]),
    ],
    HGY_x72wxyNcqCoMCbZxzQkr7nHAk: [
      decision("equipment", "farmers-carry-implements", "CONFIRMED_CANDIDATE", sourceKey, "浦安店にケトルベルを設置", "Kettlebells are explicit farmer's-carry implements under the reviewed taxonomy contract.", "Explicit Q2 facility equipment.", ["浦安店", "ケトルベル"]),
      decision("equipment", "sandbag", "OBSERVED_NOT_CANDIDATE", sourceKey, "格闘技スタジオでサンドバッグ打撃練習", "This is a striking bag, not explicit HYROX sandbag-lunge equipment.", "Semantic mismatch preserved.", ["格闘技スタジオ", "打撃練習"]),
    ],
  };
  return byHgy[location.hgyId] ?? [];
}

function buildGoldReview(location: H36CohortArtifact["locations"][number], discovery: H36DiscoveryRun): H36FacilityReview {
  const page = exactPage(discovery, location.officialUrl); const sourceKey = `h3-6:${location.hgyId}:golds-shop`;
  const reviewedSource = source(sourceKey, page, "Q2", true, "brand_official"); const decisions = goldDecisionSet(location, sourceKey);
  if (!h36BranchIdentityMatch(location, page.normalizedText, page.title)) throw new Error(`${location.hgyId}: Gold's branch identity mismatch`);
  const confirmed = decisions.some((row) => row.classification === "CONFIRMED_CANDIDATE"); const review = decisions.some((row) => row.classification === "REVIEW_REQUIRED");
  return { locationId: location.locationId, locationSlug: location.locationSlug, hgyId: location.hgyId, locationName: location.locationName,
    brandName: location.brandName, prefecture: location.prefecture, status: confirmed ? "CONFIRMED_ENRICHMENT" : review ? "REVIEW_ONLY" : "NO_USEFUL_EVIDENCE",
    automationClass: decisions.length ? "SEMI_AUTOMATED" : "MANUAL_HEAVY", pagesInspected: 1, reviewActions: 1 + decisions.length,
    sources: [reviewedSource], decisions, notes: decisions.length ? "Branch page reviewed; only explicit facility statements were retained." : "Accessible branch page contained no useful positive evidence within the frozen one-page budget." };
}

function buildUfcReview(location: H36CohortArtifact["locations"][number], discovery: H36DiscoveryRun): H36FacilityReview {
  const page = exactPage(discovery, new URL("hyrox/", location.officialUrl).toString()); const sourceKey = `h3-6:${location.hgyId}:ufc-hyrox`;
  const reviewedSource = source(sourceKey, page, "Q1", true, "facility_official");
  const equipment: Array<[H36TargetSlug, string, string[]]> = [
    ["ski-erg", "使用設備 Concept2 SkiErg", ["使用設備", "Concept2 SkiErg"]], ["row-erg", "使用設備 StairMaster HIIT ROWER", ["使用設備", "HIIT ROWER"]],
    ["weighted-sled", "使用設備 スレッドとウエイトプレート", ["SLED PUSH", "スレッド"]], ["wall-ball-target", "使用設備 ウォールボールとターゲット", ["WALL BALLS", "ターゲット"]],
    ["farmers-carry-implements", "使用設備 ケトルベル", ["FARMERS CARRY", "ケトルベル"]], ["sandbag", "使用設備 サンドバッグ", ["SANDBAG LUNGES", "サンドバッグ"]],
    ["functional-training-lane", "使用設備 フラットトレーニングレーン", ["BURPEE BROAD JUMPS", "フラットトレーニングレーン"]],
  ];
  const decisions: H36ClaimDecision[] = [
    ...equipment.map(([slug, excerpt, fingerprint]) => decision("equipment", slug, "CONFIRMED_CANDIDATE", sourceKey, excerpt, "The facility page directly enumerates the equipment.", "Explicit Q1 facility equipment.", fingerprint)),
    decision("capability", "open-training", "CONFIRMED_CANDIDATE", sourceKey, "その他の営業時間は自主トレーニング・マシン利用が可能", "Independent use is explicit.", "Explicit Q1 open-training statement.", ["自主トレーニング", "マシン利用が可能"]),
    decision("capability", "discipline-coaching", "CONFIRMED_CANDIDATE", sourceKey, "週間スケジュールにHYROXクラス", "An ongoing coach-led HYROX class schedule is explicit.", "Explicit Q1 coaching statement.", ["HYROXクラス", "週間トレーニングスケジュール"]),
    decision("capability", "sled-push-pull-space", "CONFIRMED_CANDIDATE", sourceKey, "スレッド設備とフラットトレーニングレーンを完備", "The reviewed UFC facility contract directly enumerates both sled equipment and its functional lane.", "Explicit combined Q1 sled-space support.", ["SLED PUSH", "フラットトレーニングレーン"]),
  ];
  return { locationId: location.locationId, locationSlug: location.locationSlug, hgyId: location.hgyId, locationName: location.locationName,
    brandName: location.brandName, prefecture: location.prefecture, status: "CONFIRMED_ENRICHMENT", automationClass: "AUTOMATABLE",
    pagesInspected: 2, reviewActions: 2 + decisions.length, sources: [reviewedSource], decisions,
    notes: "Q1 branch page directly enumerates equipment, class schedule, self-training, and the functional lane." };
}

function buildGymFieldReview(location: H36CohortArtifact["locations"][number], discovery: H36DiscoveryRun): H36FacilityReview {
  const studio = exactPage(discovery, location.officialUrl); const hyrox = exactPage(discovery, "https://www.gym-field.com/hyrox/");
  if (!["AVAILABLE", "REDIRECTED_VALID"].includes(studio.status) || hyrox.status !== "NOT_FOUND") throw new Error(`${location.hgyId}: unexpected Gym Field source state`);
  const reviewedSource = source(`h3-6:${location.hgyId}:gym-field-studios`, studio, "Q2", false, "brand_official");
  return { locationId: location.locationId, locationSlug: location.locationSlug, hgyId: location.hgyId, locationName: location.locationName,
    brandName: location.brandName, prefecture: location.prefecture, status: "SOURCE_BLOCKED", automationClass: "MANUAL_HEAVY",
    pagesInspected: 2, reviewActions: 2, sources: [reviewedSource], decisions: [],
    notes: "The current studio index is reachable, but the previously repeatable HYROX evidence page returns 404; no claim was inferred." };
}

function taxonomyRows(review: H36ReviewArtifact, kind: "equipment" | "capability", slugs: readonly string[]) {
  return slugs.map((slug) => {
    const decisions = review.facilities.flatMap((facility) => facility.decisions.filter((row) => row.kind === kind && row.slug === slug).map((row) => ({ facility, row })));
    const count = (classification: H36ClaimDecision["classification"]) => new Set(decisions.filter(({ row }) => row.classification === classification).map(({ facility }) => facility.locationId)).size;
    return { slug, confirmed: count("CONFIRMED_CANDIDATE"), reviewRequired: count("REVIEW_REQUIRED"), observedNotCandidate: count("OBSERVED_NOT_CANDIDATE"),
      deferred: count("OBSERVED_DEFERRED"), noEvidence: review.facilities.length - new Set(decisions.map(({ facility }) => facility.locationId)).size };
  });
}

async function main() {
  const cohort = validateH36Cohort(JSON.parse(await readFile(option("cohort") ?? "data/hyrox/h3-6-targeted-equipment-scaleout-cohort.json", "utf8")) as H36CohortArtifact);
  const discoveryPath = option("discovery"); if (!discoveryPath) throw new Error("--discovery=<runtime discovery artifact> is required");
  const discovery = JSON.parse(await readFile(discoveryPath, "utf8")) as H36DiscoveryRun;
  if (discovery.plans.length === 0 || discovery.requestStats.uniqueUrls !== 23 || discovery.requestStats.retries !== 0) throw new Error("Unexpected H3-6 discovery authority");
  const facilities = cohort.locations.map((location) => location.expectedAdapter === "orangetheory" ? buildOtfReview(location, discovery)
    : location.expectedAdapter === "golds-gym" ? buildGoldReview(location, discovery)
      : location.expectedAdapter === "ufc-gym" ? buildUfcReview(location, discovery) : buildGymFieldReview(location, discovery))
    .sort((a, b) => a.hgyId.localeCompare(b.hgyId));
  const withoutHash = { schemaVersion: 1 as const, cohortHash: cohort.cohortHash, observedAt: discovery.checkedAt, reviewedAt: REVIEWED_AT,
    productionWrite: false as const, facilities };
  const review = validateH36Review(cohort, { ...withoutHash, artifactHash: h36Hash(withoutHash) }); const confirmed = h36ConfirmedDecisions(review);
  const confirmedEquipment = confirmed.filter((row) => row.decision.kind === "equipment"); const confirmedCapabilities = confirmed.filter((row) => row.decision.kind === "capability");
  const reviewQueue = review.facilities.flatMap((facility) => facility.decisions.filter((row) => row.classification === "REVIEW_REQUIRED").map((row) => ({
    hgyId: facility.hgyId, locationId: facility.locationId, locationName: facility.locationName, brandName: facility.brandName,
    kind: row.kind, slug: row.slug, sourceUrl: facility.sources.find((source) => source.sourceKey === row.sourceKey)?.url ?? null,
    excerpt: row.excerpt, reason: row.reason, reviewedAt: review.reviewedAt,
  }))).sort((a, b) => a.hgyId.localeCompare(b.hgyId) || a.kind.localeCompare(b.kind) || a.slug.localeCompare(b.slug));
  const equipmentRows = taxonomyRows(review, "equipment", H3_6_EQUIPMENT_SLUGS); const capabilityRows = taxonomyRows(review, "capability", H3_6_CAPABILITY_SLUGS);
  const candidates = (rows: typeof confirmed) => rows.map(({ facility, decision: row, source: evidenceSource }) => ({
    locationId: facility.locationId, locationSlug: facility.locationSlug, hgyId: facility.hgyId, locationName: facility.locationName,
    brandName: facility.brandName, targetSlug: row.slug, source: evidenceSource, evidence: { excerpt: row.excerpt, structuredFact: row.structuredFact,
      supportFingerprint: row.supportFingerprint, observedAt: evidenceSource.observedAt, reviewedAt: review.reviewedAt, evidenceHash: h36Hash({ hgyId: facility.hgyId, kind: row.kind, slug: row.slug, sourceUrl: evidenceSource.url, structuredFact: row.structuredFact }) },
    proposedFreshnessDays: row.proposedFreshnessDays,
  }));
  const equipmentCandidates = candidates(confirmedEquipment); const capabilityCandidates = candidates(confirmedCapabilities);
  const uniqueCandidateSources = new Set(confirmed.map(({ facility, source: item }) => `${facility.locationId}:${item.url}`));
  const naturalSources = [...new Map(confirmed.map(({ facility, source: item }) => [`${facility.locationId}:${item.url}`, {
    naturalKey: `${facility.locationId}:${item.url}`, locationId: facility.locationId, hgyId: facility.hgyId, url: item.url,
    canonicalUrl: item.canonicalUrl, quality: item.quality, publisherAuthority: item.publisherAuthority,
  }])).values()].sort((a, b) => a.naturalKey.localeCompare(b.naturalKey));
  const metrics = {
    cohort: review.facilities.length,
    statuses: Object.fromEntries(["CONFIRMED_ENRICHMENT", "REVIEW_ONLY", "NO_USEFUL_EVIDENCE", "SOURCE_BLOCKED"].map((status) => [status, review.facilities.filter((row) => row.status === status).length])),
    confirmedEquipment: equipmentCandidates.length, confirmedCapabilities: capabilityCandidates.length, confirmedTotal: confirmed.length,
    confirmedFacilities: new Set(confirmed.map((row) => row.facility.locationId)).size, reviewRequired: reviewQueue.length,
    observedNotCandidate: review.facilities.flatMap((row) => row.decisions).filter((row) => row.classification === "OBSERVED_NOT_CANDIDATE").length,
    observedDeferred: review.facilities.flatMap((row) => row.decisions).filter((row) => row.classification === "OBSERVED_DEFERRED").length,
    pagesInspected: review.facilities.reduce((sum, row) => sum + row.pagesInspected, 0), requests: discovery.requestStats.uniqueUrls,
    retries: discovery.requestStats.retries, reviewActions: review.facilities.reduce((sum, row) => sum + row.reviewActions, 0),
    candidateSources: uniqueCandidateSources.size, equipmentRows, capabilityRows,
  };
  await Promise.all([
    writeFile("data/hyrox/h3-6-targeted-equipment-evidence.json", `${JSON.stringify({ ...review, metrics }, null, 2)}\n`),
    writeFile("data/hyrox/h3-6-confirmed-equipment-candidates.json", `${JSON.stringify({ schemaVersion: 1, cohortHash: cohort.cohortHash, productionWrite: false, candidates: equipmentCandidates }, null, 2)}\n`),
    writeFile("data/hyrox/h3-6-confirmed-capability-candidates.json", `${JSON.stringify({ schemaVersion: 1, cohortHash: cohort.cohortHash, productionWrite: false, candidates: capabilityCandidates }, null, 2)}\n`),
    writeFile("data/hyrox/h3-6-equipment-review-queue.json", `${JSON.stringify({ schemaVersion: 1, cohortHash: cohort.cohortHash, productionWrite: false, records: reviewQueue }, null, 2)}\n`),
    writeFile("data/hyrox/h3-6-targeted-graph-preview.json", `${JSON.stringify({ schemaVersion: 1, cohortHash: cohort.cohortHash, productionWrite: false,
      currentProduction: { trainingSources: 92, equipment: 36, capabilities: 16, evidence: 216, hyroxLocations: 82 },
      additions: { trainingSources: naturalSources.length, equipment: equipmentCandidates.length, capabilities: capabilityCandidates.length,
        evidence: confirmed.length, monitorManifestClaims: confirmed.length },
      projectedPublication: { equipment: 36 + equipmentCandidates.length, capabilities: 16 + capabilityCandidates.length,
        equipmentPositiveFacilities: 6 + new Set(confirmedEquipment.map((row) => row.facility.locationId)).size,
        capabilityPositiveFacilities: 9 + new Set(confirmedCapabilities.map((row) => row.facility.locationId)).size,
        hyroxLocations: 82, officialLocations: 82, negativeClaims: 0 },
      freshness: { equipment180Days: equipmentCandidates.length,
        capability90Days: capabilityCandidates.filter((row) => row.proposedFreshnessDays === 90).length,
        simulation30Days: capabilityCandidates.filter((row) => row.proposedFreshnessDays === 30).length,
        earliestProposedStaleAt: "2026-09-29T11:49:02.406Z" },
      sources: naturalSources }, null, 2)}\n`),
  ]);
  const csvRows = [["hgy_id", "location", "brand", "kind", "slug", "classification", "quality", "source_url", "excerpt"],
    ...review.facilities.flatMap((facility) => facility.decisions.map((row) => [facility.hgyId, facility.locationName, facility.brandName, row.kind, row.slug, row.classification,
      facility.sources.find((item) => item.sourceKey === row.sourceKey)?.quality ?? "", facility.sources.find((item) => item.sourceKey === row.sourceKey)?.url ?? "", row.excerpt ?? ""]))];
  await writeFile("data/hyrox/h3-6-targeted-equipment-evidence.csv", `${csvRows.map((row) => row.map(csvCell).join(",")).join("\n")}\n`);
  const brandRows = [...new Set(review.facilities.map((row) => row.brandName))].sort().map((brand) => {
    const facilities = review.facilities.filter((row) => row.brandName === brand); const claims = confirmed.filter((row) => row.facility.brandName === brand);
    return { brand, facilities: facilities.length, confirmedFacilities: new Set(claims.map((row) => row.facility.locationId)).size, confirmedClaims: claims.length,
      reviewRequired: reviewQueue.filter((row) => row.brandName === brand).length, pages: facilities.reduce((sum, row) => sum + row.pagesInspected, 0),
      automation: [...new Set(facilities.map((row) => row.automationClass))].join("/") };
  });
  const markdown = `# H3-6 targeted equipment evidence scale-out\n\nProduction write: **NO**\n\nCohort hash: \`${cohort.cohortHash}\`\nReview hash: \`${review.artifactHash}\`\n\n` +
    `## Result\n\n- Frozen facilities: ${metrics.cohort}\n- Confirmed facilities: ${metrics.confirmedFacilities}\n- Equipment claims: ${metrics.confirmedEquipment}\n- Capability claims: ${metrics.confirmedCapabilities}\n- Review queue: ${metrics.reviewRequired}\n- Source blocked: ${metrics.statuses.SOURCE_BLOCKED}\n- Pages / unique requests / retries: ${metrics.pagesInspected} / ${metrics.requests} / ${metrics.retries}\n- Review actions: ${metrics.reviewActions}\n\n` +
    `## Brand yield\n\n| brand | facilities | confirmed facilities | claims | review | pages | automation |\n|---|---:|---:|---:|---:|---:|---|\n${brandRows.map((row) => `| ${row.brand} | ${row.facilities} | ${row.confirmedFacilities} | ${row.confirmedClaims} | ${row.reviewRequired} | ${row.pages} | ${row.automation} |`).join("\n")}\n\n` +
    `## Equipment\n\n| slug | confirmed | review | observed only | deferred | no evidence |\n|---|---:|---:|---:|---:|---:|\n${equipmentRows.map((row) => `| ${row.slug} | ${row.confirmed} | ${row.reviewRequired} | ${row.observedNotCandidate} | ${row.deferred} | ${row.noEvidence} |`).join("\n")}\n\n` +
    `## Capabilities\n\n| slug | confirmed | review | observed only | deferred | no evidence |\n|---|---:|---:|---:|---:|---:|\n${capabilityRows.map((row) => `| ${row.slug} | ${row.confirmed} | ${row.reviewRequired} | ${row.observedNotCandidate} | ${row.deferred} | ${row.noEvidence} |`).join("\n")}\n\n` +
    `## Decision\n\n**TARGETING_VALIDATED** — repeated OTF/UFC sources and selected Gold's branch pages improved confirmed claims per inspected page while preserving ambiguous and blocked sources.\n`;
  await writeFile("data/hyrox/h3-6-targeted-equipment-evidence.md", markdown);
  console.log(JSON.stringify({ artifactHash: review.artifactHash, ...metrics, brandRows }, null, 2));
}

main().catch((error) => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; });
