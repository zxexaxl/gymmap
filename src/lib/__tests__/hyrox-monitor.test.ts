import assert from "node:assert/strict";
import test from "node:test";
import {
  MATERIAL_COORDINATE_DISTANCE_METERS,
  buildMonitorRun,
  classifyFreshness,
  classifyMonitorRecord,
  normalizeAddress,
  normalizeText,
  type FacilityObservation,
  type FinderObservation,
  type HyroxMonitorBaseline,
} from "../hyrox-monitor";
import { observeFacility, observeFinder } from "../hyrox-monitor-source";

const checkedAt = "2026-08-30T00:00:00.000Z";

function baseline(overrides: Partial<HyroxMonitorBaseline> = {}): HyroxMonitorBaseline {
  return {
    locationId: "11111111-1111-4111-8111-111111111111",
    locationSlug: "example-gym-tokyo",
    locationName: "Example Gym Tokyo",
    brandName: "Example Gym",
    hgyId: "HGY_ABC123",
    address: "〒100-0001 東京都千代田区千代田1丁目1番1号",
    postalCode: "100-0001",
    prefecture: "東京都",
    city: "千代田区",
    latitude: 35.681236,
    longitude: 139.767125,
    officialUrl: "https://example.com/tokyo",
    discipline: { lastConfirmedAt: "2026-08-29T00:00:00.000Z", staleAt: "2026-11-27T00:00:00.000Z" },
    affiliation: { lastConfirmedAt: "2026-08-29T00:00:00.000Z", staleAt: "2026-11-27T00:00:00.000Z" },
    ...overrides,
  };
}

function finder(overrides: Partial<FinderObservation> = {}): FinderObservation {
  return {
    status: "AVAILABLE",
    httpStatus: 200,
    hgyId: "HGY_ABC123",
    country: "JP",
    name: "Example Gym Tokyo",
    address: "100-0001, 東京都, 千代田区, 千代田1-1-1",
    postalCode: "100-0001",
    prefecture: "東京都",
    city: "千代田区",
    latitude: 35.681236,
    longitude: 139.767125,
    facilityUrl: "https://example.com/tokyo",
    detailUrl: "https://hyrox-training-finder.hyrox.com/gym/HGY_ABC123",
    error: null,
    attempts: 1,
    ...overrides,
  };
}

function facility(overrides: Partial<FacilityObservation> = {}): FacilityObservation {
  return {
    status: "AVAILABLE",
    requestedUrl: "https://example.com/tokyo",
    finalUrl: "https://example.com/tokyo",
    canonicalUrl: "https://example.com/tokyo",
    httpStatus: 200,
    error: null,
    attempts: 1,
    ...overrides,
  };
}

test("normalization ignores punctuation, width, and Japanese address formatting", () => {
  assert.equal(normalizeText("Ｅｘａｍｐｌｅ　Ｇｙｍ！"), normalizeText("example gym"));
  assert.equal(normalizeAddress("東京都千代田区千代田1丁目1番1号"), normalizeAddress("東京都 千代田区 千代田1-1-1"));
});

test("unchanged identity and formatting-only differences are NO_CHANGE", () => {
  const result = classifyMonitorRecord({
    baseline: baseline(),
    finder: finder({ name: "Ｅｘａｍｐｌｅ　Ｇｙｍ Tokyo!", address: "東京都千代田区千代田1-1-1" }),
    facility: facility(),
    checkedAt,
  });
  assert.deepEqual(result.changes, ["NO_CHANGE"]);
  assert.equal(result.reviewRequired, false);
});

test("material rename is queued", () => {
  const result = classifyMonitorRecord({ baseline: baseline(), finder: finder({ name: "Different Fitness Shinjuku" }), facility: facility(), checkedAt });
  assert.ok(result.changes.includes("REVIEW_REQUIRED_NAME"));
  assert.equal(result.severity, "HIGH");
});

test("material address and coordinate move is possible relocation", () => {
  const result = classifyMonitorRecord({
    baseline: baseline(),
    finder: finder({
      address: "530-0001, 大阪府, 大阪市, 梅田1-1-1",
      postalCode: "530-0001",
      prefecture: "大阪府",
      city: "大阪市",
      latitude: 34.702485,
      longitude: 135.495951,
    }),
    facility: facility(),
    checkedAt,
  });
  assert.ok(result.changes.includes("REVIEW_REQUIRED_ADDRESS"));
  assert.ok(result.changes.includes("REVIEW_REQUIRED_COORDINATES"));
  assert.ok(result.changes.includes("POSSIBLE_RELOCATION"));
  assert.equal(result.severity, "CRITICAL");
});

test("minor coordinate drift is not material", () => {
  const result = classifyMonitorRecord({
    baseline: baseline(),
    finder: finder({ latitude: 35.681336, longitude: 139.767225 }),
    facility: facility(),
    checkedAt,
  });
  assert.deepEqual(result.changes, ["NO_CHANGE"]);
  assert.ok(MATERIAL_COORDINATE_DISTANCE_METERS > 10);
});

test("redirect and unavailable sources are review signals, not closure by themselves", () => {
  const redirect = classifyMonitorRecord({
    baseline: baseline(), finder: finder(), facility: facility({ status: "REDIRECTED_VALID", finalUrl: "https://example.jp/tokyo" }), checkedAt,
  });
  assert.ok(redirect.changes.includes("REVIEW_REQUIRED_SOURCE_URL"));
  const restricted = classifyMonitorRecord({
    baseline: baseline(), finder: finder(), facility: facility({ status: "ACCESS_RESTRICTED", httpStatus: 403 }), checkedAt,
  });
  assert.ok(restricted.changes.includes("FACILITY_SOURCE_UNAVAILABLE"));
  assert.ok(!restricted.changes.includes("POSSIBLE_CLOSURE"));
});

test("Finder and facility 404 together are possible closure; Finder only is not", () => {
  const missingFinder = finder({ status: "NOT_FOUND", httpStatus: 404, hgyId: null });
  const single = classifyMonitorRecord({ baseline: baseline(), finder: missingFinder, facility: facility(), checkedAt });
  assert.ok(single.changes.includes("FINDER_LISTING_MISSING"));
  assert.ok(!single.changes.includes("POSSIBLE_CLOSURE"));
  const combined = classifyMonitorRecord({ baseline: baseline(), finder: missingFinder, facility: facility({ status: "NOT_FOUND", httpStatus: 404 }), checkedAt });
  assert.ok(combined.changes.includes("POSSIBLE_CLOSURE"));
});

test("freshness boundaries are exact and timezone-independent", () => {
  const at = "2026-08-30T00:00:00.000Z";
  assert.equal(classifyFreshness("2026-09-30T00:00:00.000Z", at).status, "FRESH");
  assert.equal(classifyFreshness("2026-09-29T00:00:00.000Z", at).status, "DUE_SOON");
  assert.equal(classifyFreshness("2026-09-14T00:00:00.000Z", at).status, "DUE_SOON");
  assert.equal(classifyFreshness("2026-09-13T00:00:00.000Z", at).status, "URGENT");
  assert.equal(classifyFreshness("2026-08-31T00:00:00.000Z", at).status, "URGENT");
  assert.equal(classifyFreshness(at, at).status, "STALE");
  assert.equal(classifyFreshness("2026-08-29T15:00:00.000Z", "2026-08-30T00:00:00.000Z").status, "STALE");
});

test("review queue excludes fresh NO_CHANGE, includes due-soon, and is deterministic", () => {
  const fresh = baseline();
  const due = baseline({
    locationId: "22222222-2222-4222-8222-222222222222",
    locationSlug: "due-gym",
    hgyId: "HGY_DUE123",
    discipline: { lastConfirmedAt: "2026-06-20T00:00:00.000Z", staleAt: "2026-09-10T00:00:00.000Z" },
    affiliation: { lastConfirmedAt: "2026-06-20T00:00:00.000Z", staleAt: "2026-09-10T00:00:00.000Z" },
  });
  const run = buildMonitorRun({
    baselines: [due, fresh],
    finderObservations: new Map([
      [fresh.hgyId, finder()],
      [due.hgyId, finder({ hgyId: due.hgyId })],
    ]),
    facilityObservations: new Map([
      [fresh.hgyId, facility()],
      [due.hgyId, facility()],
    ]),
    checkedAt,
    finderHealthAvailable: true,
  });
  assert.deepEqual(run.records.map((item) => item.hgyId), [fresh.hgyId, due.hgyId].sort());
  assert.deepEqual(run.reviewQueue.map((item) => item.hgyId), [due.hgyId]);
});

test("global Finder outage produces one run issue and suppresses individual missing alerts", () => {
  const baselines = Array.from({ length: 82 }, (_, index) => baseline({
    locationId: `${String(index).padStart(8, "0")}-1111-4111-8111-111111111111`,
    locationSlug: `gym-${index}`,
    hgyId: `HGY_${String(index).padStart(6, "0")}`,
  }));
  const failed = finder({ status: "TEMPORARILY_UNREACHABLE", httpStatus: 503, hgyId: null });
  const run = buildMonitorRun({
    baselines,
    finderObservations: new Map(baselines.map((item) => [item.hgyId, { ...failed }])),
    facilityObservations: new Map(baselines.map((item) => [item.hgyId, facility()])),
    checkedAt,
    finderHealthAvailable: false,
  });
  assert.equal(run.runIssues.length, 1);
  assert.equal(run.runIssues[0].code, "MONITOR_SOURCE_OUTAGE");
  assert.equal(run.records.filter((item) => item.changes.includes("FINDER_LISTING_MISSING")).length, 0);
  assert.equal(run.reviewQueue.length, 0);
});

test("duplicate HGY identity fails closed", () => {
  const first = baseline();
  const second = baseline({ locationId: "22222222-2222-4222-8222-222222222222", locationSlug: "other" });
  assert.throws(() => buildMonitorRun({
    baselines: [first, second],
    finderObservations: new Map([[first.hgyId, finder()]]),
    facilityObservations: new Map([[first.hgyId, facility()]]),
    checkedAt,
    finderHealthAvailable: true,
  }), /Duplicate HGY/);
});

test("facility source classifies 200, redirect, 403, 404, 429 retry, 500 retry, and network failure", async () => {
  const stats = () => ({ finderHealth: 0, finderDetail: 0, facility: 0, retries: 0 });
  const makeFetch = (...responses: Array<Response | Error>) => {
    let index = 0;
    return async () => {
      const value = responses[Math.min(index++, responses.length - 1)];
      if (value instanceof Error) throw value;
      return value;
    };
  };
  const ok = await observeFacility(baseline(), { fetchImpl: makeFetch(new Response("<html></html>", { status: 200 })) as typeof fetch }, stats());
  assert.equal(ok.status, "AVAILABLE");
  const redirectedResponse = new Response("<html></html>", { status: 200 });
  Object.defineProperty(redirectedResponse, "url", { value: "https://example.jp/tokyo" });
  const redirected = await observeFacility(baseline(), { fetchImpl: makeFetch(redirectedResponse) as typeof fetch }, stats());
  assert.equal(redirected.status, "REDIRECTED_VALID");
  for (const [status, expected] of [[403, "ACCESS_RESTRICTED"], [404, "NOT_FOUND"]] as const) {
    const result = await observeFacility(baseline(), { fetchImpl: makeFetch(new Response("", { status })) as typeof fetch }, stats());
    assert.equal(result.status, expected);
  }
  for (const status of [429, 500]) {
    const retryStats = stats();
    const result = await observeFacility(baseline(), {
      fetchImpl: makeFetch(new Response("", { status }), new Response("<html></html>", { status: 200 })) as typeof fetch,
      sleep: async () => {},
    }, retryStats);
    assert.equal(result.status, "AVAILABLE");
    assert.equal(retryStats.retries, 1);
  }
  const failed = await observeFacility(baseline(), {
    fetchImpl: makeFetch(new Error("timeout")) as typeof fetch,
    sleep: async () => {},
  }, stats());
  assert.equal(failed.status, "TEMPORARILY_UNREACHABLE");
  assert.equal(failed.attempts, 3);
});

test("Finder monitor validates HGY, country, missing, and response format drift", async () => {
  const stats = { finderHealth: 0, finderDetail: 0, facility: 0, retries: 0 };
  const payload = (gym: unknown, status = 200) => new Response(JSON.stringify({ gym }), {
    status,
    headers: { "content-type": "application/json" },
  });
  const responseFetch = (response: Response) => (async () => response) as typeof fetch;
  const valid = await observeFinder(baseline(), { fetchImpl: responseFetch(payload({
    hyroxEntityId: "HGY_ABC123",
    gymName: "Example Gym Tokyo",
    address: { country: "JP", state: "東京都", city: "千代田区", street: "千代田1-1-1", postalCode: "100-0001", geoCoordinates: { lat: 35.681236, lon: 139.767125 } },
  })) }, stats);
  assert.equal(valid.status, "AVAILABLE");
  const wrong = await observeFinder(baseline(), { fetchImpl: responseFetch(payload({ hyroxEntityId: "HGY_WRONG", address: { country: "US" } })) }, stats);
  assert.equal(wrong.status, "IDENTITY_MISMATCH");
  const wrongCountry = classifyMonitorRecord({
    baseline: baseline(), finder: finder({ country: "US" }), facility: facility(), checkedAt,
  });
  assert.ok(wrongCountry.changes.includes("MONITOR_ERROR"));
  const missing = await observeFinder(baseline(), { fetchImpl: responseFetch(new Response("", { status: 404 })) }, stats);
  assert.equal(missing.status, "NOT_FOUND");
  const drift = await observeFinder(baseline(), { fetchImpl: responseFetch(payload(undefined)) }, stats);
  assert.equal(drift.status, "UNKNOWN");
});
