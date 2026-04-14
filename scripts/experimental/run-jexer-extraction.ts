import "./load-env";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { PDFParse } from "pdf-parse";

import { normalizeProgramName } from "../../src/lib/normalizeProgramName";
import { getBrandDiscoveryStrategy, type BrandDiscoveryStrategy } from "../../src/lib/extraction/brand-discovery-strategies";
import { classifyScheduleEntryType } from "../../src/lib/extraction/entry-type-classifier";
import type { ExtractionAdapterId } from "../../src/lib/extraction/jexer-adapter";
import {
  generateStructuredJsonFromGeminiWithDebug,
  GeminiStructuredResponseError,
  getGeminiModelId,
} from "../../src/lib/extraction/gemini-client";
import { summarizeJexerExtractionResult } from "../../src/lib/extraction/jexer-summary";
import { scoreLocationConsistency } from "../../src/lib/extraction/location-consistency";
import {
  getOrigin,
  normalizeUrlLikeInput,
  scoreCandidateUrl,
} from "../../src/lib/extraction/discovery-url-utils";
import {
  findJexerTarget,
  isJexerGroupTarget,
  jexerPartialTargets,
  jexerStoreTargets,
  jexerTargetGroups,
  type JexerExtractionTarget,
} from "../../src/lib/extraction/jexer-targets";
import type {
  ExtractedJexerScheduleRecord,
  GeminiUsageMetadata,
  JexerExtractionResult,
  JexerUsageBreakdown,
} from "../../src/lib/extraction/jexer-types";

type CandidatePage = {
  url: string;
  discoveredFrom: string | null;
  depth: number;
  urlScore: number;
  scoreReasons: string[];
  contentKind: "html" | "pdf";
  contentType: string | null;
  html: string;
  pdfText: string | null;
};

type ExtractedHtmlLink = {
  url: string;
  text: string | null;
};

type PageClassification = {
  page_type: "entry" | "schedule_index" | "schedule_detail" | "pdf_schedule" | "instructor" | "ignore";
  schedule_kind: "studio" | "bike" | "hot_yoga" | "mixed" | "unknown";
  contains_schedule_rows: boolean;
  contains_detail_links: boolean;
  recommended_next_links: string[];
  confidence: number;
};

type ClassifiedCandidatePage = CandidatePage & {
  classification: PageClassification;
  rawResponseJson: string;
  rawResponseText: string;
  usageMetadata: GeminiUsageMetadata | null;
};

type PageLocationConsistency = ReturnType<typeof scoreLocationConsistency>;

type PageSignalSummary = {
  hasTimeLikeText: boolean;
  hasTableTag: boolean;
  hasListLinkDensity: boolean;
  hasRepeatingStructure: boolean;
  hasTimeAndTextDensity: boolean;
  timeLikeCount: number;
  repeatingBlockCount: number;
  linkCount: number;
  rowCount: number;
};

type ExplorationBudget = {
  maxVisitedPages: number;
  maxAiClassifications: number;
  maxPdfPages: number;
  maxDepth: number;
  maxSeedsFromEntry: number;
  maxLinksPerPage: number;
};

type FailedCandidateFetch = {
  url: string;
  discoveredFrom: string | null;
  depth: number;
  stage: "initial_collection" | "recommended_collection";
  message: string;
  status?: number | null;
  statusText?: string | null;
  responseBodyPreview?: string | null;
};

type PageExtractionResult = {
  systemPrompt: string;
  userPrompt: string;
  rawResponseJson: string;
  rawResponseText: string;
  usageMetadata: GeminiUsageMetadata | null;
  records: ExtractedJexerScheduleRecord[];
};

const explorationBudget: ExplorationBudget = {
  maxVisitedPages: 18,
  maxAiClassifications: 16,
  maxPdfPages: 4,
  maxDepth: 3,
  maxSeedsFromEntry: 8,
  maxLinksPerPage: 10,
};

const extractionResponseSchema = {
  type: "OBJECT",
  properties: {
    records: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          location_name: { type: "STRING" },
          weekday: { type: "STRING" },
          start_time: { type: "STRING" },
          end_time: { type: "STRING" },
          raw_program_name: { type: "STRING" },
          instructor_name: { type: "STRING", nullable: true },
          source_url: { type: "STRING" },
          section_or_area: { type: "STRING", nullable: true },
          entry_type_candidate: {
            type: "STRING",
            enum: ["regular_class", "support_session", "personal_session", "school_course", "member_guidance", "excluded_candidate"],
            nullable: true,
          },
          entry_type_reason: { type: "STRING", nullable: true },
        },
        required: ["location_name", "weekday", "start_time", "end_time", "raw_program_name", "source_url"],
      },
    },
  },
  required: ["records"],
} as const;

const classificationResponseSchema = {
  type: "OBJECT",
  properties: {
    page_type: {
      type: "STRING",
      enum: ["entry", "schedule_index", "schedule_detail", "pdf_schedule", "instructor", "ignore"],
    },
    schedule_kind: { type: "STRING", enum: ["studio", "bike", "hot_yoga", "mixed", "unknown"] },
    contains_schedule_rows: { type: "BOOLEAN" },
    contains_detail_links: { type: "BOOLEAN" },
    recommended_next_links: {
      type: "ARRAY",
      items: { type: "STRING" },
    },
    confidence: { type: "NUMBER" },
  },
  required: [
    "page_type",
    "schedule_kind",
    "contains_schedule_rows",
    "contains_detail_links",
    "recommended_next_links",
    "confidence",
  ],
} as const;

class FetchResourceError extends Error {
  url: string;
  status: number | null;
  statusText: string | null;
  responseBody: string | null;

  constructor({
    url,
    status,
    statusText,
    responseBody,
    message,
  }: {
    url: string;
    status: number | null;
    statusText: string | null;
    responseBody: string | null;
    message: string;
  }) {
    super(message);
    this.name = "FetchResourceError";
    this.url = url;
    this.status = status;
    this.statusText = statusText;
    this.responseBody = responseBody;
  }
}

function parseArgs(argv: string[]) {
  const args = argv.slice(2);
  const result: { target?: string; url?: string; locationName?: string } = {};

  args.forEach((arg) => {
    if (arg.startsWith("--target=")) {
      result.target = arg.replace("--target=", "");
    }

    if (arg.startsWith("--url=")) {
      result.url = arg.replace("--url=", "");
    }

    if (arg.startsWith("--location-name=")) {
      result.locationName = arg.replace("--location-name=", "");
    }
  });

  return result;
}

function buildRunBaseName(slug: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `${slug}-${timestamp}`;
}

function buildOutputPath(baseName: string) {
  return path.join(process.cwd(), "output", "jexer", `${baseName}.json`);
}

function buildDebugDirPath() {
  return path.join(process.cwd(), "output", "jexer", "debug");
}

function buildRequestHeaders(sourceUrl: string) {
  return {
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,application/pdf,*/*;q=0.8",
    "Accept-Language": "ja,en-US;q=0.9,en;q=0.8",
    Referer: new URL(sourceUrl).origin,
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
  };
}

async function fetchResource(sourceUrl: string) {
  const response = await fetch(sourceUrl, {
    headers: buildRequestHeaders(sourceUrl),
  });

  const contentType = response.headers.get("content-type");
  const bytes = Buffer.from(await response.arrayBuffer());
  const text = bytes.toString("utf-8");

  if (!response.ok) {
    throw new FetchResourceError({
      url: sourceUrl,
      status: response.status,
      statusText: response.statusText,
      responseBody: text,
      message: `Failed to fetch resource: ${response.status} ${response.statusText}`,
    });
  }

  return {
    bytes,
    text,
    contentType,
  };
}

async function fetchHtml(sourceUrl: string) {
  const resource = await fetchResource(sourceUrl);
  return {
    html: resource.text,
    contentType: resource.contentType,
  };
}

async function fetchPdfText(sourceUrl: string) {
  const resource = await fetchResource(sourceUrl);

  try {
    const parser = new PDFParse({ data: resource.bytes });
    const parsed = await parser.getText();
    await parser.destroy();
    return {
      pdfText: parsed.text?.trim() || "",
      contentType: resource.contentType,
    };
  } catch (error) {
    throw new Error(`Failed to parse PDF text: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function fetchDirectCandidatePage({
  sourceUrl,
  adapter,
  shopId,
}: {
  sourceUrl: string;
  adapter: ExtractionAdapterId;
  shopId: number | null;
}): Promise<CandidatePage> {
  const lowerUrl = sourceUrl.toLowerCase();

  if (lowerUrl.endsWith(".pdf")) {
    const pdf = await fetchPdfText(sourceUrl);
    return {
      url: sourceUrl,
      discoveredFrom: null,
      depth: 0,
      urlScore: 100,
      scoreReasons: [adapter, ...(shopId ? [`shop_id:${shopId}`] : [])],
      contentKind: "pdf",
      contentType: pdf.contentType,
      html: "",
      pdfText: pdf.pdfText,
    };
  }

  const htmlResource = await fetchHtml(sourceUrl);
  return {
    url: sourceUrl,
    discoveredFrom: null,
    depth: 0,
    urlScore: 100,
    scoreReasons: [adapter, ...(shopId ? [`shop_id:${shopId}`] : [])],
    contentKind: "html",
    contentType: htmlResource.contentType,
    html: htmlResource.html,
    pdfText: null,
  };
}

function extractHtmlLinks(pageUrl: string, html: string) {
  const matches = html.matchAll(/<a\b[^>]*href=["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi);
  const links = new Map<string, ExtractedHtmlLink>();

  for (const match of matches) {
    const href = match[1];
    const rawText = match[2]?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() || null;

    if (!href || href.startsWith("mailto:") || href.startsWith("javascript:") || href.startsWith("tel:")) {
      continue;
    }

    try {
      const url = new URL(href, pageUrl).toString();
      const existing = links.get(url);
      if (!existing || ((rawText?.length ?? 0) > (existing.text?.length ?? 0))) {
        links.set(url, { url, text: rawText });
      }
    } catch {
      // best effort
    }
  }

  return Array.from(links.values());
}

function isSupportedDocumentUrl(candidateUrl: string) {
  const normalizedUrl = normalizeUrlLikeInput(candidateUrl);

  if (!normalizedUrl) {
    return false;
  }

  const lowerUrl = normalizedUrl.toLowerCase();

  if (/\.(jpg|jpeg|png|gif|webp|svg|js|css|ico|json|xml|zip)$/i.test(lowerUrl)) {
    return false;
  }

  const url = new URL(normalizedUrl);
  return url.pathname.endsWith(".html") || url.pathname.endsWith(".pdf") || url.pathname.endsWith("/") || !path.extname(url.pathname);
}

function normalizeCandidateUrls({
  urls,
  entryUrl,
  discoveredFrom,
  brandStrategy,
}: {
  urls: Array<string | ExtractedHtmlLink>;
  entryUrl: string;
  discoveredFrom: string | null;
  brandStrategy?: BrandDiscoveryStrategy | null;
}) {
  const entryOrigin = getOrigin(entryUrl);

  if (!entryOrigin) {
    return [];
  }

  return Array.from(
    new Map(
      urls
        .map((item) => {
          const rawUrl = typeof item === "string" ? item : item.url;
          const linkText = typeof item === "string" ? null : item.text;
          const normalizedUrl = normalizeUrlLikeInput(rawUrl);
          return normalizedUrl
            ? {
                url: normalizedUrl,
                linkText,
              }
            : null;
        })
        .filter((item): item is { url: string; linkText: string | null } => Boolean(item))
        .filter((item) => getOrigin(item.url) === entryOrigin)
        .filter((item) => isSupportedDocumentUrl(item.url))
        .map((item) => {
          const score = scoreCandidateUrl({ candidateUrl: item.url, entryUrl, discoveredFrom });
          const brandScore = brandStrategy?.scoreCandidate({
            candidateUrl: item.url,
            linkText: item.linkText,
            discoveredFrom,
          }) ?? { score: 0, reasons: [] };
          return [
            item.url,
            {
              url: item.url,
              linkText: item.linkText,
              score: score.score + brandScore.score,
              scoreReasons: [...score.reasons, ...brandScore.reasons],
              discoveredFrom,
            },
          ] as const;
        }),
    ).values(),
  )
    .sort((left, right) => right.score - left.score || left.url.localeCompare(right.url));
}

function scanHtmlKeywords(html: string) {
  const lowerHtml = html.toLowerCase();
  const keywords = ["table", "schedule", "program", "lesson", "studio"] as const;

  return Object.fromEntries(keywords.map((keyword) => [keyword, lowerHtml.includes(keyword)]));
}

function summarizePageSignals(text: string) {
  const lowerText = text.toLowerCase();
  const timeLikeMatches = text.match(/\b([01]?\d|2[0-3]):[0-5]\d\b/g) ?? [];
  const linkCount = (text.match(/<a\b/gi) ?? []).length;
  const rowCount =
    (text.match(/<tr\b/gi) ?? []).length +
    (text.match(/<li\b/gi) ?? []).length +
    (text.match(/<article\b/gi) ?? []).length +
    (text.match(/<section\b/gi) ?? []).length;
  const classMatches = Array.from(text.matchAll(/class=["']([^"']+)["']/gi))
    .map((match) => match[1].split(/\s+/))
    .flat();
  const repeatedClassCounts = new Map<string, number>();
  classMatches.forEach((className) => {
    repeatedClassCounts.set(className, (repeatedClassCounts.get(className) ?? 0) + 1);
  });
  const repeatingBlockCount = Array.from(repeatedClassCounts.values()).filter((count) => count >= 3).length;
  const timeTextPairMatches =
    text.match(/\b([01]?\d|2[0-3]):[0-5]\d\b[^\n\r<>]{4,80}/g) ??
    text.match(/[^\n\r<>]{4,80}\b([01]?\d|2[0-3]):[0-5]\d\b/g) ??
    [];

  return {
    hasTimeLikeText: timeLikeMatches.length >= 2,
    hasTableTag: lowerText.includes("<table"),
    hasListLinkDensity: linkCount >= 8 && rowCount <= 2 && timeLikeMatches.length === 0,
    hasRepeatingStructure: rowCount >= 3 || repeatingBlockCount >= 2,
    hasTimeAndTextDensity: timeTextPairMatches.length >= 2,
    timeLikeCount: timeLikeMatches.length,
    repeatingBlockCount,
    linkCount,
    rowCount,
  } satisfies PageSignalSummary;
}

async function writeDebugFile(debugDirPath: string, baseName: string, suffix: string, contents: string) {
  await writeFile(path.join(debugDirPath, `${baseName}.${suffix}`), contents, "utf-8");
}

async function writeFailureDebugFile({
  debugDirPath,
  baseName,
  slug,
  locationName,
  sourceUrl,
  stage,
  message,
  details,
}: {
  debugDirPath: string;
  baseName: string;
  slug: string;
  locationName: string;
  sourceUrl: string;
  stage: string;
  message: string;
  details?: Record<string, unknown>;
}) {
  await writeDebugFile(
    debugDirPath,
    baseName,
    "failure.json",
    JSON.stringify(
      {
        slug,
        location_name: locationName,
        source_url: sourceUrl,
        stage,
        message,
        details: details ?? null,
        failed_at: new Date().toISOString(),
      },
      null,
      2,
    ),
  );
}

function getResponseBodyPreview(value: string | null, maxLength = 600) {
  if (!value) {
    return null;
  }

  return value.slice(0, maxLength);
}

function aggregateUsageMetadata(items: Array<GeminiUsageMetadata | null | undefined>): GeminiUsageMetadata | null {
  const validItems = items.filter((item): item is GeminiUsageMetadata => Boolean(item));

  if (validItems.length === 0) {
    return null;
  }

  const sum = (selector: (item: GeminiUsageMetadata) => number | null | undefined) =>
    validItems.reduce((total, item) => total + (selector(item) ?? 0), 0);

  return {
    prompt_token_count: sum((item) => item.prompt_token_count),
    candidates_token_count: sum((item) => item.candidates_token_count),
    total_token_count: sum((item) => item.total_token_count),
    thoughts_token_count: sum((item) => item.thoughts_token_count),
    cached_content_token_count: sum((item) => item.cached_content_token_count),
    model_id: getGeminiModelId(),
  };
}

async function collectCandidatePages(entryUrl: string) {
  const brandStrategy = getBrandDiscoveryStrategy(entryUrl);
  const visited = new Set<string>();
  const enqueued = new Set<string>([entryUrl]);
  const pages: CandidatePage[] = [];
  const queue: Array<{ url: string; discoveredFrom: string | null; depth: number; score: number; scoreReasons: string[] }> = [
    { url: entryUrl, discoveredFrom: null, depth: 0, score: 100, scoreReasons: ["entry_url"] },
  ];
  let fetchedPdfCount = 0;
  const failedFetches: FailedCandidateFetch[] = [];

  while (queue.length > 0 && visited.size < explorationBudget.maxVisitedPages) {
    queue.sort((left, right) => right.score - left.score || left.depth - right.depth);
    const current = queue.shift();

    if (!current || visited.has(current.url) || current.depth > explorationBudget.maxDepth) {
      continue;
    }

    visited.add(current.url);

    const lowerUrl = current.url.toLowerCase();

    if (lowerUrl.endsWith(".pdf")) {
      if (fetchedPdfCount >= explorationBudget.maxPdfPages) {
        continue;
      }

      let pdf;
      try {
        pdf = await fetchPdfText(current.url);
      } catch (error) {
        failedFetches.push({
          url: current.url,
          discoveredFrom: current.discoveredFrom,
          depth: current.depth,
          stage: "initial_collection",
          message: error instanceof Error ? error.message : String(error),
          status: error instanceof FetchResourceError ? error.status : null,
          statusText: error instanceof FetchResourceError ? error.statusText : null,
          responseBodyPreview: error instanceof FetchResourceError ? getResponseBodyPreview(error.responseBody) : null,
        });
        continue;
      }
      fetchedPdfCount += 1;
      pages.push({
        url: current.url,
        discoveredFrom: current.discoveredFrom,
        depth: current.depth,
        urlScore: current.score,
        scoreReasons: current.scoreReasons,
        contentKind: "pdf",
        contentType: pdf.contentType,
        html: "",
        pdfText: pdf.pdfText,
      });
      continue;
    }

    let htmlResource;
    try {
      htmlResource = await fetchHtml(current.url);
    } catch (error) {
      failedFetches.push({
        url: current.url,
        discoveredFrom: current.discoveredFrom,
        depth: current.depth,
        stage: "initial_collection",
        message: error instanceof Error ? error.message : String(error),
        status: error instanceof FetchResourceError ? error.status : null,
        statusText: error instanceof FetchResourceError ? error.statusText : null,
        responseBodyPreview: error instanceof FetchResourceError ? getResponseBodyPreview(error.responseBody) : null,
      });
      continue;
    }
    const { html, contentType } = htmlResource;
    const isPdfByContentType = contentType?.toLowerCase().includes("pdf");

    if (isPdfByContentType) {
      if (fetchedPdfCount >= explorationBudget.maxPdfPages) {
        continue;
      }

      let pdf;
      try {
        pdf = await fetchPdfText(current.url);
      } catch (error) {
        failedFetches.push({
          url: current.url,
          discoveredFrom: current.discoveredFrom,
          depth: current.depth,
          stage: "initial_collection",
          message: error instanceof Error ? error.message : String(error),
          status: error instanceof FetchResourceError ? error.status : null,
          statusText: error instanceof FetchResourceError ? error.statusText : null,
          responseBodyPreview: error instanceof FetchResourceError ? getResponseBodyPreview(error.responseBody) : null,
        });
        continue;
      }
      fetchedPdfCount += 1;
      pages.push({
        url: current.url,
        discoveredFrom: current.discoveredFrom,
        depth: current.depth,
        urlScore: current.score,
        scoreReasons: current.scoreReasons,
        contentKind: "pdf",
        contentType,
        html: "",
        pdfText: pdf.pdfText,
      });
      continue;
    }

    pages.push({
      url: current.url,
      discoveredFrom: current.discoveredFrom,
      depth: current.depth,
      urlScore: current.score,
      scoreReasons: current.scoreReasons,
      contentKind: "html",
      contentType,
      html,
      pdfText: null,
    });

    if (current.depth >= explorationBudget.maxDepth) {
      continue;
    }

    const discoveredUrls = extractHtmlLinks(current.url, html);
    const normalizedLinks = normalizeCandidateUrls({
      urls: discoveredUrls,
      entryUrl,
      discoveredFrom: current.url,
      brandStrategy,
    }).slice(0, current.depth === 0 ? explorationBudget.maxSeedsFromEntry : explorationBudget.maxLinksPerPage);

    for (const nextLink of normalizedLinks) {
      if (!enqueued.has(nextLink.url)) {
        enqueued.add(nextLink.url);
        queue.push({
          url: nextLink.url,
          discoveredFrom: current.url,
          depth: current.depth + 1,
          score: nextLink.score,
          scoreReasons: [...nextLink.scoreReasons],
        });
      }
    }
  }

  return {
    pages,
    entryOrigin: new URL(entryUrl).origin,
    failedFetches,
  };
}

function getPageText(page: CandidatePage | ClassifiedCandidatePage) {
  return page.contentKind === "pdf" ? page.pdfText ?? "" : page.html;
}

async function classifyCandidatePage(
  page: CandidatePage,
  entryOrigin: string,
  locationName: string,
  brandStrategy: BrandDiscoveryStrategy | null,
) {
  if (page.contentKind === "pdf") {
    return {
      ...page,
      classification: {
        page_type: "pdf_schedule",
        schedule_kind: "unknown",
        contains_schedule_rows: summarizePageSignals(page.pdfText ?? "").hasTimeAndTextDensity,
        contains_detail_links: false,
        recommended_next_links: [],
        confidence: 0.99,
      },
      rawResponseJson: JSON.stringify({ page_type: "pdf_schedule", inferred_from: "pdf_resource" }, null, 2),
      rawResponseText: "pdf_schedule inferred from PDF resource",
      usageMetadata: null,
    } satisfies ClassifiedCandidatePage;
  }

  const systemPrompt = [
    "You classify fitness and gym schedule-related pages.",
    "Return only JSON that matches the schema.",
    "Classify each page as one of: entry, schedule_index, schedule_detail, pdf_schedule, instructor, ignore.",
    "entry means a top or navigation page.",
    "schedule_index means a page that mainly links to schedule detail pages or PDFs.",
    "schedule_detail means a page that directly contains rows, repeating blocks, or dense time-and-class entries.",
    "pdf_schedule means the page is itself a schedule PDF resource.",
    "instructor means an instructor, trainer, or substitution page, not the main class schedule.",
    `The target location is: ${locationName}. Prefer links and pages that look consistent with this location.`,
    brandStrategy ? brandStrategy.promptHint : "",
    `Only recommend next URLs on the same origin: ${entryOrigin}`,
  ].join(" ");

  const userPrompt = [
    `Page URL: ${page.url}`,
    `Discovered from: ${page.discoveredFrom ?? "entry"}`,
    `URL score: ${page.urlScore}`,
    `URL score reasons: ${page.scoreReasons.join(", ")}`,
    "Classify this page for schedule extraction and recommend promising next links if this is entry or schedule_index.",
    page.html,
  ].join("\n\n");

  const result = await generateStructuredJsonFromGeminiWithDebug<PageClassification>({
    systemPrompt,
    userPrompt,
    responseSchema: classificationResponseSchema,
  });

  const recommendedNextLinks = normalizeCandidateUrls({
    urls: result.data.recommended_next_links,
    entryUrl: page.url,
    discoveredFrom: `ai_recommendation:${page.url}`,
    brandStrategy,
  }).map((item) => item.url);

  return {
    ...page,
    classification: {
      ...result.data,
      recommended_next_links: recommendedNextLinks,
    },
    rawResponseJson: result.rawResponseJson,
    rawResponseText: result.rawResponseText,
    usageMetadata: result.usageMetadata,
  } satisfies ClassifiedCandidatePage;
}

async function classifyCandidatePages(
  pages: CandidatePage[],
  entryOrigin: string,
  locationName: string,
  brandStrategy: BrandDiscoveryStrategy | null,
) {
  const classifiedPages: ClassifiedCandidatePage[] = [];
  let aiClassificationCount = 0;

  const sortedPages = pages
    .slice()
    .sort((left, right) => right.urlScore - left.urlScore || left.depth - right.depth || left.url.localeCompare(right.url));

  for (const page of sortedPages) {
    if (page.contentKind === "pdf") {
      classifiedPages.push(await classifyCandidatePage(page, entryOrigin, locationName, brandStrategy));
      continue;
    }

    if (aiClassificationCount >= explorationBudget.maxAiClassifications) {
      classifiedPages.push({
        ...page,
        classification: {
          page_type: "ignore",
          schedule_kind: "unknown",
          contains_schedule_rows: false,
          contains_detail_links: false,
          recommended_next_links: [],
          confidence: 0,
        },
        rawResponseJson: JSON.stringify({ skipped: "ai_classification_budget_exceeded" }, null, 2),
        rawResponseText: "skipped because max AI classification budget was reached",
        usageMetadata: null,
      });
      continue;
    }

    classifiedPages.push(await classifyCandidatePage(page, entryOrigin, locationName, brandStrategy));
    aiClassificationCount += 1;
  }

  return classifiedPages;
}

async function collectRecommendedPages({
  classifiedPages,
  entryUrl,
  locationName,
  brandStrategy,
  remainingBudget,
}: {
  classifiedPages: ClassifiedCandidatePage[];
  entryUrl: string;
  locationName: string;
  brandStrategy: BrandDiscoveryStrategy | null;
  remainingBudget: number;
}) {
  const existingUrls = new Set(classifiedPages.map((page) => page.url));
  const discoveredCandidates = new Map<
    string,
    { discoveredFrom: string | null; depth: number; score: number; scoreReasons: string[] }
  >();

  for (const page of classifiedPages) {
    if (page.depth >= explorationBudget.maxDepth) {
      continue;
    }

    if (page.classification.page_type === "entry" || page.classification.page_type === "schedule_index") {
      for (const nextUrl of page.classification.recommended_next_links) {
        if (!discoveredCandidates.has(nextUrl)) {
          const score = scoreCandidateUrl({
            candidateUrl: nextUrl,
            entryUrl,
            discoveredFrom: `ai_recommendation:${page.url}`,
          });
          const locationConsistency = scoreLocationConsistency({
            entryUrl,
            candidateUrl: nextUrl,
            discoveredFrom: `ai_recommendation:${page.url}`,
            locationName,
            pageText: "",
          });
          discoveredCandidates.set(nextUrl, {
            discoveredFrom: `ai_recommendation:${page.url}`,
            depth: page.depth + 1,
            score: score.score + locationConsistency.score + 2,
            scoreReasons: [...score.reasons, ...locationConsistency.reasons, "ai_recommended"],
          });
        }
      }
    }

    if (page.classification.page_type === "schedule_index" && page.contentKind === "html") {
      const discoveredLinks = normalizeCandidateUrls({
        urls: extractHtmlLinks(page.url, page.html),
        entryUrl,
        discoveredFrom: `index_link_collection:${page.url}`,
        brandStrategy,
      });

      for (const link of discoveredLinks) {
        if (!discoveredCandidates.has(link.url)) {
          discoveredCandidates.set(link.url, {
            discoveredFrom: `index_link_collection:${page.url}`,
            depth: page.depth + 1,
            score: link.score + 1,
            scoreReasons: [...link.scoreReasons, "index_collection"],
          });
        }
      }
    }
  }

  const pages: CandidatePage[] = [];
  const failedFetches: FailedCandidateFetch[] = [];
  const sortedCandidates = Array.from(discoveredCandidates.entries())
    .filter(([url, metadata]) => !existingUrls.has(url) && metadata.depth <= explorationBudget.maxDepth)
    .sort((left, right) => right[1].score - left[1].score || left[0].localeCompare(right[0]))
    .slice(0, remainingBudget);

  let pdfCount = 0;

  for (const [url, metadata] of sortedCandidates) {
    const isPdf = url.toLowerCase().endsWith(".pdf");

    if (isPdf && pdfCount >= explorationBudget.maxPdfPages) {
      continue;
    }

    if (isPdf) {
      let pdf;
      try {
        pdf = await fetchPdfText(url);
      } catch (error) {
        failedFetches.push({
          url,
          discoveredFrom: metadata.discoveredFrom,
          depth: metadata.depth,
          stage: "recommended_collection",
          message: error instanceof Error ? error.message : String(error),
          status: error instanceof FetchResourceError ? error.status : null,
          statusText: error instanceof FetchResourceError ? error.statusText : null,
          responseBodyPreview: error instanceof FetchResourceError ? getResponseBodyPreview(error.responseBody) : null,
        });
        continue;
      }
      pdfCount += 1;
      pages.push({
        url,
        discoveredFrom: metadata.discoveredFrom,
        depth: metadata.depth,
        urlScore: metadata.score,
        scoreReasons: metadata.scoreReasons,
        contentKind: "pdf",
        contentType: pdf.contentType,
        html: "",
        pdfText: pdf.pdfText,
      });
      continue;
    }

    let htmlResource;
    try {
      htmlResource = await fetchHtml(url);
    } catch (error) {
      failedFetches.push({
        url,
        discoveredFrom: metadata.discoveredFrom,
        depth: metadata.depth,
        stage: "recommended_collection",
        message: error instanceof Error ? error.message : String(error),
        status: error instanceof FetchResourceError ? error.status : null,
        statusText: error instanceof FetchResourceError ? error.statusText : null,
        responseBodyPreview: error instanceof FetchResourceError ? getResponseBodyPreview(error.responseBody) : null,
      });
      continue;
    }
    const { html, contentType } = htmlResource;
    const isPdfByContentType = contentType?.toLowerCase().includes("pdf");

    if (isPdfByContentType) {
      if (pdfCount >= explorationBudget.maxPdfPages) {
        continue;
      }

      let pdf;
      try {
        pdf = await fetchPdfText(url);
      } catch (error) {
        failedFetches.push({
          url,
          discoveredFrom: metadata.discoveredFrom,
          depth: metadata.depth,
          stage: "recommended_collection",
          message: error instanceof Error ? error.message : String(error),
          status: error instanceof FetchResourceError ? error.status : null,
          statusText: error instanceof FetchResourceError ? error.statusText : null,
          responseBodyPreview: error instanceof FetchResourceError ? getResponseBodyPreview(error.responseBody) : null,
        });
        continue;
      }
      pdfCount += 1;
      pages.push({
        url,
        discoveredFrom: metadata.discoveredFrom,
        depth: metadata.depth,
        urlScore: metadata.score,
        scoreReasons: metadata.scoreReasons,
        contentKind: "pdf",
        contentType,
        html: "",
        pdfText: pdf.pdfText,
      });
      continue;
    }

    pages.push({
      url,
      discoveredFrom: metadata.discoveredFrom,
      depth: metadata.depth,
      urlScore: metadata.score,
      scoreReasons: metadata.scoreReasons,
      contentKind: "html",
      contentType,
      html,
      pdfText: null,
    });
  }

  return { pages, failedFetches };
}

function isSoftExcludedPage(page: ClassifiedCandidatePage) {
  return page.classification.page_type === "ignore" || page.classification.page_type === "instructor";
}

function selectExtractionTargets({
  classifiedPages,
  entryUrl,
  locationName,
}: {
  classifiedPages: ClassifiedCandidatePage[];
  entryUrl: string;
  locationName: string;
}) {
  const detailCandidates = classifiedPages
    .filter((page) => !isSoftExcludedPage(page))
    .filter((page) => {
      const text = getPageText(page);
      const signals = summarizePageSignals(text);
      const explicitDetail = page.classification.page_type === "schedule_detail" || page.classification.page_type === "pdf_schedule";
      const heuristicDetailLike =
        page.classification.page_type === "schedule_index" &&
        !page.classification.contains_detail_links &&
        !signals.hasListLinkDensity &&
        (signals.hasTimeAndTextDensity || signals.hasRepeatingStructure);
      const hasScheduleContent =
        page.classification.contains_schedule_rows ||
        signals.hasTimeLikeText ||
        signals.hasTableTag ||
        signals.hasRepeatingStructure ||
        signals.hasTimeAndTextDensity;

      return (explicitDetail || heuristicDetailLike) && hasScheduleContent;
    });

  const candidateWithConsistency = detailCandidates.map((page) => {
    const signals = summarizePageSignals(getPageText(page));
    const locationConsistency = scoreLocationConsistency({
      entryUrl,
      candidateUrl: page.url,
      discoveredFrom: page.discoveredFrom,
      locationName,
      pageText: getPageText(page),
    });

    return {
      page,
      signals,
      locationConsistency,
    };
  });

  const groupedCandidates = new Map<
    string,
    {
      groupKey: string;
      aggregateScore: number;
      pageCount: number;
      identifiers: Set<string>;
      pages: Array<{
        page: ClassifiedCandidatePage;
        signals: PageSignalSummary;
        locationConsistency: PageLocationConsistency;
      }>;
    }
  >();

  for (const candidate of candidateWithConsistency) {
    const kindPriority = {
      studio: 0,
      bike: 1,
      hot_yoga: 2,
      mixed: 3,
      unknown: 4,
    } as const;
    const kindBonus = 4 - kindPriority[candidate.page.classification.schedule_kind];
    const contentBonus =
      (candidate.signals.hasTimeAndTextDensity ? 3 : 0) +
      (candidate.signals.hasRepeatingStructure ? 2 : 0) +
      (candidate.signals.hasTableTag ? 1 : 0);
    const pageAggregateScore =
      candidate.page.urlScore +
      candidate.page.classification.confidence * 10 +
      candidate.locationConsistency.score +
      kindBonus +
      contentBonus;

    const existing = groupedCandidates.get(candidate.locationConsistency.groupKey) ?? {
      groupKey: candidate.locationConsistency.groupKey,
      aggregateScore: 0,
      pageCount: 0,
      identifiers: new Set<string>(),
      pages: [],
    };
    existing.aggregateScore += pageAggregateScore;
    existing.pageCount += 1;
    if (candidate.locationConsistency.primaryIdentifier) {
      existing.identifiers.add(candidate.locationConsistency.primaryIdentifier);
    }
    existing.pages.push(candidate);
    groupedCandidates.set(candidate.locationConsistency.groupKey, existing);
  }

  const sortedGroups = Array.from(groupedCandidates.values()).sort((left, right) => {
    if (right.aggregateScore !== left.aggregateScore) {
      return right.aggregateScore - left.aggregateScore;
    }

    if (right.pageCount !== left.pageCount) {
      return right.pageCount - left.pageCount;
    }

    return left.groupKey.localeCompare(right.groupKey);
  });

  const selectedGroup = sortedGroups[0] ?? null;
  const selectedPages = (selectedGroup?.pages ?? [])
    .slice()
    .sort((left, right) => {
      const kindPriority = {
        studio: 0,
        bike: 1,
        hot_yoga: 2,
        mixed: 3,
        unknown: 4,
      } as const;

      const kindDiff =
        kindPriority[left.page.classification.schedule_kind] - kindPriority[right.page.classification.schedule_kind];
      if (kindDiff !== 0) {
        return kindDiff;
      }

      if (right.locationConsistency.score !== left.locationConsistency.score) {
        return right.locationConsistency.score - left.locationConsistency.score;
      }

      if (right.page.urlScore !== left.page.urlScore) {
        return right.page.urlScore - left.page.urlScore;
      }

      return right.page.classification.confidence - left.page.classification.confidence;
    });

  return {
    selectedPages: selectedPages.map((candidate) => candidate.page),
    selectedPageReasons: selectedPages.map((candidate) => {
      const { page, signals, locationConsistency } = candidate;
      return {
        url: page.url,
        page_type: page.classification.page_type,
        schedule_kind: page.classification.schedule_kind,
        confidence: page.classification.confidence,
        url_score: page.urlScore,
        signals,
        location_consistency: locationConsistency,
        reason:
          page.classification.page_type === "pdf_schedule"
            ? "selected because this is a schedule PDF candidate"
            : page.classification.page_type === "schedule_detail"
              ? "selected because AI marked this page as schedule_detail"
              : "selected because the page looks detail-like by repeating schedule structure",
      };
    }),
    groupSummaries: sortedGroups.map((group) => ({
      group_key: group.groupKey,
      aggregate_score: group.aggregateScore,
      page_count: group.pageCount,
      identifiers: Array.from(group.identifiers),
      urls: group.pages.map((candidate) => candidate.page.url),
    })),
    selectionReason:
      selectedPages.length > 0
        ? `detail-like pages were selected by page_type, structural signals, and location consistency grouping (${selectedGroup?.groupKey ?? "unknown_group"})`
        : "no detail-like pages detected within exploration budget",
  };
}

function buildExplorationSteps(classifiedPages: ClassifiedCandidatePage[], selectedUrls: Set<string>) {
  return classifiedPages
    .slice()
    .sort((left, right) => {
      if (left.depth !== right.depth) {
        return left.depth - right.depth;
      }

      return right.urlScore - left.urlScore || left.url.localeCompare(right.url);
    })
    .map((page, index) => ({
      step: index + 1,
      visited_url: page.url,
      discovered_from: page.discoveredFrom,
      depth: page.depth,
      url_score: page.urlScore,
      score_reasons: page.scoreReasons,
      page_type: page.classification.page_type,
      schedule_kind: page.classification.schedule_kind,
      recommended_next_links: page.classification.recommended_next_links,
      selected_for_extraction: selectedUrls.has(page.url),
    }));
}

function buildExtractionPrompt({
  locationName,
  page,
}: {
  locationName: string;
  page: ClassifiedCandidatePage;
}) {
  if (page.contentKind === "pdf") {
    return {
      systemPrompt: [
        "You extract gym or fitness schedule rows from PDF text.",
        "Return only JSON that matches the provided schema.",
        "Do not invent records not present in the PDF text.",
        "Use 24-hour HH:MM format when inferable.",
        "If instructor name is missing, set instructor_name to null.",
        "weekday should be english lowercase when inferable.",
        "If the page shows section names such as studio, pool, gym area, cycling, hot studio, beginner studio, or similar, set section_or_area when inferable.",
        "For each extracted block, classify entry_type_candidate as one of regular_class, support_session, personal_session, school_course, member_guidance, excluded_candidate.",
        "regular_class means a normal studio, pool, gym, cycling, yoga, dance, or similar class that users would search as a lesson.",
        "support_session means support, orientation, measurement, counseling, or machine guidance.",
        "personal_session means personal training, one-to-one, or private coaching.",
        "school_course means school, course, academy, kids, or lecture style sessions.",
        "member_guidance means member-only guidance, procedures, benefits, or information slots.",
        "Use excluded_candidate only for obvious non-class content such as ads, notes, business guidance, or page headings.",
      ].join(" "),
      userPrompt: [
        `Location name: ${locationName}`,
        `Source URL: ${page.url}`,
        "Extract only class schedule rows from the following PDF text.",
        page.pdfText ?? "",
      ].join("\n\n"),
    };
  }

  return {
    systemPrompt: [
      "You extract gym or fitness class schedule rows from HTML.",
      "Return only JSON that matches the provided schema.",
      "Do not invent records not present in the HTML.",
        "Use 24-hour HH:MM format when inferable.",
        "If instructor name is missing, set instructor_name to null.",
        "weekday should be english lowercase when inferable.",
        "If the page shows section names such as studio, pool, gym area, cycling, hot studio, beginner studio, or similar, set section_or_area when inferable.",
        "For each extracted block, classify entry_type_candidate as one of regular_class, support_session, personal_session, school_course, member_guidance, excluded_candidate.",
        "regular_class means a normal studio, pool, gym, cycling, yoga, dance, or similar class that users would search as a lesson.",
        "support_session means support, orientation, measurement, counseling, or machine guidance.",
        "personal_session means personal training, one-to-one, or private coaching.",
        "school_course means school, course, academy, kids, or lecture style sessions.",
        "member_guidance means member-only guidance, procedures, benefits, or information slots.",
        "Use excluded_candidate only for obvious non-class content such as ads, notes, business guidance, or page headings.",
      ].join(" "),
    userPrompt: [
      `Location name: ${locationName}`,
      `Source URL: ${page.url}`,
      "Extract only class schedule rows from the following HTML.",
      page.html,
    ].join("\n\n"),
  };
}

async function extractRecordsFromPageWithGemini({
  locationName,
  page,
}: {
  locationName: string;
  page: ClassifiedCandidatePage;
}) {
  const prompts = buildExtractionPrompt({ locationName, page });

  const response = await generateStructuredJsonFromGeminiWithDebug<{ records: ExtractedJexerScheduleRecord[] }>({
    systemPrompt: prompts.systemPrompt,
    userPrompt: prompts.userPrompt,
    responseSchema: extractionResponseSchema,
  });

  return {
    ...prompts,
    rawResponseJson: response.rawResponseJson,
    rawResponseText: response.rawResponseText,
    usageMetadata: response.usageMetadata,
    records: response.data.records.map((record) => ({
      ...record,
      location_name: record.location_name || locationName,
      source_url: record.source_url || page.url,
    })),
  };
}

function normalizeRecords(records: ExtractedJexerScheduleRecord[]) {
  return records.map((record) => {
    const normalized = normalizeProgramName({
      rawProgramName: record.raw_program_name,
      startTime: record.start_time,
      endTime: record.end_time,
    });
    const entryType = classifyScheduleEntryType({
      rawProgramName: record.raw_program_name,
      aiCandidate: record.entry_type_candidate ?? null,
      aiReason: record.entry_type_reason ?? null,
    });

    return {
      ...record,
      normalized_text: normalized.normalized_text,
      comparison_key: normalized.comparison_key,
      duration_minutes: normalized.duration_minutes,
      canonical_program_name: normalized.canonical_program_name,
      program_brand: normalized.program_brand,
      category_primary: normalized.category_primary,
      tags: normalized.tags,
      match_method: normalized.match_method,
      confidence: normalized.confidence,
      needs_review: normalized.needs_review,
      manually_confirmed: normalized.manually_confirmed,
      source_of_truth: normalized.source_of_truth,
      brand_candidate: normalized.brand_candidate,
      category_candidate: normalized.category_candidate,
      normalization_notes: normalized.normalization_notes,
      entry_type: entryType.entryType,
      entry_type_reason: entryType.reason,
      section_or_area: record.section_or_area ?? null,
      excluded_candidate: entryType.excludedCandidate,
      suspect_non_regular: entryType.suspectNonRegular,
      included_in_schedule_results: !entryType.excludedCandidate,
    };
  });
}

async function runExtractionJob({
  slug,
  locationName,
  sourceUrl,
  adapter = "generic_discovery",
  shopId,
}: (Pick<JexerExtractionTarget, "slug" | "locationName" | "sourceUrl" | "adapter" | "shopId"> & {
  sourceUrl: string;
  adapter?: ExtractionAdapterId;
  shopId?: number | null;
})): Promise<void> {
  const baseName = buildRunBaseName(slug);
  const outputPath = buildOutputPath(baseName);
  const debugDirPath = buildDebugDirPath();
  await mkdir(path.dirname(outputPath), { recursive: true });
  await mkdir(debugDirPath, { recursive: true });

  try {
    const brandStrategy = getBrandDiscoveryStrategy(sourceUrl);
    let classifiedPages: ClassifiedCandidatePage[] = [];
    const failedFetches: FailedCandidateFetch[] = [];
    let entryOrigin = new URL(sourceUrl).origin;
    let selection:
      | ReturnType<typeof selectExtractionTargets>
      | {
          selectedPages: ClassifiedCandidatePage[];
          selectedPageReasons: Array<Record<string, unknown>>;
          groupSummaries: Array<Record<string, unknown>>;
          selectionReason: string;
        };

    if (adapter === "jexer_shared_schedule" && shopId) {
      const directPage = await fetchDirectCandidatePage({
        sourceUrl,
        adapter,
        shopId,
      });
      entryOrigin = new URL(sourceUrl).origin;
      classifiedPages = await classifyCandidatePages([directPage], entryOrigin, locationName, brandStrategy);

      const directSignals = summarizePageSignals(getPageText(classifiedPages[0]));
      const hasScheduleContent =
        classifiedPages[0].classification.contains_schedule_rows ||
        directSignals.hasTimeLikeText ||
        directSignals.hasTableTag ||
        directSignals.hasRepeatingStructure ||
        directSignals.hasTimeAndTextDensity;

      selection = {
        selectedPages: hasScheduleContent ? classifiedPages : [],
        selectedPageReasons: hasScheduleContent
          ? [
              {
                url: classifiedPages[0].url,
                page_type: classifiedPages[0].classification.page_type,
                schedule_kind: classifiedPages[0].classification.schedule_kind,
                confidence: classifiedPages[0].classification.confidence,
                url_score: classifiedPages[0].urlScore,
                signals: directSignals,
                reason: "selected by jexer shared schedule adapter using direct shop URL",
              },
            ]
          : [],
        groupSummaries: hasScheduleContent
          ? [
              {
                group_key: `id:shop=${shopId}`,
                aggregate_score: classifiedPages[0].urlScore,
                page_count: 1,
                identifiers: [`shop=${shopId}`],
                urls: [classifiedPages[0].url],
              },
            ]
          : [],
        selectionReason: hasScheduleContent
          ? `selected direct JEXER shared schedule page for shop=${shopId}`
          : "direct JEXER shared schedule page did not expose recognizable schedule content",
      };
    } else {
      const { pages: initialPages, entryOrigin: discoveredEntryOrigin, failedFetches: initialFailedFetches } =
        await collectCandidatePages(sourceUrl);
      entryOrigin = discoveredEntryOrigin;
      classifiedPages = await classifyCandidatePages(initialPages, entryOrigin, locationName, brandStrategy);
      failedFetches.push(...initialFailedFetches);
      const maxNavigationRounds = 3;

      for (let round = 0; round < maxNavigationRounds; round += 1) {
        const remainingBudget = Math.max(explorationBudget.maxVisitedPages - classifiedPages.length, 0);

        if (remainingBudget === 0) {
          break;
        }

        const recommendedPages = await collectRecommendedPages({
          classifiedPages,
          entryUrl: sourceUrl,
          locationName,
          brandStrategy,
          remainingBudget,
        });

        failedFetches.push(...recommendedPages.failedFetches);

        if (recommendedPages.pages.length === 0) {
          break;
        }

        classifiedPages = [
          ...classifiedPages,
          ...(await classifyCandidatePages(recommendedPages.pages, entryOrigin, locationName, brandStrategy)),
        ];
      }

      selection = selectExtractionTargets({
        classifiedPages,
        entryUrl: sourceUrl,
        locationName,
      });
    }
    const explorationSteps = buildExplorationSteps(
      classifiedPages,
      new Set(selection.selectedPages.map((page) => page.url)),
    );
    const classificationUsageMetadata = aggregateUsageMetadata(classifiedPages.map((page) => page.usageMetadata));

    await writeDebugFile(
      debugDirPath,
      baseName,
      "candidate-pages.json",
      JSON.stringify(
        {
          entry_url: sourceUrl,
          entry_origin: entryOrigin,
          brand_strategy: brandStrategy?.id ?? null,
          budget: explorationBudget,
          failed_fetches: failedFetches,
          exploration_steps: explorationSteps,
          candidates: classifiedPages.map((page) => ({
            url: page.url,
            discovered_from: page.discoveredFrom,
            depth: page.depth,
            url_score: page.urlScore,
            score_reasons: page.scoreReasons,
            content_kind: page.contentKind,
            signals: summarizePageSignals(getPageText(page)),
            usage_metadata: page.usageMetadata,
            classification: page.classification,
          })),
        },
        null,
        2,
      ),
    );

    for (const [index, page] of classifiedPages.entries()) {
      await writeDebugFile(
        debugDirPath,
        baseName,
        `candidate-${index + 1}.${page.contentKind === "pdf" ? "pdf.txt" : "html"}`,
        page.contentKind === "pdf" ? page.pdfText ?? "" : page.html,
      );
      await writeDebugFile(
        debugDirPath,
        baseName,
        `candidate-${index + 1}.classification.json`,
        JSON.stringify(
          {
            url: page.url,
            discovered_from: page.discoveredFrom,
            depth: page.depth,
            url_score: page.urlScore,
            score_reasons: page.scoreReasons,
            content_kind: page.contentKind,
            signals: summarizePageSignals(getPageText(page)),
            usage_metadata: page.usageMetadata,
            classification: page.classification,
          },
          null,
          2,
        ),
      );
      await writeDebugFile(debugDirPath, baseName, `candidate-${index + 1}.classification-response.json`, page.rawResponseJson);
    }

    const selectedUrls = selection.selectedPages.map((page) => page.url);
    await writeDebugFile(
      debugDirPath,
      baseName,
      "selection.json",
      JSON.stringify(
        {
          selection_reason: selection.selectionReason,
          selected_urls: selectedUrls,
          selected_count: selection.selectedPages.length,
          selected_pages: selection.selectedPageReasons,
          group_summaries: selection.groupSummaries,
          exploration_steps: explorationSteps,
          usage_metadata: classificationUsageMetadata,
        },
        null,
        2,
      ),
    );

    const extractionKeywordScan = Object.fromEntries(
      selection.selectedPages.map((page) => [page.url, scanHtmlKeywords(getPageText(page))]),
    );
    await writeDebugFile(
      debugDirPath,
      baseName,
      "html-keywords.json",
      JSON.stringify(
        {
          source_url: sourceUrl,
          extraction_urls: selectedUrls,
          keywords: extractionKeywordScan,
          usage_metadata: classificationUsageMetadata,
        },
        null,
        2,
      ),
    );

    console.log("Selected extraction pages:", selectedUrls);
    console.log("Selection reason:", selection.selectionReason);

    if (selection.selectedPages.length === 0) {
      await writeFailureDebugFile({
        debugDirPath,
        baseName,
        slug,
        locationName,
        sourceUrl,
        stage: "selection",
        message: `No extraction pages selected for ${slug}.`,
        details: {
          selection_reason: selection.selectionReason,
          candidate_count: classifiedPages.length,
          failed_fetches: failedFetches,
          exploration_steps: explorationSteps,
          generalized_failure_hints: {
            candidate_shortage: classifiedPages.length <= 2,
            detail_classification_weak: classifiedPages.every((page) => page.classification.page_type !== "schedule_detail"),
            pdf_missing: classifiedPages.every((page) => page.classification.page_type !== "pdf_schedule"),
            schedule_content_missing: classifiedPages.every((page) => {
              const signals = summarizePageSignals(getPageText(page));
              return !signals.hasTimeAndTextDensity && !signals.hasRepeatingStructure && !signals.hasTableTag;
            }),
          },
        },
      });
      throw new Error(`No extraction pages selected for ${slug}. ${selection.selectionReason}`);
    }

    const extractionResults: PageExtractionResult[] = [];
    for (const [index, page] of selection.selectedPages.entries()) {
      const prompts = buildExtractionPrompt({ locationName, page });
      await writeDebugFile(
        debugDirPath,
        baseName,
        `gemini-input-${index + 1}.txt`,
        [
          `Model ID: ${getGeminiModelId()}`,
          `Page URL: ${page.url}`,
          `Content Kind: ${page.contentKind}`,
          "",
          "[System Prompt]",
          prompts.systemPrompt,
          "",
          "[User Prompt]",
          prompts.userPrompt,
        ].join("\n"),
      );

      try {
        extractionResults.push(
          await extractRecordsFromPageWithGemini({
            locationName,
            page,
          }),
        );
      } catch (error) {
        if (error instanceof GeminiStructuredResponseError) {
          await writeDebugFile(
            debugDirPath,
            baseName,
            `gemini-response-${index + 1}.json`,
            error.rawResponseJson || JSON.stringify({ error: error.message }, null, 2),
          );

          if (error.rawResponseText) {
            await writeDebugFile(debugDirPath, baseName, `gemini-response-${index + 1}.txt`, error.rawResponseText);
          }
        }

        await writeFailureDebugFile({
          debugDirPath,
          baseName,
          slug,
          locationName,
          sourceUrl,
          stage: "extraction",
          message: error instanceof Error ? error.message : String(error),
          details: {
            failed_page_url: page.url,
            failed_page_type: page.classification.page_type,
            content_kind: page.contentKind,
          },
        });
        throw error;
      }
    }

    for (const [index, result] of extractionResults.entries()) {
      await writeDebugFile(debugDirPath, baseName, `gemini-response-${index + 1}.json`, result.rawResponseJson);
      await writeDebugFile(debugDirPath, baseName, `gemini-response-${index + 1}.txt`, result.rawResponseText);
    }

    const extractionUsageMetadata = aggregateUsageMetadata(extractionResults.map((result) => result.usageMetadata));
    await writeDebugFile(
      debugDirPath,
      baseName,
      "usage-metadata.json",
      JSON.stringify(
        {
          model_id: getGeminiModelId(),
          classification: classificationUsageMetadata,
          extraction: extractionUsageMetadata,
          total: aggregateUsageMetadata([classificationUsageMetadata, extractionUsageMetadata]),
          pages: selection.selectedPages.map((page, index) => ({
            url: page.url,
            content_kind: page.contentKind,
            page_type: page.classification.page_type,
            schedule_kind: page.classification.schedule_kind,
            url_score: page.urlScore,
            usage_metadata: extractionResults[index]?.usageMetadata ?? null,
          })),
        },
        null,
        2,
      ),
    );

    const extractedRecords = extractionResults.flatMap((result) => result.records);
    const normalizedRecords = normalizeRecords(extractedRecords);
    const includedRecords = normalizedRecords.filter((record) => record.included_in_schedule_results);
    const usageBreakdown: JexerUsageBreakdown = {
      classification: classificationUsageMetadata,
      extraction: extractionUsageMetadata,
    };

    const output: JexerExtractionResult = {
      location_name: locationName,
      source_url: sourceUrl,
      fetched_at: new Date().toISOString(),
      model_id: getGeminiModelId(),
      usage_metadata: aggregateUsageMetadata([usageBreakdown.classification, usageBreakdown.extraction]),
      usage_breakdown: usageBreakdown,
      records: includedRecords,
    };

    await writeDebugFile(
      debugDirPath,
      baseName,
      "extracted-entry-types.json",
      JSON.stringify(
        {
          total_extracted_records: normalizedRecords.length,
          included_records: includedRecords.length,
          excluded_candidates: normalizedRecords.filter((record) => record.excluded_candidate).length,
          suspect_non_regular_records: normalizedRecords.filter((record) => record.suspect_non_regular).length,
          records: normalizedRecords.map((record) => ({
            raw_program_name: record.raw_program_name,
            source_url: record.source_url,
            weekday: record.weekday,
            start_time: record.start_time,
            section_or_area: record.section_or_area,
            entry_type_candidate: record.entry_type_candidate ?? null,
            entry_type: record.entry_type,
            entry_type_reason: record.entry_type_reason,
            excluded_candidate: record.excluded_candidate,
            suspect_non_regular: record.suspect_non_regular,
            included_in_schedule_results: record.included_in_schedule_results,
          })),
        },
        null,
        2,
      ),
    );

    await writeFile(outputPath, JSON.stringify(output, null, 2), "utf-8");
    const summary = summarizeJexerExtractionResult(output);
    const summaryPath = outputPath.replace(/\.json$/i, ".summary.json");
    await writeFile(summaryPath, JSON.stringify(summary, null, 2), "utf-8");

    console.log(`Saved extraction result to ${outputPath}`);
    console.log(`Saved summary to ${summaryPath}`);
    console.log(`Extracted records: ${output.records.length}`);
    console.log(`Excluded obvious non-class entries: ${normalizedRecords.filter((record) => record.excluded_candidate).length}`);
    console.log(`Included suspect non-regular entries: ${normalizedRecords.filter((record) => record.suspect_non_regular && !record.excluded_candidate).length}`);

    if (output.records.length === 0) {
      console.warn("Warning: extraction returned 0 records.");
      console.warn(`Check debug files under ${debugDirPath}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (error instanceof FetchResourceError && error.responseBody) {
      await writeDebugFile(debugDirPath, baseName, "fetch-error-response.txt", error.responseBody);
    }

    await writeFailureDebugFile({
      debugDirPath,
      baseName,
      slug,
      locationName,
      sourceUrl,
      stage: error instanceof FetchResourceError ? "fetch_resource" : "job",
      message,
      details:
        error instanceof FetchResourceError
          ? {
              failed_url: error.url,
              status: error.status,
              status_text: error.statusText,
              response_body_preview: getResponseBodyPreview(error.responseBody),
            }
          : undefined,
    });
    throw error;
  }
}

async function main() {
  const args = parseArgs(process.argv);
  const target = args.target ? findJexerTarget(args.target) : null;

  if (!args.url && !target) {
    console.error("Usage: npm run extract:jexer -- --target=shinjuku");
    console.error("   or: npm run extract:jexer -- --url=https://example.com --location-name='任意店舗'");
    console.error("Available store targets:", jexerStoreTargets.map((item) => item.slug).join(", "));
    console.error("Available partial targets:", jexerPartialTargets.map((item) => item.slug).join(", "));
    console.error("Available group targets:", jexerTargetGroups.map((item) => item.slug).join(", "));
    process.exit(1);
  }

  if (target && isJexerGroupTarget(target)) {
    console.log(`[schedule-extract] group target: ${target.slug}`);

    for (const memberSlug of target.members) {
      const memberTarget = findJexerTarget(memberSlug);

      if (!memberTarget || !memberTarget.sourceUrl) {
        console.warn(`[schedule-extract] skipped missing member target: ${memberSlug}`);
        continue;
      }

      console.log(`[schedule-extract] running store target: ${memberTarget.slug} (${memberTarget.locationName})`);
      try {
        await runExtractionJob({
          slug: memberTarget.slug,
          locationName: memberTarget.locationName,
          sourceUrl: memberTarget.sourceUrl,
          adapter: memberTarget.adapter,
          shopId: memberTarget.shopId,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`[schedule-extract] failed store target: ${memberTarget.slug} (${memberTarget.sourceUrl}) - ${message}`);
      }
    }

    return;
  }

  const sourceUrl = args.url || target?.sourceUrl;
  const locationName = args.locationName || target?.locationName;
  const slug = target?.slug || "manual";

  if (!sourceUrl || !locationName) {
    console.error("Usage: npm run extract:jexer -- --target=shinjuku");
    console.error("   or: npm run extract:jexer -- --url=https://example.com --location-name='任意店舗'");
    process.exit(1);
  }

  await runExtractionJob({
    slug,
    locationName,
    sourceUrl,
    adapter: target?.adapter ?? "generic_discovery",
    shopId: target?.shopId,
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
