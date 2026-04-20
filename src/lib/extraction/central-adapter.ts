export const CENTRAL_CLUB_SEARCH_URL = "https://www.central.co.jp/club/";
export const CENTRAL_TOKYO_CLUB_LIST_URL = "https://www.central.co.jp/club/list.html?area_no=3&todo_no=13";

export type CentralSkipReason =
  | "club_top_fetch_failed"
  | "no_schedule_tab"
  | "no_studio_schedule_link"
  | "unsupported_format"
  | "schedule_tab_fetch_failed"
  | "studio_schedule_fetch_failed"
  | "extraction_failed";

export type ExtractedAnchorWithContext = {
  url: string;
  text: string | null;
  context: string;
};

export type CentralClubCandidate = {
  slug: string;
  name: string;
  url: string;
};

export type CentralStudioScheduleCandidate = {
  url: string;
  text: string | null;
  format: "html" | "pdf" | "unknown";
  score: number;
  reasons: string[];
  source_page: "club_top" | "schedule_tab";
};

export function slugifyClubUrl(clubUrl: string) {
  try {
    const url = new URL(clubUrl);
    const segments = url.pathname.split("/").filter(Boolean);
    return segments[segments.length - 1] ?? "central-club";
  } catch {
    return "central-club";
  }
}

export function extractAnchorsWithContext(pageUrl: string, html: string) {
  const matches = html.matchAll(/<a\b[^>]*href=["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi);
  const anchors = new Map<string, ExtractedAnchorWithContext>();

  for (const match of matches) {
    const href = match[1];
    const rawText = match[2]?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() || null;

    if (!href || href.startsWith("mailto:") || href.startsWith("javascript:") || href.startsWith("tel:")) {
      continue;
    }

    try {
      const url = new URL(href, pageUrl).toString();
      const context = html.slice(Math.max(0, (match.index ?? 0) - 180), (match.index ?? 0) + match[0].length + 180);
      const existing = anchors.get(url);

      if (!existing || ((rawText?.length ?? 0) > (existing.text?.length ?? 0))) {
        anchors.set(url, {
          url,
          text: rawText,
          context,
        });
      }
    } catch {
      // best effort
    }
  }

  return Array.from(anchors.values());
}

export function extractTokyoClubSection(html: string) {
  const fallbackIndex = html.indexOf("関東エリア");
  if (fallbackIndex >= 0) {
    const tokyoIndex = html.indexOf("東京都", fallbackIndex);
    const endCandidates = ["甲信越・北陸", "東海", "近畿", "中国・四国・九州"]
      .map((marker) => html.indexOf(marker, tokyoIndex >= 0 ? tokyoIndex : fallbackIndex))
      .filter((index) => index > fallbackIndex);
    const endIndex = endCandidates.length > 0 ? Math.min(...endCandidates) : fallbackIndex + 120000;
    return html.slice(fallbackIndex, endIndex);
  }

  return html;
}

export function extractTokyoClubCandidates(listUrl: string, html: string) {
  const section = extractTokyoClubSection(html);
  const anchors = extractAnchorsWithContext(listUrl, section);

  return Array.from(
    new Map(
      anchors
        .filter((anchor) => anchor.url.startsWith(CENTRAL_CLUB_SEARCH_URL))
        .filter((anchor) => {
          try {
            const url = new URL(anchor.url);
            return (
              url.pathname.startsWith("/club/") &&
              !url.pathname.startsWith("/club/list") &&
              !url.pathname.startsWith("/club/pdf/") &&
              !url.pathname.includes("/program/") &&
              !url.pathname.includes("/images/") &&
              !url.pathname.includes("/club_schedule/")
            );
          } catch {
            return false;
          }
        })
        .filter((anchor) => {
          const text = anchor.text ?? "";
          return text.length > 0 && !/google map|詳しくはこちら|自動翻訳/i.test(text);
        })
        .map((anchor) => [
          anchor.url,
          {
            slug: slugifyClubUrl(anchor.url),
            name: anchor.text ?? anchor.url,
            url: anchor.url,
          },
        ]),
    ).values(),
  ).sort((left, right) => left.name.localeCompare(right.name, "ja"));
}

export function findScheduleTabUrl(clubUrl: string, html: string) {
  const anchors = extractAnchorsWithContext(clubUrl, html);
  const candidate = anchors.find((anchor) => {
    const text = anchor.text ?? "";
    return text.includes("スケジュール") && !/代行|祝日|休日|インストラクター/.test(text);
  });

  return candidate?.url ?? null;
}

function scoreStudioScheduleAnchor(anchor: ExtractedAnchorWithContext, sourcePage: "club_top" | "schedule_tab") {
  const text = anchor.text ?? "";
  const lowerUrl = anchor.url.toLowerCase();
  const lowerContext = anchor.context.toLowerCase();
  let score = 0;
  const reasons: string[] = [];

  if (text.includes("スタジオ")) {
    score += 25;
    reasons.push("text:studio");
  }

  if (text.includes("スケジュール")) {
    score += 20;
    reasons.push("text:schedule");
  }

  if (/今月のスケジュール/.test(anchor.context)) {
    score += 20;
    reasons.push("context:monthly_schedule");
  }

  if (/pdfでみる/i.test(lowerContext)) {
    score += 18;
    reasons.push("context:pdf");
  }

  if (/webでみる/i.test(lowerContext)) {
    score += 14;
    reasons.push("context:web");
  }

  if (lowerUrl.endsWith(".pdf")) {
    score += 18;
    reasons.push("format:pdf");
  }

  if (lowerUrl.includes("/program/studio")) {
    score += 16;
    reasons.push("url:program_studio");
  }

  if (lowerUrl.includes("club_pdf") || lowerUrl.includes("/pdf/")) {
    score += 14;
    reasons.push("url:schedule_pdf");
  }

  if (sourcePage === "schedule_tab") {
    score += 8;
    reasons.push("source:schedule_tab");
  }

  if (/プール|その他|年間営業カレンダー/.test(text)) {
    score -= 40;
    reasons.push("exclude:non_studio");
  }

  return { score, reasons };
}

export function findStudioScheduleCandidates({
  pageUrl,
  html,
  sourcePage,
}: {
  pageUrl: string;
  html: string;
  sourcePage: "club_top" | "schedule_tab";
}) {
  return extractAnchorsWithContext(pageUrl, html)
    .map((anchor) => {
      const score = scoreStudioScheduleAnchor(anchor, sourcePage);
      const lowerUrl = anchor.url.toLowerCase();
      const format = lowerUrl.endsWith(".pdf") ? "pdf" : lowerUrl.endsWith(".html") || lowerUrl.endsWith("/") ? "html" : "unknown";

      return {
        url: anchor.url,
        text: anchor.text,
        format,
        score: score.score,
        reasons: score.reasons,
        source_page: sourcePage,
      } satisfies CentralStudioScheduleCandidate;
    })
    .filter((candidate) => candidate.score > 15)
    .sort((left, right) => right.score - left.score || left.url.localeCompare(right.url));
}
