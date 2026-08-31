# GymMap Public Updates & Data Transparency authority v1

Status: `ACCEPTED_AND_FROZEN`

Human Review: `ACCEPTED` on 2026-08-31 (Asia/Tokyo)

Accepted candidate commit: `951cf2a512bb96a56aa304fd3d6545c78a4dcd99`

Authority ID: `PUBLIC_UPDATES_AUTHORITY_V1`

Phase: `U3-U0`

Freeze date: 2026-08-31 (Asia/Tokyo)

Repository baseline: `origin/main` at `362c6dcf19a433b062a4cd31ec59660b43bf55a4`

Dedicated branch: `codex/ui-u3-u0-public-updates-contract`

Dedicated worktree: `/private/tmp/gymmap-ui-u3-u0-public-updates-contract`

Machine-readable companion: [`public-updates-contract-v1.json`](./public-updates-contract-v1.json)

Upstream authorities: [`product-ui-authority-v1.md`](./product-ui-authority-v1.md), [`product-ui-ownership-v1.json`](./product-ui-ownership-v1.json), [`hyrox-freshness-monitoring.md`](./hyrox-freshness-monitoring.md), and [`schedule-extraction-principles.md`](./schedule-extraction-principles.md)

This is a documentation-only authority freeze. It authorizes no `/updates` route, UI, Header, Home, Search, Detail, Favorites, HYROX, Map, database, migration, crawler, import, monitor, analytics, automation, deployment, or production-data change.

## 1. Verdict and authority boundary

U3-U0 freezes the boundary:

```text
internal event or source observation
  -> domain-owned semantic evidence
  -> public-update eligibility
  -> semantic grouping and deduplication
  -> user-facing wording
  -> publication authority
  -> future presentation
```

A public update reports a user-meaningful change in GymMap. It is not an internal changelog and is not proof that all GymMap data is current.

The following are frozen outcomes:

- `GYMMAP_UI_U3_U0_CONTRACT_COMPLETE`
- `PUBLIC_UPDATES_AUTHORITY_V1_FROZEN`
- `INTERNAL_EVENT_PUBLICATION_BOUNDARY_FROZEN`
- `PUBLIC_UPDATE_ELIGIBILITY_FROZEN`
- `PUBLIC_UPDATE_GROUPING_CONTRACT_FROZEN`
- `LESSON_UPDATE_SEMANTICS_PRESERVED`
- `HYROX_H3_SEMANTICS_PRESERVED`
- `FRESHNESS_UPDATE_DATE_SEPARATION_FROZEN`
- `PUBLICATION_AUTHORITY_FROZEN`
- `U3_U1_IMPLEMENTATION_SCOPE_DEFINED`
- `NO_RUNTIME_IMPLEMENTATION`
- `NO_DB_MIGRATION`
- `NO_PRODUCTION_MUTATION`
- `PUBLIC_UPDATES_HUMAN_REVIEW_DECISIONS_FROZEN`
- `STATIC_CURATED_MVP_AUTHORIZED`

This document does **not** declare `GYMMAP_UI_U3_U1_COMPLETE`.

## 2. Baseline and authority reconciliation

The required `git fetch origin` observed `origin/main` at `362c6dcf19a433b062a4cd31ec59660b43bf55a4`, exactly the expected U3-L production baseline. Main had not advanced beyond that commit, so no post-baseline main diff required reconciliation.

The primary checkout was not clean and was not modified, stashed, reset, or used for this phase. The dedicated worktree was created directly from `origin/main`.

Current phase state for this freeze:

| Workstream | State used by U3-U0 |
| --- | --- |
| U0A / U0B | complete authority predecessor |
| U1 | complete |
| U2-L | production complete |
| U3-L | production complete at the baseline above |
| M0 | frozen |
| M1 | separate authority path; not a U3-U1 dependency |
| H3-10A | complete |
| H3-10B | production complete; positive equipment presentation exists |
| H3-10C | blocked until M1 complete; not a U3-U1 blocker |

`product-ui-ownership-v1.json` freezes the earlier U0-time phase statuses (`U1` and `H3-10B` were then blocked) and must be read historically for those status fields. Its semantic ownership, positive-only rules, freshness ownership, and protected-path rules remain authoritative. The integrated runtime and supplied phase handoff supersede only the old progress labels. No semantic authority conflict was found.

H3 snapshot supplied to this phase, explicitly not a permanent product constant:

| Observation | Snapshot |
| --- | ---: |
| Official facilities | 82 |
| Facilities with positive equipment | 22 |
| Confirmed positive equipment chips | 109 |
| Negative assertions presented | 0 |
| Capability UI presented | 0 |
| Equipment filter presented | 0 |

## 3. Existing update-signal inventory

### 3.1 Lesson

| Signal | Repository source | Meaning and granularity | Trust / public state | Mutability and history | Enough for a public update? |
| --- | --- | --- | --- | --- | --- |
| Schedule confirmation | `class_schedules.extracted_at`, with UI fallback to `updated_at`; `src/lib/utils.ts` | When the represented schedule row was extracted or last mutated; row-level, aggregated by current UI | Domain-used and already user-facing as `確認`; not a site-wide update date | Mutable current row; import can update the same row; deleted rows are not retained | **PARTIAL.** Useful confirmation, but alone cannot prove a content change |
| Source snapshot identity | `class_schedules.source_snapshot_id`, `source_page_url` | Import input filename/source URL for a row | Internal provenance; filename is not user copy | Overwritten on matching-row import; no durable before/after chain | **NO** by itself |
| Schedule period | `valid_from`, `valid_to`; `current_class_schedules` | Effective schedule period when populated | Domain fact | Many tracked JEXER/Central imports set both to `null`; legacy/current rows coexist | **PARTIAL** and not reliable enough to invent a month |
| Facility confirmation | `gym_locations.last_verified_at` | Date facility facts were checked; facility-level | Already user-facing on facility detail | Mutable current value; no repository audit history | **PARTIAL** for curated facility updates |
| Facility/program timestamps | `gym_locations.updated_at`, `programs.updated_at` | Database mutation time | Internal unless paired with semantic evidence | Trigger-updated, current state only | **NO** by itself |
| Program mapping state | `programs` and normalization fields on `class_schedules` | Current mapping/normalization result | User-visible result, but interpretation is Lesson-owned | Current state; no durable mapping-change event | **PARTIAL** for reviewed corrections only |
| Source fetch/parse state | `source_pages.last_fetched_at`, `last_parsed_at`, statuses | Fetch/parser operation | Operational, not public | Mutable current state; no semantic diff | **NO** |
| Ingestion run/item schema | `ingestion_runs`, `ingestion_items` in `0001_init.sql` | Job execution, record counts, errors | Operational and available to the admin dataset | Tables exist, but tracked JEXER/Central import scripts do not write them; production contents were not assumed | **NO** |
| Extraction artifacts | tracked files below `output/jexer` and `output/central` | Fetch/extraction observations and debug evidence | Mixed quality, internal | Partial repository snapshots; not a complete immutable production event history | **PARTIAL** for human investigation, not generation |

The tracked JEXER and Central importers match on a row key and issue an update for every match without first proving that the user-visible payload changed. They also delete replaceable rows missing from the new import. Therefore `updated_at`, `extracted_at`, `updatedCount`, and `deletedStaleCount` cannot distinguish a real source/content change from a same-content refresh, nor reconstruct removed history. Lesson public-update automation is not evidence-safe today.

Existing Lesson transparency belongs primarily on the affected surfaces:

- Search results: row confirmation and aggregate stale warning.
- Facility detail: separate schedule confirmation and facility-information confirmation.
- Program and area pages: schedule confirmation.
- Favorites: schedule confirmation and official-source caution.

`/updates` must not replace those entity/domain disclosures.

### 3.2 HYROX

| Signal | Repository source | Meaning and granularity | Trust / public state | Mutability and history | Enough for a public update? |
| --- | --- | --- | --- | --- | --- |
| Official affiliation | `training_affiliations`, accepted `training_evidence`, `published_training_affiliations` | Current positive official affiliation; facility/discipline | H3-governed, strong, fail-closed public view | Current fact plus evidence rows; no public-update grouping record | **PARTIAL** for editorial publication |
| Positive equipment/capability | claim tables, accepted evidence, `published_location_equipment` and capability views | Current reviewed positive evidence; claim-level | H3-governed; positive only; stale/refuted/unpublishable claims fail closed | Current claims and evidence; not proof of a real-world change date | **PARTIAL** for editorial publication |
| Confirmation/freshness | `last_confirmed_at`, `stale_at`, verification and source state | Domain confirmation and publication horizon; claim/facility level | H3 authority | Current state; monitor observation does not extend these dates | **NO** as a public-update event by itself |
| Source observation | `training_sources.last_checked_at`, `last_changed_at`, `content_hash` | Source fetch/check/change state | Private service-role provenance | Mutable source record; not an immutable event ledger | **PARTIAL** evidence, never direct copy |
| Reviewed evidence | `training_evidence.observed_at`, `reviewed_at`, `assertion`, `content_hash` | Provenance for one claim | Strong after H3 review | Historical rows can exist, but no public grouping/publication identity | **PARTIAL** |
| Public discovery DTO | `src/lib/hyrox-discovery.ts` | Current official facility set, positive equipment, affiliation confirmation | Public, fail-closed, H3 semantics preserved | Current projection only; absent data is unknown | **NO** for historical change derivation |
| Affiliation monitor | `src/lib/hyrox-monitor*.ts`, weekly workflow artifacts | Read-only observation and review signal | Operational H3 signal | Artifact retention is 30 days; not a durable database | **NO** until H3 review resolves a fact |
| Enrichment monitor | `src/lib/hyrox-enrichment-monitor*.ts` and authority manifest | Support continuity, source drift, freshness, publication mismatch | H3 operational authority | Manifest retains reviewed graph; workflow artifacts are operational | **NO** as execution; **PARTIAL** after reviewed release |
| Release coherence artifact | `data/hyrox/h3-8-enrichment-monitor-release-authority.json` | Internal reviewed release hashes and aggregate claim/source counts | Strong internal release evidence | One release receipt, not a general event store | **PARTIAL** for a curated grouped update |
| Review artifacts | `h3-2a` and `h3-5a` JSON under `data/hyrox` | Reviewed equivalence and claim/source authority | Strong internal provenance | Purpose-specific, not public chronology | **PARTIAL** for editorial evidence |

HYROX public updates may state that GymMap's **confirmed information** was updated. They may not state that equipment became available, was added at a facility, or was unavailable before unless H3 supplies explicit real-world before/after and completeness authority.

Missing, stale, removed-from-view, unobserved, `false`, or empty HYROX values never become a negative public update.

### 3.3 System and internal operations

| Signal | Repository source | Meaning | Public eligibility |
| --- | --- | --- | --- |
| Git commit/merge history | repository history | Code or documentation changed | Not direct; may support a manually authored Product update |
| Internal phase/release labels | commit subjects and authority docs | Project execution state | Not public copy |
| Crawler/extractor/import output | scripts, console summaries, output artifacts | Internal processing | Not eligible without independently proven user-visible change |
| Monitor run/workflow result | `.github/workflows/hyrox-freshness-monitor.yml` | Operational health/review queue | Not eligible by execution or success alone |
| Build/deploy | hosting and CI history | Software delivery operation | Not eligible by itself |
| Static sitemap `lastmod` | generated sitemaps | Crawl hint; some values reflect build time or row mutation | Not a public update or completeness signal |
| Generic analytics | Microsoft Clarity, Cloudflare Web Analytics, Vercel Speed Insights in `src/app/layout.tsx` | Generic usage/performance telemetry | No repository-defined public-update event contract exists |

## 4. Frozen semantic distinctions

| Concept | Frozen meaning | Must not be represented as |
| --- | --- | --- |
| Public update date (`published_at`) | The date GymMap intentionally published a user-meaningful update | Source publication, extraction, import, confirmation, build, or deploy time unless intentionally equal and semantically true |
| Confirmation date | The date GymMap checked the source supporting a particular fact/schedule | A whole-site “last updated” date or public announcement date |
| Freshness | A domain-owned policy result that decides how current evidence may be presented | A Public Updates calculation such as “age < 30 days = fresh” |
| Internal process date | When crawler, import, monitor, build, deployment, or migration ran | User-visible change evidence |
| Effective/source period | Optional date/period the changed content concerns, such as a September schedule | The publication date |

Lesson owns Lesson confirmation and freshness semantics. H3 owns HYROX evidence, confirmation, and freshness semantics. Shared UI and Public Updates may render a domain-supplied result but may not calculate or reinterpret it.

`Public update != freshness badge != confirmation date` is a hard invariant.

A site-wide `最終更新: 今日` or equivalent is **PROHIBITED** without a separately frozen aggregate completeness model that defines included domains, coverage, missing data, and failure behavior.

## 5. Public-update eligibility

Frozen states:

- `ELIGIBLE`: user-visible meaning materially changed and evidence/scope support safe copy.
- `NOT_ELIGIBLE`: operational/no-op/non-user-visible activity, or a class prohibited from public publication.
- `REQUIRES_EDITORIAL_REVIEW`: potentially eligible, but domain interpretation, grouping, or wording requires approval.
- `INSUFFICIENT_EVIDENCE`: current evidence cannot distinguish a user-meaningful change from processing or cannot support the proposed certainty/scope.

Eligibility is necessary but never sufficient for publication. Publication mode is evaluated separately.

| Event class | Minimum evidence | Eligibility | Review | Safe wording constraint |
| --- | --- | --- | --- | --- |
| Reviewed Lesson schedule batch materially changed | Domain-reviewed semantic before/after, exact affected facilities, source/period when claimed | `ELIGIBLE` | Editorial required in v1 | “schedule information updated”; name brand/month/count only when proven |
| Lesson schedule re-import, same content | Equality/content fingerprint or no material diff | `NOT_ELIGIBLE` | None | Must not publish |
| Lesson extraction/import timestamp or row count only | Process timestamp/count | `INSUFFICIENT_EVIDENCE` | Cannot cure without semantic evidence | Must not publish |
| Lesson program mapping/display correction | Reviewed user-visible before/after and affected scope | `ELIGIBLE` | Lesson + editorial | Say corrected/updated; do not claim source schedule changed if only GymMap mapping changed |
| Facility facts updated | Reviewed public-field before/after | `REQUIRES_EDITORIAL_REVIEW` | Lesson/product owner | Identify facility scope; do not imply schedule freshness |
| Reviewed HYROX positive-evidence release | H3-approved positive claims, accepted evidence, exact facility set, coherent release/group | `ELIGIBLE` | H3 + editorial required | “confirmed equipment information updated”; facility units preferred; no real-world addition inference |
| HYROX monitor ran or reconfirmed unchanged source | Monitor result alone | `NOT_ELIGIBLE` | None | Must not publish |
| HYROX source drift/missing/stale/publication mismatch | Review signal only | `REQUIRES_EDITORIAL_REVIEW` | H3 resolution required first | Never infer absence, closure, unavailability, or removal |
| HYROX missing/empty/false value | Absence of positive claim | `NOT_ELIGIBLE` for negative assertion | Prohibited | No `設備なし`, `非対応`, `利用不可`, `クラスなし` |
| Internal bug fix changed public information | Verified user-visible before/after and corrected scope | `REQUIRES_EDITORIAL_REVIEW` | Domain + editorial | Describe corrected user impact, not implementation |
| Public product/feature improvement | Shipped user-visible behavior and manually approved copy | `ELIGIBLE` | Manual product publication | Describe user benefit; omit phase IDs, commits, migration/refactor terms |
| Refactor, deploy, migration, build, crawler/import/monitor success | Operational completion only | `NOT_ELIGIBLE` | None | Must not publish |
| Correction/retraction of an existing public update | Existing public record plus reviewed reason | `ELIGIBLE` | Editorial/manual | Preserve history and clearly mark correction/retraction |

Stop rules:

- Proposed copy requiring a negative inference: `PUBLIC_UPDATE_REQUIRES_NEGATIVE_INFERENCE — PROHIBITED`.
- Automation without semantic evidence: `PUBLIC_UPDATE_AUTOMATION_NOT_EVIDENCE_SAFE — DO NOT AUTOMATE`.
- Required schema change: document for a future phase and stop before implementation.
- Domain-authority ambiguity: stop for human/domain review.

## 6. Public taxonomy

The minimal machine taxonomy is frozen to:

- `LESSON_DATA`
- `HYROX_DATA`
- `PRODUCT_FEATURE`

Exact Japanese presentation labels remain a U3-U1 copy decision. Recommended mappings are `レッスン`, `HYROX`, and `機能改善`.

Crawler, import, migration, backend, monitor, deployment, database, and internal project phases are explicitly not public categories.

Operational incident/status communication is outside this v1 taxonomy and requires a separate status/incident authority rather than being forced into updates.

## 7. Grouping, counts, and idempotency

### 7.1 Grouping unit

One public update is one reviewed user-meaningful change group, never one database row, evidence claim, or monitor alert.

Required grouping dimensions:

1. public category/domain;
2. domain-approved semantic change type;
3. public-safe source/brand scope when relevant;
4. effective/source period when relevant;
5. affected entity set;
6. reviewed publication batch.

Lesson schedule updates normally group by brand/source + source period + publication batch + affected facilities. HYROX updates normally group by H3-reviewed release/batch + change type + affected facilities. Product updates are one manually defined user benefit, even if many commits shipped it.

Different domains, source periods, or semantic change types must not be merged merely because they occurred close together.

### 7.2 Window

V1 has **no clock-only automatic grouping window**. Membership is declared by a reviewed `publication_batch_id`. The normal editorial cadence may combine eligible evidence reviewed on one Asia/Tokyo calendar day, but time proximity alone never establishes shared meaning.

### 7.3 Counts

Public counts use deduplicated human-meaningful units such as facilities, stores, programs, or brands. Row counts, raw claim counts, inserted/updated counts, and job-source counts are internal by default.

HYROX counts should normally be unique facilities, not claims. A claim/item count is allowed only when H3 explicitly approves the noun and the copy makes clear that it counts GymMap-confirmed information, not a complete real-world inventory.

If exact scope cannot be proven, omit the count.

### 7.4 Stable identity and deduplication

Future processing must derive an internal stable identity from domain-approved semantics, not execution metadata:

```text
v1:{category}:{change_type}:{source_scope}:{source_period_or_none}:{semantic_fingerprint}
```

The `semantic_fingerprint` covers the normalized affected public entity set and domain-approved before/after meaning. It excludes job ID, retry number, processing timestamp, deployment, and public wording edits.

The same internal event, retry, same snapshot re-import, or regrouping rerun must resolve to the same dedupe key and must not create another public record. A later material change in the same source period receives a new semantic fingerprint and may become a new update. If it corrects prior meaning, it links through the correction policy.

## 8. Wording contract

Public copy answers: what changed, where/for whom, and—only when proven—how much or which period.

### 8.1 Lesson

Conditionally safe patterns:

- `{ブランド} {N}店舗の{対象期間}スケジュールを更新しました`
- `{施設名}のレッスン情報を更新しました`
- `{プログラム名}の表示・分類を修正しました`

Brand, facility count, program, and source period must come from reviewed evidence. A GymMap mapping fix must not be worded as if the official schedule itself changed.

### 8.2 HYROX

Conditionally safe patterns:

- `HYROX Training Club {N}施設の設備情報を更新しました`
- `{N}施設について、公式情報で確認できた設備情報を更新しました`

These mean GymMap's confirmed positive-evidence presentation changed. They do not mean facilities acquired equipment at that time.

### 8.3 Product

Safe pattern:

- `検索結果を見やすくしました`

User-facing copy omits U2-L/H3-10B/U3-U1, commit hashes, DB terms, internal ticket names, and deployment mechanics.

### 8.4 Forbidden or evidence-sensitive claims

Without explicit authority, do not publish:

- `最新です`, `すべて更新済み`, `全施設を確認済み`;
- `新たに設備が追加されました`, `利用可能になりました`;
- `設備なし`, `非対応`, `利用不可`, `クラスなし`;
- crawler/import/monitor/build/deploy/migration success;
- a month, brand, facility/program count, or affected scope not proved by the reviewed group;
- a process date as the real-world change/effective date.

## 9. Conceptual PublicUpdate model

No schema is authorized in U3-U0.

### 9.1 Public fields

| Field | Required | Meaning |
| --- | --- | --- |
| `id` | yes | Stable public-safe identifier |
| `category` | yes | One of the three public taxonomy values |
| `title` | yes | Concise user-facing change statement |
| `summary` | optional | Additional user impact/context; no internal provenance |
| `published_at` | yes | Intentional public publication timestamp |
| `status` | yes | `PUBLISHED`, `CORRECTED`, or `RETRACTED` |
| `source_period` | optional | Public-safe effective period/date label distinct from publication |
| `affected_entity_type` | optional with count | Human unit such as `facility` or `program` |
| `affected_entity_count` | optional with type | Deduplicated reviewed count |
| `destination` | optional | Public-safe link and understandable label |
| `correction_note` | required when material correction/retraction needs explanation | Concise public notice |

### 9.2 Internal provenance fields

| Field | Required | Meaning |
| --- | --- | --- |
| `domain_event_class` | yes | Eligibility-rule class |
| `publication_mode` | yes | Authority path used |
| `publication_batch_id` | yes | Reviewed semantic group |
| `dedupe_key` | yes | Stable idempotency identity |
| `semantic_fingerprint` | yes | Domain-approved meaning/entity fingerprint |
| `evidence_refs` | yes | Internal event/source/evidence references |
| `editorial_state` | yes | Draft/review/approved state before publication |
| `approved_by_role` / `approved_at` | required for reviewed/manual publication | Approval accountability; identity is not public |
| `supersedes_id` | optional | Correction/retraction relationship |

Public responses must not expose internal job IDs, raw database IDs, file paths, reviewer identity, credentials, private notes, error messages, commit hashes, raw evidence text, or internal event references.

## 10. Publication authority

| Mode | V1 authority |
| --- | --- |
| `AUTO_SAFE` | Defined but the authorized event-class allowlist is **empty**. No current Lesson or HYROX class is auto-safe. |
| `EDITORIAL_REVIEW` | Required for Lesson/HYROX data updates, material data corrections, and any data-driven grouping/copy. Domain owner approves semantics; Public Updates editor approves grouping/copy/publication. |
| `MANUAL` | Product/feature announcements and exceptional corrections/retractions. |
| `NOT_PUBLISHABLE` | No-op refreshes and ordinary crawler/import/monitor/build/deploy/migration/refactor activity. |

V1 is fail-closed. `ELIGIBLE` never implies auto-publication.

## 11. Data sufficiency

| Proposed update class | Data available now | Assessment |
| --- | --- | --- |
| Lesson schedule batch update | `PARTIAL` | Current confirmation/snapshot/source fields exist, but no durable semantic before/after, reliable period, or immutable batch history; blind updates make timestamps/counts unsafe |
| Lesson program mapping correction | `PARTIAL` | Current mapping fields exist; no mapping-change ledger; curated correction possible with separately reviewed evidence |
| Lesson facility information update | `PARTIAL` | Current `last_verified_at` and facts exist; no historical public-field diff |
| HYROX positive equipment update | `PARTIAL` | Strong current positive evidence and release receipts exist; no general public event/group history or real-world availability change authority |
| HYROX official affiliation update | `PARTIAL` | Strong positive current authority; no public chronology/grouping record |
| Product/feature update | `YES` for manual curation | Shipped runtime and git history can support human-authored benefit copy; commits must not be published directly |
| Correction/retraction | `NO` as stored history | No public-update entity exists yet; policy can be implemented in curated content |

`CAN_BUILD_U3-U1_WITHOUT_NEW_SCHEMA: YES_FOR_STATIC_CURATED_MVP / NO_FOR_SAFE_AUTOMATION`.

## 12. Route, IA, SEO, Home, and detail decision

- Future route: `/updates`.
- Collision: none exists at the baseline.
- SEO: indexable, self-canonical `/updates`, and included in the core sitemap only when the route exists and has approved public content. Sitemap `lastmod` should be the latest public `published_at`, not build time or internal process time.
- Header: do **not** add a third top-level domain item. Updates are supporting transparency, not a peer discovery domain.
- Preferred permanent discovery: footer or utility menu. A contextual transparency link may be added later with Product/UI review.
- Detail routes: no `/updates/[id]` in the MVP. Use a flat chronological list.
- Home: no U3-U1 Home change. A restrained latest 2–3 teaser is desirable only after at least three meaningful records exist and a separate Home-owner/Product/UI review approves it. It must not compete with Lesson Discovery.

## 13. Retention, ordering, correction, and retraction

- Order by `published_at` descending, while exposing semantic chronology through proper list/heading markup.
- MVP shows all curated entries in a flat list while volume is at most 50.
- Retain at least 12 months of public history. At more than 50 entries, add pagination or a simple archive in a later phase; do not fetch an unbounded operational log.
- Minor spelling/style edits that do not change meaning may update copy without a correction state.
- A material meaning/scope change must not silently rewrite history. Mark the original `CORRECTED` with a public correction note and link/supersede with the corrected record as needed.
- A false or unsafe update becomes `RETRACTED`; preserve a dated tombstone and concise reason rather than deleting it.
- Retraction is not a mechanism for inferring negative HYROX facts.

## 14. Transparency-surface ownership

Entity/domain surfaces remain the primary place for fact-specific confirmation and freshness. `/updates` is a secondary chronology of meaningful GymMap publications.

| Concern | Primary owner/surface |
| --- | --- |
| Lesson schedule confirmation and stale policy | Lesson domain, on Search/Detail/Program/Area/Favorites as applicable |
| Facility-fact confirmation | Facility/Lesson-owned entity presentation |
| HYROX evidence, positive/unknown semantics, freshness, omission and disclosure | H3/HYROX surfaces |
| Public eligibility, grouping, publication status, public taxonomy and editorial flow | Public Updates domain |
| Generic card/list surface, typography, semantic date rendering and AppShell | Shared UI; visual only |

Public Updates must consume domain-approved facts and may not reinterpret them.

## 15. Dependencies and next gate

```text
U3-U1 Public Updates UI / curated MVP
  depends_on: U3-U0
  consumes: Lesson authority for Lesson copy/evidence
  consumes: H3 authority for HYROX copy/evidence
  does_not_depend_on: M1, H3-10C
```

H3-10B production completion supplies current positive-equipment presentation but does not make automated public updates safe. M1 remains separate. H3-10C remains blocked on M1 but does not block U3-U1.

Next gate: `U3-U1 — READY_FOR_SEPARATE_AUTHORIZATION` for a static/curated flat-list MVP only. Automation remains `BLOCKED_BY_INSUFFICIENT_SEMANTIC_HISTORY`.

## 16. MVP recommendation

The accepted MVP direction is **STATIC / CURATED**.

U3-U1 should use a bounded code/content record source, manually authored and reviewed, with no DB table and no generation from operational logs. Lesson and HYROX data announcements require their domain owner's evidence approval; Product announcements are manual. This path can honor dates, grouping, corrections, privacy, accessibility, and idempotent IDs without pretending the current mutable datasets are an event ledger.

Do not choose HYBRID/AUTOMATED until immutable semantic change evidence and publication workflow exist.

## 17. Future schema/pipeline requirements (not authorized now)

New DB/schema is **not required** for the curated U3-U1 MVP.

Evidence-safe automation would require, in a separately authorized future phase:

- immutable domain change events or reviewed before/after snapshots;
- content-level semantic diff that ignores same-content imports;
- exact affected public entity set and human-unit count;
- reliable source/effective period;
- stable publication batch and semantic fingerprint/dedupe key;
- domain eligibility decision and approval state;
- public record status and correction/retraction links;
- durable provenance retention that is not a transient workflow artifact;
- protection against publication from monitor/crawler/deploy success alone.

The current `ingestion_runs`/`ingestion_items` schema is operational and does not satisfy these requirements as-is.

## 18. Accessibility, presentation, analytics, and performance requirements

Future U3-U1 must:

- use semantic headings and a chronological list/time representation;
- render Japanese-readable dates while preserving machine-readable date values;
- make destination links understandable out of context;
- avoid color-only category/status meaning;
- keep category abbreviations screen-reader safe;
- support narrow mobile layouts without an operational table;
- distinguish correction/retraction in text, not color alone;
- use bounded/precomputed curated records;
- never fetch full Lesson schedules, all HYROX claims, or calculate history from full datasets per request.

Current analytics provide generic telemetry but no repository-defined Product Updates events. U3-U1 may later propose, but U3-U0 does not add:

- `updates_page_view`;
- `update_destination_click`;
- `home_updates_teaser_click` only if a Home teaser is separately approved.

Event names/properties, consent/privacy, and analytics owner approval remain `ANALYTICS_REQUIREMENT_FOR_U3U1`, not an implementation in this phase.

## 19. Accepted Human Review decisions

The following authority decisions are accepted and frozen:

1. `/updates` should exist: **YES**, as a secondary transparency route.
2. Placement: **footer/utility menu**, not top-level Header; Home teaser deferred.
3. Public categories: **Lesson Data, HYROX Data, Product/Feature** only.
4. Explicitly not public: ordinary crawler/import/monitor/build/deploy/migration/refactor activity, internal IDs/phases, no-op refreshes, and unsupported negative/inventory claims.
5. Lesson updates auto-generated now: **NO**.
6. HYROX updates auto-generated now: **NO**.
7. Manual editorial approval: **YES** for all v1 data updates; Product updates manual.
8. New schema/history before automation: **YES**; **NO** for the static curated MVP.
9. Home recent updates: **DEFER** until at least three meaningful entries and separate Home review.
10. History: **at least 12 months; flat up to 50, then pagination/archive**.

Changing an accepted decision requires a new explicit Product/UI authorization and the relevant domain review before implementation.

## 20. Mutation audit

| Surface | Changed in U3-U0 |
| --- | --- |
| Authority documentation | yes |
| Machine-readable documentation contract | yes |
| Runtime | no |
| UI | no |
| `/updates` route | no |
| Header/Home/Search/Detail/Favorites/HYROX/Map | no |
| Database/schema | no |
| Migration | no |
| Crawler/import/monitor | no |
| Analytics | no |
| Automation | no |
| Production/deployment/data | no |

## 21. Freeze statement

U3-U0 freezes the public boundary at user-meaningful, evidence-supported, domain-approved change groups. Confirmation dates remain fact-specific, freshness remains domain-owned, process dates remain internal, and no absence becomes a HYROX negative assertion.

U3-U1 may implement only the human-approved static/curated scope described here. It may not start automatically from this contract phase.
