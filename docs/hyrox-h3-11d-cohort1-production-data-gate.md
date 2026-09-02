# HYROX H3-11D Cohort 1 Production Data Gate

Status: **CANDIDATE — HUMAN DATA REVIEW REQUIRED**

This packet converts the accepted H3-11D Cohort 1 evidence into one deterministic release identity. It prepares, but does not execute, Production database writes or either monitor activation.

## Frozen inputs

- Source authority: `2636c838b57de55617f611064a90630eaf3d1408`
- Cohort identity: `1c53bd0698c0d1998f25e227409ee35c788c274994a22711e1dec1a323ce8fda`
- Review packet: `e86585713574c03663b27cfdbb2b9c3a1ab0b5940a491a9d5b78bf73a6983172`
- Ledger candidate: `fce0ff185ddc571c59d12c96cab80b56b574544b4de8b7a4c717d1c8c9ecd536`
- Positive candidate: `fe820952c155b43ff3249ec5c686f32c92484816293c5296494abd39916a3804`
- Persistence gaps: `9cc5248c71cd941af327d79a96b91ef33cbe4041dcd58df1f3d4df61f0f1d89c`
- R2 policy/fact/restriction/cohort identities: `42ed943a807d505b3fdc4deadef0bc94014d0007287ca752d366cc83e2c31295`, `8beedc6399f50209660b69e97911a735428a2ac76fc93525e6d1d0bd88021c9f`, `39b6c945b5539571764dc5cc923929ed3d872b97e6780e77f5a51d8cd793a720`, `7bf0c89e92247a3571cda4d66616616473903413bcc0cd36641c382beabecd1e`
- R3 live manifest/packet identities: `e29b61edbe1f3dea1912ebfdd147d4dd866304230ed069fd4799a4f1317b1e84`, `ccac7a73af03d30714c044b38f4ca9f5d1fe9fbbae57894f84b1f0821aeccf03`

## Currentness and release delta

The bounded source recheck inspected the accepted 24 sources with concurrency 4 and at most 2 attempts. All 24 source surfaces remained accessible and facility-bound; none was automatically reconfirmed. The accepted source set resolves to 8 existing Finder sources plus 16 new source candidates and no holds.

The exact candidate contains 8 review cycles, 296 review units, 476 unit/source relations, and no invalidations or `NO_POSITIVE_FOUND` outcomes. It contains 19 equipment claims, 18 capability claims, and 38 evidence rows for 37 deduplicated claims. The two HTC CHIKUSA sled-space observations remain distinct evidence for one canonical claim.

The accepted 19 raw observations normalize to 20 typed raw-fact rows because the CrossFit Ashiya program/rental observation has two accepted non-exclusive fact types. Those rows have 55 exact dimension links. Four accepted restriction observations normalize to 6 typed restriction rows because two observations each carry two explicit restriction types. This normalization does not create station derivations.

Every raw/restriction row is `CURRENT_IMPORT_ELIGIBLE` under the exact H3-11D-R2 policy and applicable earlier explicit boundary. Current import eligibility is internal persistence eligibility, not public or derived capability authority. `general-training-floor` remains a weak raw observation only.

## Monitor onboarding

The canonical monitor delta contains exactly the 37 new equipment/capability claims and projects the canonical monitored inventory from 150 to 187. The separate raw monitor delta retains the accepted observation-level R3 model: 19 raw observations plus 4 restriction observations, 23 entries across 9 source URLs. Each monitor observation maps explicitly to one or more typed persistence keys. Neither monitor delta is activated by this candidate.

## Coherence identities

- Source delta: `16f11d0c16d8518bcfb0c9c8b0369eda6bea3c9eaaa0c0bc7427a24d7049d030`
- Ledger import: `59c590b8ba9ed0f51c5d818b1a13e5464cee8fcf168e48c6f3c3ed00e4fcfa04`
- Canonical positive import: `cab9ec7f2a45252829e1f5f39de5b2b14023c920eb94772d226bf28947e5898e`
- Raw-fact import: `ebe96279ffc97532c1229c6b51b64f45e1aa6b56133404a19492d5a5815ca63e`
- Restriction import: `04de328b5acca2f1f3cd991bab125a0037d9d0ab5e802c78c9be2f211c95958b`
- Canonical monitor delta: `d29e8cf3f4cc7661e6c17642636122804bce28a9b9fde9f820540045ee858ea1`
- Raw monitor delta: `2e0bc0fa905c2d9f009ba6ae98fc5aab74ef12bd3bfa1a0ebec46ddb274a2057`
- Database import packet: `c1c89a9716604fe8fd2d0b5ba3d2f11ee81b3723fdfb96652550c623029f6046`
- Raw monitor/release coherence: `6dbfc3d8bbfbf7aff78a59f8db1c64c00d07ef9da909ce49550b497e8b5d3a78`
- Overall Cohort 1 release coherence: `12c5669921f0ee745a19f01c404d3df2974fddbbdaa712885634e45683f22510`
- Consolidated manifest identity: `6d372ca7811e3217531244d7215cdc23c05d19db2e9c39531b8d63aae98d4a6c`

## Apply and failure semantics

Database-side writes are ordered by their foreign keys and wrapped in one transaction: new sources, review cycles, review units, unit/source relations, canonical claims, canonical evidence, raw facts, raw dimensions, then restrictions. Deterministic IDs and natural keys are checked before insertion. An exact second application is a no-op; an ID or natural-key mismatch raises and rolls back. The packet does not use broad `ON CONFLICT DO NOTHING`.

Monitor activation is a later repository change. It must consume the exact database and monitor component identities above after successful database import; mixing packet versions is prohibited.

## Projected Production state

| Concept | Before | After |
|---|---:|---:|
| Official facilities | 82 | 82 |
| Training sources | 108 | 124 |
| Review cycles | 0 | 8 |
| Review units | 0 | 296 |
| Review unit sources | 0 | 476 |
| Raw facts | 0 | 20 |
| Raw fact dimensions | 0 | 55 |
| Restrictions | 0 | 6 |
| Equipment claims | 109 | 128 |
| Capability claims | 41 | 59 |
| Training evidence | 314 | 352 |
| Canonical monitored claims | 150 | 187 |
| Raw/restriction monitored observations | 0 | 23 |
| Equipment-positive facilities | 22 | 27 |
| Capability-positive facilities | 21 | 29 |
| Any-enriched facilities | 25 | 33 |

## Safety boundary

The packet publishes only accepted canonical positive equipment/capability claims when eventually applied. Review coverage, raw facts, and restrictions remain internal. It adds no station derivation, negative public fact, score, filter, RPC, DTO, UI code, or runtime query. Production remains unchanged until a separate exact Human Production Decision after fresh backup and restored-Production rehearsal.
