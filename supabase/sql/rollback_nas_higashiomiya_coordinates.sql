-- Separate human-authorized rollback only; requires the committed apply receipt's
-- exact postimage JSON in psql variable release_postimage. No trigger bypass.
begin;
set local lock_timeout='5s';
set local statement_timeout='60s';
set local timezone='UTC';
set local search_path=public,pg_temp;
lock table public.gym_locations,public.lesson_location_memberships,public.class_schedules
  in share row exclusive mode;
create temporary table nas_higashiomiya_rollback_receipt(postimage jsonb) on commit drop;
insert into nas_higashiomiya_rollback_receipt values (:'release_postimage'::jsonb);
do $rollback$
declare
  receipt jsonb;
  current_target jsonb;
  restored_target jsonb;
  frozen_preimage jsonb;
  actual jsonb;
  members jsonb;
  schedules jsonb;
  locations jsonb;
  changed integer;
begin
  if (select max(version) from supabase_migrations.schema_migrations) is distinct from '0015' then
    raise exception 'NAS_HIGASHIOMIYA_ROLLBACK_DRIFT: migration';
  end if;
  select postimage into strict receipt from nas_higashiomiya_rollback_receipt;
  select to_jsonb(t) into strict current_target from public.gym_locations t where id='a6d34e4b-6cc1-4f6f-9fd0-793240e203d4';
  if current_target is distinct from receipt or receipt->>'id' is distinct from 'a6d34e4b-6cc1-4f6f-9fd0-793240e203d4'
    or (receipt->>'latitude')::numeric is distinct from 35.947483 or (receipt->>'longitude')::numeric is distinct from 139.641284 then
    raise exception 'NAS_HIGASHIOMIYA_ROLLBACK_POSTIMAGE_DRIFT';
  end if;
  frozen_preimage := receipt || '{"latitude":null,"longitude":null,"updated_at":"2026-08-08T14:25:32.33694+00:00"}'::jsonb;
  select jsonb_agg(to_jsonb(t) order by id) into locations from public.gym_locations t;
  select jsonb_agg(case when id='a6d34e4b-6cc1-4f6f-9fd0-793240e203d4' then frozen_preimage else to_jsonb(t) end order by id) into actual from public.gym_locations t;
  if encode(sha256(convert_to(actual::text,'UTF8')),'hex') is distinct from 'fe5db31f9f1a840b81ff76e7d0697e6506b8e3c8cc48263c30a9843efd4dce99' then
    raise exception 'NAS_HIGASHIOMIYA_ROLLBACK_DRIFT: locations';
  end if;
  select jsonb_agg(to_jsonb(t) order by location_id) into members from public.lesson_location_memberships t;
  select jsonb_agg(to_jsonb(t) order by id) into schedules from public.class_schedules t;
  if encode(sha256(convert_to(members::text,'UTF8')),'hex') is distinct from '7f1ee923200fbb1d326a57da2689820f31324e7e4888b999a4e9f66f8e0d9479'
    or encode(sha256(convert_to(schedules::text,'UTF8')),'hex') is distinct from '4b720503de6d1adb2333d1f6052967f585b16efdc4bc6fa84462265219181137' then
    raise exception 'NAS_HIGASHIOMIYA_ROLLBACK_DRIFT: membership/schedule';
  end if;
  update public.gym_locations set latitude=null,longitude=null
    where id='a6d34e4b-6cc1-4f6f-9fd0-793240e203d4' and latitude=35.947483 and longitude=139.641284;
  get diagnostics changed=row_count;
  if changed<>1 then raise exception 'NAS_HIGASHIOMIYA_ROLLBACK_EXPECTED_EXACTLY_ONE'; end if;
  select to_jsonb(t) into strict restored_target from public.gym_locations t where id='a6d34e4b-6cc1-4f6f-9fd0-793240e203d4';
  if restored_target-'updated_at' is distinct from frozen_preimage-'updated_at' then raise exception 'NAS_HIGASHIOMIYA_ROLLBACK_TARGET_MUTATION'; end if;
  select jsonb_agg(case when id='a6d34e4b-6cc1-4f6f-9fd0-793240e203d4' then current_target else to_jsonb(t) end order by id) into actual from public.gym_locations t;
  if actual is distinct from locations then raise exception 'NAS_HIGASHIOMIYA_ROLLBACK_OTHER_LOCATION_MUTATION'; end if;
  select jsonb_agg(to_jsonb(t) order by location_id) into actual from public.lesson_location_memberships t;
  if actual is distinct from members then raise exception 'NAS_HIGASHIOMIYA_ROLLBACK_MEMBERSHIP_MUTATION'; end if;
  select jsonb_agg(to_jsonb(t) order by id) into actual from public.class_schedules t;
  if actual is distinct from schedules then raise exception 'NAS_HIGASHIOMIYA_ROLLBACK_SCHEDULE_MUTATION'; end if;
end
$rollback$;
commit;
