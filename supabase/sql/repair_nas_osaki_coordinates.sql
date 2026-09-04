-- NAS Osaki coordinate repair CANDIDATE. Not authorized for Production execution.
-- Existing coordinate override is the source of truth; this scoped transaction
-- avoids the unrelated closure writes in geocode-gym-locations.ts --apply.
-- Approved facility coordinate: 35.618258, 139.726683 (building/site level).
-- Frozen preflight: 2026-09-04T01:10:01.642Z; main/Production 86d0219; migration 0015.
-- Preconditions are strict: any location/membership/schedule drift aborts.
-- Existing updated_at trigger remains enabled and advances target audit metadata.
-- A second execution fails closed (not silently counted as another repair).
begin;
set local lock_timeout = '5s';
set local statement_timeout = '30s';
set local timezone = 'UTC';
set local search_path = public, pg_temp;
-- Keep the verified ownership/membership snapshot stable for this short transaction.
lock table public.gym_locations, public.lesson_location_memberships, public.class_schedules
  in share row exclusive mode;

do $repair$
declare
  before_target jsonb;
  after_target jsonb;
  actual_hash text;
  actual_count integer;
  changed integer;
begin
  if (select max(version) from supabase_migrations.schema_migrations) is distinct from '0015' then
    raise exception 'NAS_OSAKI_PRODUCTION_DRIFT: migration_head';
  end if;
  select encode(sha256(convert_to(coalesce(jsonb_agg(to_jsonb(t) order by id), '[]'::jsonb)::text, 'UTF8')), 'hex'), count(*)
    into actual_hash, actual_count
    from public.gym_locations t where id in ('ce0f6e5d-3455-4305-85b8-68a50dd5a57b','e5250e8c-8a51-41e1-87e6-56f332efc044','c3afed3c-5a34-4eb4-bc9b-57f4a6b2013a');
  if actual_hash <> '47105e0603e10d0f34096874d8651dde06395163777bbb7335182f5a35f1819d' or actual_count <> 3 then
    raise exception 'NAS_OSAKI_PRODUCTION_DRIFT: gym_locations';
  end if;
  select encode(sha256(convert_to(coalesce(jsonb_agg(to_jsonb(t) order by location_id), '[]'::jsonb)::text, 'UTF8')), 'hex'), count(*)
    into actual_hash, actual_count
    from public.lesson_location_memberships t where location_id in ('ce0f6e5d-3455-4305-85b8-68a50dd5a57b','e5250e8c-8a51-41e1-87e6-56f332efc044','c3afed3c-5a34-4eb4-bc9b-57f4a6b2013a');
  if actual_hash <> '32681a5c98347bc8475e1a59f1bcbc228e98e1347931c982484f0321e2a979b5' or actual_count <> 3 then
    raise exception 'NAS_OSAKI_PRODUCTION_DRIFT: lesson_location_memberships';
  end if;
  select encode(sha256(convert_to(coalesce(jsonb_agg(to_jsonb(t) order by id), '[]'::jsonb)::text, 'UTF8')), 'hex'), count(*)
    into actual_hash, actual_count
    from public.class_schedules t where location_id in ('ce0f6e5d-3455-4305-85b8-68a50dd5a57b','e5250e8c-8a51-41e1-87e6-56f332efc044','c3afed3c-5a34-4eb4-bc9b-57f4a6b2013a');
  if actual_hash <> '1a306629aad5dff2f92cfa4e030ac3d66a0fd8e0d1bef8679f0230f16412cd74' or actual_count <> 104 then
    raise exception 'NAS_OSAKI_PRODUCTION_DRIFT: class_schedules';
  end if;

  select to_jsonb(t) into strict before_target from public.gym_locations t
    where id = 'ce0f6e5d-3455-4305-85b8-68a50dd5a57b';
  update public.gym_locations
    set latitude = 35.618258, longitude = 139.726683
    where id = 'ce0f6e5d-3455-4305-85b8-68a50dd5a57b'
      and slug = 'sports-club-nas-osaki-index'
      and name = 'NAS大崎' and is_active
      and latitude is null and longitude is null;
  get diagnostics changed = row_count;
  if changed <> 1 then
    raise exception 'NAS_OSAKI_EXPECTED_EXACTLY_ONE_UPDATE';
  end if;
  select to_jsonb(t) into strict after_target from public.gym_locations t
    where id = 'ce0f6e5d-3455-4305-85b8-68a50dd5a57b';
  if (before_target - array['latitude','longitude','updated_at']) is distinct from
     (after_target - array['latitude','longitude','updated_at'])
     or (after_target->>'latitude')::numeric is distinct from 35.618258
     or (after_target->>'longitude')::numeric is distinct from 139.726683 then
    raise exception 'NAS_OSAKI_UNEXPECTED_LOCATION_MUTATION';
  end if;
  select encode(sha256(convert_to(coalesce(jsonb_agg(to_jsonb(t) order by location_id), '[]'::jsonb)::text, 'UTF8')), 'hex')
    into actual_hash from public.lesson_location_memberships t where location_id in ('ce0f6e5d-3455-4305-85b8-68a50dd5a57b','e5250e8c-8a51-41e1-87e6-56f332efc044','c3afed3c-5a34-4eb4-bc9b-57f4a6b2013a');
  if actual_hash <> '32681a5c98347bc8475e1a59f1bcbc228e98e1347931c982484f0321e2a979b5' then
    raise exception 'NAS_OSAKI_UNEXPECTED_DEPENDENT_MUTATION: lesson_location_memberships';
  end if;
  select encode(sha256(convert_to(coalesce(jsonb_agg(to_jsonb(t) order by id), '[]'::jsonb)::text, 'UTF8')), 'hex')
    into actual_hash from public.class_schedules t where location_id in ('ce0f6e5d-3455-4305-85b8-68a50dd5a57b','e5250e8c-8a51-41e1-87e6-56f332efc044','c3afed3c-5a34-4eb4-bc9b-57f4a6b2013a');
  if actual_hash <> '1a306629aad5dff2f92cfa4e030ac3d66a0fd8e0d1bef8679f0230f16412cd74' then
    raise exception 'NAS_OSAKI_UNEXPECTED_DEPENDENT_MUTATION: class_schedules';
  end if;
  -- Reconstruct the original parent row to compare both untouched child rows.
  select encode(sha256(convert_to(jsonb_agg(
    case when id = 'ce0f6e5d-3455-4305-85b8-68a50dd5a57b' then before_target else to_jsonb(t) end
    order by id)::text, 'UTF8')), 'hex') into actual_hash
    from public.gym_locations t where id in
      ('ce0f6e5d-3455-4305-85b8-68a50dd5a57b','e5250e8c-8a51-41e1-87e6-56f332efc044','c3afed3c-5a34-4eb4-bc9b-57f4a6b2013a');
  if actual_hash <> '47105e0603e10d0f34096874d8651dde06395163777bbb7335182f5a35f1819d' then
    raise exception 'NAS_OSAKI_UNEXPECTED_CHILD_MUTATION';
  end if;
end
$repair$;
commit;
