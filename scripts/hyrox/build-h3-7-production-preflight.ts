import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { loadEnvConfig } from "@next/env";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../src/lib/database.types";
import { loadPublishedHyroxBaselines } from "../../src/lib/hyrox-monitor-source";
import { loadPublishedEnrichmentClaims } from "../../src/lib/hyrox-enrichment-monitor-source";
import type { H37SourceClaim } from "../../src/lib/hyrox-h3-7-source-revalidation";

const H3_5_COMMIT = "1e220e091c0e4f47af06ee8c4b3a77bf26a883db";
function option(name: string) { const prefix = `--${name}=`; return process.argv.find((value) => value.startsWith(prefix))?.slice(prefix.length) ?? null; }

async function main() {
  loadEnvConfig(option("env-dir") ?? process.cwd());
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL; const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Public Supabase URL and anonymous key are required");
  const equipment = JSON.parse(await readFile("data/hyrox/h3-6-confirmed-equipment-candidates.json", "utf8")) as { candidates: H37SourceClaim[] };
  const capabilities = JSON.parse(await readFile("data/hyrox/h3-6-confirmed-capability-candidates.json", "utf8")) as { candidates: H37SourceClaim[] };
  const candidates = [...equipment.candidates, ...capabilities.candidates];
  const [baselines, publishedClaims] = await Promise.all([
    loadPublishedHyroxBaselines({ supabaseUrl: url, supabaseAnonKey: key }),
    loadPublishedEnrichmentClaims({ supabaseUrl: url, supabaseAnonKey: key }),
  ]);
  const client = createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const [{ data: equipmentTypes, error: equipmentError }, { data: capabilityTypes, error: capabilityError }, { data: officialRows, error: officialError }] = await Promise.all([
    client.from("equipment_types").select("slug").order("slug"), client.from("training_capability_types").select("slug").order("slug"),
    client.rpc("search_training_locations", { p_discipline_slug: "hyrox", p_official_only: true, p_limit: 100, p_offset: 0 }),
  ]);
  if (equipmentError || capabilityError || officialError) throw equipmentError ?? capabilityError ?? officialError;
  const receiptText = execFileSync("git", ["show", `${H3_5_COMMIT}:data/hyrox/h3-5-equipment-evidence-production-import-receipt.json`], { encoding: "utf8" });
  const receipt = JSON.parse(receiptText) as { after: Record<string, number>; safety: Record<string, unknown> };
  const targetIds = new Set(candidates.map((row) => row.locationId)); const targetHgy = new Set(candidates.map((row) => row.hgyId));
  const targetBaselines = baselines.filter((row) => targetIds.has(row.locationId));
  const targetPublished = publishedClaims.filter((row) => targetIds.has(row.locationId));
  const currentEvidenceHashes = new Set((JSON.parse(await readFile("data/hyrox/h3-5a-enrichment-monitor-authority.json", "utf8")) as { claims: Array<{ evidenceHash: string }> }).claims.map((row) => row.evidenceHash));
  const preflight = {
    schemaVersion: 1, checkedAt: new Date().toISOString(), readOnly: true, access: "public_anon_only",
    authority: { originMain: "8a54e393842dd0d467381add27b0c1f9010d9bf7", h3_5Commit: H3_5_COMMIT,
      h3_5ReceiptSha256: createHash("sha256").update(receiptText).digest("hex") },
    counts: { publishedHyrox: baselines.length, officialHyrox: officialRows?.filter((row) => row.official).length ?? 0, searchHyrox: officialRows?.length ?? 0,
      trainingSources: receipt.after.training_sources, locationEquipment: publishedClaims.filter((row) => row.kind === "equipment").length,
      locationTrainingCapabilities: publishedClaims.filter((row) => row.kind === "capability").length,
      trainingEvidence: receipt.after.training_evidence, monitoredClaims: publishedClaims.length, programMappings: 0, hyroxClasses: 0 },
    taxonomy: { equipment: equipmentTypes?.map((row) => row.slug) ?? [], capabilities: capabilityTypes?.map((row) => row.slug) ?? [] },
    candidateTargets: { locations: targetIds.size, hgyIdentities: targetHgy.size, currentOfficialMatches: targetBaselines.length,
      existingPublishedClaimRelations: targetPublished.length },
    collisions: { equipmentRelations: targetPublished.filter((row) => row.kind === "equipment").length,
      capabilityRelations: targetPublished.filter((row) => row.kind === "capability").length,
      sourceNaturalRelations: 0, evidenceHashes: candidates.filter((row) => currentEvidenceHashes.has(row.evidence.evidenceHash)).length },
    privateRawCountAuthority: "H3-5 receipt plus current public projection; private tables were not accessed",
  };
  if (preflight.counts.publishedHyrox !== 82 || preflight.counts.officialHyrox !== 82 || preflight.counts.locationEquipment !== 36 ||
      preflight.counts.locationTrainingCapabilities !== 16 || preflight.counts.monitoredClaims !== 52 || targetBaselines.length !== 16 ||
      Object.values(preflight.collisions).some((value) => value !== 0)) throw new Error(`H3-7 production authority/collision drift: ${JSON.stringify({ counts: preflight.counts, targets: preflight.candidateTargets, collisions: preflight.collisions })}`);
  const output = option("output") ?? "data/hyrox/h3-7-production-preflight.json";
  await writeFile(output, `${JSON.stringify(preflight, null, 2)}\n`);
  console.log(JSON.stringify({ output, counts: preflight.counts, candidateTargets: preflight.candidateTargets, collisions: preflight.collisions }, null, 2));
}

main().catch((error) => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; });
