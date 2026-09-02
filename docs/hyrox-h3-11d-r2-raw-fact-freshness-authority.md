# HYROX H3-11D-R2 raw-fact freshness authority

Status: **AUTHORITY CANDIDATE / HUMAN REVIEW REQUIRED**
Authority source: `origin/main` at `47d8ef3d7d75e801cfc0af3c27644ce0d9078c50`
Machine authority: `data/hyrox/h3-11d-r2-raw-fact-freshness-authority.json`

R2 defines when a persisted H3-11D-R1 observation may count as current. It creates no migration, monitor implementation, Production row, publication path, or station derivation. Historical evidence survives expiry. Stale never means false, and an expired restriction never means unrestricted.

## Existing authority audit

| Existing policy | Exact semantics | Horizon | Clock anchor | Monitoring/publication behavior |
|---|---|---:|---|---|
| Physical equipment | Positive `location_equipment` inventory facts | 180 days | reviewed `last_confirmed_at`; `stale_at` is the fixed boundary | Weekly source/support/publication cross-check; healthy fetch does not extend authority; stale public rows fail closed |
| Open training / discipline coaching / sled space | Volatile positive capability or space/service facts | 90 days | reviewed `last_confirmed_at` | Same manifest-backed source/support/publication separation |
| Competition simulation | Volatile positive program/simulation capability | 30 days | reviewed `last_confirmed_at` | It enters DUE_SOON immediately under the shared thresholds; H3-5B owns reconfirmation |

Across existing claims, `FRESH` is more than 30 days before `stale_at`, `DUE_SOON` is at most 30 days, `URGENT` is at most 14 days, and `STALE` begins at `stale_at`. The weekly workflow reads the public claim views and a frozen 150-claim manifest. Each unique source is fetched once with concurrency four, at most two attempts, Retry-After/bounded backoff, and no write credential. Reachability, support continuity, freshness, and publication are separate axes. A monitor observation never changes `last_confirmed_at` or `stale_at`.

The accepted Cohort 1 existing observations remain coherent: all 38 observations that map to 37 canonical claims already carry an accepted policy (19 equipment/180-day, eight coaching/90-day, five open training/90-day, three sled space/90-day, and three competition simulation/30-day). None requires silent reassignment.

## Frozen policy families

| Policy key | Scope | Horizon | Authority/rationale |
|---|---|---:|---|
| `raw-physical-component-180-day` | Direct rope and wall-ball components | 180 days | Exact semantic reuse of durable equipment inventory authority |
| `raw-equipment-set-assertion-90-day` | Non-itemized official HYROX equipment-set wording | 90 days | New narrow policy: broad copy-dependent assertion is less precise than an equipment item and can never directly derive a station |
| `raw-space-90-day` | General, multi-movement, station-associated, and running spaces | 90 days | Reuses the accepted sled-space volatility precedent; layouts change faster than durable inventory |
| `raw-usage-90-day` | Program, appointment, and rental use | 90 days | Reuses open-training/coaching operational volatility; modes are non-exclusive |
| `raw-access-restriction-90-day` | Membership, reservation, program-hour, and plan restrictions | 90 days maximum | New narrow policy no looser than usage; explicit end dates shorten it |

All five policies use the existing 30-day DUE_SOON and 14-day URGENT thresholds and require R3 monitoring before import. Only current, exactly typed raw dependencies may later enter derivation; the broad equipment-set assertion is never a direct station dependency, and restrictions are not positive station dependencies.

## Type mapping

| Raw fact type | Policy | Reuse decision | Boundary |
|---|---|---|---|
| `sled-pull-rope` | `raw-physical-component-180-day` | `REUSE_PHYSICAL_180` | Direct durable component |
| `wall-ball` | `raw-physical-component-180-day` | `REUSE_PHYSICAL_180` | Direct durable component |
| `official-hyrox-equipment-set-assertion` | `raw-equipment-set-assertion-90-day` | `NEW_POLICY_REQUIRED` | Broad assertion; never an item or direct station dependency |
| `multi-movement-training-space` | `raw-space-90-day` | `REUSE_OPERATIONAL_90` | Layout support may change |
| `general-training-floor` | `raw-space-90-day` | `REUSE_OPERATIONAL_90` | Weak, non-station-specific fact remains weak |
| `burpee-broad-jump-space` | `raw-space-90-day` | `REUSE_OPERATIONAL_90` | Station-associated layout support |
| `farmers-carry-space` | `raw-space-90-day` | `REUSE_OPERATIONAL_90` | Station-associated layout support |
| `sandbag-lunges-space` | `raw-space-90-day` | `REUSE_OPERATIONAL_90` | Station-associated layout support |
| `wall-balls-space` | `raw-space-90-day` | `REUSE_OPERATIONAL_90` | Station-associated layout support |
| `running-movement-space` | `raw-space-90-day` | `REUSE_OPERATIONAL_90` | Auxiliary running dimension only |
| `program-use-confirmed` | `raw-usage-90-day` | `REUSE_OPERATIONAL_90` | Non-exclusive program use |
| `appointment-use-confirmed` | `raw-usage-90-day` | `REUSE_OPERATIONAL_90` | Operational appointment mode |
| `rental-use-confirmed` | `raw-usage-90-day` | `REUSE_OPERATIONAL_90` | Operational rental mode |

| Restriction type | Policy | Reuse decision | Boundary |
|---|---|---|---|
| `MEMBERSHIP_ELIGIBILITY` | `raw-access-restriction-90-day` | `NEW_POLICY_REQUIRED` | Decision-sensitive membership term |
| `RESERVATION_REQUIRED` | `raw-access-restriction-90-day` | `NEW_POLICY_REQUIRED` | Decision-sensitive reservation term |
| `PROGRAM_HOUR_EXCLUSION` | `raw-access-restriction-90-day` | `NEW_POLICY_REQUIRED` | Earlier explicit end date controls |
| `PLAN_DEPENDENT_ACCESS` | `raw-access-restriction-90-day` | `NEW_POLICY_REQUIRED` | Decision-sensitive plan term |

Every policy starts at `reviewed_at`, the time positive support was reviewed. `observed_at`, HTTP fetch time, Last-Modified, content hash, and page reachability are not clock anchors by themselves. For Cohort 1, all accepted reviews were completed at `2026-09-02T10:00:00Z`; 90-day observations expire at `2026-12-01T10:00:00Z` and direct components at `2027-03-01T10:00:00Z`, subject to earlier invalidation.

`freshness_expires_at` is the earliest applicable boundary: the generic policy horizon or an authoritative source-explicit end/effective-period end. An already-ended observation remains historical with no current eligibility. Future-effective evidence is held until effective and positively re-reviewed; R2 does not pretend that the existing schema has a separate `valid_from` currentness gate.

## Currentness and fail-closed rules

A raw fact or restriction is `CURRENT_IMPORT_ELIGIBLE` only when it has an accepted policy key, a non-null future `freshness_expires_at`, an accepted facility-bound source, no applicable persisted invalidation, and no reviewed support removal or contradiction. Persistence eligibility, currentness eligibility, and publication eligibility remain separate.

- Null or unknown policy/expiry: `AUTHORITY_MISSING_HISTORICAL_ONLY`; never indefinitely fresh.
- Horizon reached: `TIME_EXPIRED_HISTORICAL_ONLY`; retain the row and evidence.
- Reviewed support removal or contradiction: `SUPPORT_DRIFT`; stop current eligibility without asserting the facility lacks the fact.
- Generic/non-facility redirect: `FACILITY_BINDING_DRIFT`; it cannot reconfirm.
- 429, timeout, or infrastructure error: `MONITOR_ERROR`; it neither invalidates nor extends the last reviewed authority. Retry later with bounded backoff.
- Source unavailable: queue `SOURCE_UNAVAILABLE`; availability alone does not prove falsity. It cannot reconfirm. It becomes an early currentness invalidation only when reviewed evidence establishes binding loss, source replacement without equivalent support, support removal, or contradiction.
- Expired restriction: `NO_CURRENT_RESTRICTION_AUTHORITY`, never `UNRESTRICTED`.

Time expiry never deletes or rewrites an observation. Event-driven invalidation may end current eligibility earlier through material support drift, facility-binding loss, explicit contradiction, protocol incompatibility, or append-only human invalidation. A raw fact links to its review unit, so existing H3-11B invalidations remain the durable reviewed invalidation path; a monitor signal alone is not a destructive database mutation.

## Reconfirmation contract

Valid reconfirmation requires a new reviewed positive observation in a new review cycle. An accepted facility-bound source must still explicitly support the same fact or restriction semantics. An unchanged hash or successful HTTP request can help detect continuity but cannot extend freshness without reviewed support confirmation.

A replacement source is allowed when it is accepted first-party authority, exactly facility-bound, semantically equivalent for the fact, and reviewed. It creates a new observation/source relation; it does not rewrite the historical source. A generic brand or booking home cannot reconfirm a facility-specific observation.

Each raw-fact row represents one source-backed historical observation. Multiple sources therefore produce separate observations. Any one current semantically equivalent observation may supply that single raw fact; a future composite station state still requires every distinct required dependency type to be current.

## Raw fact and restriction mapping

All 13 fact types and four restriction types are mapped in the machine authority. Cohort 1 coverage is 19/19 raw observations and 4/4 restriction observations. Five direct component observations use 180 days; two broad equipment-set assertions, eight space observations, four usage observations, and all four restriction observations use 90 days. One CrossFit Ashiya observation maps to two non-exclusive usage types under the same policy. Restriction observations may likewise carry more than one separately typed restriction without changing the four-observation count.

Every Cohort 1 item is semantically current-import eligible at the accepted review instant, but its operational gate is `HOLD_MONITOR_INTEGRATION`. No import is authorized by R2.

## Future H3-11E interface

H3-11E may consume only typed raw observations that satisfy this currentness contract. Every required dependency must be current independently. A current sled and lane plus a stale rope cannot produce a current Sled Pull derivation. This means only that no current derivation authority exists; it never means Sled Pull is unavailable. `general-training-floor` remains a weak raw fact and does not become station-specific through freshness.

Fact currentness and H3-11A review-coverage currentness are separate. A review unit can expire for coverage KPIs while a monitored positive fact remains current, or a fact can expire while another aspect of the historical review remains auditable.

## Monitoring contract and R3 decision

The existing enrichment monitor reads only `published_location_equipment`, `published_location_training_capabilities`, and the 150-claim manifest. It does not read `training_raw_facts`, `training_raw_fact_dimensions`, or `training_access_restrictions`; it cannot enforce R2.

R3 must add a read-only internal inventory/authority path that enumerates raw facts and restrictions, validates policy keys/expiry, deduplicates source requests, evaluates DUE_SOON/URGENT/TIME_EXPIRED, checks facility binding and support continuity where deterministic, separates `MONITOR_ERROR`, `SOURCE_UNAVAILABLE`, and `SUPPORT_DRIFT`, preserves historical rows, and never extends freshness. The existing weekly cadence, concurrency four, two attempts, Retry-After/bounded backoff, and source reuse are sufficient operational defaults and avoid repeating the Finder 429 pattern.

**RAW_FACT_MONITOR_IMPLEMENTATION: REQUIRED_BEFORE_COHORT1_IMPORT**

## Persistence sufficiency

The live 0015 schema is sufficient for the accepted Cohort 1/R2 authority. It preserves `observed_at`, `reviewed_at`, policy key, earliest expiry, source/review provenance, evidence text/context, and H3-11B invalidation linkage. No migration is required. Source-explicit dates are preserved in evidence and folded into the earliest expiry; evidence that is already expired or future-effective is held rather than forced into current authority.

## Edge-case self-check

| Case | Deterministic outcome |
|---|---|
| A. wall ball confirmed today | Current under 180 days; reachability does not reconfirm |
| B. source reachable, support removed | `SUPPORT_DRIFT`; history retained, no removal inference |
| C. carry space reaches horizon | `TIME_EXPIRED_HISTORICAL_ONLY` |
| D. usage page redirects to generic home | `FACILITY_BINDING_DRIFT`; no reconfirmation |
| E. reservation evidence becomes stale | `NO_CURRENT_RESTRICTION_AUTHORITY`, not unrestricted |
| F. program-hour restriction has an end date | Earlier explicit end date controls |
| G. equivalent facility-bound replacement source | New reviewed observation may reconfirm |
| H. source returns 429 | `MONITOR_ERROR`; no invalidation or extension |
| I. fact has no policy | Historical only; no derivation/search/publication |
| J. mixed Sled Pull dependency freshness | No current derivation; no unavailability inference |
| K. stale historical fact | Row/evidence retained for audit |
| L. stale restriction without replacement | No current restriction authority; never unrestricted |

## Boundaries

R2 changes no Production data, schema, monitor code, runtime, UI, publication, review ledger, or Cohort 1 rows. H3-5B competition-simulation authority remains the existing 30-day monitored capability model. Human acceptance of this candidate authorizes only controlled main integration; R3 remains a separate implementation gate.
