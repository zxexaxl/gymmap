import type { Metadata } from "next";

import { Header } from "@/components/layout/header";
import "./globals.css";

export const metadata: Metadata = {
  title: "GymMap MVP",
  description: "スポーツジムのスタジオプログラムを横断検索できる MVP",
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
