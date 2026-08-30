import { readFile, writeFile } from "node:fs/promises";
import { renderH37Rehearsal } from "../../src/lib/hyrox-h3-7-rehearsal-sql";

async function main() {
  const candidate = JSON.parse(await readFile("data/hyrox/h3-7-targeted-equipment-import-candidate.json", "utf8"));
  await writeFile("data/hyrox/h3-7-targeted-equipment-import-candidate.rehearsal.sql", renderH37Rehearsal(candidate));
}
main().catch((error) => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; });
