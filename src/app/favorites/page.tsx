import type { Metadata } from "next";

import { FavoriteScheduleView } from "@/components/favorites/favorite-schedule-view";

export const metadata: Metadata = {
  title: "お気に入りの今週",
  description: "お気に入りに保存したスタジオプログラムの今週の開催スケジュールをまとめて確認できます。",
  robots: {
    index: false,
    follow: true,
  },
};

export default function FavoritesPage() {
  return <FavoriteScheduleView />;
}
