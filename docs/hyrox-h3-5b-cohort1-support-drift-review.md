# HYROX H3-5B Cohort 1 support-drift review

Status: **correction candidate / Human Review required**.

The four post-release signals were reviewed against the accepted H3-11D evidence before current source retrieval. All three facility-bound first-party pages returned HTTP 200, retained the same facility identity, and were byte-identical to the content reviewed on 2026-09-02. Their current body SHA-256 values equal the accepted source hashes.

## Decision

All four signals are `MONITOR_FALSE_POSITIVE` with high confidence. The accepted positive semantics remain explicitly present. No claim, raw fact, evidence row, review history, source binding, or freshness timestamp should change.

| Facility | Target | Exact continuing support | Matcher gap |
|---|---|---|---|
| CrossFit Ashiya | `sled-push-pull-space` | HYROX-equivalent turf and Sled Push/Pull practice remain stated | Japanese `ターフ` omitted |
| FITONE SHIBUYA | `multi-movement-training-space` | Main floor still states `走る・押す・引く・担ぐ` | English-only push/pull/carry patterns |
| HTC CHIKUSA | `burpee-broad-jump-space` | `Burpees Broad Jump` remains assigned to 1F | Singular/plural mismatch |
| HTC CHIKUSA | `running-movement-space` | Running remains stated as completed `館内`, with `走る` on 2F | Japanese `走り/走る` and `館内` omitted |

The correction adds only those exact source wordings to the four target matchers. It does not add global normalization, broaden claim meaning, derive a station state, or extend freshness. Current time authority remains `FRESH` through 2026-12-01T10:00:00Z under the existing 90-day policies.

## Boundaries

- Production data mutation: none.
- Historical evidence deletion/update: none.
- `reviewed_at` or expiry extension: none.
- Negative inference or publication withdrawal: none.
- BEYOND 浜松店 and INSPA location-monitor signals: unchanged and outside this target set.

The exact target identities and source checks are frozen in `data/hyrox/h3-5b-cohort1-support-review.json` with target-set SHA-256 `f768cef6903a6402398ec738cfe4773363e3c44ac8169ae3d55346f8071aafa5`.
