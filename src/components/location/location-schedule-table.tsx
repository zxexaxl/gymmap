import type { SearchResult, Weekday } from "@/lib/types";
import { formatTime, formatWeekday } from "@/lib/utils";

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
    <div className="schedule-groups">
      {grouped.map((group) => (
        <section key={group.weekday} className="panel">
          <div className="section-heading">
            <h2>{formatWeekday(group.weekday)}</h2>
            <p className="muted">{group.items.length}件</p>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">開始</th>
                  <th scope="col">終了</th>
                  <th scope="col">プログラム</th>
                  <th scope="col">所要時間</th>
                  <th scope="col">スタジオ</th>
                  <th scope="col">インストラクター</th>
                </tr>
              </thead>
              <tbody>
                {group.items.map((item) => (
                  <tr key={item.schedule.id}>
                    <td data-label="開始">{formatTime(item.schedule.start_time)}</td>
                    <td data-label="終了">{formatTime(item.schedule.end_time)}</td>
                    <td className="schedule-program-cell" data-label="プログラム">
                      {item.program.name}
                    </td>
                    <td data-label="所要時間">
                      {item.schedule.duration_minutes ? `${item.schedule.duration_minutes}分` : "-"}
                    </td>
                    <td data-label="スタジオ">{item.schedule.studio_name ?? "-"}</td>
                    <td className="schedule-instructor-cell" data-label="インストラクター">
                      {item.schedule.instructor_name ?? "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}
