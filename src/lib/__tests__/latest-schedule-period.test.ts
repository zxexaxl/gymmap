import assert from "node:assert/strict";
import test from "node:test";

import { filterLatestSchedulePeriods, getLatestSchedulePeriodByLocation } from "../latest-schedule-period";

test("keeps only the newest dated period and hides undated legacy rows", () => {
  const rows = [
    { id: "legacy", location_id: "jexer-oimachi", valid_from: null },
    { id: "april", location_id: "jexer-oimachi", valid_from: "2026-04-01" },
    { id: "august-a", location_id: "jexer-oimachi", valid_from: "2026-08-01" },
    { id: "august-b", location_id: "jexer-oimachi", valid_from: "2026-08-01" },
  ];

  assert.deepEqual(filterLatestSchedulePeriods(rows).map((row) => row.id), ["august-a", "august-b"]);
});

test("selects the newest period independently for each location", () => {
  const rows = [
    { id: "a-old", location_id: "a", valid_from: "2026-07-01" },
    { id: "a-new", location_id: "a", valid_from: "2026-08-01" },
    { id: "b-new", location_id: "b", valid_from: "2026-07-01" },
  ];

  assert.deepEqual(filterLatestSchedulePeriods(rows).map((row) => row.id), ["a-new", "b-new"]);
});

test("preserves legacy rows when a location has no dated import", () => {
  const rows = [
    { id: "one", location_id: "legacy-location", valid_from: null },
    { id: "two", location_id: "legacy-location", valid_from: null },
  ];

  assert.deepEqual(filterLatestSchedulePeriods(rows), rows);
});

test("uses a complete location period map when the result rows are a program subset", () => {
  const allRows = [
    { location_id: "location", valid_from: "2026-04-01" },
    { location_id: "location", valid_from: "2026-08-01" },
  ];
  const oldProgramSubset = [{ id: "old-program", location_id: "location", valid_from: "2026-04-01" }];

  assert.deepEqual(
    filterLatestSchedulePeriods(oldProgramSubset, getLatestSchedulePeriodByLocation(allRows)),
    [],
  );
});
