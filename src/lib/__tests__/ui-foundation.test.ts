import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { Header } from "@/components/layout/header";
import { HyroxReferenceFixture, LessonReferenceFixture } from "@/components/ui/__fixtures__/domain-reference-fixtures";
import { Button, FreshnessIndicator, Input, SelectableChip } from "@/components/ui";

test("shared controls expose stable variants and accessible states", () => {
  const button = renderToStaticMarkup(createElement(Button, { variant: "secondary", disabled: true }, "保存"));
  assert.match(button, /ui-button--secondary/);
  assert.match(button, /disabled=""/);

  const loading = renderToStaticMarkup(createElement(Button, { loading: true }, "検索"));
  assert.match(loading, /aria-busy="true"/);
  assert.match(loading, /disabled=""/);
  assert.match(loading, /処理中/);

  const icon = renderToStaticMarkup(createElement(Button, { iconOnly: true, "aria-label": "閉じる" }, "×"));
  assert.match(icon, /aria-label="閉じる"/);
  assert.match(icon, /ui-button--icon/);

  const chip = renderToStaticMarkup(createElement(SelectableChip, { selected: true }, "東京"));
  assert.match(chip, /aria-pressed="true"/);
  assert.match(chip, /is-selected/);
});

test("Input associates helper and error messages without relying on color", () => {
  const helper = renderToStaticMarkup(createElement(Input, {
    id: "area",
    label: "エリア",
    helperText: "市区町村を入力してください",
  }));
  assert.match(helper, /for="area"/);
  assert.match(helper, /aria-describedby="area-helper"/);

  const error = renderToStaticMarkup(createElement(Input, {
    id: "query",
    label: "キーワード",
    errorText: "入力内容を確認してください",
  }));
  assert.match(error, /aria-invalid="true"/);
  assert.match(error, /aria-describedby="query-error"/);
  assert.match(error, /入力内容を確認してください/);
});

test("FreshnessIndicator renders only domain-provided presentation state and label", () => {
  const markup = renderToStaticMarkup(createElement(FreshnessIndicator, {
    status: "stale",
    label: "再確認が必要",
  }));
  assert.match(markup, /ui-freshness--stale/);
  assert.match(markup, /再確認が必要/);

  const source = fs.readFileSync("src/components/ui/freshness-indicator.tsx", "utf8");
  assert.doesNotMatch(source, /updatedAt|ageDays|Date\(|Date\.now|difference/);
});

test("Header separates Japanese domain navigation from Lesson-local destinations", () => {
  const markup = renderToStaticMarkup(createElement(Header));
  for (const href of ["/", "/training/hyrox", "/#search-section", "/#popular-programs", "/#map-section", "/favorites"]) {
    assert.match(markup, new RegExp(`href="${href.replace("/", "\\/")}"`));
  }
  assert.match(markup, /GymMapのドメインナビゲーション/);
  assert.match(markup, /レッスンを探す/);
  assert.match(markup, /レッスン/);
  assert.match(markup, />HYROX</);
  assert.match(markup, /レッスン内のナビゲーション/);
  assert.match(markup, /<summary>メニュー<\/summary>/);
  assert.match(markup, /aria-current="page"/);
  assert.doesNotMatch(markup, /スタジオレッスン検索/);
  assert.doesNotMatch(markup, />Lesson(?: メニュー)?</);
  assert.doesNotMatch(markup, /Lesson お気に入り|Lesson 地図/);
});

test("Header CSS hides Lesson-local navigation in HYROX context without clientification", () => {
  const css = fs.readFileSync("src/app/globals.css", "utf8");
  const headerSource = fs.readFileSync("src/components/layout/header.tsx", "utf8");

  assert.match(css, /\.app-shell:has\(main \.hyrox-page\) \.header-lesson-menu\s*\{/);
  assert.match(css, /\.app-shell:has\(main \.hyrox-page\) \.header-nav--hyrox-context\s*\{/);
  assert.match(css, /\.header-nav--hyrox-context\s*\{\s*display: none;/);
  assert.doesNotMatch(headerSource, /"use client"|usePathname|useState|useEffect/);
});

test("Lesson reference composition keeps its hierarchy outside CardSurface", () => {
  const markup = renderToStaticMarkup(createElement(LessonReferenceFixture));
  assert.match(markup, /今日 19:30–20:15/);
  assert.match(markup, /BODYCOMBAT 45/);
  assert.match(markup, /スポーツクラブ Example 渋谷/);
  assert.match(markup, /今週の公式スケジュール/);
});

test("HYROX reference composition preserves H3-10A positive and omission semantics", () => {
  const positive = renderToStaticMarkup(createElement(HyroxReferenceFixture, {
    equipment: ["スレッド"],
    capabilities: ["自主練利用を確認", "HYROXトレーニング指導を確認", "スレッドプッシュ／プル用スペースを確認"],
    freshnessStatus: "current",
    freshnessLabel: "公式情報を確認済み",
  }));
  assert.match(positive, /公式情報で確認できた設備/);
  assert.match(positive, /スレッド/);
  assert.match(positive, /自主練利用を確認/);
  assert.match(positive, /HYROXトレーニング指導を確認/);
  assert.match(positive, /スレッドプッシュ／プル用スペースを確認/);

  const empty = renderToStaticMarkup(createElement(HyroxReferenceFixture, {
    equipment: [],
    capabilities: [],
    freshnessStatus: "stale",
    freshnessLabel: "現在の表示対象外",
  }));
  assert.doesNotMatch(empty, /ui-reference-card__evidence/);
  assert.doesNotMatch(empty, /設備なし|未確認|調査中|設備情報を確認中|確認できませんでした/);
  assert.match(empty, /ui-freshness--stale/);
  assert.match(empty, /現在の表示対象外/);
  assert.match(empty, /掲載がない設備や対応の不在を意味しません/);
});
