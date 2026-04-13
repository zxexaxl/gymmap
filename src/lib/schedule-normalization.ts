import { normalizeProgramName } from "@/lib/normalizeProgramName";
import type { ClassSchedule } from "@/lib/types";

export function enrichScheduleWithNormalization(schedule: ClassSchedule): ClassSchedule {
  const normalized = normalizeProgramName({
    rawProgramName: schedule.raw_program_name,
    startTime: schedule.start_time,
    endTime: schedule.end_time,
  });

  return {
    ...schedule,
    canonical_program_name: normalized.canonical_program_name,
    normalized_text: normalized.normalized_text,
    comparison_key: normalized.comparison_key,
    duration_minutes: normalized.duration_minutes ?? schedule.duration_minutes,
    program_brand: normalized.program_brand,
    category_primary: normalized.category_primary,
    tags: normalized.tags,
    match_method: normalized.match_method,
    confidence: normalized.confidence,
    needs_review: normalized.needs_review,
  };
}

export function enrichSchedulesWithNormalization(schedules: ClassSchedule[]) {
  return schedules.map((schedule) => enrichScheduleWithNormalization(schedule));
}
