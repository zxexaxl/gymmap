/* eslint-disable @typescript-eslint/no-explicit-any -- deterministic authority JSON is validated at runtime */
import { createHash } from "node:crypto";
import { enrichmentManifestHash, type EnrichmentAuthorityManifest } from "./hyrox-enrichment-monitor";
import {
  rawMonitorManifestHash,
  rawMonitorPacketHash,
  rawMonitorReleaseCoherenceHash,
  type RawMonitorManifest,
} from "./hyrox-raw-fact-monitor";

type Json = Record<string, any>;

export const ACCEPTED_COHORT_HASHES = {
  cohortIdentity: "1c53bd0698c0d1998f25e227409ee35c788c274994a22711e1dec1a323ce8fda",
  reviewPacket: "e86585713574c03663b27cfdbb2b9c3a1ab0b5940a491a9d5b78bf73a6983172",
  ledgerCandidate: "fce0ff185ddc571c59d12c96cab80b56b574544b4de8b7a4c717d1c8c9ecd536",
  positiveCandidate: "fe820952c155b43ff3249ec5c686f32c92484816293c5296494abd39916a3804",
  persistenceGap: "9cc5248c71cd941af327d79a96b91ef33cbe4041dcd58df1f3d4df61f0f1d89c",
} as const;

export const ACCEPTED_R2_HASHES = {
  freshnessPolicy: "42ed943a807d505b3fdc4deadef0bc94014d0007287ca752d366cc83e2c31295",
  factMapping: "8beedc6399f50209660b69e97911a735428a2ac76fc93525e6d1d0bd88021c9f",
  restrictionMapping: "39b6c945b5539571764dc5cc923929ed3d872b97e6780e77f5a51d8cd793a720",
  cohort1Mapping: "7bf0c89e92247a3571cda4d66616616473903413bcc0cd36641c382beabecd1e",
} as const;

export const ACCEPTED_R3_HASHES = {
  liveManifest: "e29b61edbe1f3dea1912ebfdd147d4dd866304230ed069fd4799a4f1317b1e84",
  liveMonitorPacket: "ccac7a73af03d30714c044b38f4ca9f5d1fe9fbbae57894f84b1f0821aeccf03",
} as const;

function canonicalize(value: unknown, excluded = new Set<string>()): unknown {
  if (Array.isArray(value)) return value.map((item) => canonicalize(item, excluded));
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value as Json)
    .filter(([key]) => !excluded.has(key))
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, item]) => [key, canonicalize(item, excluded)]));
  return value;
}

export function cohortReleaseHash(value: unknown) {
  return createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
}

export function cohortReleaseManifestHash(value: unknown) {
  return createHash("sha256").update(JSON.stringify(canonicalize(value, new Set(["manifestHash"])))).digest("hex");
}

export function deterministicUuid(scope: string, key: string) {
  const value = createHash("sha256").update(`gymmap:${scope}:${key}`).digest("hex").slice(0, 32).split("");
  value[12] = "5";
  value[16] = ((Number.parseInt(value[16], 16) & 3) | 8).toString(16);
  const hex = value.join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

const sourceKind: Record<string, string> = {
  GOVERNING_BODY_FINDER_DETAIL: "finder",
  FACILITY_SPECIFIC_OFFICIAL_PAGE: "facility_page",
  BRAND_OFFICIAL_FACILITY_PAGE: "facility_page",
  OFFICIAL_EQUIPMENT_PAGE: "facility_page",
  OFFICIAL_HYROX_TRAINING_PAGE: "facility_page",
  OFFICIAL_PROGRAM_SERVICE_PAGE: "facility_page",
  OFFICIAL_BOOKING_MEMBER_SYSTEM: "schedule",
  OFFICIAL_SCHEDULE_PAGE: "schedule",
  OFFICIAL_SOCIAL_MEDIA: "social_post",
  OFFICIAL_IMAGE_GALLERY: "facility_page",
};

const publisherAuthority: Record<string, string> = {
  GOVERNING_BODY_FINDER_DETAIL: "governing_body",
  OFFICIAL_SCHEDULE_PAGE: "official_schedule",
  OFFICIAL_BOOKING_MEMBER_SYSTEM: "official_schedule",
  OFFICIAL_SOCIAL_MEDIA: "official_social",
};

const supportPatterns: Record<string, string[][]> = {
  "ski-erg": [["skierg", "ski erg", "スキーエルゴ"]],
  "row-erg": [["rower", "rowing", "row erg", "rowerg", "ローイング"]],
  sandbag: [["sandbag", "サンドバッグ"]],
  "weighted-sled": [["sled", "スレッド"]],
  "farmers-carry-implements": [["farmers", "farmer's", "ファーマーズ"]],
  treadmill: [["treadmill", "トレッドミル"]],
  "wall-ball-target": [["wall ball", "wall balls", "ウォールボール"]],
  "discipline-coaching": [["hyrox"], ["class", "training", "coach", "クラス", "トレーニング", "指導"]],
  "open-training": [["open gym", "free use", "フリー利用", "自主トレ"]],
  "competition-simulation": [["simulation", "シミュレーション"]],
  "sled-push-pull-space": [["sled", "スレッド"], ["turf", "lane", "space", "スペース", "1階"]],
};

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function unique<T>(values: T[]) { return [...new Set(values)]; }

function assertAcceptedHashes(raw: Json) {
  for (const [key, value] of Object.entries({
    COHORT_1_IDENTITY_SHA256: ACCEPTED_COHORT_HASHES.cohortIdentity,
    REVIEW_PACKET_SHA256: ACCEPTED_COHORT_HASHES.reviewPacket,
    LEDGER_CANDIDATE_SHA256: ACCEPTED_COHORT_HASHES.ledgerCandidate,
    POSITIVE_CANDIDATE_SHA256: ACCEPTED_COHORT_HASHES.positiveCandidate,
    PERSISTENCE_GAP_SHA256: ACCEPTED_COHORT_HASHES.persistenceGap,
  })) assert(raw.deterministic_hashes?.[key] === value, `Accepted Cohort hash mismatch: ${key}`);
}

function rowKey(factId: string, values: string[], value: string) {
  return values.length === 1 || values[0] === value ? factId : `${factId}|${value}`;
}

function relationFor(args: {
  ledger: Json;
  cycleKey: string;
  aspect: string;
  dimensions: string[];
  sourceRef: string;
}) {
  const units = args.ledger.units.filter((unit: Json) => unit.cycle_key === args.cycleKey && unit.review_aspect === args.aspect);
  const preferred = args.dimensions.length ? units.filter((unit: Json) => args.dimensions.includes(unit.dimension)) : units;
  for (const unit of [...preferred, ...units]) {
    const relation = args.ledger.unit_sources.find((row: Json) => row.unit_key === unit.unit_key && row.source_ref === args.sourceRef);
    if (relation) return { unit, relation };
  }
  throw new Error(`No review source relation for ${args.cycleKey}/${args.aspect}/${args.sourceRef}`);
}

function canonicalMonitorClaim(claim: Json, kind: "equipment" | "capability", facilities: Map<string, Json>, evidence: Json[]) {
  const facility = facilities.get(claim.location_id)!;
  const slug = kind === "equipment" ? claim.equipment_slug : claim.capability_slug;
  const claimEvidence = evidence.filter((row) => row.claim_key === claim.claim_key);
  const sourceRef = claim.source_refs[0];
  return {
    claimKey: `${kind}:${claim.location_id}:${slug}`,
    kind,
    locationId: claim.location_id,
    locationSlug: facility.slug,
    locationName: facility.facility_name,
    hgyId: claim.hgy_id,
    slug,
    sourceKey: `cohort1:${sourceRef}`,
    lastConfirmedAt: claim.last_confirmed_at,
    staleAt: claim.stale_at,
    freshnessHorizonDays: Math.round((Date.parse(claim.stale_at) - Date.parse(claim.last_confirmed_at)) / 86_400_000),
    evidenceHash: cohortReleaseHash(claimEvidence),
    supportPatternGroups: supportPatterns[slug] ?? [[slug]],
  };
}

export function buildCohort1Release(args: {
  raw: Json;
  ledger: Json;
  positive: Json;
  r2: Json;
  r3Candidate: RawMonitorManifest;
  existingEnrichment: EnrichmentAuthorityManifest;
  sourceRecheck: Json;
  sourceMain: string;
}) {
  assertAcceptedHashes(args.raw);
  assertAcceptedHashes(args.ledger);
  assertAcceptedHashes(args.positive);
  assert(args.raw.facilities.length === 8, "Cohort must contain eight facilities");
  assert(args.ledger.cycles.length === 8 && args.ledger.units.length === 296 && args.ledger.unit_sources.length === 476, "Accepted ledger counts changed");
  assert(args.positive.equipment_claims.length === 19 && args.positive.capability_claims.length === 18 && args.positive.evidence_relationships.length === 38, "Accepted canonical packet counts changed");
  assert(args.r2.deterministic_hashes.freshness_policy_authority_sha256 === ACCEPTED_R2_HASHES.freshnessPolicy, "R2 policy hash mismatch");
  assert(args.r2.deterministic_hashes.fact_policy_mapping_sha256 === ACCEPTED_R2_HASHES.factMapping, "R2 fact hash mismatch");
  assert(args.r2.deterministic_hashes.restriction_policy_mapping_sha256 === ACCEPTED_R2_HASHES.restrictionMapping, "R2 restriction hash mismatch");
  assert(args.r2.deterministic_hashes.cohort1_freshness_mapping_sha256 === ACCEPTED_R2_HASHES.cohort1Mapping, "R2 Cohort hash mismatch");
  assert(args.r3Candidate.counts.rawFacts === 19 && args.r3Candidate.counts.restrictions === 4 && args.r3Candidate.entries.length === 23, "R3 candidate counts changed");
  assert(args.sourceRecheck.counts.checked === 24 && args.sourceRecheck.counts.supportDrift === 0 && args.sourceRecheck.counts.bindingDrift === 0, "Source recheck is not release eligible");

  const facilityById = new Map<string, Json>(args.raw.facilities.map((row: Json) => [row.identity.location_id, row.identity]));
  const sourceRows: Json[] = args.raw.sources.map((source: Json) => ({
    sourceRef: source.source_ref,
    resolution: source.training_source_resolution === "REUSE_EXISTING_TRAINING_SOURCE" ? "REUSE_EXISTING_SOURCE" : "NEW_SOURCE_INSERT",
    id: source.existing_training_source_id ?? deterministicUuid("cohort1-source", source.source_ref),
    locationId: source.location_id,
    hgyId: source.hgy_id,
    url: source.requested_url,
    canonicalUrl: source.canonical_url ?? source.final_url,
    sourceKind: sourceKind[source.source_class] ?? "other",
    publisherAuthority: publisherAuthority[source.source_class] ?? "facility_official",
    availabilityState: "available",
    lastCheckedAt: source.observed_at,
    contentHash: source.content_sha256,
    sourceClass: source.source_class,
    facilityBinding: source.facility_binding,
    metadata: { sourceRef: source.source_ref, sourceClass: source.source_class, facilityBinding: source.facility_binding, release: "h3-11d-cohort1" },
  }));
  const sourceByRef = new Map<string, Json>(sourceRows.map((row: Json) => [row.sourceRef, row]));

  const cycles: Json[] = args.ledger.cycles.map((row: Json) => ({ ...row, id: deterministicUuid("cohort1-cycle", row.cycle_key) }));
  const cycleByKey = new Map<string, Json>(cycles.map((row: Json) => [row.cycle_key, row]));
  const units: Json[] = args.ledger.units.map((row: Json) => ({ ...row, id: deterministicUuid("cohort1-unit", row.unit_key), reviewCycleId: cycleByKey.get(row.cycle_key)!.id }));
  const unitByKey = new Map<string, Json>(units.map((row: Json) => [row.unit_key, row]));
  const unitSources: Json[] = args.ledger.unit_sources.map((row: Json) => ({
    ...row,
    id: deterministicUuid("cohort1-unit-source", `${row.unit_key}|${row.source_ref}|${row.source_class}`),
    reviewUnitId: unitByKey.get(row.unit_key)!.id,
    trainingSourceId: sourceByRef.get(row.source_ref)!.id,
  }));
  const unitSourceByLogicalKey = new Map<string, Json>(unitSources.map((row: Json) => [`${row.unit_key}|${row.source_ref}|${row.source_class}`, row]));

  const equipmentClaims = args.positive.equipment_claims.map((row: Json) => ({ ...row, id: deterministicUuid("cohort1-equipment", row.claim_key) }));
  const capabilityClaims = args.positive.capability_claims.map((row: Json) => ({ ...row, id: deterministicUuid("cohort1-capability", row.claim_key) }));
  const claimByKey = new Map<string, Json>([...equipmentClaims, ...capabilityClaims].map((row: Json) => [row.claim_key, row]));
  const evidence = args.positive.evidence_relationships.map((row: Json) => {
    const fact = args.raw.facts.find((item: Json) => item.fact_id === row.evidence_fact_id);
    return {
      ...row,
      id: deterministicUuid("cohort1-evidence", row.relationship_key),
      targetId: claimByKey.get(row.claim_key)!.id,
      trainingSourceId: sourceByRef.get(row.source_ref)!.id,
      assertion: "supports",
      reviewStatus: "accepted",
      evidenceText: fact.structured_observation,
      observedAt: fact.observed_at,
      reviewedAt: fact.reviewed_at,
      contentHash: fact.content_sha256,
    };
  });

  const rawFacts: Json[] = [];
  const rawDimensions: Json[] = [];
  for (const mapping of args.r2.cohort1_raw_observation_mappings) {
    const fact = args.raw.facts.find((row: Json) => row.fact_id === mapping.fact_id);
    assert(fact?.persistence.fit === "RAW_FACT_PERSISTENCE_GAP", `Raw mapping lost accepted fact: ${mapping.fact_id}`);
    const sourceRef = fact.source_refs[0];
    const cycleKey = `h3-11d-c1-${fact.hgy_id}`;
    const anchor = relationFor({ ledger: args.ledger, cycleKey, aspect: fact.review_aspect, dimensions: fact.dimensions, sourceRef });
    for (const typeSlug of mapping.fact_types) {
      const factKey = rowKey(fact.fact_id, mapping.fact_types, typeSlug);
      const id = deterministicUuid("cohort1-raw-fact", factKey);
      rawFacts.push({
        id, observationKey: fact.fact_id, factKey, factTypeSlug: typeSlug, locationId: fact.location_id,
        hgyId: fact.hgy_id, reviewCycleId: cycleByKey.get(cycleKey)!.id, reviewUnitId: unitByKey.get(anchor.unit.unit_key)!.id,
        reviewUnitSourceId: unitSourceByLogicalKey.get(`${anchor.unit.unit_key}|${sourceRef}|${anchor.relation.source_class}`)!.id,
        trainingSourceId: sourceByRef.get(sourceRef)!.id, sourceRef, sourceClass: anchor.relation.source_class,
        reviewAspect: fact.review_aspect, statement: fact.statement, evidenceText: fact.structured_observation,
        evidenceLocationContext: fact.evidence_location_context, directness: fact.directness, observedAt: fact.observed_at,
        reviewedAt: fact.reviewed_at, reviewerAuthority: fact.reviewer_process_authority,
        sourceContentHashAtReview: fact.content_sha256, freshnessPolicyKey: mapping.policy_key,
        freshnessExpiresAt: mapping.freshness_expires_at, currentnessEligibility: mapping.currentness_eligibility,
      });
      for (const dimension of fact.dimensions) {
        const unit = args.ledger.units.find((row: Json) => row.cycle_key === cycleKey && row.dimension === dimension && row.review_aspect === fact.review_aspect);
        const relation = args.ledger.unit_sources.find((row: Json) => row.unit_key === unit?.unit_key && row.source_ref === sourceRef);
        assert(unit && relation, `Missing raw dimension provenance: ${factKey}/${dimension}`);
        rawDimensions.push({ rawFactId: id, observationKey: fact.fact_id, factKey, dimension,
          reviewCycleId: cycleByKey.get(cycleKey)!.id, reviewUnitId: unitByKey.get(unit.unit_key)!.id,
          reviewUnitSourceId: unitSourceByLogicalKey.get(`${unit.unit_key}|${sourceRef}|${relation.source_class}`)!.id,
          trainingSourceId: sourceByRef.get(sourceRef)!.id, sourceClass: relation.source_class, reviewAspect: fact.review_aspect });
      }
    }
  }

  const restrictions: Json[] = [];
  for (const mapping of args.r2.cohort1_restriction_observation_mappings) {
    const fact = args.raw.facts.find((row: Json) => row.fact_id === mapping.fact_id);
    assert(fact?.persistence.fit === "RESTRICTION_PERSISTENCE_GAP", `Restriction mapping lost accepted fact: ${mapping.fact_id}`);
    const sourceRef = fact.source_refs[0];
    const cycleKey = `h3-11d-c1-${fact.hgy_id}`;
    const anchor = relationFor({ ledger: args.ledger, cycleKey, aspect: fact.review_aspect, dimensions: fact.dimensions, sourceRef });
    for (const restrictionType of mapping.restriction_types) {
      const restrictionKey = rowKey(fact.fact_id, mapping.restriction_types, restrictionType);
      restrictions.push({
        id: deterministicUuid("cohort1-restriction", restrictionKey), observationKey: fact.fact_id, restrictionKey, restrictionType,
        locationId: fact.location_id, hgyId: fact.hgy_id, reviewCycleId: cycleByKey.get(cycleKey)!.id,
        reviewUnitId: unitByKey.get(anchor.unit.unit_key)!.id,
        reviewUnitSourceId: unitSourceByLogicalKey.get(`${anchor.unit.unit_key}|${sourceRef}|${anchor.relation.source_class}`)!.id,
        trainingSourceId: sourceByRef.get(sourceRef)!.id, sourceRef, sourceClass: anchor.relation.source_class,
        reviewAspect: fact.review_aspect, statement: fact.statement, evidenceText: fact.structured_observation,
        evidenceLocationContext: fact.evidence_location_context, directness: fact.directness, observedAt: fact.observed_at,
        reviewedAt: fact.reviewed_at, reviewerAuthority: fact.reviewer_process_authority,
        sourceContentHashAtReview: fact.content_sha256, freshnessPolicyKey: mapping.policy_key,
        sourceExplicitEndAt: mapping.source_explicit_end_at, freshnessExpiresAt: mapping.freshness_expires_at,
        currentnessEligibility: mapping.currentness_eligibility,
      });
    }
  }

  const canonicalSourceRefs = unique<string>([...args.positive.equipment_claims, ...args.positive.capability_claims]
    .flatMap((row: Json) => row.source_refs as string[])).sort();
  const canonicalMonitorSources = canonicalSourceRefs.map((ref: string) => {
      const source = sourceByRef.get(ref)!;
      return { sourceKey: `cohort1:${ref}`, locationId: source.locationId, hgyId: source.hgyId, url: source.url,
        canonicalUrl: source.canonicalUrl, quality: "Q2", publisherAuthority: source.publisherAuthority };
    });
  const canonicalMonitorClaims = [
    ...args.positive.equipment_claims.map((row: Json) => canonicalMonitorClaim(row, "equipment", facilityById, args.positive.evidence_relationships)),
    ...args.positive.capability_claims.map((row: Json) => canonicalMonitorClaim(row, "capability", facilityById, args.positive.evidence_relationships)),
  ].sort((a, b) => a.claimKey.localeCompare(b.claimKey));
  const canonicalMonitorDelta = { sources: canonicalMonitorSources, claims: canonicalMonitorClaims };

  const rawPersistenceByObservation = new Map<string, string[]>();
  for (const row of rawFacts) rawPersistenceByObservation.set(row.observationKey, [...(rawPersistenceByObservation.get(row.observationKey) ?? []), row.factKey]);
  for (const row of restrictions) rawPersistenceByObservation.set(row.observationKey, [...(rawPersistenceByObservation.get(row.observationKey) ?? []), row.restrictionKey]);
  const projectedRawMonitor = structuredClone(args.r3Candidate) as RawMonitorManifest;
  projectedRawMonitor.mode = "LIVE_MONITORED";
  projectedRawMonitor.entries = projectedRawMonitor.entries.map((entry: any) => ({
    ...entry,
    expectedPersistenceKey: rawPersistenceByObservation.get(entry.observationKey)?.[0] ?? null,
  }));
  projectedRawMonitor.authority.dbImportPacketHash = null;
  projectedRawMonitor.authority.releaseCoherenceHash = null;
  projectedRawMonitor.authority.monitorPacketHash = rawMonitorPacketHash(projectedRawMonitor);

  const dbComponents = {
    sources: sourceRows.filter((row: Json) => row.resolution === "NEW_SOURCE_INSERT"),
    cycles, units, unitSources, invalidations: args.ledger.invalidations,
    equipmentClaims, capabilityClaims, evidence, rawFacts, rawDimensions, restrictions,
  };
  const componentHashes = {
    SOURCE_DELTA_SHA256: cohortReleaseHash({ reuse: sourceRows.filter((row: Json) => row.resolution === "REUSE_EXISTING_SOURCE"), insert: dbComponents.sources, holds: [] }),
    LEDGER_IMPORT_PACKET_SHA256: cohortReleaseHash({ cycles, units, unitSources, invalidations: [] }),
    CANONICAL_POSITIVE_IMPORT_SHA256: cohortReleaseHash({ equipmentClaims, capabilityClaims, evidence }),
    RAW_FACT_IMPORT_SHA256: cohortReleaseHash({ observations: args.r2.cohort1_raw_observation_mappings, rawFacts, rawDimensions }),
    RESTRICTION_IMPORT_SHA256: cohortReleaseHash({ observations: args.r2.cohort1_restriction_observation_mappings, restrictions }),
    CANONICAL_MONITOR_DELTA_SHA256: cohortReleaseHash(canonicalMonitorDelta),
    RAW_MONITOR_DELTA_SHA256: projectedRawMonitor.authority.monitorPacketHash,
  };
  const dbImportPacketHash = cohortReleaseHash({
    source: componentHashes.SOURCE_DELTA_SHA256,
    ledger: componentHashes.LEDGER_IMPORT_PACKET_SHA256,
    canonical: componentHashes.CANONICAL_POSITIVE_IMPORT_SHA256,
    raw: componentHashes.RAW_FACT_IMPORT_SHA256,
    restriction: componentHashes.RESTRICTION_IMPORT_SHA256,
  });
  projectedRawMonitor.authority.dbImportPacketHash = dbImportPacketHash;
  projectedRawMonitor.authority.releaseCoherenceHash = rawMonitorReleaseCoherenceHash(dbImportPacketHash, projectedRawMonitor.authority.monitorPacketHash);
  projectedRawMonitor.manifestHash = rawMonitorManifestHash(projectedRawMonitor);
  const releaseCoherenceHash = cohortReleaseHash({ ...componentHashes, DB_IMPORT_PACKET_SHA256: dbImportPacketHash });

  const projectedCanonical: EnrichmentAuthorityManifest = {
    ...structuredClone(args.existingEnrichment),
    counts: {
      sources: args.existingEnrichment.counts.sources + canonicalMonitorSources.length,
      uniqueExternalUrls: (args.existingEnrichment.counts as any).uniqueExternalUrls + unique(canonicalMonitorSources.map((row) => row.url)).length,
      equipment: args.existingEnrichment.counts.equipment + equipmentClaims.length,
      capabilities: args.existingEnrichment.counts.capabilities + capabilityClaims.length,
      claims: args.existingEnrichment.counts.claims + canonicalMonitorClaims.length,
      enrichedLocations: args.existingEnrichment.counts.enrichedLocations + 8,
    } as any,
    sources: [...args.existingEnrichment.sources, ...canonicalMonitorSources] as any,
    claims: [...args.existingEnrichment.claims, ...canonicalMonitorClaims] as any,
    manifestHash: "",
  };
  projectedCanonical.manifestHash = enrichmentManifestHash(projectedCanonical);

  const release = {
    schemaVersion: 1,
    mode: "CANDIDATE_NOT_APPLIED",
    authority: {
      sourceMain: args.sourceMain,
      cohort: ACCEPTED_COHORT_HASHES,
      r2: ACCEPTED_R2_HASHES,
      r3: ACCEPTED_R3_HASHES,
      protocolKey: "hyrox-review-coverage",
      protocolVersion: "h3-11a-v1",
      productionWrites: false,
      stationDerivation: false,
      publicRawOrRestrictionPublication: false,
    },
    baseline: {
      productionMigrationHead: "0015", officialFacilities: 82, trainingSources: 108, reviewCycles: 0, reviewUnits: 0,
      reviewUnitSources: 0, invalidations: 0, rawFacts: 0, rawFactDimensions: 0, restrictions: 0,
      equipmentClaims: 109, capabilityClaims: 41, trainingEvidence: 314, canonicalMonitoredClaims: 150,
      rawRestrictionMonitoredEntries: 0, equipmentPositiveFacilities: 22, capabilityPositiveFacilities: 21, anyEnrichedFacilities: 25,
    },
    facilities: args.raw.facilities.map((row: Json) => row.identity),
    sourceRecheck: args.sourceRecheck,
    sourceDelta: { reuse: sourceRows.filter((row: Json) => row.resolution === "REUSE_EXISTING_SOURCE"), insert: dbComponents.sources, holds: [] },
    reviewLedger: { cycles, units, unitSources, invalidations: [] },
    canonicalPositive: { equipmentClaims, capabilityClaims, evidence },
    rawPersistence: { acceptedObservations: 19, rawFactRows: rawFacts, rawDimensionRows: rawDimensions },
    restrictionPersistence: { acceptedObservations: 4, restrictionRows: restrictions },
    canonicalMonitorDelta,
    projectedCanonicalMonitor: { counts: projectedCanonical.counts, manifestHash: projectedCanonical.manifestHash },
    rawMonitorDelta: {
      sources: projectedRawMonitor.sources,
      entries: projectedRawMonitor.entries.map((entry: any) => ({
        ...entry,
        persistenceKeys: rawPersistenceByObservation.get(entry.observationKey) ?? [],
      })),
      projectedManifest: projectedRawMonitor,
    },
    transaction: {
      order: ["training_sources", "training_review_cycles", "training_review_units", "training_review_unit_sources",
        "location_equipment/location_training_capabilities", "training_evidence", "training_raw_facts",
        "training_raw_fact_dimensions", "training_access_restrictions"],
      atomicDatabaseTransaction: true,
      exactDuplicate: "REUSE_AFTER_FULL_SEMANTIC_EQUALITY_CHECK",
      conflictingRow: "HARD_STOP_AND_ROLLBACK",
      broadOnConflictDoNothing: false,
      monitorActivation: "SEPARATE_REPOSITORY_STEP_AFTER_DB_COMMIT_WITH_MATCHING_RELEASE_IDENTITY",
    },
    projected: {
      officialFacilities: 82, trainingSources: 108 + dbComponents.sources.length, reviewCycles: cycles.length,
      reviewUnits: units.length, reviewUnitSources: unitSources.length, invalidations: 0, rawFacts: rawFacts.length,
      rawFactDimensions: rawDimensions.length, restrictions: restrictions.length, equipmentClaims: 109 + equipmentClaims.length,
      capabilityClaims: 41 + capabilityClaims.length, trainingEvidence: 314 + evidence.length,
      canonicalMonitoredClaims: 150 + canonicalMonitorClaims.length, rawRestrictionMonitoredEntries: projectedRawMonitor.entries.length,
      equipmentPositiveFacilities: 22 + unique(equipmentClaims.map((row: Json) => row.location_id)).length,
      capabilityPositiveFacilities: 21 + unique(capabilityClaims.map((row: Json) => row.location_id)).length,
      anyEnrichedFacilities: 25 + 8,
    },
    hashes: {
      ...componentHashes,
      DB_IMPORT_PACKET_SHA256: dbImportPacketHash,
      RAW_MONITOR_RELEASE_COHERENCE_SHA256: projectedRawMonitor.authority.releaseCoherenceHash,
      COHORT1_RELEASE_COHERENCE_SHA256: releaseCoherenceHash,
    },
    manifestHash: "",
  };
  release.manifestHash = cohortReleaseManifestHash(release);
  return release;
}

export function validateCohort1Release(release: ReturnType<typeof buildCohort1Release>) {
  assert(release.manifestHash === cohortReleaseManifestHash(release), "Release manifest hash mismatch");
  assert(release.facilities.length === 8 && new Set(release.facilities.map((row: Json) => row.location_id)).size === 8, "Facility identity mismatch");
  assert(release.sourceDelta.reuse.length === 8 && release.sourceDelta.insert.length === 16 && release.sourceDelta.holds.length === 0, "Source delta mismatch");
  assert(release.reviewLedger.cycles.length === 8 && release.reviewLedger.units.length === 296 && release.reviewLedger.unitSources.length === 476, "Ledger packet mismatch");
  assert(release.canonicalPositive.equipmentClaims.length === 19 && release.canonicalPositive.capabilityClaims.length === 18 && release.canonicalPositive.evidence.length === 38, "Canonical packet mismatch");
  assert(release.rawPersistence.acceptedObservations === 19 && release.rawPersistence.rawFactRows.length === 20, "Typed raw fact normalization mismatch");
  assert(release.restrictionPersistence.acceptedObservations === 4 && release.restrictionPersistence.restrictionRows.length === 6, "Typed restriction normalization mismatch");
  assert(release.rawMonitorDelta.entries.length === 23 && release.rawMonitorDelta.sources.length === 9, "Raw monitor delta mismatch");
  assert(release.rawMonitorDelta.entries.every((row: any) => row.expectedPersistenceKey && row.persistenceKeys.length > 0), "Raw monitor persistence link missing");
  assert(release.reviewLedger.units.every((row: Json) => row.positive_outcome !== "NO_POSITIVE_FOUND"), "NO_POSITIVE_FOUND was invented");
  assert(release.canonicalPositive.equipmentClaims.every((row: Json) => !row.station_slug) && release.canonicalPositive.capabilityClaims.every((row: Json) => !row.station_slug), "Station derivation leaked");
  return release;
}
