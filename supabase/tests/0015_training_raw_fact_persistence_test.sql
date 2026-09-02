begin;

select no_plan();

select has_table('public', 'training_raw_fact_types', 'raw fact taxonomy exists');
select has_table('public', 'training_raw_facts', 'positive raw facts exist');
select has_table('public', 'training_raw_fact_dimensions', 'raw fact dimension linkage exists');
select has_table('public', 'training_access_restrictions', 'explicit restrictions are separate');

select results_eq(
  $$select count(*)::integer from public.training_raw_fact_types$$,
  $$values (13)$$,
  'minimal authority-backed raw fact taxonomy is seeded'
);
select results_eq(
  $$select count(*)::integer from public.training_raw_facts$$,
  $$values (0)$$,
  'migration imports no Cohort 1 raw facts'
);
select results_eq(
  $$select count(*)::integer from public.training_raw_fact_dimensions$$,
  $$values (0)$$,
  'migration imports no fact dimensions'
);
select results_eq(
  $$select count(*)::integer from public.training_access_restrictions$$,
  $$values (0)$$,
  'migration imports no restrictions'
);

select ok(
  has_table_privilege('service_role', 'public.training_raw_fact_types', 'SELECT')
  and not has_table_privilege('service_role', 'public.training_raw_fact_types', 'INSERT')
  and has_table_privilege('service_role', 'public.training_raw_facts', 'SELECT,INSERT')
  and has_table_privilege('service_role', 'public.training_raw_fact_dimensions', 'SELECT,INSERT')
  and has_table_privilege('service_role', 'public.training_access_restrictions', 'SELECT,INSERT'),
  'service_role has exact metadata-read/history-append entry points'
);
select ok(
  not has_table_privilege('service_role', 'public.training_raw_facts', 'UPDATE')
  and not has_table_privilege('service_role', 'public.training_raw_facts', 'DELETE')
  and not has_table_privilege('service_role', 'public.training_raw_facts', 'TRUNCATE')
  and not has_table_privilege('service_role', 'public.training_raw_facts', 'REFERENCES')
  and not has_table_privilege('service_role', 'public.training_raw_facts', 'TRIGGER')
  and not has_table_privilege('service_role', 'public.training_raw_facts', 'MAINTAIN'),
  'service_role cannot rewrite or maintain positive raw fact history'
);
select ok(
  not has_table_privilege('anon', 'public.training_raw_facts', 'SELECT')
  and not has_table_privilege('authenticated', 'public.training_raw_facts', 'SELECT')
  and not has_table_privilege('anon', 'public.training_access_restrictions', 'INSERT')
  and not has_table_privilege('authenticated', 'public.training_access_restrictions', 'INSERT'),
  'anon and authenticated have no raw or restriction access'
);
select results_eq(
  $$select count(*)::integer from pg_policies where schemaname='public'
    and tablename in (
      'training_raw_fact_types', 'training_raw_facts',
      'training_raw_fact_dimensions', 'training_access_restrictions'
    )$$,
  $$values (0)$$,
  'no permissive RLS policy exists'
);
select results_eq(
  $$select count(*)::integer from pg_class c join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public' and c.relname in (
      'training_raw_fact_types', 'training_raw_facts',
      'training_raw_fact_dimensions', 'training_access_restrictions'
    ) and c.relrowsecurity$$,
  $$values (4)$$,
  'RLS is enabled on every new internal table'
);

create temp table h3_11d_r1_public_before as
select
  (select count(*) from public.location_equipment) as equipment_claims,
  (select count(*) from public.location_training_capabilities) as capability_claims,
  (select count(*) from public.training_evidence) as evidence_rows,
  (select count(*) from public.search_training_locations('hyrox')) as search_rows;

insert into public.gym_brands (name, slug)
values ('H3-11D-R1 Test Brand', 'h3-11d-r1-test-brand');
insert into public.gym_locations (brand_id, name, slug)
select id, 'H3-11D-R1 Test Location', 'h3-11d-r1-test-location'
from public.gym_brands where slug='h3-11d-r1-test-brand';
insert into public.gym_locations (brand_id, name, slug)
select id, 'H3-11D-R1 Other Location', 'h3-11d-r1-other-location'
from public.gym_brands where slug='h3-11d-r1-test-brand';
insert into public.training_sources (
  location_id, url, source_kind, publisher_authority, availability_state,
  last_checked_at, content_hash
)
select id, 'https://example.test/h3-11d-r1', 'facility_page',
  'facility_official', 'available', now(), repeat('a', 64)
from public.gym_locations where slug='h3-11d-r1-test-location';

create temp table h3_11d_r1_ids (name text primary key, id uuid not null);
with inserted as (
  insert into public.training_review_cycles (
    location_id, discipline_id, protocol_id, cycle_key, reviewed_at, reviewer_authority
  )
  select location.id, discipline.id, protocol.id, 'r1-cycle', now(), 'H3-11D_R1_TEST'
  from public.gym_locations location
  cross join public.training_disciplines discipline
  join public.training_review_protocols protocol on protocol.discipline_id=discipline.id
  where location.slug='h3-11d-r1-test-location' and discipline.slug='hyrox'
    and protocol.protocol_version='h3-11a-v1'
  returning id
)
insert into h3_11d_r1_ids select 'cycle', id from inserted;

create function pg_temp.add_r1_unit(p_name text, p_dimension text, p_aspect text)
returns uuid language plpgsql as $$
declare result uuid;
begin
  insert into public.training_review_units (
    review_cycle_id, discipline_id, review_dimension_id, review_aspect,
    review_progress, source_sufficiency, positive_outcome
  )
  select cycle.id, discipline.id, dimension.id, p_aspect,
    'COMPLETE', 'SUFFICIENT', 'POSITIVE_FOUND'
  from h3_11d_r1_ids cycle
  cross join public.training_disciplines discipline
  join public.training_review_dimensions dimension on dimension.discipline_id=discipline.id
  where cycle.name='cycle' and discipline.slug='hyrox' and dimension.slug=p_dimension
  returning id into result;

  insert into public.training_review_unit_sources (
    review_unit_id, training_source_id, source_class, facility_binding,
    sufficiency_role, observed_at, reviewed_at,
    source_availability_state_at_review, source_content_hash_at_review,
    binding_basis
  )
  select result, source.id, 'FACILITY_SPECIFIC_OFFICIAL_PAGE',
    'FACILITY_SPECIFIC', 'PRIMARY', now()-interval '1 minute', now(),
    'available', source.content_hash, 'fixture facility binding'
  from public.training_sources source
  where source.url='https://example.test/h3-11d-r1';

  insert into h3_11d_r1_ids values (p_name, result);
  return result;
end $$;

select pg_temp.add_r1_unit('sled-equipment', 'sled-pull', 'EQUIPMENT_FACT');
select pg_temp.add_r1_unit('wall-equipment', 'wall-balls', 'EQUIPMENT_FACT');
select pg_temp.add_r1_unit('carry-space', 'farmers-carry', 'SPACE_FACT');
select pg_temp.add_r1_unit('lunge-space', 'sandbag-lunges', 'SPACE_FACT');
select pg_temp.add_r1_unit('bbj-space', 'burpee-broad-jump', 'SPACE_FACT');
select pg_temp.add_r1_unit('running-space', 'running-environment', 'SPACE_FACT');
select pg_temp.add_r1_unit('program-use', 'ski-erg', 'USAGE_ACCESS_FACT');

create function pg_temp.add_raw_fact(
  p_key text, p_type text, p_unit text, p_statement text,
  p_freshness_policy text default null
) returns uuid language plpgsql as $$
declare result uuid;
begin
  insert into public.training_raw_facts (
    location_id, discipline_id, review_cycle_id, review_unit_id,
    review_unit_source_id, training_source_id, source_class,
    fact_type_id, review_aspect, fact_key, statement, evidence_text,
    evidence_location_context, directness, observed_at, reviewed_at,
    reviewer_authority, source_content_hash_at_review, freshness_policy_key
  )
  select location.id, discipline.id, cycle.id, unit.id,
    unit_source.id, source.id, unit_source.source_class,
    fact_type.id, unit.review_aspect, p_key, p_statement, p_statement,
    'fixture excerpt', 'DIRECT_TEXT', unit_source.observed_at,
    unit_source.reviewed_at, 'H3-11D_R1_TEST',
    unit_source.source_content_hash_at_review, p_freshness_policy
  from public.gym_locations location
  cross join public.training_disciplines discipline
  cross join h3_11d_r1_ids cycle
  cross join h3_11d_r1_ids named_unit
  join public.training_review_units unit on unit.id=named_unit.id
  join public.training_review_unit_sources unit_source on unit_source.review_unit_id=unit.id
  join public.training_sources source on source.id=unit_source.training_source_id
  join public.training_raw_fact_types fact_type on fact_type.slug=p_type
  where location.slug='h3-11d-r1-test-location' and discipline.slug='hyrox'
    and cycle.name='cycle' and named_unit.name=p_unit
  returning id into result;
  return result;
end $$;

select lives_ok(
  $$select pg_temp.add_raw_fact('sled-rope','sled-pull-rope','sled-equipment','Sled-pull rope is listed.')$$,
  'A sled-pull rope remains a raw component fact'
);
select lives_ok(
  $$select pg_temp.add_raw_fact('wall-ball','wall-ball','wall-equipment','Wall ball is listed.')$$,
  'B wall ball remains separate from target and feasibility'
);
select lives_ok(
  $$select pg_temp.add_raw_fact('carry-space','farmers-carry-space','carry-space','Carry space is stated.')$$,
  'C carry space is persistable'
);
select lives_ok(
  $$select pg_temp.add_raw_fact('lunge-space','sandbag-lunges-space','lunge-space','Lunge space is stated.')$$,
  'D lunge movement space is persistable'
);
select lives_ok(
  $$select pg_temp.add_raw_fact('bbj-space','burpee-broad-jump-space','bbj-space','BBJ space is stated.')$$,
  'E BBJ-associated space is persistable'
);
select lives_ok(
  $$select pg_temp.add_raw_fact('program-use','program-use-confirmed','program-use','Program use is offered.')$$,
  'F station-scoped program use is non-exclusive positive evidence'
);
select lives_ok(
  $$select pg_temp.add_raw_fact('appointment-use','appointment-use-confirmed','program-use','Appointment use is offered.')$$,
  'G appointment use is persistable without open-use inference'
);
select lives_ok(
  $$select pg_temp.add_raw_fact('rental-use','rental-use-confirmed','program-use','Rental use is offered.')$$,
  'G rental use is persistable without open-use inference'
);
select lives_ok(
  $$select pg_temp.add_raw_fact('no-freshness','running-movement-space','running-space','Running movement space is stated.',null)$$,
  'J raw fact without accepted freshness policy is stored fail-closed'
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
join h3_11d_r1_ids named_unit on named_unit.name='carry-space'
join public.training_review_units unit on unit.id=named_unit.id
join public.training_review_unit_sources unit_source on unit_source.review_unit_id=unit.id
where fact.fact_key='carry-space';
select results_eq(
  $$select count(*)::integer from public.training_raw_fact_dimensions$$,
  $$values (1)$$,
  'dimension linkage uses the matching cycle, discipline, aspect, and unit'
);

create function pg_temp.add_restriction(p_key text, p_type text)
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
    p_key, p_type, 'Explicit official restriction.',
    'Explicit official restriction.', 'DIRECT_TEXT',
    unit_source.observed_at, unit_source.reviewed_at, 'H3-11D_R1_TEST',
    unit_source.source_content_hash_at_review
  from public.gym_locations location
  cross join public.training_disciplines discipline
  cross join h3_11d_r1_ids cycle
  cross join h3_11d_r1_ids named_unit
  join public.training_review_units unit on unit.id=named_unit.id
  join public.training_review_unit_sources unit_source on unit_source.review_unit_id=unit.id
  join public.training_sources source on source.id=unit_source.training_source_id
  where location.slug='h3-11d-r1-test-location' and discipline.slug='hyrox'
    and cycle.name='cycle' and named_unit.name='program-use'
  returning id into result;
  return result;
end $$;

select lives_ok(
  $$select pg_temp.add_restriction('reservation','RESERVATION_REQUIRED')$$,
  'H reservation-only evidence is stored outside positive usage facts'
);
select lives_ok(
  $$select pg_temp.add_restriction('program-hours','PROGRAM_HOUR_EXCLUSION')$$,
  'I program-hour exclusion is stored as internal restriction evidence'
);

select throws_ok($$
  insert into public.training_raw_facts (
    location_id, discipline_id, review_cycle_id, review_unit_id,
    review_unit_source_id, training_source_id, source_class, fact_type_id,
    review_aspect, fact_key, statement, evidence_text, directness,
    observed_at, reviewed_at, reviewer_authority
  )
  select fact.location_id, fact.discipline_id, fact.review_cycle_id,
    fact.review_unit_id, fact.review_unit_source_id, fact.training_source_id,
    fact.source_class, gen_random_uuid(), fact.review_aspect,
    'station-capability-supported', 'Not a raw fact.', 'Not a raw fact.',
    fact.directness, fact.observed_at, fact.reviewed_at, fact.reviewer_authority
  from public.training_raw_facts fact where fact.fact_key='program-use'
$$, '23503', null, 'derived/unsupported fact type fails closed');
select throws_ok($$
  insert into public.training_raw_facts (
    location_id, discipline_id, review_cycle_id, review_unit_id,
    review_unit_source_id, training_source_id, source_class, fact_type_id,
    review_aspect, fact_key, statement, evidence_text, directness,
    observed_at, reviewed_at, reviewer_authority
  )
  select other.id, fact.discipline_id, fact.review_cycle_id, fact.review_unit_id,
    fact.review_unit_source_id, fact.training_source_id, fact.source_class,
    fact.fact_type_id, fact.review_aspect, 'cross-facility', 'Positive fact.',
    'Positive fact.', fact.directness, fact.observed_at, fact.reviewed_at,
    fact.reviewer_authority
  from public.training_raw_facts fact
  cross join public.gym_locations other
  where fact.fact_key='sled-rope' and other.slug='h3-11d-r1-other-location'
$$, '23503', null, 'cross-facility fact linkage is rejected');
select throws_ok($$
  insert into public.training_raw_fact_dimensions (
    raw_fact_id, review_cycle_id, discipline_id, review_aspect,
    review_dimension_id, review_unit_id, review_unit_source_id,
    training_source_id, source_class
  )
  select fact.id, fact.review_cycle_id, fact.discipline_id, fact.review_aspect,
    gen_random_uuid(), fact.review_unit_id, fact.review_unit_source_id,
    fact.training_source_id, fact.source_class
  from public.training_raw_facts fact where fact.fact_key='sled-rope'
$$, '23503', null, 'invalid/cross-discipline dimension fails closed');
select throws_ok($$
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
$$, '23503', null, 'invalid reviewed-source relation fails closed');
select throws_ok(
  $$select pg_temp.add_restriction('bad-type','UNAVAILABLE')$$,
  '23514', null, 'negative/unapproved restriction type fails closed'
);

select ok(
  not exists (
    select 1 from pg_views
    where schemaname='public'
      and definition ~* 'training_(raw_fact|access_restriction)'
  ),
  'public views do not consume raw facts or restrictions'
);
select ok(
  not exists (
    select 1 from pg_proc procedure
    join pg_namespace namespace on namespace.oid=procedure.pronamespace
    where namespace.nspname='public' and procedure.prokind='f'
      and pg_get_functiondef(procedure.oid) ~* 'training_(raw_fact|access_restriction)'
  ),
  'public functions/RPCs do not consume raw facts or restrictions'
);
select ok(
  (select row(equipment_claims, capability_claims, evidence_rows, search_rows)
   from h3_11d_r1_public_before)
  = row(
    (select count(*) from public.location_equipment),
    (select count(*) from public.location_training_capabilities),
    (select count(*) from public.training_evidence),
    (select count(*) from public.search_training_locations('hyrox'))
  ),
  'raw persistence examples do not alter existing claims/evidence/public search'
);

select finish();
rollback;
