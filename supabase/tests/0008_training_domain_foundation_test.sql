begin;

select plan(40);

select has_table('public', 'training_disciplines', 'training_disciplines exists');
select has_table('public', 'training_capability_types', 'training_capability_types exists');
select has_table('public', 'equipment_types', 'equipment_types exists');
select has_table(
  'public',
  'discipline_equipment_requirements',
  'discipline_equipment_requirements exists'
);
select has_table('public', 'training_sources', 'training_sources exists');

select results_eq(
  $$select count(*)::integer from public.training_disciplines where slug = 'hyrox'$$,
  $$values (1)$$,
  'HYROX discipline is seeded once'
);
select results_eq(
  $$select count(*)::integer from public.training_capability_types$$,
  $$values (5)$$,
  'foundation capability taxonomy is seeded'
);
select results_eq(
  $$select count(*)::integer from public.equipment_types$$,
  $$values (9)$$,
  'HYROX-compatible equipment taxonomy is seeded'
);
select results_eq(
  $$select count(*)::integer
    from public.discipline_equipment_requirements requirements
    join public.training_disciplines discipline on discipline.id = requirements.discipline_id
    where discipline.slug = 'hyrox'$$,
  $$values (9)$$,
  'HYROX equipment requirements are seeded'
);

select ok(
  (
    select count(*) = 15
    from information_schema.role_table_grants
    where grantee = 'service_role'
      and table_schema = 'public'
      and table_name in (
        'training_disciplines',
        'training_capability_types',
        'equipment_types',
        'discipline_equipment_requirements',
        'training_sources'
      )
      and privilege_type in ('INSERT', 'UPDATE', 'DELETE')
  ),
  'service_role retains the foundation write path'
);
select ok(
  not has_table_privilege('anon', 'public.training_disciplines', 'INSERT')
  and not has_table_privilege('anon', 'public.training_capability_types', 'INSERT')
  and not has_table_privilege('anon', 'public.equipment_types', 'INSERT')
  and not has_table_privilege('anon', 'public.discipline_equipment_requirements', 'INSERT')
  and not has_table_privilege('anon', 'public.training_sources', 'SELECT'),
  'anon has no foundation write privilege or private-source read privilege'
);
select ok(
  not has_table_privilege('authenticated', 'public.training_disciplines', 'INSERT')
  and not has_table_privilege('authenticated', 'public.training_capability_types', 'INSERT')
  and not has_table_privilege('authenticated', 'public.equipment_types', 'INSERT')
  and not has_table_privilege('authenticated', 'public.discipline_equipment_requirements', 'INSERT')
  and not has_table_privilege('authenticated', 'public.training_sources', 'SELECT'),
  'authenticated has no foundation write privilege or private-source read privilege'
);

select throws_ok(
  $$insert into public.training_disciplines (slug, name) values ('hyrox', 'Duplicate HYROX')$$,
  '23505'
);
select throws_ok(
  $$insert into public.training_disciplines (slug, name) values ('duplicate-hyrox-name', 'HYROX')$$,
  '23505'
);
select throws_ok(
  $$insert into public.training_disciplines (slug, name) values ('Invalid Slug', 'Invalid Slug')$$,
  '23514'
);
select throws_ok(
  $$insert into public.training_disciplines (slug, name, default_stale_after_days)
    values ('zero-stale-days', 'Zero Stale Days', 0)$$,
  '23514'
);
select throws_ok(
  $$insert into public.training_disciplines (slug, name, default_stale_after_days)
    values ('excessive-stale-days', 'Excessive Stale Days', 3651)$$,
  '23514'
);
select throws_ok(
  $$insert into public.training_capability_types (slug, name)
    values ('open-training', 'Duplicate Open Training')$$,
  '23505'
);
select throws_ok(
  $$insert into public.equipment_types (slug, name)
    values ('ski-erg', 'Duplicate SkiErg')$$,
  '23505'
);
select throws_ok(
  $$insert into public.discipline_equipment_requirements (
      discipline_id,
      equipment_type_id,
      requirement_level
    )
    select discipline.id, equipment.id, 'invalid'
    from public.training_disciplines discipline
    cross join public.equipment_types equipment
    where discipline.slug = 'hyrox' and equipment.slug = 'ski-erg'$$,
  '23514'
);
select throws_ok(
  $$insert into public.discipline_equipment_requirements (
      discipline_id,
      equipment_type_id,
      requirement_level,
      display_order
    )
    select discipline.id, equipment.id, 'optional', -1
    from public.training_disciplines discipline
    cross join public.equipment_types equipment
    where discipline.slug = 'hyrox' and equipment.slug = 'ski-erg'$$,
  '23514'
);
select throws_ok(
  $$insert into public.discipline_equipment_requirements (
      discipline_id,
      equipment_type_id,
      requirement_level
    )
    select discipline.id, equipment.id, 'core'
    from public.training_disciplines discipline
    cross join public.equipment_types equipment
    where discipline.slug = 'hyrox' and equipment.slug = 'ski-erg'$$,
  '23505'
);
select throws_ok(
  $$insert into public.training_sources (url, source_kind, publisher_authority)
    values ('', 'finder', 'governing_body')$$,
  '23514'
);
select throws_ok(
  $$insert into public.training_sources (url, source_kind, publisher_authority)
    values ('https://example.test/source', 'invalid', 'governing_body')$$,
  '23514'
);
select throws_ok(
  $$insert into public.training_sources (url, source_kind, publisher_authority)
    values ('https://example.test/source', 'finder', 'invalid')$$,
  '23514'
);
select throws_ok(
  $$insert into public.training_sources (
      url,
      source_kind,
      publisher_authority,
      availability_state
    ) values (
      'https://example.test/unavailable',
      'finder',
      'governing_body',
      'unavailable'
    )$$,
  '23514'
);
select throws_ok(
  $$insert into public.training_sources (
      url,
      source_kind,
      publisher_authority,
      availability_state,
      unavailable_since
    ) values (
      'https://example.test/available',
      'facility_page',
      'facility_official',
      'available',
      now()
    )$$,
  '23514'
);

insert into public.training_disciplines (slug, name, is_active)
values ('inactive-test-discipline', 'Inactive Test Discipline', false);

insert into public.equipment_types (slug, name, is_active)
values ('inactive-test-equipment', 'Inactive Test Equipment', false);

insert into public.training_sources (url, source_kind, publisher_authority)
values ('https://example.test/private-source', 'finder', 'governing_body');

set local role anon;

select results_eq(
  $$select count(*)::integer from public.training_disciplines where slug = 'hyrox'$$,
  $$values (1)$$,
  'anon can read an active discipline'
);
select results_eq(
  $$select count(*)::integer from public.training_disciplines where slug = 'inactive-test-discipline'$$,
  $$values (0)$$,
  'anon cannot read an inactive discipline'
);
select results_eq(
  $$select count(*)::integer from public.training_capability_types$$,
  $$values (5)$$,
  'anon can read active capability types'
);
select results_eq(
  $$select count(*)::integer from public.equipment_types where slug = 'inactive-test-equipment'$$,
  $$values (0)$$,
  'anon cannot read inactive equipment'
);
select results_eq(
  $$select count(*)::integer from public.equipment_types where slug = 'ski-erg'$$,
  $$values (1)$$,
  'anon can read active equipment'
);
select results_eq(
  $$select count(*)::integer from public.discipline_equipment_requirements$$,
  $$values (9)$$,
  'anon can read requirements for active taxonomy rows'
);
select throws_ok(
  $$select count(*) from public.training_sources$$,
  '42501'
);

reset role;
set local role authenticated;

select results_eq(
  $$select count(*)::integer from public.training_disciplines where slug = 'hyrox'$$,
  $$values (1)$$,
  'authenticated can read an active discipline'
);
select results_eq(
  $$select count(*)::integer from public.training_disciplines where slug = 'inactive-test-discipline'$$,
  $$values (0)$$,
  'authenticated cannot read an inactive discipline'
);
select results_eq(
  $$select count(*)::integer from public.training_capability_types$$,
  $$values (5)$$,
  'authenticated can read active capability types'
);
select results_eq(
  $$select count(*)::integer from public.equipment_types where slug = 'inactive-test-equipment'$$,
  $$values (0)$$,
  'authenticated cannot read inactive equipment'
);
select results_eq(
  $$select count(*)::integer from public.equipment_types where slug = 'ski-erg'$$,
  $$values (1)$$,
  'authenticated can read active equipment'
);
select throws_ok(
  $$select count(*) from public.training_sources$$,
  '42501'
);

reset role;

select * from finish();
rollback;
