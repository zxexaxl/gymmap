import { weekdayLabels } from "@/lib/constants";
import type { ClassSchedule, SearchFilters, Weekday } from "@/lib/types";

export function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function getLocationAddress(prefecture?: string | null, city?: string | null, addressLine?: string | null) {
  return [prefecture, city, addressLine].filter(Boolean).join(" ");
}

export function getAreaName(prefecture?: string | null, city?: string | null) {
  return city || prefecture || "";
}

export function getLocationAreaNames(prefecture?: string | null, city?: string | null) {
  return Array.from(
    new Set([prefecture, city].filter((value): value is string => Boolean(value))),
  );
}

export function formatWeekday(weekday: Weekday) {
  return weekdayLabels[weekday];
}

export function formatDate(value?: string | null) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function formatTime(value?: string | null) {
  if (!value) {
    return "-";
  }

  const match = value.match(/^(\d{1,2}):(\d{2})/);
  return match ? `${match[1].padStart(2, "0")}:${match[2]}` : value;
}

export function getScheduleUpdatedAt(schedule: ClassSchedule) {
  return schedule.extracted_at || schedule.updated_at || null;
}

export function getLatestScheduleUpdatedAt(schedules: ClassSchedule[]) {
  return schedules.reduce<string | null>((latest, schedule) => {
    const candidate = getScheduleUpdatedAt(schedule);

    if (!candidate) {
      return latest;
    }

    const candidateTime = new Date(candidate).getTime();
    const latestTime = latest ? new Date(latest).getTime() : Number.NEGATIVE_INFINITY;

    if (Number.isNaN(candidateTime) || candidateTime <= latestTime) {
      return latest;
    }

    return candidate;
  }, null);
}

export function isDateOlderThan(value: string | null | undefined, days: number, now = new Date()) {
  if (!value) {
    return false;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  return now.getTime() - date.getTime() > days * 24 * 60 * 60 * 1000;
}

export function buildSearchQuery(filters: SearchFilters) {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });

  return params.toString();
}

export function normalizeSearchFilters(searchParams?: Record<string, string | string[] | undefined>): SearchFilters {
  const pick = (key: keyof SearchFilters) => {
    const raw = searchParams?.[key];
    if (Array.isArray(raw)) {
      return raw[0] ?? "";
    }

    return raw ?? "";
  };

  return {
    q: pick("q").trim(),
    weekday: pick("weekday").trim(),
    timeRange: pick("timeRange").trim(),
    durationRange: pick("durationRange").trim(),
    brand: pick("brand").trim(),
    area: pick("area").trim(),
  };
}

export function isTimeInRange(time: string, range: string) {
  if (!range) {
    return true;
  }

  const [hours] = time.split(":").map(Number);

  if (range === "morning") {
    return hours >= 6 && hours < 12;
  }

  if (range === "afternoon") {
    return hours >= 12 && hours < 17;
  }

  if (range === "evening") {
    return hours >= 17 && hours < 23;
  }

  return true;
}

export function isDurationInRange(durationMinutes: number | null, range: string) {
  if (!range) {
    return true;
  }

  if (durationMinutes === null) {
    return false;
  }

  if (range === "short") {
    return durationMinutes <= 45;
  }

  if (range === "medium") {
    return durationMinutes >= 46 && durationMinutes <= 59;
  }

  if (range === "long") {
    return durationMinutes >= 60;
  }

  return true;
}
