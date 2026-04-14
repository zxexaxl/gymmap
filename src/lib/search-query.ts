import { getProgramSearchAliases } from "@/lib/program-master";
import type { SearchResult } from "@/lib/types";

export function normalizeSearchKeyword(value: string) {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[／/]/g, " ")
    .replace(/[()（）【】\[\]]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function compactSearchKeyword(value: string) {
  return normalizeSearchKeyword(value).replace(/\s+/g, "");
}

function getMatchScore(query: string, candidate?: string | null) {
  if (!candidate) {
    return 0;
  }

  const normalizedCandidate = normalizeSearchKeyword(candidate);
  const compactCandidate = compactSearchKeyword(candidate);
  const compactQuery = query.replace(/\s+/g, "");

  if (normalizedCandidate === query || compactCandidate === compactQuery) {
    return 3;
  }

  if (normalizedCandidate.startsWith(query) || compactCandidate.startsWith(compactQuery)) {
    return 2;
  }

  if (normalizedCandidate.includes(query) || compactCandidate.includes(compactQuery)) {
    return 1;
  }

  return 0;
}

export function scoreProgramQueryMatch(item: SearchResult, query: string) {
  const aliases = getProgramSearchAliases(item.schedule.canonical_program_name);
  const rawScore = getMatchScore(query, item.schedule.raw_program_name);
  const canonicalScore = getMatchScore(query, item.schedule.canonical_program_name);
  const aliasScore = Math.max(...aliases.map((alias) => getMatchScore(query, alias)), 0);

  if (rawScore > 0) {
    return rawScore * 100;
  }

  if (canonicalScore > 0) {
    return canonicalScore * 90;
  }

  if (aliasScore > 0) {
    return aliasScore * 80;
  }

  return 0;
}
