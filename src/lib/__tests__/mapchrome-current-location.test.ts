import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const presentationSource = readFileSync(
  new URL("../../components/map/map-presentation.tsx", import.meta.url),
  "utf8",
);
const presentationStyles = readFileSync(
  new URL("../../components/map/map-presentation.module.css", import.meta.url),
  "utf8",
);
const lessonMapSource = readFileSync(
  new URL("../../components/map/location-map-section.tsx", import.meta.url),
  "utf8",
);
const hyroxMapSource = readFileSync(
  new URL("../../components/training/hyrox-discovery.tsx", import.meta.url),
  "utf8",
);

test("idle MapChrome is a single compact current-location action", () => {
  assert.match(presentationSource, /not_requested: "現在地から探す"/);
  assert.match(
    presentationSource,
    /const showStatus = state !== "not_requested" && state !== "obtained"/,
  );
  assert.match(presentationSource, /\{showStatus \? \([\s\S]*map-location-status[\s\S]*\) : null\}/);
  assert.match(presentationStyles, /\.locationButton[\s\S]*min-height: 44px/);
  assert.doesNotMatch(presentationStyles, /\.locationMessage\s*\{[^}]*display:\s*none/);
});

test("requesting status is announced without a duplicate visible surface", () => {
  assert.match(
    presentationSource,
    /aria-describedby=\{showStatus \? "map-location-status" : undefined\}/,
  );
  assert.match(presentationSource, /const visuallyHideStatus = state === "requesting"/);
  assert.match(
    presentationSource,
    /className=\{`\$\{styles\.locationMessage\} \$\{visuallyHideStatus \? styles\.visuallyHidden : ""\}`\}/,
  );
  assert.match(presentationSource, /id="map-location-status"[\s\S]*aria-live="polite"/);
  assert.match(presentationStyles, /\.visuallyHidden\s*\{[\s\S]*clip: rect\(0, 0, 0, 0\)/);
  assert.match(presentationSource, /const pending = state === "requesting" \|\| state === "refreshing"/);
  assert.match(presentationSource, /disabled=\{disabled\}/);
  assert.match(presentationSource, /loading=\{pending\}/);
});

test("decorative guidance adds no control or persistence model", () => {
  assert.doesNotMatch(presentationSource, /localStorage|sessionStorage|cookie|dismiss/i);
  assert.doesNotMatch(presentationSource, /navigator\.geolocation|permissions\.query/);
  assert.match(presentationSource, /<span className=\{styles\.locationGlyph\} aria-hidden="true">/);
  assert.doesNotMatch(presentationSource, /<p[^>]*(tabIndex|onClick|role="button")/);
});

test("Lesson and HYROX keep one shared MapChrome contract", () => {
  for (const domainSource of [lessonMapSource, hyroxMapSource]) {
    assert.match(domainSource, /CurrentLocationControl/);
    assert.match(domainSource, /MapChrome/);
    assert.match(domainSource, /onClick=\{handleCurrentLocationAction\}/);
    assert.doesNotMatch(domainSource, /geolocationStatus !== "obtained"/);
  }
});

test("obtained location remains an available return action", () => {
  assert.match(presentationSource, /obtained: "現在地へ戻る"/);

  for (const domainSource of [lessonMapSource, hyroxMapSource]) {
    assert.match(
      domainSource,
      /function handleCurrentLocationAction\(\) \{[\s\S]*if \(currentPosition\) \{[\s\S]*setMapFocusCenter\(currentPosition\)[\s\S]*setMapFocusRequestId[\s\S]*return;[\s\S]*void requestCurrentPosition\(\)/,
    );
  }
});

test("geolocation acquisition remains outside presentation", () => {
  assert.doesNotMatch(presentationSource, /getCurrentPosition|watchPosition|navigator\.permissions/);
  assert.match(lessonMapSource, /navigator\.geolocation\.getCurrentPosition/);
  assert.match(hyroxMapSource, /navigator\.geolocation\.getCurrentPosition/);
});
