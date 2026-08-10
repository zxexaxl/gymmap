import assert from "node:assert/strict";
import test from "node:test";

import { featuredProgramShortcuts, getFeaturedProgramBrand, supplementalLandingProgramNames } from "../featured-programs";

test("supplemental branded programs are available for discovery and landing pages", () => {
  assert.equal(getFeaturedProgramBrand("FIGHT DO"), "Radical Fitness");
  assert.equal(getFeaturedProgramBrand("UBOUND"), "Radical Fitness");
  assert.deepEqual(supplementalLandingProgramNames, ["BODYBALANCE", "BODYSTEP", "FIGHT DO", "UBOUND", "X55", "OXIGENO"]);
});

test("variant-based programs use search shortcuts instead of incomplete favorites", () => {
  assert.deepEqual(
    featuredProgramShortcuts.map(({ name, brand }) => ({ name, brand })),
    [
      { name: "BODYATTACK", brand: "Les Mills" },
      { name: "BODYJAM", brand: "Les Mills" },
      { name: "BODYBALANCE", brand: "Les Mills" },
      { name: "BODYSTEP", brand: "Les Mills" },
      { name: "X55", brand: "Radical Fitness" },
      { name: "OXIGENO", brand: "Radical Fitness" },
      { name: "Group Fight", brand: "MOSSA" },
      { name: "Group Power", brand: "MOSSA" },
      { name: "Group Groove", brand: "MOSSA" },
    ],
  );
});

test("existing normalized brand programs remain available", () => {
  assert.equal(getFeaturedProgramBrand("BODYCOMBAT"), "Les Mills");
  assert.equal(getFeaturedProgramBrand("ZUMBA"), "ZUMBA");
  assert.equal(getFeaturedProgramBrand("ヨガ"), null);
});
