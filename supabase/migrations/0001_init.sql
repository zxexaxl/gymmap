create extension if not exists pgcrypto;

create table if not exists gym_brands (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  official_url text,
  description text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists gym_locations (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references gym_brands(id) on delete cascade,
  name text not null,
  slug text not null unique,
  postal_code text,
  prefecture text,
  city text,
  address_line text,
  latitude numeric(9, 6),
  longitude numeric(9, 6),
  nearest_station text,
  official_url text,
  source_url text,
  is_active boolean not null default true,
  last_verified_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists programs (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  category text,
  description text,
  intensity_level integer,
  beginner_friendly boolean not null default false,
  default_duration_minutes integer,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists program_aliases (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references programs(id) on delete cascade,
  alias_name text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists class_schedules (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references gym_locations(id) on delete cascade,
  program_id uuid not null references programs(id) on delete restrict,
  raw_program_name text not null,
  weekday text not null check (weekday in ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')),
  start_time time not null,
  end_time time not null,
  duration_minutes integer,
  studio_name text,
  instructor_name text,
  source_page_url text,
  source_snapshot_id text,
  valid_from date,
  valid_to date,
  extracted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists source_pages (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references gym_locations(id) on delete cascade,
  source_type text not null,
  url text not null,
  format text,
  parser_key text,
  last_fetched_at timestamptz,
  last_parsed_at timestamptz,
  fetch_status text,
  parse_status text,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists ingestion_runs (
  id uuid primary key default gen_random_uuid(),
  started_at timestamptz not null default timezone('utc', now()),
  finished_at timestamptz,
  trigger_type text not null,
  status text not null,
  total_sources integer not null default 0,
  success_count integer not null default 0,
  failed_count integer not null default 0,
  warning_count integer not null default 0,
  logs_json jsonb
);

create table if not exists ingestion_items (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references ingestion_runs(id) on delete cascade,
  source_page_id uuid references source_pages(id) on delete set null,
  status text not null,
  detected_records integer not null default 0,
  inserted_records integer not null default 0,
  updated_records integer not null default 0,
  error_message text,
  raw_output_json jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_gym_locations_brand_id on gym_locations(brand_id);
create index if not exists idx_program_aliases_program_id on program_aliases(program_id);
create index if not exists idx_class_schedules_location_id on class_schedules(location_id);
create index if not exists idx_class_schedules_program_id on class_schedules(program_id);
create index if not exists idx_class_schedules_weekday_start_time on class_schedules(weekday, start_time);
create index if not exists idx_source_pages_location_id on source_pages(location_id);
create index if not exists idx_ingestion_items_run_id on ingestion_items(run_id);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_gym_brands_updated_at on gym_brands;
create trigger trg_gym_brands_updated_at
before update on gym_brands
for each row execute function set_updated_at();

drop trigger if exists trg_gym_locations_updated_at on gym_locations;
create trigger trg_gym_locations_updated_at
before update on gym_locations
for each row execute function set_updated_at();

drop trigger if exists trg_programs_updated_at on programs;
create trigger trg_programs_updated_at
before update on programs
for each row execute function set_updated_at();

drop trigger if exists trg_class_schedules_updated_at on class_schedules;
create trigger trg_class_schedules_updated_at
before update on class_schedules
for each row execute function set_updated_at();

drop trigger if exists trg_source_pages_updated_at on source_pages;
create trigger trg_source_pages_updated_at
before update on source_pages
for each row execute function set_updated_at();

alter table gym_brands enable row level security;
alter table gym_locations enable row level security;
alter table programs enable row level security;
alter table program_aliases enable row level security;
alter table class_schedules enable row level security;
alter table source_pages enable row level security;
alter table ingestion_runs enable row level security;
alter table ingestion_items enable row level security;

create policy "public read gym_brands" on gym_brands for select using (true);
create policy "public read gym_locations" on gym_locations for select using (true);
create policy "public read programs" on programs for select using (true);
create policy "public read program_aliases" on program_aliases for select using (true);
create policy "public read class_schedules" on class_schedules for select using (true);
create policy "public read source_pages" on source_pages for select using (true);
create policy "public read ingestion_runs" on ingestion_runs for select using (true);
create policy "public read ingestion_items" on ingestion_items for select using (true);
