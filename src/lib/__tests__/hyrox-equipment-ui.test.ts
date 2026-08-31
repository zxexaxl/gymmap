import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { HyroxFacilityCard } from "@/components/training/hyrox-facility-card";
import type { HyroxDiscoveryLocation } from "@/lib/hyrox-discovery";

function location(
  confirmedEquipment: HyroxDiscoveryLocation["confirmedEquipment"],
): HyroxDiscoveryLocation {
  return {
    id: "location-1",
    slug: "example-gym",
    name: "Example Gym",
    brandId: "brand-1",
    brandName: "Example Brand",
    prefecture: "東京都",
    city: "渋谷区",
    address: "東京都渋谷区1-1-1",
    latitude: 35.6,
    longitude: 139.7,
    official: true,
    officialUrl: "https://example.com/gym",
    lastConfirmedAt: "2026-08-30T00:00:00.000Z",
    confirmedEquipment,
  };
}

test("equipment-positive card renders exact positive labels as non-interactive chips", () => {
  const markup = renderToStaticMarkup(
    createElement(HyroxFacilityCard, {
      location: location(["ski-erg", "weighted-sled", "farmers-carry-implements"]),
      onMapFocus() {},
    }),
  );

  assert.match(markup, /Official Training Club/);
  assert.match(markup, /公式情報で確認できた設備/);
  assert.match(markup, /SkiErg/);
  assert.match(markup, /ウェイトスレッド/);
  assert.match(markup, /ファーマーズキャリー用器具/);
  assert.match(markup, /ui-chip--positive/);
  assert.doesNotMatch(markup, /aria-pressed|設備なし|未確認|調査中|確認中|情報なし|自主練|指導|シミュレーション/);
});

test("no-positive card omits the equipment section and every missing-state treatment", () => {
  const markup = renderToStaticMarkup(
    createElement(HyroxFacilityCard, {
      location: location([]),
      onMapFocus() {},
    }),
  );

  assert.doesNotMatch(markup, /hyrox-equipment|公式情報で確認できた設備|ui-chip/);
  assert.doesNotMatch(markup, /設備なし|未確認|調査中|確認中|情報なし|利用不可|非対応/);
  assert.match(markup, /Example Gym/);
  assert.match(markup, /GymMapで詳細を見る/);
  assert.match(markup, /href="\/training\/hyrox\/example-gym"/);
});

test("page replaces the legacy status notice with the H3-10A disclosure", () => {
  const source = fs.readFileSync("src/app/training/hyrox/page.tsx", "utf8");
  assert.match(source, /HYROX_POSITIVE_EVIDENCE_DISCLOSURE/);
  assert.doesNotMatch(source, /設備やクラス情報は現在確認中です/);
});

test("H3-10B stays outside capability, filter, detail, and map presentation scope", () => {
  const cardSource = fs.readFileSync("src/components/training/hyrox-facility-card.tsx", "utf8");
  const mapSource = fs.readFileSync("src/components/map/leaflet-gym-map.tsx", "utf8");
  assert.doesNotMatch(cardSource, /capability|openTraining|competition|classAvailable|SelectableChip/);
  assert.doesNotMatch(mapSource, /confirmedEquipment|HYROX_EQUIPMENT/);
});
