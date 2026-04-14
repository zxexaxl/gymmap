import test from "node:test";
import assert from "node:assert/strict";

import { classifyScheduleEntryType } from "../extraction/entry-type-classifier";

test("regular studio lessons stay as regular_class", () => {
  const result = classifyScheduleEntryType({
    rawProgramName: "BODYCOMBAT 45",
    aiCandidate: "regular_class",
  });

  assert.equal(result.entryType, "regular_class");
  assert.equal(result.excludedCandidate, false);
  assert.equal(result.suspectNonRegular, false);
});

test("support and personal entries are kept but flagged as suspect", () => {
  const support = classifyScheduleEntryType({
    rawProgramName: "マンツーマンサポート",
  });
  const personal = classifyScheduleEntryType({
    rawProgramName: "パーソナルトレーニング",
  });

  assert.equal(support.entryType, "support_session");
  assert.equal(personal.entryType, "personal_session");
  assert.equal(support.excludedCandidate, false);
  assert.equal(personal.excludedCandidate, false);
  assert.equal(support.suspectNonRegular, true);
  assert.equal(personal.suspectNonRegular, true);
});

test("school and member-guidance entries are kept but flagged as suspect", () => {
  const school = classifyScheduleEntryType({
    rawProgramName: "キッズスクール",
  });
  const guidance = classifyScheduleEntryType({
    rawProgramName: "大人の休日倶楽部 会員案内",
  });

  assert.equal(school.entryType, "school_course");
  assert.equal(guidance.entryType, "member_guidance");
  assert.equal(school.excludedCandidate, false);
  assert.equal(guidance.excludedCandidate, false);
  assert.equal(school.suspectNonRegular, true);
  assert.equal(guidance.suspectNonRegular, true);
});

test("obvious non-class content is excluded", () => {
  const note = classifyScheduleEntryType({
    rawProgramName: "※営業時間のご案内",
  });
  const heading = classifyScheduleEntryType({
    rawProgramName: "プログラムスケジュール",
  });

  assert.equal(note.entryType, "excluded_candidate");
  assert.equal(heading.entryType, "excluded_candidate");
  assert.equal(note.excludedCandidate, true);
  assert.equal(heading.excludedCandidate, true);
});
