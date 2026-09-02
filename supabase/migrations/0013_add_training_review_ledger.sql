-- H3-11B: internal, additive Review Coverage Ledger persistence.
--
-- This migration records what was reviewed. It does not create equipment,
-- capability, negative, or derived-station claims and is intentionally absent
-- from every public publication view and RPC.

create table public.training_review_protocols (
  id uuid primary key default gen_random_uuid(),
  discipline_id uuid not null,
  protocol_key text not null,
  protocol_version text not null,
  authority_commit_sha text not null,
  authority_document_path text not null,
  authority_document_sha256 text not null,
  authority_matrix_path text not null,
  authority_matrix_sha256 text not null,
  created_at timestamptz not null default now(),
  constraint training_review_protocols_discipline_fk
    foreign key (discipline_id)
    references public.training_disciplines(id) on delete restrict,
  constraint training_review_protocols_key_version_key
    unique (discipline_id, protocol_key, protocol_version),
  constraint training_review_protocols_id_discipline_key
    unique (id, discipline_id),
  constraint training_review_protocols_protocol_key_check
    check (protocol_key ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint training_review_protocols_protocol_version_check
    check (btrim(protocol_version) <> ''),
  constraint training_review_protocols_authority_commit_sha_check
    check (authority_commit_sha ~ '^[0-9a-f]{40}$'),
  constraint training_review_protocols_document_path_check
    check (btrim(authority_document_path) <> ''),
  constraint training_review_protocols_document_sha256_check
    check (authority_document_sha256 ~ '^[0-9a-f]{64}$'),
  constraint training_review_protocols_matrix_path_check
    check (btrim(authority_matrix_path) <> ''),
  constraint training_review_protocols_matrix_sha256_check
    check (authority_matrix_sha256 ~ '^[0-9a-f]{64}$')
);

create table public.training_review_dimensions (
  id uuid primary key default gen_random_uuid(),
  discipline_id uuid not null,
  slug text not null,
  name text not null,
  dimension_kind text not null,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint training_review_dimensions_discipline_fk
    foreign key (discipline_id)
    references public.training_disciplines(id) on delete restrict,
  constraint training_review_dimensions_discipline_slug_key
    unique (discipline_id, slug),
  constraint training_review_dimensions_id_discipline_key
    unique (id, discipline_id),
  constraint training_review_dimensions_slug_check
    check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint training_review_dimensions_name_check
    check (btrim(name) <> ''),
  constraint training_review_dimensions_kind_check
    check (dimension_kind in ('WORKOUT_STATION', 'AUXILIARY', 'FACILITY_IDENTITY')),
  constraint training_review_dimensions_display_order_check
    check (display_order >= 0)
);

create table public.training_review_cycles (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null,
  discipline_id uuid not null,
  protocol_id uuid not null,
  cycle_key text not null,
  cycle_kind text not null default 'REVIEW',
  reviewed_at timestamptz not null,
  reviewer_authority text not null,
  supersedes_review_cycle_id uuid,
  supersession_reason text,
  notes text,
  created_at timestamptz not null default now(),
  constraint training_review_cycles_location_fk
    foreign key (location_id)
    references public.gym_locations(id) on delete restrict,
  constraint training_review_cycles_discipline_fk
    foreign key (discipline_id)
    references public.training_disciplines(id) on delete restrict,
  constraint training_review_cycles_protocol_discipline_fk
    foreign key (protocol_id, discipline_id)
    references public.training_review_protocols(id, discipline_id) on delete restrict,
  constraint training_review_cycles_location_discipline_protocol_cycle_key
    unique (location_id, discipline_id, protocol_id, cycle_key),
  constraint training_review_cycles_id_location_discipline_key
    unique (id, location_id, discipline_id),
  constraint training_review_cycles_id_discipline_key
    unique (id, discipline_id),
  constraint training_review_cycles_supersedes_same_scope_fk
    foreign key (supersedes_review_cycle_id, location_id, discipline_id)
    references public.training_review_cycles(id, location_id, discipline_id)
    on delete restrict,
  constraint training_review_cycles_cycle_key_check
    check (btrim(cycle_key) <> ''),
  constraint training_review_cycles_kind_check
    check (cycle_kind in ('REVIEW', 'ADMINISTRATIVE_CORRECTION')),
  constraint training_review_cycles_reviewer_authority_check
    check (btrim(reviewer_authority) <> ''),
  constraint training_review_cycles_supersession_check
    check (
      (
        supersedes_review_cycle_id is null
        and supersession_reason is null
      )
      or (
        supersedes_review_cycle_id is not null
        and btrim(coalesce(supersession_reason, '')) <> ''
      )
    ),
  constraint training_review_cycles_correction_supersedes_check
    check (cycle_kind <> 'ADMINISTRATIVE_CORRECTION' or supersedes_review_cycle_id is not null),
  constraint training_review_cycles_no_self_supersession_check
    check (supersedes_review_cycle_id is null or supersedes_review_cycle_id <> id)
);

create table public.training_review_units (
  id uuid primary key default gen_random_uuid(),
  review_cycle_id uuid not null,
  discipline_id uuid not null,
  review_dimension_id uuid not null,
  review_aspect text not null,
  review_progress text not null,
  source_sufficiency text not null,
  positive_outcome text not null,
  freshness_policy_key_at_review text,
  coverage_expires_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  constraint training_review_units_cycle_discipline_fk
    foreign key (review_cycle_id, discipline_id)
    references public.training_review_cycles(id, discipline_id) on delete restrict,
  constraint training_review_units_dimension_discipline_fk
    foreign key (review_dimension_id, discipline_id)
    references public.training_review_dimensions(id, discipline_id) on delete restrict,
  constraint training_review_units_cycle_dimension_aspect_key
    unique (review_cycle_id, review_dimension_id, review_aspect),
  constraint training_review_units_id_discipline_key
    unique (id, discipline_id),
  constraint training_review_units_aspect_check
    check (
      review_aspect in (
        'FACILITY_IDENTITY',
        'EQUIPMENT_FACT',
        'SPACE_FACT',
        'USAGE_ACCESS_FACT',
        'COACHING_PROGRAM_FACT'
      )
    ),
  constraint training_review_units_progress_check
    check (review_progress in ('UNREVIEWED', 'PARTIAL', 'COMPLETE')),
  constraint training_review_units_source_sufficiency_check
    check (source_sufficiency in ('UNKNOWN', 'SUFFICIENT', 'INSUFFICIENT', 'BLOCKED')),
  constraint training_review_units_positive_outcome_check
    check (positive_outcome in ('NOT_ASSESSED', 'POSITIVE_FOUND', 'NO_POSITIVE_FOUND')),
  constraint training_review_units_unreviewed_state_check
    check (
      review_progress <> 'UNREVIEWED'
      or (
        source_sufficiency = 'UNKNOWN'
        and positive_outcome = 'NOT_ASSESSED'
      )
    ),
  constraint training_review_units_complete_requires_sufficient_check
    check (review_progress <> 'COMPLETE' or source_sufficiency = 'SUFFICIENT'),
  constraint training_review_units_no_positive_requires_complete_check
    check (
      positive_outcome <> 'NO_POSITIVE_FOUND'
      or (
        review_progress = 'COMPLETE'
        and source_sufficiency = 'SUFFICIENT'
      )
    ),
  constraint training_review_units_freshness_policy_key_check
    check (
      freshness_policy_key_at_review is null
      or btrim(freshness_policy_key_at_review) <> ''
    ),
  constraint training_review_units_expiry_policy_check
    check (coverage_expires_at is null or freshness_policy_key_at_review is not null)
);

create table public.training_review_unit_sources (
  id uuid primary key default gen_random_uuid(),
  review_unit_id uuid not null,
  training_source_id uuid not null,
  source_class text not null,
  facility_binding text not null,
  sufficiency_role text not null,
  observed_at timestamptz not null,
  reviewed_at timestamptz not null,
  source_availability_state_at_review text not null,
  source_content_hash_at_review text,
  binding_basis text,
  notes text,
  created_at timestamptz not null default now(),
  constraint training_review_unit_sources_unit_fk
    foreign key (review_unit_id)
    references public.training_review_units(id) on delete restrict,
  constraint training_review_unit_sources_source_fk
    foreign key (training_source_id)
    references public.training_sources(id) on delete restrict,
  constraint training_review_unit_sources_unit_source_class_key
    unique (review_unit_id, training_source_id, source_class),
  constraint training_review_unit_sources_source_class_check
    check (
      source_class in (
        'GOVERNING_BODY_FINDER_DETAIL',
        'FACILITY_SPECIFIC_OFFICIAL_PAGE',
        'BRAND_OFFICIAL_FACILITY_PAGE',
        'OFFICIAL_EQUIPMENT_PAGE',
        'OFFICIAL_HYROX_TRAINING_PAGE',
        'OFFICIAL_PROGRAM_SERVICE_PAGE',
        'OFFICIAL_BOOKING_MEMBER_SYSTEM',
        'OFFICIAL_SCHEDULE_PAGE',
        'OFFICIAL_SOCIAL_MEDIA',
        'OFFICIAL_IMAGE_GALLERY'
      )
    ),
  constraint training_review_unit_sources_facility_binding_check
    check (
      facility_binding in (
        'FACILITY_SPECIFIC',
        'BRAND_FACILITY_SPECIFIC',
        'GENERIC_NON_FACILITY_BOUND',
        'UNKNOWN_INSUFFICIENT'
      )
    ),
  constraint training_review_unit_sources_sufficiency_role_check
    check (
      sufficiency_role in (
        'PRIMARY',
        'SUPPORTING',
        'CONTEXT_ONLY',
        'INSUFFICIENT',
        'BLOCKED'
      )
    ),
  constraint training_review_unit_sources_review_time_check
    check (reviewed_at >= observed_at),
  constraint training_review_unit_sources_availability_check
    check (source_availability_state_at_review in ('available', 'unavailable', 'removed', 'unknown')),
  constraint training_review_unit_sources_binding_basis_check
    check (binding_basis is null or btrim(binding_basis) <> '')
);

create table public.training_review_invalidations (
  id uuid primary key default gen_random_uuid(),
  review_unit_id uuid not null,
  discipline_id uuid not null,
  invalidation_key text not null,
  reason_code text not null,
  invalidated_at timestamptz not null,
  invalidation_authority text not null,
  training_source_id uuid,
  replacement_protocol_id uuid,
  details text,
  created_at timestamptz not null default now(),
  constraint training_review_invalidations_unit_discipline_fk
    foreign key (review_unit_id, discipline_id)
    references public.training_review_units(id, discipline_id) on delete restrict,
  constraint training_review_invalidations_source_fk
    foreign key (training_source_id)
    references public.training_sources(id) on delete restrict,
  constraint training_review_invalidations_protocol_discipline_fk
    foreign key (replacement_protocol_id, discipline_id)
    references public.training_review_protocols(id, discipline_id) on delete restrict,
  constraint training_review_invalidations_unit_key
    unique (review_unit_id, invalidation_key),
  constraint training_review_invalidations_key_check
    check (btrim(invalidation_key) <> ''),
  constraint training_review_invalidations_reason_check
    check (
      reason_code in (
        'MATERIAL_SOURCE_DRIFT',
        'FACILITY_BINDING_LOSS',
        'SOURCE_REPLACED',
        'PROTOCOL_INCOMPATIBLE',
        'HUMAN_INVALIDATION',
        'OTHER'
      )
    ),
  constraint training_review_invalidations_authority_check
    check (btrim(invalidation_authority) <> '')
);

create index training_review_protocols_lookup_idx
  on public.training_review_protocols (discipline_id, protocol_key, protocol_version);

create index training_review_dimensions_lookup_idx
  on public.training_review_dimensions (discipline_id, dimension_kind, display_order);

create index training_review_cycles_history_idx
  on public.training_review_cycles (location_id, discipline_id, reviewed_at desc);

create index training_review_units_coverage_idx
  on public.training_review_units (
    discipline_id,
    review_dimension_id,
    review_aspect,
    review_progress,
    source_sufficiency,
    positive_outcome
  );

create index training_review_units_expiry_idx
  on public.training_review_units (coverage_expires_at)
  where coverage_expires_at is not null;

create index training_review_unit_sources_source_idx
  on public.training_review_unit_sources (training_source_id, reviewed_at desc);

create index training_review_invalidations_unit_idx
  on public.training_review_invalidations (review_unit_id, invalidated_at desc);

comment on table public.training_review_protocols is
  'Internal immutable protocol-version authority for review ledger events; never a public claim.';
comment on table public.training_review_dimensions is
  'Internal authority-backed review dimensions, including eight HYROX workout stations and non-station dimensions.';
comment on table public.training_review_cycles is
  'Append-only review events/cycles. New reviews and administrative corrections use new rows; history is not overwritten.';
comment on table public.training_review_units is
  'Atomic internal facility x discipline x dimension x aspect x protocol x cycle review state; NO_POSITIVE_FOUND is not a negative facility fact.';
comment on table public.training_review_unit_sources is
  'Review-time source-set relation with logical source class, facility binding, sufficiency role, state, and hash snapshots.';
comment on table public.training_review_invalidations is
  'Append-only currentness invalidation evidence; historical review units remain stored.';

alter table public.training_review_protocols enable row level security;
alter table public.training_review_dimensions enable row level security;
alter table public.training_review_cycles enable row level security;
alter table public.training_review_units enable row level security;
alter table public.training_review_unit_sources enable row level security;
alter table public.training_review_invalidations enable row level security;

revoke all on table public.training_review_protocols from public, anon, authenticated;
revoke all on table public.training_review_dimensions from public, anon, authenticated;
revoke all on table public.training_review_cycles from public, anon, authenticated;
revoke all on table public.training_review_units from public, anon, authenticated;
revoke all on table public.training_review_unit_sources from public, anon, authenticated;
revoke all on table public.training_review_invalidations from public, anon, authenticated;

-- Protocol and dimension taxonomy change only through reviewed migrations.
grant select on table public.training_review_protocols to service_role;
grant select on table public.training_review_dimensions to service_role;

-- Review history is append-only for the internal service path. A correction or
-- supersession is a new cycle/event, not an UPDATE or DELETE of history.
grant select, insert on table public.training_review_cycles to service_role;
grant select, insert on table public.training_review_units to service_role;
grant select, insert on table public.training_review_unit_sources to service_role;
grant select, insert on table public.training_review_invalidations to service_role;

insert into public.training_review_protocols (
  discipline_id,
  protocol_key,
  protocol_version,
  authority_commit_sha,
  authority_document_path,
  authority_document_sha256,
  authority_matrix_path,
  authority_matrix_sha256
)
select
  discipline.id,
  'hyrox-review-coverage',
  'h3-11a-v1',
  '0615892b7e228c7628e2e1859c8963bdaa669538',
  'docs/hyrox-h3-11a-review-evidence-authority.md',
  '384c6afa552c39feabacae607fe36aa995ccc510de66a20dd1bac53afe5036de',
  'data/hyrox/h3-11a-station-evidence-authority.json',
  '084b15ef8758bff633ee2b2655ba509bd00ff3c5963a52bd4d597658c6aabc92'
from public.training_disciplines discipline
where discipline.slug = 'hyrox';

insert into public.training_review_dimensions (
  discipline_id,
  slug,
  name,
  dimension_kind,
  display_order
)
select
  discipline.id,
  dimension.slug,
  dimension.name,
  dimension.dimension_kind,
  dimension.display_order
from public.training_disciplines discipline
cross join (
  values
    ('ski-erg', 'SkiErg', 'WORKOUT_STATION', 10),
    ('sled-push', 'Sled Push', 'WORKOUT_STATION', 20),
    ('sled-pull', 'Sled Pull', 'WORKOUT_STATION', 30),
    ('burpee-broad-jump', 'Burpee Broad Jump', 'WORKOUT_STATION', 40),
    ('row', 'Row', 'WORKOUT_STATION', 50),
    ('farmers-carry', 'Farmers Carry', 'WORKOUT_STATION', 60),
    ('sandbag-lunges', 'Sandbag Lunges', 'WORKOUT_STATION', 70),
    ('wall-balls', 'Wall Balls', 'WORKOUT_STATION', 80),
    ('running-environment', 'Running environment', 'AUXILIARY', 90),
    ('facility-identity', 'Facility identity', 'FACILITY_IDENTITY', 100)
) as dimension(slug, name, dimension_kind, display_order)
where discipline.slug = 'hyrox';
