import { normalizeSearchKeyword } from "@/lib/search-query";
import type { GymLocation, StructuredAreaOption, StoreSearchOption } from "@/lib/types";

const administrativeSuffixPattern = /^(.+?[市区町村])/u;

export function deriveMunicipality(city?: string | null) {
  const normalized = city?.normalize("NFKC").replace(/\s+/g, "").trim() ?? "";
  const match = normalized.match(administrativeSuffixPattern);
  const municipality = match?.[1] ?? "";

  if (municipality.length < 2 || /^[市区町村]$/u.test(municipality)) {
    return "";
  }

  return municipality;
}

export function getStructuredAreaLabel(prefecture: string, municipality = "") {
  return [prefecture.trim(), municipality.trim()].filter(Boolean).join(" ");
}

function searchableAliases(value: string) {
  const normalized = normalizeSearchKeyword(value);
  const withoutSuffix = normalized.replace(/[都道府県市区町村]$/u, "");
  return Array.from(new Set([normalized, withoutSuffix].filter(Boolean)));
}

export function buildStructuredAreaCatalog(locations: GymLocation[]): StructuredAreaOption[] {
  const prefectureCounts = new Map<string, Set<string>>();
  const municipalityCounts = new Map<string, Set<string>>();

  locations.forEach((location) => {
    const prefecture = location.prefecture?.trim() ?? "";
    if (!prefecture) return;

    const prefectureLocations = prefectureCounts.get(prefecture) ?? new Set<string>();
    prefectureLocations.add(location.id);
    prefectureCounts.set(prefecture, prefectureLocations);

    const municipality = deriveMunicipality(location.city);
    if (!municipality) return;

    const key = `${prefecture}\u0000${municipality}`;
    const municipalityLocations = municipalityCounts.get(key) ?? new Set<string>();
    municipalityLocations.add(location.id);
    municipalityCounts.set(key, municipalityLocations);
  });

  const prefectures = Array.from(prefectureCounts, ([prefecture, locationIds]) => ({
    type: "prefecture" as const,
    prefecture,
    municipality: "",
    label: prefecture,
    count: locationIds.size,
    searchableText: searchableAliases(prefecture).join(" "),
  }));
  const municipalities = Array.from(municipalityCounts, ([key, locationIds]) => {
    const [prefecture, municipality] = key.split("\u0000");
    return {
      type: "municipality" as const,
      prefecture,
      municipality,
      label: getStructuredAreaLabel(prefecture, municipality),
      count: locationIds.size,
      searchableText: [
        ...searchableAliases(prefecture),
        ...searchableAliases(municipality),
        normalizeSearchKeyword(getStructuredAreaLabel(prefecture, municipality)),
      ].join(" "),
    };
  });

  return [...prefectures, ...municipalities].sort((left, right) =>
    left.prefecture.localeCompare(right.prefecture, "ja")
      || left.type.localeCompare(right.type)
      || left.municipality.localeCompare(right.municipality, "ja"),
  );
}

export function buildStoreSearchOptions(locations: GymLocation[]): StoreSearchOption[] {
  return locations.map((location) => ({
    id: location.id,
    name: location.name,
    brandName: location.brand?.name ?? "",
    areaLabel: getStructuredAreaLabel(location.prefecture ?? "", deriveMunicipality(location.city)),
    searchableText: normalizeSearchKeyword([
      location.name,
      location.brand?.name,
      location.prefecture,
      location.city,
    ].filter(Boolean).join(" ")),
  }));
}

function matchScore(query: string, candidates: string[]) {
  if (candidates.some((candidate) => candidate === query)) return 3;
  if (candidates.some((candidate) => candidate.startsWith(query))) return 2;
  if (candidates.some((candidate) => candidate.includes(query))) return 1;
  return 0;
}

export function rankStructuredAreas(options: StructuredAreaOption[], value: string, limit = 6) {
  const query = normalizeSearchKeyword(value);
  if (!query) return [];

  return options
    .map((option) => ({
      option,
      score: matchScore(query, [
        normalizeSearchKeyword(option.label),
        ...searchableAliases(option.prefecture),
        ...searchableAliases(option.municipality),
      ].filter(Boolean)),
    }))
    .filter(({ score }) => score > 0)
    .sort((left, right) => right.score - left.score
      || Number(left.option.type === "municipality") - Number(right.option.type === "municipality")
      || right.option.count - left.option.count
      || left.option.label.localeCompare(right.option.label, "ja"))
    .slice(0, limit)
    .map(({ option }) => option);
}

export function rankStoreSearchOptions(options: StoreSearchOption[], value: string, limit = 5) {
  const query = normalizeSearchKeyword(value);
  if (!query) return [];

  return options
    .map((option) => ({
      option,
      score: matchScore(query, [normalizeSearchKeyword(option.name), normalizeSearchKeyword(option.brandName), option.searchableText]),
    }))
    .filter(({ score }) => score > 0)
    .sort((left, right) => right.score - left.score || left.option.name.localeCompare(right.option.name, "ja"))
    .slice(0, limit)
    .map(({ option }) => option);
}

export function locationMatchesStructuredArea(
  location: Pick<GymLocation, "prefecture" | "city">,
  prefecture: string,
  municipality = "",
) {
  if ((location.prefecture?.trim() ?? "") !== prefecture.trim()) return false;
  return !municipality || deriveMunicipality(location.city) === municipality.trim();
}
