import type { SearchResult, Weekday } from "@/lib/types";
import { formatWeekday } from "@/lib/utils";

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
                  <th>開始</th>
                  <th>終了</th>
                  <th>プログラム</th>
                  <th>所要時間</th>
                  <th>スタジオ</th>
                  <th>インストラクター</th>
                </tr>
              </thead>
              <tbody>
                {group.items.map((item) => (
                  <tr key={item.schedule.id}>
                    <td>{item.schedule.start_time}</td>
                    <td>{item.schedule.end_time}</td>
                    <td>{item.program.name}</td>
                    <td>{item.schedule.duration_minutes ? `${item.schedule.duration_minutes}分` : "-"}</td>
                    <td>{item.schedule.studio_name ?? "-"}</td>
                    <td>{item.schedule.instructor_name ?? "-"}</td>
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
