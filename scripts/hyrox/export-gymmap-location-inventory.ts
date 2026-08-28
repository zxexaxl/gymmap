import { createClient } from "@supabase/supabase-js";
import { loadEnvConfig } from "@next/env";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Database } from "../../src/lib/database.types";
import type { GymMapLocationRecord } from "../../src/lib/hyrox-official-clubs";

loadEnvConfig(process.cwd());

function cliValue(name: string, fallback: string): string {
  const prefix = `--${name}=`;
  return process.argv.find((value) => value.startsWith(prefix))?.slice(prefix.length) ?? fallback;
}

async function exportInventory(): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) throw new Error("NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required");
  const outputPath = path.resolve(cliValue("output", "data/hyrox/gymmap-location-inventory.json"));
  const observedAt = cliValue("observed-at", new Date().toISOString());
  const client = createClient<Database>(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await client
    .from("gym_locations")
    .select("id,slug,name,brand_id,address_line,postal_code,prefecture,city,latitude,longitude,official_url,source_url,is_active,gym_brands(name,slug)")
    .order("id");
  if (error) throw new Error(`Read-only gym_locations export failed: ${error.message}`);
  const records: GymMapLocationRecord[] = (data ?? []).map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    brand_id: row.brand_id,
    brand_name: row.gym_brands.name,
    brand_slug: row.gym_brands.slug,
    address: row.address_line,
    postal_code: row.postal_code,
    prefecture: row.prefecture,
    city: row.city,
    latitude: row.latitude,
    longitude: row.longitude,
    official_url: row.official_url,
    source_url: row.source_url,
    is_active: row.is_active,
  }));
  const artifact = { schema_version: 1, observed_at: observedAt, access: "anonymous read-only SELECT", record_count: records.length, records };
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
  console.log(`Wrote ${records.length} GymMap locations to ${outputPath}`);
}

exportInventory().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
