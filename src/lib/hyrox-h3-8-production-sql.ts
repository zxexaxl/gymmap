import type { buildH37Release } from "./hyrox-h3-7-import-candidate";
import { H3_7_LOCK_KEY } from "./hyrox-h3-7-import-candidate";

type Candidate = ReturnType<typeof buildH37Release>["candidate"] & {
  releaseAuthority?: {
    monitorDeltaHash: string;
    projectedMonitorManifestHash: string;
    releaseHash: string;
  };
};

const EXPECTED = {
  candidate: "9610b5ea03d43c78823857620d4813203f6db2a1e12632c5c559dffec19ba83e",
  delta: "f3cfeca4db5828308e6cb85d4c370153d61a489d11429ad6618d4bae0b02e79a",
  manifest: "65a7e36c81f52d72b6215e26ab03caecac3d036e73a378a740fc8c3a03e34df2",
  release: "dc97df4fd675d29e71425c7720ede609234c749da305aa5249f8dcfc3c32c255",
} as const;

function literal(value: unknown) {
  if (value === null || value === undefined) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return String(value);
  const text = typeof value === "string" ? value : JSON.stringify(value);
  return `'${text.replaceAll("'", "''")}'`;
}
function values(rows: unknown[][]) { return rows.map((row) => `  (${row.map(literal).join(", ")})`).join(",\n"); }

function assertCandidate(candidate: Candidate) {
  if (candidate.candidateHash !== EXPECTED.candidate || candidate.releaseAuthority?.monitorDeltaHash !== EXPECTED.delta ||
      candidate.releaseAuthority?.projectedMonitorManifestHash !== EXPECTED.manifest || candidate.releaseAuthority?.releaseHash !== EXPECTED.release) {
    throw new Error("H3-8 release authority mismatch");
  }
  if (candidate.sources.length !== 16 || candidate.equipment.length !== 73 || candidate.capabilities.length !== 25 || candidate.evidence.length !== 98) {
    throw new Error("H3-8 graph count mismatch");
  }
}

function inputs(candidate: Candidate) {
  const sources = candidate.sources.map((r) => [r.sourceRef,r.locationId,r.hgyId,r.url,r.canonicalUrl,r.sourceKind,r.publisherAuthority,r.availabilityState,r.lastCheckedAt,r.reviewRequired,r.contentHash,r.metadata]);
  const equipment = candidate.equipment.map((r) => [r.equipmentRef,r.locationId,r.hgyId,r.equipmentSlug,r.availabilityState,r.quantity,r.accessMode,r.reservationRequirement,r.verificationStatus,r.lastConfirmedAt,r.staleAt,r.freshnessHorizonDays]);
  const capabilities = candidate.capabilities.map((r) => [r.capabilityRef,r.locationId,r.hgyId,r.disciplineSlug,r.capabilitySlug,r.availabilityState,r.accessMode,r.reservationRequirement,r.verificationStatus,r.lastConfirmedAt,r.staleAt,r.freshnessHorizonDays]);
  const evidence = candidate.evidence.map((r) => [r.evidenceRef,r.sourceRef,r.targetType,r.targetRef,r.assertion,r.reviewStatus,r.evidenceText,r.structuredEvidence,r.observedAt,r.reviewedAt,r.contentHash]);
  const publication = candidate.publicationPreview.locations.map((r) => [r.locationId,`{${r.equipmentSlugs.join(",")}}`,`{${r.capabilitySlugs.join(",")}}`,r.openTrainingAvailable]);
  const targets = [...new Map([...candidate.equipment, ...candidate.capabilities].map((r) => [r.locationId,[r.locationId,r.hgyId]])).values()];
  return { sources, equipment, capabilities, evidence, publication, targets };
}

export function renderH38ProductionSql(candidate: Candidate) {
  assertCandidate(candidate);
  const i = inputs(candidate);
  return [
    "\\set ON_ERROR_STOP on",
    "-- H3-8 exact production transaction. Generated from frozen H3-7 release authority.",
    "begin;",
    `select pg_advisory_xact_lock(hashtextextended(${literal(H3_7_LOCK_KEY)},0));`,
    `create temp table h38_authority(candidate_hash text,monitor_delta_hash text,manifest_hash text,release_hash text); insert into h38_authority values (${literal(EXPECTED.candidate)},${literal(EXPECTED.delta)},${literal(EXPECTED.manifest)},${literal(EXPECTED.release)});`,
    "create temp table h38_before as select (select count(*) from gym_brands)::int brands,(select count(*) from gym_locations)::int locations,(select count(*) from training_sources)::int sources,(select count(*) from location_equipment)::int equipment,(select count(*) from location_training_capabilities)::int capabilities,(select count(*) from training_evidence)::int evidence,(select count(*) from location_training_disciplines)::int disciplines,(select count(*) from training_affiliations)::int affiliations,(select count(*) from location_external_identifiers)::int external_ids,(select count(*) from program_training_disciplines)::int program_mappings,(select count(*) from class_schedules)::int classes;",
    "create temp table h38_existing_sources as table training_sources; create temp table h38_existing_equipment as table location_equipment; create temp table h38_existing_capabilities as table location_training_capabilities; create temp table h38_existing_evidence as table training_evidence;",
    "create temp table h38_source_input(source_ref text primary key,location_id uuid,hgy_id text,url text,canonical_url text,source_kind text,publisher_authority text,availability_state text,last_checked_at timestamptz,review_required boolean,content_hash text,metadata_json jsonb);",
    `insert into h38_source_input values\n${values(i.sources)};`,
    "create temp table h38_equipment_input(equipment_ref text primary key,location_id uuid,hgy_id text,equipment_slug text,availability_state text,quantity int,access_mode text,reservation_requirement text,verification_status text,last_confirmed_at timestamptz,stale_at timestamptz,horizon_days int);",
    `insert into h38_equipment_input values\n${values(i.equipment)};`,
    "create temp table h38_capability_input(capability_ref text primary key,location_id uuid,hgy_id text,discipline_slug text,capability_slug text,availability_state text,access_mode text,reservation_requirement text,verification_status text,last_confirmed_at timestamptz,stale_at timestamptz,horizon_days int);",
    `insert into h38_capability_input values\n${values(i.capabilities)};`,
    "create temp table h38_evidence_input(evidence_ref text primary key,source_ref text,target_type text,target_ref text,assertion text,review_status text,evidence_text text,structured_evidence jsonb,observed_at timestamptz,reviewed_at timestamptz,content_hash text);",
    `insert into h38_evidence_input values\n${values(i.evidence)};`,
    "create temp table h38_publication_expected(location_id uuid primary key,equipment_slugs text[],capability_slugs text[],open_training boolean);",
    `insert into h38_publication_expected values\n${values(i.publication)};`,
    "create temp table h38_target_input(location_id uuid primary key,hgy_id text unique);",
    `insert into h38_target_input values\n${values(i.targets)};`,
    `do $$ declare b h38_before%rowtype; n bigint; begin select * into b from h38_before;
      if (select release_hash from h38_authority)<>${literal(EXPECTED.release)} or (select candidate_hash from h38_authority)<>${literal(EXPECTED.candidate)} then raise exception 'release authority mismatch'; end if;
      if row((select count(*) from h38_source_input),(select count(*) from h38_equipment_input),(select count(*) from h38_capability_input),(select count(*) from h38_evidence_input),(select count(*) from h38_target_input))<>row(16::bigint,73::bigint,25::bigint,98::bigint,16::bigint) then raise exception 'candidate row-count mismatch'; end if;
      if b.sources<>92 or b.equipment<>36 or b.capabilities<>16 or b.evidence<>216 then raise exception 'production baseline drift'; end if;
      if (select count(*) from published_location_equipment)<>36 or (select count(*) from published_location_training_capabilities)<>16 then raise exception 'publication baseline drift'; end if;
      if (select count(*) from published_location_training_disciplines where discipline_slug='hyrox')<>82 or (select official_location_count from published_training_discipline_summary where slug='hyrox')<>82 then raise exception 'HYROX baseline drift'; end if;
      select max(total_count) into n from search_training_locations('hyrox',p_limit=>100); if n<>82 then raise exception 'search baseline drift'; end if;
      if (select count(*) from equipment_types)<>9 or (select count(*) from training_capability_types)<>5 then raise exception 'taxonomy drift'; end if;
      if exists(select 1 from h38_target_input x left join gym_locations l on l.id=x.location_id left join location_external_identifiers e on e.location_id=x.location_id and e.namespace='hyrox-training-club' and e.external_identifier=x.hgy_id left join published_training_affiliations a on a.location_id=x.location_id and a.discipline_slug='hyrox' and a.is_official where l.id is null or not l.is_active or e.id is null or a.location_id is null) then raise exception 'target authority drift'; end if;
      if exists(select 1 from h38_source_input i join training_sources s on s.location_id=i.location_id and s.canonical_url=i.canonical_url and s.source_kind=i.source_kind and s.publisher_authority=i.publisher_authority) then raise exception 'source relation collision'; end if;
      if exists(select 1 from h38_equipment_input i join equipment_types t on t.slug=i.equipment_slug join location_equipment e on e.location_id=i.location_id and e.equipment_type_id=t.id) then raise exception 'equipment collision'; end if;
      if exists(select 1 from h38_capability_input i join training_disciplines d on d.slug=i.discipline_slug join location_training_disciplines ld on ld.location_id=i.location_id and ld.discipline_id=d.id join training_capability_types t on t.slug=i.capability_slug join location_training_capabilities c on c.location_training_discipline_id=ld.id and c.capability_type_id=t.id) then raise exception 'capability collision'; end if;
      if exists(select 1 from h38_evidence_input i join training_evidence e on e.content_hash=i.content_hash) then raise exception 'evidence collision'; end if;
      if exists(select 1 from h38_equipment_input where availability_state<>'available' or verification_status<>'confirmed' or horizon_days<>180 or stale_at<>last_confirmed_at+interval '180 days') then raise exception 'equipment semantic/freshness mismatch'; end if;
      if exists(select 1 from h38_capability_input where availability_state<>'available' or verification_status<>'confirmed' or horizon_days<>(case when capability_slug='competition-simulation' then 30 else 90 end) or stale_at<>last_confirmed_at+(horizon_days||' days')::interval) then raise exception 'capability semantic/freshness mismatch'; end if;
      if (select count(*) from h38_capability_input where capability_slug='competition-simulation')<>11 or (select count(*) from h38_capability_input where capability_slug='open-training')<>1 then raise exception 'capability count mismatch'; end if;
      if exists(select 1 from h38_evidence_input where assertion<>'supports' or review_status<>'accepted' or target_type not in ('location_equipment','location_training_capability')) then raise exception 'evidence contract mismatch'; end if;
    end $$;`,
    "create temp table h38_source_map(source_ref text primary key,id uuid not null); create temp table h38_equipment_map(target_ref text primary key,id uuid not null); create temp table h38_capability_map(target_ref text primary key,id uuid not null);",
    "insert into training_sources(location_id,url,canonical_url,source_kind,publisher_authority,availability_state,last_checked_at,review_required,content_hash,metadata_json) select location_id,url,canonical_url,source_kind,publisher_authority,availability_state,last_checked_at,review_required,content_hash,metadata_json from h38_source_input;",
    "insert into h38_source_map select i.source_ref,s.id from h38_source_input i join training_sources s on s.location_id=i.location_id and s.canonical_url=i.canonical_url and s.source_kind=i.source_kind and s.publisher_authority=i.publisher_authority;",
    "insert into location_equipment(location_id,equipment_type_id,availability_state,quantity,access_mode,reservation_requirement,verification_status,last_confirmed_at,stale_at) select i.location_id,t.id,i.availability_state,i.quantity,i.access_mode,i.reservation_requirement,i.verification_status,i.last_confirmed_at,i.stale_at from h38_equipment_input i join equipment_types t on t.slug=i.equipment_slug;",
    "insert into h38_equipment_map select i.equipment_ref,e.id from h38_equipment_input i join equipment_types t on t.slug=i.equipment_slug join location_equipment e on e.location_id=i.location_id and e.equipment_type_id=t.id;",
    "insert into location_training_capabilities(location_training_discipline_id,capability_type_id,availability_state,access_mode,reservation_requirement,verification_status,last_confirmed_at,stale_at) select ld.id,t.id,i.availability_state,i.access_mode,i.reservation_requirement,i.verification_status,i.last_confirmed_at,i.stale_at from h38_capability_input i join training_disciplines d on d.slug=i.discipline_slug join location_training_disciplines ld on ld.location_id=i.location_id and ld.discipline_id=d.id join training_capability_types t on t.slug=i.capability_slug;",
    "insert into h38_capability_map select i.capability_ref,c.id from h38_capability_input i join training_disciplines d on d.slug=i.discipline_slug join location_training_disciplines ld on ld.location_id=i.location_id and ld.discipline_id=d.id join training_capability_types t on t.slug=i.capability_slug join location_training_capabilities c on c.location_training_discipline_id=ld.id and c.capability_type_id=t.id;",
    "insert into training_evidence(training_source_id,location_training_capability_id,location_equipment_id,assertion,review_status,evidence_text,structured_evidence,observed_at,reviewed_at,content_hash) select sm.id,case when i.target_type='location_training_capability' then cm.id end,case when i.target_type='location_equipment' then em.id end,i.assertion,i.review_status,i.evidence_text,i.structured_evidence,i.observed_at,i.reviewed_at,i.content_hash from h38_evidence_input i join h38_source_map sm using(source_ref) left join h38_capability_map cm on cm.target_ref=i.target_ref left join h38_equipment_map em on em.target_ref=i.target_ref where (cm.id is not null)<>(em.id is not null);",
    `do $$ declare b h38_before%rowtype; n bigint; begin select * into b from h38_before;
      if row((select count(*) from h38_source_map),(select count(*) from h38_equipment_map),(select count(*) from h38_capability_map))<>row(16::bigint,73::bigint,25::bigint) then raise exception 'insert map incomplete'; end if;
      if row((select count(*) from training_sources),(select count(*) from location_equipment),(select count(*) from location_training_capabilities),(select count(*) from training_evidence))<>row(108::bigint,109::bigint,41::bigint,314::bigint) then raise exception 'raw delta mismatch'; end if;
      if row((select count(*) from gym_brands),(select count(*) from gym_locations),(select count(*) from location_training_disciplines),(select count(*) from training_affiliations),(select count(*) from location_external_identifiers),(select count(*) from program_training_disciplines),(select count(*) from class_schedules))<>row(b.brands::bigint,b.locations::bigint,b.disciplines::bigint,b.affiliations::bigint,b.external_ids::bigint,b.program_mappings::bigint,b.classes::bigint) then raise exception 'unrelated data changed'; end if;
      if exists(select 1 from h38_existing_sources x left join training_sources y on y.id=x.id where y is distinct from x) or exists(select 1 from h38_existing_equipment x left join location_equipment y on y.id=x.id where y is distinct from x) or exists(select 1 from h38_existing_capabilities x left join location_training_capabilities y on y.id=x.id where y is distinct from x) or exists(select 1 from h38_existing_evidence x left join training_evidence y on y.id=x.id where y is distinct from x) then raise exception 'existing enrichment changed'; end if;
      if (select count(*) from published_location_equipment)<>109 or (select count(distinct location_id) from published_location_equipment)<>22 then raise exception 'equipment publication mismatch'; end if;
      if (select count(*) from published_location_training_capabilities)<>41 or (select count(distinct location_id) from published_location_training_capabilities)<>21 then raise exception 'capability publication mismatch'; end if;
      if (select count(*) from (select location_id from published_location_equipment union select location_id from published_location_training_capabilities) u)<>25 or (select count(*) from published_location_training_capabilities where capability_slug='open-training')<>5 or (select count(*) from published_location_training_capabilities where capability_slug='competition-simulation')<>13 then raise exception 'publication projection mismatch'; end if;
      if (select count(*) from published_location_training_disciplines where discipline_slug='hyrox')<>82 or (select official_location_count from published_training_discipline_summary where slug='hyrox')<>82 then raise exception 'HYROX changed'; end if;
      select max(total_count) into n from search_training_locations('hyrox',p_limit=>100); if n<>82 then raise exception 'search changed'; end if;
      if exists(select 1 from h38_publication_expected x left join lateral (select * from search_training_locations('hyrox',p_limit=>100) s where s.location_id=x.location_id) s on true where s.location_id is null or s.equipment_slugs<>x.equipment_slugs or s.capability_slugs<>x.capability_slugs or s.open_training_available<>x.open_training) then raise exception 'search projection mismatch'; end if;
      if exists(select 1 from h38_evidence_input i left join training_evidence e on e.content_hash=i.content_hash left join h38_source_map sm on sm.source_ref=i.source_ref where e.id is null or e.training_source_id<>sm.id or e.assertion<>i.assertion or e.review_status<>i.review_status or (i.target_type='location_equipment' and e.location_equipment_id is distinct from (select id from h38_equipment_map where target_ref=i.target_ref)) or (i.target_type='location_training_capability' and e.location_training_capability_id is distinct from (select id from h38_capability_map where target_ref=i.target_ref))) then raise exception 'evidence verification failed'; end if;
    end $$;`,
    "commit;",
    "select 'H3-8 production import committed' result,(select release_hash from h38_authority) release_hash,16 inserted_sources,73 inserted_equipment,25 inserted_capabilities,98 inserted_evidence;",
    "",
  ].join("\n");
}

// Supabase's linked Management API executes one SQL request, not a psql script.
// PostgreSQL's explicit transaction still fails closed: any statement error aborts
// the transaction and makes COMMIT impossible. Keep the psql ON_ERROR_STOP variant
// as the portable archive and expose this separately for the linked API transport.
export function renderH38ManagementApiSql(candidate: Candidate) {
  const sql = renderH38ProductionSql(candidate).replace("\\set ON_ERROR_STOP on\n", "");
  if ((sql.match(/\bbegin;/gi) ?? []).length !== 1 || (sql.match(/\bcommit;/gi) ?? []).length !== 1 || sql.includes("\\set")) {
    throw new Error("H3-8 Management API transaction boundary mismatch");
  }
  return sql;
}

export function renderH38PostVerify(candidate: Candidate) {
  assertCandidate(candidate); const i = inputs(candidate);
  return `with sources(location_id,canonical_url,source_kind,publisher_authority) as (values\n${values(candidate.sources.map(r=>[r.locationId,r.canonicalUrl,r.sourceKind,r.publisherAuthority]))}),\n`+
    `equipment(location_id,slug,last_confirmed_at,stale_at) as (values\n${values(candidate.equipment.map(r=>[r.locationId,r.equipmentSlug,r.lastConfirmedAt,r.staleAt]))}),\n`+
    `capabilities(location_id,slug,last_confirmed_at,stale_at) as (values\n${values(candidate.capabilities.map(r=>[r.locationId,r.capabilitySlug,r.lastConfirmedAt,r.staleAt]))}),\n`+
    `evidence_hashes(content_hash) as (values\n${values(i.evidence.map(r=>[r[10]]))}) select json_build_object(`+
    `'sources',(select count(*) from training_sources),'equipment',(select count(*) from location_equipment),'capabilities',(select count(*) from location_training_capabilities),'evidence',(select count(*) from training_evidence),`+
    `'matched_sources',(select count(*) from sources i join training_sources s on s.location_id=i.location_id::uuid and s.canonical_url=i.canonical_url and s.source_kind=i.source_kind and s.publisher_authority=i.publisher_authority),`+
    `'matched_equipment',(select count(*) from equipment i join equipment_types t on t.slug=i.slug join location_equipment e on e.location_id=i.location_id::uuid and e.equipment_type_id=t.id and e.last_confirmed_at=i.last_confirmed_at::timestamptz and e.stale_at=i.stale_at::timestamptz),`+
    `'matched_capabilities',(select count(*) from capabilities i join training_disciplines d on d.slug='hyrox' join location_training_disciplines ld on ld.location_id=i.location_id::uuid and ld.discipline_id=d.id join training_capability_types t on t.slug=i.slug join location_training_capabilities c on c.location_training_discipline_id=ld.id and c.capability_type_id=t.id and c.last_confirmed_at=i.last_confirmed_at::timestamptz and c.stale_at=i.stale_at::timestamptz),`+
    `'matched_evidence',(select count(*) from evidence_hashes i join training_evidence e using(content_hash)),'published_equipment',(select count(*) from published_location_equipment),'equipment_facilities',(select count(distinct location_id) from published_location_equipment),`+
    `'published_capabilities',(select count(*) from published_location_training_capabilities),'capability_facilities',(select count(distinct location_id) from published_location_training_capabilities),'any_enriched',(select count(*) from (select location_id from published_location_equipment union select location_id from published_location_training_capabilities) u),`+
    `'open_training',(select count(*) from published_location_training_capabilities where capability_slug='open-training'),'simulation',(select count(*) from published_location_training_capabilities where capability_slug='competition-simulation'),`+
    `'hyrox',(select count(*) from published_location_training_disciplines where discipline_slug='hyrox'),'official',(select official_location_count from published_training_discipline_summary where slug='hyrox'),'search',(select max(total_count) from search_training_locations('hyrox',p_limit=>100))) result;\n`;
}
