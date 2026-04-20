import type { Metadata } from "next";
import Script from "next/script";

import { Header } from "@/components/layout/header";
import "leaflet/dist/leaflet.css";
import "./globals.css";

const cloudflareWebAnalyticsToken = process.env.NEXT_PUBLIC_CLOUDFLARE_WEB_ANALYTICS_TOKEN;

export const metadata: Metadata = {
  title: "ジム・フィットネスクラブのレッスン検索",
  description:
    "ジム・フィットネスクラブのレッスンを検索できるサイトです。BODYCOMBAT、ヨガ、ピラティス、ZUMBA などのスタジオレッスンを、エリア・曜日・開始時間・店舗から探せます。",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body>
        <Header />
        <main className="container page-shell">{children}</main>
        {cloudflareWebAnalyticsToken ? (
          <Script
            src="https://static.cloudflareinsights.com/beacon.min.js"
            strategy="afterInteractive"
            defer
            data-cf-beacon={JSON.stringify({ token: cloudflareWebAnalyticsToken })}
          />
        ) : null}
      </body>
    </html>
  );
}
