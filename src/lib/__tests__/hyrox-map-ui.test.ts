import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  filterHyroxLocations,
  type HyroxDiscoveryLocation,
} from "@/lib/hyrox-discovery";

const discoverySource = readFileSync(
  new URL("../../components/training/hyrox-discovery.tsx", import.meta.url),
  "utf8",
);
const selectionSource = readFileSync(
  new URL("../../components/training/hyrox-map-selection-content.tsx", import.meta.url),
  "utf8",
);
const markerSource = readFileSync(
  new URL("../../components/map/map-marker-presentation.ts", import.meta.url),
  "utf8",
);

function location(overrides: Partial<HyroxDiscoveryLocation> = {}): HyroxDiscoveryLocation {
  return {
    id: "location-1",
    slug: "official-hyrox-gym",
    name: "Official HYROX Gym",
    brandId: "brand-1",
    brandName: "GymMap Test",
    prefecture: "東京都",
    city: "渋谷区",
    address: "東京都渋谷区1-1-1",
    latitude: 35.68,
    longitude: 139.76,
    official: true,
    officialUrl: "https://example.com/gym",
    lastConfirmedAt: "2026-08-30T00:00:00Z",
    confirmedEquipment: [],
    ...overrides,
  };
}

test("HYROX consumes the frozen M1 shell and providers without a presentation fork", () => {
  for (const sharedPrimitive of [
    "MapChrome",
    "CurrentLocationControl",
    "MapSelectionSurface",
    "MapStateNotice",
    "LeafletGymMap",
    "AppleGymMap",
  ]) {
    assert.match(discoverySource, new RegExp(sharedPrimitive));
  }

  assert.doesNotMatch(discoverySource, /CircleMarker|MapContainer|getMapMarkerPresentation|resolveMapMarkerState/);
  assert.doesNotMatch(discoverySource, /fitBounds|flyTo|panBy|selected-marker|hyrox-marker/i);
  assert.doesNotMatch(markerSource, /Hyrox|equipment|capability|evidence/i);
});

test("one filtered HYROX dataset feeds map, compact list, and full list", () => {
  const locations = [
    location(),
    location({ id: "location-2", slug: "kyoto", prefecture: "京都府", city: "京都市" }),
    location({ id: "location-3", slug: "tokyo-2", name: "Tokyo Two" }),
  ];
  const tokyo = filterHyroxLocations(locations, "東京都");

  assert.deepEqual(tokyo.map((item) => item.id), ["location-1", "location-3"]);
  assert.match(discoverySource, /filteredLocations\.map\(\(location\) => \(\{/);
  assert.match(discoverySource, /filteredLocations\.map\(\(location\) => \(\s*<article/);
  assert.match(discoverySource, /filteredLocations\.map\(\(location\) => \(\s*<HyroxFacilityCard/);
  assert.doesNotMatch(discoverySource, /setSelectedLocationId\(null\)[\s\S]{0,120}setPrefecture|setPrefecture[\s\S]{0,120}setSelectedLocationId\(null\)/);
});

test("selection uses M0 URL identity, history, close, Escape, and explicit location gesture", () => {
  assert.match(discoverySource, /resolveMapSelection/);
  assert.match(discoverySource, /buildMapSelectionHref/);
  assert.match(discoverySource, /history\.pushState/);
  assert.match(discoverySource, /history\.replaceState/);
  assert.match(discoverySource, /addEventListener\("popstate"/);
  assert.match(discoverySource, /event\.key === "Escape"/);
  assert.match(discoverySource, /onClearSelection=\{handleClearSelection\}/);
  assert.match(discoverySource, /onClick=\{\(\) => \{\s*void requestCurrentPosition\(\)/);
  assert.doesNotMatch(discoverySource, /useEffect\([\s\S]{0,400}requestCurrentPosition\(\)/);
});

test("selected positive equipment uses H3-10B labels and zero-positive omits the section", () => {
  assert.match(selectionSource, /location\.confirmedEquipment\.length > 0/);
  assert.match(selectionSource, /location\.confirmedEquipment\.map/);
  assert.match(selectionSource, /HYROX_EQUIPMENT_LABELS\[equipment\]/);
  assert.match(selectionSource, /確認できた設備/);
  assert.doesNotMatch(selectionSource, /設備なし|未確認|調査中|情報なし/);
  assert.doesNotMatch(selectionSource, /HYROX_POSITIVE_EVIDENCE_DISCLOSURE/);
});

test("capability presentation stays deferred and HOLD/DEFER fields never leak", () => {
  for (const forbidden of [
    "open_training_available",
    "capability_slugs",
    "competition-simulation",
    "outdoor-running-access",
    "自主練不可",
    "equipment filter",
  ]) {
    assert.doesNotMatch(`${discoverySource}\n${selectionSource}`, new RegExp(forbidden, "i"));
  }
});

test("compact list and panel actions remain keyboard/text accessible", () => {
  assert.match(discoverySource, /role="button"/);
  assert.match(discoverySource, /aria-pressed/);
  assert.match(discoverySource, /event\.key === "Enter" \|\| event\.key === " "/);
  assert.match(selectionSource, /GymMapで詳細を見る/);
  assert.match(selectionSource, /buildHyroxDetailPath\(location\.slug\)/);
  assert.match(selectionSource, /施設公式サイト/);
  assert.match(selectionSource, /<Chip key=\{equipment\} tone="positive">/);
  assert.doesNotMatch(selectionSource, /<button[^>]*>[^<]*(SkiErg|設備)/);
});
