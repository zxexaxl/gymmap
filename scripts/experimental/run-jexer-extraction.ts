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
import { findJexerTarget, jexerTokyoTargets } from "../../src/lib/extraction/jexer-targets";
import type { ExtractedJexerScheduleRecord, JexerExtractionResult } from "../../src/lib/extraction/jexer-types";

type CandidatePage = {
  url: string;
  html: string;
  discoveredFrom: string | null;
  depth: number;
};

type PageClassification = {
  page_type: "schedule_index" | "schedule_detail" | "schedule_day_detail" | "ignore";
  schedule_kind: "studio" | "aqua" | "mixed" | "unknown";
  contains_schedule_rows: boolean;
  contains_detail_links: boolean;
  recommended_next_urls: string[];
  confidence: number;
};

type ClassifiedCandidatePage = CandidatePage & {
  classification: PageClassification;
  rawResponseJson: string;
  rawResponseText: string;
};

type PageSignalSummary = {
  hasTimeLikeText: boolean;
  hasTableTag: boolean;
  hasListLinkDensity: boolean;
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
    page_type: { type: "STRING", enum: ["schedule_index", "schedule_detail", "schedule_day_detail", "ignore"] },
    schedule_kind: { type: "STRING", enum: ["studio", "aqua", "mixed", "unknown"] },
    contains_schedule_rows: { type: "BOOLEAN" },
    contains_detail_links: { type: "BOOLEAN" },
    recommended_next_urls: {
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
    "recommended_next_urls",
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
      "User-Agent": "GymMap-JEXER-Experiment/0.1",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch source HTML: ${response.status} ${response.statusText}`);
  }

  return response.text();
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

function normalizeWithinBranchUrls(urls: string[], branchBaseUrl: string) {
  return Array.from(
    new Set(
      urls
        .filter((url) => url.endsWith(".html") || url.endsWith("/"))
        .filter((url) => isSameBranchUrl(url, branchBaseUrl)),
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

async function collectCandidatePages(entryUrl: string) {
  const branchBaseUrl = deriveBranchBaseUrl(entryUrl);
  const visited = new Set<string>();
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

    const nextUrls = normalizeWithinBranchUrls(extractHtmlLinks(current.url, html), branchBaseUrl);

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

  return { branchBaseUrl, pages };
}

async function classifyCandidatePage(page: CandidatePage, branchBaseUrl: string) {
  const systemPrompt = [
    "You classify JEXER schedule-related HTML pages.",
    "Return only JSON that matches the schema.",
    "Judge whether the page is a schedule entrance page, a schedule detail page, a day detail page, or irrelevant.",
    "Only recommend next URLs that stay under the same branch base URL.",
    `Branch base URL: ${branchBaseUrl}`,
  ].join(" ");

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
      recommended_next_urls: normalizeWithinBranchUrls(result.data.recommended_next_urls, branchBaseUrl),
    },
    rawResponseJson: result.rawResponseJson,
    rawResponseText: result.rawResponseText,
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
  const recommendedUrls = Array.from(
    new Set(classifiedPages.flatMap((page) => page.classification.recommended_next_urls)),
  ).filter((url) => isSameBranchUrl(url, branchBaseUrl) && !existingUrls.has(url));

  const pages: CandidatePage[] = [];

  for (const recommendedUrl of recommendedUrls) {
    const html = await fetchHtml(recommendedUrl);
    pages.push({
      url: recommendedUrl,
      html,
      discoveredFrom: "ai_recommendation",
      depth: 2,
    });
  }

  return pages;
}

function selectExtractionTargets(classifiedPages: ClassifiedCandidatePage[]) {
  const eligibleStudioPages = classifiedPages.filter((page) => {
    const signals = summarizePageSignals(page.html);
    const isStudio = page.classification.schedule_kind === "studio";
    const isDetailLike =
      page.classification.page_type === "schedule_day_detail" || page.classification.page_type === "schedule_detail";
    const hasScheduleContent = page.classification.contains_schedule_rows && (signals.hasTimeLikeText || signals.hasTableTag);
    const isLinkOnlyIndex = page.classification.contains_detail_links && signals.hasListLinkDensity && !signals.hasTimeLikeText;

    return isStudio && isDetailLike && hasScheduleContent && !isLinkOnlyIndex;
  });

  const detailStudioPages = eligibleStudioPages.filter((page) => page.classification.page_type === "schedule_day_detail");
  const secondaryStudioPages = eligibleStudioPages.filter((page) => page.classification.page_type === "schedule_detail");

  const selectedPages =
    detailStudioPages.length > 0
      ? detailStudioPages
      : secondaryStudioPages.length > 0
        ? secondaryStudioPages
        : [];

  return {
    selectedPages,
    selectionReason:
      detailStudioPages.length > 0
        ? "studio day-detail pages with time-like schedule content"
        : secondaryStudioPages.length > 0
          ? "studio detail pages with time-like schedule content"
          : "no eligible studio schedule detail pages detected",
  };
}

function buildExtractionHtml(selectedPages: ClassifiedCandidatePage[]) {
  return {
    extractionHtml: selectedPages.map((page) => `<!-- ${page.url} -->\n${page.html}`).join("\n\n"),
    extractionUrls: selectedPages.map((page) => page.url),
  };
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
  const sourceUrl = args.url || target?.sourceUrl;
  const locationName = args.locationName || target?.locationName;
  const slug = target?.slug || "manual";

  if (!sourceUrl || !locationName) {
    console.error("Usage: npm run extract:jexer -- --target=shinjuku");
    console.error("   or: npm run extract:jexer -- --url=https://example.com --location-name='JEXER 任意店舗'");
    console.error("Available targets:", jexerTokyoTargets.map((item) => item.slug).join(", "));
    process.exit(1);
  }

  const baseName = buildRunBaseName(slug);
  const outputPath = buildOutputPath(baseName);
  const debugDirPath = buildDebugDirPath();
  await mkdir(path.dirname(outputPath), { recursive: true });
  await mkdir(debugDirPath, { recursive: true });

  const { branchBaseUrl, pages: initialPages } = await collectCandidatePages(sourceUrl);
  let classifiedPages = await classifyCandidatePages(initialPages, branchBaseUrl);
  let selection = selectExtractionTargets(classifiedPages);

  if (selection.selectedPages.length === 0) {
    const recommendedPages = await collectRecommendedPages(classifiedPages, branchBaseUrl);

    if (recommendedPages.length > 0) {
      classifiedPages = [...classifiedPages, ...(await classifyCandidatePages(recommendedPages, branchBaseUrl))];
      selection = selectExtractionTargets(classifiedPages);
    }
  }

  await writeDebugFile(
    debugDirPath,
    baseName,
    "candidate-pages.json",
    JSON.stringify(
      {
        entry_url: sourceUrl,
        branch_base_url: branchBaseUrl,
        candidates: classifiedPages.map((page) => ({
          url: page.url,
          discovered_from: page.discoveredFrom,
          depth: page.depth,
          signals: summarizePageSignals(page.html),
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

  await writeDebugFile(
    debugDirPath,
    baseName,
    "selection.json",
    JSON.stringify(
      {
        selection_reason: selection.selectionReason,
        selected_urls: extractionUrls,
        selected_count: selection.selectedPages.length,
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
      },
      null,
      2,
    ),
  );

  console.log("Selected extraction pages:", extractionUrls);
  console.log("HTML keyword scan:", keywordScan);

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

    throw error;
  }

  await writeDebugFile(debugDirPath, baseName, "gemini-response.json", geminiResult.rawResponseJson);
  await writeDebugFile(debugDirPath, baseName, "gemini-response-text.txt", geminiResult.rawResponseText);

  const normalizedRecords = normalizeRecords(geminiResult.records);
  const output: JexerExtractionResult = {
    location_name: locationName,
    source_url: sourceUrl,
    fetched_at: new Date().toISOString(),
    model_id: getGeminiModelId(),
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
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
