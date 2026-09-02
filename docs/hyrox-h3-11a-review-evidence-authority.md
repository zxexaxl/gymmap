# GymMap HYROX H3-11A — Review Coverage and Eight-Station Evidence Authority

Status: **AUTHORITY CANDIDATE / HUMAN REVIEW REQUIRED**

Phase: H3-11A design and read-only audit

Runtime impact: **NONE**

Authority base inspected: `origin/main` at `aa22ee68c18dae3e1f130804c25af939b03006db`

Prior HYROX UI main authority: `9ec8a5f811752bb9713f02dea568fa627e95155a` (ancestor of the inspected `origin/main`)

This candidate defines what GymMap reviewed, what positive facts it knows, which station-level conclusions may be derived, and what remains unknown. It does not authorize H3-11B persistence, a remaining-57 crawl, publication, filters, scores, schema/RPC/UI changes, monitor changes, or production mutation.

## 1. Authority invariants

The public contract remains positive-only:

```text
current publishable positive fact
or
no current published positive evidence
```

The following implications are prohibited:

```text
equipment exists              != station physically feasible
station physically feasible   != usage confirmed
usage not confirmed           != unavailable
no positive evidence          != negative evidence
reviewed + no positive found  != facility lacks the item
source insufficient           != facility lacks the item
```

`equipment_slugs=[]`, `capability_slugs=[]`, a false derived public boolean, an internal no-positive outcome, a stale claim, and a source failure must never become `設備なし`, `未対応`, `利用不可`, `unsupported`, or any equivalent negative public statement. `CONFIRMED_UNAVAILABLE` is not authorized. Review coverage is internal data-operations state and normally renders nothing publicly.

Running is an auxiliary training dimension, not a ninth workout station. Physical facts, service modality, and dated schedule are separate concepts. A `5/8`, HYROX readiness/completeness score, station score, negative filter, or capability completeness score remains **HOLD**.

## 2. Read-only observed baseline

The public `search_training_locations` RPC and committed enrichment-monitor authority were read on 2026-09-02. Existing monitors were run without writes.

| Measure | Observed |
| --- | ---: |
| Official Training Clubs | 82 |
| Equipment-positive facilities | 22 |
| Capability-positive facilities | 21 |
| Facilities with any enrichment | 25 |
| Facilities with no enrichment | 57 |
| Published equipment claims | 109 |
| Published capability claims | 41 |
| Monitored positive claims | 150 |

These are observations, not constants. “No enrichment” means no current published positive equipment or capability claim, not a reviewed or negative facility classification.

## 3. Existing model assessment

| Concept | Existing support | Gap | H3-11B implication |
| --- | --- | --- | --- |
| `training_disciplines` | Discipline identity and default freshness horizon | No review protocol/dimension | Reuse HYROX discipline; do not overload it with review state. |
| `training_capability_types` | Typed high-level capability vocabulary | Current types mix modality, program, space, and auxiliary access; not station derivations | Preserve semantics; add no reinterpretation. H3-11B must decide how typed station claims coexist. |
| `equipment_types` | Stable positive physical equipment taxonomy | Missing wall ball, sled-pull apparatus, and station-specific space facts | Reuse existing raw facts. Future additions must be facts, not opaque station booleans. |
| `discipline_equipment_requirements` | HYROX useful-setup mapping | Discipline-level `core/recommended/optional` is not an eight-station derivation graph | Keep current semantics. Do not use it as a completeness score or station rule engine. |
| `training_sources` | URL, facility binding, source kind, authority, availability, checks, hash, review signal | Source taxonomy is too coarse for brand facility/equipment/HYROX/program/booking/gallery distinctions; no reviewed source-set relation | H3-11B must represent richer logical source classes without weakening existing enums. |
| `location_training_disciplines` | Positive/unknown support, verification, freshness | Facility-discipline state is not review coverage | Keep affiliation/support publication separate from station review. |
| `location_training_capabilities` | Availability, access mode, reservation, verification, freshness | One row cannot preserve multiple raw dependencies, rule version, or orthogonal usage claims safely | Preserve legacy rows; station derivation needs explainable composition. |
| `location_equipment` | Facility equipment fact, quantity, access, freshness | Equipment and access are coupled on one row; no station-specific space fact or fact-to-fact association | Reuse confirmed equipment facts; do not derive composite stations without additional facts. |
| `training_affiliations` | Official-club identity and freshness | Not review coverage | Keep as authoritative facility/discipline scope anchor. |
| `training_evidence` | Exactly one existing claim target, source provenance, accepted/rejected review, observed/reviewed timestamps, structured evidence/hash | Cannot target a review-ledger item, generic space/usage fact, or a many-dependency derived claim; no rule version | H3-11B must preserve evidence lineage and provide derivation traceability without replacing this investment. |
| Publication views/RPC | Confirmed + available + current + accepted support + eligible source + no accepted refutation; arrays are deterministic | No review coverage or derived station dependency graph; RPC false/empty can be misread if exposed carelessly | Retain positive-only fail-closed boundary. Do not expose ledger negatives. |
| Freshness/monitors | Claim-specific horizons and source/support/publication drift; observations never extend freshness | No composed freshness for derived station claims | Derived claims must take validity from every required dependency. |

Semantics that must not change include current `available/unavailable/unknown`, verification states, accepted evidence behavior, source authority behavior, access modes, stale-at fail-closed publication, affiliation identity, and all five legacy capability slugs. H3-11A defines requirements only; it does not select DB columns or write migration SQL.

## 4. Review Coverage Ledger contract

### 4.1 Canonical unit

The canonical atomic review unit is:

```text
facility
× discipline
× review dimension
× review aspect
× protocol version
× review cycle
```

`review dimension` is one of the eight station IDs, `running-environment`, or a separately governed facility/service dimension. `review aspect` is one of:

- `FACILITY_IDENTITY`
- `EQUIPMENT_FACT`
- `SPACE_FACT`
- `USAGE_ACCESS_FACT`
- `COACHING_PROGRAM_FACT`

A station review summary is composed from its aspect rows. A facility-level `reviewed=true` is prohibited. Source references form the reviewed source set for the atomic unit, and review time belongs to the review cycle. This permits SkiErg to be complete while Sled Push remains partial.

### 4.2 Orthogonal axes

The exact frozen axes are:

| Axis | State | Exact meaning |
| --- | --- | --- |
| `review_progress` | `UNREVIEWED` | The protocol has not started for this unit. |
|  | `PARTIAL` | Some protocol work or evidence assessment occurred, but the completion condition was not reached. |
|  | `COMPLETE` | The applicable protocol completion condition was executed for this unit. Requires `SOURCE_SUFFICIENT`. |
| `source_sufficiency` | `UNKNOWN` | Sufficiency has not been determined, including unreviewed or still-partial work. |
|  | `SUFFICIENT` | The agreed protocol for this unit was adequately executed with sufficiently authoritative, facility-bound sources. It is not a claim that the facility has nothing else. |
|  | `INSUFFICIENT` | Accessible sources were reviewed but cannot adequately answer this unit under the protocol. |
|  | `BLOCKED` | The review could not proceed because a required source/access path was unavailable, gated, technically inaccessible, or could not be bound to the facility. |
| `positive_outcome` | `NOT_ASSESSED` | No completed no-positive conclusion exists. This is also used when insufficient/blocked sources found no positive fact. |
|  | `POSITIVE_FOUND` | At least one publishable candidate positive fact was found. It does not by itself make the review complete or the claim published. |
|  | `NO_POSITIVE_FOUND` | The review is `COMPLETE + SUFFICIENT`, and no publishable positive evidence for this unit was found in the reviewed source set. It is not absence or unavailability. |

Normative combination rules:

1. `UNREVIEWED` requires `UNKNOWN + NOT_ASSESSED`.
2. `COMPLETE` requires `SUFFICIENT`.
3. `NO_POSITIVE_FOUND` requires `COMPLETE + SUFFICIENT`.
4. `INSUFFICIENT` and `BLOCKED` cannot count as complete.
5. `POSITIVE_FOUND` may coexist with `PARTIAL` when a fact was found before the wider protocol completed.
6. Source-insufficient with nothing found remains `NOT_ASSESSED`, not `NO_POSITIVE_FOUND`.
7. None of these internal combinations creates a public negative facility claim.

These combinations distinguish all required cases:

| Case | Canonical state |
| --- | --- |
| Not reviewed | `UNREVIEWED / UNKNOWN / NOT_ASSESSED` |
| Partially reviewed | `PARTIAL / UNKNOWN / NOT_ASSESSED` (or `POSITIVE_FOUND` if applicable) |
| Adequately reviewed, positive found | `COMPLETE / SUFFICIENT / POSITIVE_FOUND` |
| Adequately reviewed, no positive found | `COMPLETE / SUFFICIENT / NO_POSITIVE_FOUND` |
| Attempted, source set insufficient | `PARTIAL / INSUFFICIENT / NOT_ASSESSED` (or `POSITIVE_FOUND`) |
| Blocked by source/access | `PARTIAL / BLOCKED / NOT_ASSESSED` (or `POSITIVE_FOUND`) |

### 4.3 Minimum logical information

Future persistence must retain, logically if not as identically named columns:

- facility identity and discipline;
- review dimension and aspect;
- protocol version and review cycle;
- review progress, source sufficiency, and positive outcome;
- source classes attempted/reviewed and the exact source references;
- applicable positive fact/evidence references;
- `reviewed_at` plus reviewer/process authority;
- reason code for insufficient, blocked, or exceptional completion;
- concise notes only where structured state is insufficient.

Review rows must not masquerade as claim evidence, and claim rows must not imply review completeness.

## 5. Source-class authority

Existing `training_sources.source_kind` and `publisher_authority` remain unchanged. The following is a logical H3-11 review taxonomy; H3-11B decides representation.

| Source class | Admissible positive evidence | Limitations |
| --- | --- | --- |
| `GOVERNING_BODY_FINDER_DETAIL` | Facility identity, affiliation, explicit facility-bound program/station statement | Listing alone is not an exhaustive equipment/space/usage inventory. |
| `FACILITY_SPECIFIC_OFFICIAL_PAGE` | Identity, equipment, space, usage, coaching/program | Omission is not negative unless the page is demonstrably enumerative under the protocol. |
| `BRAND_OFFICIAL_FACILITY_PAGE` | Same categories when the facility is explicitly identified | A generic brand page cannot silently apply to every branch. |
| `OFFICIAL_EQUIPMENT_PAGE` | Facility-bound equipment and explicit space facts | Presence does not establish permission; generic brand inventory is insufficient. |
| `OFFICIAL_HYROX_TRAINING_PAGE` | Facility-bound equipment, station/space, usage, coaching/program | Generic HYROX explanation is not facility evidence. |
| `OFFICIAL_PROGRAM_SERVICE_PAGE` | Program/coaching/usage and explicit station association | Program use is not open use. |
| `OFFICIAL_BOOKING_MEMBER_SYSTEM` | Facility identity and positive bookable usage/program facts | Generic login/booking home without facility identity is insufficient; inaccessible gated content may be blocked. |
| `OFFICIAL_SCHEDULE_PAGE` | Dated program occurrence and coaching/service facts | Volatile; not durable equipment presence or open access by itself. |
| `OFFICIAL_SOCIAL_MEDIA` | Facility-bound, dated equipment/space/use/program facts | Identity, date, context, and currency must be unambiguous; not exhaustive. |
| `OFFICIAL_IMAGE_GALLERY` | Unambiguous equipment and space facts | Generic turf/floor or ambiguous objects cannot satisfy station dependencies. |

Search results and third-party pages may assist discovery but cannot close a positive claim or source sufficiency under this authority.

## 6. Source sufficiency contract

`SOURCE_SUFFICIENT` means only: “the agreed review protocol for this unit was adequately executed using sufficiently authoritative available sources.” It does not mean the facility definitely has nothing else.

There are two valid sufficient completion paths:

1. **Positive closure:** the facility identity is anchored and current authoritative evidence supplies every dependency required for the positive fact or typed derivation being reviewed. Only that unit closes; unrelated aspects remain untouched.
2. **No-positive closure:** the identity is anchored, all protocol-required applicable source classes were reviewed, the sources are accessible and facility-specific, and the source set is sufficiently enumerative for that aspect. Ordinary marketing-page silence never qualifies.

Common protocol rules:

- SkiErg/Row equipment no-positive closure requires a current, facility-specific, sufficiently enumerative equipment source set. A facility homepage with no mention is not enough.
- Composite physical stations require review of equipment plus space/training/program/gallery paths appropriate to that station. Inventory-only evidence cannot close the space aspect.
- Usage/access review requires facility-bound service/program/booking/schedule material. Equipment presence cannot close usage.
- A generic login or booking home without facility identity is `INSUFFICIENT`, not a facility-specific official source. If a required facility-bound path exists but cannot be accessed, use `BLOCKED`.
- A broken or degraded upstream source does not become a negative fact. BEYOND 浜松店 remains an intentional source review signal and informs this generic identity-binding rule.

## 7. Eight-station evidence matrix

The machine-readable counterpart is `data/hyrox/h3-11a-station-evidence-authority.json`.

| Station | Required positive equipment facts | Required positive space/environment facts | Physical derivation | Usage/access | Public-safe claim | Missing evidence |
| --- | --- | --- | --- | --- | --- | --- |
| SkiErg | `ski-erg` | None beyond the confirmed installed machine fact | Current SkiErg presence establishes equipment/minimum physical feasibility only | Station-scoped open/coached/program fact separately required | Presence: `SkiErgを確認`. Practice/open practice requires the respective usage fact. | No derivation; no negative. |
| Sled Push | `weighted-sled` | Suitable sled-push lane plus facility/component association | Sled **and** lane **and** compatible same-facility association | Separate station-scoped positive use | `スレッドを確認` for equipment; `スレッドプッシュ用設備・スペースを確認` only when composed | Generic turf or missing lane means no derivation. |
| Sled Pull | `weighted-sled`; rope/pull apparatus | Suitable sled-pull lane plus association | Sled **and** pull apparatus **and** lane **and** association | Separate station-scoped positive use | Full equipment/space wording only after all dependencies | Push evidence never supplies rope or pull feasibility automatically. |
| Burpee Broad Jump | None | Explicit facility station-space fact, or dedicated lane explicitly associated with BBJ | Explicit BBJ space, not a generic gym floor/lane | Separate station-scoped positive use | `バーピーブロードジャンプ用スペースを確認` | Generic floor/functional area yields no derivation. |
| Row | `row-erg` | None beyond the confirmed installed machine fact | Current RowErg presence establishes equipment/minimum physical feasibility only | Station-scoped open/coached/program fact separately required | Presence: `RowErgを確認`. Practice/open practice requires usage. | No derivation; no negative. |
| Farmers Carry | Suitable paired farmers-carry implements | Suitable carry lane/space plus association | Implements **and** carry space **and** association | Separate station-scoped positive use | Equipment-only or full setup wording according to dependencies | Kettlebells/dumbbells alone are insufficient unless explicitly identified for Farmers Carry/HYROX use. |
| Sandbag Lunges | Suitable sandbag | Suitable lunge/movement space plus association | Sandbag **and** lunge space **and** association | Separate station-scoped positive use | Equipment-only or full setup wording according to dependencies | Sandbag alone yields no station feasibility. |
| Wall Balls | Suitable wall ball; target/target-height evidence | Usable wall-ball area plus association | Ball **and** target **and** usable area **and** association | Separate station-scoped positive use | Component facts may be stated separately; full setup only after composition | Legacy target alone yields no full feasibility. |

For every composite station, dependencies must belong to the same facility, be physically compatible, and have evidence that safely associates them. Coincidental co-presence is not enough when station suitability is ambiguous.

### 7.1 SkiErg and Row claim levels

For SkiErg and Row, the machine is both the direct equipment fact and minimum physical feasibility fact. The wording levels remain distinct:

| Evidence | Allowed meaning |
| --- | --- |
| Machine presence only | `SkiErgを確認` / `RowErgを確認` |
| Current machine fact without usage | Equipment/minimum physical feasibility; do not say autonomous or generally available practice |
| Station-scoped coached/program use | Coached/program practice only, matching the exact modality |
| Station-scoped open use | `自主練で…利用を確認`, subject to recorded membership/reservation/conditions |

### 7.2 Legacy `sled-push-pull-space`

The legacy claim remains exactly a positive high-level space claim. It may support the lane/association dependency for Sled Push and/or Sled Pull only when its accepted evidence explicitly scopes the relevant movement(s), facility, and current space. It does not provide a weighted sled, pull rope/apparatus, usage permission, or automatic proof for both stations. The three current claims therefore require source re-review before component station conversion; they remain publishable under their existing legacy semantics meanwhile.

## 8. Usage/access and service modality

Usage is a non-exclusive typed positive-claim set, not one boolean or one mutually exclusive enum:

| Typed claim | Meaning |
| --- | --- |
| `OPEN_USE_CONFIRMED` | Self-directed use of the identified station or an explicitly inclusive facility equipment set is positively confirmed, with conditions retained. |
| `COACHED_USE_CONFIRMED` | Use is positively confirmed in coached instruction; no open-use implication. |
| `PROGRAM_ONLY_CONFIRMED` | Use is positively confirmed only in an identified program/class; no open or generic coached-access implication. |
| `NO_CURRENT_POSITIVE_USAGE_EVIDENCE` | Internal zero-set interpretation only. It is not a positive fact and not unavailability. |

Scope must be retained: station-specific, explicitly inclusive equipment set, or facility-level only. Existing `open-training`, `discipline-coaching`, and `competition-simulation` are facility/high-level claims unless their original evidence explicitly supplies narrower scope. Membership, booking, reservation, appointment, and time constraints are conditions on a positive usage claim, not separate proof of station availability.

Personal training, group training, program/class, and schedule remain service modalities. A schedule is a dated service occurrence and must not be folded into durable physical facts.

## 9. “Training Capability” definition

“Training Capability” is frozen as a **family of typed positive claims**, not a single boolean:

- raw physical equipment fact;
- raw space/environment fact;
- derived physical feasibility;
- open-use confirmation;
- coached-use confirmation;
- program-only confirmation;
- separate high-level service/program capabilities.

A caller must name the type it means. `station_capability=true` is prohibited because it hides whether the basis was equipment, space, usage, or program evidence. “Physically feasible” alone must not be labeled “available for practice” without usage authority.

## 10. Raw facts, provenance, and derivation

The following is an authority invariant:

```text
source evidence
  -> raw equipment fact
  -> raw space fact
  -> raw usage/access fact
  -> optional coaching/program fact
  -> typed derived station claim
```

Future collection must preserve raw current positive facts whenever practical. Derivation rules may improve later; GymMap must be able to recompute claims without broad recrawl.

Every derived station claim must trace:

1. derived claim → required raw fact IDs;
2. raw facts → accepted evidence IDs;
3. evidence → facility-bound source IDs and observations;
4. derivation rule ID and version;
5. review protocol version/cycle;
6. dependency freshness, source eligibility, refutation, and publication validity.

H3-11A does not select a rule-version schema. H3-11B must not implement opaque `station_capability=true`.

## 11. Freshness composition

Existing authority remains: physical equipment uses 180 days; open training, discipline coaching, and sled space use 90 days; competition simulation uses 30 days. Monitor observations do not extend confirmation.

Derived validity is the intersection of its required dependencies:

```text
physical station current
  iff every required physical fact is current and publishable

typed usage station current
  iff physical station is current
  and the selected usage fact is current and publishable
```

If sled and lane remain current while open-use becomes stale, physical feasibility may remain current and open-use fails closed. If a required physical fact becomes stale, only derivations depending on it fail closed. Missing/stale/refuted/source-invalid dependency means **NO DERIVATION**, never a negative.

## 12. Legacy equipment compatibility

All 109 current equipment claims remain reusable without semantic change as raw positive facts.

| Slug | Claims | New-model classification | Station conversion |
| --- | ---: | --- | --- |
| `ski-erg` | 6 | Direct station equipment fact | Direct equipment/minimum physical feasibility for SkiErg; usage separate. |
| `row-erg` | 19 | Direct station equipment fact | Direct equipment/minimum physical feasibility for Row; usage separate. |
| `weighted-sled` | 18 | Supporting physical fact | Insufficient alone for Push or Pull. |
| `wall-ball-target` | 5 | Supporting physical fact | Insufficient without ball and usable area. |
| `farmers-carry-implements` | 21 | Supporting physical fact | Insufficient without carry space/association. |
| `sandbag` | 19 | Supporting physical fact | Insufficient without suitable lunge space/association. |
| `functional-training-lane` | 3 | Supporting space fact | Requires station-specific suitability/association; generic reuse is prohibited. |
| `treadmill` | 17 | Auxiliary running fact | Separate `running-environment`; not a ninth station or full running capability. |
| `running-track` | 1 | Auxiliary running fact | Same boundary. |

Current `sandbag` is preserved as asserted; “suitable sandbag” for a station derivation may require re-review when the original evidence did not establish HYROX/lunge suitability.

## 13. Legacy capability compatibility

| Slug | Claims | Reuse | Prohibited conversion |
| --- | ---: | --- | --- |
| `open-training` | 5 | Current facility-level positive open-training fact | Do not apply to every station without explicit inclusive scope. |
| `discipline-coaching` | 20 | Current service-modality/coaching fact | Do not infer station equipment, station scope, or open use. |
| `competition-simulation` | 13 | Current legacy program/simulation fact | Do not infer all eight physical stations or their open use. |
| `sled-push-pull-space` | 3 | Current legacy high-level space fact; may support after evidence re-review | Do not infer sled, rope, both movements, or use permission automatically. |
| `outdoor-running-access` | 0 current | Auxiliary running fact if future current positive evidence exists | Not a workout station or full HYROX running capability. |

No legacy capability is retroactively redefined.

## 14. Existing 150-claim reuse assessment

Two views are required because “reusable” and “sufficient for station derivation” are different questions:

1. **Semantic preservation:** all 150 current claims remain directly reusable under their existing semantics: 109 raw equipment facts + 41 legacy high-level capabilities.
2. **Exclusive station-conversion disposition:** 25 direct equipment/minimum-feasibility facts (`ski-erg` 6 + `row-erg` 19); 66 supporting composite-station physical facts; 18 separate auxiliary-running facts; 3 legacy sled-space claims requiring evidence re-review; 38 separate legacy service/program claims. Total: 150.

The 25 current enriched facilities demonstrate that the model can retain equipment-rich, capability-rich, mixed, and no-current-positive cases without treating any omitted station as negative. UFC Gym 荻窪/用賀 and 東陽町 provide composite-rich compatibility examples; OTF locations provide program/coaching-rich but not open-use station scope; BEYOND 浜松店 provides the awkward/degraded-source case. No source was broadly recrawled and no claim was republished.

## 15. Running auxiliary dimension

`running-environment` records typed positive facts such as treadmill, indoor running track, and outdoor running access. These are alternatives or supplements, not interchangeable proof of a complete HYROX running practice capability. Future derivation must state the exact environment and usage scope. Running facts must not enter an eight-station count or score.

## 16. Review KPI contract

Future operations must report axes explicitly:

| KPI | Exact numerator | Exact denominator / caveat |
| --- | --- | --- |
| Facility source-inventory coverage | Facilities whose facility identity/source-inventory protocol is `COMPLETE + SUFFICIENT` | Current official facility cohort; not station coverage. |
| Physical station review coverage | Station dimensions whose required physical aspects are `COMPLETE + SUFFICIENT` | `current official facilities × 8`; report numerator and denominator, protocol version, and as-of time. |
| Usage review coverage | Station usage aspects `COMPLETE + SUFFICIENT` | Report separately from physical coverage; never impute from equipment. |
| Fully physically reviewed facilities | Facilities with all eight physical station dimensions complete/sufficient under the same current protocol version | Usage completeness is a separate KPI. |
| Partially physically reviewed facilities | Facilities with at least one attempted physical station dimension but not all eight complete/sufficient | Do not include untouched facilities. |
| Source-insufficient facilities | Facilities with at least one current `INSUFFICIENT` station/aspect | Also report affected unit count; do not call them reviewed. |
| Source-blocked facilities | Facilities with at least one current `BLOCKED` station/aspect | Report separately from insufficient. |
| Positive raw facts | Current publishable facts by fact type | Not a completeness numerator. |
| Positive derived stations | Current typed derivations by station and claim type | Not a station score or denominator of capability completeness. |
| Reviewed-no-positive units | `COMPLETE + SUFFICIENT + NO_POSITIVE_FOUND` units | Internal only; not facility absence. |

`64/82 reviewed` is invalid without the numerator definition. A valid example is “64/82 official facilities have at least one physical station dimension complete/sufficient under protocol vN as of T.” Prefer the full KPI set over one percentage.

## 17. Future filter readiness inputs

H3-11A activates no filter. H3-11F may assess:

- physical and usage review coverage by station;
- source-insufficient and source-blocked rates;
- current positive fact/derived-claim counts and geographic distribution;
- dependency freshness health and upcoming fail-closed risk;
- directness of evidence versus multi-fact derivation;
- station/source semantic ambiguity and re-review load;
- protocol-version consistency and provenance completeness.

No arbitrary threshold is frozen. Positive count is not completeness. Negative and “missing” filters remain prohibited.

## 18. H3-11C/D single-pass collection packet

One facility review pass must capture the following so later work does not rediscover missing sled lane/rope/use dependencies:

| Packet section | Capture once |
| --- | --- |
| Identity/source inventory | Facility/HGY IDs; canonical URL; exact facility binding; source class/authority; observed/reviewed times; accessibility; canonical/redirect; hash; reviewer/process. |
| Review ledger | Dimension + aspect; protocol version/cycle; progress; sufficiency; outcome; source relations; reason codes. |
| SkiErg | SkiErg fact; quantity if explicit; station-scoped open/coached/program use; conditions. |
| Sled Push | Weighted sled; push-suitable lane; sled↔lane association; open/coached/program use; conditions. |
| Sled Pull | Weighted sled; rope/pull apparatus; pull-suitable lane; component association; open/coached/program use; conditions. |
| Burpee Broad Jump | Explicit BBJ station/space or dedicated-lane association; open/coached/program use; conditions. |
| Row | RowErg fact; quantity if explicit; station-scoped open/coached/program use; conditions. |
| Farmers Carry | Specific suitable implements (or explicitly qualified alternatives); carry lane/space; association; use/conditions. |
| Sandbag Lunges | Suitable sandbag; lunge/movement space; association; use/conditions. |
| Wall Balls | Suitable ball; target and target-height evidence; usable area; association; use/conditions. |
| Running auxiliary | Treadmill, indoor track, outdoor access as separate typed facts; exact usage scope. |
| Service/schedule | Open training, coaching, PT/group, program/class, booking/reservation, and dated schedule as distinct records. |
| Evidence | Exact excerpt/structured observation, media object/context where applicable, source URL/identity, observed date, evidence hash, raw fact target. |

Absence boxes are review outcomes only after sufficient protocol completion; they are not negative claim candidates.

## 19. Required edge-case self-check

| Case | Deterministic outcome |
| --- | --- |
| A. SkiErg explicitly listed, usage absent | Raw `ski-erg` and minimum physical feasibility positive; public equipment wording allowed. Usage is `NO_CURRENT_POSITIVE_USAGE_EVIDENCE`; no autonomous/open practice claim and no negative. |
| B. Sled shown + turf shown, no use statement | If identity and sled↔suitable-lane association satisfy the contract, physical Sled Push may derive; otherwise only component facts. No usage claim. Generic turf alone never closes the lane. |
| C. Sled + rope + lane, coached HYROX program only | Sled Pull physical feasibility derives; `COACHED_USE_CONFIRMED` or `PROGRAM_ONLY_CONFIRMED` according to the exact source. Open use remains unknown. Sled Push derives only if push suitability is also evidenced. |
| D. Wall-ball target shown, ball absent | Preserve target raw fact. Full Wall Balls physical feasibility does not derive; no negative. |
| E. Sandbag listed, movement space absent | Preserve sandbag raw fact. Sandbag Lunges physical feasibility does not derive; no negative. |
| F. Generic large gym floor, no BBJ evidence | No BBJ space fact or derivation. Review may remain partial/insufficient; floor presence is not a negative or positive BBJ claim. |
| G. Official site thoroughly reviewed, no SkiErg mention | Only if the facility-specific source set is sufficiently enumerative and protocol-complete: `COMPLETE / SUFFICIENT / NO_POSITIVE_FOUND`. Public UI renders nothing; no absence claim. Otherwise `INSUFFICIENT`. |
| H. Only generic booking portal | `PARTIAL / INSUFFICIENT / NOT_ASSESSED`, or `BLOCKED` when a required facility-bound path exists but cannot be accessed. Never no-positive or negative. |
| I. One positive dependency stale | Every derivation requiring it fails closed; independent current raw facts/derivations remain. No negative is created. |
| J. Legacy `sled-push-pull-space` | Remains a current legacy high-level positive claim. It can support explicitly evidenced lane scope after re-review, but supplies neither sled nor rope nor usage and does not automatically prove both stations. |

## 20. H3-11B minimal handoff

H3-11B must produce the smallest persistence/derivation design that can:

1. persist the canonical review unit and three orthogonal axes without exposing ledger outcomes as public negatives;
2. relate a review unit to the exact reviewed source set and protocol/cycle;
3. reuse current discipline, source, equipment, capability, affiliation, evidence, and publication semantics;
4. represent missing station physical facts (especially space, wall ball, and pull apparatus) without collapsing them into a final boolean;
5. represent non-exclusive usage claims with explicit scope and conditions;
6. trace a typed derived claim through raw facts/evidence/sources and a rule version;
7. compose freshness and fail closed per typed derivation;
8. keep all legacy claims valid under their original meaning and identify only the rows that require re-review for station conversion;
9. validate that internal `NO_POSITIVE_FOUND`, `INSUFFICIENT`, and `BLOCKED` states cannot flow into public negative semantics.

H3-11B must decide whether new ledger persistence, review dimensions, raw space/usage fact structures, and derivation provenance structures are required. It must not treat this document as implementation SQL. H3-11C/D collection begins only after this authority is accepted.

## 21. Validation and phase boundary

Candidate validation must cover Markdown/JSON consistency, exactly eight unique station IDs, valid legacy station references, mapping completeness, edge cases A–J, JSON parse, relevant HYROX tests, and `git diff --check`.

This candidate changes no DB, schema, RPC, UI, runtime, monitor behavior, production deployment, evidence publication, capability backfill, or remaining-57 source collection. It stops for a human verdict:

```text
ACCEPT
or
NEEDS_CORRECTION
```
