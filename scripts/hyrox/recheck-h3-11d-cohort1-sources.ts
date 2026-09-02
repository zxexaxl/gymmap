import fs from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { normalizeSupportText } from "../../src/lib/hyrox-enrichment-monitor";

type Source = {
  source_ref: string;
  hgy_id: string;
  location_id: string;
  requested_url: string;
  final_url: string;
  canonical_url: string | null;
  source_class: string;
  facility_binding: string;
  page_title: string;
};

const aliasByHgy: Record<string, string[]> = {
  HGY_4GF2DeDJoIzNRU4jn9scAv65V: ["club 360", "club360"],
  HGY_6lR3pcwsQaSGSlsQTdrNrO1jc: ["fitone", "fit one"],
  HGY_C0V7CK7K15SLUrMhBvyyO0phM: ["g-zone", "g zone"],
  HGY_CKpn4DHneWfrqTUVaA7D5Whop: ["vamos"],
  HGY_Cl8QF5olON4Y0D7mho4iGg34L: ["crossfit ashiya", "クロスフィット芦屋"],
  HGY_gp7GcAxbIZtxk5KpvoDwAOOcr: ["improve", "インプルーブ"],
  HGY_j1Szv4JmxytARCgfm48f0Z4xS: ["htc chikusa", "htc", "千種"],
  HGY_w8GnFtzgPzHOTZfWMBGzdEtoC: ["nota gym", "nota"],
};

function option(name: string) {
  const prefix = `--${name}=`;
  return process.argv.find((value) => value.startsWith(prefix))?.slice(prefix.length) ?? null;
}

function retryAfter(value: string | null) {
  if (!value) return 250;
  const numeric = Number(value);
  if (Number.isFinite(numeric)) return Math.min(Math.max(numeric * 1000, 0), 10_000);
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? Math.min(Math.max(parsed - Date.now(), 0), 10_000) : 250;
}

async function inspect(source: Source) {
  let lastError: string | null = null;
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const response = await fetch(source.requested_url, {
        redirect: "follow",
        signal: AbortSignal.timeout(12_000),
        headers: { "user-agent": "GymMap-HYROX-Source-Qualification/1.0" },
      });
      const body = await response.text();
      const normalized = normalizeSupportText(body);
      if ([408, 429].includes(response.status) || response.status >= 500) {
        lastError = `HTTP ${response.status}`;
        if (attempt < 2) {
          await new Promise((resolve) => setTimeout(resolve, retryAfter(response.headers.get("retry-after"))));
          continue;
        }
      }
      const finalUrl = response.url || source.requested_url;
      const finderBound = source.source_class === "GOVERNING_BODY_FINDER_DETAIL" && finalUrl.includes(source.hgy_id);
      const aliasBound = aliasByHgy[source.hgy_id]?.some((value) => normalized.includes(normalizeSupportText(value))) ?? false;
      const available = response.ok;
      return {
        sourceRef: source.source_ref,
        hgyId: source.hgy_id,
        requestedUrl: source.requested_url,
        finalUrl,
        httpStatus: response.status,
        attempts: attempt,
        accessState: available ? "AVAILABLE" : response.status === 404 ? "SOURCE_UNAVAILABLE" : "MONITOR_ERROR",
        facilityBindingState: finderBound || aliasBound ? "BOUND" : "CHECK_UNAVAILABLE",
        supportState: available ? "CURRENT_SOURCE_SURFACE_AVAILABLE" : "CHECK_UNAVAILABLE",
        contentSha256: createHash("sha256").update(body).digest("hex"),
        error: available ? null : lastError ?? `HTTP ${response.status}`,
        reconfirmed: false,
      };
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
  }
  return {
    sourceRef: source.source_ref,
    hgyId: source.hgy_id,
    requestedUrl: source.requested_url,
    finalUrl: null,
    httpStatus: null,
    attempts: 2,
    accessState: "MONITOR_ERROR",
    facilityBindingState: "CHECK_UNAVAILABLE",
    supportState: "CHECK_UNAVAILABLE",
    contentSha256: null,
    error: lastError,
    reconfirmed: false,
  };
}

async function main() {
  const raw = JSON.parse(await fs.readFile("data/hyrox/h3-11d-cohort1-raw-evidence.json", "utf8"));
  const sources = raw.sources as Source[];
  const records = new Array(sources.length);
  let next = 0;
  await Promise.all(Array.from({ length: 4 }, async () => {
    while (next < sources.length) {
      const index = next;
      next += 1;
      records[index] = await inspect(sources[index]);
    }
  }));
  const result = {
    schemaVersion: 1,
    checkedAt: new Date().toISOString(),
    authority: { cohortIdentityHash: raw.deterministic_hashes.COHORT_1_IDENTITY_SHA256, maxConcurrency: 4, maxAttempts: 2, productionWrites: false },
    counts: {
      checked: records.length,
      available: records.filter((row) => row.accessState === "AVAILABLE").length,
      monitorErrors: records.filter((row) => row.accessState === "MONITOR_ERROR").length,
      sourceUnavailable: records.filter((row) => row.accessState === "SOURCE_UNAVAILABLE").length,
      supportDrift: 0,
      bindingDrift: 0,
      bindingCheckUnavailable: records.filter((row) => row.facilityBindingState === "CHECK_UNAVAILABLE").length,
    },
    records,
    semantics: {
      httpSuccessIsReconfirmation: false,
      contentHashEqualityIsReconfirmation: false,
      monitorErrorIsSupportRemoval: false,
      checkUnavailableIsNegativeEvidence: false,
    },
  };
  const output = path.resolve(option("output") ?? "data/hyrox/h3-11d-cohort1-source-recheck.json");
  await fs.writeFile(output, `${JSON.stringify(result, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify(result.counts)}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
