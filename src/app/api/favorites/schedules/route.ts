import { NextResponse } from "next/server";

import { getFavoriteScheduleWeek } from "@/lib/data";
import type { FavoriteScheduleResponse } from "@/lib/favorite-programs";

export const dynamic = "force-dynamic";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const programIds = searchParams.getAll("programId").filter((value) => uuidPattern.test(value)).slice(0, 8);
  const area = searchParams.get("area") ?? "";
  const parsedStartWeekday = Number.parseInt(searchParams.get("startWeekday") ?? "0", 10);
  const startWeekday = Number.isFinite(parsedStartWeekday) ? parsedStartWeekday : 0;

  if (!programIds.length) {
    return NextResponse.json<FavoriteScheduleResponse>({
      items: [],
      totalResults: 0,
      latestScheduleUpdate: null,
    });
  }

  try {
    const week = await getFavoriteScheduleWeek(programIds, area, startWeekday);

    return NextResponse.json<FavoriteScheduleResponse>(
      {
        items: week.results.map((item) => ({
          scheduleId: item.schedule.id,
          weekday: item.schedule.weekday,
          startTime: item.schedule.start_time,
          endTime: item.schedule.end_time,
          durationMinutes: item.schedule.duration_minutes,
          rawProgramName: item.schedule.raw_program_name,
          program: {
            id: item.program.id,
            slug: item.program.slug,
            name: item.program.name,
          },
          location: {
            name: item.location.name,
            slug: item.location.slug,
            prefecture: item.location.prefecture,
            city: item.location.city,
          },
          brandName: item.brand.name,
        })),
        totalResults: week.totalResults,
        latestScheduleUpdate: week.latestScheduleUpdate,
      },
      {
        headers: {
          "Cache-Control": "private, no-store",
        },
      },
    );
  } catch (error) {
    console.error("Failed to load favorite schedule week:", error instanceof Error ? error.message : String(error));
    return NextResponse.json({ message: "お気に入りのスケジュールを取得できませんでした。" }, { status: 500 });
  }
}
