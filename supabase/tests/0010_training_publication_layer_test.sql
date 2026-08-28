begin;

select no_plan();

create function pg_temp.add_discipline_claim(
  p_location_slug text,
  p_verification_status text,
  p_support_state text,
  p_source_url text default null,
  p_discipline_slug text default 'hyrox',
  p_fresh boolean default true,
  p_refute boolean default false
)
returns uuid
language plpgsql
as $$
declare
  claim_id uuid;
begin
  insert into public.location_training_disciplines (
    location_id,
    discipline_id,
    support_state,
    verification_status,
    last_confirmed_at,
    stale_at
  )
  select
    location.id,
    discipline.id,
    p_support_state,
    p_verification_status,
    case when p_verification_status = 'confirmed' then now() - interval '30 days' end,
    case
      when p_verification_status = 'confirmed' and p_fresh then now() + interval '60 days'
      when p_verification_status = 'confirmed' then now() - interval '1 day'
    end
  from public.gym_locations location
  cross join public.training_disciplines discipline
  where location.slug = p_location_slug
    and discipline.slug = p_discipline_slug
  returning id into claim_id;

  if p_source_url is not null then
    insert into public.training_evidence (
      training_source_id,
      location_training_discipline_id,
      assertion,
      review_status,
      observed_at,
      reviewed_at
    )
    select id, claim_id, 'supports', 'accepted', now(), now()
    from public.training_sources
    where url = p_source_url;
  end if;

  if p_refute then
    insert into public.training_evidence (
      training_source_id,
      location_training_discipline_id,
      assertion,
      review_status,
      observed_at,
      reviewed_at
    )
    select id, claim_id, 'refutes', 'accepted', now(), now()
    from public.training_sources
    where url = 'https://example.test/governing';
  end if;

  return claim_id;
end;
$$;

create function pg_temp.add_capability(
  p_location_slug text,
  p_capability_slug text,
  p_availability_state text,
  p_source_url text,
  p_fresh boolean default true,
  p_verification_status text default 'confirmed',
  p_refute boolean default false
)
returns uuid
language plpgsql
as $$
declare
  claim_id uuid;
begin
  insert into public.location_training_capabilities (
    location_training_discipline_id,
    capability_type_id,
    availability_state,
    access_mode,
    reservation_requirement,
    verification_status,
    last_confirmed_at,
    stale_at
  )
  select
    location_discipline.id,
    capability.id,
    p_availability_state,
    'open_training',
    'not_required',
    p_verification_status,
    case when p_verification_status = 'confirmed' then now() - interval '30 days' end,
    case
      when p_verification_status = 'confirmed' and p_fresh then now() + interval '60 days'
      when p_verification_status = 'confirmed' then now() - interval '1 day'
    end
  from public.location_training_disciplines location_discipline
  join public.gym_locations location on location.id = location_discipline.location_id
  cross join public.training_capability_types capability
  where location.slug = p_location_slug
    and capability.slug = p_capability_slug
  returning id into claim_id;

  insert into public.training_evidence (
    training_source_id,
    location_training_capability_id,
    assertion,
    review_status,
    observed_at,
    reviewed_at
  )
  select id, claim_id, 'supports', 'accepted', now(), now()
  from public.training_sources
  where url = p_source_url;

  if p_refute then
    insert into public.training_evidence (
      training_source_id,
      location_training_capability_id,
      assertion,
      review_status,
      observed_at,
      reviewed_at
    )
    select id, claim_id, 'refutes', 'accepted', now(), now()
    from public.training_sources
    where url = 'https://example.test/governing';
  end if;

  return claim_id;
end;
$$;

create function pg_temp.add_equipment(
  p_location_slug text,
  p_equipment_slug text,
  p_availability_state text,
  p_source_url text,
  p_quantity integer default 1,
  p_fresh boolean default true,
  p_refute boolean default false
)
returns uuid
language plpgsql
as $$
declare
  claim_id uuid;
begin
  insert into public.location_equipment (
    location_id,
    equipment_type_id,
    availability_state,
    quantity,
    access_mode,
    reservation_requirement,
    verification_status,
    last_confirmed_at,
    stale_at
  )
  select
    location.id,
    equipment.id,
    p_availability_state,
    p_quantity,
    'open_training',
    'not_required',
    'confirmed',
    now() - interval '30 days',
    case when p_fresh then now() + interval '60 days' else now() - interval '1 day' end
  from public.gym_locations location
  cross join public.equipment_types equipment
  where location.slug = p_location_slug
    and equipment.slug = p_equipment_slug
  returning id into claim_id;

  insert into public.training_evidence (
    training_source_id,
    location_equipment_id,
    assertion,
    review_status,
    observed_at,
    reviewed_at
  )
  select id, claim_id, 'supports', 'accepted', now(), now()
  from public.training_sources
  where url = p_source_url;

  if p_refute then
    insert into public.training_evidence (
      training_source_id,
      location_equipment_id,
      assertion,
      review_status,
      observed_at,
      reviewed_at
    )
    select id, claim_id, 'refutes', 'accepted', now(), now()
    from public.training_sources
    where url = 'https://example.test/governing';
  end if;

  return claim_id;
end;
$$;

create function pg_temp.add_affiliation(
  p_location_slug text,
  p_affiliation_type text,
  p_organization text,
  p_state text,
  p_source_url text,
  p_fresh boolean default true,
  p_valid_to date default null
)
returns uuid
language plpgsql
as $$
declare
  claim_id uuid;
begin
  insert into public.training_affiliations (
    location_id,
    discipline_id,
    affiliation_type,
    awarding_organization,
    affiliation_state,
    verification_status,
    valid_from,
    valid_to,
    last_confirmed_at,
    stale_at
  )
  select
    location.id,
    discipline.id,
    p_affiliation_type,
    p_organization,
    p_state,
    'confirmed',
    (now() at time zone 'Asia/Tokyo')::date - 30,
    p_valid_to,
    now() - interval '30 days',
    case when p_fresh then now() + interval '60 days' else now() - interval '1 day' end
  from public.gym_locations location
  cross join public.training_disciplines discipline
  where location.slug = p_location_slug
    and discipline.slug = 'hyrox'
  returning id into claim_id;

  insert into public.training_evidence (
    training_source_id,
    training_affiliation_id,
    assertion,
    review_status,
    observed_at,
    reviewed_at
  )
  select id, claim_id, 'supports', 'accepted', now(), now()
  from public.training_sources
  where url = p_source_url;

  return claim_id;
end;
$$;

create function pg_temp.add_program_mapping(
  p_program_slug text,
  p_verification_status text,
  p_source_url text,
  p_fresh boolean default true,
  p_refute boolean default false
)
returns void
language plpgsql
as $$
declare
  target_program_id uuid;
  target_discipline_id uuid;
begin
  select id into target_program_id from public.programs where slug = p_program_slug;
  select id into target_discipline_id from public.training_disciplines where slug = 'hyrox';

  insert into public.program_training_disciplines (
    program_id,
    discipline_id,
    relation_type,
    verification_status,
    last_confirmed_at,
    stale_at
  )
  values (
    target_program_id,
    target_discipline_id,
    'primary',
    p_verification_status,
    case when p_verification_status = 'confirmed' then now() - interval '30 days' end,
    case
      when p_verification_status = 'confirmed' and p_fresh then now() + interval '60 days'
      when p_verification_status = 'confirmed' then now() - interval '1 day'
    end
  );

  insert into public.training_evidence (
    training_source_id,
    program_training_discipline_program_id,
    program_training_discipline_discipline_id,
    assertion,
    review_status,
    observed_at,
    reviewed_at
  )
  select id, target_program_id, target_discipline_id, 'supports', 'accepted', now(), now()
  from public.training_sources
  where url = p_source_url;

  if p_refute then
    insert into public.training_evidence (
      training_source_id,
      program_training_discipline_program_id,
      program_training_discipline_discipline_id,
      assertion,
      review_status,
      observed_at,
      reviewed_at
    )
    select id, target_program_id, target_discipline_id, 'refutes', 'accepted', now(), now()
    from public.training_sources
    where url = 'https://example.test/governing';
  end if;
end;
$$;

insert into public.gym_brands (name, slug)
values ('Publication Test Brand', 'publication-test-brand');

insert into public.gym_locations (
  brand_id,
  name,
  slug,
  prefecture,
  city,
  address_line,
  latitude,
  longitude,
  is_active
)
select
  brand.id,
  location.name,
  location.slug,
  location.prefecture,
  location.city,
  location.address_line,
  location.latitude,
  location.longitude,
  location.is_active
from public.gym_brands brand
cross join (
  values
    ('A Official Location', 'official-location', '東京都', '千代田区', '1-1 Official', 35.680000::numeric, 139.760000::numeric, true),
    ('B Facility Location', 'facility-location', '東京都', '渋谷区', '2-2 Facility', 35.660000::numeric, 139.700000::numeric, true),
    ('C No Class Location', 'no-class-location', '神奈川県', '横浜市', '3-3 No Class', 35.440000::numeric, 139.640000::numeric, true),
    ('D Pagination Location', 'pagination-location', '東京都', '新宿区', '4-4 Pagination', 35.690000::numeric, 139.700000::numeric, true),
    ('Candidate Location', 'candidate-location', '東京都', '港区', null, null, null, true),
    ('Rejected Location', 'rejected-location', '東京都', '港区', null, null, null, true),
    ('Disputed Location', 'disputed-location', '東京都', '港区', null, null, null, true),
    ('Stale Location', 'stale-location', '東京都', '港区', null, null, null, true),
    ('No Evidence Location', 'no-evidence-location', '東京都', '港区', null, null, null, true),
    ('Discovery Location', 'discovery-location', '東京都', '港区', null, null, null, true),
    ('Third Party Location', 'third-party-location', '東京都', '港区', null, null, null, true),
    ('Unavailable Source Location', 'unavailable-source-location', '東京都', '港区', null, null, null, true),
    ('Removed Source Location', 'removed-source-location', '東京都', '港区', null, null, null, true),
    ('Review Source Location', 'review-source-location', '東京都', '港区', null, null, null, true),
    ('Refuted Location', 'refuted-location', '東京都', '港区', null, null, null, true),
    ('Inactive Location', 'inactive-location', '東京都', '港区', null, null, null, false),
    ('Inactive Discipline Location', 'inactive-discipline-location', '東京都', '港区', null, null, null, true),
    ('Schedule Expired', 'schedule-expired', '東京都', '港区', null, null, null, true),
    ('Schedule Future', 'schedule-future', '東京都', '港区', null, null, null, true),
    ('Schedule History', 'schedule-history', '東京都', '港区', null, null, null, true),
    ('Schedule Legacy', 'schedule-legacy', '東京都', '港区', null, null, null, true),
    ('Schedule Inactive', 'schedule-inactive', '東京都', '港区', null, null, null, false)
) as location(name, slug, prefecture, city, address_line, latitude, longitude, is_active)
where brand.slug = 'publication-test-brand';

insert into public.training_disciplines (slug, name, is_active)
values ('inactive-test-discipline', 'Inactive Test Discipline', false);

insert into public.training_sources (
  url,
  source_kind,
  publisher_authority,
  availability_state,
  unavailable_since,
  review_required
)
values
  ('https://example.test/governing', 'finder', 'governing_body', 'available', null, false),
  ('https://example.test/facility', 'facility_page', 'facility_official', 'available', null, false),
  ('https://example.test/schedule', 'schedule', 'official_schedule', 'available', null, false),
  ('https://example.test/social', 'social_post', 'official_social', 'available', null, false),
  ('https://example.test/discovery', 'search_result', 'discovery', 'available', null, false),
  ('https://example.test/third-party', 'other', 'third_party', 'available', null, false),
  ('https://example.test/unavailable', 'finder', 'governing_body', 'unavailable', now(), false),
  ('https://example.test/removed', 'finder', 'governing_body', 'removed', now(), false),
  ('https://example.test/review', 'finder', 'governing_body', 'available', null, true);

select pg_temp.add_discipline_claim('official-location', 'confirmed', 'available', 'https://example.test/governing');
select pg_temp.add_discipline_claim('facility-location', 'confirmed', 'available', 'https://example.test/facility');
select pg_temp.add_discipline_claim('no-class-location', 'confirmed', 'available', 'https://example.test/social');
select pg_temp.add_discipline_claim('pagination-location', 'confirmed', 'available', 'https://example.test/schedule');
select pg_temp.add_discipline_claim('candidate-location', 'candidate', 'available', 'https://example.test/governing');
select pg_temp.add_discipline_claim('rejected-location', 'rejected', 'available', 'https://example.test/governing');
select pg_temp.add_discipline_claim('disputed-location', 'disputed', 'available', 'https://example.test/governing');
select pg_temp.add_discipline_claim('stale-location', 'confirmed', 'available', 'https://example.test/governing', 'hyrox', false);
select pg_temp.add_discipline_claim('no-evidence-location', 'confirmed', 'available');
select pg_temp.add_discipline_claim('discovery-location', 'confirmed', 'available', 'https://example.test/discovery');
select pg_temp.add_discipline_claim('third-party-location', 'confirmed', 'available', 'https://example.test/third-party');
select pg_temp.add_discipline_claim('unavailable-source-location', 'confirmed', 'available', 'https://example.test/unavailable');
select pg_temp.add_discipline_claim('removed-source-location', 'confirmed', 'available', 'https://example.test/removed');
select pg_temp.add_discipline_claim('review-source-location', 'confirmed', 'available', 'https://example.test/review');
select pg_temp.add_discipline_claim('refuted-location', 'confirmed', 'available', 'https://example.test/governing', 'hyrox', true, true);
select pg_temp.add_discipline_claim('inactive-location', 'confirmed', 'available', 'https://example.test/governing');
select pg_temp.add_discipline_claim('inactive-discipline-location', 'confirmed', 'available', 'https://example.test/governing', 'inactive-test-discipline');

select pg_temp.add_capability('official-location', 'open-training', 'available', 'https://example.test/facility');
select pg_temp.add_capability('official-location', 'outdoor-running-access', 'available', 'https://example.test/governing');
select pg_temp.add_capability('official-location', 'competition-simulation', 'temporarily_unavailable', 'https://example.test/governing');
select pg_temp.add_capability('official-location', 'discipline-coaching', 'unknown', 'https://example.test/governing');
select pg_temp.add_capability('official-location', 'sled-push-pull-space', 'available', 'https://example.test/governing', false);
select pg_temp.add_capability('facility-location', 'open-training', 'available', 'https://example.test/facility');
select pg_temp.add_capability('candidate-location', 'open-training', 'available', 'https://example.test/governing');

select pg_temp.add_equipment('official-location', 'ski-erg', 'available', 'https://example.test/governing', 2);
select pg_temp.add_equipment('official-location', 'row-erg', 'available', 'https://example.test/facility', 1);
select pg_temp.add_equipment('official-location', 'weighted-sled', 'unavailable', 'https://example.test/governing');
select pg_temp.add_equipment('official-location', 'wall-ball-target', 'available', 'https://example.test/governing', 1, false);
select pg_temp.add_equipment('official-location', 'sandbag', 'available', 'https://example.test/governing', 1, true, true);
select pg_temp.add_equipment('facility-location', 'ski-erg', 'available', 'https://example.test/facility');
select pg_temp.add_equipment('no-class-location', 'ski-erg', 'available', 'https://example.test/social');
select pg_temp.add_equipment('no-class-location', 'row-erg', 'available', 'https://example.test/social');

select pg_temp.add_affiliation('official-location', 'training_club', 'Official Organization', 'active', 'https://example.test/governing');
select pg_temp.add_affiliation('official-location', 'partner', 'Future Valid Organization', 'active', 'https://example.test/facility', true, (now() at time zone 'Asia/Tokyo')::date + 30);
select pg_temp.add_affiliation('official-location', 'expired', 'Expired Organization', 'active', 'https://example.test/governing', true, (now() at time zone 'Asia/Tokyo')::date - 1);
select pg_temp.add_affiliation('official-location', 'revoked', 'Revoked Organization', 'revoked', 'https://example.test/governing');
select pg_temp.add_affiliation('official-location', 'stale', 'Stale Organization', 'active', 'https://example.test/governing', false);
select pg_temp.add_affiliation('official-location', 'review', 'Review Organization', 'active', 'https://example.test/review');
select pg_temp.add_affiliation('facility-location', 'training_club', 'Facility Organization', 'active', 'https://example.test/facility');

insert into public.programs (name, slug)
values
  ('HYROX Published Test Class', 'hyrox-published-test-class'),
  ('HYROX Candidate Test Class', 'hyrox-candidate-test-class'),
  ('HYROX Stale Test Class', 'hyrox-stale-test-class'),
  ('HYROX Refuted Test Class', 'hyrox-refuted-test-class');

select pg_temp.add_program_mapping('hyrox-published-test-class', 'confirmed', 'https://example.test/schedule');
select pg_temp.add_program_mapping('hyrox-candidate-test-class', 'candidate', 'https://example.test/schedule');
select pg_temp.add_program_mapping('hyrox-stale-test-class', 'confirmed', 'https://example.test/schedule', false);
select pg_temp.add_program_mapping('hyrox-refuted-test-class', 'confirmed', 'https://example.test/schedule', true, true);

insert into public.class_schedules (
  location_id,
  program_id,
  raw_program_name,
  weekday,
  start_time,
  end_time,
  valid_from,
  valid_to,
  needs_review
)
select location.id, program.id, schedule.raw_name, 'saturday', schedule.start_time, schedule.end_time,
  schedule.valid_from, schedule.valid_to, schedule.needs_review
from (
  values
    ('official-location', 'official-old-overlap', time '09:00', time '10:00', (now() at time zone 'Asia/Tokyo')::date - 14, (now() at time zone 'Asia/Tokyo')::date + 14, false),
    ('official-location', 'official-current-max', time '10:00', time '11:00', (now() at time zone 'Asia/Tokyo')::date - 7, (now() at time zone 'Asia/Tokyo')::date + 14, false),
    ('facility-location', 'facility-needs-review', time '11:00', time '12:00', (now() at time zone 'Asia/Tokyo')::date - 7, (now() at time zone 'Asia/Tokyo')::date + 14, true),
    ('schedule-expired', 'expired-dated', time '09:00', time '10:00', (now() at time zone 'Asia/Tokyo')::date - 30, (now() at time zone 'Asia/Tokyo')::date - 1, false),
    ('schedule-future', 'future-dated', time '09:00', time '10:00', (now() at time zone 'Asia/Tokyo')::date + 1, (now() at time zone 'Asia/Tokyo')::date + 30, false),
    ('schedule-history', 'history-expired', time '09:00', time '10:00', (now() at time zone 'Asia/Tokyo')::date - 30, (now() at time zone 'Asia/Tokyo')::date - 1, false),
    ('schedule-history', 'history-legacy', time '10:00', time '11:00', null::date, null::date, false),
    ('schedule-legacy', 'legacy-current', time '09:00', time '10:00', null::date, null::date, false),
    ('schedule-inactive', 'inactive-current', time '09:00', time '10:00', (now() at time zone 'Asia/Tokyo')::date - 7, (now() at time zone 'Asia/Tokyo')::date + 14, false)
) as schedule(location_slug, raw_name, start_time, end_time, valid_from, valid_to, needs_review)
join public.gym_locations location on location.slug = schedule.location_slug
cross join public.programs program
where program.slug = 'hyrox-published-test-class';

select results_eq(
  $$select array_agg(location.slug order by location.slug)
    from public.published_location_training_disciplines published
    join public.gym_locations location on location.id = published.location_id
    where published.discipline_slug = 'hyrox'$$,
  $$values (array['facility-location','no-class-location','official-location','pagination-location']::text[])$$,
  'only confirmed fresh eligible supported HYROX locations are published'
);

select is((select count(*) from public.published_location_training_disciplines published join public.gym_locations location on location.id = published.location_id where location.slug = 'candidate-location'), 0::bigint, 'candidate is hidden');
select is((select count(*) from public.published_location_training_disciplines published join public.gym_locations location on location.id = published.location_id where location.slug = 'rejected-location'), 0::bigint, 'rejected is hidden');
select is((select count(*) from public.published_location_training_disciplines published join public.gym_locations location on location.id = published.location_id where location.slug = 'disputed-location'), 0::bigint, 'disputed is hidden');
select is((select count(*) from public.published_location_training_disciplines published join public.gym_locations location on location.id = published.location_id where location.slug = 'stale-location'), 0::bigint, 'stale claim is hidden');
select is((select count(*) from public.published_location_training_disciplines published join public.gym_locations location on location.id = published.location_id where location.slug = 'no-evidence-location'), 0::bigint, 'unsupported claim is hidden');
select is((select count(*) from public.published_location_training_disciplines published join public.gym_locations location on location.id = published.location_id where location.slug = 'discovery-location'), 0::bigint, 'discovery-only support is hidden');
select is((select count(*) from public.published_location_training_disciplines published join public.gym_locations location on location.id = published.location_id where location.slug = 'third-party-location'), 0::bigint, 'third-party-only support is hidden');
select is((select count(*) from public.published_location_training_disciplines published join public.gym_locations location on location.id = published.location_id where location.slug = 'unavailable-source-location'), 0::bigint, 'unavailable source is hidden');
select is((select count(*) from public.published_location_training_disciplines published join public.gym_locations location on location.id = published.location_id where location.slug = 'removed-source-location'), 0::bigint, 'removed source is hidden');
select is((select count(*) from public.published_location_training_disciplines published join public.gym_locations location on location.id = published.location_id where location.slug = 'review-source-location'), 0::bigint, 'review-required source is hidden');
select is((select count(*) from public.published_location_training_disciplines published join public.gym_locations location on location.id = published.location_id where location.slug = 'refuted-location'), 0::bigint, 'accepted refute blocks publication');
select is((select count(*) from public.published_location_training_disciplines published join public.gym_locations location on location.id = published.location_id where location.slug = 'inactive-location'), 0::bigint, 'inactive location is hidden');
select is((select count(*) from public.published_location_training_disciplines published join public.gym_locations location on location.id = published.location_id where location.slug = 'inactive-discipline-location'), 0::bigint, 'inactive discipline is hidden');

select results_eq(
  $$select array_agg(capability_slug order by capability_slug)
    from public.published_location_training_capabilities capability
    join public.gym_locations location on location.id = capability.location_id
    where location.slug = 'official-location'$$,
  $$values (array['open-training','outdoor-running-access']::text[])$$,
  'only available fresh evidenced capabilities with a published parent are exposed'
);
select is((select count(*) from public.published_location_training_capabilities capability join public.gym_locations location on location.id = capability.location_id where location.slug = 'candidate-location'), 0::bigint, 'capability parent must be published');

select results_eq(
  $$select array_agg(equipment_slug order by equipment_slug)
    from public.published_location_equipment equipment
    join public.gym_locations location on location.id = equipment.location_id
    where location.slug = 'official-location'$$,
  $$values (array['row-erg','ski-erg']::text[])$$,
  'unavailable stale and refuted equipment are hidden'
);
select results_eq(
  $$select quantity from public.published_location_equipment equipment
    join public.gym_locations location on location.id = equipment.location_id
    where location.slug = 'official-location' and equipment.equipment_slug = 'ski-erg'$$,
  $$values (2)$$,
  'published equipment preserves quantity'
);

select results_eq(
  $$select awarding_organization, is_official
    from public.published_training_affiliations affiliation
    join public.gym_locations location on location.id = affiliation.location_id
    where location.slug = 'official-location'
    order by awarding_organization$$,
  $$values ('Future Valid Organization', false), ('Official Organization', true)$$,
  'affiliations apply validity freshness state and governing-body Official rules'
);
select results_eq(
  $$select is_official from public.published_training_affiliations affiliation
    join public.gym_locations location on location.id = affiliation.location_id
    where location.slug = 'facility-location'$$,
  $$values (false)$$,
  'facility-official support publishes affiliation without Official status'
);

select results_eq(
  $$select array_agg(program.slug order by program.slug)
    from public.published_program_training_disciplines mapping
    join public.programs program on program.id = mapping.program_id$$,
  $$values (array['hyrox-published-test-class']::text[])$$,
  'candidate stale and refuted program mappings are hidden'
);

select results_eq(
  $$select raw_program_name from public.current_class_schedules
    where location_id = (select id from public.gym_locations where slug = 'official-location')$$,
  $$values ('official-current-max')$$,
  'overlapping current dated periods select the maximum valid_from'
);
select is((select count(*) from public.current_class_schedules where location_id = (select id from public.gym_locations where slug = 'schedule-expired')), 0::bigint, 'expired dated schedule is excluded');
select is((select count(*) from public.current_class_schedules where location_id = (select id from public.gym_locations where slug = 'schedule-future')), 0::bigint, 'future-only schedule is excluded');
select is((select count(*) from public.current_class_schedules where location_id = (select id from public.gym_locations where slug = 'schedule-history')), 0::bigint, 'dated history prevents legacy fallback');
select results_eq(
  $$select raw_program_name from public.current_class_schedules
    where location_id = (select id from public.gym_locations where slug = 'schedule-legacy')$$,
  $$values ('legacy-current')$$,
  'never-dated location uses legacy schedule rows'
);
select is((select count(*) from public.current_class_schedules where location_id = (select id from public.gym_locations where slug = 'schedule-inactive')), 0::bigint, 'inactive location schedule is excluded');
select results_eq(
  $$select needs_review from public.current_class_schedules
    where location_id = (select id from public.gym_locations where slug = 'facility-location')$$,
  $$values (true)$$,
  'current schedule preserves needs_review'
);

select results_eq(
  $$select published_location_count, official_location_count
    from public.published_training_discipline_summary where slug = 'hyrox'$$,
  $$values (4::bigint, 1::bigint)$$,
  'summary counts only published and governing-body Official locations'
);
select is((select count(*) from public.published_training_discipline_summary where slug = 'inactive-test-discipline'), 0::bigint, 'summary omits disciplines without published locations');

select results_eq(
  $$select array_agg(location_slug order by location_slug) from public.search_training_locations('hyrox')$$,
  $$values (array['facility-location','no-class-location','official-location','pagination-location']::text[])$$,
  'search returns only published HYROX locations'
);
select results_eq(
  $$select array_agg(location_slug order by location_slug)
    from public.search_training_locations('hyrox', p_prefecture => '神奈川県')$$,
  $$values (array['no-class-location']::text[])$$,
  'prefecture filter is exact'
);
select results_eq(
  $$select array_agg(location_slug order by location_slug)
    from public.search_training_locations('hyrox', p_city => '渋谷区')$$,
  $$values (array['facility-location']::text[])$$,
  'city filter is exact'
);
select results_eq(
  $$select location_slug from public.search_training_locations('hyrox', p_official_only => true)$$,
  $$values ('official-location')$$,
  'official_only requires a governing-body Official affiliation'
);
select results_eq(
  $$select array_agg(location_slug order by location_slug)
    from public.search_training_locations('hyrox', p_equipment_slugs => array['ski-erg'])$$,
  $$values (array['facility-location','no-class-location','official-location']::text[])$$,
  'single equipment filter matches published equipment'
);
select results_eq(
  $$select array_agg(location_slug order by location_slug)
    from public.search_training_locations('hyrox', p_equipment_slugs => array['ski-erg','row-erg'])$$,
  $$values (array['no-class-location','official-location']::text[])$$,
  'multiple equipment filter uses ALL-match semantics'
);
select is(
  (select count(*) from public.search_training_locations('hyrox', p_equipment_slugs => array['ski-erg','weighted-sled'])),
  0::bigint,
  'missing requested equipment excludes location'
);
select results_eq(
  $$select location_slug from public.search_training_locations(
      'hyrox', p_capability_slugs => array['open-training','outdoor-running-access']
    )$$,
  $$values ('official-location')$$,
  'capability filter uses ALL-match semantics'
);
select is(
  (select count(*) from public.search_training_locations('hyrox', p_capability_slugs => array['competition-simulation'])),
  0::bigint,
  'missing published capability excludes location'
);
select results_eq(
  $$select location_slug from public.search_training_locations('hyrox', p_has_class => true)$$,
  $$values ('official-location')$$,
  'has_class=true requires current non-review class and published program mapping'
);
select results_eq(
  $$select array_agg(location_slug order by location_slug)
    from public.search_training_locations('hyrox', p_has_class => false)$$,
  $$values (array['facility-location','no-class-location','pagination-location']::text[])$$,
  'has_class=false excludes current published classes and treats needs_review as unavailable'
);
select is((select count(*) from public.search_training_locations('hyrox', p_has_class => null)), 4::bigint, 'has_class=null applies no class filter');
select results_eq(
  $$select equipment_slugs, capability_slugs, open_training_available
    from public.search_training_locations('hyrox') where location_slug = 'official-location'$$,
  $$values (array['row-erg','ski-erg']::text[], array['open-training','outdoor-running-access']::text[], true)$$,
  'result arrays are deterministic distinct and open-training is derived'
);
select results_eq(
  $$select total_count from public.search_training_locations('hyrox', p_offset => 0, p_limit => 1)$$,
  $$values (4::bigint)$$,
  'total_count is calculated before pagination'
);
select is((select count(*) from public.search_training_locations('hyrox', p_offset => 1, p_limit => 2)), 2::bigint, 'offset and limit paginate deterministically');
select throws_ok($$select * from public.search_training_locations('hyrox', p_offset => -1)$$, '22023');
select throws_ok($$select * from public.search_training_locations('hyrox', p_limit => 0)$$, '22023');
select throws_ok($$select * from public.search_training_locations('hyrox', p_limit => 101)$$, '22023');
select throws_ok($$select * from public.search_training_locations('')$$, '22023');

select ok(
  not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name in (
        'published_location_training_disciplines',
        'published_location_training_capabilities',
        'published_location_equipment',
        'published_training_affiliations',
        'published_program_training_disciplines',
        'published_training_discipline_summary'
      )
      and column_name in (
        'evidence_text',
        'structured_evidence',
        'content_hash',
        'metadata_json',
        'reviewed_by',
        'notes',
        'url',
        'review_status',
        'verification_status'
      )
  ),
  'publication projections do not leak private evidence/source/candidate columns'
);

select results_eq(
  $$select count(*)::integer from pg_proc
    where pronamespace = 'public'::regnamespace
      and proname in (
        'search_class_schedule_page',
        'favorite_class_schedule_week',
        'get_latest_schedule_periods_by_location',
        'get_popular_program_summary'
      )
      and prosecdef = false$$,
  $$values (4)$$,
  'existing four GymMap RPCs remain SECURITY INVOKER'
);

set local role anon;

select is((select count(*) from public.published_location_training_disciplines where discipline_slug = 'hyrox'), 4::bigint, 'anon can read publication views');
select is((select count(*) from public.search_training_locations('hyrox')), 4::bigint, 'anon can execute search_training_locations');
select throws_ok($$select count(*) from public.location_training_disciplines$$, '42501');
select throws_ok($$select count(*) from public.training_evidence$$, '42501');
select throws_ok($$select count(*) from public.training_sources$$, '42501');

reset role;
set local role authenticated;

select is((select count(*) from public.published_location_training_disciplines where discipline_slug = 'hyrox'), 4::bigint, 'authenticated can read publication views');
select is((select count(*) from public.search_training_locations('hyrox')), 4::bigint, 'authenticated can execute search_training_locations');
select throws_ok($$select count(*) from public.location_training_disciplines$$, '42501');
select throws_ok($$select count(*) from public.training_evidence$$, '42501');
select throws_ok($$select count(*) from public.training_sources$$, '42501');

reset role;

select * from finish();
rollback;
