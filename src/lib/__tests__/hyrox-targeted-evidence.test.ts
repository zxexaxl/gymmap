import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  classifyH36EvidenceSignal,
  h36ConfirmedDecisions,
  h36Hash,
  validateH36Cohort,
  validateH36Review,
  type H36CohortArtifact,
  type H36ReviewArtifact,
} from "../hyrox-targeted-evidence";
import {
  buildH36DiscoveryPlan,
  collectH36Sources,
  extractH36Signals,
  h36BranchIdentityMatch,
} from "../hyrox-targeted-source";

const cohortPath = new URL("../../../data/hyrox/h3-6-targeted-equipment-scaleout-cohort.json", import.meta.url);
const reviewPath = new URL("../../../data/hyrox/h3-6-targeted-equipment-evidence.json", import.meta.url);

async function load() {
  const cohort = validateH36Cohort(JSON.parse(await readFile(cohortPath, "utf8")) as H36CohortArtifact);
  const review = validateH36Review(cohort, JSON.parse(await readFile(reviewPath, "utf8")) as H36ReviewArtifact);
  return { cohort, review };
}

test("frozen cohort preserves 82 minus 15 equals 67 authority and the bounded tranche", async () => {
  const { cohort } = await load();
  assert.equal(cohort.authority.currentOfficial, 82);
  assert.equal(cohort.authority.h3_3Sample, 15);
  assert.equal(cohort.authority.remaining, 67);
  assert.equal(cohort.locations.length, 21);
  assert.equal(cohort.selectionContract.maxFacilities, 25);
  assert.equal(cohort.selectionContract.evidenceBlind, true);
  assert.equal(cohort.cohortHash, "1cb18ad83aba8a0c71898780995856c2ba8bd49b61eb00b6874184637e1d9c0f");
  assert.equal(h36Hash(cohort), cohort.cohortHash);
  assert.deepEqual(Object.fromEntries([...new Set(cohort.locations.map((row) => row.brandName))].sort().map((brand) =>
    [brand, cohort.locations.filter((row) => row.brandName === brand).length])), {
    "Gold's Gym": 7, "Orangetheory Fitness": 11, "UFC GYM": 1, "ジムフィールド": 2,
  });
  assert.ok(cohort.locations.every((row) => row.previousH3_3Sample === false));
});

test("discovery plan is adapter-bounded and never expands to all remaining facilities", async () => {
  const { cohort } = await load();
  const plan = buildH36DiscoveryPlan(cohort);
  assert.equal(cohort.locations.length, 21);
  assert.equal(new Set(plan.map((row) => row.url)).size, 23);
  assert.ok(plan.every((row) => cohort.locations.some((location) => location.locationId === row.locationId)));
  assert.ok(cohort.locations.every((location) => plan.filter((row) => row.locationId === location.locationId).length <= 2));
});

test("review freezes explicit Q1/Q2 positives and preserves ambiguity", async () => {
  const { review } = await load();
  const confirmed = h36ConfirmedDecisions(review);
  assert.equal(confirmed.length, 98);
  assert.equal(confirmed.filter((row) => row.decision.kind === "equipment").length, 73);
  assert.equal(confirmed.filter((row) => row.decision.kind === "capability").length, 25);
  assert.equal(new Set(confirmed.map((row) => row.facility.locationId)).size, 16);
  assert.ok(confirmed.every((row) => ["Q1", "Q2"].includes(row.source.quality) && row.source.facilitySpecific));
  assert.equal(review.facilities.flatMap((row) => row.decisions).filter((row) => row.classification === "REVIEW_REQUIRED").length, 12);
  assert.equal(review.facilities.flatMap((row) => row.decisions).filter((row) => row.classification === "OBSERVED_NOT_CANDIDATE").length, 14);
  assert.equal(review.facilities.flatMap((row) => row.decisions).filter((row) => row.classification === "OBSERVED_DEFERRED").length, 0);
});

test("authority quality and explicit-evidence rules fail closed", () => {
  assert.equal(classifyH36EvidenceSignal({ quality: "Q1", facilitySpecific: true, explicitPositive: true, semanticMatch: true }), "CONFIRMED_CANDIDATE");
  assert.equal(classifyH36EvidenceSignal({ quality: "Q2", facilitySpecific: true, explicitPositive: true, semanticMatch: true }), "CONFIRMED_CANDIDATE");
  assert.equal(classifyH36EvidenceSignal({ quality: "Q3", facilitySpecific: true, explicitPositive: true, semanticMatch: true }), "REVIEW_REQUIRED");
  assert.equal(classifyH36EvidenceSignal({ quality: "Q4", facilitySpecific: true, explicitPositive: true, semanticMatch: true }), "OBSERVED_NOT_CANDIDATE");
  assert.equal(classifyH36EvidenceSignal({ quality: "Q5", facilitySpecific: true, explicitPositive: true, semanticMatch: true }), "OBSERVED_NOT_CANDIDATE");
  assert.equal(classifyH36EvidenceSignal({ quality: "Q1", facilitySpecific: true, explicitPositive: false, semanticMatch: true }), "NO_EVIDENCE_FOUND");
  assert.equal(classifyH36EvidenceSignal({ quality: "Q1", facilitySpecific: true, explicitPositive: true, semanticMatch: false }), "OBSERVED_NOT_CANDIDATE");
  assert.equal(classifyH36EvidenceSignal({ quality: "Q1", facilitySpecific: true, explicitPositive: true, semanticMatch: true, deferred: true }), "OBSERVED_DEFERRED");
  assert.equal(classifyH36EvidenceSignal({ quality: "Q1", facilitySpecific: true, explicitPositive: true, semanticMatch: true, capabilityRequirementMet: false }), "REVIEW_REQUIRED");
});

test("equipment and capability signals remain discovery hints, not automatic claims", () => {
  const signals = extractH36Signals("Concept2 SkiErg and RowErg. HYROX coaching. Open gym. Sled training article.");
  assert.ok(signals.some((row) => row.slug === "ski-erg"));
  assert.ok(signals.some((row) => row.slug === "row-erg"));
  assert.ok(signals.some((row) => row.slug === "discipline-coaching"));
  assert.ok(signals.some((row) => row.slug === "open-training"));
  assert.ok(signals.some((row) => row.slug === "weighted-sled"));
  assert.ok(!signals.some((row) => row.slug === "sled-push-pull-space"));
  assert.ok(!signals.some((row) => row.slug === "competition-simulation"));
});

test("brand adapters require branch identity and tolerate reviewed naming punctuation", async () => {
  const { cohort } = await load();
  const orange = cohort.locations.find((row) => row.expectedAdapter === "orangetheory")!;
  assert.equal(h36BranchIdentityMatch(orange, `Official ${orange.locationName} branch page`), true);
  assert.equal(h36BranchIdentityMatch(orange, "A different branch page"), false);
  const boutique = cohort.locations.find((row) => row.locationSlug.includes("muscle-gate"))!;
  assert.equal(h36BranchIdentityMatch(boutique, "", "MUSCLE GATE HOTEL GYM BOUTIQUE powered by GOLD'S GYM"), true);
  assert.equal(h36BranchIdentityMatch(boutique, "Gold's Gym unrelated branch"), false);
});

test("collector fetches shared sources once, retries transient failures, and never writes", async () => {
  const { cohort } = await load();
  const attempts = new Map<string, number>();
  const fetchImpl: typeof fetch = async (input) => {
    const url = String(input); const count = (attempts.get(url) ?? 0) + 1; attempts.set(url, count);
    if (count === 1 && url.includes("orangetheoryfitness.co.jp/hyrox")) return new Response("temporary", { status: 500 });
    return new Response("<title>Facility</title>Concept2 SkiErg HYROX coaching", { status: 200 });
  };
  const result = await collectH36Sources(cohort, { checkedAt: "2026-08-30T11:49:02.406Z", concurrency: 4, retries: 1, fetchImpl });
  assert.equal(result.requestStats.uniqueUrls, 23);
  assert.equal(result.requestStats.retries, 1);
  assert.equal(attempts.size, 23);
  assert.ok(result.pages.every((row) => row.status === "AVAILABLE"));
  assert.equal(result.readOnly, true);
});

test("H3-6 implementation has no DB write, service-role, UI, or monitor mutation path", async () => {
  const files = [
    "../hyrox-targeted-evidence.ts", "../hyrox-targeted-source.ts",
    "../../../scripts/hyrox/build-h3-6-target-cohort.ts", "../../../scripts/hyrox/collect-h3-6-targeted-sources.ts",
    "../../../scripts/hyrox/build-h3-6-targeted-review.ts",
  ];
  const source = (await Promise.all(files.map((path) => readFile(new URL(path, import.meta.url), "utf8")))).join("\n");
  assert.doesNotMatch(source, /service[_-]?role/i);
  assert.doesNotMatch(source, /\.from\([^)]*\)\.(?:insert|update|delete|upsert)\(/i);
  assert.doesNotMatch(source, /last_confirmed_at\s*[:=]/i);
  assert.doesNotMatch(source, /src\/app|hyrox-enrichment-monitor-authority/);
});
