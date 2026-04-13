import test from "node:test";
import assert from "node:assert/strict";

import { normalizeProgramName } from "../normalizeProgramName";

test("uses start and end time first for duration", () => {
  const result = normalizeProgramName({
    rawProgramName: "BODYCOMBAT 60",
    startTime: "19:00",
    endTime: "19:45",
  });

  assert.equal(result.duration_minutes, 45);
  assert.equal(result.canonical_program_name, "BODYCOMBAT");
  assert.equal(result.match_method, "exact");
});

test("extracts duration from raw program name when time is missing", () => {
  const result = normalizeProgramName({
    rawProgramName: "BODYPUMP 30",
  });

  assert.equal(result.duration_minutes, 30);
  assert.equal(result.canonical_program_name, "BODYPUMP");
});

test("normalizes japanese yoga variants through similarity matching", () => {
  const result = normalizeProgramName({
    rawProgramName: "ホットヨガ",
  });

  assert.equal(result.canonical_program_name, "ヨガ");
  assert.equal(result.match_method, "similar");
  assert.equal(result.needs_review, true);
  assert.ok(result.confidence >= 0.78);
});

test("matches pilates variants without a large alias dictionary", () => {
  const result = normalizeProgramName({
    rawProgramName: "ピラティス ベーシック 50",
  });

  assert.equal(result.canonical_program_name, "ピラティス");
  assert.equal(result.duration_minutes, 50);
});

test("returns unresolved for ambiguous names", () => {
  const result = normalizeProgramName({
    rawProgramName: "ボディメイク サーキット",
  });

  assert.equal(result.canonical_program_name, null);
  assert.equal(result.match_method, "unresolved");
  assert.equal(result.needs_review, true);
});
