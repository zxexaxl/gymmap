import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { H34SourceRevalidation } from "../../src/lib/hyrox-h3-4-import-candidate";

function normalize(value: string) {
  return value
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replaceAll("&nbsp;", " ")
    .replaceAll("&amp;", "&")
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("ja");
}

async function checkSource(source: H34SourceRevalidation["sources"][number]) {
  let response: Response | null = null;
  let attempts = 0;
  for (;;) {
    attempts += 1;
    try {
      response = await fetch(source.url, {
        redirect: "follow",
        signal: AbortSignal.timeout(20_000),
        headers: { "User-Agent": "GymMap-HYROX-H3-4-Revalidation/1.0 (+https://gymmap.vercel.app)" },
      });
    } catch {
      if (attempts < 2) continue;
      throw new Error(`${source.source_ref}: source request failed after bounded retry`);
    }
    if (response.status >= 500 && attempts < 2) continue;
    break;
  }
  if (!response || response.status !== source.http_status) {
    throw new Error(`${source.source_ref}: HTTP authority drift (${response?.status ?? "network"})`);
  }
  const body = normalize(await response.text());
  const missing = source.marker_groups.filter((alternatives) =>
    !alternatives.some((marker) => body.includes(normalize(marker))),
  );
  if (missing.length > 0) {
    throw new Error(`${source.source_ref}: evidence basis missing: ${missing.map((group) => group.join(" OR ")).join(", ")}`);
  }
  return {
    source_ref: source.source_ref,
    url: source.url,
    final_url: response.url,
    http_status: response.status,
    attempts,
    marker_groups_checked: source.marker_groups.length,
    marker_groups_present: source.marker_groups.length,
    authority_match: source.authority_match,
    content_basis_present: source.content_basis_present,
  };
}

async function main() {
  const authority = JSON.parse(
    await readFile("data/hyrox/h3-4-equipment-source-revalidation.json", "utf8"),
  ) as H34SourceRevalidation;
  if (authority.sources.length !== 10 || authority.source_drift_count !== 0) {
    throw new Error("H3-4 requires exactly ten drift-free source authorities");
  }
  const results: Awaited<ReturnType<typeof checkSource>>[] = new Array(authority.sources.length);
  let next = 0;
  async function worker() {
    for (;;) {
      const index = next++;
      if (index >= authority.sources.length) return;
      results[index] = await checkSource(authority.sources[index]);
    }
  }
  await Promise.all(Array.from({ length: 4 }, () => worker()));
  const output = {
    schema_version: 1,
    authority_observed_at: authority.observed_at,
    run_checked_at: new Date().toISOString(),
    read_only: true,
    concurrency: 4,
    source_count: results.length,
    source_drift_count: 0,
    results,
  };
  const outputDirectory = path.resolve(".artifacts/h3-4-equipment-source-revalidation");
  await mkdir(outputDirectory, { recursive: true });
  await writeFile(path.join(outputDirectory, "latest.json"), `${JSON.stringify(output, null, 2)}\n`);
  console.log(JSON.stringify({ source_count: results.length, source_drift_count: 0, attempts: results.reduce((sum, row) => sum + row.attempts, 0) }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
