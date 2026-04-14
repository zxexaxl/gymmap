import { getProgramSearchAliases } from "@/lib/program-master";
import type { SearchResult } from "@/lib/types";

export type ProgramQueryHit = {
  field: "raw_program_name" | "canonical_program_name" | "searchAliases";
  value: string;
  score: number;
};

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

export function getProgramQueryDebug(item: SearchResult, query: string): ProgramQueryHit[] {
  const hits: ProgramQueryHit[] = [];
  const aliases = getProgramSearchAliases(item.schedule.canonical_program_name);
  const rawScore = getMatchScore(query, item.schedule.raw_program_name);
  const canonicalScore = getMatchScore(query, item.schedule.canonical_program_name);

  if (rawScore > 0) {
    hits.push({
      field: "raw_program_name",
      value: item.schedule.raw_program_name,
      score: rawScore * 100,
    });
  }

  if (canonicalScore > 0 && item.schedule.canonical_program_name) {
    hits.push({
      field: "canonical_program_name",
      value: item.schedule.canonical_program_name,
      score: canonicalScore * 90,
    });
  }

  aliases.forEach((alias) => {
    const aliasScore = getMatchScore(query, alias);

    if (aliasScore > 0) {
      hits.push({
        field: "searchAliases",
        value: alias,
        score: aliasScore * 80,
      });
    }
  });

  return hits;
}

export function scoreProgramQueryMatch(item: SearchResult, query: string) {
  const hits = getProgramQueryDebug(item, query);
  const rawScore = hits.find((hit) => hit.field === "raw_program_name")?.score ?? 0;
  const canonicalScore = hits.find((hit) => hit.field === "canonical_program_name")?.score ?? 0;
  const aliasScore = Math.max(...hits.filter((hit) => hit.field === "searchAliases").map((hit) => hit.score), 0);

  if (rawScore > 0) {
    return rawScore;
  }

  if (canonicalScore > 0) {
    return canonicalScore;
  }

  if (aliasScore > 0) {
    return aliasScore;
  }

  return 0;
}
