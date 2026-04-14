type UrlScore = {
  score: number;
  reasons: string[];
};

export function normalizeUrlLikeInput(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();

  try {
    return new URL(trimmed).toString();
  } catch {
    const embeddedUrlMatch = trimmed.match(/https?:\/\/[^\s]+/i);
    if (!embeddedUrlMatch) {
      return null;
    }

    try {
      return new URL(embeddedUrlMatch[0]).toString();
    } catch {
      return null;
    }
  }
}

export function getPathSegments(value: string) {
  const normalizedUrl = normalizeUrlLikeInput(value);

  if (!normalizedUrl) {
    return [];
  }

  return new URL(normalizedUrl).pathname.split("/").filter(Boolean);
}

export function countSharedLeadingSegments(leftUrl: string, rightUrl: string) {
  const left = getPathSegments(leftUrl);
  const right = getPathSegments(rightUrl);
  let count = 0;

  while (count < left.length && count < right.length && left[count] === right[count]) {
    count += 1;
  }

  return count;
}

export function getOrigin(value: string) {
  const normalizedUrl = normalizeUrlLikeInput(value);

  if (!normalizedUrl) {
    return null;
  }

  return new URL(normalizedUrl).origin;
}

export function scoreCandidateUrl({
  candidateUrl,
  entryUrl,
  discoveredFrom,
}: {
  candidateUrl: string;
  entryUrl: string;
  discoveredFrom: string | null;
}): UrlScore {
  const normalizedCandidateUrl = normalizeUrlLikeInput(candidateUrl);
  const normalizedEntryUrl = normalizeUrlLikeInput(entryUrl);
  const normalizedDiscoveredFrom = normalizeUrlLikeInput(discoveredFrom);

  if (!normalizedCandidateUrl || !normalizedEntryUrl) {
    return {
      score: Number.MIN_SAFE_INTEGER,
      reasons: ["invalid_url"],
    };
  }

  const url = new URL(normalizedCandidateUrl);
  const tokens = `${url.pathname}${url.search}`.toLowerCase();
  const reasons: string[] = [];
  let score = 0;

  const positiveKeywords = ["schedule", "lesson", "program", "timetable", "class", "calendar", "studio", "fitness", "pdf"];
  const negativeKeywords = ["news", "campaign", "contact", "instructor", "trainer", "staff", "blog", "recruit", "privacy", "company"];

  const positiveMatches = positiveKeywords.filter((keyword) => tokens.includes(keyword));
  const negativeMatches = negativeKeywords.filter((keyword) => tokens.includes(keyword));

  score += positiveMatches.length * 3;
  score -= negativeMatches.length * 4;

  if (normalizedCandidateUrl.toLowerCase().endsWith(".pdf")) {
    score += 5;
    reasons.push("pdf");
  }

  if (positiveMatches.length > 0) {
    reasons.push(`positive:${positiveMatches.join(",")}`);
  }

  if (negativeMatches.length > 0) {
    reasons.push(`negative:${negativeMatches.join(",")}`);
  }

  const sharedSegments = countSharedLeadingSegments(normalizedCandidateUrl, normalizedEntryUrl);
  score += Math.min(sharedSegments, 3);
  reasons.push(`shared_segments:${sharedSegments}`);

  if (normalizedDiscoveredFrom && countSharedLeadingSegments(normalizedCandidateUrl, normalizedDiscoveredFrom) >= 2) {
    score += 2;
    reasons.push("close_to_parent");
  }

  if (
    tokens.includes("mon_") ||
    tokens.includes("tue_") ||
    tokens.includes("wed_") ||
    tokens.includes("thu_") ||
    tokens.includes("fri_") ||
    tokens.includes("sat_") ||
    tokens.includes("sun_")
  ) {
    score += 4;
    reasons.push("day_detail_hint");
  }

  if (tokens.includes("10a") || tokens.includes("10b") || tokens.includes("10c") || tokens.includes("bike") || tokens.includes("hot")) {
    score += 2;
    reasons.push("studio_detail_hint");
  }

  return { score, reasons };
}
