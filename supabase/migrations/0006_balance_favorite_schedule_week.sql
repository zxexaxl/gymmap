create or replace function favorite_class_schedule_week(
  p_program_ids uuid[] default array[]::uuid[],
  p_area text default '',
  p_start_weekday integer default 0,
  p_limit integer default 120
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
      schedules.start_time,
      schedules.duration_minutes,
      programs.name as program_name,
      locations.name as location_name,
      coalesce(schedules.extracted_at, schedules.updated_at) as schedule_update,
      case schedules.weekday
        when 'monday' then 0
        when 'tuesday' then 1
        when 'wednesday' then 2
        when 'thursday' then 3
        when 'friday' then 4
        when 'saturday' then 5
        when 'sunday' then 6
        else 7
      end as weekday_index
    from class_schedules as schedules
    join gym_locations as locations on locations.id = schedules.location_id
    join programs on programs.id = schedules.program_id
    join latest_periods on latest_periods.location_id = schedules.location_id
    where locations.is_active = true
      and schedules.program_id = any(coalesce(p_program_ids, array[]::uuid[]))
      and (
        latest_periods.latest_valid_from is null
        or schedules.valid_from = latest_periods.latest_valid_from
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
            locations.address_line,
            locations.nearest_station
          )
        ) like '%' || lower(p_area) || '%'
      )
  ),
  day_ranked as (
    select
      eligible.*,
      row_number() over (
        partition by weekday_index
        order by start_time, duration_minutes nulls last, program_name, location_name, id
      ) as day_row_number
    from eligible
  ),
  selected as (
    select *
    from day_ranked
    order by
      day_row_number,
      mod(weekday_index - greatest(least(coalesce(p_start_weekday, 0), 6), 0) + 7, 7),
      start_time,
      program_name,
      location_name,
      id
    limit greatest(least(coalesce(p_limit, 120), 200), 1)
  ),
  ordered as (
    select
      id,
      row_number() over (
        order by
          mod(weekday_index - greatest(least(coalesce(p_start_weekday, 0), 6), 0) + 7, 7),
          start_time,
          duration_minutes nulls last,
          program_name,
          location_name,
          id
      ) as row_number
    from selected
  ),
  stats as (
    select
      count(*)::bigint as match_count,
      max(schedule_update) as latest_update
    from eligible
  )
  select
    ordered.id,
    ordered.row_number,
    stats.match_count,
    stats.latest_update
  from ordered
  cross join stats

  union all

  select
    null::uuid,
    0::bigint,
    stats.match_count,
    stats.latest_update
  from stats
  where not exists (select 1 from ordered)

  order by 2;
$$;
