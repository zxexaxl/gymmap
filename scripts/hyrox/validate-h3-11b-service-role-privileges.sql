\set ON_ERROR_STOP on

begin;

create function pg_temp.assert_true(condition boolean, message text)
returns void language plpgsql as $$
begin
  if condition is not true then
    raise exception 'H3-11B service_role reconciliation failed: %', message;
  end if;
end
$$;

create function pg_temp.expect_insufficient_privilege(statement text, message text)
returns void language plpgsql as $$
begin
  begin
    execute statement;
  exception
    when insufficient_privilege then
      return;
    when others then
      raise exception 'H3-11B service_role reconciliation failed: % (expected 42501, received %: %)',
        message, sqlstate, sqlerrm;
  end;
  raise exception 'H3-11B service_role reconciliation failed: % (statement unexpectedly succeeded)', message;
end
$$;

create temp table ledger_table_contract (
  table_name text primary key,
  insert_allowed boolean not null
);
insert into ledger_table_contract values
  ('training_review_protocols', false),
  ('training_review_dimensions', false),
  ('training_review_cycles', true),
  ('training_review_units', true),
  ('training_review_unit_sources', true),
  ('training_review_invalidations', true);

select pg_temp.assert_true(
  (select bool_and(has_table_privilege('service_role', format('public.%I', table_name), 'SELECT'))
   from ledger_table_contract),
  'service_role SELECT is present on all six tables'
);
select pg_temp.assert_true(
  (select bool_and(
    has_table_privilege('service_role', format('public.%I', table_name), 'INSERT') = insert_allowed
  ) from ledger_table_contract),
  'service_role INSERT matches metadata-read-only/history-append-only contract'
);
select pg_temp.assert_true(
  (select bool_and(
    not has_table_privilege('service_role', format('public.%I', table_name), privilege)
  )
  from ledger_table_contract
  cross join unnest(array[
    'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER', 'MAINTAIN'
  ]) privilege),
  'service_role has no effective mutation/DDL-maintenance privilege beyond history INSERT'
);
select pg_temp.assert_true(
  (select bool_and(
    not has_table_privilege(role_name, format('public.%I', table_name), privilege)
  )
  from ledger_table_contract
  cross join unnest(array['anon', 'authenticated']) role_name
  cross join unnest(array[
    'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER', 'MAINTAIN'
  ]) privilege),
  'anon and authenticated have no effective ledger table privileges'
);
select pg_temp.assert_true(
  (select bool_and(c.relrowsecurity)
   from pg_class c
   join pg_namespace n on n.oid = c.relnamespace
   join ledger_table_contract contract on contract.table_name = c.relname
   where n.nspname = 'public'),
  'RLS remains enabled on all six ledger tables'
);
select pg_temp.assert_true(
  (select count(*) = 0
   from pg_policies
   where schemaname = 'public' and tablename in (select table_name from ledger_table_contract)),
  'no ledger RLS policy was introduced'
);

set local role service_role;

select count(*) from public.training_review_protocols;
select count(*) from public.training_review_dimensions;
select count(*) from public.training_review_cycles;
select count(*) from public.training_review_units;
select count(*) from public.training_review_unit_sources;
select count(*) from public.training_review_invalidations;

insert into public.training_review_cycles select * from public.training_review_cycles where false;
insert into public.training_review_units select * from public.training_review_units where false;
insert into public.training_review_unit_sources select * from public.training_review_unit_sources where false;
insert into public.training_review_invalidations select * from public.training_review_invalidations where false;

select pg_temp.expect_insufficient_privilege(
  'insert into public.training_review_protocols select * from public.training_review_protocols where false',
  'service_role metadata protocol INSERT is denied'
);
select pg_temp.expect_insufficient_privilege(
  'insert into public.training_review_dimensions select * from public.training_review_dimensions where false',
  'service_role metadata dimension INSERT is denied'
);

select pg_temp.expect_insufficient_privilege('update public.training_review_protocols set created_at = created_at where false', 'service_role UPDATE protocols');
select pg_temp.expect_insufficient_privilege('update public.training_review_dimensions set created_at = created_at where false', 'service_role UPDATE dimensions');
select pg_temp.expect_insufficient_privilege('update public.training_review_cycles set created_at = created_at where false', 'service_role UPDATE cycles');
select pg_temp.expect_insufficient_privilege('update public.training_review_units set created_at = created_at where false', 'service_role UPDATE units');
select pg_temp.expect_insufficient_privilege('update public.training_review_unit_sources set created_at = created_at where false', 'service_role UPDATE unit sources');
select pg_temp.expect_insufficient_privilege('update public.training_review_invalidations set created_at = created_at where false', 'service_role UPDATE invalidations');

select pg_temp.expect_insufficient_privilege('delete from public.training_review_protocols where false', 'service_role DELETE protocols');
select pg_temp.expect_insufficient_privilege('delete from public.training_review_dimensions where false', 'service_role DELETE dimensions');
select pg_temp.expect_insufficient_privilege('delete from public.training_review_cycles where false', 'service_role DELETE cycles');
select pg_temp.expect_insufficient_privilege('delete from public.training_review_units where false', 'service_role DELETE units');
select pg_temp.expect_insufficient_privilege('delete from public.training_review_unit_sources where false', 'service_role DELETE unit sources');
select pg_temp.expect_insufficient_privilege('delete from public.training_review_invalidations where false', 'service_role DELETE invalidations');

select pg_temp.expect_insufficient_privilege('truncate table public.training_review_protocols', 'service_role TRUNCATE protocols');
select pg_temp.expect_insufficient_privilege('truncate table public.training_review_dimensions', 'service_role TRUNCATE dimensions');
select pg_temp.expect_insufficient_privilege('truncate table public.training_review_cycles', 'service_role TRUNCATE cycles');
select pg_temp.expect_insufficient_privilege('truncate table public.training_review_units', 'service_role TRUNCATE units');
select pg_temp.expect_insufficient_privilege('truncate table public.training_review_unit_sources', 'service_role TRUNCATE unit sources');
select pg_temp.expect_insufficient_privilege('truncate table public.training_review_invalidations', 'service_role TRUNCATE invalidations');

reset role;

select pg_temp.assert_true(
  (select count(*) = 1 from public.training_review_protocols),
  'protocol metadata remains unchanged'
);
select pg_temp.assert_true(
  (select count(*) = 10 from public.training_review_dimensions),
  'dimension metadata remains unchanged'
);
select pg_temp.assert_true(
  (select count(*) = 8 from public.training_review_dimensions where dimension_kind = 'WORKOUT_STATION'),
  'exactly eight workout stations remain'
);
select pg_temp.assert_true(
  (select count(*) = 0 from public.training_review_cycles)
  and (select count(*) = 0 from public.training_review_units)
  and (select count(*) = 0 from public.training_review_unit_sources)
  and (select count(*) = 0 from public.training_review_invalidations),
  'no ledger history rows were added'
);
select pg_temp.assert_true(
  not exists (select 1 from pg_views where schemaname = 'public' and definition ilike '%training_review_%'),
  'public views do not consume the ledger'
);
select pg_temp.assert_true(
  not exists (
    select 1
    from pg_proc procedure
    join pg_namespace namespace on namespace.oid = procedure.pronamespace
    where namespace.nspname = 'public'
      and procedure.prokind = 'f'
      and pg_get_functiondef(procedure.oid) ilike '%training_review_%'
  ),
  'public functions do not consume the ledger'
);

select 'H3-11B service_role privilege reconciliation PASS' as result;
rollback;
