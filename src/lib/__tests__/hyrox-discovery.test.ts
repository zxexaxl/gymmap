import assert from "node:assert/strict";
import test from "node:test";

import {
  HYROX_EQUIPMENT_LABELS,
  HYROX_POSITIVE_EVIDENCE_DISCLOSURE,
  filterHyroxLocations,
  getHyroxPrefectureOptions,
  loadCompleteHyroxDiscoveryData,
  type HyroxOfficialUrlRow,
  type HyroxSearchRow,
} from "@/lib/hyrox-discovery";

function buildSearchRow(
  index: number,
  totalCount: number,
  overrides: Partial<HyroxSearchRow> = {},
): HyroxSearchRow {
  return {
    address: `東京都テスト区${index}`,
    brand_id: `brand-${index}`,
    brand_name: `Brand ${index}`,
    capability_slugs: [],
    city: "テスト区",
    class_available: false,
    equipment_slugs: [],
    last_confirmed_at: "2026-08-29T00:00:00.000Z",
    latitude: 35 + index / 1000,
    location_id: `location-${index}`,
    location_name: `Location ${index}`,
    location_slug: `location-${index}`,
    longitude: 139 + index / 1000,
    official: true,
    open_training_available: false,
    prefecture: index % 2 === 0 ? "東京都" : "京都府",
    total_count: totalCount,
    ...overrides,
  };
}

test("loads every official result across more than 100 rows and batches URL supplementation", async () => {
  const sourceRows = Array.from({ length: 150 }, (_, index) => buildSearchRow(index, 150));
  const searchCalls: Array<{ offset: number; limit: number }> = [];
  const urlBatches: string[][] = [];

  const result = await loadCompleteHyroxDiscoveryData({
    async searchPage(offset, limit) {
      searchCalls.push({ offset, limit });
      return sourceRows.slice(offset, offset + limit);
    },
    async loadOfficialUrls(locationIds) {
      urlBatches.push(locationIds);
      return locationIds.map(
        (id): HyroxOfficialUrlRow => ({ id, official_url: `https://example.com/${id}` }),
      );
    },
  });

  assert.deepEqual(searchCalls, [
    { offset: 0, limit: 100 },
    { offset: 100, limit: 100 },
  ]);
  assert.equal(result.totalCount, 150);
  assert.equal(result.locations.length, 150);
  assert.equal(new Set(result.locations.map((location) => location.id)).size, 150);
  assert.deepEqual(urlBatches.map((batch) => batch.length), [100, 50]);
  assert.equal(result.missingOfficialUrlCount, 0);
});

test("keeps a successful empty result distinct from a fetch failure", async () => {
  const result = await loadCompleteHyroxDiscoveryData({
    async searchPage() {
      return [];
    },
    async loadOfficialUrls() {
      assert.fail("URL lookup should not run for an empty result");
    },
  });

  assert.deepEqual(result, { locations: [], totalCount: 0, missingOfficialUrlCount: 0 });

  await assert.rejects(
    loadCompleteHyroxDiscoveryData({
      async searchPage() {
        throw new Error("network unavailable");
      },
      async loadOfficialUrls() {
        return [];
      },
    }),
    /network unavailable/,
  );
});

test("fails closed on duplicate publication rows or non-official leakage", async () => {
  const duplicate = buildSearchRow(0, 2);

  await assert.rejects(
    loadCompleteHyroxDiscoveryData({
      async searchPage() {
        return [duplicate, duplicate];
      },
      async loadOfficialUrls() {
        return [];
      },
    }),
    /1 unique locations for total 2/,
  );

  await assert.rejects(
    loadCompleteHyroxDiscoveryData({
      async searchPage() {
        return [{ ...buildSearchRow(0, 1), official: false }];
      },
      async loadOfficialUrls() {
        return [];
      },
    }),
    /Non-official location leaked/,
  );
});

test("prefecture options and filtering use the same location dataset", async () => {
  const rows = [buildSearchRow(0, 3), buildSearchRow(1, 3), buildSearchRow(2, 3)];
  const result = await loadCompleteHyroxDiscoveryData({
    async searchPage() {
      return rows;
    },
    async loadOfficialUrls() {
      return [];
    },
  });

  assert.deepEqual(getHyroxPrefectureOptions(result.locations), [
    { prefecture: "東京都", count: 2 },
    { prefecture: "京都府", count: 1 },
  ]);
  assert.equal(filterHyroxLocations(result.locations, "東京都").length, 2);
  assert.equal(filterHyroxLocations(result.locations, "").length, 3);
});

test("maps only reviewed equipment taxonomy into a deterministic public DTO", async () => {
  const row = buildSearchRow(0, 1, {
    equipment_slugs: ["treadmill", "row-erg", "row-erg", "ski-erg"],
    capability_slugs: ["discipline-coaching"],
    open_training_available: true,
    class_available: true,
  });
  const result = await loadCompleteHyroxDiscoveryData({
    async searchPage() {
      return [row];
    },
    async loadOfficialUrls() {
      return [];
    },
  });

  assert.deepEqual(result.locations[0].confirmedEquipment, ["ski-erg", "row-erg", "treadmill"]);
  assert.equal("capabilitySlugs" in result.locations[0], false);
  assert.equal("openTrainingAvailable" in result.locations[0], false);
  assert.equal("classAvailable" in result.locations[0], false);
  assert.deepEqual(Object.values(HYROX_EQUIPMENT_LABELS), [
    "SkiErg",
    "RowErg",
    "ウェイトスレッド",
    "ウォールボールターゲット",
    "ファーマーズキャリー用器具",
    "サンドバッグ",
    "ファンクショナルトレーニングレーン",
    "トレッドミル",
    "ランニングトラック",
  ]);
});

test("fails closed when publication contains an unmapped equipment slug", async () => {
  await assert.rejects(
    loadCompleteHyroxDiscoveryData({
      async searchPage() {
        return [buildSearchRow(0, 1, { equipment_slugs: ["future-internal-slug"] })];
      },
      async loadOfficialUrls() {
        return [];
      },
    }),
    /unmapped taxonomy/,
  );
});

test("positive-evidence disclosure preserves unknown rather than negative semantics", () => {
  assert.match(HYROX_POSITIVE_EVIDENCE_DISCLOSURE, /公式情報で確認できた内容のみ/);
  assert.match(HYROX_POSITIVE_EVIDENCE_DISCLOSURE, /ないことを示すものではありません/);
  assert.doesNotMatch(HYROX_POSITIVE_EVIDENCE_DISCLOSURE, /設備なし|自主練不可|クラスなし|現在確認中/);
});
