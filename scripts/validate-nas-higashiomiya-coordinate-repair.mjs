// Disposable PostgreSQL17 only. The socket argument must be inside this task's /private/tmp prefix.
// node --import tsx scripts/validate-nas-higashiomiya-coordinate-repair.mjs baseline hashes socket pg-runtime output
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
const require = createRequire(import.meta.url);
const { buildMapLessonPurposeIndex, getMapLessonQueryMatches, formatMapLessonMatchPreview } = require('../src/lib/map-lesson-purpose-index.ts');
const { rankLessonLocationsByProximity, rankLessonLocationsByMapCenter, DEFAULT_LESSON_PROXIMITY_ORIGIN, haversineDistanceKm } = require('../src/components/map/lesson-proximity.ts');
const { buildMapSelectionHref, resolveMapSelection } = require('../src/components/map/map-runtime-state.ts');
const [baselinePath, hashesPath, socket, runtime, output] = process.argv.slice(2);
assert(baselinePath && hashesPath && socket && runtime && output);
assert.match(socket, /^\/private\/tmp\/nas-higashiomiya-pg17-[^/]+\/socket$/);
const { Client } = createRequire(path.resolve(runtime, 'package.json'))('pg');
const database = process.env.GYMMAP_DISPOSABLE_DATABASE || 'postgres';
assert.match(database, /^(postgres|nas_higashiomiya_[a-z0-9_]+)$/);
const db = new Client({ host: socket, port: 55449, user: 'te', database, password: '' });
await db.connect();
try {
  assert.equal(Math.floor(Number((await db.query('show server_version_num')).rows[0].server_version_num) / 10000), 17);
  const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
  const fresh = JSON.parse(fs.readFileSync(hashesPath, 'utf8'));
  const id = 'a6d34e4b-6cc1-4f6f-9fd0-793240e203d4';
  const coordinates = [35.947483, 139.641284];
  const masterTables = ['gym_brands', 'gym_locations', 'programs', 'lesson_location_memberships', 'class_schedules'];
  for (const table of masterTables) assert.equal(baseline[table + '_sha256'], fresh[table + '_sha256'], 'Fresh hash must match supplied local baseline: ' + table);
  assert.deepEqual(baseline.gym_locations.find(r => r.id === id), fresh.target);
  assert.equal(fresh.target.latitude, null); assert.equal(fresh.target.longitude, null); assert.equal(fresh.target.is_active, true);
  assert.equal(fresh.membership.location_id, id);
  assert.equal(fresh.schedules.length, 143);
  assert.deepEqual(fresh.census, { gaps: 1, mappable: 365, active_positive: 366 });
  const apply = fs.readFileSync('supabase/sql/repair_nas_higashiomiya_coordinates.sql', 'utf8');
  const rollbackSource = fs.readFileSync('supabase/sql/rollback_nas_higashiomiya_coordinates.sql', 'utf8');
  const overrides = JSON.parse(fs.readFileSync('scripts/data/location-coordinate-overrides.json', 'utf8')).filter(r => r.slug === fresh.target.slug);
  assert.equal(overrides.length, 1); assert.deepEqual([overrides[0].latitude, overrides[0].longitude], coordinates);
  for (const role of ['anon', 'authenticated', 'service_role']) await db.query(`do $$ begin create role ${role}; exception when duplicate_object then null; end $$;`);
  await db.query("set timezone='UTC'");
  const migrations = fs.readdirSync('supabase/migrations').filter(f => f.endsWith('.sql')).sort();
  for (const file of migrations) await db.query(fs.readFileSync('supabase/migrations/' + file, 'utf8'));
  await db.query('create schema supabase_migrations; create table supabase_migrations.schema_migrations(version text primary key);');
  for (const file of migrations) await db.query('insert into supabase_migrations.schema_migrations values ($1)', [file.split('_')[0]]);
  for (const table of masterTables) await db.query(`insert into public.${table} select * from jsonb_populate_recordset(null::public.${table},$1::jsonb)`, [JSON.stringify(baseline[table])]);
  // Recompute hashes with actual numeric/timestamp storage, rather than trusting JSON labels.
  for (const table of masterTables) {
    const key = table === 'lesson_location_memberships' ? 'location_id' : 'id';
    const result = await db.query(`select encode(sha256(convert_to(jsonb_agg(to_jsonb(t) order by ${key})::text,'UTF8')),'hex') hash from public.${table} t`);
    assert.equal(result.rows[0].hash, fresh[table + '_sha256'], 'Restored table must match fresh Production fingerprint: ' + table);
  }
  const tables = (await db.query("select tablename from pg_tables where schemaname='public' order by tablename")).rows.map(r => r.tablename);
  async function state() {
    const s = {};
    for (const table of tables) s[table] = (await db.query(`select coalesce(jsonb_agg(to_jsonb(t) order by to_jsonb(t)::text),'[]'::jsonb) rows from public.${table} t`)).rows[0].rows;
    return s;
  }
  async function schema() {
    return (await db.query(`select jsonb_build_object(
      'columns',(select jsonb_agg(to_jsonb(a) order by a.attrelid,a.attnum) from pg_attribute a join pg_class c on c.oid=a.attrelid join pg_namespace n on n.oid=c.relnamespace where n.nspname='public'),
      'constraints',(select jsonb_agg(to_jsonb(c) order by c.oid) from pg_constraint c join pg_namespace n on n.oid=c.connamespace where n.nspname='public'),
      'triggers',(select jsonb_agg(to_jsonb(t) order by t.oid) from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace where n.nspname='public'),
      'functions',(select jsonb_agg(to_jsonb(p) order by p.oid) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public')
    ) state`)).rows[0].state;
  }
  async function s1(query) {
    return (await db.query("select coalesce(jsonb_agg(to_jsonb(r) order by result_order),'[]'::jsonb) rows from public.search_structured_lesson_class_schedule_page(p_query=>$1,p_query_compact=>$1,p_brand=>'NAS',p_prefecture=>'埼玉県',p_municipality=>'さいたま市',p_limit=>1000) r", [query])).rows[0].rows;
  }
  const hash = value => createHash('sha256').update(typeof value === 'string' ? value : JSON.stringify(value)).digest('hex');
  const before = await state(); const schemaBefore = await schema(); const beforeHash = hash(before);
  const memberIds = new Set(before.lesson_location_memberships.map(r => r.location_id));
  const discovery = s => s.gym_locations.filter(r => r.is_active && memberIds.has(r.id));
  const mappable = s => discovery(s).filter(r => r.latitude !== null && r.longitude !== null);
  function index(s) {
    const activeIds = new Set(discovery(s).map(r => r.id));
    return buildMapLessonPurposeIndex(s.class_schedules.filter(r => activeIds.has(r.location_id)).sort((a, b) => a.id.localeCompare(b.id)));
  }
  const beforeIndex = index(before);
  const queries = ['', 'bodycombat', 'bodypump'];
  const s1Before = {};
  for (const query of queries) s1Before[query] = await s1(query);
  const ownedScheduleIds = new Set(before.class_schedules.filter(r => r.location_id === id).map(r => r.id));
  for (const query of queries) assert(s1Before[query].some(r => ownedScheduleIds.has(r.schedule_id)), 'S1 must return real target schedules, not the empty-result sentinel');
  const negative = [];
  for (const [name, drift] of [
    ['latitude-filled', `update gym_locations set latitude=35.9 where id='${id}'`],
    ['longitude-filled', `update gym_locations set longitude=139.6 where id='${id}'`],
    ['inactive', `update gym_locations set is_active=false where id='${id}'`],
    ['identity', `update gym_locations set slug=slug||'-drift' where id='${id}'`],
    ['membership-removed', `delete from lesson_location_memberships where location_id='${id}'`],
    ['schedule-content', `update class_schedules set raw_program_name='DRIFT' where id=(select id from class_schedules where location_id='${id}' limit 1)`],
    ['schedule-owner', `update class_schedules set location_id='ce0f6e5d-3455-4305-85b8-68a50dd5a57b' where id=(select id from class_schedules where location_id='${id}' limit 1)`],
    ['other-location', "update gym_locations set longitude=139.7 where id='ce0f6e5d-3455-4305-85b8-68a50dd5a57b'"],
    ['migration', "update supabase_migrations.schema_migrations set version='9999' where version='0015'"],
  ]) {
    await db.query('begin;' + drift);
    await assert.rejects(() => db.query(apply), /NAS_HIGASHIOMIYA_/);
    await db.query('rollback'); assert.equal(hash(await state()), beforeHash); negative.push(name);
  }
  await db.query(apply);
  const after = await state(); const target = after.gym_locations.find(r => r.id === id); const old = before.gym_locations.find(r => r.id === id);
  assert.deepEqual([target.latitude, target.longitude], coordinates);
  const byId = new Map(before.gym_locations.map(r => [r.id, r]));
  assert.deepEqual(after.gym_locations.filter(r => JSON.stringify(r) !== JSON.stringify(byId.get(r.id))).map(r => r.id), [id]);
  assert.deepEqual(Object.keys(target).filter(k => JSON.stringify(target[k]) !== JSON.stringify(old[k])).sort(), ['latitude', 'longitude', 'updated_at']);
  for (const table of tables) if (table !== 'gym_locations') assert.deepEqual(after[table], before[table]);
  assert.deepEqual(await schema(), schemaBefore);
  assert.equal(discovery(before).length, 366); assert.equal(discovery(after).length, 366);
  assert.equal(mappable(before).length, 365); assert.equal(mappable(after).length, 366);
  assert.equal(discovery(after).filter(r => r.latitude === null || r.longitude === null).length, 0);
  const afterIndex = index(after); assert.deepEqual(afterIndex, beforeIndex); assert.equal(afterIndex.length, 247);
  const queryResults = [];
  for (const query of queries) {
    const { matchesByLocationId } = getMapLessonQueryMatches(afterIndex, query);
    const own = matchesByLocationId.get(id); assert(own?.length);
    const ownCount = own.reduce((n, row) => n + row[3], 0);
    assert(!mappable(before).some(r => r.id === id));
    assert(mappable(after).some(r => r.id === id && (!query || matchesByLocationId.has(r.id))));
    const preview = formatMapLessonMatchPreview(own); assert(preview);
    assert.deepEqual(await s1(query), s1Before[query]);
    queryResults.push({ query: query || 'blank', ownCount, preview, before: false, after: true, s1Rows: s1Before[query].filter(r => r.schedule_id).length, s1TargetRows: s1Before[query].filter(r => ownedScheduleIds.has(r.schedule_id)).length });
  }
  const nearby = rankLessonLocationsByProximity(mappable(after), DEFAULT_LESSON_PROXIMITY_ORIGIN);
  assert(nearby.every((r, i) => !i || nearby[i - 1].distanceKm <= r.distanceKm));
  const center = { latitude: coordinates[0], longitude: coordinates[1] };
  const scoped = mappable(after).filter(r => Math.abs(r.latitude - center.latitude) < .001 && Math.abs(r.longitude - center.longitude) < .001);
  assert.equal(rankLessonLocationsByMapCenter(scoped, center)[0].id, id);
  const collisions = mappable(after).filter(r => r.id !== id).map(r => ({ id: r.id, name: r.name, distanceM: 1000 * haversineDistanceKm(target, r) })).sort((a, b) => a.distanceM - b.distanceM);
  assert(collisions.every(r => r.distanceM > 0));
  const href = buildMapSelectionHref('https://gymmap.vercel.app/?q=bodycombat', target.slug);
  assert.equal(new URL(href, 'https://gymmap.vercel.app').searchParams.get('selected'), target.slug);
  assert.deepEqual(resolveMapSelection(new URL(href, 'https://gymmap.vercel.app').search, mappable(after).map(r => ({ id: r.id, publicKey: r.slug }))), { kind: 'valid', selectedId: id });
  const afterHash = hash(after);
  await assert.rejects(() => db.query(apply), /NAS_HIGASHIOMIYA_/); await db.query('rollback'); assert.equal(hash(await state()), afterHash);
  const rollback = receipt => rollbackSource.replace(":'release_postimage'", "'" + JSON.stringify(receipt).replaceAll("'", "''") + "'");
  await assert.rejects(() => db.query(rollback({ ...target, updated_at: '2000-01-01T00:00:00+00:00' })), /NAS_HIGASHIOMIYA_ROLLBACK_POSTIMAGE_DRIFT/);
  await db.query('rollback'); assert.equal(hash(await state()), afterHash);
  await db.query(rollback(target));
  const restored = await state();
  for (const table of tables) if (table !== 'gym_locations') assert.deepEqual(restored[table], before[table]);
  for (const row of restored.gym_locations) {
    const omit = r => Object.fromEntries(Object.entries(r).filter(([k]) => k !== 'updated_at'));
    assert.deepEqual(row.id === id ? omit(row) : row, row.id === id ? omit(old) : byId.get(row.id));
  }
  assert.deepEqual(await schema(), schemaBefore);
  await assert.rejects(() => db.query(rollback(target)), /NAS_HIGASHIOMIYA_/); await db.query('rollback');
  fs.mkdirSync(output, { recursive: true });
  const brandById = new Map(baseline.gym_brands.map(r => [r.id, r]));
  for (const [name, s, lessonIndex] of [['before', before, beforeIndex], ['after', after, afterIndex]]) {
    fs.writeFileSync(path.join(output, name + '-map-props.json'), JSON.stringify({ locations: discovery(s).map(r => ({ ...r, brand: brandById.get(r.brand_id) })), lessonIndex }));
  }
  const owned = before.class_schedules.filter(r => r.location_id === id);
  const latestPeriod = owned.reduce((p, r) => r.valid_from > p ? r.valid_from : p, '');
  const report = {
    status: 'NAS_HIGASHIOMIYA_PG17_REHEARSAL_PASS', checkedAt: new Date().toISOString(), engine: (await db.query('select version()')).rows[0].version,
    locationId: id, acceptedCoordinates: coordinates, baselineCheckedAt: baseline.checked_at, freshHashesCheckedAt: fresh.checked_at,
    baselineSha256: hash(fs.readFileSync(baselinePath, 'utf8')), freshWholeTableHashesMatch: true, migrations, publicTablesCompared: tables.length,
    fixture: 'User-supplied existing public Lesson snapshot; five tables matched to fresh read-only hashes. Other public tables are schema-only.',
    changedFields: ['latitude', 'longitude', 'updated_at'], exactOneLocationChanged: true, membershipsAndSchedulesUnchanged: true, scheduleCount: owned.length,
    latestPeriod, latestCount: owned.filter(r => r.valid_from === latestPeriod).length, schemaUnchanged: true, purposeIndexUnchanged: true,
    activePositiveMembers: 366, mappableBefore: 365, mappableAfter: 366, gapsAfter: 0, queries: queryResults,
    nearbyAndMapScopePass: true, selectionHref: href, nearestOthers: collisions.slice(0, 3), negativeScenarios: negative,
    applyReplayRejected: true, rollbackPass: true, rollbackReceiptTamperRejected: true, rollbackReplayRejected: true,
    applySha256: hash(apply), rollbackSha256: hash(rollbackSource), productionWrites: false,
  };
  fs.writeFileSync(path.join(output, 'validation.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
} finally { await db.end(); }
