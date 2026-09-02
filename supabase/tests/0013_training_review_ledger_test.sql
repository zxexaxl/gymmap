begin;

select no_plan();

select has_table('public', 'training_review_protocols', 'review protocols exist');
select has_table('public', 'training_review_dimensions', 'review dimensions exist');
select has_table('public', 'training_review_cycles', 'review cycles exist');
select has_table('public', 'training_review_units', 'atomic review units exist');
select has_table('public', 'training_review_unit_sources', 'review source set exists');
select has_table('public', 'training_review_invalidations', 'review invalidations exist');

select results_eq(
  $$select count(*)::integer from public.training_review_protocols protocol
    join public.training_disciplines discipline on discipline.id = protocol.discipline_id
    where discipline.slug = 'hyrox' and protocol.protocol_version = 'h3-11a-v1'$$,
  $$values (1)$$,
  'accepted H3-11A protocol is seeded once'
);
select results_eq(
  $$select count(*)::integer from public.training_review_dimensions dimension
    join public.training_disciplines discipline on discipline.id = dimension.discipline_id
    where discipline.slug = 'hyrox' and dimension.dimension_kind = 'WORKOUT_STATION'$$,
  $$values (8)$$,
  'exactly eight HYROX workout stations are seeded'
);
select results_eq(
  $$select count(*)::integer from public.training_review_dimensions dimension
    join public.training_disciplines discipline on discipline.id = dimension.discipline_id
    where discipline.slug = 'hyrox'$$,
  $$values (10)$$,
  'eight stations plus running and facility identity are seeded'
);
select results_eq(
  $$select count(*)::integer from public.training_review_cycles$$,
  $$values (0)$$,
  'migration creates no review-cycle backfill'
);

select ok(
  not has_table_privilege('anon', 'public.training_review_cycles', 'SELECT')
  and not has_table_privilege('authenticated', 'public.training_review_cycles', 'SELECT')
  and not has_table_privilege('anon', 'public.training_review_units', 'INSERT')
  and not has_table_privilege('authenticated', 'public.training_review_unit_sources', 'INSERT'),
  'anon and authenticated have no ledger access'
);
select ok(
  has_table_privilege('service_role', 'public.training_review_cycles', 'SELECT,INSERT')
  and not has_table_privilege('service_role', 'public.training_review_cycles', 'UPDATE')
  and not has_table_privilege('service_role', 'public.training_review_cycles', 'DELETE')
  and has_table_privilege('service_role', 'public.training_review_units', 'SELECT,INSERT'),
  'service role can append but cannot rewrite review history'
);
select results_eq(
  $$select count(*)::integer from pg_policies where schemaname = 'public'
    and tablename like 'training_review_%'$$,
  $$values (0)$$,
  'ledger has no RLS policies that expose rows'
);

insert into public.gym_brands (name, slug)
values ('H3-11B Test Brand', 'h3-11b-test-brand');
insert into public.gym_locations (brand_id, name, slug)
select id, 'H3-11B Test Location', 'h3-11b-test-location'
from public.gym_brands where slug = 'h3-11b-test-brand';
insert into public.training_sources (
  location_id, url, source_kind, publisher_authority, availability_state, last_checked_at
)
select id, 'https://example.test/h3-11b', 'facility_page', 'facility_official', 'available', now()
from public.gym_locations where slug = 'h3-11b-test-location';

create function pg_temp.add_cycle(p_key text, p_kind text default 'REVIEW', p_supersedes uuid default null)
returns uuid language plpgsql as $$
declare result uuid;
begin
  insert into public.training_review_cycles (
    location_id, discipline_id, protocol_id, cycle_key, cycle_kind, reviewed_at,
    reviewer_authority, supersedes_review_cycle_id, supersession_reason
  )
  select location.id, discipline.id, protocol.id, p_key, p_kind, now(), 'H3-11B_TEST',
    p_supersedes, case when p_supersedes is null then null else 'superseded by test cycle' end
  from public.gym_locations location
  cross join public.training_disciplines discipline
  join public.training_review_protocols protocol on protocol.discipline_id = discipline.id
  where location.slug = 'h3-11b-test-location' and discipline.slug = 'hyrox'
    and protocol.protocol_version = 'h3-11a-v1'
  returning id into result;
  return result;
end $$;

create function pg_temp.add_unit(
  p_cycle uuid, p_dimension text, p_aspect text, p_progress text,
  p_sufficiency text, p_outcome text
) returns uuid language plpgsql as $$
declare result uuid;
begin
  insert into public.training_review_units (
    review_cycle_id, discipline_id, review_dimension_id, review_aspect,
    review_progress, source_sufficiency, positive_outcome
  )
  select p_cycle, discipline.id, dimension.id, p_aspect, p_progress, p_sufficiency, p_outcome
  from public.training_disciplines discipline
  join public.training_review_dimensions dimension on dimension.discipline_id = discipline.id
  where discipline.slug = 'hyrox' and dimension.slug = p_dimension
  returning id into result;
  return result;
end $$;

create temp table h3_11b_ids (name text primary key, id uuid not null);
insert into h3_11b_ids values ('cycle-1', pg_temp.add_cycle('cycle-1'));

select lives_ok(
  $$select pg_temp.add_unit((select id from h3_11b_ids where name='cycle-1'),
    'facility-identity', 'FACILITY_IDENTITY', 'UNREVIEWED', 'UNKNOWN', 'NOT_ASSESSED')$$,
  'UNREVIEWED / UNKNOWN / NOT_ASSESSED is legal'
);
select lives_ok(
  $$select pg_temp.add_unit((select id from h3_11b_ids where name='cycle-1'),
    'ski-erg', 'EQUIPMENT_FACT', 'PARTIAL', 'UNKNOWN', 'POSITIVE_FOUND')$$,
  'PARTIAL / UNKNOWN / POSITIVE_FOUND is legal'
);
select lives_ok(
  $$select pg_temp.add_unit((select id from h3_11b_ids where name='cycle-1'),
    'row', 'EQUIPMENT_FACT', 'COMPLETE', 'SUFFICIENT', 'POSITIVE_FOUND')$$,
  'COMPLETE / SUFFICIENT / POSITIVE_FOUND is legal'
);
select lives_ok(
  $$select pg_temp.add_unit((select id from h3_11b_ids where name='cycle-1'),
    'sled-push', 'SPACE_FACT', 'COMPLETE', 'SUFFICIENT', 'NO_POSITIVE_FOUND')$$,
  'COMPLETE / SUFFICIENT / NO_POSITIVE_FOUND is legal'
);
select lives_ok(
  $$select pg_temp.add_unit((select id from h3_11b_ids where name='cycle-1'),
    'wall-balls', 'EQUIPMENT_FACT', 'PARTIAL', 'INSUFFICIENT', 'NOT_ASSESSED')$$,
  'source-insufficient review remains partial and not assessed'
);

select throws_ok(
  $$select pg_temp.add_unit((select id from h3_11b_ids where name='cycle-1'),
    'sled-pull', 'SPACE_FACT', 'COMPLETE', 'UNKNOWN', 'POSITIVE_FOUND')$$,
  '23514', null, 'COMPLETE / UNKNOWN is rejected'
);
select throws_ok(
  $$select pg_temp.add_unit((select id from h3_11b_ids where name='cycle-1'),
    'sled-pull', 'EQUIPMENT_FACT', 'COMPLETE', 'INSUFFICIENT', 'NOT_ASSESSED')$$,
  '23514', null, 'COMPLETE / INSUFFICIENT is rejected'
);
select throws_ok(
  $$select pg_temp.add_unit((select id from h3_11b_ids where name='cycle-1'),
    'sled-pull', 'USAGE_ACCESS_FACT', 'COMPLETE', 'BLOCKED', 'NOT_ASSESSED')$$,
  '23514', null, 'COMPLETE / BLOCKED is rejected'
);
select throws_ok(
  $$select pg_temp.add_unit((select id from h3_11b_ids where name='cycle-1'),
    'burpee-broad-jump', 'SPACE_FACT', 'PARTIAL', 'UNKNOWN', 'NO_POSITIVE_FOUND')$$,
  '23514', null, 'PARTIAL / NO_POSITIVE_FOUND is rejected'
);
select throws_ok(
  $$select pg_temp.add_unit((select id from h3_11b_ids where name='cycle-1'),
    'farmers-carry', 'SPACE_FACT', 'UNREVIEWED', 'UNKNOWN', 'NO_POSITIVE_FOUND')$$,
  '23514', null, 'UNREVIEWED / NO_POSITIVE_FOUND is rejected'
);
select throws_ok(
  $$select pg_temp.add_unit((select id from h3_11b_ids where name='cycle-1'),
    'sandbag-lunges', 'SPACE_FACT', 'UNREVIEWED', 'UNKNOWN', 'POSITIVE_FOUND')$$,
  '23514', null, 'UNREVIEWED / POSITIVE_FOUND is rejected'
);
select throws_ok(
  $$select pg_temp.add_unit((select id from h3_11b_ids where name='cycle-1'),
    'wall-balls', 'INVALID_ASPECT', 'PARTIAL', 'UNKNOWN', 'NOT_ASSESSED')$$,
  '23514', null, 'unknown review aspect fails closed'
);
select throws_ok($$
  insert into public.training_review_units (
    review_cycle_id, discipline_id, review_dimension_id, review_aspect,
    review_progress, source_sufficiency, positive_outcome
  )
  select cycle.id, discipline.id, gen_random_uuid(), 'SPACE_FACT',
    'PARTIAL', 'UNKNOWN', 'NOT_ASSESSED'
  from h3_11b_ids cycle cross join public.training_disciplines discipline
  where cycle.name='cycle-1' and discipline.slug='hyrox'
$$, '23503', null, 'unknown review dimension fails closed');

insert into h3_11b_ids values ('cycle-2', pg_temp.add_cycle('cycle-2'));
select lives_ok(
  $$select pg_temp.add_unit((select id from h3_11b_ids where name='cycle-2'),
    'ski-erg', 'EQUIPMENT_FACT', 'COMPLETE', 'SUFFICIENT', 'POSITIVE_FOUND')$$,
  'same review unit in a later cycle is legal'
);
select results_eq(
  $$select count(*)::integer from public.training_review_cycles$$,
  $$values (2)$$,
  'later cycle does not delete the historical cycle'
);
select throws_ok(
  $$select pg_temp.add_unit((select id from h3_11b_ids where name='cycle-2'),
    'ski-erg', 'EQUIPMENT_FACT', 'COMPLETE', 'SUFFICIENT', 'POSITIVE_FOUND')$$,
  '23505', null, 'duplicate atomic unit in one cycle is rejected'
);
select throws_ok(
  $$select pg_temp.add_cycle('bad-correction', 'ADMINISTRATIVE_CORRECTION', null)$$,
  '23514', null, 'administrative correction requires a superseded cycle'
);
insert into h3_11b_ids
select 'correction', pg_temp.add_cycle('correction-1', 'ADMINISTRATIVE_CORRECTION', id)
from h3_11b_ids where name = 'cycle-2';
select results_eq(
  $$select count(*)::integer from public.training_review_cycles where cycle_kind='ADMINISTRATIVE_CORRECTION'$$,
  $$values (1)$$,
  'correction is represented by a new linked cycle'
);

insert into h3_11b_ids
select 'ski-unit', unit.id
from public.training_review_units unit
join public.training_review_dimensions dimension on dimension.id = unit.review_dimension_id
where unit.review_cycle_id = (select id from h3_11b_ids where name='cycle-2')
  and dimension.slug = 'ski-erg';

select lives_ok($$
  insert into public.training_review_unit_sources (
    review_unit_id, training_source_id, source_class, facility_binding,
    sufficiency_role, observed_at, reviewed_at, source_availability_state_at_review,
    source_content_hash_at_review, binding_basis
  )
  select unit.id, source.id, 'FACILITY_SPECIFIC_OFFICIAL_PAGE', 'FACILITY_SPECIFIC',
    'PRIMARY', now() - interval '1 minute', now(), source.availability_state,
    source.content_hash, 'source location_id matched the reviewed facility'
  from h3_11b_ids unit
  cross join public.training_sources source
  where unit.name='ski-unit' and source.url='https://example.test/h3-11b'
$$, 'reviewed source set stores review-time source context');
select throws_ok($$
  insert into public.training_review_unit_sources (
    review_unit_id, training_source_id, source_class, facility_binding,
    sufficiency_role, observed_at, reviewed_at, source_availability_state_at_review
  )
  select unit.id, source.id, 'INVALID_CLASS', 'FACILITY_SPECIFIC', 'PRIMARY', now(), now(), 'available'
  from h3_11b_ids unit cross join public.training_sources source
  where unit.name='ski-unit' and source.url='https://example.test/h3-11b'
$$, '23514', null, 'unknown source class fails closed');

select lives_ok($$
  insert into public.training_review_invalidations (
    review_unit_id, discipline_id, invalidation_key, reason_code,
    invalidated_at, invalidation_authority, training_source_id, details
  )
  select unit.id, discipline.id, 'source-drift-1', 'MATERIAL_SOURCE_DRIFT', now(),
    'H3-11B_TEST', source.id, 'material test drift'
  from h3_11b_ids unit
  cross join public.training_disciplines discipline
  cross join public.training_sources source
  where unit.name='ski-unit' and discipline.slug='hyrox'
    and source.url='https://example.test/h3-11b'
$$, 'source drift is appended without rewriting the historical unit');
select results_eq(
  $$select count(*)::integer from public.training_review_units unit
    join h3_11b_ids ids on ids.id=unit.id where ids.name='ski-unit'$$,
  $$values (1)$$,
  'invalidated historical review remains auditable'
);
select results_eq(
  $$select count(*)::integer from information_schema.columns
    where table_schema='public' and table_name='training_review_units' and column_name='is_current'$$,
  $$values (0)$$,
  'currentness is not stored as a sole mutable boolean'
);

select ok(
  not exists (
    select 1 from pg_views
    where schemaname='public'
      and (definition ilike '%training_review_units%' or definition ilike '%training_review_cycles%')
  ),
  'public views do not publish review ledger state'
);
select ok(
  not exists (
    select 1 from pg_proc procedure
    join pg_namespace namespace on namespace.oid=procedure.pronamespace
    where namespace.nspname='public'
      and procedure.prokind='f'
      and pg_get_functiondef(procedure.oid) ilike '%training_review_units%'
  ),
  'public functions and RPCs do not consume review ledger state'
);

select finish();
rollback;
