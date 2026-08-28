-- H2-2 reviewed import candidate: LOCAL REHEARSAL ONLY.
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
  (
    '4d3bd3ba-cb00-44be-bdd6-d9b901f73195'::uuid,
    'golds-gym-chiba-newtown',
    '千葉ニュータウン',
    'HGY_CckOFxMw5VG60QfRbUzlk3VMy',
    'ゴールドジム千葉ニュータウン',
    'https://hyrox-training-finder.hyrox.com/gym/HGY_CckOFxMw5VG60QfRbUzlk3VMy',
    '487145a500744223d292705752d44737dabd5924695f433e5e5f3402aee05616',
    '2026-08-28T17:26:12.761Z'::timestamptz,
    '2026-11-26T17:26:12.761Z'::timestamptz,
    '{"namespace":"hyrox-training-club","external_identifier":"HGY_CckOFxMw5VG60QfRbUzlk3VMy","official_name":"ゴールドジム千葉ニュータウン"}'::jsonb,
    '{"official_name":"ゴールドジム千葉ニュータウン"}'::jsonb,
    '{"finder_listing":true,"official_external_id":"HGY_CckOFxMw5VG60QfRbUzlk3VMy","official_name":"ゴールドジム千葉ニュータウン"}'::jsonb,
    'a5827701c1c2c7ebebd83e705288382272ac65e5b6d053f930e8a4aeafef52ac',
    'b3374bcb683b2df1e84447ee02e9d8c1b5e8fd5d83e6169e926da3ab72e01290'
  ),
  (
    '569aecf8-aa02-41da-b37a-7e2e20f160fb'::uuid,
    'golds-gym-13210',
    '浜松町東京',
    'HGY_f2kvOaab0cCRi8pkmmU0AHBis',
    '株式会社THINKフィットネス ゴールドジム浜松町東京',
    'https://hyrox-training-finder.hyrox.com/gym/HGY_f2kvOaab0cCRi8pkmmU0AHBis',
    '26b7005edea3935d27564cc6937b01d58061f5af91ec616a1c6ce26a3db72339',
    '2026-08-28T17:26:12.761Z'::timestamptz,
    '2026-11-26T17:26:12.761Z'::timestamptz,
    '{"namespace":"hyrox-training-club","external_identifier":"HGY_f2kvOaab0cCRi8pkmmU0AHBis","official_name":"株式会社THINKフィットネス ゴールドジム浜松町東京"}'::jsonb,
    '{"official_name":"株式会社THINKフィットネス ゴールドジム浜松町東京"}'::jsonb,
    '{"finder_listing":true,"official_external_id":"HGY_f2kvOaab0cCRi8pkmmU0AHBis","official_name":"株式会社THINKフィットネス ゴールドジム浜松町東京"}'::jsonb,
    'f1f8c58190fed1e1dee034ef793a3598b3ee68b26a88ec754914e75cd46a7ca2',
    'fd638791bb81960420c080d6fade4be52d3d64170cff5afcade3ac8de6f11804'
  ),
  (
    'd75c411f-2b58-476d-aa68-f7bde9000002'::uuid,
    'golds-gym-71221',
    '東陽町スーパーセンター',
    'HGY_HfEQpiP2Ha2HB3HYzCFuZJA7R',
    'ゴールドジム東陽町スーパーセンター',
    'https://hyrox-training-finder.hyrox.com/gym/HGY_HfEQpiP2Ha2HB3HYzCFuZJA7R',
    'a06dafd86055fbfaa63af234ae41c7eb82fb7a9da79d43fd63e40b0826f97550',
    '2026-08-28T17:26:12.761Z'::timestamptz,
    '2026-11-26T17:26:12.761Z'::timestamptz,
    '{"namespace":"hyrox-training-club","external_identifier":"HGY_HfEQpiP2Ha2HB3HYzCFuZJA7R","official_name":"ゴールドジム東陽町スーパーセンター"}'::jsonb,
    '{"official_name":"ゴールドジム東陽町スーパーセンター"}'::jsonb,
    '{"finder_listing":true,"official_external_id":"HGY_HfEQpiP2Ha2HB3HYzCFuZJA7R","official_name":"ゴールドジム東陽町スーパーセンター"}'::jsonb,
    '0a3f3293625396942eff00f16ce1466ddb3cba3288c7acb5ff34d4c9466736cc',
    '0d93db9f9f6c26afc6ad205a6bc481a8f4475351012c4502e8a96bf3fac81ace'
  ),
  (
    '7d7216d0-692e-45dd-ad3c-6c4980fdc50a'::uuid,
    'golds-gym-9999',
    '原宿ANNEX',
    'HGY_IyVQTdTdvlkUGVmcaAvVV5BHD',
    'ゴールドジム原宿ANNEX',
    'https://hyrox-training-finder.hyrox.com/gym/HGY_IyVQTdTdvlkUGVmcaAvVV5BHD',
    'b6ec6bde1ac432b82920dfb6f32e48ca6f8ecde1c09b283ef5c77efd43e1c046',
    '2026-08-28T17:26:12.761Z'::timestamptz,
    '2026-11-26T17:26:12.761Z'::timestamptz,
    '{"namespace":"hyrox-training-club","external_identifier":"HGY_IyVQTdTdvlkUGVmcaAvVV5BHD","official_name":"ゴールドジム原宿ANNEX"}'::jsonb,
    '{"official_name":"ゴールドジム原宿ANNEX"}'::jsonb,
    '{"finder_listing":true,"official_external_id":"HGY_IyVQTdTdvlkUGVmcaAvVV5BHD","official_name":"ゴールドジム原宿ANNEX"}'::jsonb,
    '27e0b4317dd8dd7593215bc25aa5e77291f1219fbed12f4262182902f56973d1',
    'a4d46e58d28d29f4efc96dea131949ebd225802e647a57c7adbff844d56fa8f7'
  ),
  (
    '1e1dc6eb-ec16-4850-978a-ac3c513f55ab'::uuid,
    'golds-gym-13150',
    '原宿東京',
    'HGY_QPyi483gAfTjVXv2QoNn5d55m',
    'ゴールドジムハラジュクトウキョウ',
    'https://hyrox-training-finder.hyrox.com/gym/HGY_QPyi483gAfTjVXv2QoNn5d55m',
    '3b4644916fab76fd308962e158aebe25681db3bf9ecb258d17755a607bcc221c',
    '2026-08-28T17:26:12.761Z'::timestamptz,
    '2026-11-26T17:26:12.761Z'::timestamptz,
    '{"namespace":"hyrox-training-club","external_identifier":"HGY_QPyi483gAfTjVXv2QoNn5d55m","official_name":"ゴールドジムハラジュクトウキョウ"}'::jsonb,
    '{"official_name":"ゴールドジムハラジュクトウキョウ"}'::jsonb,
    '{"finder_listing":true,"official_external_id":"HGY_QPyi483gAfTjVXv2QoNn5d55m","official_name":"ゴールドジムハラジュクトウキョウ"}'::jsonb,
    '610279df6b1965fa11bc1a1d15db17e8f9665febd355068fbf6d68ca09bc4830',
    '0f65c5bb177075234cc4e5cda45f11d546182786e1ddb04f59d82aa64b2771a5'
  ),
  (
    'e84c2ea2-bc63-4788-b050-590cfefebe42'::uuid,
    'golds-gym-12160',
    '浦安千葉',
    'HGY_x72wxyNcqCoMCbZxzQkr7nHAk',
    'ゴールドジム浦安千葉',
    'https://hyrox-training-finder.hyrox.com/gym/HGY_x72wxyNcqCoMCbZxzQkr7nHAk',
    'a6c627e31621d10a4490707426cb457ec245c08d3f62b72e4f098ef7ce792032',
    '2026-08-28T17:26:12.761Z'::timestamptz,
    '2026-11-26T17:26:12.761Z'::timestamptz,
    '{"namespace":"hyrox-training-club","external_identifier":"HGY_x72wxyNcqCoMCbZxzQkr7nHAk","official_name":"ゴールドジム浦安千葉"}'::jsonb,
    '{"official_name":"ゴールドジム浦安千葉"}'::jsonb,
    '{"finder_listing":true,"official_external_id":"HGY_x72wxyNcqCoMCbZxzQkr7nHAk","official_name":"ゴールドジム浦安千葉"}'::jsonb,
    'f7a2bbf1613252ce9ab15ab170ed7dc912543ced119817e1bda754a7e51cd41c',
    'b655563951d4c29780433113a692ee3c0081ddb6918bcc9227d14cb127fa8f33'
  );

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
