# HYROX targeted equipment evidence scale-out

H3-6 is a read-only, bounded evidence review. It freezes a maximum of 25 high-quality facilities before discovery and never interprets missing evidence as unavailable equipment or capability.

## Run

1. Produce a read-only production baseline outside the repository.
2. Freeze the cohort with `npm run hyrox:targeted:cohort -- --baseline=<snapshot>`.
3. Collect only the frozen first-party pages with `npm run hyrox:targeted:collect -- --output-dir=<runtime-directory>`.
4. Build reviewed artifacts with `npm run hyrox:targeted:review -- --discovery=<runtime-discovery.json>`.

The collector uses at most six concurrent requests, limited retries, and a maximum of three reviewed pages per facility. Runtime HTML and discovery snapshots stay outside Git. The committed artifacts contain only short evidence excerpts and structured decisions.

## Review contract

- Q1/Q2 explicit facility evidence may become `CONFIRMED_CANDIDATE` after human review.
- Q3 is review-required by default; Q4/Q5 cannot be confirmed automatically.
- Affiliation, equipment keywords, and equipment presence do not imply capabilities.
- `NO_EVIDENCE_FOUND`, blocked sources, and stale information never create negative facts.
- Running track and outdoor running access remain deferred.

H3-6 performs no production database write, freshness reconfirmation, monitor-manifest change, UI change, deployment, or main merge. Confirmed claims proceed through a separate H3-7 import-candidate phase.
