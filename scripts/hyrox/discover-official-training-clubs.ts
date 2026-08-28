import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  HYROX_API_BASE_URL,
  HYROX_FINDER_URL,
  HYROX_SOURCE_NAMESPACE,
  duplicateValues,
  parseOfficialFinderRecord,
  type OfficialFinderGymPayload,
  type OfficialClubRecord,
} from "../../src/lib/hyrox-official-clubs";

type CoverageCenter = { name: string; latitude: number; longitude: number };
type MapGym = OfficialFinderGymPayload;
type DetailGym = OfficialFinderGymPayload;

// Prefectural capitals plus additional Hokkaido and remote-island centers.
// Every request uses the official endpoint's documented/validated 100 km maximum.
export const JAPAN_COVERAGE_CENTERS: CoverageCenter[] = [
  ["Sapporo",43.0618,141.3545],["Hakodate",41.7687,140.7288],["Asahikawa",43.7706,142.3650],
  ["Obihiro",42.9236,143.1960],["Kushiro",42.9849,144.3818],["Kitami",43.8040,143.8957],
  ["Aomori",40.8222,140.7474],["Morioka",39.7036,141.1527],["Sendai",38.2682,140.8694],
  ["Akita",39.7186,140.1024],["Yamagata",38.2404,140.3633],["Fukushima",37.7503,140.4676],
  ["Mito",36.3418,140.4468],["Utsunomiya",36.5551,139.8828],["Maebashi",36.3895,139.0634],
  ["Saitama",35.8617,139.6455],["Chiba",35.6073,140.1063],["Tokyo",35.6762,139.6503],
  ["Yokohama",35.4437,139.6380],["Niigata",37.9161,139.0364],["Toyama",36.6953,137.2113],
  ["Kanazawa",36.5613,136.6562],["Fukui",36.0641,136.2196],["Kofu",35.6639,138.5683],
  ["Nagano",36.6485,138.1950],["Gifu",35.4233,136.7607],["Shizuoka",34.9756,138.3828],
  ["Nagoya",35.1815,136.9066],["Tsu",34.7186,136.5059],["Otsu",35.0179,135.8546],
  ["Kyoto",35.0116,135.7681],["Osaka",34.6937,135.5023],["Kobe",34.6901,135.1955],
  ["Nara",34.6851,135.8048],["Wakayama",34.2305,135.1708],["Tottori",35.5011,134.2351],
  ["Matsue",35.4723,133.0505],["Okayama",34.6551,133.9195],["Hiroshima",34.3853,132.4553],
  ["Yamaguchi",34.1785,131.4737],["Tokushima",34.0703,134.5548],["Takamatsu",34.3428,134.0466],
  ["Matsuyama",33.8392,132.7657],["Kochi",33.5597,133.5311],["Fukuoka",33.5902,130.4017],
  ["Saga",33.2494,130.2988],["Nagasaki",32.7503,129.8779],["Kumamoto",32.8031,130.7079],
  ["Oita",33.2396,131.6093],["Miyazaki",31.9077,131.4202],["Kagoshima",31.5966,130.5571],
  ["Amami",28.3772,129.4937],["Naha",26.2124,127.6809],["Miyakojima",24.8055,125.2811],
  ["Ishigaki",24.3448,124.1572],
].map(([name, latitude, longitude]) => ({ name: String(name), latitude: Number(latitude), longitude: Number(longitude) }));

function cliValue(name: string, fallback: string): string {
  const prefix = `--${name}=`;
  return process.argv.find((value) => value.startsWith(prefix))?.slice(prefix.length) ?? fallback;
}

async function fetchJson<T>(url: URL | string, attempts = 3): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { Accept: "application/json", "User-Agent": "GymMap-HYROX-discovery/1.0" },
        signal: AbortSignal.timeout(20_000),
      });
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      return await response.json() as T;
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await new Promise((resolve) => setTimeout(resolve, attempt * 1_000));
    }
  }
  throw new Error(`Official HYROX request failed: ${String(lastError)}`);
}

async function discover(): Promise<void> {
  const outputPath = path.resolve(cliValue("output", "data/hyrox/official-training-clubs-japan.json"));
  const observedAt = cliValue("observed-at", new Date().toISOString());
  if (Number.isNaN(Date.parse(observedAt))) throw new Error("--observed-at must be an ISO timestamp");

  const gyms = new Map<string, MapGym>();
  const missingId: MapGym[] = [];
  const observationCounts = new Map<string, number>();
  const conflictingExternalIds = new Set<string>();
  for (const center of JAPAN_COVERAGE_CENTERS) {
    const url = new URL(`${HYROX_API_BASE_URL}/v1/gyms/map`);
    url.searchParams.set("latitude", String(center.latitude));
    url.searchParams.set("longitude", String(center.longitude));
    url.searchParams.set("radiusMeters", "100000");
    url.searchParams.set("limit", "500");
    const response = await fetchJson<{ gyms: MapGym[]; truncated: boolean; count: number }>(url);
    if (response.truncated) throw new Error(`Coverage result truncated at ${center.name}`);
    for (const gym of response.gyms) {
      if (gym.address?.country !== "JP") continue;
      if (gym.hyroxEntityId) {
        const existing = gyms.get(gym.hyroxEntityId);
        observationCounts.set(gym.hyroxEntityId, (observationCounts.get(gym.hyroxEntityId) ?? 0) + 1);
        if (existing) {
          const fingerprint = (value: MapGym) => JSON.stringify({
            name: value.gymName,
            htcx: value.htcx,
            coordinates: value.geoCoordinates,
            address: value.address,
          });
          if (fingerprint(existing) !== fingerprint(gym)) conflictingExternalIds.add(gym.hyroxEntityId);
        } else {
          gyms.set(gym.hyroxEntityId, gym);
        }
      }
      else missingId.push(gym);
    }
    await new Promise((resolve) => setTimeout(resolve, 150));
  }

  const records: OfficialClubRecord[] = [];
  for (const gym of [...gyms.values()].sort((a, b) =>
    (a.hyroxEntityId ?? "").localeCompare(b.hyroxEntityId ?? ""))) {
    const externalId = gym.hyroxEntityId ?? null;
    let detail: DetailGym | null = null;
    if (externalId) {
      const response = await fetchJson<{ gym: DetailGym }>(
        `${HYROX_API_BASE_URL}/v1/gyms/${encodeURIComponent(externalId)}`,
      );
      detail = response.gym;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    records.push(parseOfficialFinderRecord(gym, detail, observedAt));
  }
  for (const gym of missingId) {
    records.push(parseOfficialFinderRecord(gym, null, observedAt));
  }
  records.sort((a, b) => a.official_name.localeCompare(b.official_name, "ja") ||
    (a.external_id ?? "").localeCompare(b.external_id ?? ""));

  const artifact = {
    schema_version: 1,
    source_authority: "HYROX governing-body official Training Finder",
    source_namespace: HYROX_SOURCE_NAMESPACE,
    finder_url: HYROX_FINDER_URL,
    api_endpoint: `${HYROX_API_BASE_URL}/v1/gyms/map`,
    observed_at: observedAt,
    country_filter: "JP",
    coverage: { radius_meters: 100_000, centers: JAPAN_COVERAGE_CENTERS },
    record_count: records.length,
    duplicate_external_ids: duplicateValues(records.map((record) => record.external_id)),
    duplicate_detail_urls: duplicateValues(records.map((record) => record.official_source_url)),
    coverage_duplicate_observation_count: [...observationCounts.values()].reduce((sum, count) => sum + Math.max(0, count - 1), 0),
    conflicting_external_id_records: [...conflictingExternalIds].sort(),
    records,
  };
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
  console.log(`Wrote ${records.length} Japan records to ${outputPath}`);
}

discover().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
