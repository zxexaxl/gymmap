# HYROX targeted equipment release contract

H3-7 freezes one release authority containing both the reviewed database candidate and its enrichment-monitor onboarding delta. It is a rehearsal package only and performs no production write.

## H3-8 order

1. Verify the exact H3-7 release, database-candidate, monitor-delta, and projected-manifest hashes.
2. Recheck current Git, schema/migration, production collision, source, and freshness authority.
3. Create and validate a fresh production backup.
4. Prepare the exact monitor-manifest patch, but do not activate it before the database import.
5. Import the database graph in one advisory-locked transaction and verify publication/search.
6. Integrate the exact matching monitor onboarding delta into main.
7. Run the enrichment monitor on exact main and dispatch the scheduled workflow manually.
8. Confirm all 150 historical claim identities are monitored.

If the database import succeeds but monitor integration fails, do not delete valid claims. Treat monitor onboarding as an urgent operational follow-up. If the monitor manifest were activated before the database import, it would emit false publication mismatches; therefore that order is prohibited.

Before H3-8, any new 30-day competition-simulation claim that is URGENT or STALE requires fresh reviewed authority. DUE_SOON is allowed only when explicitly acknowledged and monitored. No import or monitor run automatically extends `last_confirmed_at` or `stale_at`.

The H3-7 package does not change the H3-1 UI. Missing positive claims remain unknown, not negative facts.
