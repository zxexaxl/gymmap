\set ON_ERROR_STOP on

create or replace function pg_temp.expect(condition boolean, message text)
returns void language plpgsql as $$
begin
  if not condition then raise exception 'H3-11D Cohort 1 release validation failed: %', message; end if;
end $$;

select pg_temp.expect((select count(*)=24 from public.training_sources where metadata_json->>'sourceRef' like 'src-%'), '24 source identities resolved');
select pg_temp.expect((select count(*)=8 from public.training_review_cycles), '8 review cycles');
select pg_temp.expect((select count(*)=296 from public.training_review_units), '296 review units');
select pg_temp.expect((select count(*)=476 from public.training_review_unit_sources), '476 reviewed source relations');
select pg_temp.expect((select count(*)=0 from public.training_review_invalidations), 'zero invalidations');
select pg_temp.expect((select count(*)=0 from public.training_review_units where positive_outcome='NO_POSITIVE_FOUND'), 'no invented NO_POSITIVE_FOUND');

select pg_temp.expect((select count(*)=19 from public.location_equipment), '19 equipment claims');
select pg_temp.expect((select count(*)=18 from public.location_training_capabilities), '18 capability claims');
select pg_temp.expect((select count(*)=38 from public.training_evidence where location_equipment_id is not null or location_training_capability_id is not null), '38 accepted claim evidence rows');
select pg_temp.expect((select count(distinct coalesce(location_equipment_id, location_training_capability_id))=37 from public.training_evidence), '38 evidence rows reconcile to 37 claims');

select pg_temp.expect((select count(*)=20 from public.training_raw_facts), '19 observations normalize to 20 typed raw fact rows');
select pg_temp.expect((select count(*)=55 from public.training_raw_fact_dimensions), '55 exact raw fact dimension links');
select pg_temp.expect((select count(*)=6 from public.training_access_restrictions), '4 observations normalize to 6 typed restriction rows');
select pg_temp.expect((select count(distinct split_part(fact_key,'|',1))=19 from public.training_raw_facts), '19 raw observation identities preserved');
select pg_temp.expect((select count(distinct split_part(restriction_key,'|',1))=4 from public.training_access_restrictions), '4 restriction observation identities preserved');
select pg_temp.expect((select count(*)=20 from public.training_raw_facts where freshness_policy_key is not null and freshness_expires_at>reviewed_at), 'raw freshness authority complete');
select pg_temp.expect((select count(*)=6 from public.training_access_restrictions where freshness_policy_key='raw-access-restriction-90-day' and freshness_expires_at>reviewed_at), 'restriction freshness authority complete');

select pg_temp.expect((select count(*)=19 from public.published_location_equipment), 'public equipment projection contains accepted positives only');
select pg_temp.expect((select count(*)=18 from public.published_location_training_capabilities), 'public capability projection contains accepted positives only');
select pg_temp.expect((select count(*)=8 from public.search_training_locations('hyrox',p_official_only=>true,p_limit=>100)), 'official HYROX search remains coherent');

select pg_temp.expect((select bool_and(relrowsecurity) from pg_class where relname in (
  'training_review_cycles','training_review_units','training_review_unit_sources','training_review_invalidations',
  'training_raw_fact_types','training_raw_facts','training_raw_fact_dimensions','training_access_restrictions'
)), 'RLS remains enabled');
select pg_temp.expect((select count(*)=0 from pg_policies where tablename in (
  'training_review_cycles','training_review_units','training_review_unit_sources','training_review_invalidations',
  'training_raw_fact_types','training_raw_facts','training_raw_fact_dimensions','training_access_restrictions'
)), 'internal objects have zero permissive policies');
select pg_temp.expect((select bool_and(not has_table_privilege('anon',format('public.%I',name),'SELECT')) from (values
  ('training_review_cycles'),('training_review_units'),('training_review_unit_sources'),('training_review_invalidations'),
  ('training_raw_fact_types'),('training_raw_facts'),('training_raw_fact_dimensions'),('training_access_restrictions')) t(name)), 'anon denied');
select pg_temp.expect((select bool_and(not has_table_privilege('authenticated',format('public.%I',name),'SELECT')) from (values
  ('training_review_cycles'),('training_review_units'),('training_review_unit_sources'),('training_review_invalidations'),
  ('training_raw_fact_types'),('training_raw_facts'),('training_raw_fact_dimensions'),('training_access_restrictions')) t(name)), 'authenticated denied');
select pg_temp.expect(not exists (
  select 1 from pg_views where schemaname='public' and definition ~ 'training_(review|raw|access_restriction)'
), 'public views do not expose ledger/raw/restriction objects');
select pg_temp.expect(not exists (
  select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.prokind = 'f' and pg_get_functiondef(p.oid) ~ 'training_(review|raw|access_restriction)'
), 'public functions do not expose ledger/raw/restriction objects');

do $$
declare before_count bigint;
begin
  select count(*) into before_count from public.training_raw_facts;
  begin
    insert into public.training_raw_facts (
      location_id,discipline_id,review_cycle_id,review_unit_id,review_unit_source_id,training_source_id,
      source_class,fact_type_id,review_aspect,fact_key,statement,evidence_text,directness,observed_at,reviewed_at,reviewer_authority
    ) select location_id,discipline_id,review_cycle_id,review_unit_id,review_unit_source_id,training_source_id,
      source_class,fact_type_id,review_aspect,'invalid-release-test','x','x',directness,reviewed_at,reviewed_at - interval '1 day','x'
      from public.training_raw_facts limit 1;
    raise exception 'invalid fact unexpectedly inserted';
  exception when check_violation then null;
  end;
  if (select count(*) from public.training_raw_facts)<>before_count then raise exception 'failed statement did not roll back'; end if;
end $$;

select 'H3-11D Cohort 1 Production Data Gate disposable validation PASS' as result;
