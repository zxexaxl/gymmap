import type { Metadata } from "next";

import { Header } from "@/components/layout/header";
import "leaflet/dist/leaflet.css";
import "./globals.css";

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
      </body>
    </html>
  );
}
