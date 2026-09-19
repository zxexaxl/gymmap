# HYROX H3-12B — Non-Official Training Facility Eligibility Authority

- Scope: authority design only; no data import, UI work, RPC/schema mutation, monitor activation, SEO route, sitemap, or deployment
- Exact main base: `110cb9c49f1391dc97df12306f9d7e597566e4c0`
- Accepted H3-12A source: `a50013a17b19c86c12b648560b54b4bdf49b6fab`
- Machine authority: `data/hyrox/h3-12b-non-official-eligibility-authority.json`
- Verdict: **H3-12B — NON-OFFICIAL ELIGIBILITY AUTHORITY CANDIDATE READY / HUMAN REVIEW REQUIRED**

## 1. Verdict

Adopt a derived four-state model: `OFFICIAL_TRAINING_CLUB`, `VERIFIED_NON_OFFICIAL_TRAINING_FACILITY`, `REVIEW_REQUIRED`, and `NOT_ELIGIBLE_FOR_HYROX_DISCOVERY`. Do not persist a redundant status enum. Derive public state from current discipline publication, governing-body affiliation, accepted eligibility evidence, source binding, and freshness.

The decisive rule is:

> A non-Official facility enters HYROX discovery only when its own current, facility-bound first-party information explicitly establishes a HYROX training relationship.

Equipment, generic functional-fitness suitability, third-party descriptions, and any station count are insufficient.

## 2. H3-12A closure

Accepted candidate `a50013a` was applied mechanically to latest `origin/main` at `a8e6804`. The three accepted artifacts are blob-identical after integration. The integrated commit is `110cb9c`. H3-12A invariant tests (5/5), typecheck, scoped lint, and `git diff --check` passed before `110cb9c` was pushed to `origin/main`.

**H3-12A — COMPLETE.**

## 3. Git identity for H3-12B

| Item | Identity |
| --- | --- |
| Base main | `110cb9c49f1391dc97df12306f9d7e597566e4c0` |
| Branch | `codex/hyrox-h3-12b-authority` |
| Worktree | `/private/tmp/gymmap-h3-12b-authority` |
| H3-12B candidate | recorded in final handoff after validation |
| Push | candidate branch only |
| Production mutation | none |

## 4. Eligibility contract

All of the following are required for a verified non-Official facility:

1. The GymMap location is active and its exact facility identity is resolved.
2. An accepted first-party source explicitly says that the facility offers HYROX training, a HYROX class/program, HYROX preparation/training service, or an intentionally provided place/environment for HYROX training.
3. The source is `FACILITY_SPECIFIC` or `BRAND_FACILITY_SPECIFIC`. A brand page must explicitly include the branch.
4. The source is a facility/brand official page, official HYROX/program/booking/schedule surface, or sufficiently attributable official social content.
5. The eligibility review is complete and sufficient, is inside its freshness boundary, and has no accepted refutation, unresolved support drift, binding drift, or dispute.
6. The normal `published_location_training_disciplines` conditions are satisfied: confirmed/available discipline, current `stale_at`, accepted supporting evidence, available source, and `review_required=false`.
7. Governing-body affiliation is not required. When no current governing-body authority exists, `official=false`.

One direct HYROX training assertion is the minimum positive evidence. A separate equipment or station fact is not required.

## 5. Ineligible and review-required conditions

`NOT_ELIGIBLE_FOR_HYROX_DISCOVERY` applies when no qualifying current facility-bound first-party assertion exists. Examples are equipment-only suitability, a CrossFit identity without a HYROX statement, a third-party `8/8` claim, or an old ended event page.

`REVIEW_REQUIRED` applies when potentially relevant evidence exists but identity, branch binding, first-party authority, dates, meaning, support continuity, refutation, or monitor observations are unresolved. Neither state asserts that a facility does not offer HYROX training. Both are internal authority outcomes and are withheld from public HYROX discovery.

## 6. Official distinction

Official status remains derived only from a current `published_training_affiliations` row whose accepted supporting source has `publisher_authority='governing_body'`, producing `is_official=true`. Facility marketing, a HYROX logo, facility self-description, classes, or equipment cannot confer Official status.

Non-Official rows must keep `official=false` and must never imply `Official Training Club`, `HYROX認定`, `HYROX公式ジム`, or an official partnership.

## 7. Public labels

| State | Full | Compact | Accessible explanation |
| --- | --- | --- | --- |
| Official | `Official Training Club` | `Official` | `HYROX Official Training Club（HYROXの公開情報で公式所属を確認）` |
| Verified non-Official | `施設の公式情報でHYROXトレーニングを確認` | `HYROXトレーニング情報を確認` | `施設の公式情報でHYROXトレーニングを確認。HYROX Official Training Clubの認定を示すものではありません。` |

Disclosure:

> Officialバッジは、HYROXの公開情報でOfficial Training Clubとして確認できた施設に表示します。このほか、施設自身の公式情報でHYROXトレーニングを確認した施設も掲載しますが、Official Training Clubの認定を示すものではありません。

Do not use `HYROX対応`, `HYROX認定`, `HYROX公式`, or `Official` for a verified non-Official facility.

## 8. Count semantics

Let `N` be all unique published HYROX training facilities, `O` be Official Training Clubs, and `V` be verified non-Official facilities. Deduplicate on `location_id` and enforce `N = O + V`.

- Headline: `HYROXトレーニング施設 N施設（Official O施設）`
- Prefecture: recompute N/O/V inside the selected prefecture.
- Map/list: `N施設を表示（Official O・施設公式情報で確認 V）`
- Official-only: `Official O施設を表示`; this changes the displayed subset, not total inventory N.

An unqualified count must not silently alternate between all verified facilities and Official facilities.

## 9. Default discovery recommendation

Default to **all verified facilities, Official-first**. `Official Training Clubのみ` defaults off. Official rows sort first; badge, grouping/order, count breakdown, and disclosure retain affiliation clarity. This realizes the accepted Option B rather than hiding its added discovery value behind a default filter.

The Official-only filter uses `official=true` only. It is unrelated to equipment or station evidence. The same predicate must update map, list, selected item, and displayed counts. A future shareable query parameter should represent the explicit on-state; its concrete name is deferred to implementation.

## 10. Freshness authority

Use `non-official-hyrox-eligibility-90-day`. This reuses the semantic horizon of current coaching/open-training service authority, not merely a convenient number. Eligibility describes a changing program, schedule, booking, access, or operated training environment—not durable installed equipment.

- Clock anchor: accepted review `reviewed_at`.
- Normal outer boundary: `reviewed_at + 90 days`.
- Explicit date cap: the first instant after a stated program/service end, if earlier.
- HTTP availability and generic page reachability never advance `reviewed_at`.
- Reconfirmation requires reviewed confirmation of explicit HYROX support, facility binding, authority, dates, and non-refutation.
- Expiry removes/holds the facility from HYROX discovery while preserving historical evidence; it does not publish a negative claim.
- Accepted refutation, an explicit end, or loss of facility binding may invalidate immediately.
- A classified unavailable eligibility source makes the state review-required and withholds it from discovery until reviewed authority returns. This does not assert that training is unavailable. A monitor error only reports failure and does not mutate the prior state.

## 11. Monitoring

Decision: **NEW_NARROW_ELIGIBILITY_MONITOR_REQUIRED**.

Reuse the repository-side deterministic manifest, source fetch/normalization, availability classification, support-pattern drift, and freshness severity components. Do not reuse the current enrichment manifest shape unchanged: it models equipment/capability claims and assumes Official HGY-linked records, while eligibility is a facility-discipline assertion and non-Official locations have no HGY requirement.

The narrow manifest must bind location, source, source class, facility binding and basis, support patterns, evidence hash, `reviewed_at`, `stale_at`, and explicit dates. It detects expiry, support drift, facility-binding drift, source unavailability, and monitor errors. It performs no automatic Production write, cannot renew `reviewed_at`, and needs no new privileged DB secret.

## 12. Schema/RPC fit

| Question | Answer |
| --- | --- |
| Schema change? | **NO** |
| RPC change? | **NO** |
| Loader/type change? | **YES, future implementation** |
| UI-only assumptions? | **YES, future implementation** |

`published_location_training_disciplines` does not require an affiliation and already accepts `facility_official`, `official_schedule`, and `official_social` evidence. `published_training_affiliations` independently requires governing-body evidence for `is_official=true`. `search_training_locations` defaults `p_official_only=false`, returns an `official` boolean, and orders Official rows first.

The current application suppresses this supported database state: the server passes `p_official_only=true`, the domain type fixes `official:true`, the loader throws on `official=false`, and page/card/detail/count/metadata/disclosure text is Official-only. Those are future loader/type/UI changes, not an RPC or schema need.

## 13. Publication gate

The exact non-Official gate is:

```text
active location
AND current confirmed available HYROX discipline
AND accepted current supporting discipline evidence
AND eligible first-party source class
AND FACILITY_SPECIFIC or BRAND_FACILITY_SPECIFIC binding
AND explicit facility HYROX training relationship
AND complete/sufficient identity + eligibility review
AND source available and review_required=false
AND no accepted refutation
AND no unresolved drift/dispute
AND explicit end not reached
```

Official affiliation is not required. The derived state is Official first if current governing-body affiliation exists; otherwise it is verified non-Official when this gate passes.

## 14. H3-11 review-ledger relation

Add a future logical `discipline-eligibility` review dimension with `dimension_kind='AUXILIARY'`. The existing ledger schema already permits this, so no migration is required; an authority/data addition is.

Require a complete/sufficient `FACILITY_IDENTITY` unit and at least one complete/sufficient positive `COACHING_PROGRAM_FACT` or `USAGE_ACCESS_FACT` unit on that dimension. Do not copy eligibility into each of the eight workout-station dimensions.

## 15. Station derivation separation

Eligibility answers whether a facility appears in HYROX discovery. H3-11E later answers what GymMap can positively establish about its training environment and can enrich details or filters. Neither a station score, `4/8`, `8/8`, nor equipment count gates eligibility. Conversely, eligibility does not manufacture station facts.

## 16. Seed-six validation

| Facility | Result | Decisive first-party authority |
| --- | --- | --- |
| WARRIORS GYM Roppongi | `ELIGIBLE_VERIFIED_NON_OFFICIAL` | Exact-facility HYROX arena/training environment |
| CrossFit Roppongi | `ELIGIBLE_VERIFIED_NON_OFFICIAL` | HYROX classes/coaching |
| CrossFit Setagaya | `ELIGIBLE_VERIFIED_NON_OFFICIAL` | Facility HYROX class |
| GYM FIELD Tachikawa Studio | `ELIGIBLE_VERIFIED_NON_OFFICIAL` | Exact-branch HYROX-specific program |
| Orangetheory Fitness Azabu-Juban | `ELIGIBLE_OFFICIAL` | Current HGY affiliation plus published discipline |
| Club 360 | `ELIGIBLE_OFFICIAL` | Current HGY affiliation plus published discipline |

Club 360's branch ambiguity still blocks projecting new claims across locations; it does not rewrite the already current governing-body Official classification.

## 17. Additional Tokyo candidate validation

| Facility | Result | Reason |
| --- | --- | --- |
| JGFS / JiroGym Fitness Studio Gotanda | `ELIGIBLE_VERIFIED_NON_OFFICIAL` | Facility first party explicitly states HYROX classes |
| CrossFit Ikebukuro | `ELIGIBLE_VERIFIED_NON_OFFICIAL` | Exact-facility HYROX classes and Open Gym |
| TOMMY WORKOUT GYM Meguro | `ELIGIBLE_VERIFIED_NON_OFFICIAL` | Current exact-facility HYROX class/Open Gym booking |
| GOLD'S GYM Harajuku Tokyo | `REVIEW_REQUIRED` | Exact-branch HYROX equipment announcement is not yet an explicit current training offer/environment contract |

These results validate the authority against accepted H3-12A research only; no new discovery crawl was performed.

## 18. False-positive safety

| Case | Deterministic result |
| --- | --- |
| A. CrossFit + SkiErg/sled, no HYROX mention | Not eligible |
| B. Generic brand HYROX article, no branch binding | Review required |
| C. Two-year-old event page | Not eligible; stale/ended |
| D. Current facility HYROX class page | Eligible verified non-Official |
| E. Current facility HYROX preparation program | Eligible verified non-Official |
| F. Third-party `8/8`, no facility HYROX mention | Not eligible |
| G. Official club, sparse equipment | Eligible Official |
| H. Explicit non-Official program, two station facts | Eligible verified non-Official |
| I. Program page removed | Review required and withheld immediately; no negative facility claim |
| J. Current/future exact-facility HYROX schedule only | Eligible verified non-Official while bookable/current and fresh |

## 19. Phase 1 candidate set

This is a review set, not an import set. Every row projects `official=false`, is representable by the current schema, does not need H3-11E for eligibility, and does need H3-11E for richer station output.

| Group | Facilities | Evidence strength | Disposition |
| --- | --- | --- | --- |
| P1 identity + eligibility | WARRIORS GYM Roppongi; CrossFit Roppongi; CrossFit Setagaya; GYM FIELD Tachikawa Studio; JGFS; CrossFit Ikebukuro | Exact-facility environment, program, or class assertions | Ready for Phase 1 review, not import |
| P1 date + identity | TOMMY WORKOUT GYM Meguro | Current facility booking/class/access | Ready for date/identity review, not import |
| P2 explicit relation gap | GOLD'S GYM Harajuku Tokyo | Exact-branch equipment only for this authority | Hold; find explicit current training relationship |

Candidate freshness is provisionally frozen from the H3-12A review date, 2026-09-19, to 2026-12-18, subject to any earlier explicit end. A future implementation phase must re-review rather than blindly import that clock.

## 20. SEO implications

Safe future concept: `東京のHYROXトレーニング施設`, with separate identification of `Official Training Club` and `施設公式情報でHYROXトレーニングを確認した施設`. Never imply that every result is Official.

Authorize a future mixed page only when it has enough current facilities for the intent, unique structured facility data, evidence-rich explanations, stable freshness/monitor coverage, and a useful synchronized map/list. H3-12B does not authorize thin programmatic combinations, a route, metadata changes, or a sitemap change.

## 21. Authority artifacts and hashes

| Authority | SHA-256 |
| --- | --- |
| Non-Official eligibility | `0fc3b5108eb958698338d958ae94d6e11a1f75aa895019290ba539721272e41c` |
| Labels/disclosure | `ce405a338f9b7d61b5537eecbdd854defaaa69986f48bc6fb56d3050c622fb84` |
| Count semantics | `2f45149fd8ebbbe37b0a6cb7ec81bbc7c29781dcad6a59578d742d6e54f47dfa` |
| Eligibility freshness | `f6541afcd4a1b06cfadbc68a06bcf0a0a80af787c448fca645f7bc2060795f55` |
| Phase 1 candidate set | `5ebf2ea3d76a2ae016434fbb46b797ab427e82d3a5eb3a0e50ddb066b65d20ff` |

Hashes use recursively key-sorted JSON over the named authority sections and exclude execution timestamps.

## 22. Validation

The invariant suite covers H3-12A integrity, first-party and facility-binding requirements, Official separation, label safety, count arithmetic, 90-day freshness, monitoring non-renewal, schema/RPC fit, review-ledger shape, station separation, all seed/additional classifications, A–J cases, Phase 1 bounds, hashes, and complete Production invariance. Final command results are recorded in the handoff.

## 23. Production invariance

**NO MUTATION.** No database row, schema, RPC, affiliation, evidence, review ledger, monitor, UI, route, sitemap, deployment, or Production source was changed.

## 24. Recommended next phase

After human acceptance, run one bounded **H3-12C Phase 1 identity + eligibility review and implementation design**: re-confirm the seven ready candidates, resolve/create GymMap identities as candidates only, specify the narrow eligibility monitor manifest, and design the loader/type/UI change set. Keep data import, monitor activation, and public rollout behind a later explicit gate.

Do not start H3-12C from this authority task.

## 25. Human review request

Please respond with exactly one decision:

- `ACCEPT`
- `NEEDS_CORRECTION`
