export type ScheduleEntryType =
  | "regular_class"
  | "support_session"
  | "personal_session"
  | "school_course"
  | "member_guidance";

export type ScheduleEntryClassification = {
  entryType: ScheduleEntryType;
  reason: string;
};

function normalize(value: string | null | undefined) {
  return (value ?? "").normalize("NFKC").toLowerCase();
}

const ENTRY_TYPE_RULES: Array<{
  entryType: ScheduleEntryType;
  reason: string;
  keywords: string[];
}> = [
  {
    entryType: "support_session",
    reason: "matched support-session keywords",
    keywords: ["マンツーマンサポート", "サポート", "オリエンテーション", "カウンセリング", "測定", "相談", "初回説明", "マシン説明", "使い方"],
  },
  {
    entryType: "personal_session",
    reason: "matched personal-session keywords",
    keywords: ["パーソナル", "personal", "マンツーマン", "プライベート", "個別", "pt "],
  },
  {
    entryType: "school_course",
    reason: "matched school-course keywords",
    keywords: ["スクール", "講座", "教室", "アカデミー", "school", "kids", "キッズ"],
  },
  {
    entryType: "member_guidance",
    reason: "matched member-guidance keywords",
    keywords: ["会員", "案内", "手続", "登録", "大人の休日倶楽部", "会員向け"],
  },
];

export function classifyScheduleEntryType({
  rawProgramName,
  aiCandidate,
  aiReason,
}: {
  rawProgramName: string;
  aiCandidate?: ScheduleEntryType | null;
  aiReason?: string | null;
}): ScheduleEntryClassification {
  const normalizedName = normalize(rawProgramName);

  for (const rule of ENTRY_TYPE_RULES) {
    if (rule.keywords.some((keyword) => normalizedName.includes(normalize(keyword)))) {
      return {
        entryType: rule.entryType,
        reason: rule.reason,
      };
    }
  }

  if (aiCandidate && aiCandidate !== "regular_class") {
    return {
      entryType: aiCandidate,
      reason: aiReason || "ai classified this block as non-regular",
    };
  }

  return {
    entryType: "regular_class",
    reason: aiCandidate === "regular_class" ? aiReason || "ai classified this block as regular" : "defaulted to regular class",
  };
}
