import { CENTRAL_CLUB_SEARCH_URL } from "./central-adapter";

export type CentralExtractionTarget = {
  slug: string;
  locationName: string;
  sourceUrl: string;
  kind: "brand";
};

export const centralTokyoTargets: CentralExtractionTarget[] = [
  {
    slug: "tokyo-central-studios",
    locationName: "Central Sports 東京都内クラブ一括",
    sourceUrl: CENTRAL_CLUB_SEARCH_URL,
    kind: "brand",
  },
];

export function findCentralTarget(slug: string) {
  return centralTokyoTargets.find((target) => target.slug === slug) ?? null;
}
