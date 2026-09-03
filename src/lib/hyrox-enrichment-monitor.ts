import { createHash } from "node:crypto";
import { classifyFreshness, type FreshnessStatus, type Severity, type SourceStatus } from "./hyrox-monitor";

export type EnrichmentClaimKind = "equipment" | "capability";
export type EnrichmentClassification =
  | "NO_CHANGE"
  | "DUE_SOON_RECONFIRMATION"
  | "URGENT_RECONFIRMATION"
  | "STALE_RECONFIRMATION_REQUIRED"
  | "REVIEW_REQUIRED_SOURCE_URL"
  | "REVIEW_REQUIRED_CLAIM_SUPPORT"
  | "SOURCE_UNAVAILABLE"
  | "PUBLICATION_MISMATCH"
  | "MONITOR_ERROR";
export type PublicationState = "PUBLISHED_CURRENT" | "EXPECTED_STALE_UNPUBLISHED" | "UNEXPECTED_PUBLICATION_MISSING" | "PUBLICATION_MISMATCH";

export type EnrichmentMonitorSource = {
  sourceKey: string;
  locationId: string;
  hgyId: string;
  url: string;
  canonicalUrl: string;
  quality: "Q1" | "Q2";
  publisherAuthority: string;
};

export type EnrichmentMonitorClaim = {
  claimKey: string;
  kind: EnrichmentClaimKind;
  locationId: string;
  locationSlug: string;
  locationName: string;
  hgyId: string;
  slug: string;
  sourceKey: string;
  lastConfirmedAt: string;
  staleAt: string;
  freshnessHorizonDays: number;
  evidenceHash: string;
  supportPatternGroups: string[][];
};

export type EnrichmentAuthorityManifest = {
  schemaVersion: 1 | 2;
  authority: {
    h3_4Commit?: string;
    h3_5Commit?: string;
    h3_4CandidateHash?: string;
    h3_4CandidateFileSha256?: string;
    h3_5ReceiptSha256?: string;
    importedAt?: string;
    currentManifestHash?: string;
    deltaHash?: string;
    dbCandidateHash?: string;
  };
  counts: { sources: number; uniqueExternalUrls?: number; equipment: number; capabilities: number; claims: number; enrichedLocations: number };
  sources: EnrichmentMonitorSource[];
  claims: EnrichmentMonitorClaim[];
  manifestHash: string;
};

export type PublishedEnrichmentClaim = {
  kind: EnrichmentClaimKind;
  locationId: string;
  slug: string;
  lastConfirmedAt: string;
  staleAt: string;
};

export type EnrichmentSourceObservation = {
  sourceKey: string;
  status: SourceStatus;
  requestedUrl: string;
  finalUrl: string | null;
  canonicalUrl: string | null;
  httpStatus: number | null;
  attempts: number;
  error: string | null;
  materialRedirect: boolean;
  normalizedContent?: string;
};

export type EnrichmentMonitorRecord = {
  claimKey: string;
  kind: EnrichmentClaimKind;
  locationId: string;
  locationSlug: string;
  locationName: string;
  hgyId: string;
  slug: string;
  sourceKey: string;
  sourceUrl: string;
  sourceStatus: SourceStatus;
  claimSupportStatus: "PRESENT" | "MISSING" | "NOT_CHECKED";
  publicationState: PublicationState;
  freshness: ReturnType<typeof classifyFreshness>;
  classifications: EnrichmentClassification[];
  reviewRequired: boolean;
  severity: Severity;
  recommendedAction: string;
  checkedAt: string;
};

export type EnrichmentMonitorRun = {
  schemaVersion: 1;
  checkedAt: string;
  durationMs: number;
  monitoredSources: number;
  monitoredClaims: number;
  equipmentClaims: number;
  capabilityClaims: number;
  records: EnrichmentMonitorRecord[];
  reviewQueue: EnrichmentMonitorRecord[];
  publicationExtras: string[];
  sourceIssues: Array<{ sourceKey: string; status: SourceStatus; error: string | null; affectedClaims: number }>;
  runIssues: Array<{ code: "MONITOR_SOURCE_OUTAGE" | "PUBLICATION_EXTRA" | "MANIFEST_INTEGRITY_ERROR"; severity: "CRITICAL" | "HIGH"; message: string }>;
  requestStats: { sources: number; retries: number; concurrency: number };
};

function canonicalize(value: unknown, releaseAuthority = false): unknown {
  if (Array.isArray(value)) return value.map((item) => canonicalize(item, releaseAuthority));
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value as Record<string, unknown>)
    .filter(([key]) => key !== "manifestHash" && (!releaseAuthority || !["candidateHash", "deltaHash", "releaseHash", "liveVerification"].includes(key)))
    .sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, canonicalize(item, releaseAuthority)]));
  return value;
}

export function enrichmentManifestHash(value: Omit<EnrichmentAuthorityManifest, "manifestHash"> | EnrichmentAuthorityManifest) {
  const releaseAuthority = (value as EnrichmentAuthorityManifest).schemaVersion === 2;
  return createHash("sha256").update(JSON.stringify(canonicalize(value, releaseAuthority))).digest("hex");
}

export function enrichmentClaimKey(kind: EnrichmentClaimKind, locationId: string, slug: string) {
  return `${kind}:${locationId}:${slug}`;
}

export function validateEnrichmentManifest(manifest: EnrichmentAuthorityManifest): EnrichmentAuthorityManifest {
  const h35 = manifest.schemaVersion === 1 && manifest.counts.sources === 10 && manifest.sources.length === 10 &&
    manifest.counts.equipment === 36 && manifest.counts.capabilities === 16 && manifest.counts.claims === 52 &&
    manifest.claims.length === 52 && manifest.counts.enrichedLocations === 9 &&
    manifest.authority.h3_4CandidateHash === "f47f7edcb4fb63120d35e44ed2bda50c8c61e779724d4f12453a48037d280ae8" &&
    manifest.authority.h3_5Commit === "1e220e091c0e4f47af06ee8c4b3a77bf26a883db";
  const h38 = manifest.schemaVersion === 2 && manifest.counts.sources === 26 && manifest.sources.length === 26 &&
    manifest.counts.equipment === 109 && manifest.counts.capabilities === 41 && manifest.counts.claims === 150 &&
    manifest.claims.length === 150 && manifest.counts.enrichedLocations === 25 &&
    manifest.authority.currentManifestHash === "cf15436a522e0571a53d9e8b3f9bf3722ebe5f5bfee6e3e2cefddcdcf7538299" &&
    manifest.authority.deltaHash === "f3cfeca4db5828308e6cb85d4c370153d61a489d11429ad6618d4bae0b02e79a" &&
    manifest.authority.dbCandidateHash === "9610b5ea03d43c78823857620d4813203f6db2a1e12632c5c559dffec19ba83e";
  const h311d = manifest.schemaVersion === 2 && manifest.counts.sources === 36 && manifest.sources.length === 36 &&
    manifest.counts.equipment === 128 && manifest.counts.capabilities === 59 && manifest.counts.claims === 187 &&
    manifest.claims.length === 187 && manifest.counts.enrichedLocations === 33 &&
    manifest.authority.currentManifestHash === "cf15436a522e0571a53d9e8b3f9bf3722ebe5f5bfee6e3e2cefddcdcf7538299" &&
    manifest.authority.deltaHash === "f3cfeca4db5828308e6cb85d4c370153d61a489d11429ad6618d4bae0b02e79a" &&
    manifest.authority.dbCandidateHash === "9610b5ea03d43c78823857620d4813203f6db2a1e12632c5c559dffec19ba83e";
  const h311dCohort2 = manifest.schemaVersion === 2 && manifest.counts.sources === 42 && manifest.sources.length === 42 &&
    manifest.counts.equipment === 164 && manifest.counts.capabilities === 62 && manifest.counts.claims === 226 &&
    manifest.claims.length === 226 && manifest.counts.enrichedLocations === 39 &&
    manifest.authority.currentManifestHash === "cf15436a522e0571a53d9e8b3f9bf3722ebe5f5bfee6e3e2cefddcdcf7538299" &&
    manifest.authority.deltaHash === "f3cfeca4db5828308e6cb85d4c370153d61a489d11429ad6618d4bae0b02e79a" &&
    manifest.authority.dbCandidateHash === "9610b5ea03d43c78823857620d4813203f6db2a1e12632c5c559dffec19ba83e";
  if (!h35 && !h38 && !h311d && !h311dCohort2) throw new Error("HYROX enrichment manifest authority/count mismatch");
  if (enrichmentManifestHash(manifest) !== manifest.manifestHash) throw new Error("Enrichment manifest hash mismatch");
  const sourceKeys = new Set(manifest.sources.map((item) => item.sourceKey));
  const expectedUrls = h311dCohort2 ? 31 : h311d ? 25 : h38 ? 15 : 10;
  if (sourceKeys.size !== manifest.counts.sources || new Set(manifest.sources.map((item) => item.url)).size !== expectedUrls ||
      new Set(manifest.claims.map((item) => item.claimKey)).size !== manifest.counts.claims ||
      manifest.claims.some((item) => !sourceKeys.has(item.sourceKey) || item.claimKey !== enrichmentClaimKey(item.kind, item.locationId, item.slug) ||
        item.supportPatternGroups.length === 0 || item.supportPatternGroups.some((group) => group.length === 0))) throw new Error("Enrichment manifest natural identity/support mismatch");
  return manifest;
}

export function normalizeSupportText(value: string) {
  return value.normalize("NFKC").toLocaleLowerCase("ja-JP").replace(/&nbsp;|&#160;/g, " ")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ").replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ").replace(/[’‘]/g, "'").replace(/[‐‑‒–—―−]/g, "-").replace(/\s+/g, " ").trim();
}

export function claimSupportPresent(claim: EnrichmentMonitorClaim, normalizedContent: string) {
  const content = normalizeSupportText(normalizedContent);
  return claim.supportPatternGroups.every((group) => group.some((pattern) => content.includes(normalizeSupportText(pattern))));
}

function sourceOutage(observations: EnrichmentSourceObservation[]) {
  if (observations.length === 0) return true;
  const failures = observations.filter((item) => ["TEMPORARILY_UNREACHABLE", "ACCESS_RESTRICTED", "UNKNOWN"].includes(item.status));
  return failures.length / observations.length >= 0.8;
}

function sameInstant(left: string | undefined, right: string) {
  return left !== undefined && Date.parse(left) === Date.parse(right);
}

const severityRank: Record<Severity, number> = { INFO: 0, WARNING: 1, HIGH: 2, CRITICAL: 3 };
function maxSeverity(left: Severity, right: Severity): Severity { return severityRank[right] > severityRank[left] ? right : left; }

function action(classifications: EnrichmentClassification[]) {
  if (classifications.includes("STALE_RECONFIRMATION_REQUIRED")) return "Perform reviewed reconfirmation; publication may already be fail-closed.";
  if (classifications.includes("URGENT_RECONFIRMATION")) return "Complete reviewed reconfirmation before stale_at.";
  if (classifications.includes("REVIEW_REQUIRED_CLAIM_SUPPORT")) return "Review the first-party source; do not infer unavailability or delete the claim.";
  if (classifications.includes("REVIEW_REQUIRED_SOURCE_URL")) return "Review the redirect/canonical relation; do not rewrite production automatically.";
  if (classifications.includes("PUBLICATION_MISMATCH")) return "Review manifest and public projection before any production change.";
  if (classifications.includes("SOURCE_UNAVAILABLE")) return "Retry later and review only if the source remains unavailable.";
  if (classifications.includes("DUE_SOON_RECONFIRMATION")) return "Queue reviewed reconfirmation within 30 days.";
  return "No action required.";
}

export function buildEnrichmentMonitorRun(args: {
  manifest: EnrichmentAuthorityManifest;
  publishedClaims: PublishedEnrichmentClaim[];
  sourceObservations: EnrichmentSourceObservation[];
  checkedAt: string;
  durationMs?: number;
  requestStats?: EnrichmentMonitorRun["requestStats"];
}): EnrichmentMonitorRun {
  const manifest = validateEnrichmentManifest(args.manifest);
  const published = new Map(args.publishedClaims.map((item) => [enrichmentClaimKey(item.kind, item.locationId, item.slug), item]));
  const expected = new Set(manifest.claims.map((item) => item.claimKey));
  const observations = new Map(args.sourceObservations.map((item) => [item.sourceKey, item]));
  const outage = sourceOutage(args.sourceObservations);
  const records = [...manifest.claims].sort((a, b) => a.claimKey.localeCompare(b.claimKey)).map((claim) => {
    const source = manifest.sources.find((item) => item.sourceKey === claim.sourceKey)!;
    const observation = observations.get(claim.sourceKey);
    const freshness = classifyFreshness(claim.staleAt, args.checkedAt);
    freshness.lastConfirmedAt = claim.lastConfirmedAt;
    const current = published.get(claim.claimKey);
    const timestampsMatch = sameInstant(current?.lastConfirmedAt, claim.lastConfirmedAt) && sameInstant(current?.staleAt, claim.staleAt);
    const publicationState: PublicationState = current && timestampsMatch
      ? (freshness.status === "STALE" ? "PUBLICATION_MISMATCH" : "PUBLISHED_CURRENT")
      : !current && freshness.status === "STALE" ? "EXPECTED_STALE_UNPUBLISHED"
        : !current ? "UNEXPECTED_PUBLICATION_MISSING" : "PUBLICATION_MISMATCH";
    const classifications = new Set<EnrichmentClassification>();
    let support: EnrichmentMonitorRecord["claimSupportStatus"] = "NOT_CHECKED";
    if (!observation) classifications.add("MONITOR_ERROR");
    else if (outage && ["TEMPORARILY_UNREACHABLE", "ACCESS_RESTRICTED", "UNKNOWN"].includes(observation.status)) classifications.add("MONITOR_ERROR");
    else if (!["AVAILABLE", "REDIRECTED_VALID"].includes(observation.status)) classifications.add("SOURCE_UNAVAILABLE");
    else {
      support = claimSupportPresent(claim, observation.normalizedContent ?? "") ? "PRESENT" : "MISSING";
      if (observation.materialRedirect) classifications.add("REVIEW_REQUIRED_SOURCE_URL");
      if (support === "MISSING") classifications.add("REVIEW_REQUIRED_CLAIM_SUPPORT");
    }
    if (["UNEXPECTED_PUBLICATION_MISSING", "PUBLICATION_MISMATCH"].includes(publicationState)) classifications.add("PUBLICATION_MISMATCH");
    if (freshness.status === "DUE_SOON") classifications.add("DUE_SOON_RECONFIRMATION");
    if (freshness.status === "URGENT") classifications.add("URGENT_RECONFIRMATION");
    if (freshness.status === "STALE") classifications.add("STALE_RECONFIRMATION_REQUIRED");
    if (classifications.size === 0) classifications.add("NO_CHANGE");
    let severity: Severity = "INFO";
    if (classifications.has("DUE_SOON_RECONFIRMATION") || classifications.has("SOURCE_UNAVAILABLE")) severity = maxSeverity(severity, "WARNING");
    if (["URGENT_RECONFIRMATION", "REVIEW_REQUIRED_SOURCE_URL", "REVIEW_REQUIRED_CLAIM_SUPPORT", "PUBLICATION_MISMATCH"].some((item) => classifications.has(item as EnrichmentClassification))) severity = maxSeverity(severity, "HIGH");
    if (classifications.has("STALE_RECONFIRMATION_REQUIRED")) severity = "CRITICAL";
    if (outage && classifications.has("MONITOR_ERROR")) severity = "INFO";
    const sorted = [...classifications].sort();
    return {
      claimKey: claim.claimKey, kind: claim.kind, locationId: claim.locationId, locationSlug: claim.locationSlug,
      locationName: claim.locationName, hgyId: claim.hgyId, slug: claim.slug, sourceKey: claim.sourceKey,
      sourceUrl: source.url, sourceStatus: observation?.status ?? "UNKNOWN", claimSupportStatus: support,
      publicationState, freshness, classifications: sorted,
      reviewRequired: sorted.some((item) => item !== "NO_CHANGE" && item !== "MONITOR_ERROR") || freshness.status !== "FRESH",
      severity, recommendedAction: action(sorted), checkedAt: args.checkedAt,
    } satisfies EnrichmentMonitorRecord;
  });
  const extras = [...published.keys()].filter((key) => !expected.has(key)).sort();
  const runIssues: EnrichmentMonitorRun["runIssues"] = [];
  if (outage) runIssues.push({ code: "MONITOR_SOURCE_OUTAGE", severity: "CRITICAL", message: "At least 80% of source requests had infrastructure-style failures; per-claim disappearance conclusions are suppressed." });
  if (extras.length > 0) runIssues.push({ code: "PUBLICATION_EXTRA", severity: "HIGH", message: `${extras.length} published claims are not enrolled in the reviewed monitor manifest.` });
  const sourceIssues = manifest.sources.map((source) => {
    const observed = observations.get(source.sourceKey);
    return { sourceKey: source.sourceKey, status: observed?.status ?? "UNKNOWN", error: observed?.error ?? "Missing source observation", affectedClaims: manifest.claims.filter((claim) => claim.sourceKey === source.sourceKey).length };
  }).filter((item) => !["AVAILABLE", "REDIRECTED_VALID"].includes(item.status));
  return {
    schemaVersion: 1, checkedAt: args.checkedAt, durationMs: args.durationMs ?? 0,
    monitoredSources: manifest.sources.length, monitoredClaims: records.length,
    equipmentClaims: records.filter((item) => item.kind === "equipment").length,
    capabilityClaims: records.filter((item) => item.kind === "capability").length,
    records, reviewQueue: records.filter((item) => item.reviewRequired), publicationExtras: extras,
    sourceIssues, runIssues, requestStats: args.requestStats ?? { sources: 0, retries: 0, concurrency: 0 },
  };
}

export function summarizeEnrichmentMonitorRun(run: EnrichmentMonitorRun) {
  const freshness = (status: FreshnessStatus) => run.records.filter((item) => item.freshness.status === status).length;
  const classified = (value: EnrichmentClassification) => run.records.filter((item) => item.classifications.includes(value)).length;
  return [
    "# HYROX enrichment freshness monitor", "", `Checked at: ${run.checkedAt}`, `Duration: ${(run.durationMs / 1_000).toFixed(1)}s`,
    `Monitored sources: ${run.monitoredSources}`, `Monitored claims: ${run.monitoredClaims}`, `Equipment: ${run.equipmentClaims}`, `Capabilities: ${run.capabilityClaims}`,
    `FRESH: ${freshness("FRESH")}`, `DUE_SOON: ${freshness("DUE_SOON")}`, `URGENT: ${freshness("URGENT")}`, `STALE: ${freshness("STALE")}`,
    `NO_CHANGE: ${classified("NO_CHANGE")}`, `Source URL reviews: ${classified("REVIEW_REQUIRED_SOURCE_URL")}`,
    `Claim-support reviews: ${classified("REVIEW_REQUIRED_CLAIM_SUPPORT")}`, `Source unavailable: ${classified("SOURCE_UNAVAILABLE")}`,
    `Publication mismatch: ${classified("PUBLICATION_MISMATCH")}`, `Monitor errors: ${classified("MONITOR_ERROR")}`,
    `Review queue: ${run.reviewQueue.length}`, `Publication extras: ${run.publicationExtras.length}`, `Run-level issues: ${run.runIssues.length}`, "", "## Review queue", "",
    ...(run.reviewQueue.length ? run.reviewQueue.map((item) => `- **${item.severity}** ${item.locationName} / ${item.kind}:${item.slug} — ${item.classifications.join(", ")} (${item.freshness.daysRemaining} days)`) : ["No claims require review."]),
    "", "Missing support, source failure, and staleness are review signals—not negative equipment/capability facts.",
    "No production data was changed. Monitor observations do not extend freshness.",
  ].join("\n");
}
