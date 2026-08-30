import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import test from "node:test";
import { renderH38ManagementApiSql, renderH38PostVerify, renderH38ProductionSql } from "../hyrox-h3-8-production-sql";

const candidate = JSON.parse(readFileSync("data/hyrox/h3-7-targeted-equipment-import-candidate.json", "utf8"));

test("H3-8 freezes the exact release and one atomic transaction", () => {
    const sql = renderH38ProductionSql(candidate);
    assert.match(sql, /dc97df4fd675d29e71425c7720ede609234c749da305aa5249f8dcfc3c32c255/);
    assert.equal(sql.match(/\bbegin;/gi)?.length, 1);
    assert.equal(sql.match(/\bcommit;/gi)?.length, 1);
    assert.doesNotMatch(sql, /on conflict|update training_|update location_/);
    const apiSql = renderH38ManagementApiSql(candidate);
    assert.doesNotMatch(apiSql, /\\set/);
    assert.equal(apiSql.match(/\bbegin;/gi)?.length, 1);
    assert.equal(apiSql.match(/\bcommit;/gi)?.length, 1);
});

test("H3-8 asserts the exact graph, baseline, publication and invariants", () => {
    const sql = renderH38ProductionSql(candidate);
    for (const fragment of ["16::bigint,73::bigint,25::bigint,98::bigint", "108::bigint,109::bigint,41::bigint,314::bigint", "existing enrichment changed", "search projection mismatch"]) {
      assert.ok(sql.includes(fragment));
    }
    assert.ok(renderH38PostVerify(candidate).includes("matched_evidence"));
});
