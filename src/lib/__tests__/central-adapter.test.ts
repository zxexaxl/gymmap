import assert from "node:assert/strict";
import test from "node:test";

import {
  CENTRAL_TOKYO_CLUB_LIST_URL,
  extractTokyoClubCandidates,
  findScheduleTabUrl,
  findStudioScheduleCandidates,
} from "../extraction/central-adapter";

test("extractTokyoClubCandidates returns club top links from the Tokyo section", () => {
  const html = `
    <section>
      <h2>関東エリア　東京都</h2>
      <ul>
        <li><a href="/club/omori/">セントラルウェルネスクラブ24 大森</a></li>
        <li><a href="/club/fuchu/">セントラルフィットネスクラブ 府中</a></li>
        <li><a href="/club/pdf/psc-244-A-202603.pdf">PDF</a></li>
      </ul>
    </section>
  `;

  const clubs = extractTokyoClubCandidates(CENTRAL_TOKYO_CLUB_LIST_URL, html);
  assert.deepEqual(
    clubs.map((club) => club.url),
    ["https://www.central.co.jp/club/omori/", "https://www.central.co.jp/club/fuchu/"],
  );
});

test("findScheduleTabUrl finds a schedule tab but ignores instructor substitution links", () => {
  const html = `
    <nav>
      <a href="/club/omori/club_schedule/">スケジュール</a>
      <a href="/club/omori/instructor/">インストラクター代行情報</a>
    </nav>
  `;

  assert.equal(
    findScheduleTabUrl("https://www.central.co.jp/club/omori/", html),
    "https://www.central.co.jp/club/omori/club_schedule/",
  );
});

test("findStudioScheduleCandidates prioritizes studio schedule links", () => {
  const html = `
    <section>
      <h2>今月のスケジュール</h2>
      <p>PDFでみる</p>
      <a href="/club/pdf/psc-244-A-202603.pdf">プール</a>
      <a href="/club/pdf/psc-244-B-202603.pdf">スタジオ</a>
      <a href="/club/pdf/psc-244-C-202603.pdf">その他</a>
    </section>
  `;

  const candidates = findStudioScheduleCandidates({
    pageUrl: "https://www.central.co.jp/club/omori/",
    html,
    sourcePage: "club_top",
  });

  assert.equal(candidates[0]?.url, "https://www.central.co.jp/club/pdf/psc-244-B-202603.pdf");
  assert.equal(candidates[0]?.format, "pdf");
});
