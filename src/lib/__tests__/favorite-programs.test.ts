import test from "node:test";
import assert from "node:assert/strict";

import { maximumFavoritePrograms, parseFavoritePrograms } from "../favorite-programs";

test("favorite programs are parsed from local storage", () => {
  assert.deepEqual(
    parseFavoritePrograms(JSON.stringify([{ id: "program-1", slug: "bodycombat", name: "BODYCOMBAT" }])),
    [{ id: "program-1", slug: "bodycombat", name: "BODYCOMBAT" }],
  );
});

test("invalid favorite program entries are ignored and the list is limited", () => {
  const entries = Array.from({ length: maximumFavoritePrograms + 3 }, (_, index) => ({
    id: `program-${index}`,
    slug: `program-${index}`,
    name: `Program ${index}`,
  }));

  assert.equal(parseFavoritePrograms(JSON.stringify([...entries, { id: 1 }])).length, maximumFavoritePrograms);
  assert.deepEqual(parseFavoritePrograms("not-json"), []);
});
