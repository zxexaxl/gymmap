import test from "node:test";
import assert from "node:assert/strict";

import { classifyScheduleEntryType } from "../extraction/entry-type-classifier";

test("regular studio lessons stay as regular_class", () => {
  const result = classifyScheduleEntryType({
    rawProgramName: "BODYCOMBAT 45",
    aiCandidate: "regular_class",
  });

  assert.equal(result.entryType, "regular_class");
});

test("support and personal entries are filtered as non-regular", () => {
  const support = classifyScheduleEntryType({
    rawProgramName: "マンツーマンサポート",
  });
  const personal = classifyScheduleEntryType({
    rawProgramName: "パーソナルトレーニング",
  });

  assert.equal(support.entryType, "support_session");
  assert.equal(personal.entryType, "personal_session");
});

test("school and member-guidance entries are filtered as non-regular", () => {
  const school = classifyScheduleEntryType({
    rawProgramName: "キッズスクール",
  });
  const guidance = classifyScheduleEntryType({
    rawProgramName: "大人の休日倶楽部 会員案内",
  });

  assert.equal(school.entryType, "school_course");
  assert.equal(guidance.entryType, "member_guidance");
});
