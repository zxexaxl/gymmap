import {
  programMaster,
  type ProgramBrand,
  type ProgramCategoryPrimary,
  type ProgramMasterEntry,
  type ProgramMasterSourceOfTruth,
} from "./program-master";

export type ProgramNormalizationInput = {
  rawProgramName: string;
  startTime?: string | null;
  endTime?: string | null;
};

export type ProgramNormalizationResult = {
  raw_program_name: string;
  normalized_text: string;
  comparison_key: string;
  duration_minutes: number | null;
  canonical_program_name: string | null;
  program_brand: ProgramBrand | null;
  category_primary: ProgramCategoryPrimary | null;
  tags: string[];
  match_method: "exact" | "similar" | "unresolved";
  confidence: number;
  needs_review: boolean;
  manually_confirmed: boolean;
  source_of_truth: ProgramMasterSourceOfTruth | "ai_candidate" | "raw_unresolved";
  brand_candidate: ProgramBrand | null;
  category_candidate: ProgramCategoryPrimary | null;
  normalization_notes: string | null;
};

const similarityThreshold = 0.78;
const exactConfidence = 0.99;
const unresolvedConfidence = 0.2;

const removablePhrases = [
  /\bles\s*mills\b/g,
  /\blm\b/g,
  /\bvirtual\b/g,
  /\bonline\b/g,
  /\bintro\b/g,
  /\bbasic\b/g,
  /\bbeginner\b/g,
  /バーチャル/g,
  /初級/g,
  /入門/g,
  /ベーシック/g,
];

const durationPatterns = [
  /(\d{2,3})\s*(?:min|mins|minutes|minute|分)\b/gi,
  /(?:^|\s|\()(\d{2,3})(?:\s|\)|$)/g,
];

function normalizeText(value: string) {
  let normalized = value.normalize("NFKC").toLowerCase().trim();

  normalized = normalized
    .replace(/[／/]/g, " ")
    .replace(/[()（）【】\[\]]/g, " ")
    .replace(/[&＋+]/g, " ")
    .replace(/[-_:,.]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return normalized;
}

function stripDurationText(value: string) {
  let stripped = value;

  for (const pattern of durationPatterns) {
    stripped = stripped.replace(pattern, " ");
  }

  return stripped.replace(/\s+/g, " ").trim();
}

function buildComparisonKey(normalizedText: string) {
  let candidate = stripDurationText(normalizedText);

  removablePhrases.forEach((pattern) => {
    candidate = candidate.replace(pattern, " ");
  });

  return candidate.replace(/[^a-z0-9ぁ-んァ-ヶ一-龠]/g, "");
}

function parseTimeToMinutes(time?: string | null) {
  if (!time) {
    return null;
  }

  const [hours, minutes] = time.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return null;
  }

  return hours * 60 + minutes;
}

function calculateDurationFromTimes(startTime?: string | null, endTime?: string | null) {
  const start = parseTimeToMinutes(startTime);
  const end = parseTimeToMinutes(endTime);

  if (start === null || end === null) {
    return null;
  }

  const diff = end - start;
  if (diff <= 0 || diff > 300) {
    return null;
  }

  return diff;
}

function extractDurationFromName(rawProgramName: string) {
  const normalizedText = normalizeText(rawProgramName);

  for (const pattern of durationPatterns) {
    const match = pattern.exec(normalizedText);
    pattern.lastIndex = 0;

    if (!match?.[1]) {
      continue;
    }

    const minutes = Number(match[1]);
    if (minutes >= 15 && minutes <= 180) {
      return minutes;
    }
  }

  return null;
}

function buildMasterKeys(entry: ProgramMasterEntry) {
  const keys = new Set<string>();

  entry.comparisonKeys.forEach((key) => {
    keys.add(buildComparisonKey(normalizeText(key)));
  });

  entry.searchHints.forEach((hint) => {
    keys.add(buildComparisonKey(normalizeText(hint)));
  });

  return Array.from(keys).filter(Boolean);
}

function bigramSet(value: string) {
  const target = value.length === 1 ? `${value}_` : value;
  const items = new Set<string>();

  for (let index = 0; index < target.length - 1; index += 1) {
    items.add(target.slice(index, index + 2));
  }

  return items;
}

function diceCoefficient(left: string, right: string) {
  if (!left || !right) {
    return 0;
  }

  if (left === right) {
    return 1;
  }

  const leftSet = bigramSet(left);
  const rightSet = bigramSet(right);

  let overlap = 0;
  leftSet.forEach((item) => {
    if (rightSet.has(item)) {
      overlap += 1;
    }
  });

  return (2 * overlap) / (leftSet.size + rightSet.size);
}

function scoreProgramSimilarity(left: string, right: string) {
  const baseScore = diceCoefficient(left, right);
  const hasContainment = left.length >= 2 && right.length >= 2 && (left.includes(right) || right.includes(left));

  if (hasContainment) {
    return Math.max(baseScore, 0.85);
  }

  return baseScore;
}

function resolveProgram(comparisonKey: string) {
  for (const entry of programMaster) {
    const masterKeys = buildMasterKeys(entry);
    if (masterKeys.includes(comparisonKey)) {
      return {
        entry,
        matchMethod: "exact" as const,
        confidence: exactConfidence,
      };
    }
  }

  let bestMatch: { entry: ProgramMasterEntry; confidence: number } | null = null;

  for (const entry of programMaster) {
    const masterKeys = buildMasterKeys(entry);
    const bestScore = Math.max(...masterKeys.map((masterKey) => scoreProgramSimilarity(comparisonKey, masterKey)), 0);

    if (!bestMatch || bestScore > bestMatch.confidence) {
      bestMatch = {
        entry,
        confidence: bestScore,
      };
    }
  }

  if (!bestMatch || bestMatch.confidence < similarityThreshold) {
    return null;
  }

  return {
    entry: bestMatch.entry,
    matchMethod: "similar" as const,
    confidence: Number(bestMatch.confidence.toFixed(2)),
  };
}

function shouldNeedsReview({
  matchMethod,
  confidence,
  entry,
  comparisonKey,
}: {
  matchMethod: "exact" | "similar";
  confidence: number;
  entry: ProgramMasterEntry;
  comparisonKey: string;
}) {
  if (matchMethod === "exact") {
    return false;
  }

  if (entry.sourceOfTruth === "manual_confirmed") {
    return false;
  }

  const safeBrandPrograms = new Set(["BODYCOMBAT", "BODYPUMP", "ZUMBA", "リトモス", "チームバイク", "メガダンス", "バイラバイラ"]);
  const safeContainmentPrograms = new Set(["ヨガ", "ピラティス", "ペルビックストレッチ", "エアロビクス"]);

  if (entry.programBrand && confidence >= 0.84) {
    return false;
  }

  if (safeBrandPrograms.has(entry.canonicalProgramName) && confidence >= 0.84) {
    return false;
  }

  if (safeContainmentPrograms.has(entry.canonicalProgramName) && comparisonKey.includes(buildComparisonKey(normalizeText(entry.canonicalProgramName)))) {
    return false;
  }

  if (confidence >= 0.92) {
    return false;
  }

  return true;
}

export function normalizeProgramName(input: ProgramNormalizationInput): ProgramNormalizationResult {
  const normalizedText = normalizeText(input.rawProgramName);
  const comparisonKey = buildComparisonKey(normalizedText);
  const durationFromTimes = calculateDurationFromTimes(input.startTime, input.endTime);
  const durationFromName = extractDurationFromName(input.rawProgramName);
  const durationMinutes = durationFromTimes ?? durationFromName;
  const match = resolveProgram(comparisonKey);

  if (!match) {
    return {
      raw_program_name: input.rawProgramName,
      normalized_text: normalizedText,
      comparison_key: comparisonKey,
      duration_minutes: durationMinutes,
      canonical_program_name: null,
      program_brand: null,
      category_primary: null,
      tags: [],
      match_method: "unresolved",
      confidence: unresolvedConfidence,
      needs_review: true,
      manually_confirmed: false,
      source_of_truth: "raw_unresolved",
      brand_candidate: null,
      category_candidate: null,
      normalization_notes: "program master 未登録のため unresolved として保持",
    };
  }

  const manuallyConfirmed = match.entry.sourceOfTruth === "manual_confirmed";
  const sourceOfTruth = manuallyConfirmed ? "manual_confirmed" : match.matchMethod === "exact" ? "master_catalog" : "master_catalog";

  return {
    raw_program_name: input.rawProgramName,
    normalized_text: normalizedText,
    comparison_key: comparisonKey,
    duration_minutes: durationMinutes,
    canonical_program_name: match.entry.canonicalProgramName,
    program_brand: match.entry.programBrand,
    category_primary: match.entry.categoryPrimary,
    tags: match.entry.tags,
    match_method: match.matchMethod,
    confidence: match.confidence,
    needs_review: shouldNeedsReview({
      matchMethod: match.matchMethod,
      confidence: match.confidence,
      entry: match.entry,
      comparisonKey,
    }),
    manually_confirmed: manuallyConfirmed,
    source_of_truth: sourceOfTruth,
    brand_candidate: manuallyConfirmed ? match.entry.programBrand : null,
    category_candidate: match.entry.categoryPrimary,
    normalization_notes: manuallyConfirmed
      ? "手動確定済み master を最優先で適用"
      : match.matchMethod === "exact"
        ? "program master の確定ルールを適用"
        : "program master の類似一致を適用",
  };
}

export function buildProgramNormalizationPreview(inputs: ProgramNormalizationInput[]) {
  return inputs.map((input) => normalizeProgramName(input));
}
