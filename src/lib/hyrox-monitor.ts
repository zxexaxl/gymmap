export const HYROX_API_BASE_URL = "https://onefiit-api.platform.onefiit.com/hyrox365";
export const HYROX_FINDER_URL = "https://hyrox-training-finder.hyrox.com/";
export const HYROX_SOURCE_NAMESPACE = "hyrox-training-club";

export const FRESHNESS_DUE_SOON_DAYS = 30;
export const FRESHNESS_URGENT_DAYS = 14;
// The live cohort contains a verified same-postal-address Finder point roughly 571m
// from GymMap's point. One kilometre avoids treating geocoder centroid drift as a
// relocation while still surfacing moves beyond the immediate neighbourhood.
export const MATERIAL_COORDINATE_DISTANCE_METERS = 1_000;

export type SourceStatus =
  | "AVAILABLE"
  | "REDIRECTED_VALID"
  | "TEMPORARILY_UNREACHABLE"
  | "ACCESS_RESTRICTED"
  | "NOT_FOUND"
  | "IDENTITY_MISMATCH"
  | "UNKNOWN";

export type ChangeClassification =
  | "NO_CHANGE"
  | "REVIEW_REQUIRED_SOURCE_URL"
  | "REVIEW_REQUIRED_NAME"
  | "REVIEW_REQUIRED_ADDRESS"
  | "REVIEW_REQUIRED_COORDINATES"
  | "FINDER_LISTING_MISSING"
  | "FACILITY_SOURCE_UNAVAILABLE"
  | "POSSIBLE_RELOCATION"
  | "POSSIBLE_CLOSURE"
  | "MONITOR_ERROR";

export type FreshnessStatus = "FRESH" | "DUE_SOON" | "URGENT" | "STALE";
export type Severity = "INFO" | "WARNING" | "HIGH" | "CRITICAL";

export type ClaimFreshness = {
  lastConfirmedAt: string;
  staleAt: string;
  status: FreshnessStatus;
  daysRemaining: number;
};

export type HyroxMonitorBaseline = {
  locationId: string;
  locationSlug: string;
  locationName: string;
  brandName: string;
  hgyId: string;
  address: string | null;
  postalCode: string | null;
  prefecture: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  officialUrl: string | null;
  discipline: { lastConfirmedAt: string; staleAt: string };
  affiliation: { lastConfirmedAt: string; staleAt: string };
};

export type FinderObservation = {
  status: SourceStatus;
  httpStatus: number | null;
  hgyId: string | null;
  country: string | null;
  name: string | null;
  address: string | null;
  postalCode: string | null;
  prefecture: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  facilityUrl: string | null;
  detailUrl: string;
  error: string | null;
  attempts: number;
};

export type FacilityObservation = {
  status: SourceStatus;
  requestedUrl: string | null;
  finalUrl: string | null;
  canonicalUrl: string | null;
  httpStatus: number | null;
  error: string | null;
  attempts: number;
};

export type HyroxMonitorRecord = {
  locationId: string;
  locationSlug: string;
  hgyId: string;
  checkedAt: string;
  baseline: HyroxMonitorBaseline;
  observation: {
    finder: FinderObservation;
    facility: FacilityObservation;
  };
  finderStatus: SourceStatus;
  sourceStatus: SourceStatus;
  changes: ChangeClassification[];
  diffs: string[];
  freshness: {
    discipline: ClaimFreshness;
    affiliation: ClaimFreshness;
    overall: FreshnessStatus;
  };
  reviewRequired: boolean;
  severity: Severity;
  recommendedAction: string;
};

export type MonitorRunIssue = {
  code: "MONITOR_SOURCE_OUTAGE" | "BASELINE_INTEGRITY_ERROR";
  severity: "CRITICAL";
  message: string;
};

export type HyroxMonitorRun = {
  schemaVersion: 1;
  checkedAt: string;
  durationMs: number;
  monitoredCount: number;
  records: HyroxMonitorRecord[];
  reviewQueue: HyroxMonitorRecord[];
  runIssues: MonitorRunIssue[];
  requestStats: {
    finderHealth: number;
    finderDetail: number;
    facility: number;
    retries: number;
  };
};

export function normalizeText(value: string | null | undefined): string {
  return (value ?? "")
    .normalize("NFKC")
    .toLocaleLowerCase("ja-JP")
    .replace(/[‐‑‒–—―−]/g, "-")
    .replace(/[\s\p{P}\p{S}]+/gu, "")
    .trim();
}

export function normalizeAddress(value: string | null | undefined): string {
  return normalizeText(
    (value ?? "")
      .normalize("NFKC")
      .replace(/〒?\s*\d{3}[-‐‑‒–—―−]?\d{4}/g, "")
      .replace(/(丁目|番地|番|号)/g, "-"),
  ).replace(/-+/g, "-");
}

export function normalizeUrl(value: string | null | undefined): string {
  if (!value) return "";
  try {
    const url = new URL(value);
    const path = url.pathname.replace(/\/+$/, "") || "/";
    return `${url.hostname.toLowerCase().replace(/^www\./, "")}${path.toLowerCase()}`;
  } catch {
    return "";
  }
}

export function haversineDistanceMeters(
  leftLat: number,
  leftLng: number,
  rightLat: number,
  rightLng: number,
): number {
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const radius = 6_371_000;
  const deltaLat = radians(rightLat - leftLat);
  const deltaLng = radians(rightLng - leftLng);
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(radians(leftLat)) * Math.cos(radians(rightLat)) * Math.sin(deltaLng / 2) ** 2;
  return 2 * radius * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function classifyFreshness(staleAt: string, checkedAt: string): ClaimFreshness {
  const staleMs = Date.parse(staleAt);
  const checkedMs = Date.parse(checkedAt);
  if (!Number.isFinite(staleMs) || !Number.isFinite(checkedMs)) {
    throw new Error("Freshness timestamps must be valid ISO timestamps");
  }
  const remainingMs = staleMs - checkedMs;
  const daysRemaining = Math.ceil(remainingMs / 86_400_000);
  const status: FreshnessStatus =
    remainingMs <= 0
      ? "STALE"
      : remainingMs <= FRESHNESS_URGENT_DAYS * 86_400_000
        ? "URGENT"
        : remainingMs <= FRESHNESS_DUE_SOON_DAYS * 86_400_000
          ? "DUE_SOON"
          : "FRESH";
  return { lastConfirmedAt: "", staleAt, status, daysRemaining };
}

function stringsMateriallyDiffer(left: string | null, right: string | null): boolean {
  const normalizedLeft = normalizeText(left);
  const normalizedRight = normalizeText(right);
  if (!normalizedLeft || !normalizedRight) return false;
  return !(
    normalizedLeft === normalizedRight ||
    normalizedLeft.includes(normalizedRight) ||
    normalizedRight.includes(normalizedLeft)
  );
}

function addressesMateriallyDiffer(
  baseline: HyroxMonitorBaseline,
  observation: FinderObservation,
  distance: number | null,
): boolean {
  const left = normalizeAddress(baseline.address);
  const right = normalizeAddress(observation.address);
  if (!left || !right || left === right || left.includes(right) || right.includes(left)) return false;
  const postalMatches = Boolean(
    baseline.postalCode &&
      observation.postalCode &&
      baseline.postalCode.replace(/\D/g, "") === observation.postalCode.replace(/\D/g, ""),
  );
  return !(postalMatches && distance !== null && distance <= MATERIAL_COORDINATE_DISTANCE_METERS);
}

const freshnessRank: Record<FreshnessStatus, number> = {
  FRESH: 0,
  DUE_SOON: 1,
  URGENT: 2,
  STALE: 3,
};

const severityRank: Record<Severity, number> = { INFO: 0, WARNING: 1, HIGH: 2, CRITICAL: 3 };

function maxSeverity(...values: Severity[]): Severity {
  return values.reduce((highest, candidate) =>
    severityRank[candidate] > severityRank[highest] ? candidate : highest, "INFO");
}

function recommendedAction(changes: ChangeClassification[], freshness: FreshnessStatus): string {
  if (changes.includes("POSSIBLE_CLOSURE")) return "Review governing-body and facility authorities before changing publication state.";
  if (changes.includes("POSSIBLE_RELOCATION")) return "Perform identity and relocation review; do not update the existing location automatically.";
  if (changes.includes("FINDER_LISTING_MISSING")) return "Confirm Finder inventory health and manually review affiliation status.";
  if (changes.some((change) => change.startsWith("REVIEW_REQUIRED_"))) return "Review the observed diff against first-party authority before any database update.";
  if (changes.includes("FACILITY_SOURCE_UNAVAILABLE")) return "Retry on a later run and manually review only if unavailability persists.";
  if (freshness === "STALE") return "Block automatic reconfirmation and perform an immediate human freshness review.";
  if (freshness === "URGENT") return "Schedule human reconfirmation before the stale deadline.";
  if (freshness === "DUE_SOON") return "Queue for human reconfirmation within 30 days.";
  return "No action required.";
}

export function classifyMonitorRecord(args: {
  baseline: HyroxMonitorBaseline;
  finder: FinderObservation;
  facility: FacilityObservation;
  checkedAt: string;
  finderSourceOutage?: boolean;
}): HyroxMonitorRecord {
  const { baseline, finder, facility, checkedAt, finderSourceOutage = false } = args;
  const changes = new Set<ChangeClassification>();
  const diffs: string[] = [];
  let distance: number | null = null;
  if (
    baseline.latitude !== null && baseline.longitude !== null &&
    finder.latitude !== null && finder.longitude !== null
  ) {
    distance = haversineDistanceMeters(
      baseline.latitude,
      baseline.longitude,
      finder.latitude,
      finder.longitude,
    );
  }

  if (!finderSourceOutage) {
    if (finder.status === "NOT_FOUND") changes.add("FINDER_LISTING_MISSING");
    else if (finder.status === "IDENTITY_MISMATCH") changes.add("MONITOR_ERROR");
    else if (["TEMPORARILY_UNREACHABLE", "ACCESS_RESTRICTED", "UNKNOWN"].includes(finder.status)) {
      changes.add("MONITOR_ERROR");
    }

    if (finder.status === "AVAILABLE") {
      if (finder.hgyId !== baseline.hgyId || !["JP", "JAPAN", "日本"].includes((finder.country ?? "").toUpperCase())) {
        changes.add("MONITOR_ERROR");
        diffs.push(`Finder identity/country mismatch: expected ${baseline.hgyId}/JP, observed ${finder.hgyId ?? "missing"}/${finder.country ?? "missing"}`);
      }
      if (stringsMateriallyDiffer(baseline.locationName, finder.name)) {
        changes.add("REVIEW_REQUIRED_NAME");
        diffs.push(`Name: ${baseline.locationName} -> ${finder.name}`);
      }
      const addressDiff = addressesMateriallyDiffer(baseline, finder, distance);
      if (addressDiff) {
        changes.add("REVIEW_REQUIRED_ADDRESS");
        diffs.push(`Address: ${baseline.address ?? "missing"} -> ${finder.address ?? "missing"}`);
      }
      if (distance !== null && distance > MATERIAL_COORDINATE_DISTANCE_METERS) {
        changes.add("REVIEW_REQUIRED_COORDINATES");
        diffs.push(`Coordinates moved ${Math.round(distance)}m`);
      }
      if (addressDiff && distance !== null && distance > MATERIAL_COORDINATE_DISTANCE_METERS) {
        changes.add("POSSIBLE_RELOCATION");
      }
      if (
        finder.facilityUrl && baseline.officialUrl &&
        normalizeUrl(finder.facilityUrl) !== normalizeUrl(baseline.officialUrl)
      ) {
        changes.add("REVIEW_REQUIRED_SOURCE_URL");
        diffs.push(`Finder facility URL: ${baseline.officialUrl} -> ${finder.facilityUrl}`);
      }
    }
  }

  if (["TEMPORARILY_UNREACHABLE", "ACCESS_RESTRICTED", "NOT_FOUND", "UNKNOWN"].includes(facility.status)) {
    changes.add("FACILITY_SOURCE_UNAVAILABLE");
  }
  if (facility.status === "REDIRECTED_VALID") {
    changes.add("REVIEW_REQUIRED_SOURCE_URL");
    diffs.push(`Facility redirect: ${facility.requestedUrl} -> ${facility.finalUrl}`);
  }
  if (finder.status === "NOT_FOUND" && facility.status === "NOT_FOUND" && !finderSourceOutage) {
    changes.add("POSSIBLE_CLOSURE");
  }

  if (changes.size === 0) changes.add("NO_CHANGE");
  const discipline = classifyFreshness(baseline.discipline.staleAt, checkedAt);
  discipline.lastConfirmedAt = baseline.discipline.lastConfirmedAt;
  const affiliation = classifyFreshness(baseline.affiliation.staleAt, checkedAt);
  affiliation.lastConfirmedAt = baseline.affiliation.lastConfirmedAt;
  const overall = freshnessRank[discipline.status] >= freshnessRank[affiliation.status]
    ? discipline.status : affiliation.status;

  let severity: Severity = "INFO";
  if (overall === "DUE_SOON") severity = maxSeverity(severity, "WARNING");
  if (overall === "URGENT") severity = maxSeverity(severity, "HIGH");
  if (overall === "STALE") severity = maxSeverity(severity, "CRITICAL");
  if (changes.has("FACILITY_SOURCE_UNAVAILABLE")) severity = maxSeverity(severity, "WARNING");
  if ([...changes].some((value) => [
    "FINDER_LISTING_MISSING", "REVIEW_REQUIRED_SOURCE_URL", "REVIEW_REQUIRED_NAME",
    "REVIEW_REQUIRED_ADDRESS", "REVIEW_REQUIRED_COORDINATES", "MONITOR_ERROR",
  ].includes(value))) severity = maxSeverity(severity, "HIGH");
  if (changes.has("POSSIBLE_RELOCATION") || changes.has("POSSIBLE_CLOSURE")) {
    severity = maxSeverity(severity, "CRITICAL");
  }

  const sortedChanges = [...changes].sort();
  const reviewRequired = sortedChanges.some((change) => change !== "NO_CHANGE") || overall !== "FRESH";
  return {
    locationId: baseline.locationId,
    locationSlug: baseline.locationSlug,
    hgyId: baseline.hgyId,
    checkedAt,
    baseline,
    observation: { finder, facility },
    finderStatus: finder.status,
    sourceStatus: facility.status,
    changes: sortedChanges,
    diffs: diffs.sort(),
    freshness: { discipline, affiliation, overall },
    reviewRequired,
    severity,
    recommendedAction: recommendedAction(sortedChanges, overall),
  };
}

export function detectFinderSourceOutage(
  healthAvailable: boolean,
  observations: FinderObservation[],
): boolean {
  if (healthAvailable) return false;
  if (observations.length === 0) return true;
  const infrastructureFailures = observations.filter((item) =>
    ["TEMPORARILY_UNREACHABLE", "ACCESS_RESTRICTED", "UNKNOWN"].includes(item.status));
  return infrastructureFailures.length / observations.length >= 0.5;
}

export function buildMonitorRun(args: {
  baselines: HyroxMonitorBaseline[];
  finderObservations: Map<string, FinderObservation>;
  facilityObservations: Map<string, FacilityObservation>;
  checkedAt: string;
  finderHealthAvailable: boolean;
  requestStats?: HyroxMonitorRun["requestStats"];
  durationMs?: number;
}): HyroxMonitorRun {
  const sortedBaselines = [...args.baselines].sort((a, b) => a.hgyId.localeCompare(b.hgyId));
  const hgyIds = sortedBaselines.map((item) => item.hgyId);
  const duplicateHgy = hgyIds.filter((id, index) => hgyIds.indexOf(id) !== index);
  if (duplicateHgy.length > 0) throw new Error(`Duplicate HGY identities: ${[...new Set(duplicateHgy)].join(", ")}`);
  const observations = sortedBaselines.map((baseline) => {
    const observation = args.finderObservations.get(baseline.hgyId);
    if (!observation) throw new Error(`Missing Finder observation for ${baseline.hgyId}`);
    return observation;
  });
  const finderSourceOutage = detectFinderSourceOutage(args.finderHealthAvailable, observations);
  const records = sortedBaselines.map((baseline) => {
    const finder = args.finderObservations.get(baseline.hgyId)!;
    const facility = args.facilityObservations.get(baseline.hgyId) ?? {
      status: "UNKNOWN" as const,
      requestedUrl: baseline.officialUrl,
      finalUrl: null,
      canonicalUrl: null,
      httpStatus: null,
      error: "Facility observation missing",
      attempts: 0,
    };
    return classifyMonitorRecord({ baseline, finder, facility, checkedAt: args.checkedAt, finderSourceOutage });
  });
  const runIssues: MonitorRunIssue[] = finderSourceOutage ? [{
    code: "MONITOR_SOURCE_OUTAGE",
    severity: "CRITICAL",
    message: "Official Finder health check and a majority of detail requests failed; location-level missing alerts were suppressed.",
  }] : [];
  return {
    schemaVersion: 1,
    checkedAt: args.checkedAt,
    durationMs: args.durationMs ?? 0,
    monitoredCount: records.length,
    records,
    reviewQueue: records.filter((item) => item.reviewRequired),
    runIssues,
    requestStats: args.requestStats ?? { finderHealth: 0, finderDetail: 0, facility: 0, retries: 0 },
  };
}

export function summarizeMonitorRun(run: HyroxMonitorRun): string {
  const countChange = (classification: ChangeClassification) =>
    run.records.filter((record) => record.changes.includes(classification)).length;
  const countFreshness = (status: FreshnessStatus) =>
    run.records.filter((record) => record.freshness.overall === status).length;
  return [
    "# HYROX freshness monitor",
    "",
    `Checked at: ${run.checkedAt}`,
    `Duration: ${(run.durationMs / 1_000).toFixed(1)}s`,
    `Total monitored: ${run.monitoredCount}`,
    `NO_CHANGE: ${countChange("NO_CHANGE")}`,
    `REVIEW_REQUIRED: ${run.reviewQueue.length}`,
    `Finder missing: ${countChange("FINDER_LISTING_MISSING")}`,
    `Facility source unavailable: ${countChange("FACILITY_SOURCE_UNAVAILABLE")}`,
    `Due soon: ${countFreshness("DUE_SOON")}`,
    `Urgent: ${countFreshness("URGENT")}`,
    `Stale: ${countFreshness("STALE")}`,
    `Monitor errors: ${countChange("MONITOR_ERROR")}`,
    `Run-level issues: ${run.runIssues.length}`,
    "",
    "## Review queue",
    "",
    ...(run.reviewQueue.length === 0
      ? ["No records require review."]
      : run.reviewQueue.map((record) =>
        `- **${record.severity}** ${record.hgyId} / ${record.baseline.locationName}: ${record.changes.join(", ")} — ${record.recommendedAction}`)),
    "",
    "No production data was changed. Monitor observations are not reviewed reconfirmations.",
  ].join("\n");
}
