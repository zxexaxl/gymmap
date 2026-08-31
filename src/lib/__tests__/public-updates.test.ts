import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { PublicUpdateItem } from "@/components/updates/public-update-item";
import { buildCoreSitemapEntries } from "@/lib/core-sitemap";
import {
  getLatestPublicUpdatePublishedAt,
  getPublicUpdates,
  PUBLIC_UPDATE_CATEGORIES,
  PUBLIC_UPDATE_STATUSES,
  type PublicUpdateRecord,
  validatePublicUpdateRecords,
} from "@/lib/public-updates";

const baseRecord: PublicUpdateRecord = {
  id: "fixture",
  category: "PRODUCT_FEATURE",
  title: "表示を改善しました",
  publishedAt: "2026-08-31",
  status: "PUBLISHED",
};

test("curated records use the frozen categories and statuses", () => {
  assert.deepEqual(PUBLIC_UPDATE_CATEGORIES, ["LESSON_DATA", "HYROX_DATA", "PRODUCT_FEATURE"]);
  assert.deepEqual(PUBLIC_UPDATE_STATUSES, ["PUBLISHED", "CORRECTED", "RETRACTED"]);

  const updates = getPublicUpdates();
  assert.ok(updates.length > 0);
  assert.ok(updates.length <= 50);
  assert.equal(new Set(updates.map((update) => update.id)).size, updates.length);
  assert.ok(updates.every((update) => update.status === "PUBLISHED"));
});

test("curated records render in descending chronological order with stable same-day order", () => {
  const updates = getPublicUpdates();
  const timestamps = updates.map((update) => Date.parse(update.publishedAt));

  assert.deepEqual(timestamps, [...timestamps].sort((a, b) => b - a));
  assert.equal(updates[0]?.id, "2026-08-31-home-lesson-search-refresh");
  assert.equal(getLatestPublicUpdatePublishedAt(), updates[0]?.publishedAt);
});

test("validation rejects unsupported values, duplicates, unsafe destinations, and internal wording", () => {
  assert.throws(() => validatePublicUpdateRecords([
    { ...baseRecord, category: "BACKEND" as PublicUpdateRecord["category"] },
  ]), /unsupported category/);
  assert.throws(() => validatePublicUpdateRecords([
    { ...baseRecord, status: "DRAFT" as PublicUpdateRecord["status"] },
  ]), /unsupported status/);
  assert.throws(() => validatePublicUpdateRecords([baseRecord, baseRecord]), /unique/);
  assert.throws(() => validatePublicUpdateRecords([
    { ...baseRecord, destination: { href: "https://example.com", label: "外部リンク" } },
  ]), /unsafe destination/);
  assert.throws(() => validatePublicUpdateRecords([
    { ...baseRecord, summary: "crawler job complete" },
  ]), /internal-only wording/);
  assert.throws(() => validatePublicUpdateRecords([
    { ...baseRecord, summary: "commit 951cf2a" },
  ]), /internal-only wording/);
});

test("HYROX validation rejects explicit negative inference", () => {
  for (const wording of ["設備なし", "非対応", "利用不可", "クラスなし"]) {
    assert.throws(() => validatePublicUpdateRecords([
      { ...baseRecord, category: "HYROX_DATA", summary: wording },
    ]), /prohibited negative wording/);
  }

  const hyroxSeed = getPublicUpdates().find((update) => update.category === "HYROX_DATA");
  assert.ok(hyroxSeed);
  assert.doesNotMatch(`${hyroxSeed.title} ${hyroxSeed.summary}`, /設備が追加|利用可能にな|新たにSled|109 claims/);
});

test("corrected and retracted states require a public-safe note", () => {
  assert.throws(() => validatePublicUpdateRecords([
    { ...baseRecord, status: "CORRECTED" },
  ]), /correctionNote/);
  assert.throws(() => validatePublicUpdateRecords([
    { ...baseRecord, status: "RETRACTED" },
  ]), /correctionNote/);
});

test("published, corrected, and retracted presentation preserves status semantics", () => {
  const publishedMarkup = renderToStaticMarkup(createElement(PublicUpdateItem, { update: baseRecord }));
  assert.match(publishedMarkup, /表示を改善しました/);
  assert.doesNotMatch(publishedMarkup, /公開済み/);

  const correctedMarkup = renderToStaticMarkup(createElement(PublicUpdateItem, {
    update: {
      ...baseRecord,
      id: "corrected-fixture",
      status: "CORRECTED",
      correctionNote: "対象範囲の表現を訂正しました。",
    },
  }));
  assert.match(correctedMarkup, /訂正あり/);
  assert.match(correctedMarkup, /訂正内容/);

  const retractedMarkup = renderToStaticMarkup(createElement(PublicUpdateItem, {
    update: {
      ...baseRecord,
      id: "retracted-fixture",
      status: "RETRACTED",
      title: "表示してはいけない元の主張",
      correctionNote: "確認根拠が不十分だったため取り下げました。",
      destination: { href: "/", label: "移動する" },
    },
  }));
  assert.match(retractedMarkup, /この更新は取り下げました/);
  assert.match(retractedMarkup, /取り下げ理由/);
  assert.doesNotMatch(retractedMarkup, /表示してはいけない元の主張|移動する/);
});

test("route, navigation, and authority boundaries remain intentionally small", () => {
  const pageSource = fs.readFileSync("src/app/updates/page.tsx", "utf8");
  const appShellSource = fs.readFileSync("src/components/layout/app-shell.tsx", "utf8");
  const footerSource = fs.readFileSync("src/components/layout/utility-footer.tsx", "utf8");
  const headerSource = fs.readFileSync("src/components/layout/header.tsx", "utf8");
  const homeSource = fs.readFileSync("src/app/page.tsx", "utf8");

  assert.match(pageSource, /force-static/);
  assert.match(pageSource, /canonical: pathname/);
  assert.match(pageSource, /<ol/);
  assert.match(pageSource, /各ページの表示をご確認ください/);
  assert.doesNotMatch(`${pageSource}\n${appShellSource}\n${footerSource}`, /最終更新/);
  assert.match(appShellSource, /<UtilityFooter/);
  assert.match(footerSource, /href="\/updates"/);
  assert.doesNotMatch(headerSource, /\/updates|更新情報/);
  assert.doesNotMatch(homeSource, /最近の更新|更新履歴|\/updates/);
  assert.equal(fs.existsSync("src/app/updates/[id]"), false);
});

test("sitemap includes updates only with curated content and uses the public publication date", () => {
  const withoutUpdates = buildCoreSitemapEntries("https://gymmap.vercel.app", "2026-08-31T10:00:00Z");
  assert.equal(withoutUpdates.some((entry) => entry.loc.endsWith("/updates")), false);

  const latestPublishedAt = getLatestPublicUpdatePublishedAt();
  const withUpdates = buildCoreSitemapEntries(
    "https://gymmap.vercel.app",
    "2026-08-31T10:00:00Z",
    latestPublishedAt,
  );
  const updatesEntry = withUpdates.find((entry) => entry.loc.endsWith("/updates"));

  assert.ok(updatesEntry);
  assert.equal(updatesEntry.lastmod, latestPublishedAt);

  const generatedCoreSitemap = fs.readFileSync("public/sitemap-core.xml", "utf8");
  assert.match(generatedCoreSitemap, /<loc>https:\/\/gymmap\.vercel\.app\/updates<\/loc>/);
  assert.match(generatedCoreSitemap, /<loc>https:\/\/gymmap\.vercel\.app\/updates<\/loc>\s*<lastmod>2026-08-31<\/lastmod>/);
});
