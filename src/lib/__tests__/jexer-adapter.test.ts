import test from "node:test";
import assert from "node:assert/strict";

import { buildJexerSharedScheduleUrl } from "../extraction/jexer-adapter";
import { findJexerTarget } from "../extraction/jexer-targets";

test("buildJexerSharedScheduleUrl builds the canonical shared schedule endpoint", () => {
  assert.equal(buildJexerSharedScheduleUrl(32), "https://www.jexer.jp/schedule/fitness/?shop=32");
});

test("JEXER store targets use the shared schedule adapter", () => {
  const otsuka = findJexerTarget("otsuka");
  const shinjuku = findJexerTarget("shinjuku");

  assert.equal(otsuka?.adapter, "jexer_shared_schedule");
  assert.equal(otsuka?.shopId, 32);
  assert.equal(otsuka?.sourceUrl, "https://www.jexer.jp/schedule/fitness/?shop=32");

  assert.equal(shinjuku?.adapter, "jexer_shared_schedule");
  assert.equal(shinjuku?.shopId, 25);
  assert.equal(shinjuku?.sourceUrl, "https://www.jexer.jp/schedule/fitness/?shop=25");
});
