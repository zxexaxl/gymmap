import type { ReviewedImportCandidate } from "./hyrox-import-candidate";
import type { H25Candidate, H25ProductionPreflight } from "./hyrox-new-location-import-candidate";

function sql(value: string): string { return `'${value.replaceAll("'", "''")}'`; }
function nullable(value: string | null | undefined, cast = "text"): string { return value === null || value === undefined ? "null" : `${sql(value)}::${cast}`; }
function jsonSql(value: unknown): string { return `${sql(JSON.stringify(value))}::jsonb`; }

export function renderH25RollbackRehearsal(candidate: H25Candidate, preflight: H25ProductionPreflight, h23: ReviewedImportCandidate): string {
  const baselineBrands = preflight.brands.map((brand) => `  (${sql(brand.id)}::uuid, ${sql(brand.name)}, ${sql(brand.slug)}, ${nullable(brand.official_url)}, ${nullable(brand.description)})`).join(",\n");
  const baselineLocations = preflight.locations.map((location) => `  (
    ${sql(location.id)}::uuid, ${sql(location.brand_id)}::uuid, ${sql(location.name)}, ${sql(location.slug)},
    ${nullable(location.postal_code)}, ${nullable(location.prefecture)}, ${nullable(location.city)}, ${nullable(location.address_line)},
    ${location.latitude ?? "null"}, ${location.longitude ?? "null"}, ${nullable(location.nearest_station)},
    ${nullable(location.official_url)}, ${nullable(location.source_url)}, ${nullable(location.location_type)},
    ${location.is_active}, ${nullable(location.last_verified_at, "timestamptz")}
  )`).join(",\n");
  const baselineH23 = h23.records.map((record) => `  (
    ${sql(record.matched_location.id)}::uuid, ${sql(record.official_external_id)}, ${sql(record.official_name)},
    ${sql(record.official_source_url)}, ${sql(record.training_source.content_hash)},
    ${sql(record.observed_at)}::timestamptz, ${sql(record.stale_at)}::timestamptz,
    ${jsonSql(record.training_source.metadata_json)}, ${jsonSql(record.external_identifier.metadata_json)},
    ${jsonSql(record.evidence[0].structured_evidence)}, ${sql(record.evidence[0].content_hash)}, ${sql(record.evidence[1].content_hash)}
  )`).join(",\n");
  const brands = candidate.brands.map((brand) => `  (${sql(brand.brand_ref)}, ${sql(brand.name)}, ${sql(brand.slug)}, ${sql(brand.official_url)}, ${nullable(brand.description)})`).join(",\n");
  const locations = candidate.locations.map((record) => `  (
    ${sql(record.location_ref)}, ${sql(record.brand_ref)}, ${sql(record.name)}, ${sql(record.slug)},
    ${sql(record.postal_code)}, ${sql(record.prefecture)}, ${sql(record.city)}, ${sql(record.address_line)},
    ${record.latitude}, ${record.longitude}, ${nullable(record.nearest_station)}, ${sql(record.official_url)}, ${sql(record.source_url)},
    ${sql(record.location_type)}, true, ${sql(record.last_verified_at)}::timestamptz,
    ${sql(record.hgy_external_id)}, ${sql(record.hyrox_official_name)}, ${sql(record.training_source.content_hash)},
    ${sql(record.location_training_discipline.stale_at)}::timestamptz, ${jsonSql(record.training_source.metadata_json)},
    ${jsonSql(record.external_identifier.metadata_json)}, ${jsonSql(record.evidence[0].structured_evidence)},
    ${sql(record.evidence[0].content_hash)}, ${sql(record.evidence[1].content_hash)}
  )`).join(",\n");

  return `-- H2-5 reviewed new-location import candidate: LOCAL REHEARSAL ONLY.
-- The complete production-like transaction is rolled back unconditionally.
-- Never run this file against production.
begin;

select pg_advisory_xact_lock(hashtext('gymmap:h2-5:new-location-import-rehearsal'));

-- Current production identity baseline: ${preflight.brands.length} brands / ${preflight.locations.length} locations.
insert into public.gym_brands (id, name, slug, official_url, description) values
${baselineBrands};

insert into public.gym_locations (
  id, brand_id, name, slug, postal_code, prefecture, city, address_line,
  latitude, longitude, nearest_station, official_url, source_url, location_type,
  is_active, last_verified_at
) values
${baselineLocations};

-- Recreate the exact H2-3 six-club graph before applying the H2-5 set.
create temp table h23_baseline (
  location_id uuid not null, external_id text not null, official_name text not null,
  source_url text not null, source_hash text not null, observed_at timestamptz not null,
  stale_at timestamptz not null, source_metadata jsonb not null, identity_metadata jsonb not null,
  evidence_metadata jsonb not null, affiliation_hash text not null, discipline_hash text not null
) on commit drop;
insert into h23_baseline values
${baselineH23};

insert into public.training_sources (
  location_id, url, canonical_url, source_kind, publisher_authority, availability_state,
  last_checked_at, unavailable_since, review_required, content_hash, metadata_json
)
select location_id, source_url, source_url, 'finder', 'governing_body', 'available', observed_at, null, false, source_hash, source_metadata
from h23_baseline;

insert into public.location_external_identifiers (
  location_id, namespace, external_identifier, training_source_id, verification_status, verified_at, metadata_json
)
select baseline.location_id, 'hyrox-training-club', baseline.external_id, source.id, 'confirmed', baseline.observed_at, baseline.identity_metadata
from h23_baseline baseline join public.training_sources source on source.canonical_url = baseline.source_url;

insert into public.location_training_disciplines (
  location_id, discipline_id, support_state, verification_status, last_confirmed_at, stale_at, notes
)
select baseline.location_id, discipline.id, 'available', 'confirmed', baseline.observed_at, baseline.stale_at, null
from h23_baseline baseline cross join public.training_disciplines discipline where discipline.slug = 'hyrox';

insert into public.training_affiliations (
  location_id, discipline_id, affiliation_type, awarding_organization, external_identifier,
  affiliation_state, verification_status, valid_from, valid_to, last_confirmed_at, stale_at, notes
)
select baseline.location_id, discipline.id, 'training_club', 'HYROX', baseline.external_id,
  'active', 'confirmed', null, null, baseline.observed_at, baseline.stale_at, null
from h23_baseline baseline cross join public.training_disciplines discipline where discipline.slug = 'hyrox';

insert into public.training_evidence (
  training_source_id, training_affiliation_id, assertion, review_status, evidence_text,
  structured_evidence, observed_at, reviewed_at, content_hash
)
select source.id, affiliation.id, 'supports', 'accepted', null, baseline.evidence_metadata,
  baseline.observed_at, baseline.observed_at, baseline.affiliation_hash
from h23_baseline baseline
join public.training_sources source on source.canonical_url = baseline.source_url
join public.training_affiliations affiliation on affiliation.location_id = baseline.location_id and affiliation.external_identifier = baseline.external_id;

insert into public.training_evidence (
  training_source_id, location_training_discipline_id, assertion, review_status, evidence_text,
  structured_evidence, observed_at, reviewed_at, content_hash
)
select source.id, location_discipline.id, 'supports', 'accepted', null, baseline.evidence_metadata,
  baseline.observed_at, baseline.observed_at, baseline.discipline_hash
from h23_baseline baseline
join public.training_sources source on source.canonical_url = baseline.source_url
join public.training_disciplines discipline on discipline.slug = 'hyrox'
join public.location_training_disciplines location_discipline on location_discipline.location_id = baseline.location_id and location_discipline.discipline_id = discipline.id;

do $baseline$
begin
  if (select count(*) from public.gym_brands) <> ${preflight.brands.length}
     or (select count(*) from public.gym_locations) <> ${preflight.locations.length}
     or (select count(*) from public.training_sources) <> 6
     or (select count(*) from public.location_external_identifiers where namespace = 'hyrox-training-club') <> 6
     or (select count(*) from public.location_training_disciplines) <> 6
     or (select count(*) from public.training_affiliations where awarding_organization = 'HYROX') <> 6
     or (select count(*) from public.training_evidence) <> 12
     or (select count(*) from public.published_location_training_disciplines) <> 6
     or (select count(*) from public.published_training_affiliations where is_official) <> 6 then
    raise exception 'Production-like H2-3 baseline mismatch';
  end if;
end;
$baseline$;

create temp table h25_brands (
  brand_ref text primary key, name text not null, slug text not null, official_url text not null, description text
) on commit drop;
insert into h25_brands values
${brands};

create temp table h25_locations (
  location_ref text primary key, brand_ref text not null, name text not null, slug text not null,
  postal_code text not null, prefecture text not null, city text not null, address_line text not null,
  latitude numeric not null, longitude numeric not null, nearest_station text, official_url text not null,
  source_url text not null, location_type text not null, is_active boolean not null,
  observed_at timestamptz not null, external_id text not null, official_name text not null,
  source_hash text not null, stale_at timestamptz not null, source_metadata jsonb not null,
  identity_metadata jsonb not null, evidence_metadata jsonb not null,
  affiliation_hash text not null, discipline_hash text not null
) on commit drop;
insert into h25_locations values
${locations};

create function pg_temp.apply_h25_candidate()
returns void language plpgsql as $function$
begin
  if (select count(*) from h25_brands) <> ${candidate.brands.length}
     or (select count(*) from h25_locations) <> 17 then
    raise exception 'H2-5 requires exact reviewed brand/location counts';
  end if;
  if exists (select slug from h25_brands group by slug having count(*) > 1)
     or exists (select name from h25_brands group by name having count(*) > 1) then
    raise exception 'Duplicate candidate brand identity';
  end if;
  if exists (
    select 1 from h25_brands candidate join public.gym_brands existing on existing.slug = candidate.slug or existing.name = candidate.name
    where existing.slug <> candidate.slug or existing.name <> candidate.name
  ) then raise exception 'Brand semantic identity collision'; end if;
  if exists (select slug from h25_locations group by slug having count(*) > 1)
     or exists (select external_id from h25_locations group by external_id having count(*) > 1) then
    raise exception 'Duplicate candidate location identity';
  end if;
  if exists (
    select 1 from h25_locations candidate join public.gym_locations existing on existing.slug = candidate.slug
    where existing.name <> candidate.name or existing.official_url is distinct from candidate.official_url
       or existing.address_line is distinct from candidate.address_line or existing.location_type is distinct from candidate.location_type
  ) then raise exception 'Location semantic identity collision'; end if;
  if exists (
    select 1 from h25_locations candidate join public.gym_locations existing
      on existing.official_url = candidate.official_url or existing.address_line = candidate.address_line
    where existing.slug <> candidate.slug
  ) then raise exception 'Location URL or address belongs to another slug'; end if;
  if exists (
    select 1 from h25_locations candidate join public.location_external_identifiers identity
      on identity.namespace = 'hyrox-training-club' and identity.external_identifier = candidate.external_id
    join public.gym_locations existing on existing.id = identity.location_id
    where existing.slug <> candidate.slug
  ) then raise exception 'HYROX external identifier belongs to another location'; end if;
  if exists (
    select 1 from h25_locations candidate join public.training_sources source on source.canonical_url = candidate.source_url
    join public.gym_locations existing on existing.id = source.location_id
    where existing.slug <> candidate.slug or source.publisher_authority <> 'governing_body' or source.source_kind <> 'finder'
  ) then raise exception 'Canonical HYROX source conflicts with another identity'; end if;

  insert into public.gym_brands (name, slug, official_url, description)
  select name, slug, official_url, description from h25_brands
  on conflict (slug) do nothing;

  insert into public.gym_locations (
    brand_id, name, slug, postal_code, prefecture, city, address_line, latitude,
    longitude, nearest_station, official_url, source_url, location_type, is_active, last_verified_at
  )
  select brand.id, candidate.name, candidate.slug, candidate.postal_code, candidate.prefecture,
    candidate.city, candidate.address_line, candidate.latitude, candidate.longitude,
    candidate.nearest_station, candidate.official_url, candidate.source_url, candidate.location_type,
    candidate.is_active, candidate.observed_at
  from h25_locations candidate
  join h25_brands candidate_brand on candidate_brand.brand_ref = candidate.brand_ref
  join public.gym_brands brand on brand.slug = candidate_brand.slug
  where not exists (select 1 from public.gym_locations existing where existing.slug = candidate.slug);

  update public.training_sources source
  set url = candidate.source_url, availability_state = 'available', last_checked_at = candidate.observed_at,
    unavailable_since = null, review_required = false, content_hash = candidate.source_hash,
    metadata_json = candidate.source_metadata
  from h25_locations candidate
  where source.canonical_url = candidate.source_url and (source.last_checked_at is null or candidate.observed_at > source.last_checked_at);

  insert into public.training_sources (
    location_id, url, canonical_url, source_kind, publisher_authority, availability_state,
    last_checked_at, unavailable_since, review_required, content_hash, metadata_json
  )
  select location.id, candidate.source_url, candidate.source_url, 'finder', 'governing_body',
    'available', candidate.observed_at, null, false, candidate.source_hash, candidate.source_metadata
  from h25_locations candidate join public.gym_locations location on location.slug = candidate.slug
  where not exists (select 1 from public.training_sources source where source.canonical_url = candidate.source_url);

  insert into public.location_external_identifiers (
    location_id, namespace, external_identifier, training_source_id, verification_status, verified_at, metadata_json
  )
  select location.id, 'hyrox-training-club', candidate.external_id, source.id, 'confirmed', candidate.observed_at, candidate.identity_metadata
  from h25_locations candidate join public.gym_locations location on location.slug = candidate.slug
  join public.training_sources source on source.canonical_url = candidate.source_url
  on conflict (namespace, external_identifier) do update set
    training_source_id = case when excluded.verified_at > location_external_identifiers.verified_at then excluded.training_source_id else location_external_identifiers.training_source_id end,
    verification_status = case when excluded.verified_at > location_external_identifiers.verified_at then excluded.verification_status else location_external_identifiers.verification_status end,
    verified_at = greatest(location_external_identifiers.verified_at, excluded.verified_at),
    metadata_json = case when excluded.verified_at > location_external_identifiers.verified_at then excluded.metadata_json else location_external_identifiers.metadata_json end;

  insert into public.location_training_disciplines (
    location_id, discipline_id, support_state, verification_status, last_confirmed_at, stale_at, notes
  )
  select location.id, discipline.id, 'available', 'confirmed', candidate.observed_at, candidate.stale_at, null
  from h25_locations candidate join public.gym_locations location on location.slug = candidate.slug
  cross join public.training_disciplines discipline where discipline.slug = 'hyrox'
  on conflict (location_id, discipline_id) do update set support_state = excluded.support_state,
    verification_status = excluded.verification_status, last_confirmed_at = excluded.last_confirmed_at, stale_at = excluded.stale_at
  where excluded.last_confirmed_at > location_training_disciplines.last_confirmed_at;

  insert into public.training_affiliations (
    location_id, discipline_id, affiliation_type, awarding_organization, external_identifier,
    affiliation_state, verification_status, valid_from, valid_to, last_confirmed_at, stale_at, notes
  )
  select location.id, discipline.id, 'training_club', 'HYROX', candidate.external_id,
    'active', 'confirmed', null, null, candidate.observed_at, candidate.stale_at, null
  from h25_locations candidate join public.gym_locations location on location.slug = candidate.slug
  cross join public.training_disciplines discipline where discipline.slug = 'hyrox'
  on conflict (location_id, discipline_id, affiliation_type, awarding_organization) do update set
    external_identifier = excluded.external_identifier, affiliation_state = excluded.affiliation_state,
    verification_status = excluded.verification_status, last_confirmed_at = excluded.last_confirmed_at, stale_at = excluded.stale_at
  where excluded.last_confirmed_at > training_affiliations.last_confirmed_at;

  insert into public.training_evidence (
    training_source_id, training_affiliation_id, assertion, review_status, evidence_text,
    structured_evidence, observed_at, reviewed_at, content_hash
  )
  select source.id, affiliation.id, 'supports', 'accepted', null, candidate.evidence_metadata,
    candidate.observed_at, candidate.observed_at, candidate.affiliation_hash
  from h25_locations candidate join public.gym_locations location on location.slug = candidate.slug
  join public.training_sources source on source.canonical_url = candidate.source_url
  join public.training_affiliations affiliation on affiliation.location_id = location.id and affiliation.external_identifier = candidate.external_id
  where not exists (select 1 from public.training_evidence evidence where evidence.training_source_id = source.id and evidence.training_affiliation_id = affiliation.id and evidence.content_hash = candidate.affiliation_hash);

  insert into public.training_evidence (
    training_source_id, location_training_discipline_id, assertion, review_status, evidence_text,
    structured_evidence, observed_at, reviewed_at, content_hash
  )
  select source.id, location_discipline.id, 'supports', 'accepted', null, candidate.evidence_metadata,
    candidate.observed_at, candidate.observed_at, candidate.discipline_hash
  from h25_locations candidate join public.gym_locations location on location.slug = candidate.slug
  join public.training_sources source on source.canonical_url = candidate.source_url
  join public.training_disciplines discipline on discipline.slug = 'hyrox'
  join public.location_training_disciplines location_discipline on location_discipline.location_id = location.id and location_discipline.discipline_id = discipline.id
  where not exists (select 1 from public.training_evidence evidence where evidence.training_source_id = source.id and evidence.location_training_discipline_id = location_discipline.id and evidence.content_hash = candidate.discipline_hash);
end;
$function$;

select pg_temp.apply_h25_candidate();
select pg_temp.apply_h25_candidate();

do $verify$
declare search_count integer; search_total bigint;
begin
  if (select count(*) from public.gym_brands) <> ${preflight.brands.length + candidate.brands.length}
     or (select count(*) from public.gym_locations) <> ${preflight.locations.length + 17}
     or (select count(*) from public.training_sources) <> 23
     or (select count(*) from public.location_external_identifiers where namespace = 'hyrox-training-club') <> 23
     or (select count(*) from public.location_training_disciplines) <> 23
     or (select count(*) from public.training_affiliations where awarding_organization = 'HYROX') <> 23
     or (select count(*) from public.training_evidence) <> 46 then
    raise exception 'H2-5 logical row counts or idempotency mismatch';
  end if;
  if (select count(*) from public.published_location_training_disciplines) <> 23
     or (select count(*) from public.published_training_affiliations where is_official) <> 23 then
    raise exception 'H2-5 publication count mismatch';
  end if;
  if not exists (
    select 1 from public.published_training_discipline_summary
    where slug = 'hyrox' and published_location_count = 23 and official_location_count = 23
  ) then raise exception 'H2-5 summary mismatch'; end if;
  select count(*), max(total_count) into search_count, search_total
  from public.search_training_locations('hyrox', '', '', true, '{}', '{}', null, 0, 100)
  where official and not class_available and not open_training_available
    and equipment_slugs = '{}'::text[] and capability_slugs = '{}'::text[];
  if search_count <> 23 or search_total <> 23 then raise exception 'H2-5 search result mismatch'; end if;
  if (select count(*) from public.search_training_locations('hyrox', '', '', true, '{}', '{}', null, 0, 10)) <> 10
     or (select count(*) from public.search_training_locations('hyrox', '', '', true, '{}', '{}', null, 10, 100)) <> 13 then
    raise exception 'H2-5 search pagination count mismatch';
  end if;
  if exists (
    select location_id from public.search_training_locations('hyrox', '', '', true, '{}', '{}', null, 0, 10)
    intersect
    select location_id from public.search_training_locations('hyrox', '', '', true, '{}', '{}', null, 10, 100)
  ) then raise exception 'H2-5 search pagination contains duplicate locations'; end if;
  if exists (
    select 1 from public.search_training_locations('hyrox', '', '', true, '{}', '{}', null, 0, 10) where total_count <> 23
  ) or exists (
    select 1 from public.search_training_locations('hyrox', '', '', true, '{}', '{}', null, 10, 100) where total_count <> 23
  ) then raise exception 'H2-5 search pagination total_count mismatch'; end if;
  if (select count(*) from public.location_equipment) <> 0
     or (select count(*) from public.location_training_capabilities) <> 0
     or (select count(*) from public.program_training_disciplines) <> 0 then
    raise exception 'Out-of-scope inferred facts exist';
  end if;
  if has_table_privilege('anon', 'public.training_sources', 'select')
     or has_table_privilege('anon', 'public.training_evidence', 'select')
     or has_table_privilege('authenticated', 'public.training_sources', 'select')
     or has_table_privilege('authenticated', 'public.training_evidence', 'select') then
    raise exception 'Private provenance grants leaked';
  end if;
end;
$verify$;

do $freshness$
declare target text := (select min(external_id) from h25_locations); original timestamptz;
begin
  select relation.last_confirmed_at into original
  from public.location_training_disciplines relation
  join public.gym_locations location on location.id = relation.location_id
  join h25_locations candidate on candidate.slug = location.slug
  where candidate.external_id = target;
  update h25_locations set observed_at = observed_at - interval '1 day', stale_at = stale_at - interval '1 day' where external_id = target;
  perform pg_temp.apply_h25_candidate();
  if exists (
    select 1 from public.location_training_disciplines relation join public.gym_locations location on location.id = relation.location_id
    join h25_locations candidate on candidate.slug = location.slug where candidate.external_id = target and relation.last_confirmed_at <> original
  ) then raise exception 'Older observation regressed freshness'; end if;
end;
$freshness$;

do $conflicts$
declare first_slug text := (select min(slug) from h25_locations); first_external text := (select external_id from h25_locations where slug = first_slug);
begin
  begin
    update h25_brands set name = name || ' conflict' where slug = (select min(slug) from h25_brands);
    perform pg_temp.apply_h25_candidate();
    raise exception 'Expected brand collision was not blocked';
  exception when raise_exception then
    if sqlerrm <> 'Brand semantic identity collision' then raise; end if;
  end;
  begin
    update h25_locations set name = name || ' conflict' where slug = first_slug;
    perform pg_temp.apply_h25_candidate();
    raise exception 'Expected location collision was not blocked';
  exception when raise_exception then
    if sqlerrm <> 'Location semantic identity collision' then raise; end if;
  end;
  begin
    update h25_locations set external_id = (select external_id from h23_baseline limit 1) where slug = first_slug;
    perform pg_temp.apply_h25_candidate();
    raise exception 'Expected HGY collision was not blocked';
  exception when raise_exception then
    if sqlerrm <> 'HYROX external identifier belongs to another location' then raise; end if;
  end;
end;
$conflicts$;

-- The transaction includes all identity and training facts atomically, then proves rollback cleanup.
rollback;
`;
}
