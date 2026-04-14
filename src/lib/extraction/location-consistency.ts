import { getOrigin, normalizeUrlLikeInput } from "./discovery-url-utils";

export type LocationConsistency = {
  score: number;
  reasons: string[];
  groupKey: string;
  primaryIdentifier: string | null;
  matchedLocationToken: string | null;
};

const LOCATION_IDENTIFIER_KEYS = ["shop", "store", "club", "gym", "branch", "location", "loc", "id"] as const;
const GENERIC_LOCATION_WORDS = new Set([
  "gym",
  "fitness",
  "sports",
  "club",
  "studio",
  "spa",
  "light",
  "flat",
  "sopra",
  "jexer",
  "pilates",
  "body",
]);

export function normalizeComparisonText(value: string) {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\s\u3000\-_/・･().,:'"!?[\]{}]+/g, "");
}

export function deriveLocationTokens(locationName: string) {
  const rawTokens = new Set<string>();
  const trimmed = locationName.trim();
  const full = normalizeComparisonText(trimmed);

  if (full) {
    rawTokens.add(full);
  }

  trimmed
    .split(/[\s\u3000/|｜()（）]+/)
    .map((token) => normalizeComparisonText(token))
    .filter((token) => token.length >= 2)
    .filter((token) => !GENERIC_LOCATION_WORDS.has(token))
    .forEach((token) => rawTokens.add(token));

  const spaceSeparated = trimmed.split(/[\s\u3000]+/).map((token) => normalizeComparisonText(token)).filter(Boolean);
  const lastToken = spaceSeparated.at(-1);
  if (lastToken && lastToken.length >= 2) {
    rawTokens.add(lastToken);
  }

  return Array.from(rawTokens).sort((left, right) => right.length - left.length);
}

export function extractPrimaryLocationIdentifier(value: string | null | undefined) {
  const normalizedUrl = normalizeUrlLikeInput(value);
  if (!normalizedUrl) {
    return null;
  }

  const url = new URL(normalizedUrl);
  for (const key of LOCATION_IDENTIFIER_KEYS) {
    const current = url.searchParams.get(key);
    if (current) {
      return `${key}=${current}`;
    }
  }

  return null;
}

function deriveDirectoryGroup(value: string) {
  const normalizedUrl = normalizeUrlLikeInput(value);
  if (!normalizedUrl) {
    return "unknown";
  }

  const url = new URL(normalizedUrl);
  const segments = url.pathname.split("/").filter(Boolean);
  const lastSegment = segments.at(-1);
  const directorySegments =
    lastSegment && /\.[a-z0-9]+$/i.test(lastSegment) ? segments.slice(0, -1) : segments;

  return `${url.origin}/${directorySegments.slice(0, 4).join("/")}`;
}

export function scoreLocationConsistency({
  entryUrl,
  candidateUrl,
  discoveredFrom,
  locationName,
  pageText,
}: {
  entryUrl: string;
  candidateUrl: string;
  discoveredFrom: string | null;
  locationName: string;
  pageText: string;
}): LocationConsistency {
  const reasons: string[] = [];
  const normalizedPageText = normalizeComparisonText(pageText);
  const locationTokens = deriveLocationTokens(locationName);
  const fullLocationToken = normalizeComparisonText(locationName);
  const matchedLocationToken =
    locationTokens.find((token) => normalizedPageText.includes(token)) ?? null;

  let score = 0;

  if (fullLocationToken && normalizedPageText.includes(fullLocationToken)) {
    score += 10;
    reasons.push("full_location_text_match");
  } else if (matchedLocationToken) {
    score += 7;
    reasons.push(`location_token_match:${matchedLocationToken}`);
  }

  const candidateIdentifier = extractPrimaryLocationIdentifier(candidateUrl);
  const entryIdentifier = extractPrimaryLocationIdentifier(entryUrl);
  const parentIdentifier = extractPrimaryLocationIdentifier(discoveredFrom);

  if (candidateIdentifier) {
    score += 2;
    reasons.push(`candidate_identifier:${candidateIdentifier}`);
  }

  if (entryIdentifier && candidateIdentifier && entryIdentifier === candidateIdentifier) {
    score += 6;
    reasons.push("matches_entry_identifier");
  }

  if (parentIdentifier && candidateIdentifier && parentIdentifier === candidateIdentifier) {
    score += 4;
    reasons.push("matches_parent_identifier");
  }

  const entryOrigin = getOrigin(entryUrl);
  const candidateOrigin = getOrigin(candidateUrl);
  if (entryOrigin && candidateOrigin && entryOrigin === candidateOrigin) {
    score += 1;
    reasons.push("same_origin");
  }

  const candidateDirectoryGroup = deriveDirectoryGroup(candidateUrl);
  const entryDirectoryGroup = deriveDirectoryGroup(entryUrl);
  const parentDirectoryGroup = deriveDirectoryGroup(discoveredFrom ?? "");

  if (candidateDirectoryGroup === entryDirectoryGroup) {
    score += 2;
    reasons.push("same_directory_as_entry");
  }

  if (parentDirectoryGroup !== "unknown" && candidateDirectoryGroup === parentDirectoryGroup) {
    score += 2;
    reasons.push("same_directory_as_parent");
  }

  return {
    score,
    reasons,
    groupKey: candidateIdentifier ? `id:${candidateIdentifier}` : `dir:${candidateDirectoryGroup}`,
    primaryIdentifier: candidateIdentifier,
    matchedLocationToken,
  };
}
