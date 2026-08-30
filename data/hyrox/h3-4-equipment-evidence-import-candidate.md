# H3-4 HYROX equipment evidence import candidate

Candidate hash: `f47f7edcb4fb63120d35e44ed2bda50c8c61e779724d4f12453a48037d280ae8`

Production write: **NO**

## Authority

- H3-3 commit: `7a90c9db0bc43039d4c02bdfe377fab5bfb34e12`
- H3-3 sample: `d58b83b254e32a564443bbae46d832e1d5a74ae56f6e24dcf3a2ac854733e9ce`
- Source observation: 2026-08-30T09:20:04Z
- GO_TARGETED; exact H3-3 confirmed claims only.

## Counts

| graph | count |
|---|---:|
| training_sources | 10 |
| location_equipment | 36 |
| location_training_capabilities | 16 |
| training_evidence | 52 |
| excluded REVIEW_REQUIRED | 14 |
| negative claims | 0 |

## Equipment

| type | count |
|---|---:|
| farmers-carry-implements | 6 |
| functional-training-lane | 2 |
| row-erg | 6 |
| running-track | 1 |
| sandbag | 6 |
| ski-erg | 4 |
| treadmill | 3 |
| wall-ball-target | 2 |
| weighted-sled | 6 |

## Capabilities

| type | count |
|---|---:|
| competition-simulation | 2 |
| discipline-coaching | 8 |
| open-training | 4 |
| sled-push-pull-space | 2 |

## Source quality

- Q1 source rows: 6
- Q2 source rows: 4
- Q3/Q4/Q5 source rows: 0
- Exact source revalidation: 10/10; drift 0

## Location review

| HGY | location | equipment | capabilities | quality | observed | evidence |
|---|---|---|---|---|---|---:|
| HGY_n4xTGpLhdouLv9TzuLk2J1OoV | オレンジセオリーフィットネス溝の口 | farmers-carry-implements, row-erg, sandbag, treadmill, weighted-sled | competition-simulation, discipline-coaching | Q2 | 2026-08-30T09:20:04Z | 7 |
| HGY_u1B3yXynkPyPxOuTQPXyjceFr | Freeletics Goals | farmers-carry-implements, row-erg, sandbag, ski-erg, weighted-sled | discipline-coaching | Q1 | 2026-08-30T09:20:04Z | 6 |
| HGY_c816ru6QeTv14At3O51pjK8au | Takamatsu CrossFit | — | discipline-coaching | Q1 | 2026-08-30T09:20:04Z | 1 |
| HGY_f2kvOaab0cCRi8pkmmU0AHBis | 浜松町東京 | farmers-carry-implements, row-erg, sandbag, ski-erg, treadmill, weighted-sled | discipline-coaching | Q2 | 2026-08-30T09:20:04Z | 7 |
| HGY_7FDA3W6p88v6evTHGBhfHFrvP | LUAANA CLUB 蒲田池上店 | — | discipline-coaching, open-training | Q1 | 2026-08-30T09:20:04Z | 2 |
| HGY_1kQTLdyeblDc6Nbt13qiH5oib | RESTORE BASE | — | discipline-coaching, open-training | Q1, Q1 | 2026-08-30T09:20:04Z | 2 |
| HGY_0PfI4t6UgVADRV7RfgXX48PR8 | Yoshiyuki Hirano 善之 平野 | farmers-carry-implements, row-erg, sandbag, ski-erg, wall-ball-target, weighted-sled | competition-simulation, discipline-coaching | Q2 | 2026-08-30T09:20:04Z | 8 |
| HGY_HfEQpiP2Ha2HB3HYzCFuZJA7R | 東陽町スーパーセンター | farmers-carry-implements, functional-training-lane, row-erg, running-track, sandbag, treadmill, weighted-sled | open-training, sled-push-pull-space | Q2 | 2026-08-30T09:20:04Z | 9 |
| HGY_e0rqkrg7L4ataPZD4gGoOL0W9 | UFC Gym 用賀 | farmers-carry-implements, functional-training-lane, row-erg, sandbag, ski-erg, wall-ball-target, weighted-sled | discipline-coaching, open-training, sled-push-pull-space | Q1 | 2026-08-30T09:20:04Z | 10 |

## Freshness

- Physical equipment: 180 days
- open-training / discipline-coaching / sled-push-pull-space: 90 days
- competition-simulation: 30 days; both records describe repeatable mock-race or race-equivalent training, not a historical one-off event.
- Generation time never extends freshness.

## Rehearsal contract

- One local-only transaction and transaction-scoped advisory lock.
- Dependency order: sources → equipment/capabilities → evidence.
- First pass: +10/+36/+16/+52.
- Second pass: zero delta and no freshness change.
- Semantic collisions fail closed.
- Final rollback restores 82 sources, 0 equipment, 0 capabilities, and 164 evidence rows.
- Search/publication total remains 82 Official HYROX locations.
