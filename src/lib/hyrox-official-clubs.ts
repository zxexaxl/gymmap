export const HYROX_SOURCE_NAMESPACE = "hyrox-training-club" as const;
export const HYROX_FINDER_URL = "https://hyrox-training-finder.hyrox.com/";
export const HYROX_API_BASE_URL = "https://onefiit-api.platform.onefiit.com/hyrox365";

export type ResolutionStatus =
  | "CONFIRMED_MATCH"
  | "PROBABLE_MATCH"
  | "AMBIGUOUS"
  | "UNMATCHED"
  | "SOURCE_INCOMPLETE";

export type OfficialClubRecord = {
  source_namespace: typeof HYROX_SOURCE_NAMESPACE;
  external_id: string | null;
  external_id_status: "stable" | "missing";
  official_name: string;
  country: string | null;
  prefecture: string | null;
  city: string | null;
  address: string | null;
  postal_code: string | null;
  latitude: number | null;
  longitude: number | null;
  official_source_url: string;
  facility_url: string | null;
  observed_at: string;
  source_url: string;
  source_metadata: {
    htcx: boolean | null;
    third_party_integration_id: string | null;
    source_city: string | null;
    source_region: string | null;
  };
};

export type OfficialFinderGymPayload = {
  hyroxEntityId?: string;
  thirdPartyIntegrationId?: string;
  gymName?: string;
  htcx?: boolean;
  geoCoordinates?: { lat?: number; lon?: number };
  socialMedia?: { website?: string };
  address?: {
    country?: string;
    state?: string;
    city?: string;
    street?: string;
    postalCode?: string;
    geoCoordinates?: { lat?: number; lon?: number };
  };
};

export type GymMapLocationRecord = {
  id: string;
  slug: string;
  name: string;
  brand_id: string;
  brand_name: string;
  brand_slug: string;
  address: string | null;
  postal_code: string | null;
  prefecture: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  official_url: string | null;
  source_url: string | null;
  is_active: boolean;
};

export type MatchFeatures = {
  normalized_name_exact: boolean;
  name_similarity: number;
  brand_or_branch_match: boolean;
  branch_name_exact: boolean;
  normalized_address_exact: boolean;
  postal_code_exact: boolean;
  prefecture_exact: boolean;
  city_exact: boolean;
  official_url_exact: boolean;
  coordinate_distance_meters: number | null;
};

export type MatchCandidate = {
  gymmap_location_id: string;
  gymmap_slug: string;
  gymmap_name: string;
  score: number;
  features: MatchFeatures;
  reasons: string[];
  conflicts: string[];
};

export type ResolutionRecord = {
  source_namespace: typeof HYROX_SOURCE_NAMESPACE;
  official_external_id: string | null;
  official_name: string;
  official_address: string | null;
  official_source_url: string;
  facility_url: string | null;
  gymmap_location_id: string | null;
  gymmap_slug: string | null;
  gymmap_name: string | null;
  resolution_status: ResolutionStatus;
  match_method: string;
  score: number | null;
  coordinate_distance_meters: number | null;
  reasons: string[];
  conflicts: string[];
  manual_review_required: boolean;
  candidates: MatchCandidate[];
};

const PREFECTURES = [
  "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
  "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
  "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県",
  "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県",
  "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県",
  "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県",
  "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県",
] as const;

const PREFECTURE_ALIASES = new Map<string, string>([
  ["hokkaido", "北海道"], ["aomori", "青森県"], ["iwate", "岩手県"],
  ["miyagi", "宮城県"], ["akita", "秋田県"], ["yamagata", "山形県"],
  ["fukushima", "福島県"], ["ibaraki", "茨城県"], ["tochigi", "栃木県"],
  ["gunma", "群馬県"], ["saitama", "埼玉県"], ["chiba", "千葉県"],
  ["tokyo", "東京都"], ["kanagawa", "神奈川県"], ["niigata", "新潟県"],
  ["toyama", "富山県"], ["ishikawa", "石川県"], ["fukui", "福井県"],
  ["yamanashi", "山梨県"], ["nagano", "長野県"], ["gifu", "岐阜県"],
  ["shizuoka", "静岡県"], ["aichi", "愛知県"], ["mie", "三重県"],
  ["shiga", "滋賀県"], ["kyoto", "京都府"], ["osaka", "大阪府"],
  ["hyogo", "兵庫県"], ["nara", "奈良県"], ["wakayama", "和歌山県"],
  ["tottori", "鳥取県"], ["shimane", "島根県"], ["okayama", "岡山県"],
  ["hiroshima", "広島県"], ["yamaguchi", "山口県"], ["tokushima", "徳島県"],
  ["kagawa", "香川県"], ["ehime", "愛媛県"], ["kochi", "高知県"],
  ["fukuoka", "福岡県"], ["saga", "佐賀県"], ["nagasaki", "長崎県"],
  ["kumamoto", "熊本県"], ["oita", "大分県"], ["miyazaki", "宮崎県"],
  ["kagoshima", "鹿児島県"], ["okinawa", "沖縄県"],
]);

export function normalizeText(value: string | null | undefined): string {
  return (value ?? "")
    .normalize("NFKC")
    .toLocaleLowerCase("ja-JP")
    .replace(/[‐‑‒–—―−]/g, "-")
    .replace(/[\s\p{P}\p{S}]+/gu, "")
    .trim();
}

export function normalizeName(value: string | null | undefined): string {
  return normalizeText(value)
    .replace(/株式会社/g, "")
    .replace(/(フィットネス|fitness|トレーニング|training|ジム|gym)$/g, "");
}

export function normalizeAddress(value: string | null | undefined): string {
  const withoutPostalCode = (value ?? "")
    .normalize("NFKC")
    .replace(/〒?\s*\d{3}[-‐‑‒–—―−]?\d{4}[,、\s]*/g, "");
  return normalizeText(withoutPostalCode)
    .replace(/(丁目|番地|番|号)/g, "")
    .replace(/-+/g, "-");
}

export function normalizePostalCode(value: string | null | undefined): string {
  return (value ?? "").replace(/\D/g, "");
}

export function normalizeUrl(value: string | null | undefined): string {
  if (!value) return "";
  try {
    const url = new URL(value);
    const path = url.pathname.replace(/\/+$/, "") || "/";
    return `${url.hostname.toLowerCase().replace(/^www\./, "")}${path.toLowerCase()}`;
  } catch {
    return "";
  }
}

export function inferExplicitPrefecture(...values: Array<string | null | undefined>): string | null {
  const joined = values.filter(Boolean).join(" ").normalize("NFKC");
  const japanese = PREFECTURES.find((prefecture) => joined.includes(prefecture));
  if (japanese) return japanese;
  const lower = joined.toLowerCase();
  for (const [alias, prefecture] of PREFECTURE_ALIASES) {
    if (new RegExp(`(^|[^a-z])${alias}(?:-ken|-fu|-to)?([^a-z]|$)`, "i").test(lower)) {
      return prefecture;
    }
  }
  return null;
}

export function parseOfficialFinderRecord(
  mapGym: OfficialFinderGymPayload,
  detailGym: OfficialFinderGymPayload | null,
  observedAt: string,
): OfficialClubRecord {
  const externalId = mapGym.hyroxEntityId ?? detailGym?.hyroxEntityId ?? null;
  const address = detailGym?.address ?? mapGym.address;
  const coordinates = detailGym?.address?.geoCoordinates ?? mapGym.geoCoordinates;
  const city = address?.city?.trim() || null;
  const street = address?.street?.trim() || null;
  const postalCode = address?.postalCode?.trim() || null;
  return {
    source_namespace: HYROX_SOURCE_NAMESPACE,
    external_id: externalId,
    external_id_status: externalId ? "stable" : "missing",
    official_name: (detailGym?.gymName ?? mapGym.gymName ?? "").trim(),
    country: address?.country ?? null,
    prefecture: inferExplicitPrefecture(address?.state, city, street),
    city,
    address: [postalCode, address?.state, city, street].filter(Boolean).join(", ") || null,
    postal_code: postalCode,
    latitude: typeof coordinates?.lat === "number" ? coordinates.lat : null,
    longitude: typeof coordinates?.lon === "number" ? coordinates.lon : null,
    official_source_url: externalId
      ? `${HYROX_FINDER_URL}gym/${encodeURIComponent(externalId)}`
      : HYROX_FINDER_URL,
    facility_url: detailGym?.socialMedia?.website?.trim() || null,
    observed_at: observedAt,
    source_url: `${HYROX_API_BASE_URL}/v1/gyms/map`,
    source_metadata: {
      htcx: typeof mapGym.htcx === "boolean" ? mapGym.htcx : null,
      third_party_integration_id: detailGym?.thirdPartyIntegrationId ?? null,
      source_city: city,
      source_region: address?.state?.trim() || null,
    },
  };
}

export function haversineDistanceMeters(
  leftLat: number,
  leftLng: number,
  rightLat: number,
  rightLng: number,
): number {
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const radius = 6_371_000;
  const deltaLat = radians(rightLat - leftLat);
  const deltaLng = radians(rightLng - leftLng);
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(radians(leftLat)) * Math.cos(radians(rightLat)) * Math.sin(deltaLng / 2) ** 2;
  return 2 * radius * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function bigrams(value: string): Set<string> {
  if (value.length < 2) return new Set(value ? [value] : []);
  return new Set(Array.from({ length: value.length - 1 }, (_, index) => value.slice(index, index + 2)));
}

export function diceSimilarity(left: string, right: string): number {
  if (!left || !right) return 0;
  if (left === right) return 1;
  const leftPairs = bigrams(left);
  const rightPairs = bigrams(right);
  let intersection = 0;
  for (const pair of leftPairs) if (rightPairs.has(pair)) intersection += 1;
  return (2 * intersection) / (leftPairs.size + rightPairs.size);
}

function matchFeatures(source: OfficialClubRecord, location: GymMapLocationRecord): MatchFeatures {
  const sourceName = normalizeName(source.official_name);
  const locationName = normalizeName(location.name);
  const brandName = normalizeName(location.brand_name);
  const knownBrandAliases: Record<string, string[]> = {
    "golds-gym": [normalizeText("Gold's Gym"), normalizeText("ゴールドジム")],
  };
  const brandAliases = [brandName, ...(knownBrandAliases[location.brand_slug] ?? [])].filter(Boolean);
  const matchedBrandAlias = brandAliases.find((alias) => sourceName.includes(alias));
  const sourceWithoutBrand = matchedBrandAlias ? sourceName.replace(matchedBrandAlias, "") : sourceName;
  const sourceAddress = normalizeAddress(source.address);
  const locationAddress = normalizeAddress(
    [location.prefecture, location.city, location.address].filter(Boolean).join(" "),
  );
  const sourcePostal = normalizePostalCode(source.postal_code);
  const locationPostal = normalizePostalCode(location.postal_code);
  const distance =
    source.latitude !== null && source.longitude !== null &&
    location.latitude !== null && location.longitude !== null
      ? haversineDistanceMeters(source.latitude, source.longitude, location.latitude, location.longitude)
      : null;

  return {
    normalized_name_exact: Boolean(sourceName && sourceName === locationName),
    name_similarity: diceSimilarity(sourceName, locationName),
    brand_or_branch_match: Boolean(
      matchedBrandAlias || (brandName && sourceName && brandName.includes(sourceName)),
    ),
    branch_name_exact: Boolean(
      brandName && sourceWithoutBrand && locationName && sourceWithoutBrand === locationName,
    ),
    normalized_address_exact: Boolean(sourceAddress && sourceAddress === locationAddress),
    postal_code_exact: Boolean(sourcePostal && sourcePostal === locationPostal),
    prefecture_exact: Boolean(
      source.prefecture && location.prefecture &&
      normalizeText(source.prefecture) === normalizeText(location.prefecture),
    ),
    city_exact: Boolean(
      source.city && location.city && normalizeText(source.city) === normalizeText(location.city),
    ),
    official_url_exact: Boolean(
      normalizeUrl(source.facility_url) &&
      [location.official_url, location.source_url].some(
        (candidate) => normalizeUrl(candidate) === normalizeUrl(source.facility_url),
      ),
    ),
    coordinate_distance_meters: distance,
  };
}

function scoreCandidate(
  source: OfficialClubRecord,
  location: GymMapLocationRecord,
): MatchCandidate {
  const features = matchFeatures(source, location);
  const reasons: string[] = [];
  const conflicts: string[] = [];
  let score = 0;

  if (features.official_url_exact) { score += 60; reasons.push("official URL exact"); }
  if (features.normalized_name_exact) { score += 35; reasons.push("normalized name exact"); }
  else if (features.name_similarity >= 0.85) { score += 25; reasons.push("name similarity >= 0.85"); }
  else if (features.name_similarity >= 0.65) { score += 15; reasons.push("name similarity >= 0.65"); }
  else if (features.name_similarity >= 0.45) { score += 8; reasons.push("name similarity >= 0.45"); }
  if (features.brand_or_branch_match) { score += 10; reasons.push("brand/branch name support"); }
  if (features.branch_name_exact) { score += 25; reasons.push("brand-stripped branch name exact"); }
  if (features.normalized_address_exact) { score += 35; reasons.push("normalized address exact"); }
  if (features.postal_code_exact) { score += 30; reasons.push("postal code exact"); }
  if (features.prefecture_exact) { score += 5; reasons.push("prefecture exact"); }
  if (features.city_exact) { score += 5; reasons.push("city exact"); }
  const distance = features.coordinate_distance_meters;
  if (distance !== null && distance <= 50) { score += 30; reasons.push("coordinates within 50m"); }
  else if (distance !== null && distance <= 200) { score += 22; reasons.push("coordinates within 200m"); }
  else if (distance !== null && distance <= 500) { score += 12; reasons.push("coordinates within 500m"); }
  else if (distance !== null && distance <= 1_000) { score += 5; reasons.push("coordinates within 1km"); }

  const sourcePostal = normalizePostalCode(source.postal_code);
  const locationPostal = normalizePostalCode(location.postal_code);
  if (sourcePostal && locationPostal && sourcePostal !== locationPostal && distance !== null && distance > 2_000) {
    score -= 25;
    conflicts.push("postal codes conflict and coordinates are over 2km apart");
  }
  if (source.prefecture && location.prefecture && !features.prefecture_exact) {
    score -= 30;
    conflicts.push("prefecture conflict");
  }
  if (distance !== null && distance > 5_000 && features.normalized_name_exact) {
    conflicts.push("exact name but coordinates are over 5km apart");
  }
  if (!location.is_active) {
    score -= 20;
    conflicts.push("GymMap location is inactive");
  }

  return {
    gymmap_location_id: location.id,
    gymmap_slug: location.slug,
    gymmap_name: location.name,
    score: Math.max(0, score),
    features,
    reasons,
    conflicts,
  };
}

function isSourceIncomplete(source: OfficialClubRecord): boolean {
  return !source.external_id || !source.official_name.trim() || (
    source.latitude === null && source.longitude === null &&
    !source.address && !source.postal_code
  );
}

export function resolveClubIdentity(
  source: OfficialClubRecord,
  locations: GymMapLocationRecord[],
): ResolutionRecord {
  if (isSourceIncomplete(source)) {
    return {
      source_namespace: HYROX_SOURCE_NAMESPACE,
      official_external_id: source.external_id,
      official_name: source.official_name,
      official_address: source.address,
      official_source_url: source.official_source_url,
      facility_url: source.facility_url,
      gymmap_location_id: null,
      gymmap_slug: null,
      gymmap_name: null,
      resolution_status: "SOURCE_INCOMPLETE",
      match_method: "source-required-fields-missing",
      score: null,
      coordinate_distance_meters: null,
      reasons: ["official source lacks stable identity, name, or usable location data"],
      conflicts: [],
      manual_review_required: true,
      candidates: [],
    };
  }

  const candidates = locations
    .map((location) => scoreCandidate(source, location))
    .filter((candidate) =>
      candidate.score >= 20 ||
      candidate.features.name_similarity >= 0.45 ||
      (candidate.features.coordinate_distance_meters !== null &&
        candidate.features.coordinate_distance_meters <= 1_000),
    )
    .sort((left, right) =>
      right.score - left.score ||
      left.gymmap_name.localeCompare(right.gymmap_name, "ja") ||
      left.gymmap_location_id.localeCompare(right.gymmap_location_id),
    );
  const hasIdentitySignal = (candidate: MatchCandidate) =>
    candidate.features.official_url_exact ||
    candidate.features.normalized_name_exact ||
    candidate.features.brand_or_branch_match ||
    candidate.features.branch_name_exact ||
    candidate.features.normalized_address_exact ||
    candidate.features.name_similarity >= 0.45;
  const identityCandidates = candidates.filter(hasIdentitySignal);
  const top = identityCandidates[0];
  if (!top || top.score < 40) {
    const proximityCandidate = candidates[0];
    return {
      source_namespace: HYROX_SOURCE_NAMESPACE,
      official_external_id: source.external_id,
      official_name: source.official_name,
      official_address: source.address,
      official_source_url: source.official_source_url,
      facility_url: source.facility_url,
      gymmap_location_id: null,
      gymmap_slug: null,
      gymmap_name: null,
      resolution_status: "UNMATCHED",
      match_method: "no-plausible-existing-location",
      score: proximityCandidate?.score ?? null,
      coordinate_distance_meters: proximityCandidate?.features.coordinate_distance_meters ?? null,
      reasons: proximityCandidate?.reasons ?? [],
      conflicts: proximityCandidate?.conflicts ?? [],
      manual_review_required: true,
      candidates: candidates.slice(0, 3),
    };
  }

  const second = identityCandidates[1];
  const tied = Boolean(second && second.score >= 40 && top.score - second.score < 10);
  const hasBlockingConflict = top.conflicts.some((conflict) =>
    conflict.includes("prefecture") || conflict.includes("inactive") || conflict.includes("over 5km"),
  );
  const explicitConfirmed =
    top.features.official_url_exact ||
    (top.features.normalized_name_exact &&
      (top.features.normalized_address_exact || top.features.postal_code_exact)) ||
    (top.features.branch_name_exact && top.features.postal_code_exact &&
      top.features.coordinate_distance_meters !== null &&
      top.features.coordinate_distance_meters <= 200) ||
    (top.features.brand_or_branch_match && top.features.normalized_address_exact &&
      top.features.postal_code_exact && top.features.coordinate_distance_meters !== null &&
      top.features.coordinate_distance_meters <= 200) ||
    (top.features.normalized_name_exact &&
      top.features.coordinate_distance_meters !== null &&
      top.features.coordinate_distance_meters <= 200 &&
      (top.features.city_exact || top.features.prefecture_exact || top.features.postal_code_exact)) ||
    (top.features.name_similarity >= 0.85 && top.features.postal_code_exact &&
      top.features.coordinate_distance_meters !== null &&
      top.features.coordinate_distance_meters <= 500);

  let status: ResolutionStatus;
  let method: string;
  if (tied || hasBlockingConflict) {
    status = "AMBIGUOUS";
    method = tied ? "multiple-plausible-locations" : "identity-signals-conflict";
  } else if (explicitConfirmed) {
    status = "CONFIRMED_MATCH";
    method = top.features.official_url_exact
      ? "official-url-exact"
      : top.features.brand_or_branch_match && top.features.normalized_address_exact
        ? "brand-address-postal-coordinate-exact"
      : top.features.normalized_address_exact
        ? "name-and-address-exact"
        : top.features.postal_code_exact
          ? "name-and-postal-supported"
          : "name-and-coordinate-supported";
  } else if (top.score >= 55) {
    status = "PROBABLE_MATCH";
    method = "deterministic-score-manual-review";
  } else {
    status = "UNMATCHED";
    method = "no-sufficient-identity-rule";
  }

  const matched = status === "CONFIRMED_MATCH" || status === "PROBABLE_MATCH" || status === "AMBIGUOUS";
  return {
    source_namespace: HYROX_SOURCE_NAMESPACE,
    official_external_id: source.external_id,
    official_name: source.official_name,
    official_address: source.address,
    official_source_url: source.official_source_url,
    facility_url: source.facility_url,
    gymmap_location_id: matched ? top.gymmap_location_id : null,
    gymmap_slug: matched ? top.gymmap_slug : null,
    gymmap_name: matched ? top.gymmap_name : null,
    resolution_status: status,
    match_method: method,
    score: top.score,
    coordinate_distance_meters: top.features.coordinate_distance_meters,
    reasons: top.reasons,
    conflicts: top.conflicts,
    manual_review_required: status !== "CONFIRMED_MATCH",
    candidates: candidates.slice(0, 3),
  };
}

export function resolveAllClubIdentities(
  sources: OfficialClubRecord[],
  locations: GymMapLocationRecord[],
): ResolutionRecord[] {
  const coordinateCounts = new Map<string, number>();
  for (const source of sources) {
    if (source.latitude === null || source.longitude === null) continue;
    const key = `${source.latitude.toFixed(6)},${source.longitude.toFixed(6)}`;
    coordinateCounts.set(key, (coordinateCounts.get(key) ?? 0) + 1);
  }
  const resolved = sources
    .map((source) => {
      const coordinateKey = source.latitude !== null && source.longitude !== null
        ? `${source.latitude.toFixed(6)},${source.longitude.toFixed(6)}`
        : null;
      const repeatedLocationlessCoordinate = Boolean(
        coordinateKey && (coordinateCounts.get(coordinateKey) ?? 0) > 1 &&
        !source.address && !source.postal_code && !source.city,
      );
      const result = resolveClubIdentity(
        repeatedLocationlessCoordinate ? { ...source, latitude: null, longitude: null } : source,
        locations,
      );
      if (repeatedLocationlessCoordinate) {
        result.conflicts.push("repeated coordinate without address treated as a source placeholder");
      }
      return result;
    })
    .sort((left, right) =>
      left.official_name.localeCompare(right.official_name, "ja") ||
      (left.official_external_id ?? "").localeCompare(right.official_external_id ?? ""),
    );

  const byLocation = new Map<string, ResolutionRecord[]>();
  for (const record of resolved) {
    if (!record.gymmap_location_id || record.resolution_status === "UNMATCHED") continue;
    const matches = byLocation.get(record.gymmap_location_id) ?? [];
    matches.push(record);
    byLocation.set(record.gymmap_location_id, matches);
  }
  for (const matches of byLocation.values()) {
    if (matches.length < 2) continue;
    for (const match of matches) {
      match.resolution_status = "AMBIGUOUS";
      match.match_method = "multiple-official-records-one-gymmap-location";
      match.manual_review_required = true;
      match.conflicts.push("multiple official records resolve to the same GymMap location");
    }
  }
  return resolved;
}

export function duplicateValues(values: Array<string | null | undefined>): string[] {
  const counts = new Map<string, number>();
  for (const value of values) if (value) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts.entries()]
    .filter(([, count]) => count > 1)
    .map(([value]) => value)
    .sort();
}
