import test from "node:test";
import assert from "node:assert/strict";

import { countSharedLeadingSegments, getOrigin, getPathSegments, normalizeUrlLikeInput, scoreCandidateUrl } from "../extraction/discovery-url-utils";

test("normalizeUrlLikeInput strips internal prefixes before URL parsing", () => {
  assert.equal(
    normalizeUrlLikeInput("ai_recommendation:https://www.jexer.jp/mb/ikebukuro/index.html"),
    "https://www.jexer.jp/mb/ikebukuro/index.html",
  );
  assert.equal(
    normalizeUrlLikeInput("index_link_collection:https://www.jexer.jp/mb/kameido/"),
    "https://www.jexer.jp/mb/kameido/",
  );
});

test("getPathSegments and origin work with prefixed internal strings", () => {
  assert.deepEqual(getPathSegments("ai_recommendation:https://www.jexer.jp/mb/ikebukuro/index.html"), ["mb", "ikebukuro", "index.html"]);
  assert.equal(getOrigin("ai_recommendation:https://www.jexer.jp/mb/ikebukuro/index.html"), "https://www.jexer.jp");
});

test("scoreCandidateUrl does not crash on prefixed discoveredFrom values", () => {
  const score = scoreCandidateUrl({
    candidateUrl: "https://www.jexer.jp/mb/ikebukuro/schedule/fitness.html",
    entryUrl: "https://www.jexer.jp/mb/ikebukuro/index.html",
    discoveredFrom: "ai_recommendation:https://www.jexer.jp/mb/ikebukuro/index.html",
  });

  assert.ok(score.score > 0);
  assert.ok(score.reasons.includes("close_to_parent"));
  assert.ok(countSharedLeadingSegments("https://www.jexer.jp/mb/ikebukuro/schedule/fitness.html", "ai_recommendation:https://www.jexer.jp/mb/ikebukuro/index.html") >= 2);
});
