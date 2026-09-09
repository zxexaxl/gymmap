import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const locationPage = fs.readFileSync("src/app/locations/[slug]/page.tsx", "utf8");
const programPage = fs.readFileSync("src/app/programs/[slug]/page.tsx", "utf8");
const locationStyles = fs.readFileSync(
  "src/app/locations/[slug]/location-detail.module.css",
  "utf8",
);
const programStyles = fs.readFileSync("src/app/programs/[slug]/program.module.css", "utf8");

test("facility pages lead with schedule intent only when schedules exist", () => {
  assert.match(
    locationPage,
    /\{hasSchedules \? \([\s\S]*<span>\{location\.name\}の<\/span>\s*<span>レッスンスケジュール<\/span>[\s\S]*\) : \(\s*location\.name\s*\)\}/,
  );
});

test("facility metadata keeps title and canonical stable while leading with schedule details", () => {
  assert.match(locationPage, /\? `\$\{location\.name\}のスタジオスケジュール`/);
  assert.match(locationPage, /alternates: \{\s*canonical: `\/locations\/\$\{slug\}`/);
  assert.match(locationPage, /`\$\{location\.name\}のレッスンスケジュールを曜日別に確認できます。`/);
  assert.match(locationPage, /開催プログラム、開始時間、所要時間を掲載しています。/);
  assert.doesNotMatch(locationPage, /最新スタジオスケジュール・タイムテーブル/);
  assert.doesNotMatch(locationPage, /programNames\.join/);
});

test("program pages strengthen the H1 without changing successful metadata", () => {
  assert.match(programPage, /const pageTitle = `\$\{page\.program\.name\}が受けられるジム・最新スケジュール`;/);
  assert.match(
    programPage,
    /const description = `\$\{page\.program\.name\}を受けられるジムを\$\{page\.locationCount\}店舗・\$\{page\.schedules\.length\}件掲載。地域・曜日・時間帯から、通いやすい開催店舗とタイムテーブルを比較できます。`;/,
  );
  assert.match(programPage, /canonical: buildProgramPath\(page\.program\.slug\)/);
  assert.match(
    programPage,
    /<span>\{page\.program\.name\}<\/span>\s*<span>が受けられるジム<\/span>/,
  );
  assert.match(programPage, /受けられる店舗と開催時間を、地域や曜日から探せます。/);
  assert.doesNotMatch(programPage, /受けられる店舗と今週の開催時間/);
});

test("responsive heading styles keep the expanded intent readable on mobile", () => {
  assert.match(locationStyles, /\.identity h1 \{\s*font-size: clamp\(2rem, 8\.5vw, 2\.7rem\);/);
  assert.match(programStyles, /\.heroCopy h1 \{\s*font-size: clamp\(2\.5rem, 10vw, 4rem\);/);
  assert.match(locationStyles, /\.identity h1 span \{\s*display: block;/);
  assert.match(programStyles, /\.heroCopy h1 span \{\s*display: block;/);
});
