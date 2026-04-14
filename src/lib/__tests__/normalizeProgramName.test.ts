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
  assert.equal(result.program_brand, "Les Mills");
  assert.equal(result.category_primary, "cardio");
  assert.equal(result.match_method, "exact");
});

test("extracts duration from raw program name when time is missing", () => {
  const result = normalizeProgramName({
    rawProgramName: "BODYPUMP 30",
  });

  assert.equal(result.duration_minutes, 30);
  assert.equal(result.canonical_program_name, "BODYPUMP");
});

test("treats safe brand variants as similar without review", () => {
  const bodycombat = normalizeProgramName({
    rawProgramName: "ﾎﾞﾃﾞｨｺﾝﾊﾞｯﾄ45",
  });
  const bodypump = normalizeProgramName({
    rawProgramName: "ﾎﾞﾃﾞｨﾊﾞﾝﾌﾟ60",
  });

  assert.equal(bodycombat.canonical_program_name, "BODYCOMBAT");
  assert.equal(bodycombat.program_brand, "Les Mills");
  assert.equal(bodycombat.needs_review, false);
  assert.equal(bodypump.canonical_program_name, "BODYPUMP");
  assert.equal(bodypump.program_brand, "Les Mills");
  assert.equal(bodypump.needs_review, false);
});

test("normalizes japanese yoga variants through similarity matching", () => {
  const result = normalizeProgramName({
    rawProgramName: "ホットヨガ",
  });

  assert.equal(result.canonical_program_name, "ヨガ");
  assert.equal(result.match_method, "similar");
  assert.equal(result.needs_review, false);
  assert.ok(result.confidence >= 0.78);
});

test("matches pilates variants without a large alias dictionary", () => {
  const result = normalizeProgramName({
    rawProgramName: "ピラティス ベーシック 50",
  });

  assert.equal(result.canonical_program_name, "ピラティス");
  assert.equal(result.duration_minutes, 50);
  assert.equal(result.category_primary, "mind_body");
});

test("matches frequent unresolved candidates with the small master", () => {
  const aerobics = normalizeProgramName({
    rawProgramName: "AEROBICS 45",
  });
  const zumba = normalizeProgramName({
    rawProgramName: "ｽﾞﾝﾊﾞ 45",
  });
  const ritmos = normalizeProgramName({
    rawProgramName: "ﾘﾄﾓｽ 45",
  });
  const kickbox = normalizeProgramName({
    rawProgramName: "キックボックス 45",
  });
  const step = normalizeProgramName({
    rawProgramName: "ステップ 30",
  });
  const rpb = normalizeProgramName({
    rawProgramName: "RPBｺﾝﾄﾛｰﾙ",
  });
  const bailaBaila = normalizeProgramName({
    rawProgramName: "ﾊﾞｲﾗﾊﾞｲﾗ 45",
  });

  assert.equal(aerobics.canonical_program_name, "エアロビクス");
  assert.equal(aerobics.category_primary, "cardio");
  assert.equal(zumba.canonical_program_name, "ZUMBA");
  assert.equal(zumba.program_brand, "ZUMBA");
  assert.equal(zumba.category_primary, "dance");
  assert.equal(ritmos.canonical_program_name, "リトモス");
  assert.equal(ritmos.program_brand, "Radical Fitness");
  assert.equal(ritmos.category_primary, "dance");
  assert.equal(kickbox.canonical_program_name, "キックボックス");
  assert.equal(kickbox.category_primary, "martial_arts");
  assert.equal(step.canonical_program_name, "ステップ");
  assert.equal(step.category_primary, "cardio");
  assert.equal(rpb.canonical_program_name, "RPBコントロール");
  assert.equal(rpb.category_primary, "conditioning");
  assert.equal(bailaBaila.canonical_program_name, "バイラバイラ");
  assert.equal(bailaBaila.program_brand, "BAILA BAILA");
});

test("matches additional studio programs with fixed categories", () => {
  const circuit = normalizeProgramName({
    rawProgramName: "ｻｰｷｯﾄ 30",
  });
  const teambike = normalizeProgramName({
    rawProgramName: "ﾁｰﾑﾊﾞｲｸ 45",
  });
  const shapeBoxing = normalizeProgramName({
    rawProgramName: "シェイプボクシング",
  });
  const balletone = normalizeProgramName({
    rawProgramName: "バレトン 45",
  });
  const megadance = normalizeProgramName({
    rawProgramName: "ﾒｶﾞﾀﾞﾝｽ 45",
  });
  const pelvicStretch = normalizeProgramName({
    rawProgramName: "ペルビックストレッチ 30",
  });
  const pelvicPilates = normalizeProgramName({
    rawProgramName: "骨盤引締めピラティス",
  });
  const dddHouse = normalizeProgramName({
    rawProgramName: "DDD HOUSE WORKOUT 45",
  });
  const voltage = normalizeProgramName({
    rawProgramName: "VOLTAGE",
  });
  const beatEx = normalizeProgramName({
    rawProgramName: "BEAT-EX",
  });
  const bodyCare = normalizeProgramName({
    rawProgramName: "ﾎﾞﾃﾞｨｹｱ",
  });

  assert.equal(circuit.canonical_program_name, "サーキット");
  assert.equal(circuit.category_primary, "conditioning");
  assert.equal(teambike.canonical_program_name, "チームバイク");
  assert.equal(teambike.program_brand, null);
  assert.equal(teambike.category_primary, "cycling");
  assert.equal(shapeBoxing.canonical_program_name, "シェイプボクシング");
  assert.equal(shapeBoxing.category_primary, "martial_arts");
  assert.equal(balletone.canonical_program_name, "バレトン");
  assert.equal(balletone.category_primary, "mind_body");
  assert.equal(megadance.canonical_program_name, "メガダンス");
  assert.equal(megadance.program_brand, "Radical Fitness");
  assert.equal(megadance.category_primary, "dance");
  assert.equal(pelvicStretch.canonical_program_name, "ペルビックストレッチ");
  assert.equal(pelvicStretch.category_primary, "mind_body");
  assert.equal(pelvicPilates.canonical_program_name, "ピラティス");
  assert.equal(pelvicPilates.needs_review, false);
  assert.equal(dddHouse.canonical_program_name, "DDD HOUSE WORKOUT");
  assert.equal(dddHouse.category_primary, "dance");
  assert.equal(voltage.canonical_program_name, "VOLTAGE");
  assert.equal(voltage.category_primary, "conditioning");
  assert.equal(beatEx.canonical_program_name, "BEAT-EX");
  assert.equal(beatEx.category_primary, "cardio");
  assert.equal(bodyCare.canonical_program_name, "ボディケア");
  assert.equal(bodyCare.category_primary, "mind_body");
});

test("prefers manually confirmed master rules over later heuristics", () => {
  const teamBike = normalizeProgramName({
    rawProgramName: "TEAM BIKE 45",
  });
  const bailaBaila = normalizeProgramName({
    rawProgramName: "BAILA BAILA 45",
  });

  assert.equal(teamBike.canonical_program_name, "チームバイク");
  assert.equal(teamBike.program_brand, null);
  assert.equal(teamBike.manually_confirmed, true);
  assert.equal(teamBike.source_of_truth, "manual_confirmed");
  assert.equal(teamBike.needs_review, false);

  assert.equal(bailaBaila.canonical_program_name, "バイラバイラ");
  assert.equal(bailaBaila.program_brand, "BAILA BAILA");
  assert.equal(bailaBaila.manually_confirmed, true);
  assert.equal(bailaBaila.source_of_truth, "manual_confirmed");
});

test("returns unresolved for ambiguous names", () => {
  const result = normalizeProgramName({
    rawProgramName: "ボディメイク プログラム",
  });

  assert.equal(result.canonical_program_name, null);
  assert.equal(result.match_method, "unresolved");
  assert.equal(result.needs_review, true);
  assert.equal(result.source_of_truth, "raw_unresolved");
});
