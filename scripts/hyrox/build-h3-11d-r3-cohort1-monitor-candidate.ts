import fs from "node:fs/promises";
import {
  ACCEPTED_R2_HASHES,
  rawMonitorManifestHash,
  rawMonitorPacketHash,
  type RawMonitorEntry,
  type RawMonitorManifest,
} from "../../src/lib/hyrox-raw-fact-monitor";

const manifestPath = "data/hyrox/h3-11d-r3-cohort1-monitor-candidate.json";
const fixturePath = "data/hyrox/h3-11d-r3-cohort1-source-observation-fixture.json";

const identityPatterns: Record<string, string[][]> = {
  "src-75b51f42cb58283c": [["club 360", "club360"]],
  "src-6563ef5f6053bb20": [["fitone shibuya", "fitone"], ["渋谷", "shibuya"]],
  "src-9d7c6221a96b6ff0": [["g-zone", "g zone"], ["park"]],
  "src-fb5d0715281764cc": [["vamos"]],
  "src-bca76865cd84dfb5": [["vamos"]],
  "src-cb938cddb3bc0b4c": [["crossfit ashiya", "クロスフィット芦屋"]],
  "src-88f0214ede1b29db": [["improve kyoto"]],
  "src-fecd5cdb81a50241": [["htc chikusa"], ["名古屋", "chikusa"]],
  "src-7068c574e9c94ca8": [["htc chikusa"], ["名古屋", "chikusa"]],
};

const supportPatterns: Record<string, string[][]> = {
  "HGY_4GF2DeDJoIzNRU4jn9scAv65V-usage-program-simulation": [["hyrox"], ["simulation", "シミュレーション"]],
  "HGY_6lR3pcwsQaSGSlsQTdrNrO1jc-equipment-sled-rope": [["sled"], ["rope", "ロープ"]],
  "HGY_6lR3pcwsQaSGSlsQTdrNrO1jc-restriction-open-gym-membership": [["open gym"], ["unlimited", "membership", "会員"]],
  "HGY_6lR3pcwsQaSGSlsQTdrNrO1jc-space-push-pull-carry": [["push"], ["pull"], ["carry"]],
  "HGY_6lR3pcwsQaSGSlsQTdrNrO1jc-space-running": [["run", "ランニング"]],
  "HGY_C0V7CK7K15SLUrMhBvyyO0phM-equipment-official-tools-set": [["hyrox"], ["official", "公式"]],
  "HGY_C0V7CK7K15SLUrMhBvyyO0phM-restriction-program-hours": [["park"], ["予約", "reservation"]],
  "HGY_C0V7CK7K15SLUrMhBvyyO0phM-space-training-floor": [["90", "９０"], ["training", "トレーニング"]],
  "HGY_CKpn4DHneWfrqTUVaA7D5Whop-equipment-official-set": [["hyrox"], ["official", "公式"]],
  "HGY_CKpn4DHneWfrqTUVaA7D5Whop-restriction-reservation": [["open gym"], ["予約", "reserve"]],
  "HGY_Cl8QF5olON4Y0D7mho4iGg34L-equipment-sled-rope": [["sled"], ["rope", "ロープ"]],
  "HGY_Cl8QF5olON4Y0D7mho4iGg34L-equipment-wall-ball": [["wall ball", "ウォールボール"]],
  "HGY_Cl8QF5olON4Y0D7mho4iGg34L-usage-program": [["hyrox"], ["drop-in", "ドロップイン", "rental", "レンタル"]],
  "HGY_gp7GcAxbIZtxk5KpvoDwAOOcr-usage-program-all-stations": [["hyrox"], ["8", "eight", "全8"]],
  "HGY_j1Szv4JmxytARCgfm48f0Z4xS-equipment-sled-rope": [["sled pull", "スレッドプル"], ["rope", "ロープ"]],
  "HGY_j1Szv4JmxytARCgfm48f0Z4xS-equipment-wall-ball": [["wall balls", "ウォールボール"], ["ball", "ボール"]],
  "HGY_j1Szv4JmxytARCgfm48f0Z4xS-restriction-open-gym-plan": [["open gym", "オープンジム"], ["plan", "プラン"]],
  "HGY_j1Szv4JmxytARCgfm48f0Z4xS-space-burpee-broad-jump": [["burpee broad jump", "バーピーブロードジャンプ"]],
  "HGY_j1Szv4JmxytARCgfm48f0Z4xS-space-farmers-carry": [["farmers carry", "ファーマーズキャリー"]],
  "HGY_j1Szv4JmxytARCgfm48f0Z4xS-space-running": [["running", "ランニング"], ["indoor", "屋内"]],
  "HGY_j1Szv4JmxytARCgfm48f0Z4xS-space-sandbag-lunges": [["sandbag lunges", "サンドバッグランジ"]],
  "HGY_j1Szv4JmxytARCgfm48f0Z4xS-space-wall-balls": [["wall balls", "ウォールボール"], ["3m", "3 m", "3ｍ"]],
  "HGY_j1Szv4JmxytARCgfm48f0Z4xS-usage-program-all-stations": [["hyrox"], ["8", "eight", "全8"]],
};

async function build() {
  const evidence = JSON.parse(await fs.readFile("data/hyrox/h3-11d-cohort1-raw-evidence.json", "utf8"));
  const r2 = JSON.parse(await fs.readFile("data/hyrox/h3-11d-r2-raw-fact-freshness-authority.json", "utf8"));
  const gapFacts = evidence.facts.filter((fact: { persistence: { fit: string } }) =>
    fact.persistence.fit === "RAW_FACT_PERSISTENCE_GAP" || fact.persistence.fit === "RESTRICTION_PERSISTENCE_GAP");
  const sourceRefs = new Set<string>(gapFacts.flatMap((fact: { source_refs: string[] }) => fact.source_refs));
  const sources = evidence.sources.filter((source: { source_ref: string }) => sourceRefs.has(source.source_ref))
    .map((source: {
      source_ref: string;
      location_id: string;
      hgy_id: string;
      requested_url: string;
      final_url: string | null;
      canonical_url: string | null;
      facility_binding: "FACILITY_SPECIFIC" | "BRAND_FACILITY_SPECIFIC";
    }) => ({
      sourceKey: source.source_ref,
      locationId: source.location_id,
      hgyId: source.hgy_id,
      url: source.requested_url,
      canonicalUrl: source.canonical_url ?? source.final_url ?? source.requested_url,
      facilityBinding: source.facility_binding,
      facilityIdentityPatternGroups: identityPatterns[source.source_ref],
    })).sort((left: { sourceKey: string }, right: { sourceKey: string }) => left.sourceKey.localeCompare(right.sourceKey));
  const rawMappings = new Map(r2.cohort1_raw_observation_mappings.map((row: { fact_id: string }) => [row.fact_id, row]));
  const restrictionMappings = new Map(r2.cohort1_restriction_observation_mappings.map((row: { fact_id: string }) => [row.fact_id, row]));
  const entries: RawMonitorEntry[] = gapFacts.map((fact: {
    fact_id: string;
    hgy_id: string;
    location_id: string;
    source_refs: string[];
    persistence: { fit: string };
    reviewer_process_authority: string;
  }): RawMonitorEntry => {
    const restriction = fact.persistence.fit === "RESTRICTION_PERSISTENCE_GAP";
    const mapping = (restriction ? restrictionMappings : rawMappings).get(fact.fact_id) as {
      facility: string;
      fact_types?: string[];
      restriction_types?: string[];
      policy_key: string;
      reviewed_at: string;
      freshness_expires_at: string;
      source_explicit_end_at?: string | null;
    } | undefined;
    if (!mapping || !supportPatterns[fact.fact_id]) throw new Error(`Missing R3 mapping authority: ${fact.fact_id}`);
    return {
      observationKey: fact.fact_id,
      kind: restriction ? "restriction" : "raw_fact",
      locationId: fact.location_id,
      hgyId: fact.hgy_id,
      facilityName: mapping.facility,
      typeKeys: mapping.fact_types ?? mapping.restriction_types ?? [],
      policyKey: mapping.policy_key,
      reviewedAt: mapping.reviewed_at,
      freshnessExpiresAt: mapping.freshness_expires_at,
      sourceExplicitStartsAt: null,
      sourceExplicitEndsAt: mapping.source_explicit_end_at ?? null,
      sourceKeys: fact.source_refs,
      supportCheck: { mode: "TEXT_PATTERN", patternGroups: supportPatterns[fact.fact_id] },
      reviewAuthority: fact.reviewer_process_authority,
      expectedPersistenceKey: null,
    };
  }).sort((left: RawMonitorEntry, right: RawMonitorEntry) => left.observationKey.localeCompare(right.observationKey));
  const withoutHash = {
    schemaVersion: 1 as const,
    mode: "CANDIDATE_NOT_IMPORTED" as const,
    authority: {
      r2Commit: "34705f65477019165a11beba359d3dd8f13bb00f",
      r2PolicyVersion: r2.authority.policy_version,
      freshnessPolicyHash: ACCEPTED_R2_HASHES.freshnessPolicy,
      factMappingHash: ACCEPTED_R2_HASHES.factMapping,
      restrictionMappingHash: ACCEPTED_R2_HASHES.restrictionMapping,
      cohort1MappingHash: ACCEPTED_R2_HASHES.cohort1Mapping,
      monitorPacketHash: "PENDING",
      dbImportPacketHash: null,
      releaseCoherenceHash: null,
    },
    counts: {
      sources: sources.length,
      entries: entries.length,
      rawFacts: entries.filter((entry) => entry.kind === "raw_fact").length,
      restrictions: entries.filter((entry) => entry.kind === "restriction").length,
    },
    sources,
    entries,
  };
  withoutHash.authority.monitorPacketHash = rawMonitorPacketHash(withoutHash as RawMonitorManifest);
  const manifest = { ...withoutHash, manifestHash: rawMonitorManifestHash(withoutHash as RawMonitorManifest) };
  const observations = sources.map((source: { sourceKey: string; url: string; canonicalUrl: string; facilityIdentityPatternGroups: string[][] }) => {
    const sourceEntries = entries.filter((entry: RawMonitorEntry) => entry.sourceKeys.includes(source.sourceKey));
    const content = [
      ...source.facilityIdentityPatternGroups.flatMap((group) => group.slice(0, 1)),
      ...sourceEntries.flatMap((entry) => entry.supportCheck.mode === "TEXT_PATTERN"
        ? entry.supportCheck.patternGroups.flatMap((group) => group.slice(0, 1))
        : []),
    ].join(" — ");
    return {
      sourceKey: source.sourceKey,
      status: "AVAILABLE",
      requestedUrl: source.url,
      finalUrl: source.canonicalUrl,
      canonicalUrl: source.canonicalUrl,
      httpStatus: 200,
      attempts: 1,
      error: null,
      materialRedirect: false,
      normalizedContent: content,
    };
  });
  const fixture = {
    mode: "CANDIDATE_NOT_IMPORTED",
    observations,
    stats: { entries: entries.length, uniqueSources: sources.length, requestsAfterDedup: sources.length, retries: 0, concurrency: 4 },
  };
  return {
    manifest: `${JSON.stringify(manifest, null, 2)}\n`,
    fixture: `${JSON.stringify(fixture, null, 2)}\n`,
  };
}

async function main() {
  const output = await build();
  if (process.argv.includes("--check")) {
    const [currentManifest, currentFixture] = await Promise.all([
      fs.readFile(manifestPath, "utf8"),
      fs.readFile(fixturePath, "utf8"),
    ]);
    if (currentManifest !== output.manifest || currentFixture !== output.fixture) throw new Error("R3 Cohort 1 fixture artifacts are not deterministic");
    process.stdout.write("R3 Cohort 1 fixture artifacts are deterministic.\n");
    return;
  }
  await Promise.all([
    fs.writeFile(manifestPath, output.manifest),
    fs.writeFile(fixturePath, output.fixture),
  ]);
  process.stdout.write("R3 Cohort 1 fixture artifacts generated.\n");
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
