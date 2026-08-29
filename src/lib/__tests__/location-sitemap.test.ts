import assert from "node:assert/strict";
import test from "node:test";

import { buildLocationSitemapEntries } from "@/lib/location-sitemap";

test("includes every active location regardless of schedule availability", () => {
  const entries = buildLocationSitemapEntries(
    [
      {
        slug: "active-with-schedule",
        is_active: true,
        last_verified_at: "2026-08-01T00:00:00.000Z",
        updated_at: "2026-07-01T00:00:00.000Z",
      },
      {
        slug: "active-without-schedule",
        is_active: true,
        last_verified_at: null,
        updated_at: "2026-08-02T00:00:00.000Z",
      },
    ],
    "https://gymmap.vercel.app",
  );

  assert.deepEqual(
    entries.map((entry) => entry.loc),
    [
      "https://gymmap.vercel.app/locations/active-with-schedule",
      "https://gymmap.vercel.app/locations/active-without-schedule",
    ],
  );
});

test("excludes inactive locations and does not create duplicate or malformed URLs", () => {
  const entries = buildLocationSitemapEntries(
    [
      {
        slug: "active-location",
        is_active: true,
        last_verified_at: null,
        updated_at: "2026-08-02T00:00:00.000Z",
      },
      {
        slug: "inactive-with-schedule",
        is_active: false,
        last_verified_at: "2026-08-01T00:00:00.000Z",
        updated_at: "2026-07-01T00:00:00.000Z",
      },
      {
        slug: "inactive-without-schedule",
        is_active: false,
        last_verified_at: null,
        updated_at: "2026-08-02T00:00:00.000Z",
      },
    ],
    "https://gymmap.vercel.app",
  );

  assert.deepEqual(entries, [
    {
      loc: "https://gymmap.vercel.app/locations/active-location",
      lastmod: "2026-08-02T00:00:00.000Z",
      changefreq: "weekly",
      priority: 0.8,
    },
  ]);
  assert.equal(new Set(entries.map((entry) => entry.loc)).size, entries.length);
  entries.forEach((entry) => assert.doesNotThrow(() => new URL(entry.loc)));
});
