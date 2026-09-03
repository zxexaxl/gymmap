\set ON_ERROR_STOP on

create or replace function pg_temp.expect(condition boolean, message text)
returns void language plpgsql as $$
begin
  if not condition then
    raise exception 'H3-11D Cohort 2 release validation failed: %', message;
  end if;
end $$;

select pg_temp.expect((select count(*) = 12 from public.training_sources), '6 Finder sources plus 6 facility pages');
select pg_temp.expect((select count(*) = 6 from public.training_review_cycles), '6 review cycles');
select pg_temp.expect((select count(*) = 222 from public.training_review_units), '222 review units');
select pg_temp.expect((select count(*) = 228 from public.training_review_unit_sources), '228 source relations');
select pg_temp.expect((select count(*) = 0 from public.training_review_invalidations), 'zero invalidations');
select pg_temp.expect((select count(*) = 0 from public.training_review_units where positive_outcome = 'NO_POSITIVE_FOUND'), 'no NO_POSITIVE_FOUND');
select pg_temp.expect((select count(*) = 75 from public.training_review_units where review_progress = 'COMPLETE' and source_sufficiency = 'SUFFICIENT' and positive_outcome = 'POSITIVE_FOUND'), '75 positive complete units');
select pg_temp.expect((select count(*) = 147 from public.training_review_units where review_progress = 'PARTIAL' and source_sufficiency = 'INSUFFICIENT' and positive_outcome = 'NOT_ASSESSED'), '147 partial insufficient units');

select pg_temp.expect((select count(*) = 36 from public.location_equipment), '36 equipment claims');
select pg_temp.expect((select count(*) = 3 from public.location_training_capabilities), '3 capability claims');
select pg_temp.expect((select count(*) = 39 from public.training_evidence where location_equipment_id is not null or location_training_capability_id is not null), '39 canonical evidence relationships');
select pg_temp.expect((select count(*) = 14 from public.training_raw_facts), '14 raw facts');
select pg_temp.expect((select count(*) = 6 from public.training_raw_fact_dimensions), '6 raw dimension links');
select pg_temp.expect((select count(*) = 11 from public.training_access_restrictions), '11 typed restrictions');
select pg_temp.expect((select count(*) = 8 from (select split_part(restriction_key, '|', 1) from public.training_access_restrictions group by 1) observations), '8 restriction observations');
select pg_temp.expect((select count(*) = 0 from information_schema.tables where table_schema = 'public' and table_name like '%derived%station%'), 'no derived station table');

select pg_temp.expect((select count(*) = 6 from public.published_location_training_disciplines), '6 published HYROX disciplines');
select pg_temp.expect((select count(*) = 6 from public.published_training_affiliations where is_official), '6 official affiliations');
select pg_temp.expect((select count(*) = 36 from public.published_location_equipment), '36 published equipment positives');
select pg_temp.expect((select count(*) = 3 from public.published_location_training_capabilities), '3 published capability positives');
select pg_temp.expect((select count(*) = 6 from public.search_training_locations('hyrox', p_official_only => true, p_limit => 100)), 'official HYROX search remains coherent');

select pg_temp.expect((select bool_and(relrowsecurity) from pg_class where relname in (
  'training_review_cycles', 'training_review_units', 'training_review_unit_sources', 'training_review_invalidations',
  'training_raw_fact_types', 'training_raw_facts', 'training_raw_fact_dimensions', 'training_access_restrictions'
)), 'RLS remains enabled');
select pg_temp.expect((select count(*) = 0 from pg_policies where tablename in (
  'training_review_cycles', 'training_review_units', 'training_review_unit_sources', 'training_review_invalidations',
  'training_raw_fact_types', 'training_raw_facts', 'training_raw_fact_dimensions', 'training_access_restrictions'
)), 'no permissive policies');
select pg_temp.expect((select bool_and(not has_table_privilege('anon', format('public.%I', name), 'SELECT')) from (values
  ('training_review_cycles'), ('training_review_units'), ('training_review_unit_sources'), ('training_review_invalidations'),
  ('training_raw_fact_types'), ('training_raw_facts'), ('training_raw_fact_dimensions'), ('training_access_restrictions')) t(name)), 'anon denied');
select pg_temp.expect((select bool_and(not has_table_privilege('authenticated', format('public.%I', name), 'SELECT')) from (values
  ('training_review_cycles'), ('training_review_units'), ('training_review_unit_sources'), ('training_review_invalidations'),
  ('training_raw_fact_types'), ('training_raw_facts'), ('training_raw_fact_dimensions'), ('training_access_restrictions')) t(name)), 'authenticated denied');
select pg_temp.expect(not exists (
  select 1 from pg_views where schemaname = 'public' and definition ~ 'training_(review|raw|access_restriction)'
), 'public views do not expose internal objects');
select pg_temp.expect(not exists (
  select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.prokind = 'f' and pg_get_functiondef(p.oid) ~ 'training_(review|raw|access_restriction)'
), 'public functions do not expose internal objects');

select 'H3-11D Cohort 2 BeeQuick disposable validation PASS' as result;
