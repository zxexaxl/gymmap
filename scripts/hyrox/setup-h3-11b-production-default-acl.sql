\set ON_ERROR_STOP on

-- Disposable-only reproduction of the production public-schema table default
-- ACL observed after migration 0013. Run this before the migration chain as
-- the postgres object owner. It must never be run against production.

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role nologin bypassrls;
  end if;
end
$$;

alter default privileges for role postgres in schema public
  grant all privileges on tables to anon, authenticated, service_role;
