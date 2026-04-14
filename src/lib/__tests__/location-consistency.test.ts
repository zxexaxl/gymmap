import test from "node:test";
import assert from "node:assert/strict";

import {
  deriveLocationTokens,
  extractPrimaryLocationIdentifier,
  scoreLocationConsistency,
} from "../extraction/location-consistency";

test("deriveLocationTokens keeps the location-specific token", () => {
  assert.deepEqual(deriveLocationTokens("JEXER 赤羽").slice(0, 2), ["jexer赤羽", "赤羽"]);
});

test("extractPrimaryLocationIdentifier reads general query identifiers", () => {
  assert.equal(
    extractPrimaryLocationIdentifier("https://www.jexer.jp/schedule/fitness/?shop=17"),
    "shop=17",
  );
});

test("location consistency rewards matching location text and groups by identifier", () => {
  const akabaneScore = scoreLocationConsistency({
    entryUrl: "https://www.jexer.jp/mb/akabane/",
    candidateUrl: "https://www.jexer.jp/schedule/fitness/?shop=17",
    discoveredFrom: "ai_recommendation:https://www.jexer.jp/mb/akabane/",
    locationName: "JEXER 赤羽",
    pageText: "<html><title>JEXER 赤羽 スタジオスケジュール</title></html>",
  });

  const otherStoreScore = scoreLocationConsistency({
    entryUrl: "https://www.jexer.jp/mb/akabane/",
    candidateUrl: "https://www.jexer.jp/schedule/fitness/?shop=24",
    discoveredFrom: "ai_recommendation:https://www.jexer.jp/mb/akabane/",
    locationName: "JEXER 赤羽",
    pageText: "<html><title>JEXER 四ツ谷 スタジオスケジュール</title></html>",
  });

  assert.equal(akabaneScore.groupKey, "id:shop=17");
  assert.equal(otherStoreScore.groupKey, "id:shop=24");
  assert.ok(akabaneScore.score > otherStoreScore.score);
  assert.ok(akabaneScore.reasons.includes("full_location_text_match"));
});
