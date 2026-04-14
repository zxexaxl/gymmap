type BrandStrategyScore = {
  score: number;
  reasons: string[];
};

export type BrandDiscoveryStrategy = {
  id: string;
  promptHint: string;
  scoreCandidate: (params: {
    candidateUrl: string;
    linkText: string | null;
    discoveredFrom: string | null;
  }) => BrandStrategyScore;
};

function normalize(value: string | null | undefined) {
  return (value ?? "").normalize("NFKC").toLowerCase();
}

const jexerFitnessClubStrategy: BrandDiscoveryStrategy = {
  id: "jexer-fitness-club",
  promptHint:
    "For JEXER, prefer the common brand navigation: general site -> fitness club store page -> program schedule. Prioritize links that look like fitness club or program schedule links, and de-prioritize light gym, kids, futsal, and other non-fitness-club businesses.",
  scoreCandidate: ({ candidateUrl, linkText, discoveredFrom }) => {
    const url = normalize(candidateUrl);
    const text = normalize(linkText);
    const parent = normalize(discoveredFrom);
    const combined = `${url} ${text}`;
    let score = 0;
    const reasons: string[] = [];

    if (combined.includes("プログラムスケジュール") || combined.includes("program schedule")) {
      score += 12;
      reasons.push("brand_priority:program_schedule");
    }

    if (combined.includes("フィットネスクラブ") || combined.includes("fitness club")) {
      score += 8;
      reasons.push("brand_priority:fitness_club");
    }

    if (combined.includes("schedule") || combined.includes("program")) {
      score += 4;
      reasons.push("brand_hint:schedule_program");
    }

    if (combined.includes("/fitness/") || combined.includes(" fitness ")) {
      score += 4;
      reasons.push("brand_hint:fitness_path");
    }

    if (parent.includes("/mb/") && (text.includes("プログラムスケジュール") || text.includes("schedule"))) {
      score += 6;
      reasons.push("brand_priority:store_top_schedule_link");
    }

    const downrankKeywords = ["lightgym", "light gym", "kids", "futsal", "school"];
    const downrankMatches = downrankKeywords.filter((keyword) => combined.includes(keyword));
    if (downrankMatches.length > 0) {
      score -= downrankMatches.length * 8;
      reasons.push(`brand_downrank:${downrankMatches.join(",")}`);
    }

    return { score, reasons };
  },
};

export function getBrandDiscoveryStrategy(sourceUrl: string): BrandDiscoveryStrategy | null {
  const lower = sourceUrl.toLowerCase();

  if (lower.includes("jexer.jp")) {
    return jexerFitnessClubStrategy;
  }

  return null;
}
