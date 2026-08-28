-- Publication views intentionally execute with the view owner's privileges so
-- private fact/evidence tables remain ungranted. security_barrier prevents
-- caller predicates from being pushed through the publication boundary.

create view public.current_class_schedules
with (security_barrier = true, security_invoker = true)
as
with schedule_clock as (
  select (now() at time zone 'Asia/Tokyo')::date as current_date_jst
),
location_schedule_state as (
  select
    class_schedules.location_id,
    bool_or(class_schedules.valid_from is not null) as has_dated_rows
  from public.class_schedules
  group by class_schedules.location_id
),
current_dated_period as (
  select
    class_schedules.location_id,
    max(class_schedules.valid_from) as valid_from
  from public.class_schedules
  cross join schedule_clock
  where class_schedules.valid_from is not null
    and class_schedules.valid_from <= schedule_clock.current_date_jst
    and (
      class_schedules.valid_to is null
      or class_schedules.valid_to >= schedule_clock.current_date_jst
    )
  group by class_schedules.location_id
)
select class_schedules.*
from public.class_schedules
join public.gym_locations
  on gym_locations.id = class_schedules.location_id
  and gym_locations.is_active = true
join location_schedule_state
  on location_schedule_state.location_id = class_schedules.location_id
left join current_dated_period
  on current_dated_period.location_id = class_schedules.location_id
cross join schedule_clock
where (
    location_schedule_state.has_dated_rows
    and current_dated_period.valid_from is not null
    and class_schedules.valid_from = current_dated_period.valid_from
    and class_schedules.valid_from <= schedule_clock.current_date_jst
    and (
      class_schedules.valid_to is null
      or class_schedules.valid_to >= schedule_clock.current_date_jst
    )
  )
  or (
    not location_schedule_state.has_dated_rows
    and class_schedules.valid_from is null
  );

create view public.published_location_training_disciplines
with (security_barrier = true, security_invoker = false)
as
select
  location_training_disciplines.location_id,
  location_training_disciplines.discipline_id,
  training_disciplines.slug as discipline_slug,
  location_training_disciplines.last_confirmed_at,
  location_training_disciplines.stale_at,
  location_training_disciplines.updated_at
from public.location_training_disciplines
join public.gym_locations
  on gym_locations.id = location_training_disciplines.location_id
  and gym_locations.is_active = true
join public.training_disciplines
  on training_disciplines.id = location_training_disciplines.discipline_id
  and training_disciplines.is_active = true
where location_training_disciplines.support_state = 'available'
  and location_training_disciplines.verification_status = 'confirmed'
  and location_training_disciplines.last_confirmed_at is not null
  and location_training_disciplines.stale_at > now()
  and exists (
    select 1
    from public.training_evidence
    join public.training_sources
      on training_sources.id = training_evidence.training_source_id
    where training_evidence.location_training_discipline_id = location_training_disciplines.id
      and training_evidence.review_status = 'accepted'
      and training_evidence.assertion = 'supports'
      and training_sources.availability_state = 'available'
      and training_sources.review_required = false
      and training_sources.publisher_authority in (
        'governing_body',
        'facility_official',
        'official_schedule',
        'official_social'
      )
  )
  and not exists (
    select 1
    from public.training_evidence
    where training_evidence.location_training_discipline_id = location_training_disciplines.id
      and training_evidence.review_status = 'accepted'
      and training_evidence.assertion = 'refutes'
  );

create view public.published_location_training_capabilities
with (security_barrier = true, security_invoker = false)
as
select
  published_discipline.location_id,
  published_discipline.discipline_id,
  location_training_capabilities.capability_type_id,
  training_capability_types.slug as capability_slug,
  location_training_capabilities.availability_state,
  location_training_capabilities.access_mode,
  location_training_capabilities.reservation_requirement,
  location_training_capabilities.last_confirmed_at,
  location_training_capabilities.stale_at
from public.location_training_capabilities
join public.location_training_disciplines
  on location_training_disciplines.id = location_training_capabilities.location_training_discipline_id
join public.published_location_training_disciplines published_discipline
  on published_discipline.location_id = location_training_disciplines.location_id
  and published_discipline.discipline_id = location_training_disciplines.discipline_id
join public.training_capability_types
  on training_capability_types.id = location_training_capabilities.capability_type_id
  and training_capability_types.is_active = true
where location_training_capabilities.availability_state = 'available'
  and location_training_capabilities.verification_status = 'confirmed'
  and location_training_capabilities.last_confirmed_at is not null
  and location_training_capabilities.stale_at > now()
  and exists (
    select 1
    from public.training_evidence
    join public.training_sources
      on training_sources.id = training_evidence.training_source_id
    where training_evidence.location_training_capability_id = location_training_capabilities.id
      and training_evidence.review_status = 'accepted'
      and training_evidence.assertion = 'supports'
      and training_sources.availability_state = 'available'
      and training_sources.review_required = false
      and training_sources.publisher_authority in (
        'governing_body',
        'facility_official',
        'official_schedule',
        'official_social'
      )
  )
  and not exists (
    select 1
    from public.training_evidence
    where training_evidence.location_training_capability_id = location_training_capabilities.id
      and training_evidence.review_status = 'accepted'
      and training_evidence.assertion = 'refutes'
  );

create view public.published_location_equipment
with (security_barrier = true, security_invoker = false)
as
select
  location_equipment.location_id,
  location_equipment.equipment_type_id,
  equipment_types.slug as equipment_slug,
  location_equipment.quantity,
  location_equipment.access_mode,
  location_equipment.reservation_requirement,
  location_equipment.last_confirmed_at,
  location_equipment.stale_at
from public.location_equipment
join public.gym_locations
  on gym_locations.id = location_equipment.location_id
  and gym_locations.is_active = true
join public.equipment_types
  on equipment_types.id = location_equipment.equipment_type_id
  and equipment_types.is_active = true
where location_equipment.availability_state = 'available'
  and location_equipment.verification_status = 'confirmed'
  and location_equipment.last_confirmed_at is not null
  and location_equipment.stale_at > now()
  and exists (
    select 1
    from public.training_evidence
    join public.training_sources
      on training_sources.id = training_evidence.training_source_id
    where training_evidence.location_equipment_id = location_equipment.id
      and training_evidence.review_status = 'accepted'
      and training_evidence.assertion = 'supports'
      and training_sources.availability_state = 'available'
      and training_sources.review_required = false
      and training_sources.publisher_authority in (
        'governing_body',
        'facility_official',
        'official_schedule',
        'official_social'
      )
  )
  and not exists (
    select 1
    from public.training_evidence
    where training_evidence.location_equipment_id = location_equipment.id
      and training_evidence.review_status = 'accepted'
      and training_evidence.assertion = 'refutes'
  );

create view public.published_training_affiliations
with (security_barrier = true, security_invoker = false)
as
with publication_clock as (
  select (now() at time zone 'Asia/Tokyo')::date as current_date_jst
)
select
  training_affiliations.location_id,
  training_affiliations.discipline_id,
  training_disciplines.slug as discipline_slug,
  training_affiliations.affiliation_type,
  training_affiliations.awarding_organization,
  training_affiliations.external_identifier,
  training_affiliations.valid_from,
  training_affiliations.valid_to,
  training_affiliations.last_confirmed_at,
  training_affiliations.stale_at,
  exists (
    select 1
    from public.training_evidence official_evidence
    join public.training_sources official_source
      on official_source.id = official_evidence.training_source_id
    where official_evidence.training_affiliation_id = training_affiliations.id
      and official_evidence.review_status = 'accepted'
      and official_evidence.assertion = 'supports'
      and official_source.publisher_authority = 'governing_body'
      and official_source.availability_state = 'available'
      and official_source.review_required = false
  ) as is_official
from public.training_affiliations
join public.gym_locations
  on gym_locations.id = training_affiliations.location_id
  and gym_locations.is_active = true
join public.training_disciplines
  on training_disciplines.id = training_affiliations.discipline_id
  and training_disciplines.is_active = true
cross join publication_clock
where training_affiliations.affiliation_state = 'active'
  and training_affiliations.verification_status = 'confirmed'
  and training_affiliations.last_confirmed_at is not null
  and training_affiliations.stale_at > now()
  and (
    training_affiliations.valid_from is null
    or training_affiliations.valid_from <= publication_clock.current_date_jst
  )
  and (
    training_affiliations.valid_to is null
    or training_affiliations.valid_to >= publication_clock.current_date_jst
  )
  and exists (
    select 1
    from public.training_evidence
    join public.training_sources
      on training_sources.id = training_evidence.training_source_id
    where training_evidence.training_affiliation_id = training_affiliations.id
      and training_evidence.review_status = 'accepted'
      and training_evidence.assertion = 'supports'
      and training_sources.availability_state = 'available'
      and training_sources.review_required = false
      and training_sources.publisher_authority in (
        'governing_body',
        'facility_official',
        'official_schedule',
        'official_social'
      )
  )
  and not exists (
    select 1
    from public.training_evidence
    where training_evidence.training_affiliation_id = training_affiliations.id
      and training_evidence.review_status = 'accepted'
      and training_evidence.assertion = 'refutes'
  );

create view public.published_program_training_disciplines
with (security_barrier = true, security_invoker = false)
as
select
  program_training_disciplines.program_id,
  program_training_disciplines.discipline_id,
  training_disciplines.slug as discipline_slug,
  program_training_disciplines.relation_type,
  program_training_disciplines.last_confirmed_at,
  program_training_disciplines.stale_at
from public.program_training_disciplines
join public.programs
  on programs.id = program_training_disciplines.program_id
join public.training_disciplines
  on training_disciplines.id = program_training_disciplines.discipline_id
  and training_disciplines.is_active = true
where program_training_disciplines.verification_status = 'confirmed'
  and program_training_disciplines.last_confirmed_at is not null
  and program_training_disciplines.stale_at > now()
  and exists (
    select 1
    from public.training_evidence
    join public.training_sources
      on training_sources.id = training_evidence.training_source_id
    where training_evidence.program_training_discipline_program_id = program_training_disciplines.program_id
      and training_evidence.program_training_discipline_discipline_id = program_training_disciplines.discipline_id
      and training_evidence.review_status = 'accepted'
      and training_evidence.assertion = 'supports'
      and training_sources.availability_state = 'available'
      and training_sources.review_required = false
      and training_sources.publisher_authority in (
        'governing_body',
        'facility_official',
        'official_schedule',
        'official_social'
      )
  )
  and not exists (
    select 1
    from public.training_evidence
    where training_evidence.program_training_discipline_program_id = program_training_disciplines.program_id
      and training_evidence.program_training_discipline_discipline_id = program_training_disciplines.discipline_id
      and training_evidence.review_status = 'accepted'
      and training_evidence.assertion = 'refutes'
  );

create view public.published_training_discipline_summary
with (security_barrier = true, security_invoker = false)
as
with published_location_counts as (
  select
    published_location_training_disciplines.discipline_id,
    count(distinct published_location_training_disciplines.location_id)::bigint as published_location_count
  from public.published_location_training_disciplines
  group by published_location_training_disciplines.discipline_id
),
official_location_counts as (
  select
    published_location_training_disciplines.discipline_id,
    count(distinct published_training_affiliations.location_id)::bigint as official_location_count
  from public.published_location_training_disciplines
  join public.published_training_affiliations
    on published_training_affiliations.location_id = published_location_training_disciplines.location_id
    and published_training_affiliations.discipline_id = published_location_training_disciplines.discipline_id
    and published_training_affiliations.is_official = true
  group by published_location_training_disciplines.discipline_id
),
publication_timestamps as (
  select
    published_location_training_disciplines.discipline_id,
    greatest(
      published_location_training_disciplines.updated_at,
      published_location_training_disciplines.last_confirmed_at
    ) as changed_at
  from public.published_location_training_disciplines
  union all
  select
    published_location_training_capabilities.discipline_id,
    published_location_training_capabilities.last_confirmed_at
  from public.published_location_training_capabilities
  union all
  select
    published_training_affiliations.discipline_id,
    published_training_affiliations.last_confirmed_at
  from public.published_training_affiliations
  union all
  select
    published_program_training_disciplines.discipline_id,
    published_program_training_disciplines.last_confirmed_at
  from public.published_program_training_disciplines
),
last_modified as (
  select
    publication_timestamps.discipline_id,
    max(publication_timestamps.changed_at) as last_modified_at
  from publication_timestamps
  group by publication_timestamps.discipline_id
)
select
  training_disciplines.id as discipline_id,
  training_disciplines.slug,
  training_disciplines.name,
  published_location_counts.published_location_count,
  coalesce(official_location_counts.official_location_count, 0::bigint) as official_location_count,
  last_modified.last_modified_at
from public.training_disciplines
join published_location_counts
  on published_location_counts.discipline_id = training_disciplines.id
  and published_location_counts.published_location_count > 0
left join official_location_counts
  on official_location_counts.discipline_id = training_disciplines.id
join last_modified
  on last_modified.discipline_id = training_disciplines.id
where training_disciplines.is_active = true;

create or replace function public.search_training_locations(
  p_discipline_slug text,
  p_prefecture text default '',
  p_city text default '',
  p_official_only boolean default false,
  p_equipment_slugs text[] default '{}'::text[],
  p_capability_slugs text[] default '{}'::text[],
  p_has_class boolean default null,
  p_offset integer default 0,
  p_limit integer default 20
)
returns table (
  location_id uuid,
  location_slug text,
  location_name text,
  brand_id uuid,
  brand_name text,
  prefecture text,
  city text,
  address text,
  latitude numeric,
  longitude numeric,
  official boolean,
  class_available boolean,
  open_training_available boolean,
  equipment_slugs text[],
  capability_slugs text[],
  last_confirmed_at timestamptz,
  total_count bigint
)
language plpgsql
stable
security invoker
set search_path = public
as $$
begin
  if p_discipline_slug is null or btrim(p_discipline_slug) = '' then
    raise exception 'p_discipline_slug must be non-empty' using errcode = '22023';
  end if;

  if p_offset is null or p_offset < 0 then
    raise exception 'p_offset must be greater than or equal to zero' using errcode = '22023';
  end if;

  if p_limit is null or p_limit < 1 or p_limit > 100 then
    raise exception 'p_limit must be between 1 and 100' using errcode = '22023';
  end if;

  return query
  with base_locations as (
    select
      published_discipline.location_id,
      published_discipline.discipline_id,
      published_discipline.last_confirmed_at
    from public.published_location_training_disciplines published_discipline
    where published_discipline.discipline_slug = btrim(p_discipline_slug)
  ),
  enriched_locations as (
    select
      base_location.location_id,
      gym_locations.slug as location_slug,
      gym_locations.name as location_name,
      gym_brands.id as brand_id,
      gym_brands.name as brand_name,
      gym_locations.prefecture,
      gym_locations.city,
      gym_locations.address_line as address,
      gym_locations.latitude,
      gym_locations.longitude,
      exists (
        select 1
        from public.published_training_affiliations affiliation
        where affiliation.location_id = base_location.location_id
          and affiliation.discipline_id = base_location.discipline_id
          and affiliation.is_official = true
      ) as official,
      exists (
        select 1
        from public.current_class_schedules current_schedule
        join public.published_program_training_disciplines program_discipline
          on program_discipline.program_id = current_schedule.program_id
          and program_discipline.discipline_id = base_location.discipline_id
        where current_schedule.location_id = base_location.location_id
          and current_schedule.needs_review = false
      ) as class_available,
      exists (
        select 1
        from public.published_location_training_capabilities capability
        where capability.location_id = base_location.location_id
          and capability.discipline_id = base_location.discipline_id
          and capability.capability_slug = 'open-training'
      ) as open_training_available,
      array(
        select distinct equipment.equipment_slug
        from public.published_location_equipment equipment
        where equipment.location_id = base_location.location_id
        order by equipment.equipment_slug
      ) as equipment_slugs,
      array(
        select distinct capability.capability_slug
        from public.published_location_training_capabilities capability
        where capability.location_id = base_location.location_id
          and capability.discipline_id = base_location.discipline_id
        order by capability.capability_slug
      ) as capability_slugs,
      base_location.last_confirmed_at
    from base_locations base_location
    join public.gym_locations
      on gym_locations.id = base_location.location_id
      and gym_locations.is_active = true
    join public.gym_brands
      on gym_brands.id = gym_locations.brand_id
    where (
        p_prefecture is null
        or btrim(p_prefecture) = ''
        or gym_locations.prefecture = btrim(p_prefecture)
      )
      and (
        p_city is null
        or btrim(p_city) = ''
        or gym_locations.city = btrim(p_city)
      )
  ),
  filtered_locations as (
    select enriched_location.*
    from enriched_locations enriched_location
    where (not coalesce(p_official_only, false) or enriched_location.official)
      and not exists (
        select 1
        from unnest(coalesce(p_equipment_slugs, '{}'::text[])) requested_equipment(slug)
        where not (requested_equipment.slug = any(enriched_location.equipment_slugs))
      )
      and not exists (
        select 1
        from unnest(coalesce(p_capability_slugs, '{}'::text[])) requested_capability(slug)
        where not (requested_capability.slug = any(enriched_location.capability_slugs))
      )
      and (p_has_class is null or enriched_location.class_available = p_has_class)
  )
  select
    filtered_location.location_id,
    filtered_location.location_slug,
    filtered_location.location_name,
    filtered_location.brand_id,
    filtered_location.brand_name,
    filtered_location.prefecture,
    filtered_location.city,
    filtered_location.address,
    filtered_location.latitude,
    filtered_location.longitude,
    filtered_location.official,
    filtered_location.class_available,
    filtered_location.open_training_available,
    filtered_location.equipment_slugs,
    filtered_location.capability_slugs,
    filtered_location.last_confirmed_at,
    count(*) over() as total_count
  from filtered_locations filtered_location
  order by
    filtered_location.official desc,
    filtered_location.brand_name,
    filtered_location.location_name,
    filtered_location.location_id
  offset p_offset
  limit p_limit;
end;
$$;

revoke all on table public.current_class_schedules from public, anon, authenticated;
revoke all on table public.published_location_training_disciplines from public, anon, authenticated;
revoke all on table public.published_location_training_capabilities from public, anon, authenticated;
revoke all on table public.published_location_equipment from public, anon, authenticated;
revoke all on table public.published_training_affiliations from public, anon, authenticated;
revoke all on table public.published_program_training_disciplines from public, anon, authenticated;
revoke all on table public.published_training_discipline_summary from public, anon, authenticated;

grant select on table public.current_class_schedules to anon, authenticated, service_role;
grant select on table public.published_location_training_disciplines to anon, authenticated, service_role;
grant select on table public.published_location_training_capabilities to anon, authenticated, service_role;
grant select on table public.published_location_equipment to anon, authenticated, service_role;
grant select on table public.published_training_affiliations to anon, authenticated, service_role;
grant select on table public.published_program_training_disciplines to anon, authenticated, service_role;
grant select on table public.published_training_discipline_summary to anon, authenticated, service_role;

revoke all on function public.search_training_locations(
  text,
  text,
  text,
  boolean,
  text[],
  text[],
  boolean,
  integer,
  integer
) from public;

grant execute on function public.search_training_locations(
  text,
  text,
  text,
  boolean,
  text[],
  text[],
  boolean,
  integer,
  integer
) to anon, authenticated, service_role;
