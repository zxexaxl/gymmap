// Disposable PostgreSQL only. Executes actual registration packets and the shared SQL predicate.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { lessonCoordinatePublicationSqlGuard } = require("../src/lib/lesson-coordinate-publication.ts");
const target = process.argv.find((arg) => arg.startsWith("--local-url="))?.slice(12);
const pgliteModule = process.argv.find((arg) => arg.startsWith("--pglite-module="))?.slice(16);
let engine;
if (pgliteModule) {
  const { PGlite } = await import(pgliteModule);
  engine = new PGlite(); // In-memory only. No persisted database is opened.
} else {
  if (!target) throw new Error("Explicit --local-url or --pglite-module required");
  const url = new URL(target);
  if (!["localhost", "127.0.0.1"].includes(url.hostname) || !url.pathname.startsWith("/lesson_guard_test")) {
    throw new Error("Only a disposable local lesson_guard_test database is allowed");
  }
}
async function sql(text, succeeds = true) {
  if (engine) {
    let results;
    try { results = await engine.exec(text); }
    catch (error) {
      await engine.exec("rollback;");
      if (succeeds) throw error;
      assert.match(String(error), /LESSON_COORDINATE_PUBLICATION_HOLD/);
      return "";
    }
    assert.ok(succeeds, "Expected SQL publication failure");
    return results.flatMap((result) => result.rows.flatMap((row) => Object.values(row))).join("\n");
  }
  const result = spawnSync("psql", ["-X", target, "-qAt", "-v", "ON_ERROR_STOP=1", "-c", text], { encoding: "utf8" });
  if (succeeds) assert.equal(result.status, 0, result.stderr);
  else { assert.notEqual(result.status, 0); assert.match(result.stderr, /LESSON_COORDINATE_PUBLICATION_HOLD/); }
  return result.stdout.trim();
}
const setup = `
create table gym_brands(id uuid primary key default gen_random_uuid(), name text, slug text unique, official_url text);
create table gym_locations(id uuid primary key default gen_random_uuid(),brand_id uuid references gym_brands,
name text,slug text unique,prefecture text,city text,official_url text,source_url text,location_type text,
latitude numeric(9,6),longitude numeric(9,6),is_active boolean not null default true);
create table lesson_location_memberships(location_id uuid primary key references gym_locations,authority_source text);
insert into gym_brands(name,slug) values ('Central','central-sports'),('Golds','golds-gym'),('Jexer','jexer'),
('Konami','konami-sports'),('Megalos','megalos'),('NAS','sports-club-nas'),('Tipness','tipness');
`;
// A fresh dedicated database is required. Never reset an existing schema implicitly.
await sql(setup);
const guard = lessonCoordinatePublicationSqlGuard();
const insert = (lat, lng, active = true, member = true) => `insert into gym_locations(id,name,slug,latitude,longitude,is_active) values ('00000000-0000-4000-8000-000000000001','fixture','fixture',${lat},${lng},${active});${member ? "insert into lesson_location_memberships values ('00000000-0000-4000-8000-000000000001','fixture');" : ""}`;
const valid = [[35,139],[90,180],[-90,-180],[0,0]];
const invalid = [["null","null"],["null",139],[35,"null"],[91,139],[35,181],["'NaN'",139]];
for (const [lat,lng] of valid) await sql(`begin; ${insert(lat,lng)} ${guard} rollback;`);
for (const [lat,lng] of invalid) {
  await sql(`begin; ${insert(lat,lng)} ${guard} commit;`, false);
  assert.equal(await sql("select count(*) from gym_locations"), "0");
}
await sql(`begin; ${insert("null","null",false)} ${guard} rollback;`);
await sql(`begin; ${insert("null","null",true,false)} ${guard} rollback;`);
await sql(`begin; ${insert("null","null",false)} update gym_locations set is_active=true; ${guard} commit;`,false);
for (const family of ["central_tokyo","golds_kanto","jexer_kanagawa_saitama_chiba","jexer_tokyo","konami_kanto","megalos_kanto","nas_kanto","tipness_kanto"]) {
  const packet = readFileSync(`supabase/sql/insert_${family}_locations.sql`,"utf8");
  await sql(packet,false);
  assert.equal(await sql("select count(*) from gym_locations"),"0");
  assert.equal(await sql("select count(*) from lesson_location_memberships"),"0");
  // Prove a genuinely mixed batch rolls back: assign coordinates to one inserted row only.
  const mixed = packet.replace(guard, () => `update gym_locations set latitude=35,longitude=139 where id=(select id from gym_locations limit 1);\n${guard}`);
  await sql(mixed,false);
  assert.equal(await sql("select count(*) from gym_locations"),"0");
  // Exact same packet succeeds when every actual persisted row has valid coordinates.
  const complete = packet.replace(guard, () => `update gym_locations set latitude=35,longitude=139;\n${guard}`).replace(/commit;\s*$/, "select count(*) from lesson_location_memberships; rollback;");
  assert.ok(Number(await sql(complete)) > 0);
}
console.log(JSON.stringify({ result:"PASS", packets:8, mixedBatchRollback:true, droppedPayloadRollback:true, inactivePreserved:true, reactivationRejected:true, hyroxOnlyPreserved:true }));

if (engine) await engine.close();
