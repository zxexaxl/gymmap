import type { NormalizedExtractedJexerScheduleRecord } from "./jexer-types";

type CleanupClassification = "excluded" | "suspect_non_regular" | "normalized_only" | "unchanged";

export type CentralImportPreparedRecord = NormalizedExtractedJexerScheduleRecord & {
  raw_program_name_original: string;
  normalized_program_name_preview: string;
  normalization_notes: string[];
};

export type CentralImportCleanupSummary = {
  excluded: number;
  suspect_non_regular: number;
  normalized_only: number;
  unchanged: number;
  representative_transformations: Array<{
    location_name: string;
    weekday: string;
    start_time: string;
    before: string;
    after: string;
    classification: CleanupClassification;
    notes: string[];
  }>;
};

const DECORATION_PREFIX_PATTERNS = [
  /^\s*\[\s*予約\s*\]\s*/iu,
  /^\s*\[\s*スクール\s*\]\s*/iu,
  /^\s*[*＊]?\s*クラブ限定+\s*[\/／]\s*/iu,
  /^\s*有料セッ+ション\s*[\/／]\s*/iu,
  /^\s*cs\s*live\s*[\/／]\s*/iu,
];

const DECORATION_SUFFIX_PATTERNS = [/\s*[\/／]\s*rec\s*$/iu, /\s*・\s*rec\s*$/iu];

const SUSPECT_KEYWORDS = [
  "キッズ",
  "kids",
  "スクール",
  "school",
  "選手コース",
  "有料セッション",
  "クラブ限定",
  "cslive",
  "cslive",
];

const EXCLUDED_KEYWORDS = [
  "未成年者利用不可",
  "営業案内",
  "営業時間",
  "休館日",
  "プログラムスケジュール",
  "スタジオスケジュール",
  "タイムテーブル",
  "お知らせ",
  "注意事項",
  "お問合せ下さい",
  "お問い合わせ下さい",
];

function normalizeForMatch(value: string | null | undefined) {
  return (value ?? "").normalize("NFKC").toLowerCase().replace(/\s+/g, "");
}

function collapseDecorativeWhitespace(value: string) {
  let text = value;
  text = text.replace(/[　]+/g, " ");
  text = text.replace(/\s*[／]\s*/g, "/");
  text = text.replace(/\s*\/\s*/g, "/");
  text = text.replace(/\s*・\s*/g, "・");
  text = text.replace(/\s+/g, " ");
  text = text.replace(/(?<=[A-Za-z])\s+(?=[A-Za-z])/gu, "");
  text = text.replace(/(?<=[ぁ-んァ-ヶ一-龠ー])\s+(?=[ぁ-んァ-ヶ一-龠ー])/gu, "");
  return text.trim();
}

function removeDecorations(value: string, notes: string[]) {
  let text = value;
  let changed = true;

  while (changed) {
    changed = false;

    for (const pattern of DECORATION_PREFIX_PATTERNS) {
      if (pattern.test(text)) {
        text = text.replace(pattern, "");
        notes.push(`removed decoration prefix: ${pattern}`);
        changed = true;
      }
    }
  }

  for (const pattern of DECORATION_SUFFIX_PATTERNS) {
    if (pattern.test(text)) {
      text = text.replace(pattern, "");
      notes.push(`removed decoration suffix: ${pattern}`);
    }
  }

  return text.trim();
}

function stripInstructorFromProgram(programName: string, instructorName: string | null, notes: string[]) {
  if (!instructorName) {
    return programName;
  }

  const normalizedInstructor = normalizeForMatch(instructorName);
  if (!normalizedInstructor) {
    return programName;
  }

  const separators = ["・", "/", "／"];
  for (const separator of separators) {
    const parts = programName.split(separator);
    if (parts.length < 2) {
      continue;
    }

    const suffix = parts[parts.length - 1]?.trim() ?? "";
    if (!suffix) {
      continue;
    }

    if (normalizeForMatch(suffix) === normalizedInstructor) {
      notes.push("removed duplicated instructor suffix from program name");
      return parts.slice(0, -1).join(separator).trim();
    }
  }

  return programName;
}

function maybeExtractInstructor(programName: string, instructorName: string | null, notes: string[]) {
  if (instructorName) {
    return { programName, instructorName };
  }

  const parts = programName.split("・");
  if (parts.length < 2) {
    return { programName, instructorName };
  }

  const possibleInstructor = parts[parts.length - 1]?.trim() ?? "";
  if (!possibleInstructor) {
    return { programName, instructorName };
  }

  if (!/^[A-Za-zぁ-んァ-ヶ一-龠ー（）()]{1,12}$/u.test(possibleInstructor)) {
    return { programName, instructorName };
  }

  const extractedProgramName = parts.slice(0, -1).join("・").trim();
  if (!extractedProgramName) {
    return { programName, instructorName };
  }

  notes.push("extracted trailing instructor from program name");
  return {
    programName: extractedProgramName,
    instructorName: possibleInstructor,
  };
}

function classifyRecord(programName: string, originalProgramName: string) {
  const normalized = normalizeForMatch(programName);
  const normalizedOriginal = normalizeForMatch(originalProgramName);
  const reservationOnly = normalizedOriginal === normalizeForMatch("[予約]") || normalizedOriginal === normalizeForMatch("予約");
  const noteOnly =
    normalized.includes(normalizeForMatch("お問合せ下さい")) ||
    normalized.includes(normalizeForMatch("お問い合わせ下さい")) ||
    normalized.includes(normalizeForMatch("変更になる場合があります"));

  if (
    !normalized ||
    reservationOnly ||
    noteOnly ||
    EXCLUDED_KEYWORDS.some((keyword) => normalized.includes(normalizeForMatch(keyword))) ||
    EXCLUDED_KEYWORDS.some((keyword) => normalizedOriginal === normalizeForMatch(keyword))
  ) {
    return {
      excludedCandidate: true,
      suspectNonRegular: true,
      classification: "excluded" as const,
    };
  }

  if (SUSPECT_KEYWORDS.some((keyword) => normalized.includes(normalizeForMatch(keyword)) || normalizedOriginal.includes(normalizeForMatch(keyword)))) {
    return {
      excludedCandidate: false,
      suspectNonRegular: true,
      classification: "suspect_non_regular" as const,
    };
  }

  if (programName !== originalProgramName) {
    return {
      excludedCandidate: false,
      suspectNonRegular: false,
      classification: "normalized_only" as const,
    };
  }

  return {
    excludedCandidate: false,
    suspectNonRegular: false,
    classification: "unchanged" as const,
  };
}

export function prepareCentralImportRecords(records: NormalizedExtractedJexerScheduleRecord[]) {
  const summary: CentralImportCleanupSummary = {
    excluded: 0,
    suspect_non_regular: 0,
    normalized_only: 0,
    unchanged: 0,
    representative_transformations: [],
  };

  const preparedRecords = records.map((record) => {
    const notes: string[] = [];
    const originalProgramName = record.raw_program_name;
    const originalInstructorName = record.instructor_name;

    let normalizedProgramName = collapseDecorativeWhitespace(originalProgramName.normalize("NFKC"));
    if (normalizedProgramName !== originalProgramName) {
      notes.push("collapsed OCR whitespace and normalized symbols");
    }

    normalizedProgramName = removeDecorations(normalizedProgramName, notes);
    normalizedProgramName = collapseDecorativeWhitespace(normalizedProgramName);
    normalizedProgramName = stripInstructorFromProgram(normalizedProgramName, originalInstructorName, notes);

    const extractedInstructor = maybeExtractInstructor(normalizedProgramName, originalInstructorName, notes);
    normalizedProgramName = collapseDecorativeWhitespace(extractedInstructor.programName);

    const classification = classifyRecord(normalizedProgramName, originalProgramName);
    summary[classification.classification] += 1;

    if (
      summary.representative_transformations.length < 20 &&
      (normalizedProgramName !== originalProgramName || classification.classification !== "unchanged")
    ) {
      summary.representative_transformations.push({
        location_name: record.location_name,
        weekday: record.weekday,
        start_time: record.start_time,
        before: originalProgramName,
        after: normalizedProgramName,
        classification: classification.classification,
        notes,
      });
    }

    return {
      ...record,
      raw_program_name_original: originalProgramName,
      raw_program_name: normalizedProgramName,
      normalized_program_name_preview: normalizedProgramName,
      instructor_name: extractedInstructor.instructorName,
      normalization_notes: notes,
      excluded_candidate: classification.excludedCandidate,
      suspect_non_regular: record.suspect_non_regular || classification.suspectNonRegular,
    } satisfies CentralImportPreparedRecord;
  });

  return { preparedRecords, summary };
}
