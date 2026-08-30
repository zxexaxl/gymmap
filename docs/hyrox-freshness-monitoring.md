# HYROX freshness monitoring

The monitor compares the currently published Official HYROX Training Club baseline with a new, read-only observation. It never updates production data.

## Run manually

Provide the existing public Supabase environment variables, then run:

```sh
npm run hyrox:monitor
```

Outputs are written to `.artifacts/hyrox-monitoring/`:

- `hyrox-freshness-monitor-latest.json` — full baseline, observation, diff, and freshness result
- `hyrox-freshness-monitor-latest.md` — concise human summary
- `hyrox-freshness-review-queue.json` — records requiring human review only
- `hyrox-freshness-reconfirmation-candidate.json` — current eligibility only; it must never be applied later without a new live observation and review

Use `--output-dir=...` or `--checked-at=<ISO timestamp>` when a controlled output location or deterministic observation time is needed. Fixture runs use `--fixture=<path>` and do not contact production or external sources.

## Status meaning

- `NO_CHANGE`: the governing-body identity and material fields did not change.
- `REVIEW_REQUIRED_*`: a URL, name, address, or coordinate change needs authority review.
- `FINDER_LISTING_MISSING`: the individual HGY record was not found while Finder health remained good. This is not a closure finding.
- `FACILITY_SOURCE_UNAVAILABLE`: the facility URL could not currently be verified. A 403, 429, timeout, or transient failure is not a closure finding.
- `POSSIBLE_RELOCATION` / `POSSIBLE_CLOSURE`: multiple signals exist; no automatic update is allowed.
- `MONITOR_ERROR`: identity, payload, or technical integrity failed.
- `MONITOR_SOURCE_OUTAGE`: a run-wide Finder failure; individual missing alerts are suppressed.

Freshness is `FRESH` above 30 days, `DUE_SOON` at 30 days or less, `URGENT` at 14 days or less, and `STALE` at or after `stale_at`.

Coordinate changes become material at more than 1,000 metres. This deliberately tolerates neighbourhood-level geocoder centroid drift observed in the production cohort; address and coordinate changes together still create a relocation review signal.

## Review and escalation

1. Open the workflow artifact or local review queue.
2. Confirm material changes against governing-body and facility first-party sources.
3. Treat redirects, Finder removal, relocation, and closure only as review signals.
4. Reconfirm unchanged claims in a separate reviewed production-update phase. A monitor observation does not extend `last_confirmed_at` or `stale_at`.
5. Escalate `HIGH` promptly and `CRITICAL` immediately. Retry transient source failures on a later run before inferring a business-state change.

The weekly GitHub workflow uses only the public Supabase URL/key, performs GET/read-only queries, uploads a 30-day report artifact, and writes the Markdown summary to the Actions run summary. It creates no issues and performs no database mutations.

Reviewed representation differences are stored as exact, per-HGY entries in `data/hyrox/h3-2a-monitor-authority-equivalences.json`. An entry applies only when its HGY ID, dimension, production baseline value, and observed value all match. A new name, URL, redirect target, or production baseline therefore alerts again; there are no wildcard aliases.

Configure repository Actions variables named `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` before the first scheduled or manual run. Do not add a service-role key. The schedule runs Tuesdays at 02:17 UTC (11:17 JST); `workflow_dispatch` remains available for an operator-triggered run.

Because the fail-closed publication views stop returning a claim after it becomes stale, operators must act on `DUE_SOON` and `URGENT` before the deadline. The 30-day workflow artifacts provide operational history, but are not a durable monitoring database.

## Equipment and capability enrichment

The same weekly workflow also runs the claim-level enrichment monitor:

```sh
npm run hyrox:monitor:enrichment
```

Its outputs are written to `.artifacts/hyrox-enrichment-monitoring/` and use the same full-report, Markdown-summary, and review-queue pattern. The monitor reads only public publication views and the committed reviewed authority manifest at `data/hyrox/h3-5a-enrichment-monitor-authority.json`; it never needs a service-role key.

The manifest remembers the exact H3-5 reviewed graph—36 equipment claims, 16 capability claims, ten first-party sources, and nine locations. This historical authority is intentional: a stale claim can disappear from a fail-closed public view, but the monitor must still classify it as `STALE_RECONFIRMATION_REQUIRED` rather than forget it. The public views are a current-publication cross-check, not the sole inventory.

Each unique source is fetched once and reused across all supported claims. Source availability, redirect/canonical changes, support continuity, publication presence, and freshness are separate dimensions. Missing support, a 404, or staleness is a review signal and never becomes a negative equipment or capability fact.

The frozen horizons are:

- physical equipment: 180 days
- open training, discipline coaching, and sled space: 90 days
- competition simulation: 30 days

`DUE_SOON` enters the review queue but does not fail the workflow. `URGENT`, `STALE`, material source/support drift, publication mismatch, and run-level failure require attention under the workflow policy. A healthy source observation still does not update `last_confirmed_at` or `stale_at`.

Reviewed reconfirmation belongs in H3-5B. Operators should trigger it when any claim becomes `URGENT`, a source/support review signal appears, or sufficiently before the stale deadline. Future H3-6 imports must append their reviewed natural claim identities, source authority, timestamps, and compact support matchers to the manifest in the same import release; production insertion without monitoring enrollment is incomplete.
