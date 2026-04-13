export type ProgramMasterEntry = {
  canonicalProgramName: string;
  comparisonKeys: string[];
  searchHints: string[];
  programBrand: string | null;
  categoryPrimary: string;
  tags: string[];
};

// 巨大な別名辞書ではなく、小さな正規名マスタだけを持ちます。
// 新しい正規プログラムを増やすときは、1 エントリずつ追加してください。
export const programMaster: ProgramMasterEntry[] = [
  {
    canonicalProgramName: "BODYCOMBAT",
    comparisonKeys: ["bodycombat", "bodycombatlm"],
    searchHints: ["body combat", "les mills bodycombat", "lm bodycombat", "ボディコンバット"],
    programBrand: "Les Mills",
    categoryPrimary: "martial-arts-cardio",
    tags: ["cardio", "combat", "high-intensity"],
  },
  {
    canonicalProgramName: "BODYPUMP",
    comparisonKeys: ["bodypump", "bodypumplm"],
    searchHints: ["body pump", "les mills bodypump", "lm bodypump", "ボディパンプ"],
    programBrand: "Les Mills",
    categoryPrimary: "strength-conditioning",
    tags: ["strength", "barbell", "high-rep"],
  },
  {
    canonicalProgramName: "ヨガ",
    comparisonKeys: ["ヨガ", "yoga"],
    searchHints: ["朝のヨガ", "リラックスヨガ", "yoga stretch", "ヨガストレッチ"],
    programBrand: null,
    categoryPrimary: "mind-body",
    tags: ["mobility", "breathing", "beginner-friendly"],
  },
  {
    canonicalProgramName: "ピラティス",
    comparisonKeys: ["ピラティス", "pilates"],
    searchHints: ["ベーシックピラティス", "ピラティス ベーシック", "pilates basic"],
    programBrand: null,
    categoryPrimary: "mind-body",
    tags: ["core", "posture", "conditioning"],
  },
];
