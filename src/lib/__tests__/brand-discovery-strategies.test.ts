import test from "node:test";
import assert from "node:assert/strict";

import { getBrandDiscoveryStrategy } from "../extraction/brand-discovery-strategies";

test("JEXER brand strategy strongly prefers program schedule links", () => {
  const strategy = getBrandDiscoveryStrategy("https://www.jexer.jp/mb/ueno/");
  assert.ok(strategy);

  const preferred = strategy.scoreCandidate({
    candidateUrl: "https://www.jexer.jp/mb/ueno/schedule/index.html",
    linkText: "プログラムスケジュール",
    discoveredFrom: "https://www.jexer.jp/mb/ueno/",
  });

  const deprioritized = strategy.scoreCandidate({
    candidateUrl: "https://www.jexer.jp/lightgym/",
    linkText: "Light Gym",
    discoveredFrom: "https://www.jexer.jp/mb/ueno/",
  });

  assert.ok(preferred.score > deprioritized.score);
  assert.ok(preferred.reasons.includes("brand_priority:program_schedule"));
  assert.ok(deprioritized.reasons.some((reason) => reason.startsWith("brand_downrank:")));
});
