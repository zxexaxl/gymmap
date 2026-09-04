-- Candidate only: NO Production authorization. One coordinate-only transaction.
-- Freeze: 2026-09-04T07:18:06.521499Z, main/Production 4ba6b6b, migration0015.
-- Exactly one existing row; normal updated_at trigger is not bypassed.
begin;
set local lock_timeout='5s';
set local statement_timeout='60s';
set local timezone='UTC';
set local search_path=public,pg_temp;
lock table public.gym_locations,public.lesson_location_memberships,public.class_schedules
  in share row exclusive mode;
do $repair$
declare
  locations_before jsonb;
  memberships_before jsonb;
  schedules_before jsonb;
  target_before jsonb;
  target_after jsonb;
  actual jsonb;
  changed integer;
begin
  if (select max(version) from supabase_migrations.schema_migrations) is distinct from '0015' then
    raise exception 'NAS_HIGASHIOMIYA_PRODUCTION_PREIMAGE_DRIFT: migration';
  end if;
  select jsonb_agg(to_jsonb(t) order by id) into locations_before from public.gym_locations t;
  select jsonb_agg(to_jsonb(t) order by location_id) into memberships_before from public.lesson_location_memberships t;
  select jsonb_agg(to_jsonb(t) order by id) into schedules_before from public.class_schedules t;
  if encode(sha256(convert_to(locations_before::text,'UTF8')),'hex') is distinct from 'fe5db31f9f1a840b81ff76e7d0697e6506b8e3c8cc48263c30a9843efd4dce99'
    or encode(sha256(convert_to(memberships_before::text,'UTF8')),'hex') is distinct from '7f1ee923200fbb1d326a57da2689820f31324e7e4888b999a4e9f66f8e0d9479'
    or encode(sha256(convert_to(schedules_before::text,'UTF8')),'hex') is distinct from '4b720503de6d1adb2333d1f6052967f585b16efdc4bc6fa84462265219181137' then
    raise exception 'NAS_HIGASHIOMIYA_PRODUCTION_PREIMAGE_DRIFT: location/membership/schedule';
  end if;
  select to_jsonb(t) into strict target_before from public.gym_locations t
    where id='a6d34e4b-6cc1-4f6f-9fd0-793240e203d4';
  if not exists(select 1 from public.lesson_location_memberships where location_id='a6d34e4b-6cc1-4f6f-9fd0-793240e203d4')
    or (select count(*) from public.class_schedules where location_id='a6d34e4b-6cc1-4f6f-9fd0-793240e203d4') <> 143 then
    raise exception 'NAS_HIGASHIOMIYA_PRODUCTION_PREIMAGE_DRIFT: target ownership';
  end if;
  update public.gym_locations set latitude=35.947483,longitude=139.641284
    where id='a6d34e4b-6cc1-4f6f-9fd0-793240e203d4'
      and slug='sports-club-nas-higashiomiya-newbuild-index'
      and name='NAS東大宮（新館）' and is_active
      and latitude is null and longitude is null;
  get diagnostics changed=row_count;
  if changed<>1 then raise exception 'NAS_HIGASHIOMIYA_EXPECTED_EXACTLY_ONE_UPDATE'; end if;
  select to_jsonb(t) into strict target_after from public.gym_locations t
    where id='a6d34e4b-6cc1-4f6f-9fd0-793240e203d4';
  if target_before-array['latitude','longitude','updated_at'] is distinct from target_after-array['latitude','longitude','updated_at']
    or (target_after->>'latitude')::numeric is distinct from 35.947483
    or (target_after->>'longitude')::numeric is distinct from 139.641284 then
    raise exception 'NAS_HIGASHIOMIYA_UNEXPECTED_TARGET_MUTATION';
  end if;
  select jsonb_agg(case when id='a6d34e4b-6cc1-4f6f-9fd0-793240e203d4' then target_before else to_jsonb(t) end order by id)
    into actual from public.gym_locations t;
  if actual is distinct from locations_before then raise exception 'NAS_HIGASHIOMIYA_UNEXPECTED_OTHER_LOCATION_MUTATION'; end if;
  select jsonb_agg(to_jsonb(t) order by location_id) into actual from public.lesson_location_memberships t;
  if actual is distinct from memberships_before then raise exception 'NAS_HIGASHIOMIYA_UNEXPECTED_MEMBERSHIP_MUTATION'; end if;
  select jsonb_agg(to_jsonb(t) order by id) into actual from public.class_schedules t;
  if actual is distinct from schedules_before then raise exception 'NAS_HIGASHIOMIYA_UNEXPECTED_SCHEDULE_MUTATION'; end if;
end
$repair$;
-- Capture this receipt; trust it only after psql exits successfully and COMMIT is confirmed.
select jsonb_build_object('location_id',id,'postimage',to_jsonb(t),'transaction_id',txid_current()) as release_receipt
  from public.gym_locations t where id='a6d34e4b-6cc1-4f6f-9fd0-793240e203d4';
commit;
