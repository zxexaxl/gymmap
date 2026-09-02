-- H3-11D-R1: internal raw-positive-fact and explicit-restriction persistence.
--
-- These objects preserve source-backed observations that do not fit the
-- existing equipment/capability claim models. They do not publish facts,
-- encode absence, derive station capability, or import Cohort 1 data.

-- Composite keys let the new objects prove that location, discipline, cycle,
-- aspect, dimension, review unit, and reviewed source all belong together.
create unique index training_review_units_raw_fact_scope_key
  on public.training_review_units (
    id,
    review_cycle_id,
    discipline_id,
    review_aspect
  );

create unique index training_review_units_raw_fact_dimension_scope_key
  on public.training_review_units (
    id,
    review_cycle_id,
    discipline_id,
    review_dimension_id,
    review_aspect
  );

create unique index training_review_unit_sources_raw_fact_scope_key
  on public.training_review_unit_sources (
    id,
    review_unit_id,
    training_source_id,
    source_class
  );

create table public.training_raw_fact_types (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  fact_family text not null,
  review_aspect text not null,
  description text not null,
  created_at timestamptz not null default now(),
  constraint training_raw_fact_types_id_aspect_key
    unique (id, review_aspect),
  constraint training_raw_fact_types_slug_check
    check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint training_raw_fact_types_family_check
    check (
      fact_family in (
        'PHYSICAL_COMPONENT',
        'SPACE_ENVIRONMENT',
        'USAGE_ACCESS',
        'SOURCE_ASSERTION'
      )
    ),
  constraint training_raw_fact_types_aspect_check
    check (
      review_aspect in (
        'EQUIPMENT_FACT',
        'SPACE_FACT',
        'USAGE_ACCESS_FACT'
      )
    ),
  constraint training_raw_fact_types_family_aspect_check
    check (
      (fact_family = 'PHYSICAL_COMPONENT' and review_aspect = 'EQUIPMENT_FACT')
      or (fact_family = 'SOURCE_ASSERTION' and review_aspect = 'EQUIPMENT_FACT')
      or (fact_family = 'SPACE_ENVIRONMENT' and review_aspect = 'SPACE_FACT')
      or (fact_family = 'USAGE_ACCESS' and review_aspect = 'USAGE_ACCESS_FACT')
    ),
  constraint training_raw_fact_types_description_check
    check (btrim(description) <> '')
);

create table public.training_raw_facts (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null,
  discipline_id uuid not null,
  review_cycle_id uuid not null,
  review_unit_id uuid not null,
  review_unit_source_id uuid not null,
  training_source_id uuid not null,
  source_class text not null,
  fact_type_id uuid not null,
  review_aspect text not null,
  fact_key text not null,
  statement text not null,
  evidence_text text not null,
  evidence_location_context text,
  directness text not null,
  observed_at timestamptz not null,
  reviewed_at timestamptz not null,
  reviewer_authority text not null,
  source_content_hash_at_review text,
  freshness_policy_key text,
  freshness_expires_at timestamptz,
  created_at timestamptz not null default now(),
  constraint training_raw_facts_cycle_location_discipline_fk
    foreign key (review_cycle_id, location_id, discipline_id)
    references public.training_review_cycles(id, location_id, discipline_id)
    on delete restrict,
  constraint training_raw_facts_unit_scope_fk
    foreign key (
      review_unit_id,
      review_cycle_id,
      discipline_id,
      review_aspect
    )
    references public.training_review_units(
      id,
      review_cycle_id,
      discipline_id,
      review_aspect
    )
    on delete restrict,
  constraint training_raw_facts_unit_source_fk
    foreign key (
      review_unit_source_id,
      review_unit_id,
      training_source_id,
      source_class
    )
    references public.training_review_unit_sources(
      id,
      review_unit_id,
      training_source_id,
      source_class
    )
    on delete restrict,
  constraint training_raw_facts_type_aspect_fk
    foreign key (fact_type_id, review_aspect)
    references public.training_raw_fact_types(id, review_aspect)
    on delete restrict,
  constraint training_raw_facts_cycle_fact_key
    unique (review_cycle_id, fact_key),
  constraint training_raw_facts_id_scope_key
    unique (id, review_cycle_id, discipline_id, review_aspect),
  constraint training_raw_facts_fact_key_check
    check (btrim(fact_key) <> ''),
  constraint training_raw_facts_statement_check
    check (btrim(statement) <> ''),
  constraint training_raw_facts_evidence_text_check
    check (btrim(evidence_text) <> ''),
  constraint training_raw_facts_context_check
    check (
      evidence_location_context is null
      or btrim(evidence_location_context) <> ''
    ),
  constraint training_raw_facts_directness_check
    check (
      directness in (
        'DIRECT_TEXT',
        'DIRECT_IMAGE',
        'DIRECT_STRUCTURED_DATA'
      )
    ),
  constraint training_raw_facts_review_time_check
    check (reviewed_at >= observed_at),
  constraint training_raw_facts_reviewer_check
    check (btrim(reviewer_authority) <> ''),
  constraint training_raw_facts_content_hash_check
    check (
      source_content_hash_at_review is null
      or source_content_hash_at_review ~ '^[0-9a-f]{64}$'
    ),
  constraint training_raw_facts_freshness_policy_check
    check (
      freshness_policy_key is null
      or btrim(freshness_policy_key) <> ''
    ),
  constraint training_raw_facts_freshness_expiry_check
    check (
      freshness_expires_at is null
      or (
        freshness_policy_key is not null
        and freshness_expires_at > reviewed_at
      )
    )
);

create table public.training_raw_fact_dimensions (
  raw_fact_id uuid not null,
  review_cycle_id uuid not null,
  discipline_id uuid not null,
  review_aspect text not null,
  review_dimension_id uuid not null,
  review_unit_id uuid not null,
  review_unit_source_id uuid not null,
  training_source_id uuid not null,
  source_class text not null,
  created_at timestamptz not null default now(),
  primary key (raw_fact_id, review_dimension_id),
  constraint training_raw_fact_dimensions_fact_scope_fk
    foreign key (
      raw_fact_id,
      review_cycle_id,
      discipline_id,
      review_aspect
    )
    references public.training_raw_facts(
      id,
      review_cycle_id,
      discipline_id,
      review_aspect
    )
    on delete restrict,
  constraint training_raw_fact_dimensions_unit_scope_fk
    foreign key (
      review_unit_id,
      review_cycle_id,
      discipline_id,
      review_dimension_id,
      review_aspect
    )
    references public.training_review_units(
      id,
      review_cycle_id,
      discipline_id,
      review_dimension_id,
      review_aspect
    )
    on delete restrict,
  constraint training_raw_fact_dimensions_unit_source_fk
    foreign key (
      review_unit_source_id,
      review_unit_id,
      training_source_id,
      source_class
    )
    references public.training_review_unit_sources(
      id,
      review_unit_id,
      training_source_id,
      source_class
    )
    on delete restrict
);

create table public.training_access_restrictions (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null,
  discipline_id uuid not null,
  review_cycle_id uuid not null,
  review_unit_id uuid not null,
  review_unit_source_id uuid not null,
  training_source_id uuid not null,
  source_class text not null,
  review_aspect text not null,
  restriction_key text not null,
  restriction_type text not null,
  statement text not null,
  evidence_text text not null,
  evidence_location_context text,
  directness text not null,
  observed_at timestamptz not null,
  reviewed_at timestamptz not null,
  reviewer_authority text not null,
  source_content_hash_at_review text,
  freshness_policy_key text,
  freshness_expires_at timestamptz,
  created_at timestamptz not null default now(),
  constraint training_access_restrictions_cycle_location_discipline_fk
    foreign key (review_cycle_id, location_id, discipline_id)
    references public.training_review_cycles(id, location_id, discipline_id)
    on delete restrict,
  constraint training_access_restrictions_unit_scope_fk
    foreign key (
      review_unit_id,
      review_cycle_id,
      discipline_id,
      review_aspect
    )
    references public.training_review_units(
      id,
      review_cycle_id,
      discipline_id,
      review_aspect
    )
    on delete restrict,
  constraint training_access_restrictions_unit_source_fk
    foreign key (
      review_unit_source_id,
      review_unit_id,
      training_source_id,
      source_class
    )
    references public.training_review_unit_sources(
      id,
      review_unit_id,
      training_source_id,
      source_class
    )
    on delete restrict,
  constraint training_access_restrictions_cycle_key
    unique (review_cycle_id, restriction_key),
  constraint training_access_restrictions_aspect_check
    check (review_aspect = 'USAGE_ACCESS_FACT'),
  constraint training_access_restrictions_key_check
    check (btrim(restriction_key) <> ''),
  constraint training_access_restrictions_type_check
    check (
      restriction_type in (
        'MEMBERSHIP_ELIGIBILITY',
        'RESERVATION_REQUIRED',
        'PROGRAM_HOUR_EXCLUSION',
        'PLAN_DEPENDENT_ACCESS'
      )
    ),
  constraint training_access_restrictions_statement_check
    check (btrim(statement) <> ''),
  constraint training_access_restrictions_evidence_text_check
    check (btrim(evidence_text) <> ''),
  constraint training_access_restrictions_context_check
    check (
      evidence_location_context is null
      or btrim(evidence_location_context) <> ''
    ),
  constraint training_access_restrictions_directness_check
    check (
      directness in (
        'DIRECT_TEXT',
        'DIRECT_IMAGE',
        'DIRECT_STRUCTURED_DATA'
      )
    ),
  constraint training_access_restrictions_review_time_check
    check (reviewed_at >= observed_at),
  constraint training_access_restrictions_reviewer_check
    check (btrim(reviewer_authority) <> ''),
  constraint training_access_restrictions_content_hash_check
    check (
      source_content_hash_at_review is null
      or source_content_hash_at_review ~ '^[0-9a-f]{64}$'
    ),
  constraint training_access_restrictions_freshness_policy_check
    check (
      freshness_policy_key is null
      or btrim(freshness_policy_key) <> ''
    ),
  constraint training_access_restrictions_freshness_expiry_check
    check (
      freshness_expires_at is null
      or (
        freshness_policy_key is not null
        and freshness_expires_at > reviewed_at
      )
    )
);

create index training_raw_facts_location_type_idx
  on public.training_raw_facts (location_id, discipline_id, fact_type_id, reviewed_at desc);

create index training_raw_facts_freshness_idx
  on public.training_raw_facts (freshness_expires_at)
  where freshness_expires_at is not null;

create index training_raw_fact_dimensions_dimension_idx
  on public.training_raw_fact_dimensions (review_dimension_id, raw_fact_id);

create index training_access_restrictions_location_type_idx
  on public.training_access_restrictions (
    location_id,
    discipline_id,
    restriction_type,
    reviewed_at desc
  );

create index training_access_restrictions_freshness_idx
  on public.training_access_restrictions (freshness_expires_at)
  where freshness_expires_at is not null;

comment on table public.training_raw_fact_types is
  'Internal authority-backed taxonomy for positive raw observations; contains no derived station states.';
comment on table public.training_raw_facts is
  'Append-only positive raw observations with mandatory review-ledger and reviewed-source provenance; row absence is unknown, never negative.';
comment on table public.training_raw_fact_dimensions is
  'Dimension applicability for a raw fact, linked to the matching H3-11B review unit; an empty set means discipline-level rather than station-derived.';
comment on table public.training_access_restrictions is
  'Append-only explicit official restriction evidence, internal-only and separate from positive usage facts and public publication.';

alter table public.training_raw_fact_types enable row level security;
alter table public.training_raw_facts enable row level security;
alter table public.training_raw_fact_dimensions enable row level security;
alter table public.training_access_restrictions enable row level security;

-- Production has a postgres-owned public-schema default ACL that grants new
-- tables to service_role. REVOKE is therefore explicit and precedes the exact
-- additive privilege contract; global/default ACLs remain unchanged.
revoke all privileges on table public.training_raw_fact_types from public;
revoke all privileges on table public.training_raw_facts from public;
revoke all privileges on table public.training_raw_fact_dimensions from public;
revoke all privileges on table public.training_access_restrictions from public;

revoke all privileges on table public.training_raw_fact_types from anon;
revoke all privileges on table public.training_raw_facts from anon;
revoke all privileges on table public.training_raw_fact_dimensions from anon;
revoke all privileges on table public.training_access_restrictions from anon;

revoke all privileges on table public.training_raw_fact_types from authenticated;
revoke all privileges on table public.training_raw_facts from authenticated;
revoke all privileges on table public.training_raw_fact_dimensions from authenticated;
revoke all privileges on table public.training_access_restrictions from authenticated;

revoke all privileges on table public.training_raw_fact_types from service_role;
revoke all privileges on table public.training_raw_facts from service_role;
revoke all privileges on table public.training_raw_fact_dimensions from service_role;
revoke all privileges on table public.training_access_restrictions from service_role;

grant select on table public.training_raw_fact_types to service_role;
grant select, insert on table public.training_raw_facts to service_role;
grant select, insert on table public.training_raw_fact_dimensions to service_role;
grant select, insert on table public.training_access_restrictions to service_role;

insert into public.training_raw_fact_types (
  slug,
  fact_family,
  review_aspect,
  description
)
values
  ('sled-pull-rope', 'PHYSICAL_COMPONENT', 'EQUIPMENT_FACT', 'A rope or equivalent pull apparatus positively observed for sled pull.'),
  ('wall-ball', 'PHYSICAL_COMPONENT', 'EQUIPMENT_FACT', 'A suitable wall ball positively observed separately from any wall-ball target.'),
  ('official-hyrox-equipment-set-assertion', 'SOURCE_ASSERTION', 'EQUIPMENT_FACT', 'A first-party assertion of an official HYROX equipment set without itemized components.'),
  ('multi-movement-training-space', 'SPACE_ENVIRONMENT', 'SPACE_FACT', 'Space explicitly associated with more than one named training movement.'),
  ('general-training-floor', 'SPACE_ENVIRONMENT', 'SPACE_FACT', 'A positively described training floor without station feasibility derivation.'),
  ('burpee-broad-jump-space', 'SPACE_ENVIRONMENT', 'SPACE_FACT', 'Space explicitly associated with Burpee Broad Jump movement.'),
  ('farmers-carry-space', 'SPACE_ENVIRONMENT', 'SPACE_FACT', 'Space explicitly associated with Farmers Carry movement.'),
  ('sandbag-lunges-space', 'SPACE_ENVIRONMENT', 'SPACE_FACT', 'Space explicitly associated with Sandbag Lunges movement.'),
  ('wall-balls-space', 'SPACE_ENVIRONMENT', 'SPACE_FACT', 'Space explicitly associated with Wall Balls movement.'),
  ('running-movement-space', 'SPACE_ENVIRONMENT', 'SPACE_FACT', 'Space explicitly associated with running movement without full HYROX running capability derivation.'),
  ('program-use-confirmed', 'USAGE_ACCESS', 'USAGE_ACCESS_FACT', 'Positive evidence that the scoped dimension is used in an official program; not program-only.'),
  ('appointment-use-confirmed', 'USAGE_ACCESS', 'USAGE_ACCESS_FACT', 'Positive evidence that scoped use is available by appointment; non-exclusive.'),
  ('rental-use-confirmed', 'USAGE_ACCESS', 'USAGE_ACCESS_FACT', 'Positive evidence that scoped use is available through facility rental; non-exclusive.');
