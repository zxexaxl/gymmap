# HYROX H3-11B service_role privilege reconciliation

## Scope

Migration `0013_add_training_review_ledger.sql` remains immutable and applied in production. This reconciliation narrows only the effective table privileges of `service_role` on the six internal review-ledger tables. It changes no global/default ACL, schema, RLS policy, data, publication contract, runtime, or generated database type.

## Production diagnosis

The six tables are owned by `postgres`. Production has a `postgres`-owned, `public`-schema default ACL that grants all table privileges directly to `service_role` when a table is created. Migration 0013 revoked the inherited-at-creation ACL from `PUBLIC`, `anon`, and `authenticated`, but did not first revoke the direct `service_role` ACL before issuing narrower grants. PostgreSQL `GRANT` is additive, so the narrower grants did not remove UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, or MAINTAIN.

The effective excess is not caused by table ownership or role membership: `service_role` does not own the tables and is not a member of the owner/admin role. The prior vanilla disposable database lacked the production default ACL, so it started with no broad `service_role` table grant and the omission was not reproduced.

## Correction contract

Migration 0014 revokes all privileges from `service_role` on these six objects and then grants back exactly:

- `training_review_protocols`, `training_review_dimensions`: SELECT
- `training_review_cycles`, `training_review_units`, `training_review_unit_sources`, `training_review_invalidations`: SELECT, INSERT

The ledger uses UUID defaults via `gen_random_uuid()` and has no table-owned sequences, so no sequence privilege is needed. Owner and administrative roles retain their PostgreSQL administrative powers; the append-only contract is the normal application `service_role` boundary, not absolute DBA-level immutability.
