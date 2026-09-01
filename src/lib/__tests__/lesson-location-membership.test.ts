import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

const migrationPath = "supabase/migrations/0011_add_lesson_discovery_membership.sql";
const migration = read(migrationPath);
const manifestIds = Array.from(
  migration.matchAll(/\('([0-9a-f-]{36})'::uuid\)/g),
  (match) => match[1],
).sort();
const manifestIdSet = new Set(manifestIds);

const hyroxOnlyIds = [
  "0285b50c-5357-4a7b-8bc8-cfa799a991db", "0470dd2d-e6db-4c77-aa29-5cd72b597a4c",
  "07dc7a48-d6d5-461e-ac50-87f1934d9aef", "08a40e56-5405-4b97-98ed-2bc16263c9df",
  "0b573034-d71b-4176-a3b3-82e9355d123e", "0c231d29-3a21-49ae-968d-7d76e102d93a",
  "1ab147a4-2828-4fa6-a7df-5094b20691ad", "1c832c50-8b01-4bb1-be45-df02d5ec09b2",
  "1de9a4af-9fc4-495a-8628-467a4d240842", "23d0e430-6eda-44d8-aef6-f8a3aa99f06c",
  "295cc8bc-32d9-48f4-8b79-b2f18e85cd78", "33bc8540-aca5-4aca-9921-c3f14dd8d067",
  "3c1747f5-b8e7-4d50-a31d-c05d31dd0edf", "419f2440-1a1a-4815-8c2e-de4b2a9f9b1a",
  "42267408-cbb5-4c3f-9b5f-10a102271a27", "44aba800-81de-4a6f-8f7f-8c5ba4beffda",
  "484a51bb-c881-4fce-98aa-737a86a5bb8b", "4972bb69-ded7-4ed9-9f99-0898f099837c",
  "49c4308c-8f8a-4d45-8e6f-d03cd28d987b", "4a07f1c3-3666-4648-bedd-35c283912e26",
  "4a0b9292-1283-49ac-a3b2-c7bd38133a31", "4bb064be-730c-4f17-9849-12078fcea96b",
  "4bd4cc55-6ee2-47d5-9cf8-cd109a1d241e", "4f16d0f0-4b29-4769-b622-f093eb31f5ec",
  "5177b64a-a927-4c95-b903-96d60a82bdd8", "530bd4e0-6009-4c84-8c6d-f7ffe24ae79f",
  "5326a371-18d2-4c51-9109-e59242521f16", "538692f3-a310-4325-938e-5f402bea3419",
  "53b51872-63cb-4bfd-aa25-861df7cf203b", "53fb0bd7-5dde-4936-99e5-812fef6928de",
  "55b4e0d7-9708-4e12-aaea-54780ee852fa", "58746bc6-200d-49c5-a0ff-9e4601dbea86",
  "5cc12f35-0a51-43ad-8bc0-f15ccf4e8a12", "611fbcc9-2fa4-46cb-9963-e03c2a414ae3",
  "6a648255-f646-4b01-b602-5898ef28ea5f", "6f81ff21-8cfa-452a-a42c-925c7448d971",
  "7703522c-c819-4fd0-b655-03990a588803", "78dc65f1-11fd-4223-9190-a94828ecd239",
  "7ad9455d-857d-4286-b223-2fb4317157b5", "81c17ac2-dc15-4a04-8cc8-da5587ccdcef",
  "83a8de7f-36e4-4ece-bd31-a0e98b295ff8", "867ece36-497f-4cbc-aae8-03e850e6514e",
  "87ee5b5a-431c-4eae-9c70-7a7bed0287de", "88875948-5f74-4b54-953e-d6d14b8253c4",
  "8dcfa83e-06e6-44d9-b22c-a1685b7e88e3", "90693dc2-ca66-4e9d-bd76-d7ad80d95d58",
  "91a88fbd-d60c-4fb1-85e9-34351e01291a", "956ff109-25d1-4783-b67f-dbc40da7c0a5",
  "9641b1b8-0a38-420c-9f20-dfcc07fbbb83", "97215ab3-37fc-49a1-9d63-e02d730e87b7",
  "99abe458-52ae-44a4-8f1a-3f747ff9bfb8", "9d7ac2ff-be49-4219-bcde-75e3745df6a4",
  "9f21962f-2f21-4c8b-97a8-c4779fd680bd", "a6ad9646-4983-4a73-93db-89fcf2bf868c",
  "acd6dae7-fefc-497d-9ae2-dd308f2247db", "b09c422a-428e-4895-bb77-84bbc316c294",
  "bb010542-dd04-4d87-b362-807fccc68fdf", "c629c669-807e-4467-b638-cb1f97df8975",
  "cc8f2cee-62bd-4756-abfd-5f1b27a9c9d4", "cce2da1b-c43c-497c-8786-769f6f889173",
  "cd239ca3-1921-47d3-ba87-71925ec34616", "d5e17f12-a158-4988-aa00-e6626225f8c0",
  "dbeed152-b421-4f15-acf8-8586a5a85aa7", "de035966-4bb2-48bc-ac30-05eab729031f",
  "e1812ee4-c781-4a69-b582-6a6cb5365363", "e24cedfb-5333-4cd0-9164-1d764c3f6d73",
  "e697d60d-1f95-4fb5-b28a-87b1f93c106d", "e76ef25f-869c-4d13-922d-2dfb1eb52a6c",
  "e77b1201-a8d8-428c-910f-f48edbca71ba", "e831f0ec-e60d-4170-8531-1773a427c2ad",
  "ea35b1a8-7a73-4e88-a572-2ec932072502", "eae47de3-da8a-4f5e-8cdf-444bb413b90c",
  "f1241ba8-53bb-4758-9e97-c81de16b6eeb", "f12d2323-2ea1-4d8b-bbad-2060a8ab7901",
  "f6b82f46-09dc-4b5e-abe6-df477665d6fb",
] as const;

const cleanDualIds = [
  "1e1dc6eb-ec16-4850-978a-ac3c513f55ab",
  "4d3bd3ba-cb00-44be-bdd6-d9b901f73195",
  "569aecf8-aa02-41da-b37a-7e2e20f160fb",
  "73a4df85-88c1-4545-a74b-4fcf9a5ffaf8",
  "7d7216d0-692e-45dd-ad3c-6c4980fdc50a",
  "d75c411f-2b58-476d-aa68-f7bde9000002",
  "e84c2ea2-bc63-4788-b050-590cfefebe42",
] as const;

test("backfill identity is the audited 369-member cohort", () => {
  assert.equal(manifestIds.length, 369);
  assert.equal(manifestIdSet.size, 369);
  assert.equal(
    createHash("sha256").update(`${manifestIds.join("\n")}\n`).digest("hex"),
    "bd6e62f537d87f1e792ce506652e1b155c3fee7353a468573da2ccce0befa816",
  );
});

test("all 75 HYROX-only identities are absent and all 7 clean-dual identities are present", () => {
  assert.equal(new Set(hyroxOnlyIds).size, 75);
  assert.equal(new Set(cleanDualIds).size, 7);
  assert.deepEqual(hyroxOnlyIds.filter((id) => manifestIdSet.has(id)), []);
  assert.deepEqual(cleanDualIds.filter((id) => !manifestIdSet.has(id)), []);
  assert.equal(manifestIdSet.has("44aba800-81de-4a6f-8f7f-8c5ba4beffda"), false);
});

test("every Lesson discovery reader uses positive membership authority", () => {
  const dataSource = read("src/lib/data.ts");
  const homeSource = read("src/app/page.tsx");
  const searchPageSource = read("src/app/search/page.tsx");
  const sitemapSource = read("scripts/generate-static-sitemaps.ts");

  assert.match(dataSource, /from\("lesson_location_memberships"\)/);
  assert.match(dataSource, /lesson_location_memberships!inner/);
  assert.match(dataSource, /search_lesson_class_schedule_page/);
  assert.match(dataSource, /favorite_lesson_class_schedule_week/);
  assert.match(dataSource, /get_lesson_popular_program_summary/);
  assert.match(dataSource, /get_lesson_latest_schedule_periods_by_location/);
  assert.match(sitemapSource, /from\("lesson_location_memberships"\)/);
  assert.match(homeSource, /getLessonDiscoveryBrands/);
  assert.match(homeSource, /getLessonDiscoveryLocations/);
  assert.match(searchPageSource, /getLessonDiscoveryBrands/);
  assert.doesNotMatch(dataSource, /not[ _-]+hyrox/i);
  assert.doesNotMatch(dataSource, /search_class_schedule_page"/);
  assert.doesNotMatch(dataSource, /favorite_class_schedule_week"/);
});

test("all known location and schedule writers enforce membership idempotently", () => {
  const locationWriters = [
    "insert_central_tokyo_locations.sql",
    "insert_golds_kanto_locations.sql",
    "insert_jexer_kanagawa_saitama_chiba_locations.sql",
    "insert_jexer_tokyo_locations.sql",
    "insert_konami_kanto_locations.sql",
    "insert_megalos_kanto_locations.sql",
    "insert_nas_kanto_locations.sql",
    "insert_tipness_kanto_locations.sql",
  ];

  for (const filename of locationWriters) {
    const source = read(`supabase/sql/${filename}`);
    assert.match(source, /inserted_locations as \(/);
    assert.match(source, /from inserted_locations/);
    assert.match(source, /insert into lesson_location_memberships/);
    assert.match(source, /on conflict \(location_id\) do nothing/);
  }

  for (const filename of ["import-central-extraction.ts", "import-jexer-extraction.ts"]) {
    assert.match(read(`scripts/experimental/${filename}`), /ensureLessonLocationMembership/);
  }
});

test("HYROX publication and monitoring code does not create Lesson membership", () => {
  const hyroxSources = [
    "src/lib/hyrox-discovery-server.ts",
    "scripts/hyrox/monitor-freshness.ts",
    "scripts/hyrox/monitor-enrichment-freshness.ts",
    "scripts/hyrox/apply-h3-8-enrichment-monitor-onboarding.ts",
  ];

  for (const path of hyroxSources) {
    assert.doesNotMatch(read(path), /lesson_location_memberships/);
  }
});
