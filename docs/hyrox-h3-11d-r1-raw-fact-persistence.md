# HYROX H3-11D-R1 — Raw Fact Persistence Foundation

Status: migration candidate; Human Migration Review required. This record does not authorize main integration, Production migration, Cohort 1 import, station derivation, publication, UI, or filters.

## Decision

H3-11D produced 19 positive observations and four explicit restriction observations that cannot be stored in the existing claim model without changing their meaning. R1 adds four internal tables:

1. `training_raw_fact_types`: migration-owned, read-only constrained taxonomy.
2. `training_raw_facts`: append-only positive source-backed observations.
3. `training_raw_fact_dimensions`: exact dimension/review-unit applicability for a fact.
4. `training_access_restrictions`: append-only explicit restriction evidence, separate from positive usage.

No generic EAV store, derived station state, public view/RPC, negative absence row, or Cohort 1 data is added.

## Existing schema audit

| Concept | Existing support | Gap | R1 decision |
|---|---|---|---|
| Canonical equipment | `equipment_types`, `location_equipment` | Only the existing nine equipment semantics are safe | Keep all 109 claims and the 38 H3-11D canonical-fit observations unchanged |
| Canonical capability | `training_capability_types`, `location_training_capabilities` | Legacy types cannot represent raw components, station-specific program use, or general movement space | Keep all 41 claims and legacy semantics unchanged |
| Claim evidence | `training_evidence` | Exactly one existing claim target is mandatory; a raw fact cannot be attached without manufacturing/retyping a claim | Do not overload; provenance is embedded in the new observation row through the review ledger |
| Source identity | `training_sources` | Current source alone does not preserve review-time binding/class/hash | Reuse `training_review_unit_sources`, which already freezes those values |
| Review event/unit | H3-11B cycle, unit, source relation, invalidation | No raw fact target | Require cycle/unit/source relation FKs from every new observation |
| Currentness | review timestamps and nullable policy/expiry inputs | No accepted horizon for the 19 new semantics | Preserve nullable inputs and fail closed pending R2 |
| Explicit restrictions | No semantically safe internal target | Positive usage fields must not imply exclusivity | Separate `training_access_restrictions` table |

All 19 raw gaps and all four restriction gaps still genuinely require new persistence. None can be reclassified into the existing nine equipment or five capability types without semantic distortion. No unresolved schema blocker remains; the deterministic mapping is in `data/hyrox/h3-11d-r1-gap-persistence-map.json`.

## Raw fact taxonomy

The taxonomy contains only anticipated H3-11A/H3-11D raw semantics:

- Physical components: `sled-pull-rope`, `wall-ball`.
- Source assertion: `official-hyrox-equipment-set-assertion`.
- Space/environment: `multi-movement-training-space`, `general-training-floor`, `burpee-broad-jump-space`, `farmers-carry-space`, `sandbag-lunges-space`, `wall-balls-space`, `running-movement-space`.
- Positive usage: `program-use-confirmed`, `appointment-use-confirmed`, `rental-use-confirmed`.

`PROGRAM_USE_CONFIRMED` remains non-exclusive. No taxonomy row means program-only, open use, station feasibility, or station capability. Taxonomy INSERT is unavailable to `service_role`, so unsupported/derived type IDs fail closed.

## Identity and provenance

A raw fact is unique by review cycle plus `fact_key`. It stores the positive statement, concise evidence text/context, directness, observed/reviewed timestamps, reviewer authority, review-time content hash, and nullable freshness inputs.

The relational trace is:

`training_sources`
→ `training_review_unit_sources`
→ `training_review_units`
→ `training_review_cycles`
→ `training_raw_facts`
→ optional `training_raw_fact_dimensions`

Composite foreign keys prove that facility, discipline, cycle, aspect, unit, source, source class, and dimension belong to one review scope. A dimension row must point to the unit for that same dimension and aspect. Discipline-level assertions may have no dimension rows; absence of a dimension row is not a negative statement.

The fact row is the source-backed observation, so no additional generic evidence table is required for the accepted packet. Future derivation can reference stable raw fact IDs. Multiple independent sources remain multiple auditable observations rather than an opaque merged JSON value.

## Restriction boundary

Restrictions are not positive usage facts. The separate internal table supports only:

- `MEMBERSHIP_ELIGIBILITY`
- `RESERVATION_REQUIRED`
- `PROGRAM_HOUR_EXCLUSION`
- `PLAN_DEPENDENT_ACCESS`

Each restriction has the same mandatory review-cycle/unit/source provenance. It has no public view, RPC, DTO, or UI path. Negative or restriction publication remains unauthorized.

## History and currentness

Normal service operation is append-only. Taxonomy is `SELECT` only; fact, fact-dimension, and restriction rows are `SELECT, INSERT` only. UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, and MAINTAIN are denied to `service_role`. Owner/admin powers remain outside this application-role guarantee.

R1 does not add a mutable `is_current` flag. Historical rows survive later cycles. Review invalidation/supersession continues through H3-11B authority. `freshness_policy_key` and `freshness_expires_at` are optional inputs, but expiry cannot be set without a policy. All H3-11D gap mappings intentionally leave both unset.

No new 90/180-day horizon is invented. A separate **H3-11D-R2 Raw Fact Freshness Policy** is required before these new fact semantics can become current derivation/publication authority.

## Security

All four tables are in `public` only because that is the repository schema convention. Each has RLS enabled and zero policies. `PUBLIC`, `anon`, and `authenticated` receive no privileges.

R1 accounts for Production's `postgres` public-schema default ACL explicitly: it revokes all privileges from `service_role` on each newly created table before re-granting the exact matrix. Global/default ACLs are not modified.

| Object | `service_role` | Public roles |
|---|---|---|
| `training_raw_fact_types` | SELECT | none |
| `training_raw_facts` | SELECT, INSERT | none |
| `training_raw_fact_dimensions` | SELECT, INSERT | none |
| `training_access_restrictions` | SELECT, INSERT | none |

## Rejected alternatives

- Adding rope, ball, or space to `equipment_types`: rejected because it would alter the accepted public equipment taxonomy and claim meaning.
- Reusing legacy capabilities: rejected because space, usage, and physical feasibility are not interchangeable.
- Adding raw targets to `training_evidence`: rejected because its exactly-one claim-target contract would be weakened.
- Universal entity/key/value/JSON storage: rejected because core semantics and derivation inputs would not be constrained by FKs/taxonomy.
- One mixed positive/restriction table: rejected because explicit restrictions must remain visibly separate from positive usage.
- Derivation tables or station booleans: deferred to H3-11E and not created.

## Data and publication invariance

Migration 0015 seeds only 13 stable taxonomy rows. It seeds zero raw facts, dimensions, restrictions, review cycles, review units, sources, equipment claims, capabilities, or evidence. Existing publication views and `search_training_locations` are unchanged and do not reference any R1 object.

Candidate acceptance does not authorize Production migration. If accepted, the next sequence is controlled main integration, exact-main validation, a separate Production Migration Gate with fresh backup/restore rehearsal, and an exact Human Production Decision. After R1 Production completion, R2 freshness authority is required before the Cohort 1 Production Data Gate.
