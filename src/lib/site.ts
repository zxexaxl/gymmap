export const siteName = "GymMap";
export const siteDescription =
  "ジム・フィットネスクラブのスタジオレッスンを検索できるサイトです。BODYCOMBAT、ヨガ、ピラティス、ZUMBA などを、エリア・曜日・開始時間・店舗から探せます。";

const defaultSiteUrl = "https://gymmap.vercel.app";

export function getSiteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || defaultSiteUrl).replace(/\/+$/, "");
}

export function buildCanonicalPath(pathname = "/") {
  return `${getSiteUrl()}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
}

export function buildProgramPath(programSlug: string) {
  return `/programs/${encodeURIComponent(programSlug)}`;
}

export function buildAreaProgramPath(areaName: string, programSlug: string) {
  return `/areas/${encodeURIComponent(areaName)}/${encodeURIComponent(programSlug)}`;
}
