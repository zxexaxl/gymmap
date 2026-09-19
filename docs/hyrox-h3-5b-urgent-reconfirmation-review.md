# GymMap HYROX — H3-12C closure and H3-5B urgent reconfirmation

## 1. Verdict

**H3-12C — COMPLETE.** Accepted commit `40619256e2088bd8b82a4449602ea262aee52336` is the exact content now on `origin/main`.

**H3-5B — URGENT RECONFIRMATION CANDIDATE READY / HUMAN REVIEW REQUIRED.** All 16 live URGENT claims were reviewed. Fifteen are directly reconfirmed under existing semantics; one has equivalent facility-bound support at a replacement official branch URL and requires an auditable source rebind. No support loss, false positive, hold, or temporary error was found. This is a non-executed candidate.

## 2. H3-12C closure

- Accepted candidate: `40619256e2088bd8b82a4449602ea262aee52336`.
- Actual pre-integration `origin/main`: `76f71554d3aafa2245f795e16ef7c7fc4cf20746`; there were no intervening commits.
- Final `origin/main`: `40619256e2088bd8b82a4449602ea262aee52336`; fast-forward preserved commit identity, so accepted-content equivalence is exact.
- H3-12B authority, H3-12C artifacts, current migration head, and monitor authority were present and conflict-free.
- Frozen Phase 1 set: seven new GymMap locations. CrossFit Setagaya, JGFS / JiroGym Fitness Studio Gotanda, and TOMMY WORKOUT GYM Meguro route to the Official path. WARRIORS GYM Roppongi, CrossFit Roppongi, GYM FIELD Tachikawa Studio, and CrossFit Ikebukuro remain verified non-Official candidates and on `COORDINATE_AUTHORITY_REQUIRED` hold.
- Projected inventory remains nationwide `N=89, O=85, V=4` and Tokyo `N=37, O=33, V=4` if all seven are later published.
- Validation at exact main: focused H3-12A/B/C `26/26`, relevant HYROX `182/182`, full unit suite `367/367`, typecheck PASS, scoped ESLint PASS, JSON/hash/content equivalence PASS, and `git diff --check` PASS.
- No Production, runtime/UI, live-monitor, coordinate, or H3-12D mutation occurred.

## 3. H3-5B target set

The canonical enrichment monitor was run at `2026-09-19T14:11:30.181Z`. The live target is exactly 16 `capability:competition-simulation` claims. They group into five original first-party URLs and five actual original-source requests after deduplication. The GYM FIELD review followed the accepted URL's redirect and then inspected one precise replacement branch URL.

`H3_5B_URGENT_TARGET_SET_SHA256 = e5f82a4284489838383188415cafde0a879cc87ae61e0b0d51019e57d9ab34b7`

Exact claim identities appear in the table below and in `data/hyrox/h3-5b-urgent-reconfirmation-candidate.json` with location ID, HGY ID, source identity, evidence hash, prior reviewed/expiry timestamps, and original monitor locator.

## 4. Current monitor state

- Canonical enrichment: 45 sources, 235 claims (170 equipment, 65 capability), `FRESH=219`, `DUE_SOON=0`, `URGENT=16`, `STALE=0`, `NO_CHANGE=206`; source URL reviews 8, claim support reviews 14, source unavailable 0, publication mismatch 0, monitor errors 0, review queue 29, publication extras 0, run issues 0.
- Raw-fact monitor: 50 entries (38 raw facts, 12 restrictions), all 50 FRESH; 0 due/urgent/time-expired/support-drift/errors; 18 unique requests.
- Location monitor: 82 total, 76 `NO_CHANGE`, 6 `REVIEW_REQUIRED`, errors 0. Existing BEYOND source-URL and INSPA name signals remain separate and were not changed.
- Request contract retained: maximum concurrency 4, maximum attempts 2, `Retry-After` support, bounded backoff.

## 5. Claim-by-claim review

Source abbreviations: [OTF](https://www.orangetheoryfitness.co.jp/hyrox/), [CLUB360](https://www.club360.jp/hyrox), [HTC](https://htc-chikusa.com/program.html), [FIELD-old](https://www.field-gym.com/hyrox/), [FIELD-東大阪](https://www.gym-field.com/studios/higashiosaka/), [Improve](https://improve-kyoto.hacomono.jp/reserve/schedule/1/2?trial=true). Every row retains the 30-day policy and exact `competition-simulation` capability; equipment/open-use semantics were not inferred.

| Facility | Exact claim | Policy | Source | Support result | Classification | Proposed action |
|---|---|---:|---|---|---|---|
| OTF 麻布十番 | `capability:0b573034-d71b-4176-a3b3-82e9355d123e:competition-simulation` | 30d | OTF | named branch + race-like class | `RECONFIRMED_CURRENT` | `RECONFIRM_CURRENT` |
| OTF 溝の口 | `capability:295cc8bc-32d9-48f4-8b79-b2f18e85cd78:competition-simulation` | 30d | OTF | named branch + race-like class | `RECONFIRMED_CURRENT` | `RECONFIRM_CURRENT` |
| CLUB 360 | `capability:33bc8540-aca5-4aca-9921-c3f14dd8d067:competition-simulation` | 30d | CLUB360 | private race simulation, Singles/Doubles | `RECONFIRMED_CURRENT` | `RECONFIRM_CURRENT` |
| OTF 町田 | `capability:3c1747f5-b8e7-4d50-a31d-c05d31dd0edf:competition-simulation` | 30d | OTF | named branch + race-like class | `RECONFIRMED_CURRENT` | `RECONFIRM_CURRENT` |
| OTF 下北沢 | `capability:419f2440-1a1a-4815-8c2e-de4b2a9f9b1a:competition-simulation` | 30d | OTF | named branch + race-like class | `RECONFIRMED_CURRENT` | `RECONFIRM_CURRENT` |
| HTC CHIKUSA | `capability:4a07f1c3-3666-4648-bedd-35c283912e26:competition-simulation` | 30d | HTC | HYROX simulation in race format | `RECONFIRMED_CURRENT` | `RECONFIRM_CURRENT` |
| OTF 本八幡 | `capability:4bb064be-730c-4f17-9849-12078fcea96b:competition-simulation` | 30d | OTF | named branch + race-like class | `RECONFIRMED_CURRENT` | `RECONFIRM_CURRENT` |
| OTF 浦和 | `capability:530bd4e0-6009-4c84-8c6d-f7ffe24ae79f:competition-simulation` | 30d | OTF | named branch + race-like class | `RECONFIRMED_CURRENT` | `RECONFIRM_CURRENT` |
| OTF 青葉台 | `capability:58746bc6-200d-49c5-a0ff-9e4601dbea86:competition-simulation` | 30d | OTF | named branch + race-like class | `RECONFIRMED_CURRENT` | `RECONFIRM_CURRENT` |
| OTF 東久留米 | `capability:5cc12f35-0a51-43ad-8bc0-f15ccf4e8a12:competition-simulation` | 30d | OTF | named branch + race-like class | `RECONFIRMED_CURRENT` | `RECONFIRM_CURRENT` |
| OTF 自由が丘 | `capability:87ee5b5a-431c-4eae-9c70-7a7bed0287de:competition-simulation` | 30d | OTF | named branch + race-like class | `RECONFIRMED_CURRENT` | `RECONFIRM_CURRENT` |
| GYM FIELD 東大阪 | `capability:cc8f2cee-62bd-4756-abfd-5f1b27a9c9d4:competition-simulation` | 30d | FIELD-old → FIELD-東大阪 | exact branch, eight disciplines, `HYROX complete`, alternating running/workouts | `SUPPORT_MOVED_EQUIVALENT_SOURCE` | `SOURCE_REBIND_REQUIRED` |
| OTF 武蔵小金井 | `capability:d5e17f12-a158-4988-aa00-e6626225f8c0:competition-simulation` | 30d | OTF | named branch + race-like class | `RECONFIRMED_CURRENT` | `RECONFIRM_CURRENT` |
| Improve KYOTO | `capability:e24cedfb-5333-4cd0-9164-1d764c3f6d73:competition-simulation` | 30d | Improve | scheduled HYROX Simulation sessions | `RECONFIRMED_CURRENT` | `RECONFIRM_CURRENT` |
| OTF 八王子オーパ | `capability:e77b1201-a8d8-428c-910f-f48edbca71ba:competition-simulation` | 30d | OTF | named branch + race-like class | `RECONFIRMED_CURRENT` | `RECONFIRM_CURRENT` |
| OTF 三鷹 | `capability:f6b82f46-09dc-4b5e-abe6-df477665d6fb:competition-simulation` | 30d | OTF | named branch + race-like class | `RECONFIRMED_CURRENT` | `RECONFIRM_CURRENT` |

## 6. Reconfirmation results

Fifteen claims are `RECONFIRMED_CURRENT`. The reviewed candidate timestamp is `2026-09-19T14:15:24.000Z`; proposed expiry is exactly 30 days later, `2026-10-19T14:15:24.000Z`; the URGENT boundary is 14 days before expiry, `2026-10-05T14:15:24.000Z`. Under the existing global threshold, these refreshed 30-day claims project to `DUE_SOON` immediately—not FRESH. Timestamps were proposed only after semantic and facility-binding review, never from HTTP 200, hash stability, or matcher success alone.

## 7. Support drift

Confirmed support drift: **0**. No publication-hold delta is proposed. Historical evidence remains intact, and no missing support was converted into a negative fact.

## 8. Source rebind

Count: **1**. GYM FIELD's accepted `https://www.field-gym.com/hyrox/` now redirects to the generic `https://www.gym-field.com/hyrox/`. The precise current first-party replacement is `https://www.gym-field.com/studios/higashiosaka/`, which binds 東大阪 at the matching address and presents the eight disciplines plus `HYROX complete` as alternating running and workouts. The candidate treats that as equivalent to the accepted mock-race-format semantics, does not strengthen it into station/open-use claims, appends a new source/evidence relation, and preserves the old relation as auditable history. Proposed monitor groups are narrowly `東大阪`, `HYROX complete`, and `ランニングとワークアウトを交互`.

## 9. Monitor false positives

Count: **0**. No matcher-code change or live matcher activation is proposed. The GYM FIELD condition is a source move, not a false positive on the old generic page.

## 10. Holds/errors

Manual-review holds: **0**. Temporary monitor errors: **0**. Source-unavailable results: **0**. All target decisions are represented in the packet; the only outstanding decision is the single Human Gate for the coherent candidate.

## 11. Candidate mutation packet

The non-executed packet contains 15 guarded `APPEND_REVIEWED_CONFIRMATION_AND_REFRESH_CURRENTNESS` operations, one guarded source-rebind/reconfirmation operation, and 16 coherent canonical-monitor refresh operations. It contains no publication hold and no monitor matcher delta. Future execution must append reviewed evidence, retain prior evidence/source history, and enforce the frozen old timestamp/evidence guards.

- `RECONFIRMATION_DB_DELTA_SHA256 = 02bbe6010e1ff35d8718df05548c30af7ead66f966d738dcb244edb97b80ab59`
- `PUBLICATION_HOLD_DELTA_SHA256 = 4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945`
- `SOURCE_REBIND_DELTA_SHA256 = c7bae752a8e62fd8bfae5ece714f184cae5f33f10af9ea0c43549c9b1ecbfd73`
- `MONITOR_MATCHER_DELTA_SHA256 = 4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945`
- `CANONICAL_MONITOR_AUTHORITY_DELTA_SHA256 = 3d333c9fe2ebd95911ae907711ef31a17cc60a4b03d5679bc935ac368cc17f62`
- `H3_5B_RELEASE_COHERENCE_SHA256 = 30bca7613af3b0bf80511cb5c31191aa926a858a2d381f9465ee87f506496881`

## 12. Production invariance

**NO WRITES.** Production DB rows, confirmation timestamps, publication state, source bindings, monitor live authority, H3-12D data, coordinates, UI, RPCs, and schema are unchanged. Generated `.artifacts` monitor output is ignored and is not authority activation.

## 13. H3-12D release blocker

`H3_12D_PRODUCTION_RELEASE_BLOCKED_BY_H3_5B: YES`.

The 16 claims now have a complete reviewed candidate resolution, but the source-rebind/reconfirmation packet has not been accepted or executed. After Human acceptance, a separate authorized Production Data Gate must atomically apply and verify the DB and canonical-monitor deltas. Only successful release verification can clear H3-5B as a Production blocker; H3-12D was not started here.

## 14. Tests

- H3-12C exact-main closure validation: PASS as recorded in section 2.
- H3-5B targeted authority tests: `6/6` PASS, verifying the exact 16-claim live set, five-URL deduplication, 15+1 classification, facility binding, 30/14-day boundaries, narrow source rebind, evidence preservation, deterministic hashes, release coherence, and Production invariance.
- Full unit suite: `373/373` PASS. Typecheck, scoped ESLint, JSON parse/hash validation, and `git diff --check`: PASS.
- Production build: not required because no runtime/app file changed.

## 15. Human Review request

Please decide **ACCEPT** or **NEEDS_CORRECTION** for this single coherent H3-5B candidate. Acceptance covers the 15 reviewed reconfirmations and the one GYM FIELD 東大阪 equivalent-source rebind proposal.

**Candidate ACCEPT does not authorize Production mutation.** A separate explicit Production Data Gate remains required. Until that release is applied and verified, do not return H3-12D to Production execution.
