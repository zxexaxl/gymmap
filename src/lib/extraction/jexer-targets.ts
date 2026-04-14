import { buildJexerSharedScheduleUrl, type ExtractionAdapterId } from "./jexer-adapter";

export type JexerExtractionTargetKind = "store" | "partial" | "group";

export type JexerExtractionTarget = {
  slug: string;
  locationName: string;
  sourceUrl?: string;
  adapter?: ExtractionAdapterId;
  shopId?: number;
  kind: JexerExtractionTargetKind;
  members?: string[];
};

// 店舗単位 target を優先して管理します。
// JEXER は mb 配下の店舗ページ構造が少しずつ違うため、まずは店舗入口 URL を持ち、
// その先の schedule / fitness / 日別 HTML は抽出スクリプト側で解決します。
export const jexerStoreTargets: JexerExtractionTarget[] = [
  {
    slug: "shinjuku",
    locationName: "JEXER 新宿",
    sourceUrl: buildJexerSharedScheduleUrl(25),
    adapter: "jexer_shared_schedule",
    shopId: 25,
    kind: "store",
  },
  {
    slug: "oimachi",
    locationName: "JEXER 大井町",
    sourceUrl: buildJexerSharedScheduleUrl(4),
    adapter: "jexer_shared_schedule",
    shopId: 4,
    kind: "store",
  },
  {
    slug: "ueno",
    locationName: "JEXER 上野",
    sourceUrl: buildJexerSharedScheduleUrl(8),
    adapter: "jexer_shared_schedule",
    shopId: 8,
    kind: "store",
  },
  {
    slug: "ikebukuro",
    locationName: "JEXER 池袋",
    sourceUrl: buildJexerSharedScheduleUrl(9),
    adapter: "jexer_shared_schedule",
    shopId: 9,
    kind: "store",
  },
  {
    slug: "kameido",
    locationName: "JEXER 亀戸",
    sourceUrl: buildJexerSharedScheduleUrl(24),
    adapter: "jexer_shared_schedule",
    shopId: 24,
    kind: "store",
  },
  {
    slug: "yotsuya",
    locationName: "JEXER 四ツ谷",
    sourceUrl: buildJexerSharedScheduleUrl(3),
    adapter: "jexer_shared_schedule",
    shopId: 3,
    kind: "store",
  },
  {
    slug: "akabane",
    locationName: "JEXER 赤羽",
    sourceUrl: buildJexerSharedScheduleUrl(5),
    adapter: "jexer_shared_schedule",
    shopId: 5,
    kind: "store",
  },
  {
    slug: "otsuka",
    locationName: "JEXER 大塚",
    sourceUrl: buildJexerSharedScheduleUrl(32),
    adapter: "jexer_shared_schedule",
    shopId: 32,
    kind: "store",
  },
  {
    slug: "itabashi",
    locationName: "JEXER 板橋",
    sourceUrl: buildJexerSharedScheduleUrl(67),
    adapter: "jexer_shared_schedule",
    shopId: 67,
    kind: "store",
  },
  {
    slug: "shinkoiwa",
    locationName: "JEXER 新小岩",
    sourceUrl: buildJexerSharedScheduleUrl(86),
    adapter: "jexer_shared_schedule",
    shopId: 86,
    kind: "store",
  },
];

// 部分 target は調査用として残します。
export const jexerPartialTargets: JexerExtractionTarget[] = [
  {
    slug: "oi-saturday-a",
    locationName: "JEXER 大井町",
    sourceUrl: "https://www.jexer.jp/mb/oi/schedule/sat_10a.html",
    adapter: "generic_discovery",
    kind: "partial",
  },
  {
    slug: "kameido-monday-a",
    locationName: "JEXER 亀戸",
    sourceUrl: "https://www.jexer.jp/mb/kameido/schedule/mon_10a.html",
    adapter: "generic_discovery",
    kind: "partial",
  },
];

export const jexerTargetGroups: JexerExtractionTarget[] = [
  {
    slug: "tokyo-jexer",
    locationName: "JEXER 都内店舗一括",
    kind: "group",
    members: jexerStoreTargets.map((target) => target.slug),
  },
];

export const jexerTokyoTargets: JexerExtractionTarget[] = [
  ...jexerStoreTargets,
  ...jexerPartialTargets,
  ...jexerTargetGroups,
];

export function findJexerTarget(slug: string) {
  return jexerTokyoTargets.find((target) => target.slug === slug) ?? null;
}

export function isJexerGroupTarget(target: JexerExtractionTarget | null): target is JexerExtractionTarget & { members: string[] } {
  return Boolean(target && target.kind === "group" && target.members?.length);
}
