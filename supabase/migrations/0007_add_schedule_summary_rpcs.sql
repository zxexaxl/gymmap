-- Summary-only RPCs for public schedule reads. Both preserve the existing
-- latest-period rule: dated rows use the latest date per location; locations
-- without any dated row keep their legacy undated schedules.

create or replace function public.get_latest_schedule_periods_by_location()
returns table (
  location_id uuid,
  latest_valid_from date
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    schedules.location_id,
    max(schedules.valid_from) as latest_valid_from
  from public.class_schedules as schedules
  where schedules.valid_from is not null
  group by schedules.location_id
  order by schedules.location_id;
$$;

create or replace function public.get_popular_program_summary()
returns table (
  id uuid,
  name text,
  slug text,
  category text,
  description text,
  intensity_level integer,
  beginner_friendly boolean,
  default_duration_minutes integer,
  created_at timestamptz,
  updated_at timestamptz,
  schedule_count bigint
)
language sql
stable
security invoker
set search_path = public
as $$
  with latest_periods as (
    select
      schedules.location_id,
      max(schedules.valid_from) filter (where schedules.valid_from is not null) as latest_valid_from
    from public.class_schedules as schedules
    group by schedules.location_id
  ),
  current_schedule_counts as (
    select
      schedules.program_id,
      count(*)::bigint as schedule_count
    from public.class_schedules as schedules
    join latest_periods on latest_periods.location_id = schedules.location_id
    where latest_periods.latest_valid_from is null
      or schedules.valid_from = latest_periods.latest_valid_from
    group by schedules.program_id
  )
  select
    programs.id,
    programs.name,
    programs.slug,
    programs.category,
    programs.description,
    programs.intensity_level,
    programs.beginner_friendly,
    programs.default_duration_minutes,
    programs.created_at,
    programs.updated_at,
    current_schedule_counts.schedule_count
  from public.programs as programs
  join current_schedule_counts on current_schedule_counts.program_id = programs.id;
$$;

-- The application reads public data with the anon key. Revoke PostgreSQL's
-- default PUBLIC execute privilege, then grant only the roles used by it.
revoke all on function public.get_latest_schedule_periods_by_location() from public;
revoke all on function public.get_popular_program_summary() from public;

grant execute on function public.get_latest_schedule_periods_by_location() to anon, authenticated;
grant execute on function public.get_popular_program_summary() to anon, authenticated;

-- Rollback:
-- drop function public.get_latest_schedule_periods_by_location();
-- drop function public.get_popular_program_summary();
