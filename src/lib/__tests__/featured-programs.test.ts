import assert from "node:assert/strict";
import test from "node:test";

import { getFeaturedProgramBrand, supplementalLandingProgramNames } from "../featured-programs";

test("supplemental branded programs are available for discovery and landing pages", () => {
  assert.equal(getFeaturedProgramBrand("FIGHT DO"), "Radical Fitness");
  assert.equal(getFeaturedProgramBrand("UBOUND"), "Radical Fitness");
  assert.deepEqual(supplementalLandingProgramNames, ["FIGHT DO", "UBOUND"]);
});

test("existing normalized brand programs remain available", () => {
  assert.equal(getFeaturedProgramBrand("BODYCOMBAT"), "Les Mills");
  assert.equal(getFeaturedProgramBrand("ZUMBA"), "ZUMBA");
  assert.equal(getFeaturedProgramBrand("ヨガ"), null);
});
