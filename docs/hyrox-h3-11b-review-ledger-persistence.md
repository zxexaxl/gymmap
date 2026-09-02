# HYROX H3-11B Review Ledger Persistence

Status: migration candidate; Human Migration Review required. This document describes an internal, additive schema candidate only. It authorizes no production migration, collection, derivation, publication, filter, or UI change.

## Authority and scope

This candidate consumes the accepted H3-11A authority at commit `0615892b7e228c7628e2e1859c8963bdaa669538`:

- `docs/hyrox-h3-11a-review-evidence-authority.md`
- `data/hyrox/h3-11a-station-evidence-authority.json`

The migration pins both paths and their SHA-256 digests in the seeded `h3-11a-v1` protocol row. The Markdown and JSON agree on the canonical review unit, three review axes, eight workout stations, review aspects, source classes, history/currentness separation, and positive-only publication boundary.

## Existing-schema audit and decision

| Concept | Existing support | H3-11B decision | Reason |
| --- | --- | --- | --- |
| Positive equipment facts | `location_equipment` + `training_evidence` | Reuse unchanged | Review outcome is not an equipment claim. |
| Positive capabilities | `location_training_capabilities` + `training_evidence` | Reuse unchanged | Review outcome is not a capability or usage claim. |
| Source identity/state | `training_sources` | Reference by FK and snapshot review-time context | Avoid copying source contents while preserving what was reviewed. |
| Historical review event | None | Add `training_review_cycles` | A new review or correction must not overwrite history. |
| Protocol version | None | Add `training_review_protocols` | Historical reviews must retain their governing contract. |
| Review dimensions | None | Add `training_review_dimensions` | Stable authority-backed keys fail closed and prevent an accidental ninth station. |
| Atomic coverage state | None | Add `training_review_units` | Existing claim tables cannot represent dimension/aspect/axes without semantic overload. |
| Reviewed source set | One evidence row targets one claim | Add `training_review_unit_sources` | A review unit may assess multiple sources even when no positive claim is produced. |
| Currentness invalidation | Mutable source state and claim freshness only | Add `training_review_invalidations` | A no-positive review has no claim monitor entry but must still expire/invalidate without deletion. |

Existing tables cannot represent the ledger without overloading positive claims or `training_evidence`. Six new objects are the smallest coherent model.

## Persistence model

`training_review_protocols` identifies an immutable protocol version and repository authority bytes. `training_review_dimensions` seeds eight `WORKOUT_STATION` keys plus the non-station `running-environment` and `facility-identity` dimensions.

`training_review_cycles` is the facility/discipline/protocol review event. Its deterministic key is `(location_id, discipline_id, protocol_id, cycle_key)`. A normal later review uses a new cycle key. An administrative correction also creates a new row, must point to the superseded same-facility/same-discipline cycle, and supplies a reason. Neither operation updates or deletes the earlier event.

`training_review_units` stores one atomic state per `(review_cycle_id, review_dimension_id, review_aspect)`. Because a cycle already binds facility, discipline, protocol, and cycle identity, this represents exactly:

`facility × discipline × dimension × aspect × protocol × cycle`

The discipline is repeated and protected by composite foreign keys so a cycle, protocol, dimension, unit, and invalidation cannot cross discipline boundaries.

`training_review_unit_sources` links each unit to the existing source actually reviewed and snapshots its logical H3-11A source class, facility-binding assessment, sufficiency role, observation/review time, availability state, optional content hash, and binding basis. A hostname never determines facility binding.

`training_review_invalidations` appends material source drift, binding loss, source replacement, protocol incompatibility, or explicit human invalidation. It never rewrites a historical `COMPLETE` review.

All new foreign keys use `ON DELETE RESTRICT`; review authority cannot disappear through a location, discipline, source, protocol, cycle, or unit cascade.

## State integrity

The database constrains all three axes to the frozen H3-11A terms and enforces:

- `UNREVIEWED` requires `UNKNOWN + NOT_ASSESSED`.
- `COMPLETE` requires `SUFFICIENT`.
- `NO_POSITIVE_FOUND` requires `COMPLETE + SUFFICIENT`.
- `PARTIAL + POSITIVE_FOUND` is allowed.
- insufficient or blocked review cannot be `COMPLETE` and cannot close as `NO_POSITIVE_FOUND`.
- unknown aspects, dimensions, source classes, facility bindings, and invalidation reasons fail closed.

`POSITIVE_FOUND` remains workflow state only. It neither stores nor generates a claim. `NO_POSITIVE_FOUND` remains internal review history only and never means equipment absent, unsupported, or unavailable.

## Currentness

There is no manually maintained `is_current` authority. H3-11B persists the inputs required for later derivation: `reviewed_at`, cycle and protocol identity, optional applicable freshness-policy key and expiry, review-time source state/hash, supersession, and append-only invalidation evidence.

H3-11E/F must define the currentness query/rule that combines these inputs with then-current source state and protocol compatibility. Existing 180-day physical, 90-day usage/coaching/sled-space, and 30-day competition-simulation horizons may be referenced only where their volatility and semantics match; H3-11B creates no blanket horizon. An expired or invalidated row remains historical but cannot count as current coverage or current `NO_POSITIVE_FOUND` authority.

## Security and publication boundary

The tables remain in `public` schema to follow repository convention, but all have RLS enabled, no policies, and explicit revocation from `public`, `anon`, and `authenticated`. `service_role` receives read-only access to protocol/dimension taxonomy and append-only `SELECT, INSERT` access to event tables; it receives no `UPDATE` or `DELETE` grant.

The migration creates no view or function and changes no existing view, RPC, DTO, generated runtime consumer, equipment filter, or UI. Review rows are not seeded. Public positive-only publication therefore has no ledger path, and `NO_POSITIVE_FOUND` cannot enter public output.

## Explicit deferrals

- `RAW_SPACE_USAGE_PERSISTENCE`: **DEFERRED to H3-11D**. The review ledger records review outcome/source set, not the raw positive fact itself. Creating a generic fact system now would expand scope and duplicate existing equipment persistence.
- `EXPLICIT_ACCESS_RESTRICTION_PERSISTENCE`: **DEFERRED**. H3-11B authorizes no negative/restriction publication.
- `DERIVATION_ENGINE`: **NOT IMPLEMENTED**.
- `DERIVED_STATION_ROWS`: **0**.
- Currentness evaluator, KPIs, filters, station publication, and source qualification remain future phases.

Existing 109 equipment claims, 41 capability claims, six `ski-erg`, nineteen `row-erg`, and three legacy `sled-push-pull-space` claims keep their original semantics. There is no retyping, migration, backfill, or derived station state.

## Validation contract

The candidate must pass a clean full migration chain on disposable PostgreSQL, legal/illegal state tests, FK and history tests, source-set and invalidation tests, grant/RLS inspection, authority taxonomy/hash alignment, public view/RPC non-reference checks, existing HYROX regression tests, full unit tests, typecheck, scoped lint, and `git diff --check`. Production remains unchanged until a separate Human Migration Review and later Production Migration Gate.
