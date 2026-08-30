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
