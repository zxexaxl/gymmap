import { H3_4_LOCK_KEY, assertH34Candidate, h34Hash, type H34Candidate } from "./hyrox-h3-4-import-candidate";

export const H3_4_CANDIDATE_HASH = "f47f7edcb4fb63120d35e44ed2bda50c8c61e779724d4f12453a48037d280ae8";

function literal(value: unknown): string {
  if (value === null || value === undefined) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "null";
  const text = typeof value === "string" ? value : JSON.stringify(value);
  return `'${text.replaceAll("'", "''")}'`;
}

function values(rows: unknown[][]) {
  return rows.map((row) => `  (${row.map(literal).join(", ")})`).join(",\n");
}

export function renderH35ProductionImport(candidate: H34Candidate) {
  assertH34Candidate(candidate);
  const { candidate_hash: candidateHash, ...withoutHash } = candidate;
  if (candidateHash !== H3_4_CANDIDATE_HASH || h34Hash(withoutHash) !== H3_4_CANDIDATE_HASH) {
    throw new Error("H3-4 logical candidate hash mismatch");
  }
  if (candidate.authority.h3_3_commit !== "7a90c9db0bc43039d4c02bdfe377fab5bfb34e12" ||
      candidate.authority.h3_3_sample_sha256 !== "d58b83b254e32a564443bbae46d832e1d5a74ae56f6e24dcf3a2ac854733e9ce") {
    throw new Error("H3-3 authority mismatch");
  }

  const sources = candidate.sources.map((row) => [row.source_ref,row.location_id,row.url,row.canonical_url,row.source_kind,row.publisher_authority,row.availability_state,row.last_checked_at,row.review_required,row.content_hash,row.metadata_json]);
  const equipment = candidate.equipment.map((row) => [row.equipment_ref,row.location_id,row.hgy_id,row.equipment_slug,row.availability_state,row.quantity,row.access_mode,row.reservation_requirement,row.verification_status,row.last_confirmed_at,row.stale_at]);
  const capabilities = candidate.capabilities.map((row) => [row.capability_ref,row.location_id,row.hgy_id,row.discipline_slug,row.capability_slug,row.availability_state,row.access_mode,row.reservation_requirement,row.verification_status,row.last_confirmed_at,row.stale_at,row.freshness_horizon_days]);
  const evidence = candidate.evidence.map((row) => [row.evidence_ref,row.source_ref,row.target_type,row.target_ref,row.assertion,row.review_status,row.evidence_text,row.structured_evidence,row.observed_at,row.reviewed_at,row.content_hash]);
  const publication = candidate.publication_rehearsal.locations.map((row) => [row.location_id,`{${row.equipment_slugs.join(",")}}`,`{${row.capability_slugs.join(",")}}`,row.open_training_available]);
  const targets = [...new Map([...candidate.equipment, ...candidate.capabilities].map((row) => [row.location_id, [row.location_id,row.hgy_id]])).values()].sort((a,b) => String(a[0]).localeCompare(String(b[0])));

  return [
    "-- H3-5 exact H3-4 candidate production import. Generated; do not hand-edit.",
    "begin;",
    "set local statement_timeout = '120s';",
    `select pg_advisory_xact_lock(hashtextextended(${literal(H3_4_LOCK_KEY)},0));`,
    `create temp table h35_authority(candidate_hash text primary key); insert into h35_authority values (${literal(candidateHash)});`,
    "create temp table h35_before as select (select count(*) from gym_brands)::int brands,(select count(*) from gym_locations)::int locations,(select count(*) from training_sources)::int sources,(select count(*) from location_equipment)::int equipment,(select count(*) from location_training_capabilities)::int capabilities,(select count(*) from training_evidence)::int evidence,(select count(*) from location_training_disciplines)::int disciplines,(select count(*) from training_affiliations)::int affiliations,(select count(*) from location_external_identifiers)::int external_ids,(select count(*) from program_training_disciplines)::int program_mappings,(select count(*) from class_schedules)::int classes;",
    "create temp table h35_source_input(source_ref text primary key,location_id uuid,url text,canonical_url text,source_kind text,publisher_authority text,availability_state text,last_checked_at timestamptz,review_required boolean,content_hash text,metadata_json jsonb);",
    `insert into h35_source_input values\n${values(sources)};`,
    "create temp table h35_equipment_input(equipment_ref text primary key,location_id uuid,hgy_id text,equipment_slug text,availability_state text,quantity int,access_mode text,reservation_requirement text,verification_status text,last_confirmed_at timestamptz,stale_at timestamptz);",
    `insert into h35_equipment_input values\n${values(equipment)};`,
    "create temp table h35_capability_input(capability_ref text primary key,location_id uuid,hgy_id text,discipline_slug text,capability_slug text,availability_state text,access_mode text,reservation_requirement text,verification_status text,last_confirmed_at timestamptz,stale_at timestamptz,horizon_days int);",
    `insert into h35_capability_input values\n${values(capabilities)};`,
    "create temp table h35_evidence_input(evidence_ref text primary key,source_ref text,target_type text,target_ref text,assertion text,review_status text,evidence_text text,structured_evidence jsonb,observed_at timestamptz,reviewed_at timestamptz,content_hash text);",
    `insert into h35_evidence_input values\n${values(evidence)};`,
    "create temp table h35_publication_expected(location_id uuid primary key,equipment_slugs text[],capability_slugs text[],open_training boolean);",
    `insert into h35_publication_expected values\n${values(publication)};`,
    "create temp table h35_target_input(location_id uuid primary key,hgy_id text unique);",
    `insert into h35_target_input values\n${values(targets)};`,
    `do $$ declare n bigint; b h35_before%rowtype; begin select * into b from h35_before;
      if (select candidate_hash from h35_authority)<>${literal(H3_4_CANDIDATE_HASH)} then raise exception 'candidate hash mismatch'; end if;
      if row((select count(*) from h35_source_input),(select count(*) from h35_equipment_input),(select count(*) from h35_capability_input),(select count(*) from h35_evidence_input),(select count(*) from h35_target_input))<>row(10::bigint,36::bigint,16::bigint,52::bigint,9::bigint) then raise exception 'candidate row-count mismatch'; end if;
      if b.sources<>82 or b.equipment<>0 or b.capabilities<>0 or b.evidence<>164 then raise exception 'first-import production baseline drift'; end if;
      if (select count(*) from published_location_equipment)<>0 or (select count(*) from published_location_training_capabilities)<>0 then raise exception 'publication baseline drift'; end if;
      if (select count(*) from published_location_training_disciplines where discipline_slug='hyrox')<>82 or (select official_location_count from published_training_discipline_summary where slug='hyrox')<>82 then raise exception 'HYROX publication baseline drift'; end if;
      select max(total_count) into n from search_training_locations('hyrox',p_limit=>100); if n<>82 then raise exception 'HYROX search baseline drift'; end if;
      if (select count(*) from equipment_types)<>9 or (select count(*) from training_capability_types)<>5 then raise exception 'taxonomy drift'; end if;
      if exists(select 1 from h35_target_input i left join gym_locations l on l.id=i.location_id left join location_external_identifiers x on x.location_id=i.location_id and x.namespace='hyrox-training-club' and x.external_identifier=i.hgy_id left join published_training_affiliations a on a.location_id=i.location_id and a.discipline_slug='hyrox' and a.is_official where l.id is null or not l.is_active or x.id is null or a.location_id is null) then raise exception 'target location/HGY/official authority drift'; end if;
      if exists(select 1 from h35_source_input i join training_sources s on s.canonical_url=i.canonical_url or (s.location_id=i.location_id and s.url=i.url)) then raise exception 'source collision'; end if;
      if exists(select 1 from h35_equipment_input i join equipment_types t on t.slug=i.equipment_slug join location_equipment e on e.location_id=i.location_id and e.equipment_type_id=t.id) then raise exception 'equipment collision'; end if;
      if exists(select 1 from h35_capability_input i join training_disciplines d on d.slug=i.discipline_slug join location_training_disciplines ld on ld.location_id=i.location_id and ld.discipline_id=d.id join training_capability_types t on t.slug=i.capability_slug join location_training_capabilities c on c.location_training_discipline_id=ld.id and c.capability_type_id=t.id) then raise exception 'capability collision'; end if;
      if exists(select 1 from h35_evidence_input i join training_evidence e on e.content_hash=i.content_hash) then raise exception 'evidence collision'; end if;
      if exists(select 1 from h35_equipment_input where availability_state<>'available' or verification_status<>'confirmed' or last_confirmed_at<>'2026-08-30T09:20:04Z' or stale_at<>last_confirmed_at+interval '180 days') then raise exception 'equipment positive/freshness contract mismatch'; end if;
      if exists(select 1 from h35_capability_input where availability_state<>'available' or verification_status<>'confirmed' or last_confirmed_at<>'2026-08-30T09:20:04Z' or stale_at<>last_confirmed_at+(horizon_days||' days')::interval or horizon_days<>(case when capability_slug='competition-simulation' then 30 else 90 end)) then raise exception 'capability positive/freshness contract mismatch'; end if;
      if (select count(*) from h35_capability_input where capability_slug='competition-simulation' and horizon_days=30)<>2 then raise exception 'competition-simulation contract mismatch'; end if;
      if exists(select 1 from h35_evidence_input where assertion<>'supports' or review_status<>'accepted' or target_type not in ('location_equipment','location_training_capability')) then raise exception 'evidence acceptance contract mismatch'; end if;
    end $$;`,
    "create temp table h35_source_map(source_ref text primary key,id uuid not null); create temp table h35_equipment_map(target_ref text primary key,id uuid not null); create temp table h35_capability_map(target_ref text primary key,id uuid not null);",
    "insert into training_sources(location_id,url,canonical_url,source_kind,publisher_authority,availability_state,last_checked_at,review_required,content_hash,metadata_json) select location_id,url,canonical_url,source_kind,publisher_authority,availability_state,last_checked_at,review_required,content_hash,metadata_json from h35_source_input;",
    "insert into h35_source_map select i.source_ref,s.id from h35_source_input i join training_sources s on s.location_id=i.location_id and s.canonical_url=i.canonical_url and s.source_kind=i.source_kind and s.publisher_authority=i.publisher_authority;",
    "insert into location_equipment(location_id,equipment_type_id,availability_state,quantity,access_mode,reservation_requirement,verification_status,last_confirmed_at,stale_at) select i.location_id,t.id,i.availability_state,i.quantity,i.access_mode,i.reservation_requirement,i.verification_status,i.last_confirmed_at,i.stale_at from h35_equipment_input i join equipment_types t on t.slug=i.equipment_slug;",
    "insert into h35_equipment_map select i.equipment_ref,e.id from h35_equipment_input i join equipment_types t on t.slug=i.equipment_slug join location_equipment e on e.location_id=i.location_id and e.equipment_type_id=t.id;",
    "insert into location_training_capabilities(location_training_discipline_id,capability_type_id,availability_state,access_mode,reservation_requirement,verification_status,last_confirmed_at,stale_at) select ld.id,t.id,i.availability_state,i.access_mode,i.reservation_requirement,i.verification_status,i.last_confirmed_at,i.stale_at from h35_capability_input i join training_disciplines d on d.slug=i.discipline_slug join location_training_disciplines ld on ld.location_id=i.location_id and ld.discipline_id=d.id join training_capability_types t on t.slug=i.capability_slug;",
    "insert into h35_capability_map select i.capability_ref,c.id from h35_capability_input i join training_disciplines d on d.slug=i.discipline_slug join location_training_disciplines ld on ld.location_id=i.location_id and ld.discipline_id=d.id join training_capability_types t on t.slug=i.capability_slug join location_training_capabilities c on c.location_training_discipline_id=ld.id and c.capability_type_id=t.id;",
    "insert into training_evidence(training_source_id,location_training_capability_id,location_equipment_id,assertion,review_status,evidence_text,structured_evidence,observed_at,reviewed_at,content_hash) select sm.id,case when i.target_type='location_training_capability' then cm.id end,case when i.target_type='location_equipment' then em.id end,i.assertion,i.review_status,i.evidence_text,i.structured_evidence,i.observed_at,i.reviewed_at,i.content_hash from h35_evidence_input i join h35_source_map sm using(source_ref) left join h35_capability_map cm on cm.target_ref=i.target_ref left join h35_equipment_map em on em.target_ref=i.target_ref where (cm.id is not null)<>(em.id is not null);",
    `do $$ declare b h35_before%rowtype; n bigint; begin select * into b from h35_before;
      if row((select count(*) from h35_source_map),(select count(*) from h35_equipment_map),(select count(*) from h35_capability_map))<>row(10::bigint,36::bigint,16::bigint) then raise exception 'insert map incomplete'; end if;
      if row((select count(*) from training_sources),(select count(*) from location_equipment),(select count(*) from location_training_capabilities),(select count(*) from training_evidence))<>row((b.sources+10)::bigint,(b.equipment+36)::bigint,(b.capabilities+16)::bigint,(b.evidence+52)::bigint) then raise exception 'raw delta mismatch'; end if;
      if row((select count(*) from gym_brands),(select count(*) from gym_locations),(select count(*) from location_training_disciplines),(select count(*) from training_affiliations),(select count(*) from location_external_identifiers),(select count(*) from program_training_disciplines),(select count(*) from class_schedules))<>row(b.brands::bigint,b.locations::bigint,b.disciplines::bigint,b.affiliations::bigint,b.external_ids::bigint,b.program_mappings::bigint,b.classes::bigint) then raise exception 'unrelated production data changed'; end if;
      if (select count(*) from published_location_equipment)<>36 or (select count(distinct location_id) from published_location_equipment)<>6 then raise exception 'equipment publication mismatch'; end if;
      if (select count(*) from published_location_training_capabilities)<>16 or (select count(distinct location_id) from published_location_training_capabilities)<>9 then raise exception 'capability publication mismatch'; end if;
      if (select count(*) from published_location_training_capabilities where capability_slug='open-training')<>4 then raise exception 'open-training publication mismatch'; end if;
      if (select count(*) from published_location_training_disciplines where discipline_slug='hyrox')<>82 or (select official_location_count from published_training_discipline_summary where slug='hyrox')<>82 then raise exception 'HYROX publication changed'; end if;
      select max(total_count) into n from search_training_locations('hyrox',p_limit=>100); if n<>82 then raise exception 'HYROX search total changed'; end if;
      if exists(select 1 from h35_publication_expected x left join lateral (select * from search_training_locations('hyrox',p_limit=>100) s where s.location_id=x.location_id) s on true where s.location_id is null or s.equipment_slugs<>x.equipment_slugs or s.capability_slugs<>x.capability_slugs or s.open_training_available<>x.open_training) then raise exception 'search projection mismatch'; end if;
      if exists(select 1 from h35_evidence_input i left join training_evidence e on e.content_hash=i.content_hash left join h35_source_map sm on sm.source_ref=i.source_ref where e.id is null or e.training_source_id<>sm.id or e.assertion<>i.assertion or e.review_status<>i.review_status or (i.target_type='location_equipment' and e.location_equipment_id is distinct from (select id from h35_equipment_map where target_ref=i.target_ref)) or (i.target_type='location_training_capability' and e.location_training_capability_id is distinct from (select id from h35_capability_map where target_ref=i.target_ref))) then raise exception 'evidence semantic verification failed'; end if;
    end $$;`,
    "commit;",
    "select 'H3-5 production import committed' result,(select candidate_hash from h35_authority) candidate_hash,(select count(*) from h35_source_map) inserted_sources,(select count(*) from h35_equipment_map) inserted_equipment,(select count(*) from h35_capability_map) inserted_capabilities,(select count(*) from h35_evidence_input) inserted_evidence;",
    "",
  ].join("\n");
}

function assertAuthority(candidate: H34Candidate) {
  assertH34Candidate(candidate);
  const { candidate_hash: candidateHash, ...withoutHash } = candidate;
  if (candidateHash !== H3_4_CANDIDATE_HASH || h34Hash(withoutHash) !== H3_4_CANDIDATE_HASH) throw new Error("H3-4 logical candidate hash mismatch");
}

export function renderH35ProductionPreflight(candidate: H34Candidate) {
  assertAuthority(candidate);
  const targets = [...new Map([...candidate.equipment, ...candidate.capabilities].map((row) => [row.location_id, [row.location_id,row.hgy_id]])).values()];
  const sourceRows = candidate.sources.map((row) => [row.location_id,row.canonical_url,row.url]);
  const hashes = candidate.evidence.map((row) => [row.content_hash]);
  return `with targets(location_id,hgy_id) as (values\n${values(targets)}),\n` +
    `sources(location_id,canonical_url,url) as (values\n${values(sourceRows)}),\n` +
    `evidence_hashes(content_hash) as (values\n${values(hashes)})\n` +
    `select json_build_object(` +
    `'brands',(select count(*) from gym_brands),'locations',(select count(*) from gym_locations),'active_locations',(select count(*) from gym_locations where is_active),` +
    `'training_sources',(select count(*) from training_sources),'equipment',(select count(*) from location_equipment),'capabilities',(select count(*) from location_training_capabilities),'evidence',(select count(*) from training_evidence),` +
    `'published_equipment',(select count(*) from published_location_equipment),'published_capabilities',(select count(*) from published_location_training_capabilities),` +
    `'hyrox_published',(select count(*) from published_location_training_disciplines where discipline_slug='hyrox'),'hyrox_official',(select official_location_count from published_training_discipline_summary where slug='hyrox'),'hyrox_search',(select max(total_count) from search_training_locations('hyrox',p_limit=>100)),` +
    `'program_mappings',(select count(*) from program_training_disciplines),'classes',(select count(*) from class_schedules),` +
    `'equipment_taxonomy',(select count(*) from equipment_types),'capability_taxonomy',(select count(*) from training_capability_types),` +
    `'target_authority',(select count(*) from targets t join gym_locations l on l.id=t.location_id::uuid and l.is_active join location_external_identifiers x on x.location_id=t.location_id::uuid and x.namespace='hyrox-training-club' and x.external_identifier=t.hgy_id join published_training_affiliations a on a.location_id=t.location_id::uuid and a.discipline_slug='hyrox' and a.is_official),` +
    `'source_collisions',(select count(*) from sources i join training_sources s on s.canonical_url=i.canonical_url or (s.location_id=i.location_id::uuid and s.url=i.url)),` +
    `'evidence_collisions',(select count(*) from evidence_hashes i join training_evidence e using(content_hash))) result;\n`;
}

export function renderH35PostVerify(candidate: H34Candidate) {
  assertAuthority(candidate);
  const sourceRows = candidate.sources.map((row) => [row.location_id,row.canonical_url,row.source_kind,row.publisher_authority]);
  const equipmentRows = candidate.equipment.map((row) => [row.location_id,row.equipment_slug,row.last_confirmed_at,row.stale_at]);
  const capabilityRows = candidate.capabilities.map((row) => [row.location_id,row.capability_slug,row.last_confirmed_at,row.stale_at]);
  const hashes = candidate.evidence.map((row) => [row.content_hash]);
  return `with sources(location_id,canonical_url,source_kind,publisher_authority) as (values\n${values(sourceRows)}),\n` +
    `equipment(location_id,slug,last_confirmed_at,stale_at) as (values\n${values(equipmentRows)}),\n` +
    `capabilities(location_id,slug,last_confirmed_at,stale_at) as (values\n${values(capabilityRows)}),\n` +
    `evidence_hashes(content_hash) as (values\n${values(hashes)})\n` +
    `select json_build_object(` +
    `'training_sources',(select count(*) from training_sources),'equipment',(select count(*) from location_equipment),'capabilities',(select count(*) from location_training_capabilities),'evidence',(select count(*) from training_evidence),` +
    `'matched_sources',(select count(*) from sources i join training_sources s on s.location_id=i.location_id::uuid and s.canonical_url=i.canonical_url and s.source_kind=i.source_kind and s.publisher_authority=i.publisher_authority),` +
    `'matched_equipment',(select count(*) from equipment i join equipment_types t on t.slug=i.slug join location_equipment e on e.location_id=i.location_id::uuid and e.equipment_type_id=t.id and e.last_confirmed_at=i.last_confirmed_at::timestamptz and e.stale_at=i.stale_at::timestamptz),` +
    `'matched_capabilities',(select count(*) from capabilities i join training_disciplines d on d.slug='hyrox' join location_training_disciplines ld on ld.location_id=i.location_id::uuid and ld.discipline_id=d.id join training_capability_types t on t.slug=i.slug join location_training_capabilities c on c.location_training_discipline_id=ld.id and c.capability_type_id=t.id and c.last_confirmed_at=i.last_confirmed_at::timestamptz and c.stale_at=i.stale_at::timestamptz),` +
    `'matched_evidence',(select count(*) from evidence_hashes i join training_evidence e using(content_hash)),` +
    `'published_equipment',(select count(*) from published_location_equipment),'equipment_facilities',(select count(distinct location_id) from published_location_equipment),` +
    `'published_capabilities',(select count(*) from published_location_training_capabilities),'capability_facilities',(select count(distinct location_id) from published_location_training_capabilities),'open_training',(select count(*) from published_location_training_capabilities where capability_slug='open-training'),` +
    `'hyrox_published',(select count(*) from published_location_training_disciplines where discipline_slug='hyrox'),'hyrox_official',(select official_location_count from published_training_discipline_summary where slug='hyrox'),'hyrox_search',(select max(total_count) from search_training_locations('hyrox',p_limit=>100)),` +
    `'brands',(select count(*) from gym_brands),'locations',(select count(*) from gym_locations),'program_mappings',(select count(*) from program_training_disciplines),'classes',(select count(*) from class_schedules)) result;\n`;
}
