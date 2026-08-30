import { readFile, writeFile } from "node:fs/promises";
import { revalidateH37Sources, type H37SourceClaim } from "../../src/lib/hyrox-h3-7-source-revalidation";

function option(name: string) { const prefix = `--${name}=`; return process.argv.find((value) => value.startsWith(prefix))?.slice(prefix.length) ?? null; }

async function main() {
  const equipment = JSON.parse(await readFile("data/hyrox/h3-6-confirmed-equipment-candidates.json", "utf8")) as { candidates: H37SourceClaim[] };
  const capabilities = JSON.parse(await readFile("data/hyrox/h3-6-confirmed-capability-candidates.json", "utf8")) as { candidates: H37SourceClaim[] };
  if (equipment.candidates.length !== 73 || capabilities.candidates.length !== 25) throw new Error("H3-6 confirmed input mismatch");
  const result = await revalidateH37Sources([...equipment.candidates, ...capabilities.candidates], { checkedAt: option("checked-at") ?? new Date().toISOString(), retries: 1 });
  const output = option("output") ?? "data/hyrox/h3-7-targeted-source-revalidation.json";
  await writeFile(output, `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify({ output, uniqueUrls: result.uniqueUrls, relations: result.relations.length, attempts: result.requestAttempts, drift: result.driftCount }, null, 2));
  if (result.driftCount > 0) process.exitCode = 2;
}

main().catch((error) => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; });
