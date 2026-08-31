import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { buildHyroxDetailPath } from "@/lib/hyrox-discovery";

const read = (path: string) => fs.readFileSync(path, "utf8");
const route = read("src/app/training/hyrox/[slug]/page.tsx");
const lessonDetail = read("src/app/locations/[slug]/page.tsx");
const listCard = read("src/components/training/hyrox-facility-card.tsx");
const mapSelection = read("src/components/training/hyrox-map-selection-content.tsx");

test("HYROX detail uses a stable domain-owned route and canonical", () => {
  assert.equal(buildHyroxDetailPath("official-hyrox-gym"), "/training/hyrox/official-hyrox-gym");
  assert.equal(buildHyroxDetailPath("space gym"), "/training/hyrox/space%20gym");
  assert.match(route, /buildHyroxDetailPath\(location\.slug\)/);
  assert.match(route, /canonical: pathname/);
  assert.match(route, /className=\{`page-stack hyrox-page/);
  assert.doesNotMatch(route, /document\.referrer|localStorage|sessionStorage|\?from=hyrox/);
});

test("HYROX detail owns Header context, breadcrumb, identity, and continuation", () => {
  assert.match(route, /href="\/training\/hyrox">HYROX<\/Link>/);
  assert.match(route, /aria-current="page">施設詳細/);
  assert.match(route, /Official Training Club/);
  assert.match(route, /地図で確認する/);
  assert.match(route, /HYROXの施設一覧に戻る/);
  assert.match(route, /施設公式サイト/);
  assert.doesNotMatch(route, /レッスン検索|週間レッスン|プログラム|レッスンを探す/);
});

test("positive equipment uses H3 labels and disclosure while no-positive omits the section", () => {
  assert.match(route, /location\.confirmedEquipment\.length > 0/);
  assert.match(route, /公式情報で確認できた設備/);
  assert.match(route, /HYROX_EQUIPMENT_LABELS\[equipment\]/);
  assert.match(route, /HYROX_POSITIVE_EVIDENCE_DISCLOSURE/);
  assert.doesNotMatch(route, /設備なし|未確認|調査中|確認中|情報なし|利用不可|非対応/);
});

test("capability and equipment filtering remain outside U4-R1", () => {
  assert.doesNotMatch(route, /capability|open_training|competition-simulation|SelectableChip/i);
  assert.doesNotMatch(route, /equipment filter|設備で絞り込む/i);
  assert.doesNotMatch(route, /FreshnessIndicator|Date\.now|new Date/);
});

test("HYROX list and Map selection share the dedicated detail route", () => {
  assert.match(listCard, /buildHyroxDetailPath\(location\.slug\)/);
  assert.match(mapSelection, /buildHyroxDetailPath\(location\.slug\)/);
  assert.doesNotMatch(`${listCard}\n${mapSelection}`, /`\/locations\/\$\{location\.slug\}`/);
});

test("Lesson detail remains Lesson-owned and unchanged in meaning", () => {
  assert.match(lessonDetail, /canonical: `\/locations\/\$\{slug\}`/);
  assert.match(lessonDetail, /レッスン検索/);
  assert.match(lessonDetail, /週間レッスン/);
  assert.match(lessonDetail, /プログラム/);
  assert.match(lessonDetail, /LocationScheduleTable/);
  assert.doesNotMatch(lessonDetail, /hyrox|HYROX/);
});
