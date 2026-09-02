\set ON_ERROR_STOP on

begin;

create function pg_temp.assert_true(condition boolean, message text)
returns void language plpgsql as $$
begin
  if condition is not true then
    raise exception 'H3-11B validation failed: %', message;
  end if;
end $$;

create function pg_temp.expect_sqlstate(statement text, expected_state text, message text)
returns void language plpgsql as $$
begin
  begin
    execute statement;
  exception when others then
    if sqlstate = expected_state then
      return;
    end if;
    raise exception 'H3-11B validation failed: % (expected %, received %: %)',
      message, expected_state, sqlstate, sqlerrm;
  end;
  raise exception 'H3-11B validation failed: % (statement unexpectedly succeeded)', message;
end $$;

select pg_temp.assert_true(
  (select count(*) = 1 from public.training_review_protocols protocol
   join public.training_disciplines discipline on discipline.id=protocol.discipline_id
   where discipline.slug='hyrox' and protocol.protocol_version='h3-11a-v1'),
  'accepted protocol seed'
);
select pg_temp.assert_true(
  (select count(*) = 8 from public.training_review_dimensions dimension
   join public.training_disciplines discipline on discipline.id=dimension.discipline_id
   where discipline.slug='hyrox' and dimension.dimension_kind='WORKOUT_STATION'),
  'exactly eight workout stations'
);
select pg_temp.assert_true(
  (select count(*) = 10 from public.training_review_dimensions dimension
   join public.training_disciplines discipline on discipline.id=dimension.discipline_id
   where discipline.slug='hyrox'),
  'eight stations plus two non-station dimensions'
);
select pg_temp.assert_true(
  (select count(*) = 0 from public.training_review_cycles),
  'no review backfill'
);
select pg_temp.assert_true(
  not has_table_privilege('anon', 'public.training_review_cycles', 'SELECT')
  and not has_table_privilege('authenticated', 'public.training_review_cycles', 'SELECT')
  and has_table_privilege('service_role', 'public.training_review_cycles', 'SELECT,INSERT')
  and not has_table_privilege('service_role', 'public.training_review_cycles', 'UPDATE')
  and not has_table_privilege('service_role', 'public.training_review_cycles', 'DELETE'),
  'fail-closed grants and append-only service path'
);
select pg_temp.assert_true(
  (select bool_and(relrowsecurity) from pg_class
   where oid in (
     'public.training_review_protocols'::regclass,
     'public.training_review_dimensions'::regclass,
     'public.training_review_cycles'::regclass,
     'public.training_review_units'::regclass,
     'public.training_review_unit_sources'::regclass,
     'public.training_review_invalidations'::regclass
   )),
  'RLS enabled on every ledger table'
);
select pg_temp.assert_true(
  (select count(*) = 0 from pg_policies
   where schemaname='public' and tablename like 'training_review_%'),
  'no public ledger policy'
);

create temp table h3_11b_public_before as
select
  (select count(*) from public.location_equipment) as equipment_claims,
  (select count(*) from public.location_training_capabilities) as capability_claims,
  (select count(*) from public.published_training_discipline_summary) as published_rows,
  (select count(*) from public.search_training_locations('hyrox')) as search_rows;

insert into public.gym_brands (name, slug)
values ('H3-11B Validator Brand', 'h3-11b-validator-brand');
insert into public.gym_locations (brand_id, name, slug)
select id, 'H3-11B Validator Location', 'h3-11b-validator-location'
from public.gym_brands where slug='h3-11b-validator-brand';
insert into public.training_sources (
  location_id, url, source_kind, publisher_authority, availability_state, last_checked_at
)
select id, 'https://example.test/h3-11b-validator', 'facility_page',
  'facility_official', 'available', now()
from public.gym_locations where slug='h3-11b-validator-location';

create temp table h3_11b_ids (name text primary key, id uuid not null);
with inserted as (
  insert into public.training_review_cycles (
    location_id, discipline_id, protocol_id, cycle_key, reviewed_at, reviewer_authority
  )
  select location.id, discipline.id, protocol.id, 'cycle-1', now(), 'H3-11B_VALIDATOR'
  from public.gym_locations location
  cross join public.training_disciplines discipline
  join public.training_review_protocols protocol on protocol.discipline_id=discipline.id
  where location.slug='h3-11b-validator-location' and discipline.slug='hyrox'
  returning id
)
insert into h3_11b_ids select 'cycle-1', id from inserted;

create function pg_temp.add_unit(
  cycle_name text, dimension_slug text, aspect text,
  progress text, sufficiency text, outcome text
) returns uuid language plpgsql as $$
declare result uuid;
begin
  insert into public.training_review_units (
    review_cycle_id, discipline_id, review_dimension_id, review_aspect,
    review_progress, source_sufficiency, positive_outcome
  )
  select cycle.id, discipline.id, dimension.id, aspect, progress, sufficiency, outcome
  from h3_11b_ids cycle
  cross join public.training_disciplines discipline
  join public.training_review_dimensions dimension on dimension.discipline_id=discipline.id
  where cycle.name=cycle_name and discipline.slug='hyrox' and dimension.slug=dimension_slug
  returning id into result;
  return result;
end $$;

select pg_temp.assert_true(pg_temp.add_unit('cycle-1','facility-identity','FACILITY_IDENTITY','UNREVIEWED','UNKNOWN','NOT_ASSESSED') is not null, 'legal unreviewed state');
select pg_temp.assert_true(pg_temp.add_unit('cycle-1','ski-erg','EQUIPMENT_FACT','PARTIAL','UNKNOWN','POSITIVE_FOUND') is not null, 'legal partial positive state');
select pg_temp.assert_true(pg_temp.add_unit('cycle-1','row','EQUIPMENT_FACT','COMPLETE','SUFFICIENT','POSITIVE_FOUND') is not null, 'legal complete positive state');
select pg_temp.assert_true(pg_temp.add_unit('cycle-1','sled-push','SPACE_FACT','COMPLETE','SUFFICIENT','NO_POSITIVE_FOUND') is not null, 'legal complete no-positive state');
select pg_temp.assert_true(pg_temp.add_unit('cycle-1','wall-balls','EQUIPMENT_FACT','PARTIAL','INSUFFICIENT','NOT_ASSESSED') is not null, 'insufficient remains partial/not assessed');

select pg_temp.expect_sqlstate($$select pg_temp.add_unit('cycle-1','sled-pull','SPACE_FACT','COMPLETE','UNKNOWN','POSITIVE_FOUND')$$, '23514', 'COMPLETE UNKNOWN rejects');
select pg_temp.expect_sqlstate($$select pg_temp.add_unit('cycle-1','sled-pull','EQUIPMENT_FACT','COMPLETE','INSUFFICIENT','NOT_ASSESSED')$$, '23514', 'COMPLETE INSUFFICIENT rejects');
select pg_temp.expect_sqlstate($$select pg_temp.add_unit('cycle-1','sled-pull','USAGE_ACCESS_FACT','COMPLETE','BLOCKED','NOT_ASSESSED')$$, '23514', 'COMPLETE BLOCKED rejects');
select pg_temp.expect_sqlstate($$select pg_temp.add_unit('cycle-1','burpee-broad-jump','SPACE_FACT','PARTIAL','UNKNOWN','NO_POSITIVE_FOUND')$$, '23514', 'PARTIAL NO_POSITIVE_FOUND rejects');
select pg_temp.expect_sqlstate($$select pg_temp.add_unit('cycle-1','farmers-carry','SPACE_FACT','UNREVIEWED','UNKNOWN','NO_POSITIVE_FOUND')$$, '23514', 'UNREVIEWED NO_POSITIVE_FOUND rejects');
select pg_temp.expect_sqlstate($$select pg_temp.add_unit('cycle-1','sandbag-lunges','SPACE_FACT','UNREVIEWED','UNKNOWN','POSITIVE_FOUND')$$, '23514', 'UNREVIEWED POSITIVE_FOUND rejects');
select pg_temp.expect_sqlstate($$select pg_temp.add_unit('cycle-1','wall-balls','INVALID_ASPECT','PARTIAL','UNKNOWN','NOT_ASSESSED')$$, '23514', 'invalid aspect rejects');

with inserted as (
  insert into public.training_review_cycles (
    location_id, discipline_id, protocol_id, cycle_key, reviewed_at, reviewer_authority
  )
  select location.id, discipline.id, protocol.id, 'cycle-2', now(), 'H3-11B_VALIDATOR'
  from public.gym_locations location
  cross join public.training_disciplines discipline
  join public.training_review_protocols protocol on protocol.discipline_id=discipline.id
  where location.slug='h3-11b-validator-location' and discipline.slug='hyrox'
  returning id
)
insert into h3_11b_ids select 'cycle-2', id from inserted;
insert into h3_11b_ids values ('ski-unit', pg_temp.add_unit('cycle-2','ski-erg','EQUIPMENT_FACT','COMPLETE','SUFFICIENT','POSITIVE_FOUND'));
insert into public.training_review_units (
  review_cycle_id, discipline_id, review_dimension_id, review_aspect,
  review_progress, source_sufficiency, positive_outcome,
  freshness_policy_key_at_review, coverage_expires_at
)
select cycle.id, discipline.id, dimension.id, 'SPACE_FACT',
  'COMPLETE', 'SUFFICIENT', 'NO_POSITIVE_FOUND', 'physical-equipment-180-day', now()-interval '1 day'
from h3_11b_ids cycle
cross join public.training_disciplines discipline
join public.training_review_dimensions dimension on dimension.discipline_id=discipline.id
where cycle.name='cycle-2' and discipline.slug='hyrox' and dimension.slug='running-environment';
select pg_temp.assert_true(
  (select count(*)=1 from public.training_review_units where coverage_expires_at < now()
    and review_progress='COMPLETE' and positive_outcome='NO_POSITIVE_FOUND'),
  'expired review remains historical COMPLETE but is derivably expired'
);
select pg_temp.assert_true((select count(*)=2 from public.training_review_cycles), 'two historical cycles coexist');
select pg_temp.expect_sqlstate($$select pg_temp.add_unit('cycle-2','ski-erg','EQUIPMENT_FACT','COMPLETE','SUFFICIENT','POSITIVE_FOUND')$$, '23505', 'duplicate unit in one cycle rejects');

insert into public.training_review_cycles (
  location_id, discipline_id, protocol_id, cycle_key, cycle_kind, reviewed_at,
  reviewer_authority, supersedes_review_cycle_id, supersession_reason
)
select location.id, discipline.id, protocol.id, 'correction-1', 'ADMINISTRATIVE_CORRECTION',
  now(), 'H3-11B_VALIDATOR', old.id, 'administrative correction'
from public.gym_locations location
cross join public.training_disciplines discipline
join public.training_review_protocols protocol on protocol.discipline_id=discipline.id
cross join lateral (select id from h3_11b_ids where name='cycle-2') old
where location.slug='h3-11b-validator-location' and discipline.slug='hyrox';
select pg_temp.assert_true((select count(*)=3 from public.training_review_cycles), 'correction appends a linked cycle');

insert into public.training_review_unit_sources (
  review_unit_id, training_source_id, source_class, facility_binding, sufficiency_role,
  observed_at, reviewed_at, source_availability_state_at_review, binding_basis
)
select unit.id, source.id, 'FACILITY_SPECIFIC_OFFICIAL_PAGE', 'FACILITY_SPECIFIC',
  'PRIMARY', now()-interval '1 minute', now(), source.availability_state,
  'explicit location binding'
from h3_11b_ids unit cross join public.training_sources source
where unit.name='ski-unit' and source.url='https://example.test/h3-11b-validator';
select pg_temp.assert_true((select count(*)=1 from public.training_review_unit_sources), 'review source relation');

insert into public.training_review_invalidations (
  review_unit_id, discipline_id, invalidation_key, reason_code, invalidated_at,
  invalidation_authority, training_source_id, details
)
select unit.id, discipline.id, 'drift-1', 'MATERIAL_SOURCE_DRIFT', now(),
  'H3-11B_VALIDATOR', source.id, 'validator drift'
from h3_11b_ids unit
cross join public.training_disciplines discipline
cross join public.training_sources source
where unit.name='ski-unit' and discipline.slug='hyrox'
  and source.url='https://example.test/h3-11b-validator';
select pg_temp.assert_true(
  (select count(*)=1 from public.training_review_units unit join h3_11b_ids ids on ids.id=unit.id where ids.name='ski-unit'),
  'invalidation preserves historical unit'
);
select pg_temp.assert_true(
  not exists (select 1 from information_schema.columns where table_schema='public' and table_name='training_review_units' and column_name='is_current'),
  'no sole mutable is_current flag'
);
insert into public.training_review_protocols (
  discipline_id, protocol_key, protocol_version, authority_commit_sha,
  authority_document_path, authority_document_sha256,
  authority_matrix_path, authority_matrix_sha256
)
select discipline_id, protocol_key, 'h3-11a-v2-test', authority_commit_sha,
  authority_document_path, authority_document_sha256,
  authority_matrix_path, authority_matrix_sha256
from public.training_review_protocols where protocol_version='h3-11a-v1';
select pg_temp.assert_true(
  (select count(*)=2 from public.training_review_protocols),
  'new protocol version coexists without rewriting historical v1'
);

select pg_temp.assert_true(
  not exists (select 1 from pg_views where schemaname='public' and definition ilike '%training_review_%'),
  'public views do not consume ledger'
);
select pg_temp.assert_true(
  not exists (
    select 1 from pg_proc procedure join pg_namespace namespace on namespace.oid=procedure.pronamespace
    where namespace.nspname='public' and procedure.prokind='f'
      and pg_get_functiondef(procedure.oid) ilike '%training_review_%'
  ),
  'public functions do not consume ledger'
);
select pg_temp.assert_true(
  (select row(equipment_claims, capability_claims, published_rows, search_rows)
   from h3_11b_public_before)
  = row(
    (select count(*) from public.location_equipment),
    (select count(*) from public.location_training_capabilities),
    (select count(*) from public.published_training_discipline_summary),
    (select count(*) from public.search_training_locations('hyrox'))
  ),
  'ledger operations do not affect existing claims or publication/search output'
);

select 'H3-11B disposable validation PASS' as result;
rollback;
