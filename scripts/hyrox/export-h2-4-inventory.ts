import { createClient } from "@supabase/supabase-js";
import { loadEnvConfig } from "@next/env";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Database } from "../../src/lib/database.types";
import type { GymBrandRecord, H24LocationRecord } from "../../src/lib/hyrox-unmatched-review";

loadEnvConfig(process.cwd());

function cliValue(name: string, fallback: string): string {
  const prefix = `--${name}=`;
  return process.argv.find((value) => value.startsWith(prefix))?.slice(prefix.length) ?? fallback;
}

async function main(): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !key) throw new Error("Public Supabase read credentials are required");
  const observedAt = cliValue("observed-at", new Date().toISOString());
  const output = path.resolve(cliValue("output", "data/hyrox/h2-4-gymmap-inventory.json"));
  const client = createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const [locationsResult, brandsResult] = await Promise.all([
    client.from("gym_locations")
      .select("id,slug,name,brand_id,address_line,postal_code,prefecture,city,latitude,longitude,official_url,source_url,location_type,is_active,gym_brands(name,slug)")
      .order("id"),
    client.from("gym_brands").select("id,name,slug,official_url").order("id"),
  ]);
  if (locationsResult.error) throw new Error(`Read-only gym_locations export failed: ${locationsResult.error.message}`);
  if (brandsResult.error) throw new Error(`Read-only gym_brands export failed: ${brandsResult.error.message}`);
  const locations: H24LocationRecord[] = (locationsResult.data ?? []).map((row) => ({
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
    location_type: row.location_type,
    is_active: row.is_active,
  }));
  const brands = (brandsResult.data ?? []) as GymBrandRecord[];
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, `${JSON.stringify({
    schema_version: 1,
    observed_at: observedAt,
    access: "anonymous read-only SELECT",
    location_count: locations.length,
    brand_count: brands.length,
    locations,
    brands,
  }, null, 2)}\n`);
  console.log(`Wrote H2-4 inventory: ${locations.length} locations, ${brands.length} brands`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
