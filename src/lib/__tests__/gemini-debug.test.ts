import test from "node:test";
import assert from "node:assert/strict";

import { buildParsedGeminiDebugArtifacts } from "../extraction/gemini-debug";

test("buildParsedGeminiDebugArtifacts returns pretty parsed JSON for valid text", () => {
  const artifacts = buildParsedGeminiDebugArtifacts('{"records":[{"location_name":"府中","weekday":"friday"}]}');

  assert.equal(artifacts.parseErrorJson, null);
  assert.match(artifacts.parsedJson ?? "", /"records"/);
  assert.match(artifacts.parsedJson ?? "", /"location_name": "府中"/);
});

test("buildParsedGeminiDebugArtifacts returns parse error JSON for invalid text", () => {
  const artifacts = buildParsedGeminiDebugArtifacts("{records:[invalid]}");

  assert.equal(artifacts.parsedJson, null);
  assert.match(artifacts.parseErrorJson ?? "", /raw_text_preview/);
  assert.match(artifacts.parseErrorJson ?? "", /Expected property name|expected property name/i);
});
