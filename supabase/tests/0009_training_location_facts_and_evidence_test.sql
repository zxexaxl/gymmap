begin;

select no_plan();

select has_table('public', 'location_training_disciplines', 'location_training_disciplines exists');
select has_table('public', 'location_training_capabilities', 'location_training_capabilities exists');
select has_table('public', 'location_equipment', 'location_equipment exists');
select has_table('public', 'training_affiliations', 'training_affiliations exists');
select has_table('public', 'program_training_disciplines', 'program_training_disciplines exists');
select has_table('public', 'location_external_identifiers', 'location_external_identifiers exists');
select has_table('public', 'training_evidence', 'training_evidence exists');

select results_eq(
  $$select count(*)::integer from public.training_disciplines where slug = 'hyrox'$$,
  $$values (1)$$,
  'H1-1 HYROX discipline seed is preserved'
);
select results_eq(
  $$select count(*)::integer from public.training_capability_types$$,
  $$values (5)$$,
  'H1-1 capability taxonomy is preserved'
);
select results_eq(
  $$select count(*)::integer from public.equipment_types$$,
  $$values (9)$$,
  'H1-1 equipment taxonomy is preserved'
);

insert into public.gym_brands (name, slug)
values ('H1-2 Test Brand', 'h1-2-test-brand');

insert into public.gym_locations (brand_id, name, slug)
select id, 'H1-2 Test Location', 'h1-2-test-location'
from public.gym_brands
where slug = 'h1-2-test-brand';

insert into public.gym_locations (brand_id, name, slug)
select id, 'H1-2 Delete Test Location', 'h1-2-delete-test-location'
from public.gym_brands
where slug = 'h1-2-test-brand';

insert into public.programs (name, slug)
values ('H1-2 Test Program', 'h1-2-test-program');

insert into public.training_sources (
  url,
  source_kind,
  publisher_authority,
  availability_state
)
values (
  'https://example.test/h1-2-source',
  'facility_page',
  'facility_official',
  'available'
);

insert into public.location_training_disciplines (
  location_id,
  discipline_id,
  support_state
)
select location.id, discipline.id, 'available'
from public.gym_locations location
cross join public.training_disciplines discipline
where location.slug = 'h1-2-test-location'
  and discipline.slug = 'hyrox';

insert into public.location_training_capabilities (
  location_training_discipline_id,
  capability_type_id,
  availability_state
)
select location_discipline.id, capability.id, 'available'
from public.location_training_disciplines location_discipline
join public.gym_locations location on location.id = location_discipline.location_id
cross join public.training_capability_types capability
where location.slug = 'h1-2-test-location'
  and capability.slug = 'open-training';

insert into public.location_equipment (
  location_id,
  equipment_type_id,
  availability_state,
  quantity
)
select location.id, equipment.id, 'available', 1
from public.gym_locations location
cross join public.equipment_types equipment
where location.slug = 'h1-2-test-location'
  and equipment.slug = 'ski-erg';

insert into public.training_affiliations (
  location_id,
  discipline_id,
  affiliation_type,
  awarding_organization,
  affiliation_state
)
select location.id, discipline.id, 'training_club', 'H1-2 Test Organization', 'active'
from public.gym_locations location
cross join public.training_disciplines discipline
where location.slug = 'h1-2-test-location'
  and discipline.slug = 'hyrox';

insert into public.program_training_disciplines (
  program_id,
  discipline_id,
  relation_type
)
select program.id, discipline.id, 'primary'
from public.programs program
cross join public.training_disciplines discipline
where program.slug = 'h1-2-test-program'
  and discipline.slug = 'hyrox';

insert into public.location_external_identifiers (
  location_id,
  namespace,
  external_identifier
)
select id, 'h1-2-test-namespace', 'h1-2-test-identifier'
from public.gym_locations
where slug = 'h1-2-test-location';

select throws_ok(
  $$insert into public.location_training_disciplines (location_id, discipline_id)
    select location.id, discipline.id
    from public.gym_locations location
    cross join public.training_disciplines discipline
    where location.slug = 'h1-2-test-location' and discipline.slug = 'hyrox'$$,
  '23505'
);
select throws_ok(
  $$insert into public.location_training_disciplines (location_id, discipline_id, support_state)
    select location.id, discipline.id, 'invalid'
    from public.gym_locations location
    cross join public.training_disciplines discipline
    where location.slug = 'h1-2-delete-test-location' and discipline.slug = 'hyrox'$$,
  '23514'
);
select throws_ok(
  $$insert into public.location_training_disciplines (location_id, discipline_id, verification_status)
    select location.id, discipline.id, 'invalid'
    from public.gym_locations location
    cross join public.training_disciplines discipline
    where location.slug = 'h1-2-delete-test-location' and discipline.slug = 'hyrox'$$,
  '23514'
);
select throws_ok(
  $$insert into public.location_training_disciplines (
      location_id, discipline_id, verification_status, stale_at
    )
    select location.id, discipline.id, 'confirmed', now() + interval '90 days'
    from public.gym_locations location
    cross join public.training_disciplines discipline
    where location.slug = 'h1-2-delete-test-location' and discipline.slug = 'hyrox'$$,
  '23514'
);
select throws_ok(
  $$insert into public.location_training_disciplines (
      location_id, discipline_id, verification_status, last_confirmed_at
    )
    select location.id, discipline.id, 'confirmed', now()
    from public.gym_locations location
    cross join public.training_disciplines discipline
    where location.slug = 'h1-2-delete-test-location' and discipline.slug = 'hyrox'$$,
  '23514'
);
select throws_ok(
  $$insert into public.location_training_disciplines (
      location_id, discipline_id, verification_status, last_confirmed_at, stale_at
    )
    select location.id, discipline.id, 'confirmed', now(), now()
    from public.gym_locations location
    cross join public.training_disciplines discipline
    where location.slug = 'h1-2-delete-test-location' and discipline.slug = 'hyrox'$$,
  '23514'
);

select throws_ok(
  $$insert into public.location_training_capabilities (
      location_training_discipline_id, capability_type_id
    )
    select location_discipline.id, capability.id
    from public.location_training_disciplines location_discipline
    join public.gym_locations location on location.id = location_discipline.location_id
    cross join public.training_capability_types capability
    where location.slug = 'h1-2-test-location' and capability.slug = 'open-training'$$,
  '23505'
);
select throws_ok(
  $$insert into public.location_training_capabilities (
      location_training_discipline_id, capability_type_id, availability_state
    )
    select location_discipline.id, capability.id, 'invalid'
    from public.location_training_disciplines location_discipline
    join public.gym_locations location on location.id = location_discipline.location_id
    cross join public.training_capability_types capability
    where location.slug = 'h1-2-test-location' and capability.slug = 'discipline-coaching'$$,
  '23514'
);
select throws_ok(
  $$insert into public.location_training_capabilities (
      location_training_discipline_id, capability_type_id, access_mode
    )
    select location_discipline.id, capability.id, 'invalid'
    from public.location_training_disciplines location_discipline
    join public.gym_locations location on location.id = location_discipline.location_id
    cross join public.training_capability_types capability
    where location.slug = 'h1-2-test-location' and capability.slug = 'discipline-coaching'$$,
  '23514'
);
select throws_ok(
  $$insert into public.location_training_capabilities (
      location_training_discipline_id, capability_type_id, reservation_requirement
    )
    select location_discipline.id, capability.id, 'invalid'
    from public.location_training_disciplines location_discipline
    join public.gym_locations location on location.id = location_discipline.location_id
    cross join public.training_capability_types capability
    where location.slug = 'h1-2-test-location' and capability.slug = 'discipline-coaching'$$,
  '23514'
);

select throws_ok(
  $$insert into public.location_equipment (location_id, equipment_type_id)
    select location.id, equipment.id
    from public.gym_locations location
    cross join public.equipment_types equipment
    where location.slug = 'h1-2-test-location' and equipment.slug = 'ski-erg'$$,
  '23505'
);
select throws_ok(
  $$insert into public.location_equipment (location_id, equipment_type_id, quantity)
    select location.id, equipment.id, 0
    from public.gym_locations location
    cross join public.equipment_types equipment
    where location.slug = 'h1-2-test-location' and equipment.slug = 'row-erg'$$,
  '23514'
);
select throws_ok(
  $$insert into public.location_equipment (location_id, equipment_type_id, quantity)
    select location.id, equipment.id, -1
    from public.gym_locations location
    cross join public.equipment_types equipment
    where location.slug = 'h1-2-test-location' and equipment.slug = 'row-erg'$$,
  '23514'
);

select throws_ok(
  $$insert into public.training_affiliations (
      location_id, discipline_id, affiliation_type, awarding_organization
    )
    select location.id, discipline.id, '', 'Another Organization'
    from public.gym_locations location
    cross join public.training_disciplines discipline
    where location.slug = 'h1-2-test-location' and discipline.slug = 'hyrox'$$,
  '23514'
);
select throws_ok(
  $$insert into public.training_affiliations (
      location_id, discipline_id, affiliation_type, awarding_organization
    )
    select location.id, discipline.id, 'training_club', ''
    from public.gym_locations location
    cross join public.training_disciplines discipline
    where location.slug = 'h1-2-test-location' and discipline.slug = 'hyrox'$$,
  '23514'
);
select throws_ok(
  $$insert into public.training_affiliations (
      location_id, discipline_id, affiliation_type, awarding_organization, affiliation_state
    )
    select location.id, discipline.id, 'partner', 'Another Organization', 'invalid'
    from public.gym_locations location
    cross join public.training_disciplines discipline
    where location.slug = 'h1-2-test-location' and discipline.slug = 'hyrox'$$,
  '23514'
);
select throws_ok(
  $$insert into public.training_affiliations (
      location_id, discipline_id, affiliation_type, awarding_organization, valid_from, valid_to
    )
    select location.id, discipline.id, 'partner', 'Another Organization', date '2026-02-01', date '2026-01-01'
    from public.gym_locations location
    cross join public.training_disciplines discipline
    where location.slug = 'h1-2-test-location' and discipline.slug = 'hyrox'$$,
  '23514'
);
select throws_ok(
  $$insert into public.training_affiliations (
      location_id, discipline_id, affiliation_type, awarding_organization
    )
    select location.id, discipline.id, 'training_club', 'H1-2 Test Organization'
    from public.gym_locations location
    cross join public.training_disciplines discipline
    where location.slug = 'h1-2-test-location' and discipline.slug = 'hyrox'$$,
  '23505'
);

update public.training_affiliations
set external_identifier = 'h1-2-affiliation-id'
where awarding_organization = 'H1-2 Test Organization';

select throws_ok(
  $$insert into public.training_affiliations (
      location_id, discipline_id, affiliation_type, awarding_organization, external_identifier
    )
    select location.id, discipline.id, 'partner', 'H1-2 Test Organization', 'h1-2-affiliation-id'
    from public.gym_locations location
    cross join public.training_disciplines discipline
    where location.slug = 'h1-2-delete-test-location' and discipline.slug = 'hyrox'$$,
  '23505'
);

select throws_ok(
  $$insert into public.program_training_disciplines (program_id, discipline_id)
    select program.id, discipline.id
    from public.programs program
    cross join public.training_disciplines discipline
    where program.slug = 'h1-2-test-program' and discipline.slug = 'hyrox'$$,
  '23505'
);
select throws_ok(
  $$insert into public.program_training_disciplines (program_id, discipline_id, relation_type)
    select program.id, discipline.id, 'invalid'
    from public.programs program
    cross join public.training_disciplines discipline
    where program.slug = 'h1-2-test-program' and discipline.slug = 'hyrox'$$,
  '23514'
);

select throws_ok(
  $$insert into public.location_external_identifiers (
      location_id, namespace, external_identifier
    )
    select id, 'h1-2-test-namespace', 'h1-2-test-identifier'
    from public.gym_locations where slug = 'h1-2-delete-test-location'$$,
  '23505'
);
select throws_ok(
  $$insert into public.location_external_identifiers (
      location_id, namespace, external_identifier, verification_status
    )
    select id, 'h1-2-confirmed-namespace', 'h1-2-confirmed-identifier', 'confirmed'
    from public.gym_locations where slug = 'h1-2-test-location'$$,
  '23514'
);

select throws_ok(
  $$insert into public.training_evidence (
      training_source_id, assertion, observed_at
    )
    select id, 'supports', now() from public.training_sources
    where url = 'https://example.test/h1-2-source'$$,
  '23514'
);
select throws_ok(
  $$insert into public.training_evidence (
      training_source_id,
      location_training_discipline_id,
      location_training_capability_id,
      assertion,
      observed_at
    )
    select source.id, location_discipline.id, capability.id, 'supports', now()
    from public.training_sources source
    cross join public.location_training_disciplines location_discipline
    cross join public.location_training_capabilities capability
    where source.url = 'https://example.test/h1-2-source'$$,
  '23514'
);
select throws_ok(
  $$insert into public.training_evidence (
      training_source_id,
      program_training_discipline_program_id,
      assertion,
      observed_at
    )
    select source.id, mapping.program_id, 'supports', now()
    from public.training_sources source
    cross join public.program_training_disciplines mapping
    where source.url = 'https://example.test/h1-2-source'$$,
  '23514'
);
select throws_ok(
  $$insert into public.training_evidence (
      training_source_id,
      location_training_discipline_id,
      program_training_discipline_program_id,
      program_training_discipline_discipline_id,
      assertion,
      observed_at
    )
    select source.id, location_discipline.id, mapping.program_id, mapping.discipline_id, 'supports', now()
    from public.training_sources source
    cross join public.location_training_disciplines location_discipline
    cross join public.program_training_disciplines mapping
    where source.url = 'https://example.test/h1-2-source'$$,
  '23514'
);
select throws_ok(
  $$insert into public.training_evidence (
      training_source_id, location_training_discipline_id, assertion, observed_at
    )
    select source.id, location_discipline.id, 'invalid', now()
    from public.training_sources source
    cross join public.location_training_disciplines location_discipline
    where source.url = 'https://example.test/h1-2-source'$$,
  '23514'
);
select throws_ok(
  $$insert into public.training_evidence (
      training_source_id, location_training_discipline_id, assertion, review_status, observed_at
    )
    select source.id, location_discipline.id, 'supports', 'invalid', now()
    from public.training_sources source
    cross join public.location_training_disciplines location_discipline
    where source.url = 'https://example.test/h1-2-source'$$,
  '23514'
);
select throws_ok(
  $$insert into public.training_evidence (
      training_source_id, location_training_discipline_id, assertion, review_status, observed_at
    )
    select source.id, location_discipline.id, 'supports', 'accepted', now()
    from public.training_sources source
    cross join public.location_training_disciplines location_discipline
    where source.url = 'https://example.test/h1-2-source'$$,
  '23514'
);
select throws_ok(
  $$insert into public.training_evidence (
      training_source_id, location_training_discipline_id, assertion, observed_at
    ) values (
      (select id from public.training_sources where url = 'https://example.test/h1-2-source'),
      '00000000-0000-0000-0000-000000000001',
      'supports',
      now()
    )$$,
  '23503'
);

insert into public.training_evidence (
  training_source_id,
  program_training_discipline_program_id,
  program_training_discipline_discipline_id,
  assertion,
  review_status,
  observed_at,
  reviewed_at
)
select source.id, mapping.program_id, mapping.discipline_id, 'supports', 'accepted', now(), now()
from public.training_sources source
cross join public.program_training_disciplines mapping
where source.url = 'https://example.test/h1-2-source';

select results_eq(
  $$select count(*)::integer
    from public.training_evidence
    where program_training_discipline_program_id is not null$$,
  $$values (1)$$,
  'valid composite program target is accepted'
);

select throws_ok(
  $$delete from public.training_sources
    where url = 'https://example.test/h1-2-source'$$,
  '23503'
);

insert into public.location_training_disciplines (
  location_id,
  discipline_id,
  support_state
)
select location.id, discipline.id, 'available'
from public.gym_locations location
cross join public.training_disciplines discipline
where location.slug = 'h1-2-delete-test-location'
  and discipline.slug = 'hyrox';

insert into public.training_evidence (
  training_source_id,
  location_training_discipline_id,
  assertion,
  observed_at,
  content_hash
)
select source.id, location_discipline.id, 'supports', now(), 'delete-cascade-test'
from public.training_sources source
cross join public.location_training_disciplines location_discipline
join public.gym_locations location on location.id = location_discipline.location_id
where source.url = 'https://example.test/h1-2-source'
  and location.slug = 'h1-2-delete-test-location';

delete from public.location_training_disciplines
where location_id = (
  select id from public.gym_locations where slug = 'h1-2-delete-test-location'
);

select results_eq(
  $$select count(*)::integer from public.training_evidence
    where content_hash = 'delete-cascade-test'$$,
  $$values (0)$$,
  'claim target deletion cascades to its evidence'
);

select ok(
  (
    select count(*) = 28
    from information_schema.role_table_grants
    where grantee = 'service_role'
      and table_schema = 'public'
      and table_name in (
        'location_training_disciplines',
        'location_training_capabilities',
        'location_equipment',
        'training_affiliations',
        'program_training_disciplines',
        'location_external_identifiers',
        'training_evidence'
      )
      and privilege_type in ('SELECT', 'INSERT', 'UPDATE', 'DELETE')
  ),
  'service_role has CRUD grants on all seven private tables'
);
select ok(
  not exists (
    select 1
    from information_schema.role_table_grants
    where grantee in ('anon', 'authenticated')
      and table_schema = 'public'
      and table_name in (
        'location_training_disciplines',
        'location_training_capabilities',
        'location_equipment',
        'training_affiliations',
        'program_training_disciplines',
        'location_external_identifiers',
        'training_evidence'
      )
      and privilege_type in ('SELECT', 'INSERT', 'UPDATE', 'DELETE')
  ),
  'anon and authenticated have no CRUD grants on private fact tables'
);

set local role anon;

select results_eq(
  $$select count(*)::integer from public.training_disciplines where slug = 'hyrox'$$,
  $$values (1)$$,
  'H1-1 active discipline remains public to anon'
);
select results_eq(
  $$select count(*)::integer from public.training_capability_types$$,
  $$values (5)$$,
  'H1-1 active capabilities remain public to anon'
);
select results_eq(
  $$select count(*)::integer from public.equipment_types$$,
  $$values (9)$$,
  'H1-1 active equipment remains public to anon'
);
select lives_ok(
  $$do $private_access$
    declare
      table_name text;
      operation text;
    begin
      foreach table_name in array array[
        'location_training_disciplines',
        'location_training_capabilities',
        'location_equipment',
        'training_affiliations',
        'program_training_disciplines',
        'location_external_identifiers',
        'training_evidence'
      ] loop
        foreach operation in array array['select', 'insert', 'update', 'delete'] loop
          begin
            case operation
              when 'select' then execute format('select * from public.%I limit 1', table_name);
              when 'insert' then execute format('insert into public.%I default values', table_name);
              when 'update' then execute format('update public.%I set created_at = created_at where false', table_name);
              when 'delete' then execute format('delete from public.%I where false', table_name);
            end case;
            raise exception 'anon unexpectedly performed % on %', operation, table_name;
          exception
            when insufficient_privilege then null;
          end;
        end loop;
      end loop;
    end
  $private_access$ language plpgsql$$,
  'anon actual SELECT/INSERT/UPDATE/DELETE is denied on all seven private tables'
);

reset role;
set local role authenticated;

select lives_ok(
  $$do $private_access$
    declare
      table_name text;
      operation text;
    begin
      foreach table_name in array array[
        'location_training_disciplines',
        'location_training_capabilities',
        'location_equipment',
        'training_affiliations',
        'program_training_disciplines',
        'location_external_identifiers',
        'training_evidence'
      ] loop
        foreach operation in array array['select', 'insert', 'update', 'delete'] loop
          begin
            case operation
              when 'select' then execute format('select * from public.%I limit 1', table_name);
              when 'insert' then execute format('insert into public.%I default values', table_name);
              when 'update' then execute format('update public.%I set created_at = created_at where false', table_name);
              when 'delete' then execute format('delete from public.%I where false', table_name);
            end case;
            raise exception 'authenticated unexpectedly performed % on %', operation, table_name;
          exception
            when insufficient_privilege then null;
          end;
        end loop;
      end loop;
    end
  $private_access$ language plpgsql$$,
  'authenticated actual SELECT/INSERT/UPDATE/DELETE is denied on all seven private tables'
);

reset role;
set local role service_role;

select results_eq(
  $$select count(*)::integer from public.location_training_disciplines$$,
  $$values (1)$$,
  'service_role can read private facts through the existing server path'
);
select lives_ok(
  $$update public.location_training_disciplines
    set notes = 'service-role-update-test'
    where location_id = (
      select id from public.gym_locations where slug = 'h1-2-test-location'
    )$$,
  'service_role can update a private fact'
);

reset role;

select results_eq(
  $$select count(*)::integer from pg_proc
    where pronamespace = 'public'::regnamespace
      and proname in (
        'search_class_schedule_page',
        'favorite_class_schedule_week',
        'get_latest_schedule_periods_by_location',
        'get_popular_program_summary'
      )$$,
  $$values (4)$$,
  'existing four GymMap RPCs remain present'
);

select * from finish();
rollback;
