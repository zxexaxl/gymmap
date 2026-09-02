\set ON_ERROR_STOP on

begin;

create function pg_temp.assert_true(condition boolean, message text)
returns void language plpgsql as $$
begin
  if condition is not true then
    raise exception 'H3-11D-R1 persistence validation failed: %', message;
  end if;
end $$;

create function pg_temp.expect_sqlstate(statement text, expected_state text, message text)
returns void language plpgsql as $$
begin
  begin
    execute statement;
  exception when others then
    if sqlstate = expected_state then return; end if;
    raise exception 'H3-11D-R1 persistence validation failed: % (expected %, received %: %)',
      message, expected_state, sqlstate, sqlerrm;
  end;
  raise exception 'H3-11D-R1 persistence validation failed: % (statement unexpectedly succeeded)', message;
end $$;

select pg_temp.assert_true(
  (select count(*)=13 from public.training_raw_fact_types),
  'exact fact taxonomy seed'
);
select pg_temp.assert_true(
  (select jsonb_object_agg(table_name, column_count) =
    '{"training_access_restrictions":22,"training_raw_fact_dimensions":10,"training_raw_fact_types":6,"training_raw_facts":22}'::jsonb
   from (
     select table_name, count(*)::integer column_count
     from information_schema.columns
     where table_schema='public' and table_name in (
       'training_raw_fact_types','training_raw_facts',
       'training_raw_fact_dimensions','training_access_restrictions'
     )
     group by table_name
   ) counts),
  'catalog column counts match committed schema types'
);
select pg_temp.assert_true(
  (select count(*)=10
   from information_schema.table_constraints
   where constraint_schema='public'
     and constraint_type='FOREIGN KEY'
     and table_name in (
       'training_raw_fact_types','training_raw_facts',
       'training_raw_fact_dimensions','training_access_restrictions'
     )),
  'catalog contains the exact ten provenance/scope foreign keys'
);
select pg_temp.assert_true(
  (select count(*)=0 from information_schema.columns
   where table_schema='public'
     and table_name in (
       'training_raw_fact_types','training_raw_facts',
       'training_raw_fact_dimensions','training_access_restrictions'
     )
     and is_nullable='YES'
     and column_name not in (
       'evidence_location_context','source_content_hash_at_review',
       'freshness_policy_key','freshness_expires_at'
     )),
  'only the four documented freshness/context fields are nullable'
);
select pg_temp.assert_true(
  (select count(*)=7 from information_schema.columns
   where table_schema='public'
     and table_name in (
       'training_raw_fact_types','training_raw_facts',
       'training_raw_fact_dimensions','training_access_restrictions'
     )
     and column_default is not null),
  'catalog defaults match Insert optionality for generated IDs/timestamps only'
);
select pg_temp.assert_true(
  (select count(*)=0 from public.training_raw_facts)
  and (select count(*)=0 from public.training_raw_fact_dimensions)
  and (select count(*)=0 from public.training_access_restrictions),
  'clean migration contains no Cohort 1 data'
);

create temp table r1_public_before as
select
  (select count(*) from public.location_equipment) as equipment_claims,
  (select count(*) from public.location_training_capabilities) as capability_claims,
  (select count(*) from public.training_evidence) as evidence_rows,
  (select count(*) from public.search_training_locations('hyrox')) as search_rows;

insert into public.gym_brands (name, slug)
values ('H3-11D-R1 Validator Brand', 'h3-11d-r1-validator-brand');
insert into public.gym_locations (brand_id, name, slug)
select id, 'H3-11D-R1 Validator Location', 'h3-11d-r1-validator-location'
from public.gym_brands where slug='h3-11d-r1-validator-brand';
insert into public.gym_locations (brand_id, name, slug)
select id, 'H3-11D-R1 Other Location', 'h3-11d-r1-validator-other'
from public.gym_brands where slug='h3-11d-r1-validator-brand';
insert into public.training_sources (
  location_id, url, source_kind, publisher_authority,
  availability_state, last_checked_at, content_hash
)
select id, 'https://example.test/h3-11d-r1-validator', 'facility_page',
  'facility_official', 'available', now(), repeat('b',64)
from public.gym_locations where slug='h3-11d-r1-validator-location';

create temp table r1_ids (name text primary key, id uuid not null);
with inserted as (
  insert into public.training_review_cycles (
    location_id, discipline_id, protocol_id, cycle_key,
    reviewed_at, reviewer_authority
  )
  select location.id, discipline.id, protocol.id, 'r1-validator-cycle',
    now(), 'H3-11D_R1_VALIDATOR'
  from public.gym_locations location
  cross join public.training_disciplines discipline
  join public.training_review_protocols protocol on protocol.discipline_id=discipline.id
  where location.slug='h3-11d-r1-validator-location' and discipline.slug='hyrox'
    and protocol.protocol_version='h3-11a-v1'
  returning id
)
insert into r1_ids select 'cycle', id from inserted;

create function pg_temp.add_unit(name text, dimension_slug text, aspect text)
returns uuid language plpgsql as $$
declare result uuid;
begin
  insert into public.training_review_units (
    review_cycle_id, discipline_id, review_dimension_id, review_aspect,
    review_progress, source_sufficiency, positive_outcome
  )
  select cycle.id, discipline.id, dimension.id, aspect,
    'COMPLETE', 'SUFFICIENT', 'POSITIVE_FOUND'
  from r1_ids cycle
  cross join public.training_disciplines discipline
  join public.training_review_dimensions dimension on dimension.discipline_id=discipline.id
  where cycle.name='cycle' and discipline.slug='hyrox'
    and dimension.slug=dimension_slug
  returning id into result;

  insert into public.training_review_unit_sources (
    review_unit_id, training_source_id, source_class, facility_binding,
    sufficiency_role, observed_at, reviewed_at,
    source_availability_state_at_review, source_content_hash_at_review,
    binding_basis
  )
  select result, source.id, 'FACILITY_SPECIFIC_OFFICIAL_PAGE',
    'FACILITY_SPECIFIC', 'PRIMARY', now()-interval '1 minute', now(),
    'available', source.content_hash, 'validator facility binding'
  from public.training_sources source
  where source.url='https://example.test/h3-11d-r1-validator';

  insert into r1_ids values (name, result);
  return result;
end $$;

select pg_temp.add_unit('sled-equipment','sled-pull','EQUIPMENT_FACT');
select pg_temp.add_unit('wall-equipment','wall-balls','EQUIPMENT_FACT');
select pg_temp.add_unit('carry-space','farmers-carry','SPACE_FACT');
select pg_temp.add_unit('lunge-space','sandbag-lunges','SPACE_FACT');
select pg_temp.add_unit('bbj-space','burpee-broad-jump','SPACE_FACT');
select pg_temp.add_unit('running-space','running-environment','SPACE_FACT');
select pg_temp.add_unit('program-use','ski-erg','USAGE_ACCESS_FACT');

create function pg_temp.add_fact(
  fact_key text, type_slug text, unit_name text, statement text
) returns uuid language plpgsql as $$
declare result uuid;
begin
  insert into public.training_raw_facts (
    location_id, discipline_id, review_cycle_id, review_unit_id,
    review_unit_source_id, training_source_id, source_class,
    fact_type_id, review_aspect, fact_key, statement, evidence_text,
    evidence_location_context, directness, observed_at, reviewed_at,
    reviewer_authority, source_content_hash_at_review
  )
  select location.id, discipline.id, cycle.id, unit.id,
    unit_source.id, source.id, unit_source.source_class,
    fact_type.id, unit.review_aspect, fact_key, statement, statement,
    'validator evidence context', 'DIRECT_TEXT', unit_source.observed_at,
    unit_source.reviewed_at, 'H3-11D_R1_VALIDATOR',
    unit_source.source_content_hash_at_review
  from public.gym_locations location
  cross join public.training_disciplines discipline
  cross join r1_ids cycle
  cross join r1_ids named_unit
  join public.training_review_units unit on unit.id=named_unit.id
  join public.training_review_unit_sources unit_source on unit_source.review_unit_id=unit.id
  join public.training_sources source on source.id=unit_source.training_source_id
  join public.training_raw_fact_types fact_type on fact_type.slug=type_slug
  where location.slug='h3-11d-r1-validator-location'
    and discipline.slug='hyrox' and cycle.name='cycle'
    and named_unit.name=unit_name
  returning id into result;
  return result;
end $$;

select pg_temp.add_fact('sled-rope','sled-pull-rope','sled-equipment','Sled-pull rope is listed.');
select pg_temp.add_fact('wall-ball','wall-ball','wall-equipment','Wall ball is listed.');
select pg_temp.add_fact('carry-space','farmers-carry-space','carry-space','Carry space is stated.');
select pg_temp.add_fact('lunge-space','sandbag-lunges-space','lunge-space','Lunge space is stated.');
select pg_temp.add_fact('bbj-space','burpee-broad-jump-space','bbj-space','BBJ space is stated.');
select pg_temp.add_fact('program-use','program-use-confirmed','program-use','Program use is offered.');
select pg_temp.add_fact('appointment-use','appointment-use-confirmed','program-use','Appointment use is offered.');
select pg_temp.add_fact('rental-use','rental-use-confirmed','program-use','Rental use is offered.');
select pg_temp.add_fact('no-freshness','running-movement-space','running-space','Running movement space is stated.');

select pg_temp.assert_true(
  (select count(*)=9 from public.training_raw_facts),
  'A-G and J raw examples are stored without derived station state'
);
select pg_temp.assert_true(
  (select freshness_policy_key is null and freshness_expires_at is null
   from public.training_raw_facts where fact_key='no-freshness'),
  'J missing freshness authority remains fail-closed'
);

insert into public.training_raw_fact_dimensions (
  raw_fact_id, review_cycle_id, discipline_id, review_aspect,
  review_dimension_id, review_unit_id, review_unit_source_id,
  training_source_id, source_class
)
select fact.id, fact.review_cycle_id, fact.discipline_id, fact.review_aspect,
  unit.review_dimension_id, unit.id, unit_source.id,
  unit_source.training_source_id, unit_source.source_class
from public.training_raw_facts fact
join r1_ids named_unit on named_unit.name='carry-space'
join public.training_review_units unit on unit.id=named_unit.id
join public.training_review_unit_sources unit_source on unit_source.review_unit_id=unit.id
where fact.fact_key='carry-space';
select pg_temp.assert_true(
  (select count(*)=1 from public.training_raw_fact_dimensions),
  'dimension linkage retains exact unit scope'
);

create function pg_temp.add_restriction(restriction_key text, restriction_type text)
returns uuid language plpgsql as $$
declare result uuid;
begin
  insert into public.training_access_restrictions (
    location_id, discipline_id, review_cycle_id, review_unit_id,
    review_unit_source_id, training_source_id, source_class, review_aspect,
    restriction_key, restriction_type, statement, evidence_text,
    directness, observed_at, reviewed_at, reviewer_authority,
    source_content_hash_at_review
  )
  select location.id, discipline.id, cycle.id, unit.id,
    unit_source.id, source.id, unit_source.source_class, unit.review_aspect,
    restriction_key, restriction_type, 'Explicit official restriction.',
    'Explicit official restriction.', 'DIRECT_TEXT', unit_source.observed_at,
    unit_source.reviewed_at, 'H3-11D_R1_VALIDATOR',
    unit_source.source_content_hash_at_review
  from public.gym_locations location
  cross join public.training_disciplines discipline
  cross join r1_ids cycle
  cross join r1_ids named_unit
  join public.training_review_units unit on unit.id=named_unit.id
  join public.training_review_unit_sources unit_source on unit_source.review_unit_id=unit.id
  join public.training_sources source on source.id=unit_source.training_source_id
  where location.slug='h3-11d-r1-validator-location'
    and discipline.slug='hyrox' and cycle.name='cycle'
    and named_unit.name='program-use'
  returning id into result;
  return result;
end $$;

select pg_temp.add_restriction('reservation','RESERVATION_REQUIRED');
select pg_temp.add_restriction('program-hours','PROGRAM_HOUR_EXCLUSION');
select pg_temp.assert_true(
  (select count(*)=2 from public.training_access_restrictions),
  'H-I restrictions are stored separately from positive facts'
);

select pg_temp.expect_sqlstate($sql$
  insert into public.training_raw_facts (
    location_id, discipline_id, review_cycle_id, review_unit_id,
    review_unit_source_id, training_source_id, source_class, fact_type_id,
    review_aspect, fact_key, statement, evidence_text, directness,
    observed_at, reviewed_at, reviewer_authority
  )
  select fact.location_id, fact.discipline_id, fact.review_cycle_id,
    fact.review_unit_id, fact.review_unit_source_id, fact.training_source_id,
    fact.source_class, gen_random_uuid(), fact.review_aspect,
    'station-capability-supported', 'Not a raw type.', 'Not a raw type.',
    fact.directness, fact.observed_at, fact.reviewed_at, fact.reviewer_authority
  from public.training_raw_facts fact where fact.fact_key='program-use'
$sql$, '23503', 'unsupported/derived fact type');

select pg_temp.expect_sqlstate($sql$
  insert into public.training_raw_facts (
    location_id, discipline_id, review_cycle_id, review_unit_id,
    review_unit_source_id, training_source_id, source_class, fact_type_id,
    review_aspect, fact_key, statement, evidence_text, directness,
    observed_at, reviewed_at, reviewer_authority
  )
  select other.id, fact.discipline_id, fact.review_cycle_id,
    fact.review_unit_id, fact.review_unit_source_id, fact.training_source_id,
    fact.source_class, fact.fact_type_id, fact.review_aspect,
    'cross-facility', 'Positive fact.', 'Positive fact.', fact.directness,
    fact.observed_at, fact.reviewed_at, fact.reviewer_authority
  from public.training_raw_facts fact
  cross join public.gym_locations other
  where fact.fact_key='sled-rope' and other.slug='h3-11d-r1-validator-other'
$sql$, '23503', 'cross-facility linkage');

select pg_temp.expect_sqlstate($sql$
  insert into public.training_raw_fact_dimensions (
    raw_fact_id, review_cycle_id, discipline_id, review_aspect,
    review_dimension_id, review_unit_id, review_unit_source_id,
    training_source_id, source_class
  )
  select fact.id, fact.review_cycle_id, fact.discipline_id, fact.review_aspect,
    gen_random_uuid(), fact.review_unit_id, fact.review_unit_source_id,
    fact.training_source_id, fact.source_class
  from public.training_raw_facts fact where fact.fact_key='sled-rope'
$sql$, '23503', 'invalid dimension');

select pg_temp.expect_sqlstate($sql$
  insert into public.training_access_restrictions (
    location_id, discipline_id, review_cycle_id, review_unit_id,
    review_unit_source_id, training_source_id, source_class, review_aspect,
    restriction_key, restriction_type, statement, evidence_text,
    directness, observed_at, reviewed_at, reviewer_authority
  )
  select fact.location_id, fact.discipline_id, fact.review_cycle_id,
    fact.review_unit_id, gen_random_uuid(), fact.training_source_id,
    fact.source_class, 'USAGE_ACCESS_FACT', 'bad-source',
    'RESERVATION_REQUIRED', 'Restriction.', 'Restriction.', 'DIRECT_TEXT',
    fact.observed_at, fact.reviewed_at, fact.reviewer_authority
  from public.training_raw_facts fact where fact.fact_key='program-use'
$sql$, '23503', 'invalid reviewed source relation');

select pg_temp.expect_sqlstate($sql$
  insert into public.training_access_restrictions (
    location_id, discipline_id, review_cycle_id, review_unit_id,
    review_unit_source_id, training_source_id, source_class, review_aspect,
    restriction_key, restriction_type, statement, evidence_text,
    directness, observed_at, reviewed_at, reviewer_authority
  )
  select fact.location_id, fact.discipline_id, fact.review_cycle_id,
    fact.review_unit_id, fact.review_unit_source_id, fact.training_source_id,
    fact.source_class, 'USAGE_ACCESS_FACT', 'unavailable', 'UNAVAILABLE',
    'Negative state.', 'Negative state.', 'DIRECT_TEXT', fact.observed_at,
    fact.reviewed_at, fact.reviewer_authority
  from public.training_raw_facts fact where fact.fact_key='program-use'
$sql$, '23514', 'unapproved negative restriction type');

select pg_temp.assert_true(
  not exists (
    select 1 from pg_views where schemaname='public'
      and definition ~* 'training_(raw_fact|access_restriction)'
  ),
  'no public view exposure'
);
select pg_temp.assert_true(
  not exists (
    select 1 from pg_proc procedure
    join pg_namespace namespace on namespace.oid=procedure.pronamespace
    where namespace.nspname='public' and procedure.prokind='f'
      and pg_get_functiondef(procedure.oid) ~* 'training_(raw_fact|access_restriction)'
  ),
  'no public RPC/function exposure'
);
select pg_temp.assert_true(
  (select row(equipment_claims, capability_claims, evidence_rows, search_rows)
   from r1_public_before)
  = row(
    (select count(*) from public.location_equipment),
    (select count(*) from public.location_training_capabilities),
    (select count(*) from public.training_evidence),
    (select count(*) from public.search_training_locations('hyrox'))
  ),
  'existing claims, evidence, and publication/search remain invariant'
);

select 'H3-11D-R1 disposable persistence validation PASS' as result;
rollback;
