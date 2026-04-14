import "./load-env";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { normalizeProgramName } from "../../src/lib/normalizeProgramName";
import {
  generateStructuredJsonFromGeminiWithDebug,
  GeminiStructuredResponseError,
  getGeminiModelId,
} from "../../src/lib/extraction/gemini-client";
import { summarizeJexerExtractionResult } from "../../src/lib/extraction/jexer-summary";
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
  html: string;
  discoveredFrom: string | null;
  depth: number;
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

type PageSignalSummary = {
  hasTimeLikeText: boolean;
  hasTableTag: boolean;
  hasListLinkDensity: boolean;
};

class FetchHtmlError extends Error {
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
    this.name = "FetchHtmlError";
    this.url = url;
    this.status = status;
    this.statusText = statusText;
    this.responseBody = responseBody;
  }
}

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

async function fetchHtml(sourceUrl: string) {
  const response = await fetch(sourceUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Accept-Language": "ja,en-US;q=0.9,en;q=0.8",
      Referer: new URL(sourceUrl).origin,
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
  });

  const body = await response.text();

  if (!response.ok) {
    throw new FetchHtmlError({
      url: sourceUrl,
      status: response.status,
      statusText: response.statusText,
      responseBody: body,
      message: `Failed to fetch source HTML: ${response.status} ${response.statusText}`,
    });
  }

  return body;
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

function extractHtmlLinks(pageUrl: string, html: string) {
  const matches = html.matchAll(/href=["']([^"'#]+)["']/gi);
  const urls = new Set<string>();

  for (const match of matches) {
    const href = match[1];

    if (!href || href.startsWith("mailto:") || href.startsWith("javascript:")) {
      continue;
    }

    try {
      urls.add(new URL(href, pageUrl).toString());
    } catch {
      // Keep collection best-effort.
    }
  }

  return Array.from(urls);
}

function deriveBranchBaseUrl(sourceUrl: string) {
  const url = new URL(sourceUrl);
  const parts = url.pathname.split("/").filter(Boolean);

  if (parts[0] === "mb" && parts[1]) {
    return new URL(`/${parts[0]}/${parts[1]}/`, url.origin).toString();
  }

  const normalizedPath = url.pathname.endsWith("/") ? url.pathname : `${url.pathname.substring(0, url.pathname.lastIndexOf("/") + 1)}`;
  return new URL(normalizedPath || "/", url.origin).toString();
}

function isSameBranchUrl(candidateUrl: string, branchBaseUrl: string) {
  const candidate = new URL(candidateUrl);
  const branchBase = new URL(branchBaseUrl);
  return candidate.origin === branchBase.origin && candidate.pathname.startsWith(branchBase.pathname);
}

function isJexerInstructorUrl(candidateUrl: string) {
  return candidateUrl.includes("/instructor/");
}

function isJexerSharedScheduleUrl(candidateUrl: string) {
  return candidateUrl.includes("/mb/schedule/?shop=");
}

function isClearlyExcludedUrl(candidateUrl: string) {
  const lowerUrl = candidateUrl.toLowerCase();

  return ["/instructor/", "/contact", "/campaign", "/whatsnew", "/news", "/info.php"].some((keyword) => lowerUrl.includes(keyword));
}

function isRelevantScheduleUrl(candidateUrl: string, branchBaseUrl: string) {
  const candidate = new URL(candidateUrl);
  const branchBase = new URL(branchBaseUrl);
  const sameOrigin = candidate.origin === branchBase.origin;
  const isBranchUrl = candidate.pathname.startsWith(branchBase.pathname);

  return sameOrigin && isBranchUrl;
}

function normalizeWithinBranchUrls(urls: string[], branchBaseUrl: string) {
  return Array.from(
    new Set(
      urls
        .filter((url) => url.endsWith(".html") || url.endsWith(".pdf") || url.endsWith("/"))
        .filter((url) => isRelevantScheduleUrl(url, branchBaseUrl))
        .filter((url) => !isJexerSharedScheduleUrl(url))
        .filter((url) => !isClearlyExcludedUrl(url)),
    ),
  );
}

function scanHtmlKeywords(html: string) {
  const lowerHtml = html.toLowerCase();
  const keywords = ["table", "schedule", "program", "lesson", "studio"] as const;

  return Object.fromEntries(keywords.map((keyword) => [keyword, lowerHtml.includes(keyword)]));
}

function summarizePageSignals(html: string): PageSignalSummary {
  const lowerHtml = html.toLowerCase();
  const timeLikeMatches = html.match(/\b([01]?\d|2[0-3]):[0-5]\d\b/g) ?? [];
  const linkCount = (html.match(/<a\b/gi) ?? []).length;
  const rowCount = (html.match(/<tr\b/gi) ?? []).length + (html.match(/<li\b/gi) ?? []).length;

  return {
    hasTimeLikeText: timeLikeMatches.length >= 2,
    hasTableTag: lowerHtml.includes("<table"),
    hasListLinkDensity: linkCount >= 6 && rowCount <= 2,
  };
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
  const branchBaseUrl = deriveBranchBaseUrl(entryUrl);
  const visited = new Set<string>();
  const excludedSharedScheduleUrls = new Set<string>();
  const pages: CandidatePage[] = [];
  const queue: Array<{ url: string; discoveredFrom: string | null; depth: number }> = [
    { url: entryUrl, discoveredFrom: null, depth: 0 },
  ];

  while (queue.length > 0) {
    const current = queue.shift();

    if (!current || visited.has(current.url) || current.depth > 1) {
      continue;
    }

    visited.add(current.url);

    if (current.url.toLowerCase().endsWith(".pdf")) {
      pages.push({
        url: current.url,
        html: "",
        discoveredFrom: current.discoveredFrom,
        depth: current.depth,
      });
      continue;
    }

    const html = await fetchHtml(current.url);
    pages.push({
      url: current.url,
      html,
      discoveredFrom: current.discoveredFrom,
      depth: current.depth,
    });

    if (current.depth === 1) {
      continue;
    }

    const discoveredUrls = extractHtmlLinks(current.url, html);
    discoveredUrls.filter((url) => isJexerSharedScheduleUrl(url)).forEach((url) => excludedSharedScheduleUrls.add(url));
    const nextUrls = normalizeWithinBranchUrls(discoveredUrls, branchBaseUrl);

    for (const nextUrl of nextUrls) {
      if (!visited.has(nextUrl)) {
        queue.push({
          url: nextUrl,
          discoveredFrom: current.url,
          depth: current.depth + 1,
        });
      }
    }
  }

  return { branchBaseUrl, pages, excludedSharedScheduleUrls: Array.from(excludedSharedScheduleUrls) };
}

async function classifyCandidatePage(page: CandidatePage, branchBaseUrl: string) {
  const systemPrompt = [
    "You classify JEXER schedule-related HTML pages.",
    "Return only JSON that matches the schema.",
    "Classify each page as one of: entry, schedule_index, schedule_detail, pdf_schedule, instructor, ignore.",
    "entry means a store top or navigation page.",
    "schedule_index means a page that mainly links to schedule detail pages.",
    "schedule_detail means a page that directly contains rows for classes or lessons.",
    "pdf_schedule means the URL itself is a schedule PDF or strongly looks like a PDF schedule resource.",
    "instructor means a substitute teacher or instructor-specific page, not the main schedule page.",
    "Only recommend next URLs that stay under the same branch base URL.",
    `Branch base URL: ${branchBaseUrl}`,
  ].join(" ");

  if (page.url.toLowerCase().endsWith(".pdf")) {
    return {
      ...page,
      classification: {
        page_type: "pdf_schedule",
        schedule_kind: "unknown",
        contains_schedule_rows: false,
        contains_detail_links: false,
        recommended_next_links: [],
        confidence: 0.99,
      },
      rawResponseJson: JSON.stringify({ page_type: "pdf_schedule", inferred_from: "url_extension" }, null, 2),
      rawResponseText: "pdf_schedule inferred from .pdf URL",
      usageMetadata: null,
    } satisfies ClassifiedCandidatePage;
  }

  const userPrompt = [
    `Page URL: ${page.url}`,
    `Discovered from: ${page.discoveredFrom ?? "entry"}`,
    "Classify this page for studio schedule extraction.",
    page.html,
  ].join("\n\n");

  const result = await generateStructuredJsonFromGeminiWithDebug<PageClassification>({
    systemPrompt,
    userPrompt,
    responseSchema: classificationResponseSchema,
  });

  return {
    ...page,
    classification: {
      ...result.data,
      recommended_next_links: normalizeWithinBranchUrls(result.data.recommended_next_links, branchBaseUrl),
    },
    rawResponseJson: result.rawResponseJson,
    rawResponseText: result.rawResponseText,
    usageMetadata: result.usageMetadata,
  } satisfies ClassifiedCandidatePage;
}

async function classifyCandidatePages(pages: CandidatePage[], branchBaseUrl: string) {
  const classifiedPages: ClassifiedCandidatePage[] = [];

  for (const page of pages) {
    classifiedPages.push(await classifyCandidatePage(page, branchBaseUrl));
  }

  return classifiedPages;
}

async function collectRecommendedPages(classifiedPages: ClassifiedCandidatePage[], branchBaseUrl: string) {
  const existingUrls = new Set(classifiedPages.map((page) => page.url));
  const recommendedUrlSources = new Map<string, { discoveredFrom: CandidatePage["discoveredFrom"]; depth: number }>();
  const maxExplorationDepth = 3;

  for (const page of classifiedPages) {
    if (page.depth >= maxExplorationDepth) {
      continue;
    }

    if (page.classification.page_type !== "schedule_index" && page.classification.page_type !== "entry") {
      continue;
    }

    for (const url of page.classification.recommended_next_links) {
      if (!recommendedUrlSources.has(url)) {
        recommendedUrlSources.set(url, {
          discoveredFrom: `ai_recommendation:${page.url}`,
          depth: Math.min(maxExplorationDepth, page.depth + 1),
        });
      }
    }

    if (page.classification.page_type === "schedule_index") {
      for (const url of extractHtmlLinks(page.url, page.html).filter((url) => url.endsWith(".html") || url.endsWith(".pdf"))) {
        if (!recommendedUrlSources.has(url)) {
          recommendedUrlSources.set(url, {
            discoveredFrom: `index_link_collection:${page.url}`,
            depth: Math.min(maxExplorationDepth, page.depth + 1),
          });
        }
      }
    }
  }

  const recommendedUrls = Array.from(recommendedUrlSources.entries())
    .filter(([url]) => isSameBranchUrl(url, branchBaseUrl) && !existingUrls.has(url) && !isClearlyExcludedUrl(url))
    .map(([url, metadata]) => ({
      url,
      discoveredFrom: metadata.discoveredFrom,
      depth: metadata.depth,
    }));

  const pages: CandidatePage[] = [];

  for (const recommendedUrl of recommendedUrls) {
    const html = recommendedUrl.url.toLowerCase().endsWith(".pdf") ? "" : await fetchHtml(recommendedUrl.url);

    pages.push({
      url: recommendedUrl.url,
      html,
      discoveredFrom: recommendedUrl.discoveredFrom,
      depth: recommendedUrl.depth,
    });
  }

  return pages;
}

function selectExtractionTargets(classifiedPages: ClassifiedCandidatePage[]) {
  const broadDetailPages = classifiedPages.filter((page) => {
    const signals = summarizePageSignals(page.html);
    const isDetailLike =
      page.classification.page_type === "schedule_detail" || page.classification.page_type === "pdf_schedule";
    const hasScheduleContent =
      page.classification.page_type === "pdf_schedule" ||
      page.classification.contains_schedule_rows ||
      signals.hasTimeLikeText ||
      signals.hasTableTag;
    const isClearlyExcluded = isClearlyExcludedUrl(page.url);

    return isDetailLike && hasScheduleContent && !isClearlyExcluded;
  });
  const kindPriority = {
    studio: 0,
    bike: 1,
    hot_yoga: 2,
    mixed: 3,
    unknown: 4,
  } as const;

  const selectedPages = broadDetailPages.sort((left, right) => {
    const kindScore = kindPriority[left.classification.schedule_kind] - kindPriority[right.classification.schedule_kind];

    if (kindScore !== 0) {
      return kindScore;
    }

    return right.classification.confidence - left.classification.confidence;
  });

  return {
    selectedPages,
    selectedPageReasons: selectedPages.map((page) => ({
      url: page.url,
      page_type: page.classification.page_type,
      schedule_kind: page.classification.schedule_kind,
      confidence: page.classification.confidence,
      reason:
        page.classification.page_type === "pdf_schedule"
          ? "selected because the page looks like a schedule PDF"
          : "selected because AI marked this page as schedule_detail with schedule rows",
    })),
    selectionReason:
      selectedPages.length > 0
        ? "schedule_detail or pdf_schedule pages with schedule content, ordered by schedule_kind priority and confidence"
        : "no eligible schedule_detail or pdf_schedule pages detected",
  };
}

function buildExtractionHtml(selectedPages: ClassifiedCandidatePage[]) {
  return {
    extractionHtml: selectedPages
      .map((page) =>
        page.classification.page_type === "pdf_schedule"
          ? `<!-- ${page.url} -->\nPDF schedule URL: ${page.url}`
          : `<!-- ${page.url} -->\n${page.html}`,
      )
      .join("\n\n"),
    extractionUrls: selectedPages.map((page) => page.url),
  };
}

function buildExplorationSteps(classifiedPages: ClassifiedCandidatePage[], selectedUrls: Set<string>) {
  return classifiedPages
    .slice()
    .sort((left, right) => {
      if (left.depth !== right.depth) {
        return left.depth - right.depth;
      }

      return left.url.localeCompare(right.url);
    })
    .map((page, index) => ({
      step: index + 1,
      visited_url: page.url,
      discovered_from: page.discoveredFrom,
      depth: page.depth,
      page_type: page.classification.page_type,
      schedule_kind: page.classification.schedule_kind,
      recommended_next_links: page.classification.recommended_next_links,
      selected_for_extraction: selectedUrls.has(page.url),
    }));
}

function buildGeminiPrompts({
  locationName,
  sourceUrl,
  html,
}: {
  locationName: string;
  sourceUrl: string;
  html: string;
}) {
  const systemPrompt = [
    "You extract JEXER studio schedule rows from HTML.",
    "Return only JSON that matches the provided schema.",
    "Do not invent records that are not present in the HTML.",
    "Use 24-hour HH:MM format for start_time and end_time when possible.",
    "If instructor name is missing, set instructor_name to null.",
    "weekday should be english lowercase like monday, tuesday, wednesday, thursday, friday, saturday, sunday when inferable.",
  ].join(" ");

  const userPrompt = [
    `Location name: ${locationName}`,
    `Source URL: ${sourceUrl}`,
    "Extract only studio or lesson schedule rows from the following HTML.",
    html,
  ].join("\n\n");

  return { systemPrompt, userPrompt };
}

async function extractRecordsWithGemini({
  locationName,
  sourceUrl,
  html,
}: {
  locationName: string;
  sourceUrl: string;
  html: string;
}) {
  const prompts = buildGeminiPrompts({ locationName, sourceUrl, html });

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
      source_url: record.source_url || sourceUrl,
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
    };
  });
}

async function main() {
  const args = parseArgs(process.argv);
  const target = args.target ? findJexerTarget(args.target) : null;

  if (!args.url && !target) {
    console.error("Usage: npm run extract:jexer -- --target=shinjuku");
    console.error("   or: npm run extract:jexer -- --url=https://example.com --location-name='JEXER 任意店舗'");
    console.error("Available store targets:", jexerStoreTargets.map((item) => item.slug).join(", "));
    console.error("Available partial targets:", jexerPartialTargets.map((item) => item.slug).join(", "));
    console.error("Available group targets:", jexerTargetGroups.map((item) => item.slug).join(", "));
    process.exit(1);
  }

  if (target && isJexerGroupTarget(target)) {
    console.log(`[jexer] group target: ${target.slug}`);

    for (const memberSlug of target.members) {
      const memberTarget = findJexerTarget(memberSlug);

      if (!memberTarget || !memberTarget.sourceUrl) {
        console.warn(`[jexer] skipped missing member target: ${memberSlug}`);
        continue;
      }

      console.log(`[jexer] running store target: ${memberTarget.slug} (${memberTarget.locationName})`);
      try {
        await runExtractionJob({
          slug: memberTarget.slug,
          locationName: memberTarget.locationName,
          sourceUrl: memberTarget.sourceUrl,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`[jexer] failed store target: ${memberTarget.slug} (${memberTarget.sourceUrl}) - ${message}`);
      }
    }

    return;
  }

  const sourceUrl = args.url || target?.sourceUrl;
  const locationName = args.locationName || target?.locationName;
  const slug = target?.slug || "manual";

  if (!sourceUrl || !locationName) {
    console.error("Usage: npm run extract:jexer -- --target=shinjuku");
    console.error("   or: npm run extract:jexer -- --url=https://example.com --location-name='JEXER 任意店舗'");
    console.error("Available store targets:", jexerStoreTargets.map((item) => item.slug).join(", "));
    console.error("Available partial targets:", jexerPartialTargets.map((item) => item.slug).join(", "));
    console.error("Available group targets:", jexerTargetGroups.map((item) => item.slug).join(", "));
    process.exit(1);
  }

  await runExtractionJob({ slug, locationName, sourceUrl });
}

async function runExtractionJob({
  slug,
  locationName,
  sourceUrl,
}: Pick<JexerExtractionTarget, "slug" | "locationName" | "sourceUrl"> & { sourceUrl: string }) {
  const baseName = buildRunBaseName(slug);
  const outputPath = buildOutputPath(baseName);
  const debugDirPath = buildDebugDirPath();
  await mkdir(path.dirname(outputPath), { recursive: true });
  await mkdir(debugDirPath, { recursive: true });
  try {
    const { branchBaseUrl, pages: initialPages, excludedSharedScheduleUrls } = await collectCandidatePages(sourceUrl);
    let classifiedPages = await classifyCandidatePages(initialPages, branchBaseUrl);
    const maxNavigationRounds = 3;

    for (let round = 0; round < maxNavigationRounds; round += 1) {
      const recommendedPages = await collectRecommendedPages(classifiedPages, branchBaseUrl);

      if (recommendedPages.length === 0) {
        break;
      }

      classifiedPages = [...classifiedPages, ...(await classifyCandidatePages(recommendedPages, branchBaseUrl))];
    }

    const selection = selectExtractionTargets(classifiedPages);
    const explorationSteps = buildExplorationSteps(
      classifiedPages,
      new Set(selection.selectedPages.map((page) => page.url)),
    );

  await writeDebugFile(
    debugDirPath,
    baseName,
    "candidate-pages.json",
    JSON.stringify(
      {
        entry_url: sourceUrl,
        branch_base_url: branchBaseUrl,
        excluded_shared_schedule_urls: excludedSharedScheduleUrls,
        exploration_steps: explorationSteps,
        candidates: classifiedPages.map((page) => ({
          url: page.url,
          discovered_from: page.discoveredFrom,
          depth: page.depth,
          signals: summarizePageSignals(page.html),
          usage_metadata: page.usageMetadata,
          classification: page.classification,
        })),
      },
      null,
      2,
    ),
  );

  for (const [index, page] of classifiedPages.entries()) {
    await writeDebugFile(debugDirPath, baseName, `candidate-${index + 1}.html`, page.html);
    await writeDebugFile(
      debugDirPath,
      baseName,
      `candidate-${index + 1}.classification.json`,
      JSON.stringify(
        {
          url: page.url,
          discovered_from: page.discoveredFrom,
          signals: summarizePageSignals(page.html),
          usage_metadata: page.usageMetadata,
          classification: page.classification,
        },
        null,
        2,
      ),
    );
    await writeDebugFile(debugDirPath, baseName, `candidate-${index + 1}.classification-response.json`, page.rawResponseJson);
  }

    const { extractionHtml, extractionUrls } = buildExtractionHtml(selection.selectedPages);
    const keywordScan = scanHtmlKeywords(extractionHtml);
    const classificationUsageMetadata = aggregateUsageMetadata(classifiedPages.map((page) => page.usageMetadata));

    await writeDebugFile(
    debugDirPath,
    baseName,
    "selection.json",
    JSON.stringify(
      {
        selection_reason: selection.selectionReason,
        selected_urls: extractionUrls,
        selected_count: selection.selectedPages.length,
        selected_pages: selection.selectedPageReasons,
        exploration_steps: explorationSteps,
        excluded_shared_schedule_urls: excludedSharedScheduleUrls,
        usage_metadata: classificationUsageMetadata,
      },
      null,
      2,
    ),
  );
    await writeDebugFile(debugDirPath, baseName, "source.html", extractionHtml);
    await writeDebugFile(
    debugDirPath,
    baseName,
    "html-keywords.json",
    JSON.stringify(
      {
        source_url: sourceUrl,
        extraction_urls: extractionUrls,
        keywords: keywordScan,
        usage_metadata: classificationUsageMetadata,
      },
      null,
      2,
    ),
  );

    console.log("Selected extraction pages:", extractionUrls);
    console.log("HTML keyword scan:", keywordScan);

    if (selection.selectedPages.length === 0) {
      const reasonMessage = `No extraction pages selected for ${slug}.`;
      await writeFailureDebugFile({
        debugDirPath,
        baseName,
        slug,
        locationName,
        sourceUrl,
        stage: "selection",
        message: reasonMessage,
        details: {
          selection_reason: selection.selectionReason,
          candidate_count: classifiedPages.length,
          candidate_urls: classifiedPages.map((page) => page.url),
          exploration_steps: explorationSteps,
          selected_pages: selection.selectedPageReasons,
          excluded_shared_schedule_urls: excludedSharedScheduleUrls,
          shared_schedule_policy: "excluded because /mb/schedule/?shop=... returns unstable 500 responses",
        },
      });
      throw new Error(`${reasonMessage} ${selection.selectionReason}`);
    }

    const prompts = buildGeminiPrompts({ locationName, sourceUrl: extractionUrls.join(", "), html: extractionHtml });
    await writeDebugFile(
    debugDirPath,
    baseName,
    "gemini-input.txt",
    [`Model ID: ${getGeminiModelId()}`, "", "[System Prompt]", prompts.systemPrompt, "", "[User Prompt]", prompts.userPrompt].join(
      "\n",
    ),
  );

    let geminiResult:
    | {
        systemPrompt: string;
        userPrompt: string;
        rawResponseJson: string;
        rawResponseText: string;
        usageMetadata: GeminiUsageMetadata | null;
        records: ExtractedJexerScheduleRecord[];
      }
    | null = null;

    try {
      geminiResult = await extractRecordsWithGemini({
        locationName,
        sourceUrl: extractionUrls.join(", "),
        html: extractionHtml,
      });
    } catch (error) {
      if (error instanceof GeminiStructuredResponseError) {
        await writeDebugFile(
          debugDirPath,
          baseName,
          "gemini-response.json",
          error.rawResponseJson || JSON.stringify({ error: error.message }, null, 2),
        );

        if (error.rawResponseText) {
          await writeDebugFile(debugDirPath, baseName, "gemini-response-text.txt", error.rawResponseText);
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
      });
      throw error;
    }

    await writeDebugFile(debugDirPath, baseName, "gemini-response.json", geminiResult.rawResponseJson);
    await writeDebugFile(debugDirPath, baseName, "gemini-response-text.txt", geminiResult.rawResponseText);
    await writeDebugFile(
    debugDirPath,
    baseName,
    "usage-metadata.json",
    JSON.stringify(
      {
        model_id: getGeminiModelId(),
        classification: classificationUsageMetadata,
        extraction: geminiResult.usageMetadata,
        total: aggregateUsageMetadata([classificationUsageMetadata, geminiResult.usageMetadata]),
        pages: classifiedPages.map((page) => ({
          url: page.url,
          discovered_from: page.discoveredFrom,
          usage_metadata: page.usageMetadata,
          page_type: page.classification.page_type,
          schedule_kind: page.classification.schedule_kind,
        })),
      },
      null,
      2,
    ),
  );

    const normalizedRecords = normalizeRecords(geminiResult.records);
    const usageBreakdown: JexerUsageBreakdown = {
      classification: classificationUsageMetadata,
      extraction: geminiResult.usageMetadata,
    };
    const output: JexerExtractionResult = {
      location_name: locationName,
      source_url: sourceUrl,
      fetched_at: new Date().toISOString(),
      model_id: getGeminiModelId(),
      usage_metadata: aggregateUsageMetadata([usageBreakdown.classification, usageBreakdown.extraction]),
      usage_breakdown: usageBreakdown,
      records: normalizedRecords,
    };

    await writeFile(outputPath, JSON.stringify(output, null, 2), "utf-8");
    const summary = summarizeJexerExtractionResult(output);
    const summaryPath = outputPath.replace(/\.json$/i, ".summary.json");
    await writeFile(summaryPath, JSON.stringify(summary, null, 2), "utf-8");

    console.log(`Saved extraction result to ${outputPath}`);
    console.log(`Saved summary to ${summaryPath}`);
    console.log(`Extracted records: ${output.records.length}`);

    if (output.records.length === 0) {
      console.warn("Warning: extraction returned 0 records.");
      console.warn(`Check debug files under ${debugDirPath}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (error instanceof FetchHtmlError && error.responseBody) {
      await writeDebugFile(
        debugDirPath,
        baseName,
        "fetch-error-response.txt",
        error.responseBody,
      );
    }

    await writeFailureDebugFile({
      debugDirPath,
      baseName,
      slug,
      locationName,
      sourceUrl,
      stage: error instanceof FetchHtmlError ? "fetch_html" : "job",
      message,
      details:
        error instanceof FetchHtmlError
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

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
