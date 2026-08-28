import type { ReviewedImportCandidate } from "./hyrox-import-candidate";

function sql(value: string): string {
  return `'${value.replaceAll("'", "''")}'`;
}

function jsonSql(value: unknown): string {
  return `${sql(JSON.stringify(value))}::jsonb`;
}

export function renderRollbackOnlyImportRehearsal(candidate: ReviewedImportCandidate): string {
  const rows = candidate.records.map((record) => `  (
    ${sql(record.matched_location.id)}::uuid,
    ${sql(record.matched_location.slug)},
    ${sql(record.matched_location.name)},
    ${sql(record.official_external_id)},
    ${sql(record.official_name)},
    ${sql(record.official_source_url)},
    ${sql(record.training_source.content_hash)},
    ${sql(record.observed_at)}::timestamptz,
    ${sql(record.stale_at)}::timestamptz,
    ${jsonSql(record.training_source.metadata_json)},
    ${jsonSql(record.external_identifier.metadata_json)},
    ${jsonSql(record.evidence[0].structured_evidence)},
    ${sql(record.evidence[0].content_hash)},
    ${sql(record.evidence[1].content_hash)}
  )`).join(",\n");

  return `-- H2-2 reviewed import candidate: LOCAL REHEARSAL ONLY.
-- This file always ends with ROLLBACK and must not be used as a production import.
-- It creates no gym_locations, equipment, capabilities, programs, or schedules.
begin;

select pg_advisory_xact_lock(hashtext('gymmap:h2:hyrox-training-club-import'));

create temp table h2_hyrox_candidate (
  location_id uuid not null,
  location_slug text not null,
  location_name text not null,
  external_id text not null,
  official_name text not null,
  source_url text not null,
  source_content_hash text not null,
  observed_at timestamptz not null,
  stale_at timestamptz not null,
  source_metadata jsonb not null,
  identity_metadata jsonb not null,
  evidence_metadata jsonb not null,
  affiliation_evidence_hash text not null,
  discipline_evidence_hash text not null
) on commit drop;

insert into h2_hyrox_candidate values
${rows};

create function pg_temp.apply_h2_hyrox_candidate()
returns void
language plpgsql
as $function$
begin
  if (select count(*) from h2_hyrox_candidate) <> 6 then
    raise exception 'H2-2 requires exactly six reviewed records';
  end if;

  if exists (
    select 1 from h2_hyrox_candidate candidate
    left join public.gym_locations location on location.id = candidate.location_id
    where location.id is null or location.is_active is not true
  ) then
    raise exception 'H2-2 location is missing or inactive';
  end if;

  if not exists (
    select 1 from public.training_disciplines
    where slug = 'hyrox' and is_active = true
  ) then
    raise exception 'Active HYROX discipline is missing';
  end if;

  if exists (
    select 1
    from h2_hyrox_candidate candidate
    join public.location_external_identifiers identity
      on identity.namespace = 'hyrox-training-club'
     and identity.external_identifier = candidate.external_id
    where identity.location_id <> candidate.location_id
  ) then
    raise exception 'HYROX external identifier belongs to another location';
  end if;

  if exists (
    select 1
    from h2_hyrox_candidate candidate
    join public.training_affiliations affiliation
      on affiliation.awarding_organization = 'HYROX'
     and affiliation.external_identifier = candidate.external_id
    join public.training_disciplines discipline on discipline.id = affiliation.discipline_id
    where affiliation.location_id <> candidate.location_id
       or discipline.slug <> 'hyrox'
       or affiliation.affiliation_type <> 'training_club'
  ) then
    raise exception 'HYROX affiliation external identifier conflicts with another claim';
  end if;

  if exists (
    select 1
    from h2_hyrox_candidate candidate
    join public.training_disciplines discipline on discipline.slug = 'hyrox'
    join public.training_affiliations affiliation
      on affiliation.location_id = candidate.location_id
     and affiliation.discipline_id = discipline.id
     and affiliation.affiliation_type = 'training_club'
     and affiliation.awarding_organization = 'HYROX'
    where affiliation.external_identifier is not null
      and affiliation.external_identifier <> candidate.external_id
  ) then
    raise exception 'Canonical HYROX affiliation has a different external identifier';
  end if;

  if exists (
    select 1
    from h2_hyrox_candidate candidate
    join public.training_sources source on source.canonical_url = candidate.source_url
    where source.location_id is distinct from candidate.location_id
       or source.publisher_authority is distinct from 'governing_body'
       or source.source_kind is distinct from 'finder'
  ) then
    raise exception 'Canonical HYROX source conflicts with another identity or authority';
  end if;

  if exists (
    select canonical_url
    from public.training_sources
    where canonical_url in (select source_url from h2_hyrox_candidate)
    group by canonical_url
    having count(*) > 1
  ) then
    raise exception 'Duplicate canonical HYROX sources require reconciliation';
  end if;

  update public.training_sources source
  set
    url = candidate.source_url,
    availability_state = 'available',
    last_checked_at = candidate.observed_at,
    unavailable_since = null,
    review_required = false,
    content_hash = candidate.source_content_hash,
    metadata_json = candidate.source_metadata
  from h2_hyrox_candidate candidate
  where source.canonical_url = candidate.source_url
    and (source.last_checked_at is null or candidate.observed_at > source.last_checked_at);

  insert into public.training_sources (
    location_id, url, canonical_url, source_kind, publisher_authority,
    availability_state, last_checked_at, unavailable_since, review_required,
    content_hash, metadata_json
  )
  select
    candidate.location_id, candidate.source_url, candidate.source_url,
    'finder', 'governing_body', 'available', candidate.observed_at, null,
    false, candidate.source_content_hash, candidate.source_metadata
  from h2_hyrox_candidate candidate
  where not exists (
    select 1 from public.training_sources source
    where source.canonical_url = candidate.source_url
  );

  insert into public.location_external_identifiers (
    location_id, namespace, external_identifier, training_source_id,
    verification_status, verified_at, metadata_json
  )
  select
    candidate.location_id, 'hyrox-training-club', candidate.external_id,
    source.id, 'confirmed', candidate.observed_at, candidate.identity_metadata
  from h2_hyrox_candidate candidate
  join public.training_sources source on source.canonical_url = candidate.source_url
  on conflict (namespace, external_identifier) do update
  set
    training_source_id = case
      when location_external_identifiers.verified_at is null
        or excluded.verified_at > location_external_identifiers.verified_at
        then excluded.training_source_id
      else location_external_identifiers.training_source_id
    end,
    verification_status = case
      when location_external_identifiers.verified_at is null
        or excluded.verified_at > location_external_identifiers.verified_at
        then excluded.verification_status
      else location_external_identifiers.verification_status
    end,
    verified_at = greatest(location_external_identifiers.verified_at, excluded.verified_at),
    metadata_json = case
      when location_external_identifiers.verified_at is null
        or excluded.verified_at > location_external_identifiers.verified_at
        then excluded.metadata_json
      else location_external_identifiers.metadata_json
    end;

  insert into public.location_training_disciplines (
    location_id, discipline_id, support_state, verification_status,
    last_confirmed_at, stale_at, notes
  )
  select
    candidate.location_id, discipline.id, 'available', 'confirmed',
    candidate.observed_at, candidate.stale_at, null
  from h2_hyrox_candidate candidate
  cross join public.training_disciplines discipline
  where discipline.slug = 'hyrox'
  on conflict (location_id, discipline_id) do update
  set
    support_state = excluded.support_state,
    verification_status = excluded.verification_status,
    last_confirmed_at = excluded.last_confirmed_at,
    stale_at = excluded.stale_at
  where location_training_disciplines.last_confirmed_at is null
     or excluded.last_confirmed_at > location_training_disciplines.last_confirmed_at;

  insert into public.training_affiliations (
    location_id, discipline_id, affiliation_type, awarding_organization,
    external_identifier, affiliation_state, verification_status, valid_from,
    valid_to, last_confirmed_at, stale_at, notes
  )
  select
    candidate.location_id, discipline.id, 'training_club', 'HYROX',
    candidate.external_id, 'active', 'confirmed', null, null,
    candidate.observed_at, candidate.stale_at, null
  from h2_hyrox_candidate candidate
  cross join public.training_disciplines discipline
  where discipline.slug = 'hyrox'
  on conflict (location_id, discipline_id, affiliation_type, awarding_organization) do update
  set
    external_identifier = excluded.external_identifier,
    affiliation_state = excluded.affiliation_state,
    verification_status = excluded.verification_status,
    last_confirmed_at = excluded.last_confirmed_at,
    stale_at = excluded.stale_at
  where training_affiliations.last_confirmed_at is null
     or excluded.last_confirmed_at > training_affiliations.last_confirmed_at;

  insert into public.training_evidence (
    training_source_id, training_affiliation_id, assertion, review_status,
    evidence_text, structured_evidence, observed_at, reviewed_at, content_hash
  )
  select
    source.id, affiliation.id, 'supports', 'accepted', null,
    candidate.evidence_metadata, candidate.observed_at, candidate.observed_at,
    candidate.affiliation_evidence_hash
  from h2_hyrox_candidate candidate
  join public.training_sources source on source.canonical_url = candidate.source_url
  join public.training_disciplines discipline on discipline.slug = 'hyrox'
  join public.training_affiliations affiliation
    on affiliation.location_id = candidate.location_id
   and affiliation.discipline_id = discipline.id
   and affiliation.affiliation_type = 'training_club'
   and affiliation.awarding_organization = 'HYROX'
  where not exists (
    select 1 from public.training_evidence evidence
    where evidence.training_source_id = source.id
      and evidence.training_affiliation_id = affiliation.id
      and evidence.content_hash = candidate.affiliation_evidence_hash
  );

  insert into public.training_evidence (
    training_source_id, location_training_discipline_id, assertion,
    review_status, evidence_text, structured_evidence, observed_at,
    reviewed_at, content_hash
  )
  select
    source.id, location_discipline.id, 'supports', 'accepted', null,
    candidate.evidence_metadata, candidate.observed_at, candidate.observed_at,
    candidate.discipline_evidence_hash
  from h2_hyrox_candidate candidate
  join public.training_sources source on source.canonical_url = candidate.source_url
  join public.training_disciplines discipline on discipline.slug = 'hyrox'
  join public.location_training_disciplines location_discipline
    on location_discipline.location_id = candidate.location_id
   and location_discipline.discipline_id = discipline.id
  where not exists (
    select 1 from public.training_evidence evidence
    where evidence.training_source_id = source.id
      and evidence.location_training_discipline_id = location_discipline.id
      and evidence.content_hash = candidate.discipline_evidence_hash
  );
end;
$function$;

select pg_temp.apply_h2_hyrox_candidate();
select pg_temp.apply_h2_hyrox_candidate();

do $verify$
declare
  candidate_location_ids uuid[] := array(select location_id from h2_hyrox_candidate);
  search_count integer;
begin
  if (select count(*) from public.training_sources where canonical_url in (select source_url from h2_hyrox_candidate)) <> 6 then
    raise exception 'training_sources logical count mismatch';
  end if;
  if (select count(*) from public.location_external_identifiers where namespace = 'hyrox-training-club' and location_id = any(candidate_location_ids)) <> 6 then
    raise exception 'external identifier logical count mismatch';
  end if;
  if (select count(*) from public.location_training_disciplines where location_id = any(candidate_location_ids)) <> 6 then
    raise exception 'discipline logical count mismatch';
  end if;
  if (select count(*) from public.training_affiliations where location_id = any(candidate_location_ids) and awarding_organization = 'HYROX') <> 6 then
    raise exception 'affiliation logical count mismatch';
  end if;
  if (select count(*) from public.training_evidence where content_hash in (
    select affiliation_evidence_hash from h2_hyrox_candidate
    union all select discipline_evidence_hash from h2_hyrox_candidate
  )) <> 12 then
    raise exception 'evidence logical count or idempotency mismatch';
  end if;
  if (select count(*) from public.published_location_training_disciplines where location_id = any(candidate_location_ids)) <> 6 then
    raise exception 'published discipline count mismatch';
  end if;
  if (select count(*) from public.published_training_affiliations where location_id = any(candidate_location_ids) and is_official) <> 6 then
    raise exception 'published official affiliation count mismatch';
  end if;
  if (select published_location_count from public.published_training_discipline_summary where slug = 'hyrox') <> 6 then
    raise exception 'published summary count mismatch';
  end if;
  select count(*) into search_count
  from public.search_training_locations('hyrox', '', '', true, '{}', '{}', null, 0, 100)
  where location_id = any(candidate_location_ids)
    and official
    and not class_available
    and not open_training_available
    and equipment_slugs = '{}'::text[]
    and capability_slugs = '{}'::text[];
  if search_count <> 6 then
    raise exception 'search publication result mismatch';
  end if;
end;
$verify$;

do $freshness$
declare
  target_external_id text := (select min(external_id) from h2_hyrox_candidate);
  original_observed_at timestamptz;
  original_stale_at timestamptz;
begin
  select location_discipline.last_confirmed_at, location_discipline.stale_at
  into original_observed_at, original_stale_at
  from public.location_training_disciplines location_discipline
  join public.training_disciplines discipline on discipline.id = location_discipline.discipline_id
  join h2_hyrox_candidate candidate on candidate.location_id = location_discipline.location_id
  where discipline.slug = 'hyrox' and candidate.external_id = target_external_id;

  update h2_hyrox_candidate
  set observed_at = observed_at - interval '1 day', stale_at = stale_at - interval '1 day'
  where external_id = target_external_id;
  perform pg_temp.apply_h2_hyrox_candidate();
  if exists (
    select 1
    from public.location_training_disciplines location_discipline
    join public.training_disciplines discipline on discipline.id = location_discipline.discipline_id
    join h2_hyrox_candidate candidate on candidate.location_id = location_discipline.location_id
    where discipline.slug = 'hyrox'
      and candidate.external_id = target_external_id
      and (location_discipline.last_confirmed_at <> original_observed_at or location_discipline.stale_at <> original_stale_at)
  ) then
    raise exception 'Older observation regressed confirmation freshness';
  end if;

  update h2_hyrox_candidate
  set observed_at = observed_at + interval '2 days', stale_at = stale_at + interval '2 days'
  where external_id = target_external_id;
  perform pg_temp.apply_h2_hyrox_candidate();
  if not exists (
    select 1
    from public.location_training_disciplines location_discipline
    join public.training_disciplines discipline on discipline.id = location_discipline.discipline_id
    join h2_hyrox_candidate candidate on candidate.location_id = location_discipline.location_id
    where discipline.slug = 'hyrox'
      and candidate.external_id = target_external_id
      and location_discipline.last_confirmed_at = candidate.observed_at
      and location_discipline.stale_at = candidate.stale_at
  ) then
    raise exception 'Newer observation did not advance confirmation freshness';
  end if;
end;
$freshness$;

do $identity_conflict$
declare
  target_external_id text := (select min(external_id) from h2_hyrox_candidate);
  conflicting_location_id uuid := (
    select location_id from h2_hyrox_candidate
    where external_id <> (select min(external_id) from h2_hyrox_candidate)
    order by external_id limit 1
  );
begin
  begin
    update h2_hyrox_candidate
    set location_id = conflicting_location_id
    where external_id = target_external_id;
    perform pg_temp.apply_h2_hyrox_candidate();
    raise exception 'Expected identity conflict was not blocked';
  exception
    when raise_exception then
      if sqlerrm <> 'HYROX external identifier belongs to another location' then
        raise;
      end if;
  end;
end;
$identity_conflict$;

do $affiliation_conflict$
declare
  target_location_id uuid := (select location_id from h2_hyrox_candidate order by external_id limit 1);
begin
  begin
    update public.training_affiliations affiliation
    set external_identifier = 'HGY_CONFLICT_FOR_LOCAL_REHEARSAL'
    from public.training_disciplines discipline
    where affiliation.location_id = target_location_id
      and affiliation.discipline_id = discipline.id
      and discipline.slug = 'hyrox'
      and affiliation.affiliation_type = 'training_club'
      and affiliation.awarding_organization = 'HYROX';
    perform pg_temp.apply_h2_hyrox_candidate();
    raise exception 'Expected affiliation conflict was not blocked';
  exception
    when raise_exception then
      if sqlerrm <> 'Canonical HYROX affiliation has a different external identifier' then
        raise;
      end if;
  end;
end;
$affiliation_conflict$;

do $publication_gates$
declare
  target_url text := (select min(source_url) from h2_hyrox_candidate);
  candidate_location_ids uuid[] := array(select location_id from h2_hyrox_candidate);
begin
  update public.training_sources
  set availability_state = 'unavailable', unavailable_since = now()
  where canonical_url = target_url;
  if (select count(*) from public.published_location_training_disciplines where location_id = any(candidate_location_ids)) <> 5 then
    raise exception 'Unavailable source remained positively published';
  end if;

  update public.training_sources
  set availability_state = 'available', unavailable_since = null, review_required = true
  where canonical_url = target_url;
  if (select count(*) from public.published_location_training_disciplines where location_id = any(candidate_location_ids)) <> 5 then
    raise exception 'Review-required source remained positively published';
  end if;

  update public.training_sources set review_required = false where canonical_url = target_url;
  if (select count(*) from public.published_location_training_disciplines where location_id = any(candidate_location_ids)) <> 6 then
    raise exception 'Restored accepted source did not republish';
  end if;

  if has_table_privilege('anon', 'public.training_sources', 'select')
     or has_table_privilege('anon', 'public.training_evidence', 'select')
     or has_table_privilege('authenticated', 'public.training_sources', 'select')
     or has_table_privilege('authenticated', 'public.training_evidence', 'select') then
    raise exception 'Private source/evidence grants leaked';
  end if;
end;
$publication_gates$;

select
  (select count(*) from public.published_location_training_disciplines where location_id in (select location_id from h2_hyrox_candidate)) as published_disciplines,
  (select count(*) from public.published_training_affiliations where location_id in (select location_id from h2_hyrox_candidate) and is_official) as official_affiliations,
  (select count(*) from public.search_training_locations('hyrox', '', '', true, '{}', '{}', null, 0, 100) where location_id in (select location_id from h2_hyrox_candidate)) as search_results;

rollback;
`;
}
