import { getProgramBrandAliases, getProgramSearchAliases } from "@/lib/program-master";
import type { SearchResult } from "@/lib/types";

export type ProgramQueryHit = {
  field: "raw_program_name" | "canonical_program_name" | "program_brand" | "searchAliases" | "brandAliases";
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
  const brandAliases = getProgramBrandAliases(item.schedule.program_brand);
  const rawScore = getMatchScore(query, item.schedule.raw_program_name);
  const canonicalScore = getMatchScore(query, item.schedule.canonical_program_name);
  const brandScore = getMatchScore(query, item.schedule.program_brand);

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

  if (brandScore > 0 && item.schedule.program_brand) {
    hits.push({
      field: "program_brand",
      value: item.schedule.program_brand,
      score: brandScore * 85,
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

  brandAliases.forEach((alias) => {
    const aliasScore = getMatchScore(query, alias);

    if (aliasScore > 0) {
      hits.push({
        field: "brandAliases",
        value: alias,
        score: aliasScore * 82,
      });
    }
  });

  return hits;
}

export function scoreProgramQueryMatch(item: SearchResult, query: string) {
  const hits = getProgramQueryDebug(item, query);
  const rawScore = hits.find((hit) => hit.field === "raw_program_name")?.score ?? 0;
  const canonicalScore = hits.find((hit) => hit.field === "canonical_program_name")?.score ?? 0;
  const brandScore = hits.find((hit) => hit.field === "program_brand")?.score ?? 0;
  const aliasScore = Math.max(...hits.filter((hit) => hit.field === "searchAliases").map((hit) => hit.score), 0);
  const brandAliasScore = Math.max(...hits.filter((hit) => hit.field === "brandAliases").map((hit) => hit.score), 0);

  if (rawScore > 0) {
    return rawScore;
  }

  if (canonicalScore > 0) {
    return canonicalScore;
  }

  if (brandScore > 0) {
    return brandScore;
  }

  if (aliasScore > 0) {
    return aliasScore;
  }

  if (brandAliasScore > 0) {
    return brandAliasScore;
  }

  return 0;
}
