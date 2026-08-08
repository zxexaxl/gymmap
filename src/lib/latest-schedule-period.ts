export type PeriodScopedSchedule = {
  location_id: string;
  valid_from: string | null;
};

export function getLatestSchedulePeriodByLocation(rows: PeriodScopedSchedule[]) {
  const latestPeriodByLocation = new Map<string, string>();

  for (const row of rows) {
    if (!row.valid_from) continue;
    const current = latestPeriodByLocation.get(row.location_id);
    if (!current || row.valid_from > current) latestPeriodByLocation.set(row.location_id, row.valid_from);
  }

  return latestPeriodByLocation;
}

/**
 * Keep only the newest dated schedule period for each location.
 *
 * Legacy locations whose rows all have valid_from=null are left unchanged. Once
 * a location receives a month-scoped import, its undated legacy rows and older
 * dated periods are hidden from public views while remaining in the database.
 */
export function filterLatestSchedulePeriods<T extends PeriodScopedSchedule>(
  rows: T[],
  latestPeriodByLocation = getLatestSchedulePeriodByLocation(rows),
): T[] {
  return rows.filter((row) => {
    const latest = latestPeriodByLocation.get(row.location_id);
    return !latest || row.valid_from === latest;
  });
}
