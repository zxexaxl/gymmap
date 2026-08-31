import assert from "node:assert/strict";
import test from "node:test";

import { buildCoreSitemapEntries } from "@/lib/core-sitemap";

test("includes the canonical HYROX training route exactly once", () => {
  const entries = buildCoreSitemapEntries(
    "https://gymmap.vercel.app",
    "2026-08-30T00:00:00.000Z",
  );
  const hyroxEntries = entries.filter(
    (entry) => entry.loc === "https://gymmap.vercel.app/training/hyrox",
  );

  assert.equal(hyroxEntries.length, 1);
  assert.equal(new Set(entries.map((entry) => entry.loc)).size, entries.length);
});

test("uses public publication time for the optional updates route", () => {
  const entries = buildCoreSitemapEntries(
    "https://gymmap.vercel.app",
    "2026-08-31T10:00:00.000Z",
    "2026-08-31",
  );
  const updatesEntry = entries.find(
    (entry) => entry.loc === "https://gymmap.vercel.app/updates",
  );

  assert.ok(updatesEntry);
  assert.equal(updatesEntry.lastmod, "2026-08-31");
});
