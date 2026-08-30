import { H3_4_LOCK_KEY, type H34Candidate, type H34ProductionPreflight } from "./hyrox-h3-4-import-candidate";

function sql(value: unknown): string {
  if (value === null || value === undefined) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "null";
  const text = typeof value === "string" ? value : JSON.stringify(value);
  return `'${text.replaceAll("'", "''")}'`;
}

function values(rows: unknown[][]) {
  return rows.map((row) => `  (${row.map(sql).join(", ")})`).join(",\n");
}

export function renderH34Baseline(preflight: H34ProductionPreflight) {
  const brandRows = preflight.sample_brands.map((brand) => [brand.id, brand.name, brand.slug]);
  const locationRows = preflight.sample_locations.map((location) => [
    location.id,
    location.brand_id,
    location.name,
    location.slug,
    location.prefecture,
    location.city,
    location.address_line,
    location.latitude,
    location.longitude,
    location.official_url,
    location.hgy_id,
  ]);
  return [
    "\\set ON_ERROR_STOP on",
    "-- LOCAL-ONLY production-logical baseline for H3-4. No production connection is accepted.",
    "do $$ begin if current_database() !~ '^gymmap_h3_4_rehearsal' then raise exception 'H3-4 baseline is local-rehearsal only'; end if; end $$;",
    "begin;",
    `insert into public.gym_brands(id,name,slug) values\n${values(brandRows)};`,
    "insert into public.gym_brands(id,name,slug) values ('34000000-0000-4000-8000-000000000000','H3-4 baseline other brands','h3-4-baseline-other-brands');",
    `create temp table h34_sample_location_input(id uuid primary key,brand_id uuid,name text,slug text,prefecture text,city text,address_line text,latitude numeric,longitude numeric,official_url text,hgy text);\ninsert into h34_sample_location_input values\n${values(locationRows)};`,
    `insert into public.gym_locations(id,brand_id,name,slug,prefecture,city,address_line,latitude,longitude,official_url,source_url,location_type,is_active,last_verified_at)
      select id,brand_id,name,slug,prefecture,city,address_line,latitude,longitude,official_url,official_url,'fitness_studio',true,'2026-08-30T00:00:00Z'::timestamptz from h34_sample_location_input;`,
    `insert into public.gym_locations(id,brand_id,name,slug,prefecture,city,address_line,latitude,longitude,official_url,source_url,location_type,is_active,last_verified_at)
      select ('34000000-0000-4000-8001-'||lpad(gs::text,12,'0'))::uuid,'34000000-0000-4000-8000-000000000000','H3-4 baseline location '||gs,'h3-4-baseline-location-'||gs,'東京都','テスト区','H3-4 baseline address '||gs,35+(gs::numeric/10000),139+(gs::numeric/10000),'https://baseline.invalid/location/'||gs,'https://baseline.invalid/location/'||gs,'fitness_studio',true,'2026-08-30T00:00:00Z'::timestamptz from generate_series(1,67) gs;`,
    `insert into public.training_sources(location_id,url,canonical_url,source_kind,publisher_authority,availability_state,last_checked_at,review_required,content_hash,metadata_json)
      select id,'https://baseline.invalid/finder/'||id,'https://baseline.invalid/finder/'||id,'finder','governing_body','available','2026-08-30T00:00:00Z',false,encode(digest('baseline-source:'||id,'sha256'),'hex'),'{}'::jsonb from gym_locations;`,
    `insert into public.location_external_identifiers(location_id,namespace,external_identifier,training_source_id,verification_status,verified_at,metadata_json)
      select l.id,'hyrox-training-club',coalesce(i.hgy,'HGY_BASELINE_'||replace(l.id::text,'-','')),s.id,'confirmed','2026-08-30T00:00:00Z','{}'::jsonb
      from gym_locations l join training_sources s on s.location_id=l.id and s.source_kind='finder' left join h34_sample_location_input i on i.id=l.id;`,
    `insert into public.location_training_disciplines(location_id,discipline_id,support_state,verification_status,last_confirmed_at,stale_at)
      select l.id,d.id,'available','confirmed','2026-08-30T00:00:00Z','2026-11-28T00:00:00Z' from gym_locations l cross join training_disciplines d where d.slug='hyrox';`,
    `insert into public.training_affiliations(location_id,discipline_id,affiliation_type,awarding_organization,external_identifier,affiliation_state,verification_status,last_confirmed_at,stale_at)
      select l.id,d.id,'training_club','HYROX',x.external_identifier,'active','confirmed','2026-08-30T00:00:00Z','2026-11-28T00:00:00Z'
      from gym_locations l cross join training_disciplines d join location_external_identifiers x on x.location_id=l.id and x.namespace='hyrox-training-club' where d.slug='hyrox';`,
    `insert into public.training_evidence(training_source_id,location_training_discipline_id,assertion,review_status,observed_at,reviewed_at,content_hash,structured_evidence)
      select s.id,ld.id,'supports','accepted','2026-08-30T00:00:00Z','2026-08-30T00:00:00Z',encode(digest('baseline-discipline:'||ld.id,'sha256'),'hex'),'{}'::jsonb from location_training_disciplines ld join training_sources s on s.location_id=ld.location_id and s.source_kind='finder';`,
    `insert into public.training_evidence(training_source_id,training_affiliation_id,assertion,review_status,observed_at,reviewed_at,content_hash,structured_evidence)
      select s.id,a.id,'supports','accepted','2026-08-30T00:00:00Z','2026-08-30T00:00:00Z',encode(digest('baseline-affiliation:'||a.id,'sha256'),'hex'),'{}'::jsonb from training_affiliations a join training_sources s on s.location_id=a.location_id and s.source_kind='finder';`,
    `do $$ declare n bigint; begin
      if (select count(*) from training_sources)<>82 then raise exception 'baseline source mismatch'; end if;
      if (select count(*) from training_evidence)<>164 then raise exception 'baseline evidence mismatch'; end if;
      if (select count(*) from published_location_training_disciplines where discipline_slug='hyrox')<>82 then raise exception 'baseline publication mismatch'; end if;
      if (select official_location_count from published_training_discipline_summary where slug='hyrox')<>82 then raise exception 'baseline official mismatch'; end if;
      select max(total_count) into n from search_training_locations('hyrox',p_limit=>100); if n<>82 then raise exception 'baseline search mismatch'; end if;
    end $$;`,
    "commit;",
    "select 'H3-4 production-logical baseline PASS' as result;",
    "",
  ].join("\n");
}

export function renderH34Rehearsal(candidate: H34Candidate) {
  const sourceRows = candidate.sources.map((source) => [source.source_ref,source.location_id,source.url,source.canonical_url,source.source_kind,source.publisher_authority,source.availability_state,source.last_checked_at,source.review_required,source.content_hash,source.metadata_json]);
  const equipmentRows = candidate.equipment.map((claim) => [claim.equipment_ref,claim.location_id,claim.equipment_slug,claim.availability_state,claim.quantity,claim.access_mode,claim.reservation_requirement,claim.verification_status,claim.last_confirmed_at,claim.stale_at]);
  const capabilityRows = candidate.capabilities.map((claim) => [claim.capability_ref,claim.location_id,claim.discipline_slug,claim.capability_slug,claim.availability_state,claim.access_mode,claim.reservation_requirement,claim.verification_status,claim.last_confirmed_at,claim.stale_at]);
  const evidenceRows = candidate.evidence.map((evidence) => [evidence.evidence_ref,evidence.source_ref,evidence.target_type,evidence.target_ref,evidence.assertion,evidence.review_status,evidence.evidence_text,evidence.structured_evidence,evidence.observed_at,evidence.reviewed_at,evidence.content_hash]);
  const publicationRows = candidate.publication_rehearsal.locations.map((row) => [
    row.location_id,
    `{${row.equipment_slugs.join(",")}}`,
    `{${row.capability_slugs.join(",")}}`,
    row.open_training_available,
  ]);
  return [
    "\\set ON_ERROR_STOP on",
    "-- LOCAL-ONLY, rollback-only H3-4 atomic rehearsal. Never run against production.",
    "do $$ begin if current_database() !~ '^gymmap_h3_4_rehearsal' then raise exception 'H3-4 rehearsal is local-only'; end if; end $$;",
    "begin;",
    `select pg_advisory_xact_lock(hashtextextended(${sql(H3_4_LOCK_KEY)},0));`,
    "create temp table h34_before as select (select count(*) from training_sources)::int sources,(select count(*) from location_equipment)::int equipment,(select count(*) from location_training_capabilities)::int capabilities,(select count(*) from training_evidence)::int evidence;",
    "create temp table h34_source_input(source_ref text primary key,location_id uuid,url text,canonical_url text,source_kind text,publisher_authority text,availability_state text,last_checked_at timestamptz,review_required boolean,content_hash text,metadata_json jsonb);",
    `insert into h34_source_input values\n${values(sourceRows)};`,
    "create temp table h34_equipment_input(equipment_ref text primary key,location_id uuid,equipment_slug text,availability_state text,quantity int,access_mode text,reservation_requirement text,verification_status text,last_confirmed_at timestamptz,stale_at timestamptz);",
    `insert into h34_equipment_input values\n${values(equipmentRows)};`,
    "create temp table h34_capability_input(capability_ref text primary key,location_id uuid,discipline_slug text,capability_slug text,availability_state text,access_mode text,reservation_requirement text,verification_status text,last_confirmed_at timestamptz,stale_at timestamptz);",
    `insert into h34_capability_input values\n${values(capabilityRows)};`,
    "create temp table h34_evidence_input(evidence_ref text primary key,source_ref text,target_type text,target_ref text,assertion text,review_status text,evidence_text text,structured_evidence jsonb,observed_at timestamptz,reviewed_at timestamptz,content_hash text);",
    `insert into h34_evidence_input values\n${values(evidenceRows)};`,
    "create temp table h34_publication_expected(location_id uuid primary key,equipment_slugs text[],capability_slugs text[],open_training boolean);",
    `insert into h34_publication_expected values\n${values(publicationRows)};`,
    "create temp table h34_source_map(source_ref text primary key,id uuid not null);",
    "create temp table h34_equipment_map(target_ref text primary key,id uuid not null);",
    "create temp table h34_capability_map(target_ref text primary key,id uuid not null);",
    `create or replace procedure pg_temp.apply_h34() language plpgsql as $$
    begin
      if exists(select 1 from h34_source_input i left join gym_locations l on l.id=i.location_id where l.id is null or not l.is_active) then raise exception 'source target location missing/inactive'; end if;
      if exists(select 1 from h34_source_input i join training_sources s on s.canonical_url=i.canonical_url where s.location_id<>i.location_id or s.source_kind<>i.source_kind or s.publisher_authority<>i.publisher_authority) then raise exception 'source natural identity collision'; end if;
      if exists(select 1 from h34_source_input i join training_sources s on s.canonical_url=i.canonical_url and s.location_id=i.location_id and s.source_kind=i.source_kind and s.publisher_authority=i.publisher_authority where s.url<>i.url or s.availability_state<>i.availability_state or s.review_required<>i.review_required or s.content_hash<>i.content_hash or s.last_checked_at<>i.last_checked_at) then raise exception 'source semantic conflict'; end if;
      insert into training_sources(location_id,url,canonical_url,source_kind,publisher_authority,availability_state,last_checked_at,review_required,content_hash,metadata_json)
      select i.location_id,i.url,i.canonical_url,i.source_kind,i.publisher_authority,i.availability_state,i.last_checked_at,i.review_required,i.content_hash,i.metadata_json from h34_source_input i
      where not exists(select 1 from training_sources s where s.location_id=i.location_id and s.canonical_url=i.canonical_url and s.source_kind=i.source_kind and s.publisher_authority=i.publisher_authority);
      truncate h34_source_map;
      insert into h34_source_map select i.source_ref,(array_agg(s.id))[1] from h34_source_input i join training_sources s on s.location_id=i.location_id and s.canonical_url=i.canonical_url and s.source_kind=i.source_kind and s.publisher_authority=i.publisher_authority group by i.source_ref having count(*)=1;
      if (select count(*) from h34_source_map)<>10 then raise exception 'source map incomplete/duplicate'; end if;

      if exists(select 1 from h34_equipment_input i join equipment_types t on t.slug=i.equipment_slug join location_equipment e on e.location_id=i.location_id and e.equipment_type_id=t.id where e.availability_state<>i.availability_state or e.quantity is distinct from i.quantity or e.access_mode<>i.access_mode or e.reservation_requirement<>i.reservation_requirement or e.verification_status<>i.verification_status or e.last_confirmed_at<>i.last_confirmed_at or e.stale_at<>i.stale_at) then raise exception 'equipment semantic conflict or freshness regression'; end if;
      insert into location_equipment(location_id,equipment_type_id,availability_state,quantity,access_mode,reservation_requirement,verification_status,last_confirmed_at,stale_at)
      select i.location_id,t.id,i.availability_state,i.quantity,i.access_mode,i.reservation_requirement,i.verification_status,i.last_confirmed_at,i.stale_at from h34_equipment_input i join equipment_types t on t.slug=i.equipment_slug on conflict(location_id,equipment_type_id) do nothing;
      truncate h34_equipment_map;
      insert into h34_equipment_map select i.equipment_ref,e.id from h34_equipment_input i join equipment_types t on t.slug=i.equipment_slug join location_equipment e on e.location_id=i.location_id and e.equipment_type_id=t.id and e.availability_state=i.availability_state and e.quantity is not distinct from i.quantity and e.access_mode=i.access_mode and e.reservation_requirement=i.reservation_requirement and e.verification_status=i.verification_status and e.last_confirmed_at=i.last_confirmed_at and e.stale_at=i.stale_at;
      if (select count(*) from h34_equipment_map)<>36 then raise exception 'equipment map incomplete'; end if;

      if exists(select 1 from h34_capability_input i join training_disciplines d on d.slug=i.discipline_slug join location_training_disciplines ld on ld.location_id=i.location_id and ld.discipline_id=d.id join training_capability_types t on t.slug=i.capability_slug join location_training_capabilities c on c.location_training_discipline_id=ld.id and c.capability_type_id=t.id where c.availability_state<>i.availability_state or c.access_mode<>i.access_mode or c.reservation_requirement<>i.reservation_requirement or c.verification_status<>i.verification_status or c.last_confirmed_at<>i.last_confirmed_at or c.stale_at<>i.stale_at) then raise exception 'capability semantic conflict or freshness regression'; end if;
      insert into location_training_capabilities(location_training_discipline_id,capability_type_id,availability_state,access_mode,reservation_requirement,verification_status,last_confirmed_at,stale_at)
      select ld.id,t.id,i.availability_state,i.access_mode,i.reservation_requirement,i.verification_status,i.last_confirmed_at,i.stale_at from h34_capability_input i join training_disciplines d on d.slug=i.discipline_slug join location_training_disciplines ld on ld.location_id=i.location_id and ld.discipline_id=d.id join training_capability_types t on t.slug=i.capability_slug on conflict(location_training_discipline_id,capability_type_id) do nothing;
      truncate h34_capability_map;
      insert into h34_capability_map select i.capability_ref,c.id from h34_capability_input i join training_disciplines d on d.slug=i.discipline_slug join location_training_disciplines ld on ld.location_id=i.location_id and ld.discipline_id=d.id join training_capability_types t on t.slug=i.capability_slug join location_training_capabilities c on c.location_training_discipline_id=ld.id and c.capability_type_id=t.id and c.availability_state=i.availability_state and c.access_mode=i.access_mode and c.reservation_requirement=i.reservation_requirement and c.verification_status=i.verification_status and c.last_confirmed_at=i.last_confirmed_at and c.stale_at=i.stale_at;
      if (select count(*) from h34_capability_map)<>16 then raise exception 'capability map incomplete'; end if;

      if exists(select 1 from h34_evidence_input i join training_evidence e on e.content_hash=i.content_hash join h34_source_map sm on sm.source_ref=i.source_ref where e.training_source_id<>sm.id or e.assertion<>i.assertion or e.review_status<>i.review_status or (i.target_type='location_equipment' and e.location_equipment_id is distinct from (select id from h34_equipment_map where target_ref=i.target_ref)) or (i.target_type='location_training_capability' and e.location_training_capability_id is distinct from (select id from h34_capability_map where target_ref=i.target_ref))) then raise exception 'evidence hash/target collision'; end if;
      insert into training_evidence(training_source_id,location_training_capability_id,location_equipment_id,assertion,review_status,evidence_text,structured_evidence,observed_at,reviewed_at,content_hash)
      select sm.id,case when i.target_type='location_training_capability' then cm.id end,case when i.target_type='location_equipment' then em.id end,i.assertion,i.review_status,i.evidence_text,i.structured_evidence,i.observed_at,i.reviewed_at,i.content_hash from h34_evidence_input i join h34_source_map sm using(source_ref) left join h34_capability_map cm on cm.target_ref=i.target_ref left join h34_equipment_map em on em.target_ref=i.target_ref where (cm.id is not null)<>(em.id is not null) and not exists(select 1 from training_evidence e where e.content_hash=i.content_hash);
      if exists(select 1 from h34_evidence_input i left join training_evidence e on e.content_hash=i.content_hash where e.id is null) then raise exception 'evidence map incomplete'; end if;
    end $$;`,
    "call pg_temp.apply_h34();",
    `do $$ declare b h34_before%rowtype; n bigint; begin select * into b from h34_before;
      if (select count(*) from training_sources)<>b.sources+10 then raise exception 'source delta mismatch'; end if;
      if (select count(*) from location_equipment)<>b.equipment+36 then raise exception 'equipment delta mismatch'; end if;
      if (select count(*) from location_training_capabilities)<>b.capabilities+16 then raise exception 'capability delta mismatch'; end if;
      if (select count(*) from training_evidence)<>b.evidence+52 then raise exception 'evidence delta mismatch'; end if;
      if (select count(*) from published_location_equipment)<>36 then raise exception 'published equipment mismatch'; end if;
      if (select count(distinct location_id) from published_location_equipment)<>6 then raise exception 'equipment facility mismatch'; end if;
      if (select count(*) from published_location_training_capabilities)<>16 then raise exception 'published capability mismatch'; end if;
      if (select count(distinct location_id) from published_location_training_capabilities)<>9 then raise exception 'capability facility mismatch'; end if;
      if (select count(*) from published_location_training_capabilities where capability_slug='open-training')<>4 then raise exception 'open-training mismatch'; end if;
      if (select count(*) from published_location_training_disciplines where discipline_slug='hyrox')<>82 then raise exception 'HYROX location publication changed'; end if;
      if (select official_location_count from published_training_discipline_summary where slug='hyrox')<>82 then raise exception 'official publication changed'; end if;
      select max(total_count) into n from search_training_locations('hyrox',p_limit=>100); if n<>82 then raise exception 'search total changed'; end if;
      if exists(select 1 from h34_publication_expected x join lateral (select * from search_training_locations('hyrox',p_limit=>100) s where s.location_id=x.location_id) s on true where s.equipment_slugs<>x.equipment_slugs or s.capability_slugs<>x.capability_slugs or s.open_training_available<>x.open_training) then raise exception 'search projection mismatch'; end if;
    end $$;`,
    "create temp table h34_after_first as select (select count(*) from training_sources)::int sources,(select count(*) from location_equipment)::int equipment,(select count(*) from location_training_capabilities)::int capabilities,(select count(*) from training_evidence)::int evidence,(select min(last_confirmed_at) from location_equipment) equipment_min_confirmed,(select min(last_confirmed_at) from location_training_capabilities) capability_min_confirmed;",
    "call pg_temp.apply_h34();",
    `do $$ declare a h34_after_first%rowtype; begin select * into a from h34_after_first;
      if row((select count(*) from training_sources),(select count(*) from location_equipment),(select count(*) from location_training_capabilities),(select count(*) from training_evidence),(select min(last_confirmed_at) from location_equipment),(select min(last_confirmed_at) from location_training_capabilities))<>row(a.sources,a.equipment,a.capabilities,a.evidence,a.equipment_min_confirmed,a.capability_min_confirmed) then raise exception 'second pass was not idempotent or freshness regressed'; end if;
    end $$;`,
    "do $$ begin begin update h34_source_input set location_id=(select location_id from h34_source_input where source_ref<>(select min(source_ref) from h34_source_input) limit 1) where source_ref=(select min(source_ref) from h34_source_input); call pg_temp.apply_h34(); raise exception 'source collision did not fail'; exception when others then if sqlerrm='source collision did not fail' then raise; end if; end; end $$;",
    "do $$ begin begin update h34_equipment_input set availability_state='unknown' where equipment_ref=(select min(equipment_ref) from h34_equipment_input); call pg_temp.apply_h34(); raise exception 'equipment conflict did not fail'; exception when others then if sqlerrm='equipment conflict did not fail' then raise; end if; end; end $$;",
    "do $$ begin begin update h34_capability_input set availability_state='unknown' where capability_ref=(select min(capability_ref) from h34_capability_input); call pg_temp.apply_h34(); raise exception 'capability conflict did not fail'; exception when others then if sqlerrm='capability conflict did not fail' then raise; end if; end; end $$;",
    "do $$ begin begin update h34_evidence_input set target_ref=(select target_ref from h34_evidence_input where evidence_ref<>(select min(evidence_ref) from h34_evidence_input) limit 1) where evidence_ref=(select min(evidence_ref) from h34_evidence_input); call pg_temp.apply_h34(); raise exception 'evidence conflict did not fail'; exception when others then if sqlerrm='evidence conflict did not fail' then raise; end if; end; end $$;",
    "do $$ begin begin update h34_equipment_input set last_confirmed_at=last_confirmed_at-interval '1 day',stale_at=stale_at-interval '1 day' where equipment_ref=(select min(equipment_ref) from h34_equipment_input); call pg_temp.apply_h34(); raise exception 'freshness regression did not fail'; exception when others then if sqlerrm='freshness regression did not fail' then raise; end if; end; end $$;",
    "rollback;",
    `do $$ declare n bigint; begin
      if (select count(*) from training_sources)<>82 then raise exception 'rollback source mismatch'; end if;
      if (select count(*) from location_equipment)<>0 then raise exception 'rollback equipment mismatch'; end if;
      if (select count(*) from location_training_capabilities)<>0 then raise exception 'rollback capability mismatch'; end if;
      if (select count(*) from training_evidence)<>164 then raise exception 'rollback evidence mismatch'; end if;
      if (select count(*) from published_location_equipment)<>0 then raise exception 'rollback equipment publication mismatch'; end if;
      if (select count(*) from published_location_training_capabilities)<>0 then raise exception 'rollback capability publication mismatch'; end if;
      select max(total_count) into n from search_training_locations('hyrox',p_limit=>100); if n<>82 then raise exception 'rollback search mismatch'; end if;
    end $$;`,
    "select 'H3-4 atomic/publication/search/idempotency/conflict/rollback rehearsal PASS' as result;",
    "",
  ].join("\n");
}
