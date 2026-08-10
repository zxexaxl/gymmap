create extension if not exists pg_trgm;

create index if not exists idx_class_schedules_normalized_text_trgm
  on class_schedules using gin (normalized_text gin_trgm_ops);

create index if not exists idx_class_schedules_comparison_key_trgm
  on class_schedules using gin (comparison_key gin_trgm_ops);

create index if not exists idx_class_schedules_canonical_program_name_trgm
  on class_schedules using gin (lower(coalesce(canonical_program_name, '')) gin_trgm_ops);

create index if not exists idx_class_schedules_program_brand_trgm
  on class_schedules using gin (lower(coalesce(program_brand, '')) gin_trgm_ops);

create index if not exists idx_class_schedules_location_period
  on class_schedules(location_id, valid_from desc);

create index if not exists idx_class_schedules_search_order
  on class_schedules(weekday, start_time, duration_minutes, location_id);

create or replace function search_class_schedule_page(
  p_query text default '',
  p_query_compact text default '',
  p_canonical_names text[] default array[]::text[],
  p_program_brands text[] default array[]::text[],
  p_weekday text default '',
  p_time_range text default '',
  p_duration_range text default '',
  p_brand text default '',
  p_area text default '',
  p_offset integer default 0,
  p_limit integer default 20
)
returns table (
  schedule_id uuid,
  result_order bigint,
  total_count bigint,
  latest_schedule_update timestamptz
)
language sql
stable
security invoker
set search_path = public
as $$
  with latest_periods as (
    select
      location_id,
      max(valid_from) filter (where valid_from is not null) as latest_valid_from
    from class_schedules
    group by location_id
  ),
  eligible as (
    select
      schedules.id,
      schedules.weekday,
      schedules.start_time,
      schedules.duration_minutes,
      locations.name as location_name,
      coalesce(schedules.extracted_at, schedules.updated_at) as schedule_update,
      case
        when coalesce(p_query, '') = '' then 0
        when schedules.normalized_text = p_query
          or schedules.comparison_key = p_query_compact
          or lower(coalesce(schedules.canonical_program_name, '')) = p_query
          then 300
        when schedules.normalized_text like p_query || '%'
          or schedules.comparison_key like p_query_compact || '%'
          or lower(coalesce(schedules.canonical_program_name, '')) like p_query || '%'
          then 200
        when schedules.normalized_text like '%' || p_query || '%'
          or schedules.comparison_key like '%' || p_query_compact || '%'
          or lower(coalesce(schedules.canonical_program_name, '')) like '%' || p_query || '%'
          or lower(coalesce(schedules.program_brand, '')) like '%' || p_query || '%'
          or lower(programs.name) like '%' || p_query || '%'
          then 100
        when schedules.canonical_program_name = any(coalesce(p_canonical_names, array[]::text[])) then 80
        when schedules.program_brand = any(coalesce(p_program_brands, array[]::text[])) then 82
        else 0
      end as match_score
    from class_schedules as schedules
    join gym_locations as locations on locations.id = schedules.location_id
    join gym_brands as brands on brands.id = locations.brand_id
    join programs on programs.id = schedules.program_id
    join latest_periods on latest_periods.location_id = schedules.location_id
    where locations.is_active = true
      and (
        latest_periods.latest_valid_from is null
        or schedules.valid_from = latest_periods.latest_valid_from
      )
      and (coalesce(p_weekday, '') = '' or schedules.weekday = p_weekday)
      and (
        coalesce(p_time_range, '') = ''
        or (p_time_range = 'morning' and schedules.start_time >= time '06:00' and schedules.start_time < time '12:00')
        or (p_time_range = 'afternoon' and schedules.start_time >= time '12:00' and schedules.start_time < time '17:00')
        or (p_time_range = 'evening' and schedules.start_time >= time '17:00' and schedules.start_time < time '23:00')
      )
      and (
        coalesce(p_duration_range, '') = ''
        or (p_duration_range = 'short' and schedules.duration_minutes <= 45)
        or (p_duration_range = 'medium' and schedules.duration_minutes between 46 and 59)
        or (p_duration_range = 'long' and schedules.duration_minutes >= 60)
      )
      and (
        coalesce(p_brand, '') = ''
        or lower(brands.name) like '%' || lower(p_brand) || '%'
      )
      and (
        coalesce(p_area, '') = ''
        or lower(
          concat_ws(
            ' ',
            locations.name,
            locations.slug,
            locations.prefecture,
            locations.city,
            locations.address_line
          )
        ) like '%' || lower(p_area) || '%'
      )
  ),
  matched as (
    select *
    from eligible
    where coalesce(p_query, '') = '' or match_score > 0
  ),
  ranked as (
    select
      id,
      row_number() over (
        order by
          case weekday
            when 'monday' then 0
            when 'tuesday' then 1
            when 'wednesday' then 2
            when 'thursday' then 3
            when 'friday' then 4
            when 'saturday' then 5
            when 'sunday' then 6
            else 7
          end,
          start_time,
          duration_minutes nulls last,
          match_score desc,
          location_name,
          id
      ) as row_number,
      count(*) over () as match_count,
      max(schedule_update) over () as latest_update
    from matched
  ),
  page as (
    select *
    from ranked
    where row_number > greatest(coalesce(p_offset, 0), 0)
      and row_number <= greatest(coalesce(p_offset, 0), 0) + greatest(coalesce(p_limit, 20), 1)
  ),
  stats as (
    select
      count(*)::bigint as match_count,
      max(schedule_update) as latest_update
    from matched
  )
  select
    page.id,
    page.row_number,
    page.match_count,
    page.latest_update
  from page

  union all

  select
    null::uuid,
    0::bigint,
    stats.match_count,
    stats.latest_update
  from stats
  where not exists (select 1 from page)

  order by 2;
$$;

grant execute on function search_class_schedule_page(
  text,
  text,
  text[],
  text[],
  text,
  text,
  text,
  text,
  text,
  integer,
  integer
) to anon, authenticated;
