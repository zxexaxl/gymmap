import Link from "next/link";

import { CardSurface } from "@/components/ui";
import { buildProgramPath } from "@/lib/site";
import type { SearchResult, Weekday } from "@/lib/types";
import { formatTime, formatWeekday } from "@/lib/utils";

import styles from "./location-schedule-table.module.css";

const weekdayOrder: Weekday[] = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

type LocationScheduleTableProps = {
  schedules: SearchResult[];
};

export function LocationScheduleTable({ schedules }: LocationScheduleTableProps) {
  const grouped = weekdayOrder
    .map((weekday) => ({
      weekday,
      items: schedules.filter((item) => item.schedule.weekday === weekday),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <section className={styles.scheduleSection} id="location-schedule" aria-labelledby="location-schedule-heading">
      <div className={styles.intro}>
        <div>
          <p>WEEKLY SCHEDULE</p>
          <h2 id="location-schedule-heading">週間スケジュール</h2>
        </div>
        <span>{schedules.length}件</span>
      </div>
      {grouped.map((group) => (
        <CardSurface as="section" key={group.weekday} className={styles.dayGroup}>
          <div className={styles.dayHeading}>
            <h2>{formatWeekday(group.weekday)}</h2>
            <span>{group.items.length}件</span>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">時間</th>
                  <th scope="col">プログラム</th>
                  <th scope="col">所要時間</th>
                  <th scope="col">スタジオ</th>
                  <th scope="col">インストラクター</th>
                </tr>
              </thead>
              <tbody>
                {group.items.map((item) => (
                  <tr key={item.schedule.id}>
                    <td className={styles.time} data-label="時間">
                      <strong>{formatTime(item.schedule.start_time)}</strong>
                      <span>{formatTime(item.schedule.end_time)}まで</span>
                    </td>
                    <td className={styles.program} data-label="プログラム">
                      <strong>{item.schedule.raw_program_name}</strong>
                      {item.schedule.raw_program_name !== item.program.name ? (
                        <Link href={buildProgramPath(item.program.slug)}>
                          {item.program.name}の開催を見る
                        </Link>
                      ) : (
                        <Link href={buildProgramPath(item.program.slug)}>開催店舗を見る</Link>
                      )}
                    </td>
                    <td data-label="所要時間">
                      {item.schedule.duration_minutes ? `${item.schedule.duration_minutes}分` : "-"}
                    </td>
                    <td data-label="スタジオ">{item.schedule.studio_name ?? "-"}</td>
                    <td className={styles.instructor} data-label="インストラクター">
                      {item.schedule.instructor_name ?? "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardSurface>
      ))}
    </section>
  );
}
