-- H3-11B: restore the accepted internal service_role boundary after the
-- production public-schema default ACL granted broader table privileges when
-- migration 0013 created the review-ledger objects.
--
-- This correction is intentionally object-specific. It does not alter global
-- or schema default privileges, table definitions, RLS, policies, or data.

revoke all privileges on table
  public.training_review_protocols,
  public.training_review_dimensions,
  public.training_review_cycles,
  public.training_review_units,
  public.training_review_unit_sources,
  public.training_review_invalidations
from service_role;

grant select on table
  public.training_review_protocols,
  public.training_review_dimensions
to service_role;

grant select, insert on table
  public.training_review_cycles,
  public.training_review_units,
  public.training_review_unit_sources,
  public.training_review_invalidations
to service_role;
