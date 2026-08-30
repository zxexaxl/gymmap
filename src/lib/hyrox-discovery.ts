import type { Database } from "@/lib/database.types";

export const HYROX_DISCIPLINE_SLUG = "hyrox";
export const HYROX_PAGE_SIZE = 100;
export const HYROX_URL_BATCH_SIZE = 100;
export const HYROX_UNKNOWN_DATA_NOTICE =
  "掲載がない設備・自主練・クラスについて、未確認であることを「なし」や「利用不可」とは判定していません。";

export type HyroxSearchRow =
  Database["public"]["Functions"]["search_training_locations"]["Returns"][number];

export type HyroxOfficialUrlRow = Pick<
  Database["public"]["Tables"]["gym_locations"]["Row"],
  "id" | "official_url"
>;

export type HyroxDiscoveryLocation = {
  id: string;
  slug: string;
  name: string;
  brandId: string;
  brandName: string;
  prefecture: string;
  city: string;
  address: string;
  latitude: number;
  longitude: number;
  official: true;
  officialUrl: string | null;
  lastConfirmedAt: string;
};

export type HyroxDiscoveryData = {
  locations: HyroxDiscoveryLocation[];
  totalCount: number;
  missingOfficialUrlCount: number;
};

export type HyroxDiscoveryGateway = {
  searchPage: (offset: number, limit: number) => Promise<HyroxSearchRow[]>;
  loadOfficialUrls: (locationIds: string[]) => Promise<HyroxOfficialUrlRow[]>;
};

export class HyroxDiscoveryDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "HyroxDiscoveryDataError";
  }
}

const prefectureOrder = [
  "北海道",
  "青森県",
  "岩手県",
  "宮城県",
  "秋田県",
  "山形県",
  "福島県",
  "茨城県",
  "栃木県",
  "群馬県",
  "埼玉県",
  "千葉県",
  "東京都",
  "神奈川県",
  "新潟県",
  "富山県",
  "石川県",
  "福井県",
  "山梨県",
  "長野県",
  "岐阜県",
  "静岡県",
  "愛知県",
  "三重県",
  "滋賀県",
  "京都府",
  "大阪府",
  "兵庫県",
  "奈良県",
  "和歌山県",
  "鳥取県",
  "島根県",
  "岡山県",
  "広島県",
  "山口県",
  "徳島県",
  "香川県",
  "愛媛県",
  "高知県",
  "福岡県",
  "佐賀県",
  "長崎県",
  "熊本県",
  "大分県",
  "宮崎県",
  "鹿児島県",
  "沖縄県",
] as const;

const prefectureOrderIndex = new Map<string, number>(
  prefectureOrder.map((prefecture, index) => [prefecture, index]),
);

export function comparePrefectures(left: string, right: string) {
  const leftIndex = prefectureOrderIndex.get(left) ?? Number.MAX_SAFE_INTEGER;
  const rightIndex = prefectureOrderIndex.get(right) ?? Number.MAX_SAFE_INTEGER;

  return leftIndex - rightIndex || left.localeCompare(right, "ja");
}

export function getHyroxPrefectureOptions(locations: HyroxDiscoveryLocation[]) {
  const counts = new Map<string, number>();

  locations.forEach((location) => {
    counts.set(location.prefecture, (counts.get(location.prefecture) ?? 0) + 1);
  });

  return Array.from(counts, ([prefecture, count]) => ({ prefecture, count })).sort((left, right) =>
    comparePrefectures(left.prefecture, right.prefecture),
  );
}

export function filterHyroxLocations(locations: HyroxDiscoveryLocation[], prefecture: string) {
  return prefecture ? locations.filter((location) => location.prefecture === prefecture) : locations;
}

function splitIntoBatches<T>(items: T[], batchSize: number) {
  const batches: T[][] = [];

  for (let offset = 0; offset < items.length; offset += batchSize) {
    batches.push(items.slice(offset, offset + batchSize));
  }

  return batches;
}

export async function loadCompleteHyroxDiscoveryData(
  gateway: HyroxDiscoveryGateway,
): Promise<HyroxDiscoveryData> {
  const rowsByLocationId = new Map<string, HyroxSearchRow>();
  let expectedTotal: number | null = null;
  let offset = 0;

  while (expectedTotal === null || offset < expectedTotal) {
    const page = await gateway.searchPage(offset, HYROX_PAGE_SIZE);

    if (page.length === 0) {
      if (expectedTotal === null || expectedTotal === 0) {
        expectedTotal = 0;
        break;
      }

      throw new HyroxDiscoveryDataError(
        `HYROX publication pagination ended at offset ${offset} before total ${expectedTotal}.`,
      );
    }

    const pageTotal = page[0]?.total_count ?? 0;

    if (expectedTotal === null) {
      expectedTotal = pageTotal;
    } else if (pageTotal !== expectedTotal) {
      throw new HyroxDiscoveryDataError(
        `HYROX publication total changed during pagination (${expectedTotal} to ${pageTotal}).`,
      );
    }

    page.forEach((row) => {
      if (!row.official) {
        throw new HyroxDiscoveryDataError(`Non-official location leaked into official HYROX results: ${row.location_id}`);
      }

      rowsByLocationId.set(row.location_id, row);
    });

    offset += page.length;

    if (page.length < HYROX_PAGE_SIZE && offset < expectedTotal) {
      throw new HyroxDiscoveryDataError(
        `HYROX publication page was short at offset ${offset} before total ${expectedTotal}.`,
      );
    }
  }

  const totalCount = expectedTotal ?? 0;

  if (rowsByLocationId.size !== totalCount) {
    throw new HyroxDiscoveryDataError(
      `HYROX publication returned ${rowsByLocationId.size} unique locations for total ${totalCount}.`,
    );
  }

  const locationIds = Array.from(rowsByLocationId.keys());
  const urlRows = (
    await Promise.all(
      splitIntoBatches(locationIds, HYROX_URL_BATCH_SIZE).map((batch) => gateway.loadOfficialUrls(batch)),
    )
  ).flat();
  const officialUrls = new Map(urlRows.map((row) => [row.id, row.official_url]));
  const locations = Array.from(rowsByLocationId.values())
    .map<HyroxDiscoveryLocation>((row) => ({
      id: row.location_id,
      slug: row.location_slug,
      name: row.location_name,
      brandId: row.brand_id,
      brandName: row.brand_name,
      prefecture: row.prefecture,
      city: row.city,
      address: row.address,
      latitude: row.latitude,
      longitude: row.longitude,
      official: true,
      officialUrl: officialUrls.get(row.location_id) ?? null,
      lastConfirmedAt: row.last_confirmed_at,
    }))
    .sort(
      (left, right) =>
        comparePrefectures(left.prefecture, right.prefecture) ||
        left.city.localeCompare(right.city, "ja") ||
        left.name.localeCompare(right.name, "ja") ||
        left.id.localeCompare(right.id),
    );

  return {
    locations,
    totalCount,
    missingOfficialUrlCount: locations.filter((location) => !location.officialUrl).length,
  };
}
