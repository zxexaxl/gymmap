# HYROX H3-11D-R3 raw fact freshness monitor

Status: **MONITOR CANDIDATE / HUMAN REVIEW REQUIRED**

R3 mechanically consumes the accepted H3-11D-R2 policy authority and monitors future `training_raw_facts` and `training_access_restrictions` without reading or writing their private Production tables. It adds no publication, station derivation, UI, migration, or Cohort 1 import.

## Architecture and security

The monitor uses a deterministic repository authority manifest plus first-party source requests. This matches the existing H3-5A security shape while keeping its inventory separate from the 150 published equipment/capability claims.

- `LIVE_MONITORED`: the workflow inventory. It currently contains zero entries and zero sources, matching Production.
- `CANDIDATE_NOT_IMPORTED`: test/release-preparation authority only. The Cohort 1 fixture contains 19 raw observations, four restriction observations, and nine unique source URLs; it is never loaded by the default live command.
- GitHub Actions needs no new secret. The raw monitor does not instantiate a Supabase client and has no Production DB access.
- The workflow remains read-only with `contents: read`. It invokes the raw monitor in the existing Tuesday weekly job, after the location and 150-claim monitors.
- No monitor result changes `reviewed_at`, `freshness_expires_at`, source binding, or persistence state.

The existing public Supabase variables remain present for the two pre-existing monitors. The raw monitor does not consume them. `SUPABASE_SERVICE_ROLE_KEY` is not introduced.

## Authority and release identity

The implementation recomputes and pins all four accepted R2 semantic hashes, rather than trusting hash strings stored in the JSON. A policy body, fact mapping, restriction mapping, or Cohort mapping change fails closed.

Every raw monitor manifest has two deterministic identities:

1. `monitorPacketHash`: the source/entry monitoring packet, excluding self-referential release fields.
2. `manifestHash`: the complete manifest, including activation state and release fields.

A non-empty `LIVE_MONITORED` manifest is invalid unless it has a DB import packet hash and a matching release coherence hash:

`SHA256({ dbImportPacketHash, rawMonitorPacketHash })`

The Cohort 1 Production Data Gate must create these identities from the exact DB import and monitor packets under one reviewed release. R3 does not create or apply that import.

## Policy consumption

R3 consumes the five R2 policy families directly:

| Policy | Horizon | Clock |
|---|---:|---|
| `raw-physical-component-180-day` | 180 days | `reviewed_at` |
| `raw-equipment-set-assertion-90-day` | 90 days | `reviewed_at` |
| `raw-space-90-day` | 90 days | `reviewed_at` |
| `raw-usage-90-day` | 90 days | `reviewed_at` |
| `raw-access-restriction-90-day` | maximum 90 days | `reviewed_at`; earlier source end wins |

All 13 raw types and four restriction types are recognized. Cohort 1 contains 12 of the 13 raw types; `appointment-use-confirmed` has no accepted Cohort 1 observation and is deliberately not manufactured.

The exact existing time boundaries are reused: FRESH is more than 30 days from expiry, DUE_SOON is at most 30 days, URGENT is at most 14 days, and TIME_EXPIRED begins at the expiry instant. Future-effective evidence is `FUTURE_EFFECTIVE_HOLD` until its effective/review condition is met.

## Currentness states

| State | Meaning | Dependency-current? |
|---|---|---|
| `FRESH` | Current positive authority, more than 30 days remain | Yes, absent invalidation/drift |
| `DUE_SOON` | At most 30 days remain | Yes, pending reviewed reconfirmation |
| `URGENT` | At most 14 days remain | Yes, pending urgent reviewed reconfirmation |
| `TIME_EXPIRED` | Time authority ended; history retained | No |
| `SUPPORT_DRIFT` | Reviewed support patterns are no longer detected | No; no negative inference |
| `FACILITY_BINDING_DRIFT` | Facility identity binding is no longer supported | No |
| `MONITOR_ERROR` | 429, timeout, transient 5xx, network, or missing observation | Does not itself invalidate or extend |
| `SOURCE_UNAVAILABLE` | Non-transient unavailable/access state | Does not itself prove false or extend |
| `SOURCE_REVIEW_REQUIRED` | Redirect/replacement needs reviewed rebinding | No automatic reconfirmation |
| `AUTHORITY_MISSING` | Policy/type/expiry authority is invalid or unknown | No |
| `CHECK_UNAVAILABLE` | Support cannot safely be checked automatically | Time currentness remains; no automatic positive inference |
| `FUTURE_EFFECTIVE_HOLD` | Evidence is not yet effective/re-reviewed | No |
| `NO_CURRENT_RESTRICTION_AUTHORITY` | Restriction freshness ended | Never means unrestricted |

`currentForDependencyEvaluation` is a monitor output for a future H3-11E gate. It is not a derived station state. H3-11E must still require every distinct dependency to be current and satisfy a versioned derivation rule.

## Source behavior

Requests are grouped by normalized URL and fetched once, then fanned out to dependent entries. Concurrency is capped at four, attempts at two, Retry-After is honored up to ten seconds, and fallback backoff is bounded. Cohort 1 therefore models 23 entries through nine requests.

An HTTP 200 or unchanged content does not reconfirm evidence. Text-pattern support is only a continuity signal. Visual/JS/semantically unsafe cases use `CHECK_UNAVAILABLE`. A replacement source with retained facility identity is queued as `SOURCE_REVIEW_REQUIRED`; a generic brand/login destination becomes `FACILITY_BINDING_DRIFT`. Neither path rewrites authority.

## Live and simulation results

The default live command reads `h3-11d-r3-raw-monitor-live-authority.json` and reports zero entries cleanly. It does not query Production, so a future non-empty activation must be coupled to the exact DB import through the release coherence gate above.

The Cohort 1 non-live fixture validates:

- 19/19 raw observations and 4/4 restrictions;
- five policy families and accepted type mappings;
- earliest-expiry calculation and future-effective HOLD;
- support drift, facility-binding drift, source review, missing authority, and visual check limitations;
- 429/timeout error separation, bounded retries, and request deduplication;
- `reconfirmed: false` for every monitor record.

## Phase boundary

R3 changes monitor code, test fixtures, documentation, package command, and the existing read-only workflow only. Production remains on migration 0015 with zero review/raw/restriction rows. Existing 109 equipment claims, 41 capability claims, and their 150-claim monitor are unchanged.

After Human acceptance and controlled integration, infrastructure is sufficient to prepare the separate Cohort 1 Production Data Gate. Acceptance of R3 does not authorize live manifest activation or any Production import.
