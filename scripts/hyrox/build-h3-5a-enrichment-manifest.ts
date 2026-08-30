import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { enrichmentClaimKey, enrichmentManifestHash, validateEnrichmentManifest, type EnrichmentAuthorityManifest } from "../../src/lib/hyrox-enrichment-monitor";

// The frozen H3-4/H3-5 artifacts predate exported TypeScript schemas. Their exact
// file hashes and semantic counts are validated below before these legacy shapes
// are projected into the strictly typed operational manifest.
/* eslint-disable @typescript-eslint/no-explicit-any */

function option(name: string) { const prefix = `--${name}=`; return process.argv.find((value) => value.startsWith(prefix))?.slice(prefix.length) ?? null; }
function sha256(value: string) { return createHash("sha256").update(value).digest("hex"); }

const equipmentPatterns: Record<string, string[]> = {
  "ski-erg": ["SkiErg", "Ski Erg", "スキーエルゴ"],
  "row-erg": ["RowErg", "Rowing", "HIIT ROWER", "ローイング", "ローイングマシン"],
  "weighted-sled": ["Sled", "スレッド"],
  "wall-ball-target": ["Wall Ball", "ウォールボール"],
  "farmers-carry-implements": ["Farmers Carry", "Farmer's Carry", "ファーマーズキャリー"],
  sandbag: ["Sandbag", "Sandbag Lunges", "サンドバッグ", "サンドバック"],
  "functional-training-lane": ["training lane", "トレーニングレーン", "専用ターフ"],
  treadmill: ["Treadmill", "トレッドミル", "自走式"],
  "running-track": ["Running Track", "ランニングトラック", "ランニング走路"],
};

const capabilityPatterns: Record<string, Record<string, string[][]>> = {
  "field-hyrox": {
    "discipline-coaching": [["HYROXパフォーマンスコーチ"]],
    "competition-simulation": [["模擬レース形式"]],
  },
  "restore-class": { "discipline-coaching": [["HYROXクラス"], ["初心者", "アドバンス"]] },
  "restore-dropin": { "open-training": [["ファンクショナルエリア（HYROXエリア）"], ["ドロップイン"]] },
  "luaana-home": { "open-training": [["OPEN GYM"], ["施設の設備を自由に使い"]], "discipline-coaching": [["HYROX Class"]] },
  "takamatsu-hyrox": { "discipline-coaching": [["HYROXクラス"], ["フォーム"]] },
  "ufc-yoga-hyrox": { "open-training": [["自主トレーニング", "SELF TRAINING"]], "discipline-coaching": [["HYROXクラス", "HYROX CLASS"]], "sled-push-pull-space": [["フラットトレーニングレーン", "flat training lane"]] },
  "golds-hamamatsucho": { "discipline-coaching": [["HYROX START"]] },
  "golds-toyocho": { "open-training": [["HYROX専用ターフ"]], "sled-push-pull-space": [["HYROX専用ターフ"], ["スレッド"]] },
  "otf-hyrox": { "discipline-coaching": [["認定コーチ"]], "competition-simulation": [["本番さながら"]] },
  "freeletics-hyrox": { "discipline-coaching": [["HYROX"], ["トレーニング", "training"]] },
};

const equipmentSourcePatterns: Record<string, Record<string, string[][]>> = {
  // H3-3/H3-4 accepted the branch-specific kettlebell listing as the reviewed
  // positive basis for farmers-carry implements at this exact location.
  "golds-toyocho": { "farmers-carry-implements": [["kettlebell", "ケトルベル"]] },
};

const locationContext: Record<string, string[][]> = {
  "field-hyrox": [["東大阪スタジオ"]],
  "otf-hyrox": [["溝の口スタジオ"]],
};

async function main() {
  const candidatePath = option("candidate"); const markersPath = option("markers"); const receiptPath = option("receipt"); const preflightPath = option("preflight");
  if (!candidatePath || !markersPath || !receiptPath || !preflightPath) throw new Error("--candidate, --markers, --receipt and --preflight are required authority inputs");
  const [candidateText, markersText, receiptText, preflightText] = await Promise.all([candidatePath, markersPath, receiptPath, preflightPath].map((file) => readFile(file, "utf8")));
  if (sha256(candidateText) !== "d6943303c304926317e4d8d9ae945c8e45556b415554915f70b8349a9f3a4128") throw new Error("H3-4 candidate file hash mismatch");
  const candidate = JSON.parse(candidateText) as any; const markers = JSON.parse(markersText) as any; const receipt = JSON.parse(receiptText) as any; const preflight = JSON.parse(preflightText) as any;
  if (candidate.candidate_hash !== "f47f7edcb4fb63120d35e44ed2bda50c8c61e779724d4f12453a48037d280ae8" || markers.sources.length !== 10 ||
      receipt.authority.h3_4_commit !== "0d7dde26dbf14122f2e38d27acf2790bebbc98e3" || receipt.transaction.result !== "COMMIT") throw new Error("H3-4/H3-5 authority mismatch");
  const markerByRef = new Map(markers.sources.map((item: any) => [item.source_ref, item]));
  const locationById = new Map(preflight.sample_locations.map((item: any) => [item.id, item]));
  const evidenceByTarget = new Map(candidate.evidence.map((item: any) => [item.target_ref, item]));
  const sources = candidate.sources.map((item: any) => {
    const marker: any = markerByRef.get(item.h3_3_source_ref);
    if (!marker || marker.url !== item.url || !marker.authority_match || !marker.content_basis_present) throw new Error(`Source authority mismatch: ${item.source_ref}`);
    return { sourceKey: item.source_ref, locationId: item.location_id, hgyId: item.hgy_id, url: item.url, canonicalUrl: item.canonical_url,
      quality: item.metadata_json.evidence_quality, publisherAuthority: item.publisher_authority };
  }).sort((a: any, b: any) => a.sourceKey.localeCompare(b.sourceKey));
  const buildClaim = (kind: "equipment" | "capability", item: any) => {
    const location: any = locationById.get(item.location_id); const source = candidate.sources.find((value: any) => value.source_ref === item.source_ref);
    const evidence: any = evidenceByTarget.get(kind === "equipment" ? item.equipment_ref : item.capability_ref);
    if (!location || !source || !evidence) throw new Error(`Incomplete claim authority: ${item.location_id}/${item.equipment_slug ?? item.capability_slug}`);
    const slug = item.equipment_slug ?? item.capability_slug;
    const patterns = kind === "equipment"
      ? (equipmentSourcePatterns[source.h3_3_source_ref]?.[slug] ?? [equipmentPatterns[slug]])
      : capabilityPatterns[source.h3_3_source_ref]?.[slug];
    if (!patterns?.length || patterns.some((group) => !group?.length)) throw new Error(`Missing reviewed support matcher: ${source.h3_3_source_ref}/${slug}`);
    const horizon = Math.round((Date.parse(item.stale_at) - Date.parse(item.last_confirmed_at)) / 86_400_000);
    return { claimKey: enrichmentClaimKey(kind, item.location_id, slug), kind, locationId: item.location_id, locationSlug: item.location_slug,
      locationName: location.name, hgyId: item.hgy_id, slug, sourceKey: item.source_ref, lastConfirmedAt: item.last_confirmed_at,
      staleAt: item.stale_at, freshnessHorizonDays: horizon, evidenceHash: evidence.content_hash,
      supportPatternGroups: [...(locationContext[source.h3_3_source_ref] ?? []), ...patterns] };
  };
  const claims = [...candidate.equipment.map((item: any) => buildClaim("equipment", item)), ...candidate.capabilities.map((item: any) => buildClaim("capability", item))]
    .sort((a: any, b: any) => a.claimKey.localeCompare(b.claimKey));
  const withoutHash = {
    schemaVersion: 1 as const,
    authority: { h3_4Commit: receipt.authority.h3_4_commit, h3_5Commit: "1e220e091c0e4f47af06ee8c4b3a77bf26a883db",
      h3_4CandidateHash: candidate.candidate_hash, h3_4CandidateFileSha256: sha256(candidateText), h3_5ReceiptSha256: sha256(receiptText), importedAt: receipt.committed_at },
    counts: { sources: sources.length, equipment: candidate.equipment.length, capabilities: candidate.capabilities.length, claims: claims.length,
      enrichedLocations: new Set(claims.map((item: any) => item.locationId)).size }, sources, claims,
  };
  const manifest = { ...withoutHash, manifestHash: enrichmentManifestHash(withoutHash) } as EnrichmentAuthorityManifest;
  validateEnrichmentManifest(manifest);
  const output = option("output") ?? "data/hyrox/h3-5a-enrichment-monitor-authority.json";
  await writeFile(output, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(JSON.stringify({ output, manifestHash: manifest.manifestHash, counts: manifest.counts }, null, 2));
}

main().catch((error) => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; });
