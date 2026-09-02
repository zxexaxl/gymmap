\set ON_ERROR_STOP on

begin;

create function pg_temp.assert_true(condition boolean, message text)
returns void language plpgsql as $$
begin
  if condition is not true then
    raise exception 'H3-11D-R1 ACL validation failed: %', message;
  end if;
end $$;

create function pg_temp.expect_insufficient_privilege(statement text, message text)
returns void language plpgsql as $$
begin
  begin
    execute statement;
  exception
    when insufficient_privilege then return;
    when others then
      raise exception 'H3-11D-R1 ACL validation failed: % (expected 42501, received %: %)',
        message, sqlstate, sqlerrm;
  end;
  raise exception 'H3-11D-R1 ACL validation failed: % (statement unexpectedly succeeded)', message;
end $$;

create temp table r1_table_contract (
  table_name text primary key,
  insert_allowed boolean not null
);
insert into r1_table_contract values
  ('training_raw_fact_types', false),
  ('training_raw_facts', true),
  ('training_raw_fact_dimensions', true),
  ('training_access_restrictions', true);

select pg_temp.assert_true(
  (select count(distinct privilege_type) = 8
   from pg_default_acl default_acl
   join pg_roles owner_role on owner_role.oid=default_acl.defaclrole
   join pg_namespace namespace on namespace.oid=default_acl.defaclnamespace
   cross join lateral aclexplode(default_acl.defaclacl) exploded
   join pg_roles grantee_role on grantee_role.oid=exploded.grantee
   where owner_role.rolname='postgres'
     and namespace.nspname='public'
     and default_acl.defaclobjtype='r'
     and grantee_role.rolname='service_role'
     and exploded.privilege_type in (
       'SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER','MAINTAIN'
     )),
  'production-shaped postgres default ACL granting service_role ALL was reproduced'
);

select pg_temp.assert_true(
  (select bool_and(has_table_privilege(
    'service_role', format('public.%I', table_name), 'SELECT'
  )) from r1_table_contract),
  'service_role SELECT exists on all four internal tables'
);
select pg_temp.assert_true(
  (select bool_and(
    has_table_privilege('service_role', format('public.%I', table_name), 'INSERT')
    = insert_allowed
  ) from r1_table_contract),
  'service_role INSERT matches taxonomy-read-only and observation-append-only contract'
);
select pg_temp.assert_true(
  (select bool_and(not has_table_privilege(
    'service_role', format('public.%I', table_name), privilege
  ))
   from r1_table_contract
   cross join unnest(array[
     'UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER','MAINTAIN'
   ]) privilege),
  'service_role has no excess effective table privilege'
);
select pg_temp.assert_true(
  (select bool_and(not has_table_privilege(
    role_name, format('public.%I', table_name), privilege
  ))
   from r1_table_contract
   cross join unnest(array['anon','authenticated']) role_name
   cross join unnest(array[
     'SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER','MAINTAIN'
   ]) privilege),
  'anon and authenticated have no effective raw persistence privilege'
);
select pg_temp.assert_true(
  (select count(*)=4
   from pg_class object
   join pg_namespace namespace on namespace.oid=object.relnamespace
   join r1_table_contract contract on contract.table_name=object.relname
   where namespace.nspname='public' and object.relrowsecurity),
  'RLS is enabled on all four new tables'
);
select pg_temp.assert_true(
  (select count(*)=0 from pg_policies
   where schemaname='public' and tablename in (select table_name from r1_table_contract)),
  'no permissive RLS policy exists'
);

set local role service_role;

select count(*) from public.training_raw_fact_types;
select count(*) from public.training_raw_facts;
select count(*) from public.training_raw_fact_dimensions;
select count(*) from public.training_access_restrictions;

insert into public.training_raw_facts
select * from public.training_raw_facts where false;
insert into public.training_raw_fact_dimensions
select * from public.training_raw_fact_dimensions where false;
insert into public.training_access_restrictions
select * from public.training_access_restrictions where false;

select pg_temp.expect_insufficient_privilege(
  'insert into public.training_raw_fact_types select * from public.training_raw_fact_types where false',
  'service_role taxonomy INSERT'
);
select pg_temp.expect_insufficient_privilege(
  'update public.training_raw_facts set created_at=created_at where false',
  'service_role raw fact UPDATE'
);
select pg_temp.expect_insufficient_privilege(
  'delete from public.training_raw_facts where false',
  'service_role raw fact DELETE'
);
select pg_temp.expect_insufficient_privilege(
  'truncate table public.training_raw_facts',
  'service_role raw fact TRUNCATE'
);
select pg_temp.expect_insufficient_privilege(
  'update public.training_access_restrictions set created_at=created_at where false',
  'service_role restriction UPDATE'
);
select pg_temp.expect_insufficient_privilege(
  'delete from public.training_access_restrictions where false',
  'service_role restriction DELETE'
);
select pg_temp.expect_insufficient_privilege(
  'truncate table public.training_access_restrictions',
  'service_role restriction TRUNCATE'
);

reset role;

select pg_temp.assert_true(
  (select count(*)=13 from public.training_raw_fact_types),
  'taxonomy seed remains exact'
);
select pg_temp.assert_true(
  (select count(*)=0 from public.training_raw_facts)
  and (select count(*)=0 from public.training_raw_fact_dimensions)
  and (select count(*)=0 from public.training_access_restrictions),
  'migration contains no Cohort 1 data or backfill'
);
select pg_temp.assert_true(
  not exists (
    select 1 from pg_views
    where schemaname='public'
      and definition ~* 'training_(raw_fact|access_restriction)'
  ),
  'public views do not expose raw facts or restrictions'
);
select pg_temp.assert_true(
  not exists (
    select 1 from pg_proc procedure
    join pg_namespace namespace on namespace.oid=procedure.pronamespace
    where namespace.nspname='public' and procedure.prokind='f'
      and pg_get_functiondef(procedure.oid) ~* 'training_(raw_fact|access_restriction)'
  ),
  'public functions do not expose raw facts or restrictions'
);

select 'H3-11D-R1 production-shaped ACL validation PASS' as result;
rollback;
