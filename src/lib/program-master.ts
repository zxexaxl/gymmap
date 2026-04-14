export type ProgramCategoryPrimary =
  | "cardio"
  | "strength"
  | "mind_body"
  | "dance"
  | "cycling"
  | "aquatic"
  | "martial_arts"
  | "conditioning"
  | "other";

export type ProgramBrand = "Les Mills" | "Radical Fitness" | "MOSSA" | "ZUMBA" | "BAILA BAILA";

export type ProgramMasterSourceOfTruth = "manual_confirmed" | "master_catalog";

export type ProgramMasterEntry = {
  canonicalProgramName: string;
  comparisonKeys: string[];
  searchHints: string[];
  searchAliases: string[];
  programBrand: ProgramBrand | null;
  categoryPrimary: ProgramCategoryPrimary;
  tags: string[];
  sourceOfTruth: ProgramMasterSourceOfTruth;
};

const programBrandAliases: Record<ProgramBrand, string[]> = {
  "Les Mills": ["Les Mills", "les mills", "lesmills", "レズミルズ", "レズ・ミルズ"],
  "Radical Fitness": [
    "Radical Fitness",
    "radical fitness",
    "radical",
    "ラディカル",
    "ラディカルフィットネス",
  ],
  MOSSA: ["MOSSA", "mossa"],
  ZUMBA: ["ZUMBA", "zumba", "ズンバ"],
  "BAILA BAILA": ["BAILA BAILA", "baila baila", "バイラバイラ", "バイラ・バイラ"],
};

export function defineManualProgramEntry(entry: Omit<ProgramMasterEntry, "sourceOfTruth">): ProgramMasterEntry {
  return {
    ...entry,
    sourceOfTruth: "manual_confirmed",
  };
}

function defineCatalogProgramEntry(entry: Omit<ProgramMasterEntry, "sourceOfTruth">): ProgramMasterEntry {
  return {
    ...entry,
    sourceOfTruth: "master_catalog",
  };
}

// 巨大な別名辞書ではなく、小さな正規名マスタだけを持ちます。
// 手動でブランドや正規名を確定したものは manualProgramMaster に追加してください。
// normalize 時は manualProgramMaster を最優先に使い、AI 候補や類似一致で上書きしません。
export const manualProgramMaster: ProgramMasterEntry[] = [
  defineManualProgramEntry({
    canonicalProgramName: "チームバイク",
    comparisonKeys: ["チームバイク", "teambike"],
    searchHints: ["ﾁｰﾑﾊﾞｲｸ", "team bike", "teambike"],
    searchAliases: ["チームバイク", "team bike", "teambike"],
    programBrand: null,
    categoryPrimary: "cycling",
    tags: ["cycling", "cardio"],
  }),
  defineManualProgramEntry({
    canonicalProgramName: "バイラバイラ",
    comparisonKeys: ["バイラバイラ", "bailabaila"],
    searchHints: ["baila baila", "ﾊﾞｲﾗﾊﾞｲﾗ", "baila45"],
    searchAliases: ["バイラバイラ", "baila baila"],
    programBrand: "BAILA BAILA",
    categoryPrimary: "dance",
    tags: ["dance", "cardio", "baila_baila"],
  }),
];

export const catalogProgramMaster: ProgramMasterEntry[] = [
  defineCatalogProgramEntry({
    canonicalProgramName: "BODYCOMBAT",
    comparisonKeys: ["bodycombat", "bodycombatlm"],
    searchHints: ["body combat", "les mills bodycombat", "lm bodycombat", "ボディコンバット", "ﾎﾞﾃﾞｨｺﾝﾊﾞｯﾄ"],
    searchAliases: ["ボディコンバット", "body combat", "bodycombat", "ﾎﾞﾃﾞｨｺﾝﾊﾞｯﾄ"],
    programBrand: "Les Mills",
    categoryPrimary: "cardio",
    tags: ["cardio", "combat", "les_mills"],
  }),
  defineCatalogProgramEntry({
    canonicalProgramName: "BODYPUMP",
    comparisonKeys: ["bodypump", "bodypumplm"],
    searchHints: ["body pump", "les mills bodypump", "lm bodypump", "ボディパンプ", "ﾎﾞﾃﾞｨﾊﾟﾝﾌﾟ", "ﾎﾞﾃﾞｨﾊﾞﾝﾌﾟ"],
    searchAliases: ["ボディパンプ", "body pump", "bodypump", "ﾎﾞﾃﾞｨﾊﾟﾝﾌﾟ"],
    programBrand: "Les Mills",
    categoryPrimary: "strength",
    tags: ["strength", "barbell", "les_mills"],
  }),
  defineCatalogProgramEntry({
    canonicalProgramName: "ヨガ",
    comparisonKeys: ["ヨガ", "yoga"],
    searchHints: ["朝のヨガ", "リラックスヨガ", "yoga stretch", "ヨガストレッチ"],
    searchAliases: ["ヨガ", "yoga", "ホットヨガ"],
    programBrand: null,
    categoryPrimary: "mind_body",
    tags: ["mind_body", "mobility", "breathing"],
  }),
  defineCatalogProgramEntry({
    canonicalProgramName: "ピラティス",
    comparisonKeys: ["ピラティス", "pilates"],
    searchHints: ["ベーシックピラティス", "ピラティス ベーシック", "pilates basic"],
    searchAliases: ["ピラティス", "pilates"],
    programBrand: null,
    categoryPrimary: "mind_body",
    tags: ["mind_body", "core", "posture"],
  }),
  defineCatalogProgramEntry({
    canonicalProgramName: "エアロビクス",
    comparisonKeys: ["aerobics", "エアロビクス"],
    searchHints: ["aerobics", "aerobic", "エアロ", "ローインパクトエアロ", "ｴｱﾛｳｫｰｸ", "ｴｱﾛｵﾘｼﾞﾅﾙ"],
    searchAliases: ["エアロビクス", "aerobics", "エアロ"],
    programBrand: null,
    categoryPrimary: "cardio",
    tags: ["cardio", "aerobics", "rhythm"],
  }),
  defineCatalogProgramEntry({
    canonicalProgramName: "ZUMBA",
    comparisonKeys: ["ズンバ", "zumba"],
    searchHints: ["ｽﾞﾝﾊﾞ", "zumba", "zumba45"],
    searchAliases: ["ズンバ", "zumba", "zumba fitness"],
    programBrand: "ZUMBA",
    categoryPrimary: "dance",
    tags: ["dance", "cardio", "zumba"],
  }),
  defineCatalogProgramEntry({
    canonicalProgramName: "リトモス",
    comparisonKeys: ["リトモス", "ritmos"],
    searchHints: ["ﾘﾄﾓｽ", "ritmos", "ritmos45"],
    searchAliases: ["リトモス", "ritmos"],
    programBrand: "Radical Fitness",
    categoryPrimary: "dance",
    tags: ["dance", "cardio", "radical_fitness"],
  }),
  defineCatalogProgramEntry({
    canonicalProgramName: "サーキット",
    comparisonKeys: ["サーキット", "circuit"],
    searchHints: ["ｻｰｷｯﾄ", "circuit training", "サーキットトレーニング"],
    searchAliases: ["サーキット", "circuit"],
    programBrand: null,
    categoryPrimary: "conditioning",
    tags: ["conditioning", "cardio", "strength"],
  }),
  defineCatalogProgramEntry({
    canonicalProgramName: "シェイプボクシング",
    comparisonKeys: ["シェイプボクシング", "shapeboxing"],
    searchHints: ["shape boxing", "ｼｪｲﾌﾟﾎﾞｸｼﾝｸﾞ", "ボクシングエクササイズ"],
    searchAliases: ["シェイプボクシング", "shape boxing"],
    programBrand: null,
    categoryPrimary: "martial_arts",
    tags: ["martial_arts", "cardio", "boxing"],
  }),
  defineCatalogProgramEntry({
    canonicalProgramName: "バレトン",
    comparisonKeys: ["バレトン", "balletone"],
    searchHints: ["balletone", "barre tone", "バレトーン"],
    searchAliases: ["バレトン", "balletone"],
    programBrand: null,
    categoryPrimary: "mind_body",
    tags: ["mind_body", "balance", "conditioning"],
  }),
  defineCatalogProgramEntry({
    canonicalProgramName: "メガダンス",
    comparisonKeys: ["メガダンス", "megadanz", "megadance"],
    searchHints: ["ﾒｶﾞﾀﾞﾝｽ", "mega dance", "megadanz"],
    searchAliases: ["メガダンス", "megadanz", "mega dance"],
    programBrand: "Radical Fitness",
    categoryPrimary: "dance",
    tags: ["dance", "cardio", "radical_fitness"],
  }),
  defineCatalogProgramEntry({
    canonicalProgramName: "キックボックス",
    comparisonKeys: ["キックボックス", "kickbox"],
    searchHints: ["kick boxing", "キックボクシング", "キックボックス45"],
    searchAliases: ["キックボックス", "kick boxing"],
    programBrand: null,
    categoryPrimary: "martial_arts",
    tags: ["martial_arts", "cardio", "boxing"],
  }),
  defineCatalogProgramEntry({
    canonicalProgramName: "ステップ",
    comparisonKeys: ["ステップ", "step"],
    searchHints: ["ステップ30", "step basic", "step exercise"],
    searchAliases: ["ステップ", "step"],
    programBrand: null,
    categoryPrimary: "cardio",
    tags: ["cardio", "step", "rhythm"],
  }),
  defineCatalogProgramEntry({
    canonicalProgramName: "コア・シェイク",
    comparisonKeys: ["コアシェイク", "coreshake"],
    searchHints: ["コア シェイク", "core shake", "ｺｱｼｪｲｸ"],
    searchAliases: ["コアシェイク", "core shake"],
    programBrand: null,
    categoryPrimary: "conditioning",
    tags: ["conditioning", "core", "mobility"],
  }),
  defineCatalogProgramEntry({
    canonicalProgramName: "太極拳",
    comparisonKeys: ["太極拳", "taichi"],
    searchHints: ["tai chi", "taichi", "太極拳入門"],
    searchAliases: ["太極拳", "tai chi"],
    programBrand: null,
    categoryPrimary: "mind_body",
    tags: ["mind_body", "balance", "mobility"],
  }),
  defineCatalogProgramEntry({
    canonicalProgramName: "ビッツ",
    comparisonKeys: ["ビッツ", "bits"],
    searchHints: ["ﾋﾞｯﾂ", "bits workout", "bits30"],
    searchAliases: ["ビッツ", "bits"],
    programBrand: null,
    categoryPrimary: "cardio",
    tags: ["cardio", "interval", "conditioning"],
  }),
  defineCatalogProgramEntry({
    canonicalProgramName: "ペルビックストレッチ",
    comparisonKeys: ["ペルビックストレッチ", "pelvicstretch"],
    searchHints: ["pelvic stretch", "骨盤ストレッチ", "ﾍﾟﾙﾋﾞｯｸｽﾄﾚｯﾁ", "ﾍﾞﾙﾋﾞｯｸｽﾄﾚｯﾁ"],
    searchAliases: ["ペルビックストレッチ", "pelvic stretch"],
    programBrand: null,
    categoryPrimary: "mind_body",
    tags: ["mind_body", "stretch", "pelvic"],
  }),
  defineCatalogProgramEntry({
    canonicalProgramName: "RPBコントロール",
    comparisonKeys: ["rpbコントロール", "rpbcontrol"],
    searchHints: ["rpb control", "RPB CONTROL", "rpbコントロール", "RPBｺﾝﾄﾛｰﾙ"],
    searchAliases: ["RPBコントロール", "rpb control"],
    programBrand: null,
    categoryPrimary: "conditioning",
    tags: ["conditioning", "control", "core"],
  }),
  defineCatalogProgramEntry({
    canonicalProgramName: "DDD HOUSE WORKOUT",
    comparisonKeys: ["dddhouseworkout", "dddhouse"],
    searchHints: ["ddd house workout", "DDD HOUSE", "ddd workout"],
    searchAliases: ["DDD HOUSE WORKOUT", "ddd house workout"],
    programBrand: null,
    categoryPrimary: "dance",
    tags: ["dance", "cardio", "house"],
  }),
  defineCatalogProgramEntry({
    canonicalProgramName: "VOLTAGE",
    comparisonKeys: ["voltage"],
    searchHints: ["VOLTAGE", "voltage workout"],
    searchAliases: ["VOLTAGE", "voltage"],
    programBrand: null,
    categoryPrimary: "conditioning",
    tags: ["conditioning", "cardio", "interval"],
  }),
  defineCatalogProgramEntry({
    canonicalProgramName: "BEAT-EX",
    comparisonKeys: ["beatex", "beat-ex"],
    searchHints: ["BEAT-EX", "beat ex"],
    searchAliases: ["BEAT-EX", "beat ex"],
    programBrand: null,
    categoryPrimary: "cardio",
    tags: ["cardio", "rhythm", "dance"],
  }),
  defineCatalogProgramEntry({
    canonicalProgramName: "フラダンス",
    comparisonKeys: ["フラダンス", "huladance"],
    searchHints: ["ﾌﾗﾀﾞﾝｽ", "hula dance", "フラ"],
    searchAliases: ["フラダンス", "hula dance"],
    programBrand: null,
    categoryPrimary: "dance",
    tags: ["dance", "rhythm", "cultural"],
  }),
  defineCatalogProgramEntry({
    canonicalProgramName: "ベリーダンス",
    comparisonKeys: ["ベリーダンス", "bellydance"],
    searchHints: ["ﾍﾞﾘｰﾀﾞﾝｽ", "belly dance", "ベリーダンス"],
    searchAliases: ["ベリーダンス", "belly dance"],
    programBrand: null,
    categoryPrimary: "dance",
    tags: ["dance", "rhythm", "cultural"],
  }),
  defineCatalogProgramEntry({
    canonicalProgramName: "ボディケア",
    comparisonKeys: ["ボディケア", "bodycare"],
    searchHints: ["ﾎﾞﾃﾞｨｹｱ", "body care", "ボディコンディショニング"],
    searchAliases: ["ボディケア", "body care"],
    programBrand: null,
    categoryPrimary: "mind_body",
    tags: ["mind_body", "recovery", "conditioning"],
  }),
  defineCatalogProgramEntry({
    canonicalProgramName: "骨盤ねじ締めエクササイズ",
    comparisonKeys: ["骨盤ねじ締めエクササイズ", "骨盤ネジ締めエクササイズ"],
    searchHints: ["骨盤ﾈｼﾞ締めｴｸｻｻｲｽﾞ", "骨盤ねじ締め", "pelvic twist exercise"],
    searchAliases: ["骨盤ねじ締めエクササイズ", "骨盤ネジ締めエクササイズ"],
    programBrand: null,
    categoryPrimary: "conditioning",
    tags: ["conditioning", "pelvic", "core"],
  }),
];

export const programMaster: ProgramMasterEntry[] = [...manualProgramMaster, ...catalogProgramMaster];

export function getProgramSearchAliases(canonicalProgramName?: string | null) {
  if (!canonicalProgramName) {
    return [];
  }

  const entry = programMaster.find((item) => item.canonicalProgramName === canonicalProgramName);
  if (!entry) {
    return [];
  }

  return Array.from(new Set(entry.searchAliases));
}

export function getProgramBrandAliases(programBrand?: ProgramBrand | string | null) {
  if (!programBrand) {
    return [];
  }

  return programBrandAliases[programBrand as ProgramBrand] ?? [];
}
