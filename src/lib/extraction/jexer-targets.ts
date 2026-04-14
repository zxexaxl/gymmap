export type JexerExtractionTargetKind = "store" | "partial" | "group";

export type JexerExtractionTarget = {
  slug: string;
  locationName: string;
  sourceUrl?: string;
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
    sourceUrl: "https://www.jexer.jp/mb/shinjuku/schedule/index.html",
    kind: "store",
  },
  {
    slug: "oimachi",
    locationName: "JEXER 大井町",
    sourceUrl: "https://www.jexer.jp/mb/oi/schedule/index.html",
    kind: "store",
  },
  {
    slug: "ueno",
    locationName: "JEXER 上野",
    sourceUrl: "https://www.jexer.jp/mb/ueno/index.html",
    kind: "store",
  },
  {
    slug: "ikebukuro",
    locationName: "JEXER 池袋",
    sourceUrl: "https://www.jexer.jp/mb/ikebukuro/index.html",
    kind: "store",
  },
  {
    slug: "kameido",
    locationName: "JEXER 亀戸",
    sourceUrl: "https://www.jexer.jp/mb/kameido/",
    kind: "store",
  },
  {
    slug: "yotsuya",
    locationName: "JEXER 四ツ谷",
    sourceUrl: "https://www.jexer.jp/mb/yotsuya/",
    kind: "store",
  },
  {
    slug: "akabane",
    locationName: "JEXER 赤羽",
    sourceUrl: "https://www.jexer.jp/mb/akabane/",
    kind: "store",
  },
  {
    slug: "otsuka",
    locationName: "JEXER 大塚",
    sourceUrl: "https://www.jexer.jp/mb/otsuka/",
    kind: "store",
  },
  {
    slug: "itabashi",
    locationName: "JEXER 板橋",
    sourceUrl: "https://www.jexer.jp/mb/itabashi/",
    kind: "store",
  },
  {
    slug: "shinkoiwa",
    locationName: "JEXER 新小岩",
    sourceUrl: "https://www.jexer.jp/mb/shinkoiwa/",
    kind: "store",
  },
];

// 部分 target は調査用として残します。
export const jexerPartialTargets: JexerExtractionTarget[] = [
  {
    slug: "oi-saturday-a",
    locationName: "JEXER 大井町",
    sourceUrl: "https://www.jexer.jp/mb/oi/schedule/sat_10a.html",
    kind: "partial",
  },
  {
    slug: "kameido-monday-a",
    locationName: "JEXER 亀戸",
    sourceUrl: "https://www.jexer.jp/mb/kameido/schedule/mon_10a.html",
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
