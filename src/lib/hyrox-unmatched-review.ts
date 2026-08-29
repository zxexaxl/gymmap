import {
  normalizeAddress,
  normalizeName,
  normalizePostalCode,
  normalizeUrl,
  type GymMapLocationRecord,
  type OfficialClubRecord,
  type ResolutionRecord,
} from "./hyrox-official-clubs";

export type ReviewClassification =
  | "EXISTING_LOCATION_CONFIRMED_MATCH"
  | "NEW_LOCATION_READY"
  | "NEW_LOCATION_NEEDS_REVIEW"
  | "EXISTING_LOCATION_AMBIGUOUS"
  | "NON_STANDARD_LOCATION"
  | "SOURCE_CONFLICT";

export type BrandResolution =
  | "EXISTING_BRAND_MATCH"
  | "NEW_BRAND_CANDIDATE"
  | "INDEPENDENT_FACILITY"
  | "BRAND_AMBIGUOUS";

export type GymBrandRecord = {
  id: string;
  name: string;
  slug: string;
  official_url: string | null;
};

export type H24LocationRecord = GymMapLocationRecord & { location_type: string | null };

export type WebsiteObservation = {
  external_id: string;
  requested_url: string;
  final_url: string | null;
  status: number | null;
  content_type: string | null;
  title: string | null;
  canonical_url: string | null;
  fetched_at: string;
  official_name_match: boolean;
  postal_code_match: boolean;
  address_token_match: boolean;
  page_postal_codes: string[];
  error: string | null;
};

export type PostalObservation = {
  postal_code: string;
  prefecture: string | null;
  city: string | null;
  town: string | null;
  status: "resolved" | "missing" | "unavailable";
};

export type ReviewOverride = {
  external_id: string;
  decision: ReviewClassification;
  matched_location_id?: string;
  reason: string;
  reviewed_source_url: string;
  reviewed_at: string;
};

export type H24ReviewRecord = {
  hgy_external_id: string;
  hyrox_official_name: string;
  hyrox_source_url: string;
  final_classification: ReviewClassification;
  matched_location_id: string | null;
  matched_location_slug: string | null;
  matched_location_name: string | null;
  canonical_facility_url: string | null;
  official_site_status: "verified" | "missing" | "noncanonical" | "unavailable" | "insufficient_identity_evidence";
  canonical_name: string;
  address: string | null;
  postal_code: string | null;
  prefecture: string | null;
  city: string | null;
  address_verification_status: "postal_authority_resolved" | "source_only";
  latitude: number | null;
  longitude: number | null;
  coordinate_source: "hyrox-governing-body-finder" | null;
  coordinate_confidence: "high" | "medium" | "invalid" | "missing";
  brand_resolution: BrandResolution;
  proposed_brand_id: string | null;
  proposed_brand_name: string | null;
  proposed_brand_slug: string | null;
  proposed_slug: string | null;
  proposed_location_type: string | null;
  is_active_candidate: boolean;
  match_method: string;
  reasons: string[];
  conflicts: string[];
  source_authorities: string[];
  manual_review_required: boolean;
};

const SOCIAL_OR_PLATFORM_HOSTS = [
  "instagram.com", "facebook.com", "x.com", "stores.jp", "hacomono.jp",
  "vercel.app", "canva.site", "linktr.ee",
];

const CHAIN_BRANDS: Array<[RegExp, string, string]> = [
  [/orange\s*theory|orangetheory|オレンジセオリー|\botf\b/i, "Orangetheory Fitness", "orangetheory-fitness"],
  [/bee\s*quick/i, "BeeQuick Fitness", "beequick-fitness"],
  [/\bubx\b/i, "UBX", "ubx"],
  [/anytime/i, "Anytime Fitness", "anytime-fitness"],
  [/\bbeyond\b/i, "BEYOND", "beyond"],
  [/ufc\s*gym/i, "UFC GYM", "ufc-gym"],
  [/\bf45\b/i, "F45 Training", "f45-training"],
  [/\bhyex\b/i, "HYEX", "hyex"],
  [/\brexer\b/i, "ReXeR", "rexer"],
  [/nota\s*gym/i, "NOTA GYM", "nota-gym"],
  [/stance\s*fitness/i, "STANCE FITNESS", "stance-fitness"],
  [/g[- ]?zone/i, "g-zone", "g-zone"],
];

export function validJapanCoordinates(latitude: number | null, longitude: number | null): boolean {
  return latitude !== null && longitude !== null && latitude >= 20 && latitude <= 46 && longitude >= 122 && longitude <= 154;
}

export function semanticSlug(value: string, postalCode: string | null): string | null {
  const slug = value.normalize("NFKD").toLowerCase()
    .replace(/[’'`]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
  if (slug.length >= 3) return slug.slice(0, 80).replace(/-+$/g, "");
  const postal = normalizePostalCode(postalCode);
  return postal.length === 7 ? `hyrox-training-club-${postal}` : null;
}

export function resolveBrand(
  officialName: string,
  brands: GymBrandRecord[],
): Pick<H24ReviewRecord, "brand_resolution" | "proposed_brand_id" | "proposed_brand_name" | "proposed_brand_slug"> {
  const normalized = normalizeName(officialName);
  const golds = brands.find((brand) => brand.slug === "golds-gym");
  if (golds && /gold.?s|ゴールド/i.test(officialName)) {
    return { brand_resolution: "EXISTING_BRAND_MATCH", proposed_brand_id: golds.id, proposed_brand_name: golds.name, proposed_brand_slug: golds.slug };
  }
  for (const brand of brands) {
    if (normalized.includes(normalizeName(brand.name))) {
      return { brand_resolution: "EXISTING_BRAND_MATCH", proposed_brand_id: brand.id, proposed_brand_name: brand.name, proposed_brand_slug: brand.slug };
    }
  }
  for (const [pattern, name, slug] of CHAIN_BRANDS) {
    if (pattern.test(officialName)) {
      return { brand_resolution: "NEW_BRAND_CANDIDATE", proposed_brand_id: null, proposed_brand_name: name, proposed_brand_slug: slug };
    }
  }
  const slug = semanticSlug(officialName, null);
  return {
    brand_resolution: slug ? "INDEPENDENT_FACILITY" : "BRAND_AMBIGUOUS",
    proposed_brand_id: null,
    proposed_brand_name: slug ? officialName.trim() : null,
    proposed_brand_slug: slug,
  };
}

export function inferLocationType(name: string, brandSlug: string | null): string {
  if (brandSlug === "golds-gym" || /fitness\s*club|anytime|bee\s*quick/i.test(name)) return "fitness_club";
  if (/personal|パーソナル|body\s*make|ボディメイク/i.test(name)) return "bodymake_gym";
  return "fitness_studio";
}

function hostIsNonCanonical(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase().replace(/^www\./, "");
    return SOCIAL_OR_PLATFORM_HOSTS.some((suffix) => host === suffix || host.endsWith(`.${suffix}`));
  } catch {
    return true;
  }
}

function findExistingUrlMatch(observation: WebsiteObservation | undefined, locations: H24LocationRecord[]): H24LocationRecord[] {
  if (!observation?.final_url) return [];
  const finalUrl = normalizeUrl(observation.final_url);
  return locations.filter((location) =>
    [location.official_url, location.source_url].some((url) => normalizeUrl(url) === finalUrl));
}

function nonStandardName(name: string): boolean {
  return /\brental\s*gym\b|virtual|online\s*(?:gym|coach)|event[- ]?only/i.test(name);
}

export function reviewUnmatchedRecord(input: {
  resolution: ResolutionRecord;
  source: OfficialClubRecord;
  locations: H24LocationRecord[];
  brands: GymBrandRecord[];
  website?: WebsiteObservation;
  postal?: PostalObservation;
  override?: ReviewOverride;
  reservedSlugs?: Set<string>;
}): H24ReviewRecord {
  const { source, locations, brands, website, postal, override } = input;
  if (!source.external_id) throw new Error("H2-4 requires a stable external ID");
  const brand = resolveBrand(source.official_name, brands);
  const coordinatesValid = validJapanCoordinates(source.latitude, source.longitude);
  const canonicalUrl = website?.final_url ?? source.facility_url;
  const reasons = ["HYROX governing-body Training Finder record has a stable HGY identity"];
  const conflicts: string[] = [];
  const urlMatches = findExistingUrlMatch(website, locations);
  let classification: ReviewClassification = "NEW_LOCATION_NEEDS_REVIEW";
  let matched: H24LocationRecord | null = null;
  let method = "fail-closed-source-review";

  if (override) {
    classification = override.decision;
    matched = locations.find((location) => location.id === override.matched_location_id) ?? null;
    method = "structured-manual-override";
    reasons.push(override.reason);
  } else if (urlMatches.length === 1) {
    classification = "EXISTING_LOCATION_CONFIRMED_MATCH";
    matched = urlMatches[0];
    method = "official-facility-final-url-exact";
    reasons.push("Official facility URL redirects to the existing GymMap location URL");
  } else if (urlMatches.length > 1) {
    classification = "EXISTING_LOCATION_AMBIGUOUS";
    method = "official-url-multiple-existing-candidates";
    conflicts.push("Official facility URL matches multiple existing GymMap locations");
  } else if (nonStandardName(source.official_name)) {
    classification = "NON_STANDARD_LOCATION";
    method = "non-standard-entity-name";
    conflicts.push("Entity appears to be a rental, virtual, or event-only operation");
  } else if (!source.facility_url) {
    conflicts.push("Facility official website is missing from the governing-body record");
  } else if (hostIsNonCanonical(source.facility_url)) {
    conflicts.push("Only a social, booking, or hosted landing-page URL is available");
  } else if (!website || website.error || website.status === null || website.status >= 400) {
    conflicts.push("Facility official website could not be verified live");
  } else if (!source.address) {
    conflicts.push("HYROX source address is missing");
  } else if (!website.postal_code_match && !(website.official_name_match && website.address_token_match)) {
    conflicts.push("Official website did not expose enough name/address evidence for deterministic identity");
  } else if (!postal || postal.status !== "resolved" || !postal.prefecture || !postal.city) {
    conflicts.push("Postal authority did not resolve prefecture and city");
  } else if (!coordinatesValid) {
    conflicts.push("HYROX coordinates are missing or outside Japan bounds");
  } else if (brand.brand_resolution === "BRAND_AMBIGUOUS") {
    conflicts.push("Brand representation is unresolved");
  } else {
    classification = "NEW_LOCATION_READY";
    method = website.postal_code_match ? "official-site-postal-identity" : "official-site-name-address-identity";
    reasons.push("Facility official website confirms the facility identity and address signal");
    reasons.push("Postal authority resolves prefecture and city");
  }

  const canonicalName = matched?.name ?? source.official_name.trim();
  const officialSiteStatus: H24ReviewRecord["official_site_status"] = !source.facility_url
    ? "missing"
    : hostIsNonCanonical(source.facility_url)
      ? "noncanonical"
      : !website || website.error || website.status === null || website.status >= 400
        ? "unavailable"
        : website.postal_code_match || (website.official_name_match && website.address_token_match)
          ? "verified"
          : "insufficient_identity_evidence";
  let slug = classification === "NEW_LOCATION_READY" ? semanticSlug(canonicalName, source.postal_code) : null;
  if (slug && brand.brand_resolution === "NEW_BRAND_CANDIDATE" && slug === brand.proposed_brand_slug) {
    const postal = normalizePostalCode(source.postal_code);
    slug = postal.length === 7 ? `${slug}-${postal}` : null;
  }
  if (slug && input.reservedSlugs?.has(slug)) {
    classification = "NEW_LOCATION_NEEDS_REVIEW";
    conflicts.push(`Proposed slug collides: ${slug}`);
    slug = null;
  }
  if (slug) input.reservedSlugs?.add(slug);

  return {
    hgy_external_id: source.external_id,
    hyrox_official_name: source.official_name,
    hyrox_source_url: source.official_source_url,
    final_classification: classification,
    matched_location_id: matched?.id ?? null,
    matched_location_slug: matched?.slug ?? null,
    matched_location_name: matched?.name ?? null,
    canonical_facility_url: canonicalUrl ?? null,
    official_site_status: officialSiteStatus,
    canonical_name: canonicalName,
    address: source.address,
    postal_code: source.postal_code,
    prefecture: postal?.status === "resolved" ? postal.prefecture : source.prefecture,
    city: postal?.status === "resolved" ? postal.city : source.city,
    address_verification_status: postal?.status === "resolved" ? "postal_authority_resolved" : "source_only",
    latitude: source.latitude,
    longitude: source.longitude,
    coordinate_source: source.latitude === null || source.longitude === null ? null : "hyrox-governing-body-finder",
    coordinate_confidence: coordinatesValid ? (website?.postal_code_match ? "high" : "medium") : source.latitude === null ? "missing" : "invalid",
    ...brand,
    proposed_slug: slug,
    proposed_location_type: classification === "NEW_LOCATION_READY" ? inferLocationType(canonicalName, brand.proposed_brand_slug) : matched?.location_type ?? null,
    is_active_candidate: classification === "NEW_LOCATION_READY",
    match_method: method,
    reasons,
    conflicts,
    source_authorities: [
      "HYROX governing-body Training Finder",
      ...(website && !website.error ? ["facility official website"] : []),
      ...(postal?.status === "resolved" ? ["postal address lookup"] : []),
    ],
    manual_review_required: !["EXISTING_LOCATION_CONFIRMED_MATCH", "NEW_LOCATION_READY"].includes(classification),
  };
}

export function duplicateValues(values: Array<string | null>): string[] {
  const counts = new Map<string, number>();
  for (const value of values) if (value) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts].filter(([, count]) => count > 1).map(([value]) => value).sort();
}

export function normalizedAddressKey(value: string | null): string | null {
  const normalized = normalizeAddress(value);
  return normalized ? normalized : null;
}
