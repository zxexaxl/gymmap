\set ON_ERROR_STOP on

begin;

create function pg_temp.assert_true(condition boolean, message text)
returns void language plpgsql as $$
begin
  if condition is not true then
    raise exception 'H3-11B production ACL reproduction failed: %', message;
  end if;
end
$$;

create temp table ledger_tables (table_name text primary key);
insert into ledger_tables values
  ('training_review_protocols'),
  ('training_review_dimensions'),
  ('training_review_cycles'),
  ('training_review_units'),
  ('training_review_unit_sources'),
  ('training_review_invalidations');

select pg_temp.assert_true(
  (select bool_and(
    has_table_privilege('service_role', format('public.%I', table_name), privilege)
  )
  from ledger_tables
  cross join unnest(array[
    'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER', 'MAINTAIN'
  ]) privilege),
  'production-shaped default ACL gives service_role effective ALL before correction'
);

select pg_temp.assert_true(
  (select bool_and(
    not has_table_privilege(role_name, format('public.%I', table_name), privilege)
  )
  from ledger_tables
  cross join unnest(array['anon', 'authenticated']) role_name
  cross join unnest(array[
    'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER', 'MAINTAIN'
  ]) privilege),
  'migration 0013 already denies anon and authenticated despite the default ACL'
);

select 'H3-11B production ACL reproduction PASS' as result;
rollback;
