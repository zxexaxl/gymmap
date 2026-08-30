import { readFile, writeFile } from "node:fs/promises";
import { renderH38ManagementApiSql, renderH38PostVerify, renderH38ProductionSql } from "../../src/lib/hyrox-h3-8-production-sql";

async function main() {
  const candidate = JSON.parse(await readFile("data/hyrox/h3-7-targeted-equipment-import-candidate.json", "utf8"));
  await Promise.all([
    writeFile("data/hyrox/h3-8-targeted-equipment-production-release.sql", renderH38ProductionSql(candidate)),
    writeFile("data/hyrox/h3-8-targeted-equipment-production-release.management-api.sql", renderH38ManagementApiSql(candidate)),
    writeFile("data/hyrox/h3-8-targeted-equipment-postverify.sql", renderH38PostVerify(candidate)),
  ]);
}
main().catch((error) => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; });
