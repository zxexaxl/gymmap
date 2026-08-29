import { createClient } from "@supabase/supabase-js";
import { loadEnvConfig } from "@next/env";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Database } from "../../src/lib/database.types";

loadEnvConfig(process.cwd());

function cliValue(name: string, fallback: string): string {
  const prefix = `--${name}=`;
  return process.argv.find((value) => value.startsWith(prefix))?.slice(prefix.length) ?? fallback;
}

async function main(): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) throw new Error("Production read credential is required");
  const observedAt = cliValue("observed-at", new Date().toISOString());
  const output = path.resolve(cliValue("output", "data/hyrox/h2-5-production-preflight.json"));
  const client = createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

  const [brands, locations, disciplines, sources, identities, locationDisciplines, affiliations, evidence, equipment, capabilities, mappings] = await Promise.all([
    client.from("gym_brands").select("id,name,slug,official_url,description,created_at,updated_at").order("id"),
    client.from("gym_locations").select("id,brand_id,name,slug,postal_code,prefecture,city,address_line,latitude,longitude,nearest_station,official_url,source_url,location_type,is_active,last_verified_at,created_at,updated_at").order("id"),
    client.from("training_disciplines").select("id,name,slug,is_active").eq("slug", "hyrox"),
    client.from("training_sources").select("id,location_id,canonical_url,source_kind,publisher_authority,availability_state,last_checked_at,review_required").order("id"),
    client.from("location_external_identifiers").select("id,location_id,namespace,external_identifier,verification_status,verified_at").eq("namespace", "hyrox-training-club").order("id"),
    client.from("location_training_disciplines").select("id,location_id,discipline_id,support_state,verification_status,last_confirmed_at,stale_at").order("id"),
    client.from("training_affiliations").select("id,location_id,discipline_id,affiliation_type,awarding_organization,external_identifier,affiliation_state,verification_status,last_confirmed_at,stale_at").eq("awarding_organization", "HYROX").order("id"),
    client.from("training_evidence").select("id", { count: "exact" }).limit(1),
    client.from("location_equipment").select("id", { count: "exact" }).limit(1),
    client.from("location_training_capabilities").select("id", { count: "exact" }).limit(1),
    client.from("program_training_disciplines").select("program_id", { count: "exact" }).limit(1),
  ]);
  const results = [brands, locations, disciplines, sources, identities, locationDisciplines, affiliations, evidence, equipment, capabilities, mappings];
  const failed = results.find((result) => result.error);
  if (failed?.error) throw new Error(`Read-only production preflight failed: ${failed.error.message}`);

  const artifact = {
    schema_version: 1,
    phase: "H2-5",
    access: "service-role read-only SELECT",
    observed_at: observedAt,
    counts: {
      gym_brands: brands.data?.length ?? 0,
      gym_locations: locations.data?.length ?? 0,
      training_disciplines_hyrox: disciplines.data?.length ?? 0,
      training_sources: sources.data?.length ?? 0,
      location_external_identifiers_hyrox: identities.data?.length ?? 0,
      location_training_disciplines: locationDisciplines.data?.length ?? 0,
      training_affiliations_hyrox: affiliations.data?.length ?? 0,
      training_evidence: evidence.count ?? 0,
      location_equipment: equipment.count ?? 0,
      location_training_capabilities: capabilities.count ?? 0,
      program_training_disciplines: mappings.count ?? 0,
    },
    brands: brands.data ?? [],
    locations: locations.data ?? [],
    hyrox_disciplines: disciplines.data ?? [],
    training_sources: sources.data ?? [],
    hyrox_external_identifiers: identities.data ?? [],
    location_training_disciplines: locationDisciplines.data ?? [],
    hyrox_affiliations: affiliations.data ?? [],
  };
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, `${JSON.stringify(artifact, null, 2)}\n`);
  console.log(JSON.stringify({ observed_at: observedAt, counts: artifact.counts }));
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
