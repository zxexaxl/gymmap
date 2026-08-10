import test from "node:test";
import assert from "node:assert/strict";

import {
  formatDate,
  formatTime,
  getLatestScheduleUpdatedAt,
  getScheduleUpdatedAt,
  isDateOlderThan,
} from "../utils";
import type { ClassSchedule } from "../types";

test("formatTime removes database seconds without changing hours and minutes", () => {
  assert.equal(formatTime("07:30:00"), "07:30");
  assert.equal(formatTime("19:40"), "19:40");
  assert.equal(formatTime(null), "-");
});

test("formatDate safely handles missing and invalid values", () => {
  assert.equal(formatDate(null), "-");
  assert.equal(formatDate("not-a-date"), "-");
});

test("getScheduleUpdatedAt prefers the source extraction time", () => {
  const schedule = {
    extracted_at: "2026-08-01T10:00:00.000Z",
    updated_at: "2026-07-01T10:00:00.000Z",
  } as ClassSchedule;

  assert.equal(getScheduleUpdatedAt(schedule), "2026-08-01T10:00:00.000Z");
});

test("getLatestScheduleUpdatedAt returns the newest valid schedule timestamp", () => {
  const schedules = [
    { extracted_at: null, updated_at: "2026-07-01T10:00:00.000Z" },
    { extracted_at: "2026-08-01T10:00:00.000Z", updated_at: "2026-06-01T10:00:00.000Z" },
    { extracted_at: "not-a-date", updated_at: "2026-08-02T10:00:00.000Z" },
  ] as ClassSchedule[];

  assert.equal(getLatestScheduleUpdatedAt(schedules), "2026-08-01T10:00:00.000Z");
});

test("isDateOlderThan detects stale schedule information", () => {
  const now = new Date("2026-08-05T00:00:00.000Z");

  assert.equal(isDateOlderThan("2026-08-01T00:00:00.000Z", 45, now), false);
  assert.equal(isDateOlderThan("2026-04-14T00:00:00.000Z", 45, now), true);
});
