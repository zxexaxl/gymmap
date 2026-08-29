import type { H210Candidate, H210ProductionPreflight } from "./hyrox-h2-10-candidate";

function sql(value: unknown): string {
  if (value === null || value === undefined) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "null";
  const text = typeof value === "string" ? value : JSON.stringify(value);
  return `'${text.replaceAll("'", "''")}'`;
}

function values(rows: unknown[][]): string {
  return rows.map((row) => `  (${row.map(sql).join(", ")})`).join(",\n");
}

export function renderH210Baseline(preflight: H210ProductionPreflight): string {
  return [
    "\\set ON_ERROR_STOP on",
    "-- LOCAL-ONLY production logical baseline. Guarded against non-rehearsal databases.",
    "do $$ begin if current_database() !~ '^gymmap_h2_10_rehearsal' then raise exception 'H2-10 baseline is local-rehearsal only'; end if; end $$;",
    "begin;",
    `insert into public.gym_brands (id,name,slug,official_url,description) values\n${values(preflight.brands.map((b) => [b.id,b.name,b.slug,b.official_url,b.description]))};`,
    `insert into public.gym_locations (id,brand_id,name,slug,postal_code,prefecture,city,address_line,latitude,longitude,nearest_station,official_url,source_url,location_type,is_active,last_verified_at) values\n${values(preflight.locations.map((l) => [l.id,l.brand_id,l.name,l.slug,l.postal_code,l.prefecture,l.city,l.address_line,l.latitude,l.longitude,l.nearest_station,l.official_url,l.source_url,l.location_type,l.is_active,l.last_verified_at]))};`,
    `insert into public.training_sources (id,location_id,url,canonical_url,source_kind,publisher_authority,availability_state,last_checked_at,review_required,content_hash,metadata_json) values\n${values(preflight.training_sources.map((s) => [s.id,s.location_id,s.url,s.canonical_url,s.source_kind,s.publisher_authority,s.availability_state,s.last_checked_at,s.review_required,s.content_hash,{}]))};`,
    `insert into public.location_training_disciplines (id,location_id,discipline_id,support_state,verification_status,last_confirmed_at,stale_at)
      select v.id::uuid,v.location_id::uuid,d.id,v.support_state,v.verification_status,v.last_confirmed_at::timestamptz,v.stale_at::timestamptz
      from (values\n${values(preflight.location_training_disciplines.map((d) => [d.id,d.location_id,d.support_state,d.verification_status,d.last_confirmed_at,d.stale_at]))}
      ) v(id,location_id,support_state,verification_status,last_confirmed_at,stale_at)
      cross join public.training_disciplines d where d.slug='hyrox';`,
    `insert into public.training_affiliations (id,location_id,discipline_id,affiliation_type,awarding_organization,external_identifier,affiliation_state,verification_status,last_confirmed_at,stale_at)
      select v.id::uuid,v.location_id::uuid,d.id,v.affiliation_type,v.awarding_organization,v.external_identifier,v.affiliation_state,v.verification_status,v.last_confirmed_at::timestamptz,v.stale_at::timestamptz
      from (values\n${values(preflight.hyrox_affiliations.map((a) => [a.id,a.location_id,a.affiliation_type,a.awarding_organization,a.external_identifier,a.affiliation_state,a.verification_status,a.last_confirmed_at,a.stale_at]))}
      ) v(id,location_id,affiliation_type,awarding_organization,external_identifier,affiliation_state,verification_status,last_confirmed_at,stale_at)
      cross join public.training_disciplines d where d.slug='hyrox';`,
    `insert into public.location_external_identifiers (id,location_id,namespace,external_identifier,training_source_id,verification_status,verified_at,metadata_json) values\n${values(preflight.hyrox_external_identifiers.map((i) => [i.id,i.location_id,i.namespace,i.external_identifier,(i as Record<string,unknown>).training_source_id,(i as Record<string,unknown>).verification_status,(i as Record<string,unknown>).verified_at,{}]))};`,
    `insert into public.training_evidence (id,training_source_id,location_training_discipline_id,training_affiliation_id,assertion,review_status,structured_evidence,observed_at,reviewed_at,content_hash) values\n${values(preflight.training_evidence.map((e) => [e.id,e.training_source_id,e.location_training_discipline_id,e.training_affiliation_id,e.assertion,e.review_status,{},e.observed_at,e.observed_at,e.content_hash]))};`,
    `do $$ begin
      if (select count(*) from public.gym_brands) <> ${preflight.counts.gym_brands} then raise exception 'brand baseline mismatch'; end if;
      if (select count(*) from public.gym_locations) <> ${preflight.counts.gym_locations} then raise exception 'location baseline mismatch'; end if;
      if (select count(*) from public.training_sources) <> ${preflight.counts.training_sources} then raise exception 'source baseline mismatch'; end if;
      if (select count(*) from public.published_location_training_disciplines where discipline_slug='hyrox') <> ${preflight.counts.published_hyrox} then raise exception 'publication baseline mismatch'; end if;
      if (select official_location_count from public.published_training_discipline_summary where slug='hyrox') <> ${preflight.counts.official_hyrox} then raise exception 'official baseline mismatch'; end if;
    end $$;`,
    "commit;", "",
  ].join("\n");
}

export function renderH210Rehearsal(candidate: H210Candidate): string {
  const brandRows = candidate.brand_resolutions.map((b) => [b.brand_ref,b.name,b.slug,b.resolution,b.existing_brand_id,b.official_url]);
  const locationRows = candidate.locations.map((l) => [l.location_ref,l.brand_ref,l.name,l.slug,l.postal_code,l.prefecture,l.city,l.address_line,l.latitude,l.longitude,l.official_url,l.source_url,l.location_type,l.last_verified_at,l.hgy_external_id]);
  const sourceRows = candidate.locations.map((l) => [l.training_source.source_ref,l.location_ref,l.training_source.url,l.training_source.canonical_url,l.training_source.last_checked_at,l.training_source.content_hash,l.training_source.metadata_json]);
  const evidenceRows = candidate.locations.flatMap((l) => l.evidence.map((e) => [e.evidence_ref,e.training_source_ref,e.target_type,e.target_ref,e.observed_at,e.reviewed_at,e.content_hash,e.structured_evidence]));
  return [
    "\\set ON_ERROR_STOP on",
    "-- LOCAL-ONLY, rollback-only H2-10 atomic rehearsal. Never run against production.",
    "do $$ begin if current_database() !~ '^gymmap_h2_10_rehearsal' then raise exception 'H2-10 rehearsal is local-only'; end if; end $$;",
    "begin;", "select pg_advisory_xact_lock(hashtextextended('gymmap:hyrox:h2-10:58-location-import', 0));",
    "create temp table h210_before as select",
    "  (select count(*) from gym_brands)::int brands, (select count(*) from gym_locations)::int locations,",
    "  (select count(*) from training_sources)::int sources, (select count(*) from location_external_identifiers)::int identities,",
    "  (select count(*) from location_training_disciplines)::int disciplines, (select count(*) from training_affiliations)::int affiliations,",
    "  (select count(*) from training_evidence)::int evidence;",
    "create temp table h210_brand_input (brand_ref text primary key,name text,slug text,resolution text,existing_brand_id uuid,official_url text);",
    `insert into h210_brand_input values\n${values(brandRows)};`,
    "create temp table h210_location_input (location_ref text primary key,brand_ref text,name text,slug text,postal_code text,prefecture text,city text,address_line text,latitude numeric,longitude numeric,official_url text,source_url text,location_type text,last_verified_at timestamptz,hgy text);",
    `insert into h210_location_input values\n${values(locationRows)};`,
    "create temp table h210_source_input (source_ref text primary key,location_ref text,url text,canonical_url text,last_checked_at timestamptz,content_hash text,metadata_json jsonb);",
    `insert into h210_source_input values\n${values(sourceRows)};`,
    "create temp table h210_evidence_input (evidence_ref text primary key,source_ref text,target_type text,target_ref text,observed_at timestamptz,reviewed_at timestamptz,content_hash text,structured_evidence jsonb);",
    `insert into h210_evidence_input values\n${values(evidenceRows)};`,
    "create temp table h210_brand_map (brand_ref text primary key,id uuid not null);",
    "create temp table h210_location_map (location_ref text primary key,id uuid not null);",
    "create temp table h210_source_map (source_ref text primary key,id uuid not null);",
    "create temp table h210_discipline_map (target_ref text primary key,id uuid not null);",
    "create temp table h210_affiliation_map (target_ref text primary key,id uuid not null);",
    `create or replace procedure pg_temp.apply_h210() language plpgsql as $$
    begin
      if exists (select 1 from h210_brand_input i join gym_brands b on b.slug=i.slug where b.name<>i.name) then raise exception 'brand semantic mismatch'; end if;
      if exists (select 1 from h210_brand_input i join gym_brands b on b.name=i.name where b.slug<>i.slug) then raise exception 'brand name/slug conflict'; end if;
      insert into gym_brands(name,slug,official_url) select name,slug,official_url from h210_brand_input where resolution<>'EXISTING_BRAND_REUSE' on conflict(slug) do nothing;
      truncate h210_brand_map;
      insert into h210_brand_map select i.brand_ref,b.id from h210_brand_input i join gym_brands b on b.slug=i.slug and b.name=i.name;
      if (select count(*) from h210_brand_map) <> 38 then raise exception 'brand resolution incomplete'; end if;

      if exists (select 1 from h210_location_input i join gym_locations l on l.slug=i.slug where l.name<>i.name or l.address_line<>i.address_line or coalesce(l.official_url,'')<>i.official_url) then raise exception 'location slug semantic mismatch'; end if;
      if exists (select 1 from h210_location_input i join h210_brand_map bm using(brand_ref) join gym_locations l on l.official_url=i.official_url where l.slug<>i.slug and l.brand_id<>bm.id) then raise exception 'official URL conflict'; end if;
      if exists (select 1 from h210_location_input i join gym_locations l on regexp_replace(lower(l.address_line),'[^[:alnum:]]','','g')=regexp_replace(lower(i.address_line),'[^[:alnum:]]','','g') where l.slug<>i.slug) then raise exception 'address conflict'; end if;
      insert into gym_locations(brand_id,name,slug,postal_code,prefecture,city,address_line,latitude,longitude,official_url,source_url,location_type,is_active,last_verified_at)
      select bm.id,i.name,i.slug,i.postal_code,i.prefecture,i.city,i.address_line,i.latitude,i.longitude,i.official_url,i.source_url,i.location_type,true,i.last_verified_at from h210_location_input i join h210_brand_map bm using(brand_ref) on conflict(slug) do nothing;
      truncate h210_location_map;
      insert into h210_location_map select i.location_ref,l.id from h210_location_input i join gym_locations l on l.slug=i.slug and l.name=i.name and l.address_line=i.address_line;
      if (select count(*) from h210_location_map) <> 58 then raise exception 'location resolution incomplete'; end if;

      if exists (select 1 from h210_source_input i join training_sources s on s.canonical_url=i.canonical_url join h210_location_map lm on lm.location_ref=i.location_ref where s.location_id<>lm.id or s.publisher_authority<>'governing_body') then raise exception 'source semantic conflict'; end if;
      insert into training_sources(location_id,url,canonical_url,source_kind,publisher_authority,availability_state,last_checked_at,review_required,content_hash,metadata_json)
      select lm.id,i.url,i.canonical_url,'finder','governing_body','available',i.last_checked_at,false,i.content_hash,i.metadata_json from h210_source_input i join h210_location_map lm using(location_ref)
      where not exists (select 1 from training_sources s where s.canonical_url=i.canonical_url);
      truncate h210_source_map;
      insert into h210_source_map select i.source_ref,s.id from h210_source_input i join training_sources s on s.canonical_url=i.canonical_url join h210_location_map lm on lm.location_ref=i.location_ref and lm.id=s.location_id;

      if exists (select 1 from h210_location_input i join location_external_identifiers x on x.namespace='hyrox-training-club' and x.external_identifier=i.hgy join h210_location_map lm on lm.location_ref=i.location_ref where x.location_id<>lm.id) then raise exception 'HGY ownership conflict'; end if;
      insert into location_external_identifiers(location_id,namespace,external_identifier,training_source_id,verification_status,verified_at,metadata_json)
      select lm.id,'hyrox-training-club',i.hgy,sm.id,'confirmed',i.last_verified_at,jsonb_build_object('official_name',i.name) from h210_location_input i join h210_location_map lm using(location_ref) join h210_source_map sm on sm.source_ref='hyrox-finder:'||i.hgy on conflict(namespace,external_identifier) do nothing;

      insert into location_training_disciplines(location_id,discipline_id,support_state,verification_status,last_confirmed_at,stale_at)
      select lm.id,d.id,'available','confirmed',i.last_verified_at,i.last_verified_at+interval '90 days' from h210_location_input i join h210_location_map lm using(location_ref) cross join training_disciplines d where d.slug='hyrox' on conflict(location_id,discipline_id) do nothing;
      truncate h210_discipline_map;
      insert into h210_discipline_map select i.location_ref||':hyrox',ld.id from h210_location_input i join h210_location_map lm using(location_ref) join training_disciplines d on d.slug='hyrox' join location_training_disciplines ld on ld.location_id=lm.id and ld.discipline_id=d.id;

      if exists (select 1 from h210_location_input i join training_affiliations a on a.awarding_organization='HYROX' and a.external_identifier=i.hgy join h210_location_map lm on lm.location_ref=i.location_ref where a.location_id<>lm.id) then raise exception 'affiliation external ID conflict'; end if;
      insert into training_affiliations(location_id,discipline_id,affiliation_type,awarding_organization,external_identifier,affiliation_state,verification_status,last_confirmed_at,stale_at)
      select lm.id,d.id,'training_club','HYROX',i.hgy,'active','confirmed',i.last_verified_at,i.last_verified_at+interval '90 days' from h210_location_input i join h210_location_map lm using(location_ref) cross join training_disciplines d where d.slug='hyrox' on conflict(location_id,discipline_id,affiliation_type,awarding_organization) do nothing;
      truncate h210_affiliation_map;
      insert into h210_affiliation_map select i.location_ref||':hyrox:training_club:HYROX',a.id from h210_location_input i join h210_location_map lm using(location_ref) join training_disciplines d on d.slug='hyrox' join training_affiliations a on a.location_id=lm.id and a.discipline_id=d.id and a.affiliation_type='training_club' and a.awarding_organization='HYROX' and a.external_identifier=i.hgy;

      insert into training_evidence(training_source_id,location_training_discipline_id,training_affiliation_id,assertion,review_status,structured_evidence,observed_at,reviewed_at,content_hash)
      select sm.id,case when e.target_type='location_training_discipline' then dm.id end,case when e.target_type='training_affiliation' then am.id end,'supports','accepted',e.structured_evidence,e.observed_at,e.reviewed_at,e.content_hash
      from h210_evidence_input e join h210_source_map sm using(source_ref) left join h210_discipline_map dm on dm.target_ref=e.target_ref left join h210_affiliation_map am on am.target_ref=e.target_ref
      where not exists (select 1 from training_evidence x where x.content_hash=e.content_hash);
    end $$;`,
    "call pg_temp.apply_h210();",
    `do $$ declare b h210_before%rowtype; n bigint; begin select * into b from h210_before;
      if (select count(*) from gym_brands)<>b.brands+${candidate.counts.gym_brands} then raise exception 'brand delta mismatch'; end if;
      if (select count(*) from gym_locations)<>b.locations+58 then raise exception 'location delta mismatch'; end if;
      if (select count(*) from training_sources)<>b.sources+58 then raise exception 'source delta mismatch'; end if;
      if (select count(*) from location_external_identifiers)<>b.identities+58 then raise exception 'identity delta mismatch'; end if;
      if (select count(*) from location_training_disciplines)<>b.disciplines+58 then raise exception 'discipline delta mismatch'; end if;
      if (select count(*) from training_affiliations)<>b.affiliations+58 then raise exception 'affiliation delta mismatch'; end if;
      if (select count(*) from training_evidence)<>b.evidence+116 then raise exception 'evidence delta mismatch'; end if;
      if (select count(*) from published_location_training_disciplines where discipline_slug='hyrox')<>82 then raise exception 'published HYROX mismatch'; end if;
      if (select official_location_count from published_training_discipline_summary where slug='hyrox')<>82 then raise exception 'official HYROX mismatch'; end if;
      select max(total_count) into n from search_training_locations('hyrox',p_limit=>100); if n<>82 then raise exception 'search HYROX mismatch'; end if;
      if exists(select 1 from search_training_locations('hyrox',p_limit=>100) s join h210_location_map m on m.id=s.location_id where not s.official or s.class_available or s.open_training_available or cardinality(s.equipment_slugs)<>0 or cardinality(s.capability_slugs)<>0) then raise exception 'new location search semantics mismatch'; end if;
    end $$;`,
    "create temp table h210_after_first as select (select count(*) from gym_brands) brands,(select count(*) from gym_locations) locations,(select count(*) from training_sources) sources,(select count(*) from location_external_identifiers) identities,(select count(*) from location_training_disciplines) disciplines,(select count(*) from training_affiliations) affiliations,(select count(*) from training_evidence) evidence;",
    "call pg_temp.apply_h210();",
    "do $$ declare a h210_after_first%rowtype; begin select * into a from h210_after_first; if row((select count(*) from gym_brands),(select count(*) from gym_locations),(select count(*) from training_sources),(select count(*) from location_external_identifiers),(select count(*) from location_training_disciplines),(select count(*) from training_affiliations),(select count(*) from training_evidence))<>row(a.brands,a.locations,a.sources,a.identities,a.disciplines,a.affiliations,a.evidence) then raise exception 'second pass was not idempotent'; end if; end $$;",
    "-- Fail-closed conflict fixtures run in subtransactions and must raise.",
    `do $$ begin begin update h210_brand_input set name=name||' conflict' where brand_ref=(select min(brand_ref) from h210_brand_input); call pg_temp.apply_h210(); raise exception 'brand conflict did not fail'; exception when others then if sqlerrm='brand conflict did not fail' then raise; end if; end; end $$;`,
    `do $$ begin begin update h210_location_input set hgy=(select external_identifier from location_external_identifiers where namespace='hyrox-training-club' limit 1) where location_ref=(select min(location_ref) from h210_location_input); call pg_temp.apply_h210(); raise exception 'HGY conflict did not fail'; exception when others then if sqlerrm='HGY conflict did not fail' then raise; end if; end; end $$;`,
    `do $$ begin begin update h210_location_input set slug=(select slug from gym_locations where id not in(select id from h210_location_map) limit 1) where location_ref=(select min(location_ref) from h210_location_input); call pg_temp.apply_h210(); raise exception 'location conflict did not fail'; exception when others then if sqlerrm='location conflict did not fail' then raise; end if; end; end $$;`,
    "rollback;",
    `do $$ begin
      if (select count(*) from gym_brands)<>${candidate.production_baseline.gym_brands} then raise exception 'rollback brand mismatch'; end if;
      if (select count(*) from gym_locations)<>${candidate.production_baseline.gym_locations} then raise exception 'rollback location mismatch'; end if;
      if (select count(*) from published_location_training_disciplines where discipline_slug='hyrox')<>${candidate.production_baseline.published_hyrox} then raise exception 'rollback publication mismatch'; end if;
    end $$;`,
    "select 'H2-10 atomic/idempotent/publication/conflict/rollback rehearsal PASS' as result;", "",
  ].join("\n");
}
