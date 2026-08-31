export const PUBLIC_UPDATE_CATEGORIES = [
  "LESSON_DATA",
  "HYROX_DATA",
  "PRODUCT_FEATURE",
] as const;

export const PUBLIC_UPDATE_STATUSES = [
  "PUBLISHED",
  "CORRECTED",
  "RETRACTED",
] as const;

export type PublicUpdateCategory = (typeof PUBLIC_UPDATE_CATEGORIES)[number];
export type PublicUpdateStatus = (typeof PUBLIC_UPDATE_STATUSES)[number];

export type PublicUpdateDestination = {
  href: string;
  label: string;
};

export type PublicUpdateRecord = {
  id: string;
  category: PublicUpdateCategory;
  title: string;
  publishedAt: string;
  status: PublicUpdateStatus;
  summary?: string;
  sourcePeriod?: string;
  affectedEntityType?: string;
  affectedEntityCount?: number;
  destination?: PublicUpdateDestination;
  correctionNote?: string;
};

const MAX_PUBLIC_UPDATES = 50;
const ISO_DATE_OR_TIMESTAMP = /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:Z|[+-]\d{2}:\d{2}))?$/;
const INTERNAL_TERM_PATTERN = /\b(?:commit|crawler|deploy(?:ment)?|job[ _-]?id|migration|vercel)\b/i;
const INTERNAL_PHASE_PATTERN = /\b(?:U\d+(?:-[A-Z0-9]+)+|H\d+(?:-[A-Z0-9]+)+|M\d+)\b/i;
const COMMIT_SHA_PATTERN = /\b[0-9a-f]{7,40}\b/i;
const INTERNAL_PATH_PATTERN = /\b(?:data|docs|scripts|src|supabase)\/[A-Za-z0-9._/-]+/i;
const HYROX_NEGATIVE_WORDING_PATTERN = /設備なし|非対応|利用不可|クラスなし/;

const curatedPublicUpdates = [
  {
    id: "2026-08-31-home-lesson-search-refresh",
    category: "PRODUCT_FEATURE",
    title: "ホームとレッスン検索を見やすくしました",
    publishedAt: "2026-08-31",
    status: "PUBLISHED",
    summary: "検索条件を整理し、スマートフォンでもレッスンを探しやすくしました。",
    destination: {
      href: "/#search-section",
      label: "レッスンを探す",
    },
  },
  {
    id: "2026-08-31-lesson-detail-discovery-favorites-refresh",
    category: "PRODUCT_FEATURE",
    title: "店舗詳細・プログラム・お気に入りを見やすくしました",
    publishedAt: "2026-08-31",
    status: "PUBLISHED",
    summary: "週間スケジュールや開催店舗、お気に入りから今週のレッスンを確認しやすくしました。",
  },
  {
    id: "2026-08-31-hyrox-equipment-information",
    category: "HYROX_DATA",
    title: "HYROX Training Clubの設備情報を掲載しました",
    publishedAt: "2026-08-31",
    status: "PUBLISHED",
    summary:
      "公式情報で確認できた設備情報を、確認できた施設に掲載しました。表示がない施設に設備がないことを示すものではありません。",
    destination: {
      href: "/training/hyrox",
      label: "HYROX Training Clubを探す",
    },
  },
] as const satisfies readonly PublicUpdateRecord[];

function isAllowedCategory(value: string): value is PublicUpdateCategory {
  return (PUBLIC_UPDATE_CATEGORIES as readonly string[]).includes(value);
}

function isAllowedStatus(value: string): value is PublicUpdateStatus {
  return (PUBLIC_UPDATE_STATUSES as readonly string[]).includes(value);
}

function validateDestination(destination: PublicUpdateDestination, id: string) {
  if (
    !destination.href.startsWith("/") ||
    destination.href.startsWith("//") ||
    /[\r\n]/.test(destination.href) ||
    !destination.label.trim()
  ) {
    throw new Error(`Public update ${id} has an unsafe destination.`);
  }
}

function validatePublicCopy(record: PublicUpdateRecord) {
  const publicCopy = [
    record.title,
    record.summary,
    record.sourcePeriod,
    record.affectedEntityType,
    record.destination?.label,
    record.correctionNote,
  ]
    .filter((value): value is string => Boolean(value))
    .join(" ");

  if (
    INTERNAL_TERM_PATTERN.test(publicCopy) ||
    INTERNAL_PHASE_PATTERN.test(publicCopy) ||
    COMMIT_SHA_PATTERN.test(publicCopy) ||
    INTERNAL_PATH_PATTERN.test(publicCopy)
  ) {
    throw new Error(`Public update ${record.id} contains internal-only wording.`);
  }

  if (record.category === "HYROX_DATA" && HYROX_NEGATIVE_WORDING_PATTERN.test(publicCopy)) {
    throw new Error(`HYROX public update ${record.id} contains prohibited negative wording.`);
  }
}

export function validatePublicUpdateRecords(records: readonly PublicUpdateRecord[]) {
  if (records.length > MAX_PUBLIC_UPDATES) {
    throw new Error(`Public updates are limited to ${MAX_PUBLIC_UPDATES} records.`);
  }

  const ids = new Set<string>();

  records.forEach((record) => {
    if (!record.id.trim() || ids.has(record.id)) {
      throw new Error(`Public update id must be unique: ${record.id}`);
    }
    ids.add(record.id);

    if (!isAllowedCategory(record.category)) {
      throw new Error(`Public update ${record.id} has an unsupported category.`);
    }
    if (!isAllowedStatus(record.status)) {
      throw new Error(`Public update ${record.id} has an unsupported status.`);
    }
    if (!record.title.trim()) {
      throw new Error(`Public update ${record.id} requires a title.`);
    }
    if (!ISO_DATE_OR_TIMESTAMP.test(record.publishedAt) || Number.isNaN(Date.parse(record.publishedAt))) {
      throw new Error(`Public update ${record.id} has an invalid publishedAt value.`);
    }
    if (
      (record.status === "CORRECTED" || record.status === "RETRACTED") &&
      !record.correctionNote?.trim()
    ) {
      throw new Error(`Public update ${record.id} requires a correctionNote.`);
    }
    if (
      record.affectedEntityCount !== undefined &&
      (!Number.isInteger(record.affectedEntityCount) || record.affectedEntityCount < 1)
    ) {
      throw new Error(`Public update ${record.id} has an invalid affectedEntityCount.`);
    }
    if (record.destination) {
      validateDestination(record.destination, record.id);
    }

    validatePublicCopy(record);
  });

  return records;
}

export function getPublicUpdates(): PublicUpdateRecord[] {
  return validatePublicUpdateRecords(curatedPublicUpdates)
    .map((record, index) => ({ record, index }))
    .sort((a, b) => Date.parse(b.record.publishedAt) - Date.parse(a.record.publishedAt) || a.index - b.index)
    .map(({ record }) => ({ ...record }));
}

export function getLatestPublicUpdatePublishedAt() {
  return getPublicUpdates()[0]?.publishedAt ?? null;
}

export function formatPublicUpdateDate(value: string) {
  const datePart = value.slice(0, 10);
  const match = datePart.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) {
    return value;
  }

  return `${Number(match[1])}年${Number(match[2])}月${Number(match[3])}日`;
}
