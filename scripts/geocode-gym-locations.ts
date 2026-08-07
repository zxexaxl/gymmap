import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { createClient } from "@supabase/supabase-js";

type JoinedBrand = { name: string } | Array<{ name: string }> | null;

type LocationRow = {
  id: string;
  slug: string;
  name: string;
  prefecture: string | null;
  city: string | null;
  official_url: string | null;
  latitude: number | null;
  longitude: number | null;
  gym_brands: JoinedBrand;
};

type GeocodingCacheEntry = {
  slug: string;
  name: string;
  brand: string;
  officialUrl: string;
  officialAddress: string | null;
  latitude: number | null;
  longitude: number | null;
  coordinateSource: "official_page" | "gsi_address_search" | null;
  geocoderTitle: string | null;
  status: "approved" | "needs_review" | "not_found" | "fetch_error";
  note: string | null;
  checkedAt: string;
};

type GsiAddressSearchResult = {
  geometry: {
    coordinates: [number, number];
    type: "Point";
  };
  properties: {
    title: string;
  };
};

type CoordinateOverride = {
  slug: string;
  latitude: number;
  longitude: number;
  coordinateSource?: "official_page" | "gsi_address_search";
  sourceUrl: string;
  note: string;
};

type ClosedLocationOverride = {
  slug: string;
  closedOn: string;
  sourceUrl: string;
  note: string;
};

const userAgent = "GymMapLocationGeocoder/1.0 (+https://gymmap.vercel.app/)";
const outputDirectory = join(process.cwd(), "output", "geocoding");
const cachePath = join(outputDirectory, "location-geocoding-cache.json");
const reportPath = join(outputDirectory, "location-geocoding-report.json");
const overridePath = join(process.cwd(), "scripts", "data", "location-coordinate-overrides.json");
const closedLocationPath = join(process.cwd(), "scripts", "data", "closed-location-overrides.json");
let lastGsiRequestAt = 0;

function loadDotEnvFile(filename: string) {
  const filepath = join(process.cwd(), filename);

  if (!existsSync(filepath)) {
    return;
  }

  readFileSync(filepath, "utf8")
    .split(/\r?\n/)
    .forEach((line) => {
      if (!line || line.trim().startsWith("#")) {
        return;
      }

      const separatorIndex = line.indexOf("=");

      if (separatorIndex <= 0) {
        return;
      }

      const key = line.slice(0, separatorIndex).trim();
      const value = line.slice(separatorIndex + 1).trim();

      if (!process.env[key]) {
        process.env[key] = value;
      }
    });
}

function parseLimit() {
  const argument = process.argv.find((value) => value.startsWith("--limit="));

  if (!argument) {
    return Number.POSITIVE_INFINITY;
  }

  const value = Number(argument.slice("--limit=".length));
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : Number.POSITIVE_INFINITY;
}

function parseSlugFilter() {
  const argument = process.argv.find((value) => value.startsWith("--slugs="));

  if (!argument) {
    return null;
  }

  return new Set(
    argument
      .slice("--slugs=".length)
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  );
}

function getBrandName(value: JoinedBrand) {
  if (Array.isArray(value)) {
    return value[0]?.name ?? "Unknown";
  }

  return value?.name ?? "Unknown";
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replaceAll("&nbsp;", " ")
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}

function htmlToText(html: string) {
  return decodeHtmlEntities(
    html
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "\n")
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "\n")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(?:p|div|dd|dt|td|th|li|span|address)>/gi, "\n")
      .replace(/<[^>]+>/g, " "),
  )
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function normalizeAddress(value: string) {
  return value
    .normalize("NFKC")
    .replace(/^〒?\s*\d{3}-?\d{4}\s*/, "")
    .replace(/\s+/g, " ")
    .replace(/\s*(?:TEL|Tel|電話|アクセス|Google Map|MAPで見る).*$/i, "")
    .trim();
}

function extractPostalAddress(html: string, fallbackPrefecture: string | null) {
  const lines = htmlToText(html);
  const postalIndex = lines.findIndex((line) => /〒\s*\d{3}-?\d{4}/.test(line));

  if (postalIndex < 0) {
    return null;
  }

  const addressParts: string[] = [];

  for (let index = postalIndex; index < Math.min(lines.length, postalIndex + 3); index += 1) {
    const line = normalizeAddress(lines[index]);

    if (!line && index === postalIndex) {
      continue;
    }

    if (!line || /^(?:TEL|電話|アクセス|最寄|営業時間)/i.test(line)) {
      break;
    }

    addressParts.push(line);
  }

  let address = addressParts.join(" ").trim();

  if (fallbackPrefecture && !address.includes(fallbackPrefecture)) {
    address = `${fallbackPrefecture}${address}`;
  }

  return address || null;
}

function visitJson(value: unknown, visitor: (item: Record<string, unknown>) => void) {
  if (Array.isArray(value)) {
    value.forEach((item) => visitJson(item, visitor));
    return;
  }

  if (!value || typeof value !== "object") {
    return;
  }

  const item = value as Record<string, unknown>;
  visitor(item);
  Object.values(item).forEach((child) => visitJson(child, visitor));
}

function extractStructuredData(html: string) {
  let officialAddress: string | null = null;
  let coordinates: { latitude: number; longitude: number } | null = null;
  const scripts = html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);

  for (const match of scripts) {
    try {
      const data = JSON.parse(decodeHtmlEntities(match[1]));

      visitJson(data, (item) => {
        if (!officialAddress && item["@type"] === "PostalAddress") {
          officialAddress = [item.addressRegion, item.addressLocality, item.streetAddress]
            .filter((part): part is string => typeof part === "string" && Boolean(part.trim()))
            .join("");
        }

        if (!coordinates && item["@type"] === "GeoCoordinates") {
          const latitude = Number(item.latitude);
          const longitude = Number(item.longitude);

          if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
            coordinates = { latitude, longitude };
          }
        }
      });
    } catch {
      // Some official sites contain invalid JSON-LD. The visible address fallback handles those pages.
    }
  }

  return { officialAddress, coordinates };
}

function extractMapCoordinates(html: string) {
  const decodedHtml = decodeHtmlEntities(html);
  const exactMatches = Array.from(decodedHtml.matchAll(/!3d(-?\d{2,3}\.\d+)!4d(-?\d{2,3}\.\d+)/g));
  const exactMatch = exactMatches.at(-1);

  if (exactMatch) {
    return { latitude: Number(exactMatch[1]), longitude: Number(exactMatch[2]) };
  }

  const centerMatch = decodedHtml.match(/(?:center=|\/@)(-?\d{2,3}\.\d+),(-?\d{2,3}\.\d+)/);

  if (centerMatch) {
    return { latitude: Number(centerMatch[1]), longitude: Number(centerMatch[2]) };
  }

  return null;
}

function extractAccessPageUrl(html: string, baseUrl: string) {
  const matches = Array.from(html.matchAll(/href=["']([^"']*access[^"']*\.html(?:\?[^"']*)?)["']/gi));
  const href = matches[0]?.[1];

  if (!href) {
    return null;
  }

  try {
    return new URL(href, baseUrl).toString();
  } catch {
    return null;
  }
}

function isJapanCoordinate(latitude: number, longitude: number) {
  return latitude >= 24 && latitude <= 46 && longitude >= 122 && longitude <= 154;
}

function prefectureMatches(prefecture: string | null, displayName: string) {
  if (!prefecture) {
    return true;
  }

  const baseName = prefecture.replace(/[都道府県]$/, "");
  return displayName.includes(prefecture) || displayName.includes(baseName);
}

async function fetchText(url: string) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": userAgent,
      Accept: "text/html,application/xhtml+xml",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(20_000),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return { html: await response.text(), finalUrl: response.url };
}

async function geocodeAddress(address: string) {
  const elapsed = Date.now() - lastGsiRequestAt;

  if (elapsed < 500) {
    await sleep(500 - elapsed);
  }

  const url = new URL("https://msearch.gsi.go.jp/address-search/AddressSearch");
  url.searchParams.set("q", address);

  const response = await fetch(url, {
    headers: {
      "User-Agent": userAgent,
    },
    signal: AbortSignal.timeout(20_000),
  });
  lastGsiRequestAt = Date.now();

  if (!response.ok) {
    throw new Error(`GSI address search HTTP ${response.status}`);
  }

  const results = (await response.json()) as GsiAddressSearchResult[];
  return results[0] ?? null;
}

function buildGeocodingQueries(officialAddress: string) {
  const normalizedAddress = normalizeAddress(officialAddress);
  const addressCoreMatch = normalizedAddress.match(/^(.+?\d+(?:[-‐‑‒–—―ー−]\d+){1,3})/);
  const addressCore = addressCoreMatch?.[1] ?? null;

  return Array.from(new Set([addressCore, normalizedAddress].filter(Boolean))) as string[];
}

function sleep(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function loadCache() {
  if (!existsSync(cachePath)) {
    return new Map<string, GeocodingCacheEntry>();
  }

  const entries = JSON.parse(readFileSync(cachePath, "utf8")) as GeocodingCacheEntry[];
  return new Map(entries.map((entry) => [entry.slug, entry]));
}

function saveCache(cache: Map<string, GeocodingCacheEntry>) {
  mkdirSync(outputDirectory, { recursive: true });
  const entries = Array.from(cache.values()).sort((left, right) => left.slug.localeCompare(right.slug));
  writeFileSync(cachePath, `${JSON.stringify(entries, null, 2)}\n`, "utf8");
}

function saveReport(cache: Map<string, GeocodingCacheEntry>) {
  const entries = Array.from(cache.values());
  const counts = entries.reduce<Record<string, number>>((result, entry) => {
    result[entry.status] = (result[entry.status] ?? 0) + 1;
    return result;
  }, {});
  const report = {
    generatedAt: new Date().toISOString(),
    counts,
    approvedBySource: {
      official_page: entries.filter(
        (entry) => entry.status === "approved" && entry.coordinateSource === "official_page",
      ).length,
      gsi_address_search: entries.filter(
        (entry) => entry.status === "approved" && entry.coordinateSource === "gsi_address_search",
      ).length,
    },
    entries,
  };
  writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  return report;
}

async function main() {
  loadDotEnvFile(".env.local");
  loadDotEnvFile(".env");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase service role credentials are required.");
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  if (process.argv.includes("--apply")) {
    const closedLocations = JSON.parse(
      readFileSync(closedLocationPath, "utf8"),
    ) as ClosedLocationOverride[];

    for (const location of closedLocations) {
      const { error: closeError } = await supabase
        .from("gym_locations")
        .update({ is_active: false })
        .eq("slug", location.slug)
        .eq("is_active", true);

      if (closeError) {
        throw closeError;
      }
    }
  }

  const { data, error } = await supabase
    .from("gym_locations")
    .select("id, slug, name, prefecture, city, official_url, latitude, longitude, gym_brands(name)")
    .eq("is_active", true)
    .is("latitude", null)
    .order("slug");

  if (error) {
    throw error;
  }

  const slugFilter = parseSlugFilter();
  const locations = ((data as LocationRow[] | null) ?? []).filter(
    (location) => location.official_url && (!slugFilter || slugFilter.has(location.slug)),
  );
  const cache = loadCache();
  const overrides = JSON.parse(readFileSync(overridePath, "utf8")) as CoordinateOverride[];

  overrides.forEach((override) => {
    const location = locations.find((item) => item.slug === override.slug);

    if (!location || !isJapanCoordinate(override.latitude, override.longitude)) {
      return;
    }

    const previous = cache.get(override.slug);
    cache.set(override.slug, {
      slug: location.slug,
      name: location.name,
      brand: getBrandName(location.gym_brands),
      officialUrl: location.official_url as string,
      officialAddress: previous?.officialAddress ?? null,
      latitude: override.latitude,
      longitude: override.longitude,
      coordinateSource: override.coordinateSource ?? "official_page",
      geocoderTitle: null,
      status: "approved",
      note: `${override.note} Source: ${override.sourceUrl}`,
      checkedAt: new Date().toISOString(),
    });
  });
  saveCache(cache);

  if (process.argv.includes("--apply")) {
    const approved = Array.from(cache.values()).filter(
      (entry) =>
        entry.status === "approved" && entry.latitude !== null && entry.longitude !== null,
    );
    let updated = 0;

    for (const entry of approved) {
      const location = locations.find((item) => item.slug === entry.slug);

      if (!location) {
        continue;
      }

      const { error: updateError } = await supabase
        .from("gym_locations")
        .update({ latitude: entry.latitude, longitude: entry.longitude })
        .eq("id", location.id)
        .is("latitude", null)
        .is("longitude", null);

      if (updateError) {
        throw updateError;
      }

      updated += 1;
    }

    console.log(JSON.stringify({ mode: "apply", approved: approved.length, updated }, null, 2));
    return;
  }

  const limit = parseLimit();
  const retryUnapproved = process.argv.includes("--retry-unapproved");
  const pending = locations
    .filter((location) => {
      const cached = cache.get(location.slug);
      return !cached || (retryUnapproved && cached.status !== "approved");
    })
    .slice(0, limit);

  for (const [index, location] of pending.entries()) {
    const officialUrl = location.official_url as string;
    const baseEntry = {
      slug: location.slug,
      name: location.name,
      brand: getBrandName(location.gym_brands),
      officialUrl,
      checkedAt: new Date().toISOString(),
    };

    try {
      let { html, finalUrl } = await fetchText(officialUrl);
      let structured = extractStructuredData(html);
      let officialAddress = structured.officialAddress ?? extractPostalAddress(html, location.prefecture);
      let coordinates = structured.coordinates ?? extractMapCoordinates(html);

      if (!officialAddress) {
        const accessPageUrl = extractAccessPageUrl(html, finalUrl);

        if (accessPageUrl && accessPageUrl !== finalUrl) {
          await sleep(250);
          const accessPage = await fetchText(accessPageUrl);
          html = accessPage.html;
          finalUrl = accessPage.finalUrl;
          structured = extractStructuredData(html);
          officialAddress = structured.officialAddress ?? extractPostalAddress(html, location.prefecture);
          coordinates = structured.coordinates ?? extractMapCoordinates(html);
        }
      }

      if (coordinates && isJapanCoordinate(coordinates.latitude, coordinates.longitude)) {
        cache.set(location.slug, {
          ...baseEntry,
          officialAddress,
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
          coordinateSource: "official_page",
          geocoderTitle: null,
          status: "approved",
          note: null,
        });
      } else if (officialAddress) {
        const queries = buildGeocodingQueries(officialAddress);
        let result: GsiAddressSearchResult | null = null;
        let lastResult: GsiAddressSearchResult | null = null;

        for (const query of queries) {
          const candidate = await geocodeAddress(query);

          if (!candidate) {
            continue;
          }

          lastResult = candidate;
          const [candidateLongitude, candidateLatitude] = candidate.geometry.coordinates;
          const candidateTitle = candidate.properties.title;
          const hasAddressDetail = /[0-9０-９一二三四五六七八九十百千]/.test(candidateTitle);

          if (
            isJapanCoordinate(candidateLatitude, candidateLongitude) &&
            prefectureMatches(location.prefecture, candidateTitle) &&
            hasAddressDetail
          ) {
            result = candidate;
            break;
          }
        }

        result ??= lastResult;

        if (!result) {
          cache.set(location.slug, {
            ...baseEntry,
            officialAddress,
            latitude: null,
            longitude: null,
            coordinateSource: null,
            geocoderTitle: null,
            status: "not_found",
            note: "GSI address search returned no result.",
          });
        } else {
          const [longitude, latitude] = result.geometry.coordinates;
          const resultTitle = result.properties.title;
          const isApproved =
            isJapanCoordinate(latitude, longitude) &&
            prefectureMatches(location.prefecture, resultTitle) &&
            /[0-9０-９一二三四五六七八九十百千]/.test(resultTitle);

          cache.set(location.slug, {
            ...baseEntry,
            officialAddress,
            latitude,
            longitude,
            coordinateSource: "gsi_address_search",
            geocoderTitle: resultTitle,
            status: isApproved ? "approved" : "needs_review",
            note: isApproved ? null : "Result was too broad or did not match the stored prefecture.",
          });
        }

      } else {
        cache.set(location.slug, {
          ...baseEntry,
          officialAddress: null,
          latitude: null,
          longitude: null,
          coordinateSource: null,
          geocoderTitle: null,
          status: "not_found",
          note: "Official address could not be extracted.",
        });
      }
    } catch (requestError) {
      cache.set(location.slug, {
        ...baseEntry,
        officialAddress: null,
        latitude: null,
        longitude: null,
        coordinateSource: null,
        geocoderTitle: null,
        status: "fetch_error",
        note: requestError instanceof Error ? requestError.message : String(requestError),
      });
    }

    saveCache(cache);
    const entry = cache.get(location.slug);
    console.log(
      `[${index + 1}/${pending.length}] ${location.slug}: ${entry?.status ?? "unknown"} (${entry?.coordinateSource ?? "none"})`,
    );
    await sleep(250);
  }

  const report = saveReport(cache);
  console.log(JSON.stringify({ mode: "discover", processed: pending.length, ...report.counts }, null, 2));
}

void main().catch((error) => {
  console.error("[geocode-gym-locations]", error instanceof Error ? error.message : String(error));
  process.exit(1);
});
