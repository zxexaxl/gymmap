import "./load-env";

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { summarizeJexerExtractionResult } from "../../src/lib/extraction/jexer-summary";
import type { JexerExtractionResult } from "../../src/lib/extraction/jexer-types";

function parseArgs(argv: string[]) {
  const args = argv.slice(2);
  const result: { file?: string; topN: number } = { topN: 10 };

  args.forEach((arg) => {
    if (arg.startsWith("--file=")) {
      result.file = arg.replace("--file=", "");
    }

    if (arg.startsWith("--top=")) {
      result.topN = Number(arg.replace("--top=", "")) || 10;
    }
  });

  return result;
}

async function main() {
  const args = parseArgs(process.argv);

  if (!args.file) {
    console.error("Usage: npm run summary:jexer -- --file=output/jexer/shinjuku-xxxx.json");
    process.exit(1);
  }

  const resolvedPath = path.resolve(process.cwd(), args.file);
  const json = await readFile(resolvedPath, "utf-8");
  const extraction = JSON.parse(json) as JexerExtractionResult;
  const summary = await summarizeJexerExtractionResult(extraction, {
    topN: args.topN,
    currentOutputPath: resolvedPath,
  });
  const summaryPath = resolvedPath.replace(/\.json$/i, ".summary.json");

  await writeFile(summaryPath, JSON.stringify(summary, null, 2), "utf-8");

  console.log(JSON.stringify(summary, null, 2));
  console.log(`Saved summary to ${summaryPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
