create table public.location_training_disciplines (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null
    references public.gym_locations(id) on delete cascade,
  discipline_id uuid not null
    references public.training_disciplines(id) on delete restrict,
  support_state text not null default 'unknown',
  verification_status text not null default 'candidate',
  last_confirmed_at timestamptz,
  stale_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint location_training_disciplines_location_discipline_key
    unique (location_id, discipline_id),
  constraint location_training_disciplines_support_state_check
    check (support_state in ('available', 'unavailable', 'unknown')),
  constraint location_training_disciplines_verification_status_check
    check (verification_status in ('candidate', 'confirmed', 'rejected', 'disputed')),
  constraint location_training_disciplines_confirmed_freshness_check
    check (
      verification_status <> 'confirmed'
      or (
        last_confirmed_at is not null
        and stale_at is not null
        and stale_at > last_confirmed_at
      )
    )
);

create table public.location_training_capabilities (
  id uuid primary key default gen_random_uuid(),
  location_training_discipline_id uuid not null
    references public.location_training_disciplines(id) on delete cascade,
  capability_type_id uuid not null
    references public.training_capability_types(id) on delete restrict,
  availability_state text not null default 'unknown',
  access_mode text not null default 'unknown',
  reservation_requirement text not null default 'unknown',
  verification_status text not null default 'candidate',
  last_confirmed_at timestamptz,
  stale_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint location_training_capabilities_discipline_capability_key
    unique (location_training_discipline_id, capability_type_id),
  constraint location_training_capabilities_availability_state_check
    check (
      availability_state in (
        'available',
        'unavailable',
        'temporarily_unavailable',
        'unknown'
      )
    ),
  constraint location_training_capabilities_access_mode_check
    check (
      access_mode in (
        'open_training',
        'class_only',
        'coached_only',
        'appointment_only',
        'unknown'
      )
    ),
  constraint location_training_capabilities_reservation_requirement_check
    check (reservation_requirement in ('required', 'not_required', 'unknown')),
  constraint location_training_capabilities_verification_status_check
    check (verification_status in ('candidate', 'confirmed', 'rejected', 'disputed')),
  constraint location_training_capabilities_confirmed_freshness_check
    check (
      verification_status <> 'confirmed'
      or (
        last_confirmed_at is not null
        and stale_at is not null
        and stale_at > last_confirmed_at
      )
    )
);

create table public.location_equipment (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null
    references public.gym_locations(id) on delete cascade,
  equipment_type_id uuid not null
    references public.equipment_types(id) on delete restrict,
  availability_state text not null default 'unknown',
  quantity integer,
  access_mode text not null default 'unknown',
  reservation_requirement text not null default 'unknown',
  verification_status text not null default 'candidate',
  last_confirmed_at timestamptz,
  stale_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint location_equipment_location_equipment_key
    unique (location_id, equipment_type_id),
  constraint location_equipment_quantity_check
    check (quantity is null or quantity > 0),
  constraint location_equipment_availability_state_check
    check (
      availability_state in (
        'available',
        'unavailable',
        'temporarily_unavailable',
        'unknown'
      )
    ),
  constraint location_equipment_access_mode_check
    check (
      access_mode in (
        'open_training',
        'class_only',
        'coached_only',
        'appointment_only',
        'unknown'
      )
    ),
  constraint location_equipment_reservation_requirement_check
    check (reservation_requirement in ('required', 'not_required', 'unknown')),
  constraint location_equipment_verification_status_check
    check (verification_status in ('candidate', 'confirmed', 'rejected', 'disputed')),
  constraint location_equipment_confirmed_freshness_check
    check (
      verification_status <> 'confirmed'
      or (
        last_confirmed_at is not null
        and stale_at is not null
        and stale_at > last_confirmed_at
      )
    )
);

create table public.training_affiliations (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null
    references public.gym_locations(id) on delete cascade,
  discipline_id uuid not null
    references public.training_disciplines(id) on delete restrict,
  affiliation_type text not null,
  awarding_organization text not null,
  external_identifier text,
  affiliation_state text not null default 'unknown',
  verification_status text not null default 'candidate',
  valid_from date,
  valid_to date,
  last_confirmed_at timestamptz,
  stale_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint training_affiliations_canonical_key
    unique (location_id, discipline_id, affiliation_type, awarding_organization),
  constraint training_affiliations_affiliation_type_check
    check (affiliation_type <> ''),
  constraint training_affiliations_awarding_organization_check
    check (awarding_organization <> ''),
  constraint training_affiliations_affiliation_state_check
    check (affiliation_state in ('active', 'inactive', 'expired', 'revoked', 'unknown')),
  constraint training_affiliations_verification_status_check
    check (verification_status in ('candidate', 'confirmed', 'rejected', 'disputed')),
  constraint training_affiliations_valid_dates_check
    check (valid_to is null or valid_from is null or valid_to >= valid_from),
  constraint training_affiliations_confirmed_freshness_check
    check (
      verification_status <> 'confirmed'
      or (
        last_confirmed_at is not null
        and stale_at is not null
        and stale_at > last_confirmed_at
      )
    )
);

create table public.program_training_disciplines (
  program_id uuid not null
    references public.programs(id) on delete cascade,
  discipline_id uuid not null
    references public.training_disciplines(id) on delete restrict,
  relation_type text not null default 'primary',
  verification_status text not null default 'candidate',
  last_confirmed_at timestamptz,
  stale_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (program_id, discipline_id),
  constraint program_training_disciplines_relation_type_check
    check (relation_type in ('primary', 'supporting')),
  constraint program_training_disciplines_verification_status_check
    check (verification_status in ('candidate', 'confirmed', 'rejected', 'disputed')),
  constraint program_training_disciplines_confirmed_freshness_check
    check (
      verification_status <> 'confirmed'
      or (
        last_confirmed_at is not null
        and stale_at is not null
        and stale_at > last_confirmed_at
      )
    )
);

create table public.location_external_identifiers (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null
    references public.gym_locations(id) on delete cascade,
  namespace text not null,
  external_identifier text not null,
  training_source_id uuid
    references public.training_sources(id) on delete set null,
  verification_status text not null default 'candidate',
  verified_at timestamptz,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint location_external_identifiers_namespace_identifier_key
    unique (namespace, external_identifier),
  constraint location_external_identifiers_namespace_check
    check (namespace <> ''),
  constraint location_external_identifiers_external_identifier_check
    check (external_identifier <> ''),
  constraint location_external_identifiers_verification_status_check
    check (verification_status in ('candidate', 'confirmed', 'rejected', 'disputed')),
  constraint location_external_identifiers_confirmed_check
    check (verification_status <> 'confirmed' or verified_at is not null)
);

-- Evidence cannot outlive its claim target, so claim-target FKs cascade.
-- Provenance sources are protected with RESTRICT while evidence refers to them.
-- This preserves source integrity and keeps full-domain rollback dependency order explicit.
create table public.training_evidence (
  id uuid primary key default gen_random_uuid(),
  training_source_id uuid not null
    references public.training_sources(id) on delete restrict,
  location_training_discipline_id uuid
    references public.location_training_disciplines(id) on delete cascade,
  location_training_capability_id uuid
    references public.location_training_capabilities(id) on delete cascade,
  location_equipment_id uuid
    references public.location_equipment(id) on delete cascade,
  training_affiliation_id uuid
    references public.training_affiliations(id) on delete cascade,
  program_training_discipline_program_id uuid,
  program_training_discipline_discipline_id uuid,
  assertion text not null,
  review_status text not null default 'pending',
  evidence_text text,
  structured_evidence jsonb not null default '{}'::jsonb,
  observed_at timestamptz not null,
  reviewed_at timestamptz,
  reviewed_by uuid,
  content_hash text,
  created_at timestamptz not null default now(),
  constraint training_evidence_program_target_fk
    foreign key (
      program_training_discipline_program_id,
      program_training_discipline_discipline_id
    )
    references public.program_training_disciplines(program_id, discipline_id)
    on delete cascade,
  constraint training_evidence_program_target_pair_check
    check (
      (program_training_discipline_program_id is null)
      = (program_training_discipline_discipline_id is null)
    ),
  constraint training_evidence_exactly_one_target_check
    check (
      num_nonnulls(
        location_training_discipline_id,
        location_training_capability_id,
        location_equipment_id,
        training_affiliation_id
      )
      + case
          when program_training_discipline_program_id is not null then 1
          else 0
        end
      = 1
    ),
  constraint training_evidence_assertion_check
    check (assertion in ('supports', 'refutes', 'unclear')),
  constraint training_evidence_review_status_check
    check (review_status in ('pending', 'accepted', 'rejected')),
  constraint training_evidence_accepted_review_check
    check (review_status <> 'accepted' or reviewed_at is not null)
);

create unique index training_affiliations_external_identifier_key
  on public.training_affiliations (awarding_organization, external_identifier)
  where external_identifier is not null;

create index location_training_disciplines_search_idx
  on public.location_training_disciplines (
    discipline_id,
    verification_status,
    support_state,
    stale_at,
    location_id
  );

create index location_training_capabilities_search_idx
  on public.location_training_capabilities (
    capability_type_id,
    verification_status,
    availability_state,
    stale_at
  );

create index location_equipment_search_idx
  on public.location_equipment (
    equipment_type_id,
    verification_status,
    availability_state,
    stale_at,
    location_id
  );

create index training_affiliations_search_idx
  on public.training_affiliations (
    discipline_id,
    affiliation_type,
    affiliation_state,
    verification_status,
    stale_at,
    location_id
  );

create index program_training_disciplines_search_idx
  on public.program_training_disciplines (
    discipline_id,
    verification_status,
    stale_at,
    program_id
  );

create index location_external_identifiers_location_namespace_idx
  on public.location_external_identifiers (location_id, namespace);

create index training_evidence_source_observed_at_idx
  on public.training_evidence (training_source_id, observed_at desc);

create index training_evidence_location_discipline_idx
  on public.training_evidence (location_training_discipline_id);

create index training_evidence_location_capability_idx
  on public.training_evidence (location_training_capability_id);

create index training_evidence_location_equipment_idx
  on public.training_evidence (location_equipment_id);

create index training_evidence_affiliation_idx
  on public.training_evidence (training_affiliation_id);

create index training_evidence_program_discipline_idx
  on public.training_evidence (
    program_training_discipline_program_id,
    program_training_discipline_discipline_id
  );

create index training_evidence_pending_review_idx
  on public.training_evidence (review_status, observed_at)
  where review_status = 'pending';

create trigger trg_location_training_disciplines_updated_at
before update on public.location_training_disciplines
for each row execute function public.set_updated_at();

create trigger trg_location_training_capabilities_updated_at
before update on public.location_training_capabilities
for each row execute function public.set_updated_at();

create trigger trg_location_equipment_updated_at
before update on public.location_equipment
for each row execute function public.set_updated_at();

create trigger trg_training_affiliations_updated_at
before update on public.training_affiliations
for each row execute function public.set_updated_at();

create trigger trg_program_training_disciplines_updated_at
before update on public.program_training_disciplines
for each row execute function public.set_updated_at();

create trigger trg_location_external_identifiers_updated_at
before update on public.location_external_identifiers
for each row execute function public.set_updated_at();

alter table public.location_training_disciplines enable row level security;
alter table public.location_training_capabilities enable row level security;
alter table public.location_equipment enable row level security;
alter table public.training_affiliations enable row level security;
alter table public.program_training_disciplines enable row level security;
alter table public.location_external_identifiers enable row level security;
alter table public.training_evidence enable row level security;

revoke all on table public.location_training_disciplines from public, anon, authenticated;
revoke all on table public.location_training_capabilities from public, anon, authenticated;
revoke all on table public.location_equipment from public, anon, authenticated;
revoke all on table public.training_affiliations from public, anon, authenticated;
revoke all on table public.program_training_disciplines from public, anon, authenticated;
revoke all on table public.location_external_identifiers from public, anon, authenticated;
revoke all on table public.training_evidence from public, anon, authenticated;

grant all on table public.location_training_disciplines to service_role;
grant all on table public.location_training_capabilities to service_role;
grant all on table public.location_equipment to service_role;
grant all on table public.training_affiliations to service_role;
grant all on table public.program_training_disciplines to service_role;
grant all on table public.location_external_identifiers to service_role;
grant all on table public.training_evidence to service_role;
