# HYROX H3-12A — Tokyo Training Facility Gap Audit

- Research date: 2026-09-19 (Asia/Tokyo)
- Scope: Tokyo; research and authority design only
- Seed: [HYFIT Tokyo comparison](https://hyfit.jp/insights/tokyo-hyrox-gyms-confirmed/) (discovery only)
- Protocol: H3-11A positive-only evidence semantics
- Machine-readable companion: `data/hyrox/h3-12a-tokyo-training-facility-gap-audit.json`
- Verdict: **TOKYO HYROX TRAINING FACILITY GAP AUDIT COMPLETE / PRODUCT DECISION REQUIRED**

HYFIT is not an evidence authority for GymMap. Its facility and station claims were treated as hypotheses and checked against facility-bound first-party sources. This document does not authorize a public station score, a production import, or a change to affiliation semantics.

## 1. Verdict

GymMap should not copy HYFIT's `8/8`, `6/8`, `5/8`, or `4/8` claims. None of the three HYFIT `8/8` facilities can currently be reproduced as a complete eight-station physical capability under the strict H3-11A dependency contract from the first-party surfaces reviewed here.

There is, however, a real product gap. At least four absent seed facilities publish facility-specific HYROX programs or environments on first-party surfaces. The existing database can publish a HYROX discipline while keeping `official=false`; the current public application deliberately suppresses that state. The recommended target is **Option B: Official-first, with a separately labeled and independently evidenced non-Official section**.

Recommended non-Official label:

> 施設の公式情報でHYROXトレーニングを確認

Required adjacent clarification:

> HYROX Official Training Clubの認定を示す表示ではありません。

Do not use `HYROX公認`, `公式対応`, or an unqualified `HYROX Training Club` for a facility whose governing-body affiliation has not been established.

## 2. Current GymMap baseline

Read-only production observations on 2026-09-19:

| Measure | Current state |
| --- | ---: |
| Published HYROX facilities nationwide | 82 |
| Published HYROX facilities in Tokyo | 30 |
| Published rows with `official=false` | 0 |
| Seed-six exact facilities present | 2 |
| Seed-six exact facilities absent | 4 |

The public `/training/hyrox` page describes and returns Official Training Clubs only. The server calls `search_training_locations` with `p_official_only=true`; the domain type fixes `official: true`; the loader fails closed if a non-Official row leaks through. The page, result heading, cards, details, counts, metadata, and disclaimer all assume Official-only semantics.

The two present seeds are:

| Facility | GymMap identity | Official authority | Current positive canonical facts | Review/freshness |
| --- | --- | --- | --- | --- |
| Orangetheory Fitness 麻布十番 | `0b573034-d71b-4176-a3b3-82e9355d123e`; `hyrox-training-club-1060045`; 〒106-0045 港区麻布十番1-7-5 B2; 35.656450, 139.734851 | `HGY_MBiqaWicnf0xZ4Ftz9b8aMRTE`; Official Training Club | equipment: farmers-carry-implements, row-erg, sandbag, treadmill, weighted-sled; capability: competition-simulation, discipline-coaching | canonical monitor active; equipment current to 2027-02-26, coaching to 2026-11-28, simulation to 2026-09-29; no H3-11D station review cycle found |
| Club 360 | `33bc8540-aca5-4aca-9921-c3f14dd8d067`; `club-360-1060046`; current address text `Vort Building B1`; 35.658026, 139.727543 | `HGY_4GF2DeDJoIzNRU4jn9scAv65V`; Official Training Club | equipment: row-erg, sandbag, ski-erg, weighted-sled; capability: competition-simulation, discipline-coaching, open-training | H3-11D review ledger/raw facts present; confirmed 2026-09-02; equipment current to 2027-03-01, coaching/open training to 2026-12-01, simulation to 2026-10-02 |

Club 360 has a material identity issue: its current GymMap row represents one address, while first-party HYROX/open-gym material spans Motoazabu (3-1-35 Motoazabu) and Higashiazabu (1-8-4 Higashiazabu). Facility-bound claims must not be silently projected across both branches.

## 3. HYFIT seed comparison

| Exact facility | HYFIT hypothesis | GymMap coverage | Independent result | Primary gap type |
| --- | --- | --- | --- | --- |
| WARRIORS GYM Roppongi | 8/8 | Absent | strong HYROX arena, SkiErg, RowErg and sled-push evidence; composite and remaining stations do not close all H3-11A dependencies | missing collection + derivation |
| CrossFit Roppongi | 8/8 | Absent | HYROX classes/coaching are explicit; official gallery directly supports RowErg, not all eight physical stations | unsupported third-party interpretation + missing collection |
| CrossFit Setagaya | 8/8 | Absent | HYROX class names SkiErg, row, sled, burpees, lunges and wall balls; it does not close Farmers Carry or several composite dependencies | derivation + unsupported completeness |
| GYM FIELD 立川スタジオ | 6/8 | Absent | facility page supports the same six station themes, but Sled Pull and Wall Ball still need composite dependency resolution | Official-only eligibility + derivation |
| Orangetheory Fitness 麻布十番 | 5/8 | Present, Official | brand page binds all stores including Azabu to HYROX classes and now also states sled/equipment use; current GymMap raw/canonical coverage differs from HYFIT's older matrix | source timing + raw/persistence + derivation |
| Club 360 | 4/8 | Present, Official | fresh first-party sources name SkiErg, rowers, sleds, sandbags, wall balls and lunges; branch binding remains ambiguous | facility identity + derivation |

The HYFIT matrix is useful discovery input, but its count is not reproducible as a GymMap claim because it does not expose the same dependency, branch-binding, provenance, and freshness contract.

## 4. Eight-station evidence audit

Classification is positive-only. `NO_CURRENT_FIRST_PARTY_SUPPORT_FOUND` means this review did not find qualifying current support; it does not mean unavailable.

H3-11A dependencies used:

| Station | Minimum dependency shape for a physical station conclusion |
| --- | --- |
| SkiErg | SkiErg raw fact; versioned station derivation |
| Sled Push | weighted sled + suitable push lane + association |
| Sled Pull | weighted sled + pull rope/apparatus + suitable pull lane + association |
| Burpee Broad Jump | explicit BBJ station space or associated lane; generic floor is insufficient |
| Row | RowErg raw fact; versioned station derivation |
| Farmers Carry | paired suitable implements + carry space/lane + association; kettlebells alone are insufficient |
| Sandbag Lunges | sandbag + lunge space + association |
| Wall Balls | suitable ball + target/height + usable area + association |

### WARRIORS GYM Roppongi

Sources: [official facility/equipment page](https://warriors-gym.com/facility/), [official English floor page](https://warriors-gym.com/en/floor/), [official site](https://warriors-gym.com/). Exact facility: B1, 3-16-35 Roppongi, Minato-ku. The official FAQ/site also states that the HYROX area is available to members and non-members during operating hours without reservation and makes a broad “all official competition equipment” assertion.

| Station | First-party observation | Classification | Safe conclusion |
| --- | --- | --- | --- |
| SkiErg | HYROX area explicitly lists SkiErg | FIRST_PARTY_POSITIVE_SUPPORT | persist raw SkiErg; derived station waits for H3-11E |
| Sled Push | sled plus full-length track explicitly associated with sled pushes | FIRST_PARTY_POSITIVE_SUPPORT | strong physical inputs; derive only under versioned rule |
| Sled Pull | sled pulls/full track stated; no separate qualifying pull-rope dependency established | PARTIAL_SUPPORT | preserve sled/track/pull-use facts; do not publish full station yet |
| Burpee Broad Jump | dedicated arena/track, but no explicit BBJ association | INSUFFICIENT_SUPPORT | generic training space cannot establish BBJ station |
| Row | HYROX area explicitly lists RowErg | FIRST_PARTY_POSITIVE_SUPPORT | persist raw RowErg; derived station waits for H3-11E |
| Farmers Carry | kettlebells listed; no explicit Farmers association/carry lane | PARTIAL_SUPPORT | kettlebells alone are not the station |
| Sandbag Lunges | “sandbag” surface describes a punching bag, not a lunge sandbag | INSUFFICIENT_SUPPORT | do not map this object to sandbag-lunge equipment |
| Wall Balls | wall-ball exercise/equipment is explicit; target height/usable target area not established | PARTIAL_SUPPORT | preserve ball/program fact; do not publish full station yet |

Result: first-party evidence does **not** currently support a strict GymMap `8/8` conclusion.

### CrossFit Roppongi

Sources: [official HYROX page](https://crossfitroppongi.com/hyrox), [official schedule](https://crossfitroppongi.com/schedule), [official facility gallery](https://crossfitroppongi.com/facility/). The HYROX page supports coached Performance/Strength/Racing classes, certified coaching and non-member drop-in. The official gallery visibly supports several Concept2 RowErgs; the reviewed images did not establish the other seven station dependency sets.

| Station | Classification | Safe conclusion |
| --- | --- | --- |
| SkiErg | NO_CURRENT_FIRST_PARTY_SUPPORT_FOUND | HYROX classes do not by themselves establish a SkiErg physical fact |
| Sled Push | NO_CURRENT_FIRST_PARTY_SUPPORT_FOUND | no facility-bound sled/lane dependency set found |
| Sled Pull | NO_CURRENT_FIRST_PARTY_SUPPORT_FOUND | no sled/rope/lane dependency set found |
| Burpee Broad Jump | NO_CURRENT_FIRST_PARTY_SUPPORT_FOUND | no explicit BBJ-associated space found |
| Row | FIRST_PARTY_POSITIVE_SUPPORT | official gallery supports RowErg raw fact |
| Farmers Carry | NO_CURRENT_FIRST_PARTY_SUPPORT_FOUND | no paired implements/carry association found |
| Sandbag Lunges | NO_CURRENT_FIRST_PARTY_SUPPORT_FOUND | no sandbag/lunge-space association found |
| Wall Balls | NO_CURRENT_FIRST_PARTY_SUPPORT_FOUND | no ball/target/area dependency set found |

Result: coached HYROX use is strong, but the physical `8/8` hypothesis is not independently reproducible.

### CrossFit Setagaya

Sources: [official site](https://crossfit-setagaya.com/), [official FAQ](https://crossfit-setagaya.com/faq). Exact facility: 1-18-10 Wakabayashi, Setagaya-ku. The FAQ describes a HYROX class combining running, SkiErg, rowing, sled, burpees, lunges and wall balls; schedule/pricing supports current class access.

| Station | Classification | Safe conclusion |
| --- | --- | --- |
| SkiErg | FIRST_PARTY_POSITIVE_SUPPORT | facility-bound coached SkiErg use is supported; physical derivation remains versioned |
| Sled Push | PARTIAL_SUPPORT | generic “sled” use does not identify push-lane dependency |
| Sled Pull | PARTIAL_SUPPORT | generic “sled” does not establish pull rope, pull lane, or pull association |
| Burpee Broad Jump | PARTIAL_SUPPORT | “burpees” is not specifically Burpee Broad Jump with associated distance/space |
| Row | FIRST_PARTY_POSITIVE_SUPPORT | facility-bound coached rowing use is supported |
| Farmers Carry | NO_CURRENT_FIRST_PARTY_SUPPORT_FOUND | no facility-bound Farmers Carry evidence found |
| Sandbag Lunges | PARTIAL_SUPPORT | “lunges” does not establish sandbag plus associated lunge space |
| Wall Balls | PARTIAL_SUPPORT | coached wall-ball use is supported, but target/height/area are not separately established |

Result: the first-party program is clear, but strict physical `8/8` is not supported.

### GYM FIELD 立川スタジオ

Source: [exact branch official page](https://gym-field-htc.com/lp/tachikawa/). Exact facility: 2-22-1 Takamatsucho, Suzuki Building 2F, Tachikawa; stated hours 09:00–21:00. The page names SkiErg, RowErg, Sled Push & Pull, Wall Balls, Sandbag Lunge and a HYROX-specific program.

| Station | Classification | Safe conclusion |
| --- | --- | --- |
| SkiErg | FIRST_PARTY_POSITIVE_SUPPORT | exact-branch raw fact supported |
| Sled Push | PARTIAL_SUPPORT | explicit activity/sled, but lane dimensions/association need review-unit resolution |
| Sled Pull | PARTIAL_SUPPORT | explicit activity/sled, but rope and lane dependencies are not separately established |
| Burpee Broad Jump | NO_CURRENT_FIRST_PARTY_SUPPORT_FOUND | no exact-branch BBJ evidence found |
| Row | FIRST_PARTY_POSITIVE_SUPPORT | exact-branch RowErg fact supported |
| Farmers Carry | NO_CURRENT_FIRST_PARTY_SUPPORT_FOUND | no exact-branch Farmers evidence found |
| Sandbag Lunges | PARTIAL_SUPPORT | explicit program use; physical sandbag/space dependency set not independently closed |
| Wall Balls | PARTIAL_SUPPORT | explicit program use; target/height/area dependency set not independently closed |

Result: the six HYFIT station themes are discoverable from first party, but a public `6/8` score is not authorized.

### Orangetheory Fitness 麻布十番

Sources: [exact branch page](https://www.orangetheoryfitness.co.jp/azabujuban/), [brand HYROX page](https://www.orangetheoryfitness.co.jp/hyrox/). The HYROX page explicitly binds the offering to all listed stores, includes Azabu-Juban, and describes rowing, Farmers Carry, sandbags, wall balls, approximately 10 m of Burpee Broad Jump, and newer sled-based HYROX60/special-class content.

| Station | Classification | Safe conclusion |
| --- | --- | --- |
| SkiErg | NO_CURRENT_FIRST_PARTY_SUPPORT_FOUND | no branch-bound SkiErg evidence found on reviewed surfaces |
| Sled Push | PARTIAL_SUPPORT | sled use is now supported; suitable push lane/association is not closed |
| Sled Pull | PARTIAL_SUPPORT | sled use is supported; rope/pull lane/pull association is not closed |
| Burpee Broad Jump | PARTIAL_SUPPORT | branch-bound coached use and approximate distance are supported; physical station-space derivation remains |
| Row | FIRST_PARTY_POSITIVE_SUPPORT | branch page/brand HYROX program support rowing/rower use |
| Farmers Carry | PARTIAL_SUPPORT | coached Farmers Carry is supported; paired implements and carry space require raw review |
| Sandbag Lunges | PARTIAL_SUPPORT | sandbag/lunge program use is supported; composite physical dependency review remains |
| Wall Balls | PARTIAL_SUPPORT | wall-ball program use is supported; target/height/usable area remain unresolved |

Why GymMap differs from HYFIT: GymMap has current accepted canonical objects for row, farmers implements, sandbag and sled, while HYFIT's older five-station matrix omits sled and includes activity-level interpretations. Neither surface currently authorizes a strict physical station count.

### Club 360

Sources: [official HYROX page](https://www.club360.jp/hyrox), [official HYROX service page](https://www.club360.jp/service-page/hyrox), [official open-gym page](https://www.club360.jp/open-gym). First party names SkiErgs, rowers, sleds and sandbags, and its service material also names wall balls and lunges. The principal defect is branch binding across Motoazabu and Higashiazabu.

| Station | Classification | Safe conclusion |
| --- | --- | --- |
| SkiErg | FIRST_PARTY_POSITIVE_SUPPORT | accepted/current canonical SkiErg fact exists; exact branch still matters |
| Sled Push | PARTIAL_SUPPORT | sled and training use exist; push lane/branch association remain unresolved |
| Sled Pull | PARTIAL_SUPPORT | no complete branch-bound sled/rope/pull-lane dependency set |
| Burpee Broad Jump | NO_CURRENT_FIRST_PARTY_SUPPORT_FOUND | no explicit branch-bound BBJ evidence found |
| Row | FIRST_PARTY_POSITIVE_SUPPORT | accepted/current canonical RowErg fact exists; exact branch still matters |
| Farmers Carry | NO_CURRENT_FIRST_PARTY_SUPPORT_FOUND | no branch-bound Farmers dependency set found |
| Sandbag Lunges | PARTIAL_SUPPORT | sandbag canonical fact and lunge program use exist; branch/space association remains |
| Wall Balls | PARTIAL_SUPPORT | program use exists; ball/target/height/area and branch binding remain |

Why GymMap differs from HYFIT: GymMap preserves only accepted physical canonical facts and separately stores capability/access facts; HYFIT collapses a branch-spanning editorial interpretation into one count. Identity repair must precede broader claims.

## 5. Official versus non-Official findings

Affiliation and training evidence answer different questions:

- `Official Training Club` must continue to require current governing-body evidence and `is_official=true`.
- A non-Official listing should require facility-bound first-party evidence that the facility intentionally offers HYROX training; generic equipment similarity is insufficient.
- Official affiliation must not be inferred from a facility self-label, a logo, a third-party directory, or the phrase “HYROX class.”
- Station facts, access, coaching, and affiliation remain separate dimensions.

Proposed non-Official eligibility contract for H3-12B:

1. Exact facility identity and address are resolved.
2. A current first-party facility-bound surface explicitly offers HYROX training, a HYROX program, or a HYROX-specific usable environment.
3. At least one independently auditable positive training fact exists (program, station input, access mode, or coaching); generic fitness equipment alone does not qualify.
4. Source class, requested/final URL, observation time, facility binding and freshness are persisted through the existing evidence/review path.
5. Access semantics are explicit: class-only, member/open-gym, drop-in, or unknown.
6. Governing-body affiliation is absent or unresolved and therefore displays no Official badge.
7. No minimum station count is used for eligibility. Station completeness is a different, versioned derivation problem.

## 6. Additional Tokyo discoveries

All final candidates below have a first-party surface. The production identity check was read-only.

| Candidate | First-party source and reason | GymMap presence | Official state | Review priority |
| --- | --- | --- | --- | --- |
| JGFS / JiroGym Fitness Studio 五反田 | [official site](https://jirogym-fs.com/) states HYROX classes, all eight-equipment claim and a 5 m sled track; small-group booking | Absent | unresolved; facility self-description is not governing-body proof | High: unusually rich station/space assertions |
| CrossFit Ikebukuro | [official site](https://cf-ikebukuro.com/) lists HYROX classes, Open Gym and regulation-height/weight wall-ball use; exact address 3-60-4 Ikebukuro | Absent | unresolved | High: strong facility identity, access and target-height evidence |
| TOMMY WORKOUT GYM 目黒 | [official booking surface](https://tommyworkout.stores.jp/reserve/tommyworkoutgym) lists HYROX group classes and Open Gym at 3-4-2 Shimomeguro | Absent | unresolved | High: current booking/access evidence; needs station review |
| GOLD'S GYM 原宿東京 | [official announcement](https://www.goldsgym.jp/shop/harajuku-tokyo/news/6406/) names SkiErg, rower, sandbag, wall ball and kettlebells in the exact branch studio | Absent | unresolved | Medium: strong exact-branch equipment facts, but not a complete HYROX program/access contract yet |

VAMOS Ebisu was also discovered during the bounded search, but it is already present in GymMap as an Official Training Club (`53b51872-63cb-4bfd-aa25-861df7cf203b`, `HGY_CKpn4DHneWfrqTUVaA7D5Whop`) and is therefore not an expansion candidate.

## 7. Architecture fit

The current persistence architecture can represent the target state:

- `location_training_disciplines` can publish a HYROX discipline based on accepted/current training evidence without requiring an affiliation.
- `published_training_affiliations` separately requires governing-body evidence and derives `is_official`.
- `search_training_locations` already accepts `p_official_only boolean default false` and emits an `official` boolean.
- equipment, capabilities, raw facts, review ledger, evidence, freshness and monitor layers are dimensionally separate.

Therefore, `HYROX discipline = published` plus `official = false` is structurally feasible. No schema migration is required merely to publish that distinction.

Smallest missing semantic authority:

- a versioned non-Official HYROX eligibility decision tying exact identity, facility-bound first-party evidence, access state and freshness together;
- a clear review outcome that is not confused with affiliation;
- station derivation authority for composite station claims.

Smallest runtime/UI gaps:

- remove the server's unconditional `p_official_only=true` only after product authorization;
- widen the domain type from `official: true` and replace the non-Official leakage throw with validation of both explicit states;
- define separate total/Official counts, badges, filters, map/list copy, metadata and detail-page wording;
- preserve Official as governing-body-derived, never inferred from discipline publication.

## 8. Station derivation dependency

| Desired output | Classification | Reason |
| --- | --- | --- |
| existing accepted equipment/capability chips for Club 360 and OTF Azabu | CAN_DISPLAY_WITH_EXISTING_CANONICAL_FACTS | already published positive canonical facts, with current freshness |
| source-level object/program observations for absent facilities | REQUIRES_RAW_FACT_DISPLAY | currently research observations, not accepted production facts |
| “SkiErg station confirmed” from raw SkiErg | REQUIRES_H3_11E_STATION_DERIVATION | H3-11A requires a versioned derivation |
| Sled Push/Pull, Farmers, Sandbag Lunge, Wall Ball, BBJ physical station claims | REQUIRES_H3_11E_STATION_DERIVATION | multiple dependencies and associations must be evaluated together |
| “drop-in/open gym can use this station” | REQUIRES_USAGE_AUTHORITY | access to a facility or class does not automatically authorize station use |
| public `8/8`, `6/8`, `5/8`, `4/8` scores | NOT_SUPPORTED_BY_CURRENT_EVIDENCE | completeness and unknowns would be misread; no score authority exists |

An explicit station matrix with per-cell provenance, freshness and `unknown/partial/supported` semantics is safer than a numeric score. It must still wait for H3-11E and must not visually turn unknown into unavailable.

## 9. SEO and search findings

No search-volume source was used; findings are qualitative.

Observed query families included Tokyo/gym, eight-station, SkiErg, sled, wall ball, open gym/drop-in, CrossFit and neighborhood intent. The result set is dominated by:

- editorial comparisons and directories (HYFIT, Provalume, AthleteField, JGFS and other guides);
- facility-owned landing pages (WARRIORS, CrossFit boxes, GYM FIELD, Orangetheory, JGFS, VAMOS, GOLD'S GYM);
- governing-body/rule material for event/station definitions, not facility-level station availability.

Facility comparison pages do rank. The governing-body Finder is useful for affiliation but does not answer the composite station/access questions in a provenance-rich way. A differentiated GymMap answer would combine exact locations, governing-body affiliation, independently reviewed first-party facts, freshness, access mode and map/filter behavior.

Current GymMap is strong for the Official network but weak for “where can I actually train station X?” because it excludes non-Official facilities and does not yet publish derived station capability.

## 10. Potential landing/content architecture

Recommended after data authority exists:

1. `/training/hyrox` remains the canonical national discovery surface, with explicit Official and independently evidenced sections/filter semantics.
2. `/training/hyrox/tokyo` is the first justified geographic landing page once the Tokyo dataset includes reviewed non-Official candidates and sufficient differentiated facts.
3. A single Tokyo station comparison module/page should precede standalone station routes. It can answer supported combinations without creating thin pages.
4. `/training/hyrox/station/sled-push` or `/equipment/ski-erg` should be considered only when multiple current, provenance-backed facilities provide genuinely useful coverage and the page adds explanatory/access content.

Avoid:

- prefecture × city × station × equipment route multiplication;
- indexable pages with one facility or only boilerplate;
- numeric “HYROX対応度” pages;
- Official wording in titles/descriptions for mixed result sets;
- search snippets that collapse unknown into no.

## 11. Product scope options

| Option | Data integrity | User/SEO value | Scope and maintenance | Affiliation clarity | Architecture fit |
| --- | --- | --- | --- | --- | --- |
| A. Official-only + deeper station data | Highest/least semantic change | improves station queries but misses meaningful Tokyo facilities | moderate; H3-11E and deeper source collection | very clear | already implemented boundary |
| B. Official-first + separately labeled verified non-Official | high if eligibility and labels are gated | strong: answers real facility and station intent while retaining trust anchor | moderate-high; adds eligibility reviews and mixed UI | clearest balance | schema/RPC fit; loader/UI change needed |
| C. All evidence-qualified facilities, Official only as filter/badge | feasible but easiest to misunderstand | broadest discovery/SEO reach | highest review/monitor/content burden | greater risk of implied endorsement | schema fits; largest product rewrite |

## 12. Recommendation

Choose **Option B**.

Keep Official facilities first and unmistakably badged. Add a separate, plainly labeled set of exact facilities whose own current surfaces establish intentional HYROX training. Default presentation should preserve the Official section as the trust anchor; a combined map/list may be offered only if every marker/card carries the explicit status. Counts should say, for example, “verified training facilities” and “of which Official Training Clubs,” never reuse one number for both.

The recommended eligibility rule is explicit facility-specific HYROX intent plus current accepted positive evidence—not `4/8`, not an equipment similarity heuristic, and not a self-claimed affiliation.

## 13. Phase 1 candidate set

Data-review priority, not a quality ranking:

| Tier | Facility | Why now | Gate before eligibility |
| --- | --- | --- | --- |
| 1 | WARRIORS GYM Roppongi | richest seed first-party facility/space/access evidence; absent in GymMap | exact identity, raw review units, misleading sandbag-object rejection |
| 1 | GYM FIELD 立川スタジオ | exact branch HYROX page and six explicit station themes; absent | governing-body check, composite station raw review |
| 1 | CrossFit Setagaya | exact facility, class and current schedule evidence; absent | raw facts and access semantics; no completeness inference |
| 1 | CrossFit Roppongi | strong coached HYROX/drop-in evidence and exact identity; absent | physical station collection beyond RowErg |
| 2 | JGFS 五反田 | strong all-eight and 5 m sled-track first-party assertions | identity/governing-body lookup and image/text dependency review |
| 2 | CrossFit Ikebukuro | current HYROX/Open Gym and wall-ball target evidence | governing-body lookup and remaining station review |
| 2 | TOMMY WORKOUT GYM 目黒 | current HYROX booking and Open Gym | governing-body lookup and station/equipment review |
| 3 | GOLD'S GYM 原宿東京 | exact-branch equipment announcement | establish whether HYROX-specific access/program eligibility is sufficient |

Club 360 and OTF Azabu are existing Official rows, not new Phase 1 expansion candidates. Club 360 needs branch identity remediation; OTF needs a H3-11A/H3-11E raw station review.

## 14. Data and semantic gaps

- **Schema:** no mandatory migration for `official=false + published HYROX`; optional future eligibility projection only after authority is frozen.
- **Eligibility:** missing versioned non-Official acceptance contract and review outcome.
- **Identity:** Club 360 branch ambiguity; all new candidates require exact duplicate/branch resolution.
- **Persistence:** four absent seeds have no GymMap location/evidence/raw/review records; OTF lacks an H3-11D station review packet.
- **Freshness:** every accepted non-Official source needs source-class-specific stale windows and monitoring eligibility.
- **Monitor:** affiliation, canonical training facts and raw station dependencies must remain separate monitor targets.
- **Derivation:** H3-11E is required for station claims, particularly composites.
- **Usage:** class, member access, open gym and drop-in require separate authority.
- **Runtime/UI/SEO:** Official-only type guard, query, count, badges, copy, metadata and detail contracts need an authorized mixed-state design.

## 15. Proposed next phases

Recommended order:

1. **H3-12B — Non-Official eligibility and labeling authority.** Freeze exact acceptance, evidence, freshness, badge, count and fail-closed rules.
2. **H3-12C — Tokyo evidence review and identity resolution.** Register no production data yet; produce review-ready exact facility/source/raw packets for Tier 1, plus Club 360 remediation.
3. **H3-11E — Station derivation authority.** Define versioned positive derivations and invalidation for all eight stations.
4. **H3-12C release gate — bounded data candidate.** Human-approved persistence/publication candidate only after the first three authorities pass.
5. **H3-12D — UI/search/SEO expansion.** Mixed Official/non-Official runtime, filters, counts, map/list and Tokyo landing page.

This order avoids building UI around an undefined eligibility rule and avoids publishing station interpretations before H3-11E.

## 16. Production invariance

Confirmed for H3-12A:

- no database insert/update;
- no schema migration;
- no review-ledger or raw-fact write;
- no monitor activation;
- no UI, RPC, sitemap or SEO route change;
- no station derivation write;
- no deployment or publication.

Only read-only production queries and repository research-authority files were used.

## 17. Human Product Decision

Required next authorization:

> Authorize H3-12B to define the versioned non-Official HYROX eligibility, labeling, count, freshness and fail-closed contract for Option B. Do not authorize production data or UI work yet.

If Option A or C is preferred, record that product boundary explicitly before any evidence candidate work begins.

## Source observation register

All observations were made on 2026-09-19 unless a persisted GymMap confirmation date is explicitly stated above.

| Source | Class | Binding | Surface/access | Evidence used |
| --- | --- | --- | --- | --- |
| `https://hyfit.jp/insights/tokyo-hyrox-gyms-confirmed/` | third-party editorial | six named facilities | accessible text | discovery/hypotheses only |
| `https://warriors-gym.com/facility/` | facility official | WARRIORS Roppongi | accessible text | named equipment/object descriptions |
| `https://warriors-gym.com/en/floor/` | facility official | WARRIORS Roppongi | accessible text | dedicated arena and sled track |
| `https://crossfitroppongi.com/hyrox` | facility official | CrossFit Roppongi | accessible text | classes, coaching, drop-in |
| `https://crossfitroppongi.com/schedule` | official schedule | CrossFit Roppongi | accessible text | current class/Open Gym availability |
| `https://crossfitroppongi.com/facility/` | official gallery | CrossFit Roppongi | accessible visual | RowErgs; other reviewed images not qualifying evidence |
| `https://crossfit-setagaya.com/faq` | facility official | CrossFit Setagaya | accessible text | class movement list and access model |
| `https://gym-field-htc.com/lp/tachikawa/` | exact-branch official | GYM FIELD Tachikawa | accessible text | program and six station themes |
| `https://www.orangetheoryfitness.co.jp/azabujuban/` | exact-branch official | OTF Azabu-Juban | accessible text | identity, rower/functional area |
| `https://www.orangetheoryfitness.co.jp/hyrox/` | brand official program | explicitly lists/binds Azabu-Juban/all stores | accessible text | program movements, equipment, classes |
| `https://www.club360.jp/hyrox` | facility official | Club 360 brand/two-site risk | accessible text | HYROX program, equipment, open gym |
| `https://www.club360.jp/service-page/hyrox` | official service | Club 360; branch ambiguity | accessible text | station program themes |
| `https://www.club360.jp/open-gym` | official access | Club 360; branch ambiguity | accessible text | open-gym access and locations |
| `https://jirogym-fs.com/` | facility official | JGFS Gotanda | accessible text | eight-equipment assertion, 5 m sled track, classes |
| `https://cf-ikebukuro.com/` | facility official | CrossFit Ikebukuro | accessible text/visual | classes, open gym, regulation wall ball, exact address |
| `https://tommyworkout.stores.jp/reserve/tommyworkoutgym` | official booking | TOMMY WORKOUT GYM Meguro | accessible text | current classes, open gym, identity |
| `https://www.goldsgym.jp/shop/harajuku-tokyo/news/6406/` | exact-branch official announcement | GOLD'S GYM Harajuku Tokyo | HTTP 200, accessible text | HYROX-specific equipment introduction and studio-use restriction |

Requested URL and final URL were the same for the accessible reviewed surfaces above. H3-12C must re-fetch and persist the normal source-observation fields before any acceptance.
