import type { SearchFilters, Weekday } from "@/lib/types";

export const weekdayOptions: { value: "" | Weekday; label: string }[] = [
  { value: "", label: "指定なし" },
  { value: "monday", label: "月曜" },
  { value: "tuesday", label: "火曜" },
  { value: "wednesday", label: "水曜" },
  { value: "thursday", label: "木曜" },
  { value: "friday", label: "金曜" },
  { value: "saturday", label: "土曜" },
  { value: "sunday", label: "日曜" },
];

export const weekdayLabels: Record<Weekday, string> = {
  monday: "月曜",
  tuesday: "火曜",
  wednesday: "水曜",
  thursday: "木曜",
  friday: "金曜",
  saturday: "土曜",
  sunday: "日曜",
};

export const timeRangeOptions = [
  { value: "", label: "指定なし" },
  { value: "morning", label: "朝 (06:00-11:59)" },
  { value: "afternoon", label: "昼 (12:00-16:59)" },
  { value: "evening", label: "夕方以降 (17:00-22:59)" },
];

export const defaultSearchFilters: SearchFilters = {
  q: "",
  weekday: "",
  timeRange: "",
  brand: "",
  area: "",
};
