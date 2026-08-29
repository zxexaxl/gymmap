import { createClient } from "@supabase/supabase-js";
import { loadEnvConfig } from "@next/env";
import { writeFile } from "node:fs/promises";
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
  if (!url || !key) throw new Error("Supabase service read credential is required");
  const observedAt = cliValue("observed-at", new Date().toISOString());
  const output = path.resolve(cliValue("output", "data/hyrox/h2-9-training-inventory.json"));
  const client = createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const [identifiers, published, affiliations] = await Promise.all([
    client.from("location_external_identifiers")
      .select("location_id,namespace,external_identifier,verification_status")
      .eq("namespace", "hyrox-training-club").order("external_identifier"),
    client.from("published_location_training_disciplines")
      .select("location_id,discipline_slug").eq("discipline_slug", "hyrox").order("location_id"),
    client.from("published_training_affiliations")
      .select("location_id,discipline_slug,external_identifier,is_official")
      .eq("discipline_slug", "hyrox").eq("is_official", true).order("location_id"),
  ]);
  for (const result of [identifiers, published, affiliations]) if (result.error) throw new Error(result.error.message);
  await writeFile(output, `${JSON.stringify({
    schema_version: 1,
    observed_at: observedAt,
    access: "service role read-only SELECT",
    counts: {
      external_identifiers: identifiers.data?.length ?? 0,
      published_locations: published.data?.length ?? 0,
      official_affiliations: affiliations.data?.length ?? 0,
    },
    external_identifiers: identifiers.data ?? [],
    published_locations: published.data ?? [],
    official_affiliations: affiliations.data ?? [],
  }, null, 2)}\n`);
  console.log(JSON.stringify({ external_identifiers: identifiers.data?.length ?? 0,
    published_locations: published.data?.length ?? 0, official_affiliations: affiliations.data?.length ?? 0 }));
}

main().catch((error) => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; });
