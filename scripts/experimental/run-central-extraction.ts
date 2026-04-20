import "./load-env";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { PDFParse } from "pdf-parse";

import { normalizeProgramName } from "../../src/lib/normalizeProgramName";
import {
  CENTRAL_TOKYO_CLUB_LIST_URL,
  extractTokyoClubCandidates,
  findScheduleTabUrl,
  findStudioScheduleCandidates,
  type CentralClubCandidate,
  type CentralSkipReason,
  type CentralStudioScheduleCandidate,
} from "../../src/lib/extraction/central-adapter";
import { classifyScheduleEntryType } from "../../src/lib/extraction/entry-type-classifier";
import { buildParsedGeminiDebugArtifacts } from "../../src/lib/extraction/gemini-debug";
import {
  generateStructuredJsonFromGeminiWithDebug,
  GeminiStructuredResponseError,
  getGeminiModelId,
} from "../../src/lib/extraction/gemini-client";
import { summarizeJexerExtractionResult } from "../../src/lib/extraction/jexer-summary";
import { findCentralTarget } from "../../src/lib/extraction/central-targets";
import type {
  ExtractedJexerScheduleRecord,
  GeminiUsageMetadata,
  JexerExtractionResult,
} from "../../src/lib/extraction/jexer-types";

type CentralScheduleResource = {
  club: CentralClubCandidate;
  scheduleTabUrl: string;
  topPageHtml: string;
  schedulePageHtml: string | null;
  selectedCandidate: CentralStudioScheduleCandidate & { format: "html" | "pdf" };
};

type ClubDiscoveryDebug = {
  slug: string;
  club_name: string;
  club_url: string;
  schedule_tab_url: string | null;
  has_schedule_tab: boolean;
  schedule_tab_fetch_ok: boolean;
  studio_schedule_candidates: CentralStudioScheduleCandidate[];
  selected_studio_schedule_url: string | null;
  skip_reason: CentralSkipReason | null;
  notes: string[];
};

type PageExtractionResult = {
  rawResponseJson: string;
  rawResponseText: string;
  usageMetadata: GeminiUsageMetadata | null;
  records: ExtractedJexerScheduleRecord[];
};

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

function parseArgs(argv: string[]) {
  const args = argv.slice(2);
  const result: { target?: string } = {};

  args.forEach((arg) => {
    if (arg.startsWith("--target=")) {
      result.target = arg.replace("--target=", "");
    }
  });

  return result;
}

function buildRunBaseName(slug: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `${slug}-${timestamp}`;
}

function buildOutputPath(baseName: string) {
  return path.join(process.cwd(), "output", "central", `${baseName}.json`);
}

function buildDebugDirPath() {
  return path.join(process.cwd(), "output", "central", "debug");
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

async function writeDebugFile(debugDirPath: string, baseName: string, suffix: string, contents: string) {
  await writeFile(path.join(debugDirPath, `${baseName}.${suffix}`), contents, "utf-8");
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

function buildExtractionPrompt({
  locationName,
  sourceUrl,
  content,
  contentKind,
}: {
  locationName: string;
  sourceUrl: string;
  content: string;
  contentKind: "html" | "pdf";
}) {
  const sharedInstructions = [
    "You extract Central Sports studio lesson schedule rows.",
    "Return only JSON that matches the provided schema.",
    "Extract studio lesson rows only.",
    "Ignore pool-only schedules, gym area-only schedules, notices, headlines, campaign text, and other non-schedule content.",
    "Use 24-hour HH:MM format when inferable.",
    "If instructor name is missing, set instructor_name to null.",
    "weekday should be english lowercase when inferable.",
    "If the page shows section names such as Aスタジオ, Bスタジオ, HOTスタジオ, or similar, set section_or_area when inferable.",
    "For each extracted block, classify entry_type_candidate as one of regular_class, support_session, personal_session, school_course, member_guidance, excluded_candidate.",
    "Use excluded_candidate only for obvious non-class content such as ads, notes, business guidance, or page headings.",
  ].join(" ");

  return {
    systemPrompt: contentKind === "pdf" ? `${sharedInstructions} The source is PDF text.` : `${sharedInstructions} The source is HTML.`,
    userPrompt: [`Location name: ${locationName}`, `Source URL: ${sourceUrl}`, content].join("\n\n"),
  };
}

async function extractRecordsWithGemini({
  locationName,
  sourceUrl,
  content,
  contentKind,
}: {
  locationName: string;
  sourceUrl: string;
  content: string;
  contentKind: "html" | "pdf";
}) {
  const prompts = buildExtractionPrompt({
    locationName,
    sourceUrl,
    content,
    contentKind,
  });

  const response = await generateStructuredJsonFromGeminiWithDebug<{ records: ExtractedJexerScheduleRecord[] }>({
    systemPrompt: prompts.systemPrompt,
    userPrompt: prompts.userPrompt,
    responseSchema: extractionResponseSchema,
  });

  return {
    rawResponseJson: response.rawResponseJson,
    rawResponseText: response.rawResponseText,
    usageMetadata: response.usageMetadata,
    records: response.data.records.map((record) => ({
      ...record,
      location_name: record.location_name || locationName,
      source_url: record.source_url || sourceUrl,
    })),
  } satisfies PageExtractionResult;
}

async function discoverCentralStudioTargets({
  debugDirPath,
  baseName,
}: {
  debugDirPath: string;
  baseName: string;
}) {
  const listResource = await fetchHtml(CENTRAL_TOKYO_CLUB_LIST_URL);
  const clubs = extractTokyoClubCandidates(CENTRAL_TOKYO_CLUB_LIST_URL, listResource.html);
  const discoveryDebug: ClubDiscoveryDebug[] = [];
  const selectedResources: CentralScheduleResource[] = [];

  await writeDebugFile(debugDirPath, baseName, "tokyo-club-list.html", listResource.html);

  for (const club of clubs) {
    const notes: string[] = [];
    let topPage;
    try {
      topPage = await fetchHtml(club.url);
    } catch (error) {
      discoveryDebug.push({
        slug: club.slug,
        club_name: club.name,
        club_url: club.url,
        schedule_tab_url: null,
        has_schedule_tab: false,
        schedule_tab_fetch_ok: false,
        studio_schedule_candidates: [],
        selected_studio_schedule_url: null,
        skip_reason: "club_top_fetch_failed",
        notes: [error instanceof Error ? error.message : String(error)],
      });
      continue;
    }
    const scheduleTabUrl = findScheduleTabUrl(club.url, topPage.html);
    let schedulePageHtml: string | null = null;
    let skipReason: CentralSkipReason | null = null;

    await writeDebugFile(debugDirPath, baseName, `club-${club.slug}.top.html`, topPage.html);

    if (!scheduleTabUrl) {
      skipReason = "no_schedule_tab";
      discoveryDebug.push({
        slug: club.slug,
        club_name: club.name,
        club_url: club.url,
        schedule_tab_url: null,
        has_schedule_tab: false,
        schedule_tab_fetch_ok: false,
        studio_schedule_candidates: [],
        selected_studio_schedule_url: null,
        skip_reason: skipReason,
        notes,
      });
      continue;
    }

    let scheduleTabFetchOk = false;
    if (scheduleTabUrl !== club.url) {
      try {
        const schedulePage = await fetchHtml(scheduleTabUrl);
        schedulePageHtml = schedulePage.html;
        scheduleTabFetchOk = true;
        await writeDebugFile(debugDirPath, baseName, `club-${club.slug}.schedule.html`, schedulePageHtml);
      } catch (error) {
        notes.push(error instanceof Error ? error.message : String(error));
      }
    } else {
      schedulePageHtml = topPage.html;
      scheduleTabFetchOk = true;
    }

    const studioCandidates = [
      ...findStudioScheduleCandidates({
        pageUrl: club.url,
        html: topPage.html,
        sourcePage: "club_top",
      }),
      ...(schedulePageHtml
        ? findStudioScheduleCandidates({
            pageUrl: scheduleTabUrl,
            html: schedulePageHtml,
            sourcePage: "schedule_tab",
          })
        : []),
    ].sort((left, right) => right.score - left.score || left.url.localeCompare(right.url));

    const selectedCandidate = studioCandidates[0] ?? null;

    if (!selectedCandidate) {
      skipReason = scheduleTabFetchOk ? "no_studio_schedule_link" : "schedule_tab_fetch_failed";
      discoveryDebug.push({
        slug: club.slug,
        club_name: club.name,
        club_url: club.url,
        schedule_tab_url: scheduleTabUrl,
        has_schedule_tab: true,
        schedule_tab_fetch_ok: scheduleTabFetchOk,
        studio_schedule_candidates: studioCandidates,
        selected_studio_schedule_url: null,
        skip_reason: skipReason,
        notes,
      });
      continue;
    }

    if (selectedCandidate.format === "unknown") {
      skipReason = "unsupported_format";
      discoveryDebug.push({
        slug: club.slug,
        club_name: club.name,
        club_url: club.url,
        schedule_tab_url: scheduleTabUrl,
        has_schedule_tab: true,
        schedule_tab_fetch_ok: scheduleTabFetchOk,
        studio_schedule_candidates: studioCandidates,
        selected_studio_schedule_url: selectedCandidate.url,
        skip_reason: skipReason,
        notes,
      });
      continue;
    }

    selectedResources.push({
      club,
      scheduleTabUrl,
      topPageHtml: topPage.html,
      schedulePageHtml,
      selectedCandidate: selectedCandidate as CentralStudioScheduleCandidate & { format: "html" | "pdf" },
    });
    discoveryDebug.push({
      slug: club.slug,
      club_name: club.name,
      club_url: club.url,
      schedule_tab_url: scheduleTabUrl,
      has_schedule_tab: true,
      schedule_tab_fetch_ok: scheduleTabFetchOk,
      studio_schedule_candidates: studioCandidates,
      selected_studio_schedule_url: selectedCandidate.url,
      skip_reason: null,
      notes,
    });
  }

  await writeDebugFile(
    debugDirPath,
    baseName,
    "discovery.json",
    JSON.stringify(
      {
        entry_url: CENTRAL_TOKYO_CLUB_LIST_URL,
        tokyo_clubs_discovered: clubs,
        clubs: discoveryDebug,
      },
      null,
      2,
    ),
  );

  return {
    clubs,
    selectedResources,
    discoveryDebug,
  };
}

async function runExtractionJob(slug: string, locationName: string) {
  const baseName = buildRunBaseName(slug);
  const outputPath = buildOutputPath(baseName);
  const debugDirPath = buildDebugDirPath();
  await mkdir(path.dirname(outputPath), { recursive: true });
  await mkdir(debugDirPath, { recursive: true });

  const { selectedResources, discoveryDebug } = await discoverCentralStudioTargets({
    debugDirPath,
    baseName,
  });

  const extractionResults: Array<{
    club: CentralClubCandidate;
    selectedCandidate: CentralStudioScheduleCandidate;
    extraction: PageExtractionResult;
  }> = [];

  for (const resource of selectedResources) {
    try {
      const extractedContent =
        resource.selectedCandidate.format === "pdf"
          ? await fetchPdfText(resource.selectedCandidate.url)
          : await fetchHtml(resource.selectedCandidate.url);

      const content = "pdfText" in extractedContent ? extractedContent.pdfText : extractedContent.html;
      await writeDebugFile(
        debugDirPath,
        baseName,
        `club-${resource.club.slug}.studio-source.${resource.selectedCandidate.format === "pdf" ? "pdf.txt" : "html"}`,
        content,
      );

      const prompt = buildExtractionPrompt({
        locationName: resource.club.name,
        sourceUrl: resource.selectedCandidate.url,
        content,
        contentKind: resource.selectedCandidate.format,
      });
      await writeDebugFile(
        debugDirPath,
        baseName,
        `club-${resource.club.slug}.gemini-input.txt`,
        [`Model ID: ${getGeminiModelId()}`, "", "[System Prompt]", prompt.systemPrompt, "", "[User Prompt]", prompt.userPrompt].join(
          "\n",
        ),
      );

      const extraction = await extractRecordsWithGemini({
        locationName: resource.club.name,
        sourceUrl: resource.selectedCandidate.url,
        content,
        contentKind: resource.selectedCandidate.format,
      });

      extractionResults.push({
        club: resource.club,
        selectedCandidate: resource.selectedCandidate,
        extraction,
      });

      await writeDebugFile(
        debugDirPath,
        baseName,
        `club-${resource.club.slug}.gemini-response.json`,
        extraction.rawResponseJson,
      );
      await writeDebugFile(
        debugDirPath,
        baseName,
        `club-${resource.club.slug}.gemini-response.txt`,
        extraction.rawResponseText,
      );
      const parsedArtifacts = buildParsedGeminiDebugArtifacts(extraction.rawResponseText);

      if (parsedArtifacts.parsedJson) {
        await writeDebugFile(
          debugDirPath,
          baseName,
          `club-${resource.club.slug}.parsed-records.json`,
          parsedArtifacts.parsedJson,
        );
      } else if (parsedArtifacts.parseErrorJson) {
        await writeDebugFile(
          debugDirPath,
          baseName,
          `club-${resource.club.slug}.parsed-records.error.json`,
          parsedArtifacts.parseErrorJson,
        );
      }
    } catch (error) {
      const clubDebug = discoveryDebug.find((item) => item.slug === resource.club.slug);
      if (clubDebug) {
        clubDebug.skip_reason = error instanceof FetchResourceError ? "studio_schedule_fetch_failed" : "extraction_failed";
        clubDebug.notes.push(error instanceof Error ? error.message : String(error));
      }

      if (error instanceof GeminiStructuredResponseError) {
        await writeDebugFile(
          debugDirPath,
          baseName,
          `club-${resource.club.slug}.gemini-response.json`,
          error.rawResponseJson || JSON.stringify({ error: error.message }, null, 2),
        );

        if (error.rawResponseText) {
          const parsedArtifacts = buildParsedGeminiDebugArtifacts(error.rawResponseText);

          if (parsedArtifacts.parsedJson) {
            await writeDebugFile(
              debugDirPath,
              baseName,
              `club-${resource.club.slug}.parsed-records.json`,
              parsedArtifacts.parsedJson,
            );
          } else if (parsedArtifacts.parseErrorJson) {
            await writeDebugFile(
              debugDirPath,
              baseName,
              `club-${resource.club.slug}.parsed-records.error.json`,
              parsedArtifacts.parseErrorJson,
            );
          }
        }
      }
    }
  }

  const normalizedRecords = normalizeRecords(extractionResults.flatMap((item) => item.extraction.records));
  const includedRecords = normalizedRecords.filter((record) => record.included_in_schedule_results);
  const usageMetadata = aggregateUsageMetadata(extractionResults.map((item) => item.extraction.usageMetadata));

  const output: JexerExtractionResult = {
    location_name: locationName,
    source_url: CENTRAL_TOKYO_CLUB_LIST_URL,
    fetched_at: new Date().toISOString(),
    model_id: getGeminiModelId(),
    usage_metadata: usageMetadata,
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
          location_name: record.location_name,
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
  const summaryPath = outputPath.replace(/\.json$/i, ".summary.json");
  await writeFile(
    summaryPath,
    JSON.stringify(await summarizeJexerExtractionResult(output, { currentOutputPath: outputPath }), null, 2),
    "utf-8",
  );
  await writeDebugFile(
    debugDirPath,
    baseName,
    "discovery.json",
    JSON.stringify(
      {
        entry_url: CENTRAL_TOKYO_CLUB_LIST_URL,
        clubs: discoveryDebug,
      },
      null,
      2,
    ),
  );

  console.log(`Saved extraction result to ${outputPath}`);
  console.log(`Saved summary to ${summaryPath}`);
  console.log(`Processed clubs with studio schedules: ${extractionResults.length}`);
  console.log(`Extracted records: ${includedRecords.length}`);
}

async function main() {
  const args = parseArgs(process.argv);
  const targetSlug = args.target ?? "tokyo-central-studios";
  const target = findCentralTarget(targetSlug);

  if (!target) {
    console.error("Usage: npm run extract:central -- --target=tokyo-central-studios");
    process.exit(1);
  }

  await runExtractionJob(target.slug, target.locationName);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
