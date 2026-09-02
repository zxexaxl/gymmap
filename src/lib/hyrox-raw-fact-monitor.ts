import { createHash } from "node:crypto";
import {
  classifyFreshness,
  type Severity,
  type SourceStatus,
} from "./hyrox-monitor";
import {
  normalizeSupportText,
  type EnrichmentSourceObservation,
} from "./hyrox-enrichment-monitor";

export const ACCEPTED_R2_HASHES = {
  freshnessPolicy: "42ed943a807d505b3fdc4deadef0bc94014d0007287ca752d366cc83e2c31295",
  factMapping: "8beedc6399f50209660b69e97911a735428a2ac76fc93525e6d1d0bd88021c9f",
  restrictionMapping: "39b6c945b5539571764dc5cc923929ed3d872b97e6780e77f5a51d8cd793a720",
  cohort1Mapping: "7bf0c89e92247a3571cda4d66616616473903413bcc0cd36641c382beabecd1e",
} as const;

export type RawMonitorMode = "LIVE_MONITORED" | "CANDIDATE_NOT_IMPORTED";
export type RawMonitorEntryKind = "raw_fact" | "restriction";
export type RawTimeState = "FRESH" | "DUE_SOON" | "URGENT" | "TIME_EXPIRED";
export type RawMonitorClassification =
  | RawTimeState
  | "SUPPORT_DRIFT"
  | "FACILITY_BINDING_DRIFT"
  | "MONITOR_ERROR"
  | "SOURCE_UNAVAILABLE"
  | "SOURCE_REVIEW_REQUIRED"
  | "AUTHORITY_MISSING"
  | "CHECK_UNAVAILABLE"
  | "FUTURE_EFFECTIVE_HOLD"
  | "NO_CURRENT_RESTRICTION_AUTHORITY";

export type RawFreshnessPolicy = {
  policy_key: string;
  horizon_days: number;
  clock_anchor: "reviewed_at";
  due_soon_days: number;
  urgent_days: number;
};

export type R2FreshnessAuthority = {
  authority: { policy_version: string };
  currentness_contract: unknown;
  policies: RawFreshnessPolicy[];
  fact_type_mappings: Array<{ fact_type: string; policy_key: string }>;
  restriction_type_mappings: Array<{ restriction_type: string; policy_key: string }>;
  cohort1_raw_observation_mappings: unknown[];
  cohort1_restriction_observation_mappings: unknown[];
  existing_canonical_coherence: unknown;
  monitoring_contract: unknown;
  persistence_sufficiency: unknown;
  deterministic_hashes: {
    freshness_policy_authority_sha256: string;
    fact_policy_mapping_sha256: string;
    restriction_policy_mapping_sha256: string;
    cohort1_freshness_mapping_sha256: string;
  };
};

export type RawMonitorSource = {
  sourceKey: string;
  locationId: string;
  hgyId: string;
  url: string;
  canonicalUrl: string;
  facilityBinding: "FACILITY_SPECIFIC" | "BRAND_FACILITY_SPECIFIC";
  facilityIdentityPatternGroups: string[][];
};

export type RawMonitorEntry = {
  observationKey: string;
  kind: RawMonitorEntryKind;
  locationId: string;
  hgyId: string;
  facilityName: string;
  typeKeys: string[];
  policyKey: string;
  reviewedAt: string;
  freshnessExpiresAt: string;
  sourceExplicitStartsAt: string | null;
  sourceExplicitEndsAt: string | null;
  sourceKeys: string[];
  supportCheck:
    | { mode: "TEXT_PATTERN"; patternGroups: string[][] }
    | { mode: "CHECK_UNAVAILABLE"; reason: string };
  reviewAuthority: string;
  expectedPersistenceKey: string | null;
};

export type RawMonitorManifest = {
  schemaVersion: 1;
  mode: RawMonitorMode;
  authority: {
    r2Commit: string;
    r2PolicyVersion: string;
    freshnessPolicyHash: string;
    factMappingHash: string;
    restrictionMappingHash: string;
    cohort1MappingHash: string;
    monitorPacketHash: string;
    dbImportPacketHash: string | null;
    releaseCoherenceHash: string | null;
  };
  counts: {
    sources: number;
    entries: number;
    rawFacts: number;
    restrictions: number;
  };
  sources: RawMonitorSource[];
  entries: RawMonitorEntry[];
  manifestHash: string;
};

export type RawMonitorRecord = {
  observationKey: string;
  kind: RawMonitorEntryKind;
  locationId: string;
  hgyId: string;
  facilityName: string;
  typeKeys: string[];
  policyKey: string;
  reviewedAt: string;
  freshnessExpiresAt: string;
  effectiveFreshnessExpiresAt: string | null;
  timeState: RawTimeState | "AUTHORITY_MISSING" | "FUTURE_EFFECTIVE_HOLD";
  daysRemaining: number | null;
  sourceStatuses: SourceStatus[];
  supportStatus: "PRESENT" | "MISSING" | "CHECK_UNAVAILABLE" | "NOT_CHECKED";
  classifications: RawMonitorClassification[];
  currentForDependencyEvaluation: boolean;
  reconfirmed: false;
  reviewRequired: boolean;
  severity: Severity;
  checkedAt: string;
};

export type RawMonitorRun = {
  schemaVersion: 1;
  mode: RawMonitorMode;
  checkedAt: string;
  durationMs: number;
  entries: number;
  rawFacts: number;
  restrictions: number;
  uniqueSources: number;
  records: RawMonitorRecord[];
  reviewQueue: RawMonitorRecord[];
  runIssues: Array<{
    code: "MONITOR_SOURCE_OUTAGE" | "MANIFEST_INTEGRITY_ERROR";
    severity: "CRITICAL";
    message: string;
  }>;
  requestStats: {
    entries: number;
    uniqueSources: number;
    requestsAfterDedup: number;
    retries: number;
    concurrency: number;
  };
};

function canonicalize(value: unknown, excludedKeys = new Set(["manifestHash"])): unknown {
  if (Array.isArray(value)) return value.map((child) => canonicalize(child, excludedKeys));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([key]) => !excludedKeys.has(key))
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, child]) => [key, canonicalize(child, excludedKeys)]),
    );
  }
  return value;
}

export function rawMonitorManifestHash(manifest: Omit<RawMonitorManifest, "manifestHash"> | RawMonitorManifest) {
  return createHash("sha256").update(JSON.stringify(canonicalize(manifest))).digest("hex");
}

export function rawMonitorPacketHash(manifest: Omit<RawMonitorManifest, "manifestHash"> | RawMonitorManifest) {
  return createHash("sha256").update(JSON.stringify(canonicalize(
    manifest,
    new Set(["manifestHash", "monitorPacketHash", "dbImportPacketHash", "releaseCoherenceHash"]),
  ))).digest("hex");
}

export function rawMonitorReleaseCoherenceHash(dbImportPacketHash: string, monitorPacketHash: string) {
  return createHash("sha256").update(JSON.stringify({ dbImportPacketHash, rawMonitorPacketHash: monitorPacketHash })).digest("hex");
}

export function rawMonitorRequestKey(value: string) {
  try {
    const url = new URL(value);
    url.hostname = url.hostname.toLowerCase();
    url.hash = "";
    url.pathname = url.pathname.replace(/\/+$/, "") || "/";
    url.searchParams.sort();
    return url.toString();
  } catch {
    return "";
  }
}

function validIso(value: string | null): boolean {
  return value === null || Number.isFinite(Date.parse(value));
}

export function validateR2FreshnessAuthority(authority: R2FreshnessAuthority): R2FreshnessAuthority {
  const hashes = authority.deterministic_hashes;
  const computed = {
    freshnessPolicy: createHash("sha256").update(JSON.stringify(canonicalize({
      currentness_contract: authority.currentness_contract,
      policies: authority.policies,
      monitoring_contract: authority.monitoring_contract,
      persistence_sufficiency: authority.persistence_sufficiency,
    }))).digest("hex"),
    factMapping: createHash("sha256").update(JSON.stringify(canonicalize(authority.fact_type_mappings))).digest("hex"),
    restrictionMapping: createHash("sha256").update(JSON.stringify(canonicalize(authority.restriction_type_mappings))).digest("hex"),
    cohort1Mapping: createHash("sha256").update(JSON.stringify(canonicalize({
      raw: authority.cohort1_raw_observation_mappings,
      restrictions: authority.cohort1_restriction_observation_mappings,
      existing_canonical_coherence: authority.existing_canonical_coherence,
    }))).digest("hex"),
  };
  if (
    hashes.freshness_policy_authority_sha256 !== ACCEPTED_R2_HASHES.freshnessPolicy
    || hashes.fact_policy_mapping_sha256 !== ACCEPTED_R2_HASHES.factMapping
    || hashes.restriction_policy_mapping_sha256 !== ACCEPTED_R2_HASHES.restrictionMapping
    || hashes.cohort1_freshness_mapping_sha256 !== ACCEPTED_R2_HASHES.cohort1Mapping
    || computed.freshnessPolicy !== ACCEPTED_R2_HASHES.freshnessPolicy
    || computed.factMapping !== ACCEPTED_R2_HASHES.factMapping
    || computed.restrictionMapping !== ACCEPTED_R2_HASHES.restrictionMapping
    || computed.cohort1Mapping !== ACCEPTED_R2_HASHES.cohort1Mapping
  ) throw new Error("Accepted H3-11D-R2 authority hash mismatch");
  if (authority.policies.length !== 5 || authority.fact_type_mappings.length !== 13 || authority.restriction_type_mappings.length !== 4) {
    throw new Error("Accepted H3-11D-R2 taxonomy count mismatch");
  }
  return authority;
}

export function validateRawMonitorManifest(
  manifest: RawMonitorManifest,
  authority: R2FreshnessAuthority,
): RawMonitorManifest {
  validateR2FreshnessAuthority(authority);
  if (manifest.schemaVersion !== 1) throw new Error("Unsupported raw monitor manifest schema");
  if (rawMonitorManifestHash(manifest) !== manifest.manifestHash) throw new Error("Raw monitor manifest hash mismatch");
  if (rawMonitorPacketHash(manifest) !== manifest.authority.monitorPacketHash) throw new Error("Raw monitor packet hash mismatch");
  if (
    manifest.authority.freshnessPolicyHash !== ACCEPTED_R2_HASHES.freshnessPolicy
    || manifest.authority.factMappingHash !== ACCEPTED_R2_HASHES.factMapping
    || manifest.authority.restrictionMappingHash !== ACCEPTED_R2_HASHES.restrictionMapping
    || manifest.authority.cohort1MappingHash !== ACCEPTED_R2_HASHES.cohort1Mapping
  ) throw new Error("Raw monitor manifest is not pinned to accepted R2");
  if (
    manifest.counts.sources !== manifest.sources.length
    || manifest.counts.entries !== manifest.entries.length
    || manifest.counts.rawFacts !== manifest.entries.filter((entry) => entry.kind === "raw_fact").length
    || manifest.counts.restrictions !== manifest.entries.filter((entry) => entry.kind === "restriction").length
  ) throw new Error("Raw monitor manifest count mismatch");
  if (manifest.mode === "LIVE_MONITORED" && manifest.entries.length > 0 && (!manifest.authority.dbImportPacketHash || !manifest.authority.releaseCoherenceHash)) {
    throw new Error("Live raw monitor entries require DB/monitor release coherence authority");
  }
  if (
    manifest.mode === "LIVE_MONITORED"
    && manifest.entries.length > 0
    && manifest.authority.dbImportPacketHash
    && manifest.authority.releaseCoherenceHash !== rawMonitorReleaseCoherenceHash(manifest.authority.dbImportPacketHash, manifest.authority.monitorPacketHash)
  ) throw new Error("Live raw monitor release coherence hash mismatch");
  const sourceKeys = new Set(manifest.sources.map((source) => source.sourceKey));
  if (
    sourceKeys.size !== manifest.sources.length
    || new Set(manifest.entries.map((entry) => entry.observationKey)).size !== manifest.entries.length
  ) throw new Error("Raw monitor manifest identities must be unique");
  for (const source of manifest.sources) {
    if (!source.locationId || !/^HGY_[A-Za-z0-9]+$/.test(source.hgyId)) throw new Error(`Invalid source identity: ${source.sourceKey}`);
    if (!URL.canParse(source.url)) throw new Error(`Invalid source URL: ${source.sourceKey}`);
    if (!URL.canParse(source.canonicalUrl) || source.facilityIdentityPatternGroups.length === 0 || source.facilityIdentityPatternGroups.some((group) => group.length === 0)) {
      throw new Error(`Invalid source binding authority: ${source.sourceKey}`);
    }
  }
  for (const entry of manifest.entries) {
    if (
      entry.typeKeys.length === 0
      || entry.sourceKeys.length === 0
      || entry.sourceKeys.some((key) => !sourceKeys.has(key))
      || !validIso(entry.reviewedAt)
      || !validIso(entry.freshnessExpiresAt)
      || !validIso(entry.sourceExplicitStartsAt)
      || !validIso(entry.sourceExplicitEndsAt)
    ) throw new Error(`Invalid raw monitor entry: ${entry.observationKey}`);
    if (entry.sourceKeys.some((key) => {
      const source = manifest.sources.find((candidate) => candidate.sourceKey === key);
      return !source || source.locationId !== entry.locationId || source.hgyId !== entry.hgyId;
    })) throw new Error(`Cross-facility source relation: ${entry.observationKey}`);
    if (entry.supportCheck.mode === "TEXT_PATTERN" && (entry.supportCheck.patternGroups.length === 0 || entry.supportCheck.patternGroups.some((group) => group.length === 0))) {
      throw new Error(`Invalid support patterns: ${entry.observationKey}`);
    }
  }
  return manifest;
}

function mappedPolicy(
  entry: RawMonitorEntry,
  authority: R2FreshnessAuthority,
): RawFreshnessPolicy | null {
  const mappings = entry.kind === "raw_fact"
    ? authority.fact_type_mappings.map((row) => ({ typeKey: row.fact_type, policyKey: row.policy_key }))
    : authority.restriction_type_mappings.map((row) => ({ typeKey: row.restriction_type, policyKey: row.policy_key }));
  const policyKeys = entry.typeKeys.map((typeKey) => mappings.find((row) => row.typeKey === typeKey)?.policyKey ?? null);
  if (policyKeys.some((policyKey) => policyKey === null || policyKey !== entry.policyKey)) return null;
  return authority.policies.find((policy) => policy.policy_key === entry.policyKey) ?? null;
}

function expectedExpiry(entry: RawMonitorEntry, policy: RawFreshnessPolicy): string | null {
  const reviewed = Date.parse(entry.reviewedAt);
  if (!Number.isFinite(reviewed)) return null;
  const horizon = reviewed + policy.horizon_days * 86_400_000;
  const explicitEnd = entry.sourceExplicitEndsAt ? Date.parse(entry.sourceExplicitEndsAt) : Number.POSITIVE_INFINITY;
  if (!Number.isFinite(explicitEnd) && explicitEnd !== Number.POSITIVE_INFINITY) return null;
  return new Date(Math.min(horizon, explicitEnd)).toISOString();
}

function patternsPresent(groups: string[][], content: string): boolean {
  const normalized = normalizeSupportText(content);
  return groups.every((group) => group.some((pattern) => normalized.includes(normalizeSupportText(pattern))));
}

function maxSeverity(...values: Severity[]): Severity {
  const rank: Record<Severity, number> = { INFO: 0, WARNING: 1, HIGH: 2, CRITICAL: 3 };
  return values.reduce((result, value) => rank[value] > rank[result] ? value : result, "INFO");
}

function sourceError(status: SourceStatus) {
  return status === "TEMPORARILY_UNREACHABLE" || status === "UNKNOWN";
}

export function buildRawMonitorRun(args: {
  manifest: RawMonitorManifest;
  authority: R2FreshnessAuthority;
  sourceObservations: EnrichmentSourceObservation[];
  checkedAt: string;
  durationMs?: number;
  requestStats?: Partial<RawMonitorRun["requestStats"]>;
}): RawMonitorRun {
  validateRawMonitorManifest(args.manifest, args.authority);
  const observations = new Map(args.sourceObservations.map((observation) => [observation.sourceKey, observation]));
  const sources = new Map(args.manifest.sources.map((source) => [source.sourceKey, source]));
  const infrastructureFailures = args.sourceObservations.filter((observation) => sourceError(observation.status)).length;
  const outage = args.manifest.sources.length > 0 && infrastructureFailures / args.manifest.sources.length >= 0.8;
  const records = [...args.manifest.entries].sort((left, right) => left.observationKey.localeCompare(right.observationKey)).map((entry) => {
    const policy = mappedPolicy(entry, args.authority);
    const expiry = policy ? expectedExpiry(entry, policy) : null;
    const expiryMatches = expiry !== null && Date.parse(expiry) === Date.parse(entry.freshnessExpiresAt);
    const classifications = new Set<RawMonitorClassification>();
    let timeState: RawMonitorRecord["timeState"] = "AUTHORITY_MISSING";
    let daysRemaining: number | null = null;
    if (!policy || !expiryMatches) {
      classifications.add("AUTHORITY_MISSING");
    } else if (entry.sourceExplicitStartsAt && Date.parse(entry.sourceExplicitStartsAt) > Date.parse(args.checkedAt)) {
      timeState = "FUTURE_EFFECTIVE_HOLD";
      classifications.add("FUTURE_EFFECTIVE_HOLD");
    } else {
      const freshness = classifyFreshness(expiry, args.checkedAt);
      timeState = freshness.status === "STALE" ? "TIME_EXPIRED" : freshness.status;
      daysRemaining = freshness.daysRemaining;
      classifications.add(timeState);
      if (entry.kind === "restriction" && timeState === "TIME_EXPIRED") {
        classifications.add("NO_CURRENT_RESTRICTION_AUTHORITY");
      }
    }

    const entrySources = entry.sourceKeys.map((key) => sources.get(key)!).filter(Boolean);
    const entryObservations = entry.sourceKeys.map((key) => observations.get(key)).filter(Boolean) as EnrichmentSourceObservation[];
    let supportStatus: RawMonitorRecord["supportStatus"] = "NOT_CHECKED";
    if (entry.supportCheck.mode === "CHECK_UNAVAILABLE") {
      supportStatus = "CHECK_UNAVAILABLE";
      classifications.add("CHECK_UNAVAILABLE");
    }
    if (entryObservations.length !== entry.sourceKeys.length || entryObservations.some((observation) => sourceError(observation.status))) {
      classifications.add("MONITOR_ERROR");
    } else if (entryObservations.every((observation) => !["AVAILABLE", "REDIRECTED_VALID"].includes(observation.status))) {
      classifications.add("SOURCE_UNAVAILABLE");
    } else {
      const availablePairs = entrySources.flatMap((source) => {
        const observation = observations.get(source.sourceKey);
        return observation && ["AVAILABLE", "REDIRECTED_VALID"].includes(observation.status) ? [{ source, observation }] : [];
      });
      const boundPairs = availablePairs.filter(({ source, observation }) => {
        const content = observation.normalizedContent ?? "";
        return source.facilityIdentityPatternGroups.length === 0 || patternsPresent(source.facilityIdentityPatternGroups, content);
      });
      if (availablePairs.length > 0 && boundPairs.length === 0) classifications.add("FACILITY_BINDING_DRIFT");
      if (boundPairs.some(({ source, observation }) =>
        rawMonitorRequestKey(observation.finalUrl ?? "") !== rawMonitorRequestKey(source.canonicalUrl)
        || observation.materialRedirect)) classifications.add("SOURCE_REVIEW_REQUIRED");
      if (entry.supportCheck.mode === "TEXT_PATTERN") {
        const patternGroups = entry.supportCheck.patternGroups;
        supportStatus = boundPairs.some(({ observation }) => patternsPresent(patternGroups, observation.normalizedContent ?? ""))
          ? "PRESENT"
          : "MISSING";
        if (supportStatus === "MISSING" && boundPairs.length > 0) classifications.add("SUPPORT_DRIFT");
      }
    }

    const currentForDependencyEvaluation = ["FRESH", "DUE_SOON", "URGENT"].includes(timeState)
      && !["AUTHORITY_MISSING", "FUTURE_EFFECTIVE_HOLD", "SUPPORT_DRIFT", "FACILITY_BINDING_DRIFT"].some((value) => classifications.has(value as RawMonitorClassification));
    let severity: Severity = "INFO";
    if (classifications.has("DUE_SOON") || classifications.has("MONITOR_ERROR") || classifications.has("SOURCE_UNAVAILABLE")) severity = maxSeverity(severity, "WARNING");
    if (classifications.has("URGENT") || classifications.has("SUPPORT_DRIFT") || classifications.has("FACILITY_BINDING_DRIFT") || classifications.has("SOURCE_REVIEW_REQUIRED")) severity = maxSeverity(severity, "HIGH");
    if (classifications.has("TIME_EXPIRED") || classifications.has("AUTHORITY_MISSING")) severity = "CRITICAL";
    return {
      observationKey: entry.observationKey,
      kind: entry.kind,
      locationId: entry.locationId,
      hgyId: entry.hgyId,
      facilityName: entry.facilityName,
      typeKeys: entry.typeKeys,
      policyKey: entry.policyKey,
      reviewedAt: entry.reviewedAt,
      freshnessExpiresAt: entry.freshnessExpiresAt,
      effectiveFreshnessExpiresAt: expiry,
      timeState,
      daysRemaining,
      sourceStatuses: entry.sourceKeys.map((key) => observations.get(key)?.status ?? "UNKNOWN"),
      supportStatus,
      classifications: [...classifications].sort(),
      currentForDependencyEvaluation,
      reconfirmed: false,
      reviewRequired: [...classifications].some((value) => !["FRESH", "CHECK_UNAVAILABLE", "MONITOR_ERROR"].includes(value)),
      severity,
      checkedAt: args.checkedAt,
    } satisfies RawMonitorRecord;
  });
  const runIssues: RawMonitorRun["runIssues"] = outage
    ? [{ code: "MONITOR_SOURCE_OUTAGE", severity: "CRITICAL", message: "At least 80% of raw monitor sources had infrastructure failures; no support or binding disappearance conclusion is inferred." }]
    : [];
  const uniqueSourceUrls = new Set(args.manifest.sources.map((source) => rawMonitorRequestKey(source.url))).size;
  return {
    schemaVersion: 1,
    mode: args.manifest.mode,
    checkedAt: args.checkedAt,
    durationMs: args.durationMs ?? 0,
    entries: records.length,
    rawFacts: records.filter((record) => record.kind === "raw_fact").length,
    restrictions: records.filter((record) => record.kind === "restriction").length,
    uniqueSources: uniqueSourceUrls,
    records,
    reviewQueue: records.filter((record) => record.reviewRequired),
    runIssues,
    requestStats: {
      entries: records.length,
      uniqueSources: uniqueSourceUrls,
      requestsAfterDedup: args.requestStats?.requestsAfterDedup ?? 0,
      retries: args.requestStats?.retries ?? 0,
      concurrency: args.requestStats?.concurrency ?? 0,
    },
  };
}

export function summarizeRawMonitorRun(run: RawMonitorRun) {
  const count = (classification: RawMonitorClassification) =>
    run.records.filter((record) => record.classifications.includes(classification)).length;
  return [
    "# HYROX raw fact/restriction freshness monitor",
    "",
    `Mode: ${run.mode}`,
    `Checked at: ${run.checkedAt}`,
    `Duration: ${(run.durationMs / 1_000).toFixed(1)}s`,
    `Live/candidate entries: ${run.entries}`,
    `Raw facts: ${run.rawFacts}`,
    `Restrictions: ${run.restrictions}`,
    `Unique sources: ${run.uniqueSources}`,
    `Requests after dedup: ${run.requestStats.requestsAfterDedup}`,
    `FRESH: ${count("FRESH")}`,
    `DUE_SOON: ${count("DUE_SOON")}`,
    `URGENT: ${count("URGENT")}`,
    `TIME_EXPIRED: ${count("TIME_EXPIRED")}`,
    `SUPPORT_DRIFT: ${count("SUPPORT_DRIFT")}`,
    `FACILITY_BINDING_DRIFT: ${count("FACILITY_BINDING_DRIFT")}`,
    `MONITOR_ERROR: ${count("MONITOR_ERROR")}`,
    `SOURCE_UNAVAILABLE: ${count("SOURCE_UNAVAILABLE")}`,
    `SOURCE_REVIEW_REQUIRED: ${count("SOURCE_REVIEW_REQUIRED")}`,
    `AUTHORITY_MISSING: ${count("AUTHORITY_MISSING")}`,
    `CHECK_UNAVAILABLE: ${count("CHECK_UNAVAILABLE")}`,
    `FUTURE_EFFECTIVE_HOLD: ${count("FUTURE_EFFECTIVE_HOLD")}`,
    `NO_CURRENT_RESTRICTION_AUTHORITY: ${count("NO_CURRENT_RESTRICTION_AUTHORITY")}`,
    `Review queue: ${run.reviewQueue.length}`,
    `Run-level issues: ${run.runIssues.length}`,
    "",
    "Monitor observations never reconfirm evidence, extend freshness, publish restrictions, or write Production data.",
  ].join("\n");
}
