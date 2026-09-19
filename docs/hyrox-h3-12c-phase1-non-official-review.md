# GymMap HYROX H3-12C — Phase 1 identity, eligibility, and implementation contract

## 1. Verdict

**H3-12C — PHASE 1 REVIEW COMPLETE / PARTIAL HOLD / HUMAN REVIEW REQUIRED**

The accepted H3-12B set is intact and all seven exact facilities remain eligible, but the present governing-body authority changes the release shape: CrossFit Setagaya, JGFS Gotanda, and TOMMY WORKOUT GYM are now listed in the HYROX Training Club Finder and must enter by the Official path. The other four are verified non-Official candidates. All seven require new GymMap locations; the four non-Official candidates remain on coordinate hold. H3-5B precedence also blocks a future Production release until its current urgent claims are resolved.

This candidate changes no runtime, schema, RPC, public UI, Production data, or live monitor state.

## 2. Git authority

- Requested known main: `76f71554d3aafa2245f795e16ef7c7fc4cf20746`.
- Fetched `origin/main`: `76f71554d3aafa2245f795e16ef7c7fc4cf20746`; intervening commits: none.
- Repository and read-only Production migration head: `0015`.
- Branch: `codex/hyrox-h3-12c-phase1-nonofficial`.
- Isolated worktree: `/private/tmp/gymmap-h3-12c-phase1-nonofficial`.
- H3-12A and H3-12B machine authorities, H3-11A/B/R1/R2/R3 authority, current public inventory, location inventory, monitors, and dirty worktrees were inspected. The user's dirty checkout was not used for edits.
- Candidate scope: docs, deterministic data manifests, and validator test only.
- Production mutation: **NO**.

## 3. Current monitor state

Read-only precheck at 2026-09-19:

| Monitor | Result |
| --- | --- |
| Location | 82 total; 76 `NO_CHANGE`; 6 `REVIEW_REQUIRED`; 0 errors; no due/urgent/stale freshness entries |
| Canonical enrichment | 235 claims from 45 sources; 219 `FRESH`; 0 `DUE_SOON`; 16 `URGENT`; 0 `STALE`; 8 source-URL reviews; 14 support reviews; 0 publication mismatches; 0 errors |
| Raw/restriction | 50 entries (38 raw, 12 restrictions) from 18 deduplicated requests; all 50 `FRESH`; 0 due/urgent/time-expired/support-drift/error |

The location queue includes the known BEYOND and INSPA signals; they are not treated as H3-12C authority changes. `FUTURE_PRODUCTION_RELEASE_BLOCKED_BY_H3_5B: YES`, because canonical enrichment currently has 16 urgent claims. H3-12C remains valid as a read-only/design phase.

## 4. Phase 1 exact set

The accepted H3-12B set hash is `5ebf2ea3d76a2ae016434fbb46b797ab427e82d3a5eb3a0e50ddb066b65d20ff`. There are exactly seven candidates and no substitution.

| Facility | Location identity | GymMap | Current Official state | Eligibility |
| --- | --- | --- | --- | --- |
| WARRIORS GYM Roppongi | WARRIORS GYM, 六本木3-16-35 | New | Verified non-Official | `ELIGIBLE_VERIFIED_NON_OFFICIAL` |
| CrossFit Roppongi | CrossFit Roppongi, 六本木7-4-8 | New | Verified non-Official | `ELIGIBLE_VERIFIED_NON_OFFICIAL` |
| CrossFit Setagaya | CrossFit SETAGAYA, 若林1-18-10 | New | `OFFICIAL_STATUS_DRIFT` | `ELIGIBLE_OFFICIAL` |
| GYM FIELD Tachikawa Studio | ジムフィールド立川スタジオ, 高松町2-22-1 | New | Verified non-Official | `ELIGIBLE_VERIFIED_NON_OFFICIAL` |
| JGFS / JiroGym Fitness Studio Gotanda | JGFS 五反田, 西五反田7-22-17 | New | `OFFICIAL_STATUS_DRIFT` | `ELIGIBLE_OFFICIAL` |
| CrossFit Ikebukuro | クロスフィット池袋, 池袋3-60-4 | New | Verified non-Official | `ELIGIBLE_VERIFIED_NON_OFFICIAL` |
| TOMMY WORKOUT GYM Meguro | TOMMY WORKOUT GYM, 下目黒3-4-2 | New | `OFFICIAL_STATUS_DRIFT` | `ELIGIBLE_OFFICIAL` |

GOLD'S GYM Harajuku Tokyo remains `OUTSIDE_PHASE1_UNCHANGED`. It was neither substituted into nor promoted within this set.

## 5. Identity resolution

The 444-row GymMap location inventory produced no exact location, published discipline, name-and-domain, or address-and-site match for any of the seven. Each therefore resolves to `NEW_GYMMAP_LOCATION_REQUIRED`; no fuzzy merge is authorized.

Only GYM FIELD reuses an existing brand: `ジムフィールド` / `a485c34e-968b-429d-aa77-2a9196b2dd45`. The other six are new brand candidates. Proposed slugs are unique and are frozen in the identity manifest.

Finder-authoritative coordinates are available for Setagaya (`35.643349, 139.66366`), JGFS (`35.6219252, 139.7190626`), and TOMMY (`35.6309342, 139.7092413`). WARRIORS, CrossFit Roppongi, GYM FIELD Tachikawa, and CrossFit Ikebukuro have no accepted deterministic coordinate authority and remain `COORDINATE_AUTHORITY_REQUIRED`; no coordinates were guessed or borrowed.

## 6. Eligibility evidence

The review event is anchored at `2026-09-19T13:45:28.030Z`; with no earlier explicit end dates, nominal expiry is `2026-12-18T13:45:28.030Z`. HTTP observation alone will not extend this boundary.

| Facility | First-party source and binding | Confirmed relationship | Class / support check |
| --- | --- | --- | --- |
| WARRIORS | `https://warriors-gym.com/facility/`; exact facility | Dedicated HYROX training area | Verified non-Official / `TEXT_DETERMINISTIC` pass |
| CrossFit Roppongi | `https://crossfitroppongi.com/hyrox`; exact facility | Recurring coached sessions for members and non-members | Verified non-Official / `TEXT_DETERMINISTIC` pass |
| CrossFit Setagaya | `https://crossfit-setagaya.com/faq`; exact facility plus Finder | Current HYROX class | Official / `TEXT_DETERMINISTIC` pass |
| GYM FIELD Tachikawa | `https://gym-field-htc.com/lp/tachikawa/`; named branch | Branch-specific training program and access pricing | Verified non-Official / `TEXT_DETERMINISTIC` pass |
| JGFS Gotanda | `https://jirogym-fs.com/`; exact facility plus Finder | Coached HYROX classes | Official / `DYNAMIC_BUT_DETERMINISTIC` title-bound pass |
| CrossFit Ikebukuro | `https://cf-ikebukuro.com/`; exact facility | HYROX class and Open Gym | Verified non-Official / `TEXT_DETERMINISTIC` pass |
| TOMMY | `https://tommyworkout.stores.jp/reserve/tommyworkoutgym`; exact booking surface plus Finder | Level-specific group classes and Open Gym | Official / `CHECK_UNAVAILABLE_ACCESS_RESTRICTED`; human-reviewed support and deterministic Finder identity |

TOMMY's automated booking-page request currently receives a STORES captcha HTTP 403. That is a monitor limitation, not support removal. Its Official path is independently bound by the current governing-body Finder.

## 7. Eligibility review ledger design

- Auxiliary dimension: `discipline-eligibility`, kind `AUXILIARY`, display order 110.
- The current schema can store it, but the row does not exist in Production.
- Migration `0014` makes the metadata taxonomy SELECT-only for service role; ordinary service-role insertion is not authorized.
- Required operational path: metadata seed migration or admin-authority SQL. This is a taxonomy data addition, not a schema change, and is not implemented here.
- Protocol: reuse `hyrox-review-coverage` / `h3-11a-v1`.
- Per-facility units: `FACILITY_IDENTITY`, `COACHING_PROGRAM_FACT`, and `USAGE_ACCESS_FACT`. Each proposed unit is `COMPLETE / SUFFICIENT / POSITIVE_FOUND` only where the reviewed source closes that fact; the access unit may be optional when the coaching fact alone closes eligibility.
- Future relations use review cycle → units → exact source relations. No station dimension or invented negative outcome is used.

## 8. Publication architecture

The current model already represents the accepted semantics:

- `location_training_disciplines` can publish a current HYROX discipline without an affiliation row.
- `training_evidence` can target `location_training_discipline_id`, so there is no eligibility evidence persistence gap.
- `published_location_training_disciplines` derives `official` from a published affiliation rather than requiring one.
- `search_training_locations('hyrox', official_only=false)` can return both groups and already orders Official first at the RPC boundary.
- A non-Official row therefore needs no `training_affiliations` row and no external HGY identifier.

`SCHEMA_CHANGE_REQUIRED: NO`; `RPC_CHANGE_REQUIRED: NO`; `PUBLICATION_VIEW_CHANGE_REQUIRED: NO`; `PERSISTENCE_GAP: NO`.

## 9. Phase 1 publication design packet

No packet is executable in H3-12C.

| Facility group | Future write concepts | Affiliation behavior | Current blocker |
| --- | --- | --- | --- |
| WARRIORS, CrossFit Roppongi, CrossFit Ikebukuro | new brand/location, training source, discipline, evidence, review ledger, eligibility-monitor manifest | `official=false`; affiliation row `NONE`; HGY ID `null` | coordinate authority |
| GYM FIELD Tachikawa | new location under existing brand, training source, discipline, evidence, review ledger, eligibility-monitor manifest | `official=false`; affiliation row `NONE`; HGY ID `null` | coordinate authority |
| Setagaya, JGFS, TOMMY | new brand/location as applicable, source, Finder external ID, discipline, evidence, governing-body affiliation, review ledger, Official-monitor onboarding | `official=true`; real Finder-bound affiliation only | rebase to existing Official ingestion path |

All packets additionally depend on the taxonomy seed/admin step, H3-5B resolution, and the later implementation data/visual gate.

## 10. Eligibility monitor candidate

The non-live manifest contains the four verified non-Official entries. Setagaya, JGFS, and TOMMY are routed to the existing Official Finder monitor instead of being mislabeled as non-Official monitor entries.

- Canonical-URL request deduplication; maximum concurrency 4; maximum attempts 2.
- Honor `Retry-After` with bounded backoff.
- Source health: timeout, 429, and temporary server errors → `MONITOR_ERROR`.
- Reviewed support removal → `SUPPORT_DRIFT`; loss of branch binding → `FACILITY_BINDING_DRIFT`; review expiry → `TIME_EXPIRED`.
- A successful reachability observation does not renew `reviewed_at`.
- TOMMY's facility source check is access-restricted; the limitation is explicit and freshness fails closed by time. Its Finder check remains deterministic.
- New privileged secret: none. Production DB access: none. Automatic Production write: none. Live activation: **NO**.

## 11. Loader/type implementation contract

The current application loader is still Official-only: the server sends `p_official_only=true`; `HyroxDiscoveryLocation.official` is the literal `true` type; false rows are rejected; the client sort discards RPC Official-first grouping; and the data object only has a total count.

The smallest later implementation is:

1. Default the RPC call to `p_official_only=false` while preserving pagination, URL supplementation, deduplication, and fail-closed checks.
2. Change the DTO field to `official: boolean`. Do not add a redundant stored affiliation enum: publication eligibility plus the boolean is sufficient for presentation.
3. Stable-sort by `official desc`, then the existing prefecture, city, name, and location ID ordering.
4. Derive unique-location `totalCount`, `officialCount`, and `verifiedNonOfficialCount`, asserting `N = O + V`.
5. Update the exact page, detail, card, selected-map content, disclosure, tests, and metadata strings listed in the implementation contract.

No runtime implementation is included in this candidate.

## 12. Default discovery/filter/count contract

- Default dataset: all currently eligible published HYROX facilities.
- Default order: Official first, then verified non-Official; existing secondary ordering is retained within each group.
- Filter: `Official Training Clubのみ`, default OFF; URL owner `official=1`; predicate `location.official === true`.
- One filtered array drives map, compact list, cards, and count. If filtering hides the selected non-Official facility, clear selection and its selection query state, then announce the change.
- Current nationwide: `N=82, O=82, V=0`.
- Projected if all seven are published in their **current** classifications: `N=89, O=85, V=4`.
- Current Tokyo: `N=30, O=30, V=0`.
- Projected Tokyo: `N=37, O=33, V=4`.
- Every set satisfies `N = O + V` and deduplicates by `location_id`.

## 13. UI wording contract

- Official badge: `Official Training Club`.
- Verified non-Official compact label: `HYROXトレーニング情報を確認`.
- Full label: `施設の公式情報でHYROXトレーニングを確認`.
- Clarification: `Official Training Clubの認定を示すものではありません`.
- Recommended disclosure: `Officialバッジは、HYROXの公開情報でOfficial Training Clubとして確認できた施設に表示します。このほか、施設自身の公式情報でHYROXトレーニングを確認した施設も掲載しますが、Official Training Clubの認定を示すものではありません。`

Facility identity remains dominant. Existing confirmed equipment stays positive-only. No station completeness, compatibility score, quality rank, or negative state is introduced.

## 14. Map/M1 impact

Reuse the H3-10C/M1 shared marker and interaction system. There is no affiliation-specific marker color, marker type, or map behavior. Distinction belongs in selected content, label/badge, and filter. Map/list/count consume the same filtered array, and generic aria wording changes from Official-only to HYROX training facilities. Selection, URL, viewport, and shared map ownership remain unchanged.

## 15. SEO impact

Keep `/training/hyrox`; do not add a Tokyo, station, or equipment route and do not add sitemap entries. Preserve canonical, robots, sitemap behavior, and metadata quality.

Current copy that becomes inaccurate is enumerated with exact file and string in the implementation contract, including `Official Training Club一覧`, the page description asserting every result is Official, the detail's unconditional Official label, and the home entry's Official-only wording.

Recommended mixed-inventory H1: `HYROXトレーニング施設 N施設（Official O施設）`. Recommended description: `日本国内のHYROXトレーニング施設を地図と都道府県から探せます。Official Training Clubと、施設公式情報でHYROXトレーニングを確認した施設を区別して掲載します。`

## 16. Station-data status

These are reused H3-12A pointers only; H3-12C derives no station state.

| Facility | Station data pointer |
| --- | --- |
| WARRIORS GYM Roppongi | `PARTIAL` |
| CrossFit Roppongi | `PARTIAL` |
| CrossFit Setagaya | `PARTIAL` |
| GYM FIELD Tachikawa Studio | `PARTIAL` |
| JGFS Gotanda | `CURRENTLY_AVAILABLE` |
| CrossFit Ikebukuro | `PARTIAL` |
| TOMMY WORKOUT GYM | `REQUIRES_H3_11D_REVIEW` |

Eligibility controls discovery presence; later H3-11E enrichment remains separate and does not gate eligibility.

## 17. Holds / blockers

| Facility | Classification |
| --- | --- |
| WARRIORS GYM Roppongi | `COORDINATE_HOLD` |
| CrossFit Roppongi | `COORDINATE_HOLD` |
| GYM FIELD Tachikawa Studio | `COORDINATE_HOLD` |
| CrossFit Ikebukuro | `COORDINATE_HOLD` |
| CrossFit Setagaya | `OFFICIAL_PATH_REBASE_REQUIRED` |
| JGFS Gotanda | `OFFICIAL_PATH_REBASE_REQUIRED` |
| TOMMY WORKOUT GYM | `OFFICIAL_PATH_REBASE_REQUIRED`; booking-page automated check limitation is non-blocking for current Finder identity |

Shared blockers are H3-5B resolution before Production mutation, the `discipline-eligibility` metadata seed/admin insertion, and the later implementation human gate. A facility-specific hold does not block design completion for the others.

## 18. Safety cases

All A–R cases have deterministic outcomes:

| Case | Outcome |
| --- | --- |
| A | Equipment/CrossFit identity alone is not eligible. |
| B | Generic branch-unbound material requires review. |
| C | Ended or stale event support fails closed. |
| D | Current exact-facility class support qualifies as verified non-Official absent Finder affiliation. |
| E | Current exact-facility preparation program qualifies on the same basis. |
| F | Third-party completeness remains discovery-only. |
| G | Current Finder affiliation yields Official independently of equipment depth. |
| H | Station depth is not an eligibility threshold. |
| I | Removed support is withheld for review without inventing a negative fact. |
| J | A current facility-bound official schedule can qualify. |
| K | Strong exact-facility support without HGY remains non-Official; no identifier or affiliation is invented. |
| L | Later Finder listing changes the route to Official ingestion. |
| M | Eligibility expiry withholds discovery while independent equipment facts keep their own clocks. |
| N | 429 is `MONITOR_ERROR`; the eligibility clock is unchanged. |
| O | Closure/relocation requires identity review and withholding. |
| P | Alternate-name location is reused only after exact address/site/identifier closure; name-only merge is forbidden. |
| Q | Missing or wrong coordinates produce a coordinate hold, never a guess. |
| R | Generic brand support shared across unnamed branches produces binding drift and withholding. |

## 19. Authority artifacts/hashes

- `data/hyrox/h3-12c-phase1-identity-eligibility.json`
- `data/hyrox/h3-12c-eligibility-monitor-candidate.json`
- `data/hyrox/h3-12c-publication-packet-design.json`
- `data/hyrox/h3-12c-loader-type-ui-implementation-contract.json`
- `data/hyrox/h3-12c-phase1-authority-hashes.json`
- `src/lib/__tests__/hyrox-h3-12c-phase1-design.test.ts`

| Hash | Value |
| --- | --- |
| `PHASE1_IDENTITY_SHA256` | `57a7215a54f87894e29abc444289b0b74aa3929c4ab3f562d39482a061b63134` |
| `PHASE1_ELIGIBILITY_SHA256` | `34a9456b951301b552bc08f71f2153d6ed84b0f65ab9aee811f1fcd82e0c8a5e` |
| `ELIGIBILITY_MONITOR_CANDIDATE_SHA256` | `dacdb9c2d599e22a1abaef4815bdb706d3cd0ee6242a0023610551888ac099fb` |
| `PUBLICATION_PACKET_DESIGN_SHA256` | `f300a8f362489a855cd1e3c1c0ba21928adfe53b7b7eca0f08de0651635e2fbc` |
| `IMPLEMENTATION_CONTRACT_SHA256` | `9d9e4e4bac5b5c5493a5e3db517140608593ddc3024583b3fdc076d086e6e7c8` |
| `PHASE1_RELEASE_DESIGN_COHERENCE_SHA256` | `0344c6dff9d180ce8a8d3897c331d5b6809063779bb13a8d601f7ce56863889e` |

Execution timestamps are excluded from semantic hash identities by date-normalizing review boundaries and hashing only the frozen semantic projections.

## 20. Validation

- H3-12C invariant test: 9 passed, 0 failed.
- Relevant HYROX/H3-11/H3-12/monitor suite: 182 passed, 0 failed.
- Full unit suite: 367 passed, 0 failed.
- TypeScript: passed with `tsc --noEmit --incremental false` after constructing the isolated lockfile-resolved dependency tree.
- Scoped ESLint: passed.
- All five JSON artifacts parse successfully.
- Candidate-set exactness, duplicate identity protection, affiliation safety, first-party support, freshness, expiry handling, support-check simulation, count arithmetic, loader/DTO/filter/map boundaries, A–R safety, no runtime import, no Production mutation, and deterministic hashes are directly asserted.
- Production build was not run because this candidate contains only docs/data/tests.

## 21. Production invariance

**NO MUTATION.** No Production row, schema, RPC, publication view, taxonomy, monitor activation, runtime/UI file, secret, or station derivation was changed. Read operations covered the current inventory, counts, schema/RPC behavior, migration head, taxonomy permissions, and monitor state only.

## 22. Recommended next phase

After this Human Gate, use the smallest follow-up: **H3-12D — Phase 1 Mixed-Inventory Implementation + Visual/Data Candidate**.

It should first resolve H3-5B precedence and the four coordinate holds, then prepare the taxonomy seed/admin candidate, exact idempotent Production data packet, Official-monitor onboarding for the three status drifts, non-Official eligibility monitor implementation, loader/type changes, mixed-inventory UI, and Human Visual Review. It must retain a Production Data Gate and must not start automatically from H3-12C acceptance.

## 23. Human Review request

One review covers the exact identities, present eligibility classifications, 90-day freshness, monitor candidate, publication architecture, and loader/type/UI contract.

Please reply with exactly one of:

- `ACCEPT`
- `NEEDS_CORRECTION`
