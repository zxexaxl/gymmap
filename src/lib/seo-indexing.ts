const minimumAreaLocationCount = 2;
const minimumAreaScheduleCount = 4;

export function shouldIndexAreaProgramPage({
  locationCount,
  scheduleCount,
}: {
  locationCount: number;
  scheduleCount: number;
}) {
  return locationCount >= minimumAreaLocationCount && scheduleCount >= minimumAreaScheduleCount;
}
