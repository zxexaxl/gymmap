// Disposable-only validation. No network clients or Production connection strings.
// Run from repository root with node --import tsx; args: snapshot.json runtime-dir output-dir.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
const requireSource = createRequire(import.meta.url);
const { buildMapLessonPurposeIndex, getMapLessonQueryMatches } = requireSource('../src/lib/map-lesson-purpose-index.ts');
const { rankLessonLocationsByProximity, rankLessonLocationsByMapCenter, DEFAULT_LESSON_PROXIMITY_ORIGIN } = requireSource('../src/components/map/lesson-proximity.ts');

const [snapshotPath, runtimeDir, outputDir] = process.argv.slice(2);
assert(snapshotPath && runtimeDir && outputDir, 'snapshot, disposable PGlite runtime and output directory required');
const requireRuntime = createRequire(path.resolve(runtimeDir, 'package.json'));
const { PGlite } = requireRuntime('@electric-sql/pglite');
const { pgcrypto } = requireRuntime('@electric-sql/pglite/contrib/pgcrypto');
const { pg_trgm } = requireRuntime('@electric-sql/pglite/contrib/pg_trgm');
const db = new PGlite({ extensions: { pgcrypto, pg_trgm } }); // Memory only.
const snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));
const targetId = 'ce0f6e5d-3455-4305-85b8-68a50dd5a57b';
const childIds = ['e5250e8c-8a51-41e1-87e6-56f332efc044', 'c3afed3c-5a34-4eb4-bc9b-57f4a6b2013a'];
const sqlPath = 'supabase/sql/repair_nas_osaki_coordinates.sql';
const sql = fs.readFileSync(sqlPath, 'utf8');
const override = JSON.parse(fs.readFileSync('scripts/data/location-coordinate-overrides.json')).filter(x => x.slug === 'sports-club-nas-osaki-index');
assert.equal(override.length, 1);
assert.deepEqual([override[0].latitude, override[0].longitude], [35.618258, 139.726683]);
await db.exec("create role anon; create role authenticated; create role service_role; set timezone='UTC';");
const migrations = fs.readdirSync('supabase/migrations').filter(f => f.endsWith('.sql')).sort();
for (const file of migrations) await db.exec(fs.readFileSync('supabase/migrations/' + file, 'utf8'));
await db.exec('create schema supabase_migrations; create table supabase_migrations.schema_migrations(version text primary key);');
for (const file of migrations) await db.query('insert into supabase_migrations.schema_migrations values ($1)', [file.split('_')[0]]);
for (const [table, key] of [['gym_brands', 'brands'], ['gym_locations', 'locations'], ['programs', 'programs'], ['lesson_location_memberships', 'memberships'], ['class_schedules', 'schedules']]) {
  await db.query(`insert into public.${table} select * from jsonb_populate_recordset(null::public.${table},$1::jsonb)`, [JSON.stringify(snapshot[key])]);
}
const tables = (await db.query("select tablename from pg_tables where schemaname='public' order by tablename")).rows.map(r => r.tablename);
async function allData() {
  const result = {};
  for (const table of tables) result[table] = (await db.query(`select coalesce(jsonb_agg(r order by r::text),'[]'::jsonb) as rows from (select to_jsonb(t) as r from public.${table} t) x`)).rows[0].rows;
  return result;
}
const rpcSql = "select coalesce(jsonb_agg(to_jsonb(r) order by result_order),'[]'::jsonb) as rows from public.search_structured_lesson_class_schedule_page(p_query => 'bodycombat', p_query_compact => 'bodycombat', p_prefecture => '東京都', p_municipality => '品川区', p_limit => 1000) r";
async function rpc() { return (await db.query(rpcSql)).rows[0].rows; }
const before = await allData();
const beforeRpc = await rpc();
const originalTarget = before.gym_locations.find(l => l.id === targetId);
assert.equal(originalTarget.latitude, null); assert.equal(originalTarget.longitude, null);
assert.equal(before.class_schedules.filter(s => s.location_id === targetId).length, 104);

// These real failure scenarios must abort without persisting the drift or coordinates.
const negative = [];
for (const [name, drift] of [
  ['migration-head-changed', "update supabase_migrations.schema_migrations set version='9999' where version='0015'"],
  ['already-populated-coordinate', `update gym_locations set latitude=35.618258 where id='${targetId}'`],
  ['membership-removed', `delete from lesson_location_memberships where location_id='${targetId}'`],
  ['schedule-changed', `update class_schedules set raw_program_name='DRIFT_TEST' where id=(select id from class_schedules where location_id='${targetId}' order by id limit 1)`],
  ['child-changed', `update gym_locations set longitude=139.7 where id='${childIds[0]}'`],
]) {
  await db.exec('begin; ' + drift);
  await assert.rejects(() => db.exec(sql), /NAS_OSAKI_PRODUCTION_DRIFT/);
  await db.exec('rollback');
  assert.deepEqual(await allData(), before);
  negative.push(name);
}
await db.exec(sql);
const after = await allData();
const repaired = after.gym_locations.find(l => l.id === targetId);
assert.deepEqual([repaired.latitude, repaired.longitude], [override[0].latitude, override[0].longitude]);
const changedFields = Object.keys(repaired).filter(k => JSON.stringify(repaired[k]) !== JSON.stringify(originalTarget[k])).sort();
assert.deepEqual(changedFields, ['latitude', 'longitude', 'updated_at']); // Existing DB trigger, not a payload field.
const normalizedAfter = structuredClone(after);
normalizedAfter.gym_locations = normalizedAfter.gym_locations.map(l => l.id === targetId ? originalTarget : l).sort((a,b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
const normalizedBefore = structuredClone(before);
normalizedBefore.gym_locations.sort((a,b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
assert.deepEqual(normalizedAfter, normalizedBefore, 'Every other public table/row/column must remain exact');
assert.deepEqual(await rpc(), beforeRpc, 'S1 result IDs/order/count/update metadata must remain exact');
assert.equal(new Set(after.class_schedules.map(s => s.id)).size, after.class_schedules.length);
for (const id of childIds) {
  assert.deepEqual(after.gym_locations.find(l => l.id === id), before.gym_locations.find(l => l.id === id));
  assert.equal(after.class_schedules.filter(s => s.location_id === id).length, 0);
}
function indexFor(state) {
  const memberIds = new Set(state.lesson_location_memberships.map(m => m.location_id));
  const activeIds = new Set(state.gym_locations.filter(l => l.is_active && memberIds.has(l.id)).map(l => l.id));
  return buildMapLessonPurposeIndex(state.class_schedules.filter(s => activeIds.has(s.location_id)).sort((a,b) => a.id.localeCompare(b.id)));
}
const beforeIndex = indexFor(before); const afterIndex = indexFor(after);
assert.deepEqual(afterIndex, beforeIndex);
const queries = {};
for (const query of ['', 'bodycombat']) {
  const { matchesByLocationId } = getMapLessonQueryMatches(afterIndex, query);
  const count = (matchesByLocationId.get(targetId) || []).reduce((n, item) => n + item[3], 0);
  assert.equal(count, query ? 8 : 104);
  const mappableBefore = before.gym_locations.filter(l => l.latitude !== null && l.longitude !== null && (!query || matchesByLocationId.has(l.id)));
  const mappableAfter = after.gym_locations.filter(l => l.latitude !== null && l.longitude !== null && (!query || matchesByLocationId.has(l.id)));
  assert(!mappableBefore.some(l => l.id === targetId)); assert(mappableAfter.some(l => l.id === targetId));
  assert.deepEqual(mappableAfter.filter(l => l.id !== targetId), mappableBefore);
  queries[query || 'blank'] = { ownScheduleCount: count, before: false, after: true, beforeMatchingMappableLocations: mappableBefore.length, afterMatchingMappableLocations: mappableAfter.length };
}
const mappable = after.gym_locations.filter(l => l.latitude !== null && l.longitude !== null);
const bounds = {north:35.620,south:35.617,east:139.728,west:139.725};
const inOsakiBounds = mappable.filter(l => l.latitude <= bounds.north && l.latitude >= bounds.south && l.longitude <= bounds.east && l.longitude >= bounds.west);
assert(inOsakiBounds.some(l => l.id === targetId));
const byCenter = rankLessonLocationsByMapCenter(inOsakiBounds,{latitude:35.618258,longitude:139.726683});
assert.equal(byCenter[0].id,targetId); assert.equal(byCenter[0].mapCenterDistanceKm,0);
const nearby = rankLessonLocationsByProximity(mappable,DEFAULT_LESSON_PROXIMITY_ORIGIN);
assert(nearby.every((l,i) => i === 0 || nearby[i-1].distanceKm <= l.distanceKm));
await assert.rejects(() => db.exec(sql),/NAS_OSAKI_PRODUCTION_DRIFT/);
await db.exec('rollback');assert.deepEqual(await allData(),after);
fs.mkdirSync(outputDir,{recursive:true});
const brandById = new Map(snapshot.brands.map(b => [b.id,b]));
for (const [name,state,index] of [['before',before,beforeIndex],['after',after,afterIndex]]) {
  fs.writeFileSync(path.join(outputDir,name+'-map-props.json'),JSON.stringify({locations:state.gym_locations.map(l => ({...l,brand:brandById.get(l.brand_id)})),lessonIndex:index},null,2)+'\n');
}
const hash = data => createHash('sha256').update(typeof data === 'string' ? data : JSON.stringify(data)).digest('hex');
const report = {status:'PASS',checkedAt:new Date().toISOString(),engine:(await db.query('select version()')).rows[0].version,baselineCheckedAt:snapshot.checkedAt,migrationFiles:migrations,publicTablesCompared:tables.length,locationId:targetId,coordinates:[repaired.latitude,repaired.longitude],changedFields,queries,purposeIndexUnchanged:true,membershipUnchanged:true,schedulesUnchanged:true,childRowsUnchanged:true,otherPublicTablesUnchanged:true,s1ResultUnchanged:true,s1Rows:beforeRpc.length,mapScopePass:true,nearbyRankingPass:true,negativeScenarios:negative,replayFailsClosed:true,sqlSha256:hash(sql),baselineFileSha256:hash(fs.readFileSync(snapshotPath,'utf8')),scheduleRowsSha256:hash(before.class_schedules),membershipRowsSha256:hash(before.lesson_location_memberships),productionWrites:false};
fs.writeFileSync(path.join(outputDir,'validation.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));await db.close();
