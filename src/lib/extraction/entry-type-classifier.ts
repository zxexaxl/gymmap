export type ScheduleEntryType =
  | "regular_class"
  | "support_session"
  | "personal_session"
  | "school_course"
  | "member_guidance"
  | "excluded_candidate";

export type ScheduleEntryClassification = {
  entryType: ScheduleEntryType;
  reason: string;
  excludedCandidate: boolean;
  suspectNonRegular: boolean;
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

const HARD_EXCLUDE_RULES: Array<{
  reason: string;
  keywords: string[];
}> = [
  {
    reason: "matched obvious non-lesson advertising keywords",
    keywords: ["キャンペーン", "広告", "お知らせ", "news", "インフォメーション"],
  },
  {
    reason: "matched obvious note or annotation keywords",
    keywords: ["注記", "注意事項", "※", "備考", "但し書き"],
  },
  {
    reason: "matched obvious business-guidance keywords",
    keywords: ["営業時間", "営業案内", "受付時間", "休館", "休館日", "営業日"],
  },
  {
    reason: "matched page heading keywords",
    keywords: ["プログラムスケジュール", "スケジュール一覧", "タイムテーブル", "レッスン一覧"],
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

  for (const rule of HARD_EXCLUDE_RULES) {
    if (rule.keywords.some((keyword) => normalizedName.includes(normalize(keyword)))) {
      return {
        entryType: "excluded_candidate",
        reason: rule.reason,
        excludedCandidate: true,
        suspectNonRegular: true,
      };
    }
  }

  for (const rule of ENTRY_TYPE_RULES) {
    if (rule.keywords.some((keyword) => normalizedName.includes(normalize(keyword)))) {
      return {
        entryType: rule.entryType,
        reason: rule.reason,
        excludedCandidate: false,
        suspectNonRegular: true,
      };
    }
  }

  if (aiCandidate && aiCandidate !== "regular_class" && aiCandidate !== "excluded_candidate") {
    return {
      entryType: aiCandidate,
      reason: aiReason || "ai classified this block as non-regular",
      excludedCandidate: false,
      suspectNonRegular: true,
    };
  }

  return {
    entryType: "regular_class",
    reason: aiCandidate === "regular_class" ? aiReason || "ai classified this block as regular" : "defaulted to regular class",
    excludedCandidate: false,
    suspectNonRegular: false,
  };
}
