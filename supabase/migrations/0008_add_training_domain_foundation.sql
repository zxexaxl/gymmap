create table public.training_disciplines (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null unique,
  description text,
  is_active boolean not null default true,
  default_stale_after_days integer not null default 90,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint training_disciplines_slug_check
    check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint training_disciplines_default_stale_after_days_check
    check (default_stale_after_days between 1 and 3650)
);

create table public.training_capability_types (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null unique,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint training_capability_types_slug_check
    check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create table public.equipment_types (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null unique,
  category text,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint equipment_types_slug_check
    check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create table public.discipline_equipment_requirements (
  discipline_id uuid not null
    references public.training_disciplines(id) on delete cascade,
  equipment_type_id uuid not null
    references public.equipment_types(id) on delete restrict,
  requirement_level text not null,
  display_order integer not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (discipline_id, equipment_type_id),
  constraint discipline_equipment_requirements_level_check
    check (requirement_level in ('core', 'recommended', 'optional')),
  constraint discipline_equipment_requirements_display_order_check
    check (display_order >= 0)
);

create table public.training_sources (
  id uuid primary key default gen_random_uuid(),
  location_id uuid
    references public.gym_locations(id) on delete set null,
  url text not null,
  canonical_url text,
  source_kind text not null,
  publisher_authority text not null,
  availability_state text not null default 'unknown',
  last_checked_at timestamptz,
  unavailable_since timestamptz,
  last_changed_at timestamptz,
  review_required boolean not null default false,
  content_hash text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint training_sources_url_check check (url <> ''),
  constraint training_sources_source_kind_check check (
    source_kind in (
      'finder',
      'facility_page',
      'schedule',
      'social_post',
      'search_result',
      'other'
    )
  ),
  constraint training_sources_publisher_authority_check check (
    publisher_authority in (
      'governing_body',
      'facility_official',
      'official_schedule',
      'official_social',
      'third_party',
      'discovery'
    )
  ),
  constraint training_sources_availability_state_check check (
    availability_state in ('available', 'unavailable', 'removed', 'unknown')
  ),
  constraint training_sources_unavailable_since_check check (
    (
      availability_state in ('unavailable', 'removed')
      and unavailable_since is not null
    )
    or (
      availability_state = 'available'
      and unavailable_since is null
    )
    or availability_state = 'unknown'
  )
);

create index discipline_equipment_requirements_lookup_idx
  on public.discipline_equipment_requirements (
    discipline_id,
    requirement_level,
    display_order
  );

create index training_sources_location_id_idx
  on public.training_sources (location_id);

create index training_sources_review_queue_idx
  on public.training_sources (
    publisher_authority,
    availability_state,
    review_required
  );

create index training_sources_canonical_url_idx
  on public.training_sources (canonical_url);

create index training_sources_last_checked_at_idx
  on public.training_sources (last_checked_at);

create trigger trg_training_disciplines_updated_at
before update on public.training_disciplines
for each row execute function public.set_updated_at();

create trigger trg_training_capability_types_updated_at
before update on public.training_capability_types
for each row execute function public.set_updated_at();

create trigger trg_equipment_types_updated_at
before update on public.equipment_types
for each row execute function public.set_updated_at();

create trigger trg_discipline_equipment_requirements_updated_at
before update on public.discipline_equipment_requirements
for each row execute function public.set_updated_at();

create trigger trg_training_sources_updated_at
before update on public.training_sources
for each row execute function public.set_updated_at();

alter table public.training_disciplines enable row level security;
alter table public.training_capability_types enable row level security;
alter table public.equipment_types enable row level security;
alter table public.discipline_equipment_requirements enable row level security;
alter table public.training_sources enable row level security;

create policy "active training disciplines are public"
on public.training_disciplines
for select
to anon, authenticated
using (is_active = true);

create policy "active training capability types are public"
on public.training_capability_types
for select
to anon, authenticated
using (is_active = true);

create policy "active equipment types are public"
on public.equipment_types
for select
to anon, authenticated
using (is_active = true);

create policy "active discipline equipment requirements are public"
on public.discipline_equipment_requirements
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.training_disciplines
    where training_disciplines.id = discipline_equipment_requirements.discipline_id
      and training_disciplines.is_active = true
  )
  and exists (
    select 1
    from public.equipment_types
    where equipment_types.id = discipline_equipment_requirements.equipment_type_id
      and equipment_types.is_active = true
  )
);

revoke all on table public.training_disciplines from public, anon, authenticated;
revoke all on table public.training_capability_types from public, anon, authenticated;
revoke all on table public.equipment_types from public, anon, authenticated;
revoke all on table public.discipline_equipment_requirements from public, anon, authenticated;
revoke all on table public.training_sources from public, anon, authenticated;

grant select on table public.training_disciplines to anon, authenticated;
grant select on table public.training_capability_types to anon, authenticated;
grant select on table public.equipment_types to anon, authenticated;
grant select on table public.discipline_equipment_requirements to anon, authenticated;

grant all on table public.training_disciplines to service_role;
grant all on table public.training_capability_types to service_role;
grant all on table public.equipment_types to service_role;
grant all on table public.discipline_equipment_requirements to service_role;
grant all on table public.training_sources to service_role;

insert into public.training_disciplines (
  slug,
  name,
  description,
  default_stale_after_days
)
values (
  'hyrox',
  'HYROX',
  'A fitness racing discipline combining running with functional workout stations.',
  90
)
on conflict do nothing;

insert into public.training_capability_types (slug, name)
values
  ('open-training', 'Open Training'),
  ('discipline-coaching', 'Discipline Coaching'),
  ('competition-simulation', 'Competition Simulation'),
  ('sled-push-pull-space', 'Sled Push / Pull Space'),
  ('outdoor-running-access', 'Outdoor Running Access')
on conflict do nothing;

insert into public.equipment_types (slug, name, category)
values
  ('ski-erg', 'SkiErg', 'ergometer'),
  ('row-erg', 'RowErg', 'ergometer'),
  ('weighted-sled', 'Weighted Sled', 'resistance'),
  ('wall-ball-target', 'Wall Ball Target', 'target'),
  ('farmers-carry-implements', 'Farmers Carry Implements', 'carry'),
  ('sandbag', 'Sandbag', 'carry'),
  ('functional-training-lane', 'Functional Training Lane', 'training-space'),
  ('treadmill', 'Treadmill', 'running'),
  ('running-track', 'Running Track', 'running')
on conflict do nothing;

-- These levels model a useful HYROX training setup for GymMap's foundation
-- data. They do not determine whether a location is publication-eligible.
insert into public.discipline_equipment_requirements (
  discipline_id,
  equipment_type_id,
  requirement_level,
  display_order,
  notes
)
select
  discipline.id,
  equipment.id,
  requirement.requirement_level,
  requirement.display_order,
  requirement.notes
from public.training_disciplines discipline
cross join (
  values
    ('ski-erg', 'core', 10, null::text),
    ('row-erg', 'core', 20, null::text),
    ('weighted-sled', 'core', 30, 'Requires a separate sled push / pull space capability.'),
    ('wall-ball-target', 'core', 40, null::text),
    ('farmers-carry-implements', 'core', 50, null::text),
    ('sandbag', 'core', 60, null::text),
    ('functional-training-lane', 'core', 70, null::text),
    ('treadmill', 'recommended', 80, 'Running access may also be provided outside the facility.'),
    ('running-track', 'optional', 90, 'An alternative or supplement to treadmill and outdoor running access.')
) as requirement(equipment_slug, requirement_level, display_order, notes)
join public.equipment_types equipment
  on equipment.slug = requirement.equipment_slug
where discipline.slug = 'hyrox'
on conflict do nothing;
