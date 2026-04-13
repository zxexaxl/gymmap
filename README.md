# GymMap MVP

スポーツジムのスタジオプログラムを横断検索するための、個人開発向け Next.js + Supabase MVP です。

初期デプロイは Vercel Hobby を想定しつつ、アプリ本体は Vercel 固有機能に強く依存しない構成にしています。将来 Vercel Pro へ切り替える場合でも、アプリ側の大きな作り直しなしで進めやすい構成です。

## 1. ディレクトリ構成案

```text
.
├── src
│   ├── app
│   │   ├── admin/data
│   │   ├── locations/[slug]
│   │   ├── search
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components
│   │   ├── admin
│   │   ├── layout
│   │   ├── location
│   │   └── search
│   └── lib
│       ├── constants.ts
│       ├── data.ts
│       ├── sample-data.ts
│       ├── supabase.ts
│       ├── types.ts
│       └── utils.ts
├── supabase
│   ├── migrations/0001_init.sql
│   └── seed.sql
├── .env.local.example
├── package.json
└── README.md
```

## 2. 採用技術の理由

- Next.js: App Router で検索ページ、店舗詳細、管理画面をシンプルに構成しやすく、Vercel との相性も良いです。
- TypeScript: 個人開発でも後から読み直しやすく、検索条件やテーブル構造のズレを減らせます。
- Supabase Postgres: Postgres を素直に使え、SQL ベースでスキーマ管理しやすく、将来的に認証や Storage を足しやすいです。
- `@supabase/supabase-js`: SDK が軽く、Vercel 固有機能に寄りすぎずデータアクセスを実装できます。
- シンプルな CSS: MVP 優先で、あとから Tailwind やデザインシステムに移行しやすいよう過剰な依存を避けています。

## 3. DB 設計

以下のテーブルを実装しています。

- `gym_brands`
- `gym_locations`
- `programs`
- `program_aliases`
- `class_schedules`
- `source_pages`
- `ingestion_runs`
- `ingestion_items`

設計方針:

- `class_schedules` を検索の中心に置き、`gym_locations` と `programs` に紐づけています。
- `program_aliases` を別テーブルに切り出し、将来の表記揺れ吸収に備えています。
- `source_pages` / `ingestion_runs` / `ingestion_items` を先に用意し、将来スクレイピング取込を追加しやすくしています。
- 検索で使いやすいよう、`class_schedules(weekday, start_time)` などに index を追加しています。
- MVP では閲覧中心のため RLS は public read を有効化しています。事業化前には再設計を推奨します。

## 4. 画面一覧

- `/`
  - 検索トップ画面
  - プログラム名、曜日、開始時刻帯、エリア/店舗名、チェーン名で検索
- `/search`
  - 検索結果一覧画面
  - 開始時刻順で表示
- `/locations/[slug]`
  - 店舗詳細画面
  - ブランド、店舗名、住所、公式 URL、クラス一覧、曜日別スケジュール、最終更新日を表示
- `/admin/data`
  - 管理用簡易データ確認画面
  - テーブル一覧を確認可能

## 5. 実装手順

1. Next.js + TypeScript の土台を作成
2. 共通型とユーティリティを作成
3. Supabase 接続層と、未設定時のローカルサンプルデータを作成
4. 検索トップ、結果一覧、店舗詳細、管理画面を実装
5. Supabase 用 SQL と seed を追加
6. README にローカル起動、Supabase、Vercel、詰まりどころ、今後の拡張を整理

## ローカル起動方法

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

ブラウザで `http://localhost:3000` を開いてください。

補足:

- `.env.local` に Supabase の値を入れなくても、ローカルサンプルデータで画面表示はできます。
- Supabase を設定すると、DB からデータを読むようになります。

## Supabase 側でやること

1. Supabase プロジェクトを作成
2. `Project Settings > API` から以下を取得
   - `Project URL`
   - `anon public key`
3. `.env.local` に設定

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

4. Supabase SQL Editor で以下をこの順で実行
   - `supabase/migrations/0001_init.sql`
   - `supabase/seed.sql`

5. テーブルと seed が入ったら、アプリを再起動

## Vercel 側でやること

1. GitHub などにこのプロジェクトを push
2. Vercel で新規プロジェクトとして import
3. Framework Preset は `Next.js` を選択
4. Environment Variables に以下を登録
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Deploy を実行

補足:

- 初期は Hobby で十分です。
- 将来広告掲載や簡易的な事業化を行う場合は、トラフィック、商用運用、チーム開発、監視要件に応じて Vercel の契約プラン見直しが必要です。
- このアプリは Vercel 固有の DB/Queue/Edge 機能へ強く依存していないため、Hobby から Pro への移行でもアプリ側の大きな変更は不要です。

## 環境変数一覧

| 変数名 | 必須 | 用途 |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | 任意 | Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 任意 | Supabase anon key |

MVP では未設定でもローカルサンプルデータで確認できます。

## Seed 投入手順

1. Supabase の SQL Editor を開く
2. `supabase/seed.sql` を実行する
3. `/search` と `/admin/data` を開いてデータ反映を確認する

## よくある詰まりどころ

- `.env.local` を更新しても画面に反映されない
  - Next.js を再起動してください。
- Supabase を設定したのにデータが表示されない
  - `0001_init.sql` と `seed.sql` の両方を実行したか確認してください。
- `anon key` を間違えた
  - `service_role` ではなく `anon public key` を使ってください。
- RLS で参照できない
  - この MVP は public read policy を付けています。途中で policy を変更した場合は再確認してください。
- Vercel でだけ失敗する
  - Environment Variables が Preview / Production の両方に入っているか確認してください。

## 今後の拡張候補一覧

- `program_aliases` を使った表記揺れ検索強化
- 都道府県、駅、ブランド slug ベースの絞り込み
- 地図表示の追加
- 休講、代行、期間限定イベント対応
- 取込バッチと parser の追加
- 更新差分ログと監視
- 認証付き管理画面
- 広告掲載枠や店舗露出制御

## 補足

- 本 MVP は「まず動くこと」を優先しています。
- 認証、予約、決済、通知、レビューは入れていません。
- 将来 Pro に切り替えるときも、アプリ本体は Next.js + Supabase + SQL の素直な構成のため、依存先の見直しを最小限にしやすいです。
