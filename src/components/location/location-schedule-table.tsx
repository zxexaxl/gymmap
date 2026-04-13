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
          <h2>{formatWeekday(group.weekday)}</h2>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>開始</th>
                  <th>終了</th>
                  <th>プログラム</th>
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
