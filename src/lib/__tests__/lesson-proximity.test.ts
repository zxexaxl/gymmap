import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  createCurrentLocationProximityOrigin,
  DEFAULT_LESSON_PROXIMITY_ORIGIN,
  haversineDistanceKm,
  rankLessonLocationsByMapCenter,
  rankLessonLocationsByProximity,
} from "@/components/map/lesson-proximity";

const lessonMapSource = readFileSync(
  new URL("../../components/map/location-map-section.tsx", import.meta.url),
  "utf8",
);

const TOKYO_GYM = {
  id: "tokyo",
  name: "Tokyo fixture",
  latitude: 35.6813,
  longitude: 139.767,
};
const OSAKA_GYM = {
  id: "osaka",
  name: "Osaka fixture",
  latitude: 34.7026,
  longitude: 135.496,
};
const NAGOYA_GYM = {
  id: "nagoya",
  name: "Nagoya fixture",
  latitude: 35.1709,
  longitude: 136.8815,
};
const FIXTURE_LOCATIONS = [TOKYO_GYM, OSAKA_GYM, NAGOYA_GYM] as const;
const OSAKA_MOCK = { latitude: 34.702485, longitude: 135.495951 };

test("default Lesson proximity origin is the authoritative Tokyo Station reference", () => {
  assert.deepEqual(DEFAULT_LESSON_PROXIMITY_ORIGIN, {
    type: "default_reference",
    label: "東京駅",
    coordinates: { latitude: 35.681236, longitude: 139.767125 },
  });
});

test("a successful synthetic location creates an explicit current-location origin", () => {
  assert.deepEqual(createCurrentLocationProximityOrigin(OSAKA_MOCK), {
    type: "current_location",
    label: "現在地",
    coordinates: OSAKA_MOCK,
  });
});

test("switching origin recomputes distances and materially reranks locations", () => {
  const tokyoRanking = rankLessonLocationsByProximity(
    FIXTURE_LOCATIONS,
    DEFAULT_LESSON_PROXIMITY_ORIGIN,
  );
  const osakaRanking = rankLessonLocationsByProximity(
    FIXTURE_LOCATIONS,
    createCurrentLocationProximityOrigin(OSAKA_MOCK),
  );

  assert.deepEqual(tokyoRanking.map((location) => location.id), ["tokyo", "nagoya", "osaka"]);
  assert.deepEqual(osakaRanking.map((location) => location.id), ["osaka", "nagoya", "tokyo"]);
  assert.ok(tokyoRanking[0].distanceKm < 1);
  assert.ok(osakaRanking[0].distanceKm < 1);
  assert.notEqual(tokyoRanking.find((location) => location.id === "osaka")?.distanceKm, osakaRanking[0].distanceKm);
});

test("the same 5km filter follows the active origin without mutating coordinates", () => {
  const originalLocations = structuredClone(FIXTURE_LOCATIONS);
  const withinFiveKm = (distanceKm: number) => distanceKm <= 5;
  const tokyoMatches = rankLessonLocationsByProximity(
    FIXTURE_LOCATIONS,
    DEFAULT_LESSON_PROXIMITY_ORIGIN,
  ).filter((location) => withinFiveKm(location.distanceKm));
  const osakaMatches = rankLessonLocationsByProximity(
    FIXTURE_LOCATIONS,
    createCurrentLocationProximityOrigin(OSAKA_MOCK),
  ).filter((location) => withinFiveKm(location.distanceKm));

  assert.deepEqual(tokyoMatches.map((location) => location.id), ["tokyo"]);
  assert.deepEqual(osakaMatches.map((location) => location.id), ["osaka"]);
  assert.deepEqual(FIXTURE_LOCATIONS, originalLocations);
});

test("the established Haversine result remains stable", () => {
  const tokyoToOsakaKm = haversineDistanceKm(
    DEFAULT_LESSON_PROXIMITY_ORIGIN.coordinates,
    OSAKA_MOCK,
  );

  assert.ok(tokyoToOsakaKm > 400 && tokyoToOsakaKm < 410);
});

test("map scope reranks the same eastward viewport candidates around its center", () => {
  const westOrigin = createCurrentLocationProximityOrigin({ latitude: 35.68, longitude: 139.7 });
  const viewportCandidates = [
    { id: "west-edge", name: "West edge", latitude: 35.68, longitude: 139.75 },
    { id: "center", name: "Viewport center", latitude: 35.68, longitude: 139.8 },
    { id: "east-edge", name: "East edge", latitude: 35.68, longitude: 139.85 },
  ] as const;
  const proximityRanked = rankLessonLocationsByProximity(viewportCandidates, westOrigin);
  const mapRanked = rankLessonLocationsByMapCenter(proximityRanked, {
    latitude: 35.68,
    longitude: 139.8,
  });

  assert.deepEqual(proximityRanked.map((location) => location.id), ["west-edge", "center", "east-edge"]);
  assert.equal(mapRanked[0].id, "center");
  assert.deepEqual(
    new Set(mapRanked.map((location) => location.id)),
    new Set(proximityRanked.map((location) => location.id)),
  );
  assert.deepEqual(westOrigin.coordinates, { latitude: 35.68, longitude: 139.7 });
  assert.deepEqual(
    mapRanked.map((location) => location.distanceKm),
    mapRanked.map((location) => proximityRanked.find((candidate) => candidate.id === location.id)?.distanceKm),
  );
});

test("panning in map scope reranks without changing proximity distances", () => {
  const westOrigin = createCurrentLocationProximityOrigin({ latitude: 35.68, longitude: 139.7 });
  const proximityRanked = rankLessonLocationsByProximity(
    [
      { id: "west", name: "West", latitude: 35.68, longitude: 139.77 },
      { id: "east", name: "East", latitude: 35.68, longitude: 139.83 },
    ],
    westOrigin,
  );
  const firstViewport = rankLessonLocationsByMapCenter(proximityRanked, {
    latitude: 35.68,
    longitude: 139.77,
  });
  const pannedViewport = rankLessonLocationsByMapCenter(proximityRanked, {
    latitude: 35.68,
    longitude: 139.83,
  });

  assert.equal(firstViewport[0].id, "west");
  assert.equal(pannedViewport[0].id, "east");
  assert.deepEqual(
    firstViewport.map(({ id, distanceKm }) => ({ id, distanceKm })),
    pannedViewport.map(({ id, distanceKm }) => ({ id, distanceKm })).reverse(),
  );
  assert.deepEqual(westOrigin.coordinates, { latitude: 35.68, longitude: 139.7 });
});

test("Lesson owns runtime-only origin and first-success scope while repeat return stays camera-only", () => {
  assert.match(
    lessonMapSource,
    /useState<LessonProximityOrigin>\(\s*DEFAULT_LESSON_PROXIMITY_ORIGIN,?\s*\)/,
  );

  const successCallback = lessonMapSource.match(
    /navigator\.geolocation\.getCurrentPosition\(\s*\(position\) => \{([\s\S]*?)\n\s*\},\s*\n\s*\(error\)/,
  )?.[1];
  assert.ok(successCallback);
  assert.match(successCallback, /setProximityOrigin\(createCurrentLocationProximityOrigin\(nextPosition\)\)/);
  assert.match(successCallback, /setListScope\("nearby"\)/);

  const returnBranch = lessonMapSource.match(
    /function handleCurrentLocationAction\(\) \{([\s\S]*?)\n\s*\}/,
  )?.[1];
  assert.ok(returnBranch);
  assert.doesNotMatch(returnBranch, /setProximityOrigin|setListScope|getCurrentPosition/);
  assert.doesNotMatch(lessonMapSource, /localStorage|sessionStorage|document\.cookie/);
});

test("failure preserves the prior origin and retry remains available", () => {
  const failureCallback = lessonMapSource.match(
    /\(error\) => \{([\s\S]*?)\n\s*\},\s*\n\s*\{\s*enableHighAccuracy/,
  )?.[1];
  assert.ok(failureCallback);
  assert.doesNotMatch(failureCallback, /setProximityOrigin|setListScope|setCurrentPosition/);
  assert.match(lessonMapSource, /void requestCurrentPosition\(\)/);
});

test("origin changes preserve selection, URL, filters, and the selected distance value", () => {
  const successCallback = lessonMapSource.match(
    /navigator\.geolocation\.getCurrentPosition\(\s*\(position\) => \{([\s\S]*?)\n\s*\},\s*\n\s*\(error\)/,
  )?.[1];
  assert.ok(successCallback);
  assert.doesNotMatch(
    successCallback,
    /setSelectedLocationId|history\.|setProgramQuery|setBrandFilter|setPrefectureFilter|setDistanceFilter/,
  );
  assert.match(lessonMapSource, /\[locations, proximityOrigin\]/);
  assert.match(lessonMapSource, /const maximumDistanceKm = distanceFilter \? Number\(distanceFilter\) : null/);
});

test("scope controls preserve origin and disclose the active basis accessibly", () => {
  assert.match(lessonMapSource, /\{proximityOrigin\.label\}からの距離/);
  assert.match(lessonMapSource, /`\$\{proximityOrigin\.label\}から近い10店舗`/);
  assert.match(lessonMapSource, /"この地図範囲の店舗"/);
  assert.match(lessonMapSource, /`地図の中心に近い順 \/ \$\{listCandidates\.length\}件中（最大10件）`/);
  assert.match(lessonMapSource, /`地図中心から\$\{formatDistanceLabel\(mapCenterDistanceKm\)\}`/);
  assert.match(lessonMapSource, /rankLessonLocationsByMapCenter\(listCandidates, mapViewportCenter\)/);
  assert.match(lessonMapSource, /近い順で見る/);
  assert.match(lessonMapSource, /この地図範囲から探す/);
  assert.match(lessonMapSource, /aria-pressed=\{listScope === "nearby"\}/);
  assert.match(lessonMapSource, /aria-pressed=\{listScope === "map"\}/);
});
