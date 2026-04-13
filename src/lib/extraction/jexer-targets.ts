export type JexerExtractionTarget = {
  slug: string;
  locationName: string;
  sourceUrl: string;
};

// まずは東京圏の少数店舗だけを手動管理します。
// URL を増やしたい場合は、この配列に 1 件ずつ追加してください。
export const jexerTokyoTargets: JexerExtractionTarget[] = [
  {
    slug: "shinjuku",
    locationName: "JEXER 新宿",
    sourceUrl: "https://www.jexer.jp/mb/shinjuku/schedule/index.html",
  },
  {
    slug: "ikebukuro",
    locationName: "JEXER 池袋",
    sourceUrl: "https://www.jexer.jp/mb/ikebukuro/index.html",
  },
  {
    slug: "ueno",
    locationName: "JEXER 上野",
    sourceUrl: "https://www.jexer.jp/mb/ueno/",
  },
  {
    slug: "kameido-monday-a",
    locationName: "JEXER 亀戸",
    sourceUrl: "https://www.jexer.jp/mb/kameido/schedule/mon_10a.html",
  },
  {
    slug: "oi-saturday-a",
    locationName: "JEXER 大井町",
    sourceUrl: "https://www.jexer.jp/mb/oi/schedule/sat_10a.html",
  },
];

export function findJexerTarget(slug: string) {
  return jexerTokyoTargets.find((target) => target.slug === slug) ?? null;
}
