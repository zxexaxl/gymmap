import { NextResponse } from "next/server";
import type { ProxyConfig } from "next/server";

const retryAfter = "Sun, 13 Sep 2026 00:00:00 GMT";

const maintenancePage = `<!doctype html>
<html lang="ja">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>メンテナンス中 | GymMap</title>
    <style>
      :root { color-scheme: light; }
      * { box-sizing: border-box; }
      body {
        align-items: center;
        background: #f7f7f4;
        color: #172018;
        display: flex;
        font-family: -apple-system, BlinkMacSystemFont, "Hiragino Sans", "Yu Gothic", sans-serif;
        justify-content: center;
        margin: 0;
        min-height: 100svh;
        padding: 24px;
      }
      main { max-width: 560px; width: 100%; }
      article {
        background: #fff;
        border: 1px solid #d9ded7;
        border-radius: 20px;
        box-shadow: 0 14px 40px rgb(30 45 31 / 8%);
        padding: clamp(32px, 8vw, 56px);
      }
      p { font-size: 1rem; line-height: 1.85; margin: 0; }
      .eyebrow { color: #4b644f; font-size: .75rem; font-weight: 700; letter-spacing: .12em; margin-bottom: 18px; }
      h1 { font-size: clamp(1.75rem, 5vw, 2.4rem); letter-spacing: -.03em; line-height: 1.3; margin: 0 0 22px; }
      .reopen { border-top: 1px solid #e3e7e1; color: #405143; margin-top: 28px; padding-top: 24px; }
    </style>
  </head>
  <body>
    <main>
      <article>
        <p class="eyebrow">GYMMAP</p>
        <h1>GymMapは現在メンテナンス中です</h1>
        <p>システムメンテナンスのため、一時的にサービスをご利用いただけません。</p>
        <p class="reopen">9月13日ごろ再開予定です。<br />ご不便をおかけしますが、再開までしばらくお待ちください。</p>
      </article>
    </main>
  </body>
</html>`;

export function proxy() {
  if (process.env.GYMMAP_MAINTENANCE_MODE !== "true") {
    return NextResponse.next();
  }

  return new NextResponse(maintenancePage, {
    status: 503,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Retry-After": retryAfter,
      "Cache-Control": "no-store, max-age=0",
    },
  });
}

export const config: ProxyConfig = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|robots.txt|sitemap(?:-[^/]+)?\\.xml|google[\\w-]+\\.html).*)",
  ],
};
