# GymMap MVP

スポーツジムのスタジオプログラムを、曜日・時間帯・プログラム名・エリアから横断検索するための個人開発向け Next.js + Supabase MVP です。

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
  - 環境変数の管理キー一致時のみ閲覧可能

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
ADMIN_ACCESS_KEY=your-admin-access-key
```

4. Supabase SQL Editor で以下をこの順で実行
   - `supabase/migrations/0001_init.sql`
   - `supabase/seed.sql`

5. テーブルと seed が入ったら、アプリを再起動

6. 管理画面を使う場合は `ADMIN_ACCESS_KEY` も設定
   - 例: `/admin/data?key=your-admin-access-key`

## Vercel 側でやること

1. GitHub などにこのプロジェクトを push
2. Vercel で新規プロジェクトとして import
3. Framework Preset は `Next.js` を選択
4. Environment Variables に以下を登録
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `ADMIN_ACCESS_KEY`
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
| `ADMIN_ACCESS_KEY` | 管理画面を使う場合は必須 | `/admin/data` の簡易保護用キー |

MVP では未設定でもローカルサンプルデータで確認できます。

## Seed 投入手順

1. Supabase の SQL Editor を開く
2. `supabase/seed.sql` を実行する
3. `/search` と `/admin/data` を開いてデータ反映を確認する
   - 管理画面は `/admin/data?key=ADMIN_ACCESS_KEY の値` で開いてください

## データを 1 件追加する方法

ローカルのダミーデータだけ増やしたい場合:

1. [src/lib/sample-data.ts](/Users/te/Documents/GymMap/src/lib/sample-data.ts) を開く
2. 店舗を増やすなら `sampleLocations` に 1 件追加する
   - `brand_id` は `sampleBrands` の id に合わせます
3. クラスを増やすなら `sampleSchedules` に 1 件追加する
   - `location_id` は `sampleLocations` の id
   - `program_id` は `samplePrograms` の id
4. `npm run dev` を開き直して `/search` やトップ画面で確認する

Supabase の seed も増やしたい場合:

1. [supabase/seed.sql](/Users/te/Documents/GymMap/supabase/seed.sql) の同じブロックに 1 行追加する
2. 店舗追加:
   - `gym_locations`
   - 必要に応じて `source_pages`
3. クラス追加:
   - `class_schedules`
4. 確認方法:
   - `/search` で一覧や絞り込みを確認
   - `/locations/[slug]` で店舗詳細を確認
   - `/admin/data?key=...` でテーブル内容を確認

## レッスン名の正規化

レッスン名の正規化は [src/lib/normalizeProgramName.ts](/Users/te/Documents/GymMap/src/lib/normalizeProgramName.ts) にまとめています。

方針:

- 巨大な別名辞書は持たない
- まず機械的に文字列正規化し、比較用キーを作る
- `start_time` / `end_time` があればそこから所要時間を計算する
- 小さな正規名マスタ [src/lib/program-master.ts](/Users/te/Documents/GymMap/src/lib/program-master.ts) に対して完全一致、次に類似一致を試す
- `category_primary` は `cardio / strength / mind_body / dance / cycling / aquatic / martial_arts / conditioning / other` の固定集合で管理する
- `program_brand` は `Les Mills / Radical Fitness / MOSSA / ZUMBA` などのブランド軸で持ち、カテゴリとは混同しない
- 閾値未満は `unresolved` として保留する

判定の考え方:

- `exact`: 正規キーでそのまま一致したもの
- `similar`: 類似一致で吸収したもの。既知ブランドの代表プログラムや、ヨガ / ピラティス系の安全な寄せは review なしで通す場合がある
- `unresolved`: 小さなマスタでも安全に寄せられないもの
- `needs_review=true` の代表例は、類似一致でも確信度が十分でないケース、ブランド不明の曖昧な名称、どの正規名にも安全に寄せられないケース

使いどころ:

- `class schedule` は表示前に正規化され、`canonical_program_name` や `duration_minutes` を持つ
- 自由語検索では `raw_program_name`、`canonical_program_name`、`searchAliases` だけを項目別に判定する
- `category_primary`、`tags`、`program_brand` は自由語検索対象に入れず、まずはレッスン名中心で絞り込む
- 英字 / 全角カナ / 半角カナの橋渡しは `searchAliases` で行い、`raw_program_name`、`canonical_program_name`、`searchAliases` の優先順で並べる
- 検索フォームでは所要時間フィルタを使える
- `unresolved` は無理に確定せず、レビュー候補として扱う

マスタを少しずつ育てる方法:

1. 新しい正規プログラムを追加したいときは `programMaster` に 1 エントリ追加する
2. `comparisonKeys` には完全一致させたい短いキーだけ入れる
3. `searchHints` には典型的な表記例を 2-4 個だけ足す
4. ブランドが分かる場合は `programBrand` も設定する
5. 曖昧なケースは無理に増やさず `unresolved` のままレビュー対象にする

テスト:

```bash
npm run test
```

## JEXER 東京圏 抽出実験

JEXER のスタジオスケジュール抽出は、まだ実験用途の手動実行スクリプトです。自動クロールや大量実行はまだ入れていません。

必要な環境変数:

```env
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL_ID=gemini-3.1-flash-lite-preview
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

- `GEMINI_MODEL_ID` は未設定でも `gemini-3.1-flash-lite-preview` を使います
- 将来 `gemini-2.5-flash` などへ切り替える場合は環境変数だけ変えればよい構成です

実行方法:

```bash
npm run extract:jexer -- --target=shinjuku
```

- experimental scripts は `scripts/experimental/load-env.ts` 経由で `.env.local` を読み込むので、通常は手動 `export` は不要です

または任意 URL を直接指定できます。

```bash
npm run extract:jexer -- --url=https://www.jexer.jp/mb/kameido/schedule/mon_10a.html --location-name="JEXER 亀戸"
```

- 人が最初に入れる URL は店舗トップ URL や支店 URL だけで構いません
- その先は同一支店配下の候補ページを集めて、Gemini が `entry / schedule_index / schedule_detail / instructor / ignore` を判定します
- `schedule_index` と判定したページでは、掲載されている詳細候補リンクを原則広く採用し、あとで正規化や抽出結果確認で整える方針です
- まだ実験用途のため、本格クローラではなく浅い候補収集と AI 判定に寄せた構成です
- JEXER では shared `https://www.jexer.jp/mb/schedule/?shop=...` URL は 500 になりやすいため、入口・候補・fallback には使わず、店舗固有の `mb/<store>/...` URL を優先します

利用できる target:

- 店舗単位 target: `shinjuku`, `oimachi`, `ueno`, `ikebukuro`, `kameido`, `yotsuya`, `akabane`, `otsuka`, `itabashi`, `shinkoiwa`
- 部分 target: `oi-saturday-a`, `kameido-monday-a`
- 都内一括 target: `tokyo-jexer`

都内一括 target の実行:

```bash
npm run extract:jexer -- --target=tokyo-jexer
```

- `tokyo-jexer` は都内 JEXER の店舗単位 target を順番に実行します
- 並列化や自動実行はまだ入れていないため、まずは手動でまとめて回す用途です
- 部分 target は日別 HTML の調査や再現確認向けで、通常は店舗単位 target を優先してください

最初に試す URL 例:

- `shinjuku`: `https://www.jexer.jp/mb/shinjuku/schedule/index.html`
- `oimachi`: `https://www.jexer.jp/mb/oi/schedule/index.html`
- `ueno`: `https://www.jexer.jp/mb/ueno/index.html`
- `ikebukuro`: `https://www.jexer.jp/mb/ikebukuro/index.html`
- `kameido`: `https://www.jexer.jp/mb/kameido/`
- `yotsuya`: `https://www.jexer.jp/mb/yotsuya/`
- `akabane`: `https://www.jexer.jp/mb/akabane/`
- `otsuka`: `https://www.jexer.jp/mb/otsuka/`
- `itabashi`: `https://www.jexer.jp/mb/itabashi/`
- `shinkoiwa`: `https://www.jexer.jp/mb/shinkoiwa/`
- `index.html` は入口ページだけで、実際のスタジオスケジュールは `fitness.html` やその先の日別 HTML にある場合があります。抽出スクリプトはまずリンク先をたどってから Gemini に渡します。
- JEXER では `fitness.html` や `aqua.html` も入口ページである場合があります。スタジオ抽出では `aqua` 系は除外し、`mon_10a.html` のような日別詳細 HTML を優先して本抽出対象に選びます。

出力:

- `output/jexer/*.json` に保存されます
- `extract:jexer` 実行後は `output/jexer/*.summary.json` も保存されます
- 抽出後に `normalizeProgramName` も通すため、`canonical_program_name` や `needs_review` も確認できます
- `output/jexer/*.json` の top-level には `usage_metadata` と `usage_breakdown` が入り、店舗単位の token 使用量を確認できます
- デバッグ用に `output/jexer/debug/` へ生 HTML、Gemini 入力、Gemini 生レスポンスも保存されます
- `output/jexer/debug/*.usage-metadata.json` を見ると、classification / extraction / total の token 使用量と、候補ページごとの usage を確認できます
- `candidate-pages.json` と `selection.json` を見ると、入口 URL からどの候補が集まり、どの URL が本抽出対象に選ばれたかを確認できます
- `candidate-*.classification.json` には `page_type`, `schedule_kind`, `contains_schedule_rows`, `recommended_next_links`, `confidence` が入り、AI の分類結果を追えます
- `failure.json` に `excluded_shared_schedule_urls` が出ている場合は、shared schedule URL を共通方針で除外した結果です
- 方針としては「AI で一覧ページを見つけ、一覧配下の detail 候補は広めに回収して、明らかな除外対象だけ弾く」寄りです
- Supabase に都内 JEXER 店舗をまとめて追加したい場合は `supabase/sql/insert_jexer_tokyo_locations.sql` を実行してください
- 神奈川・埼玉・千葉の JEXER 系店舗をまとめて追加したい場合は `supabase/migrations/0003_add_gym_locations_location_type.sql` を先に適用し、その後 `supabase/sql/insert_jexer_kanagawa_saitama_chiba_locations.sql` を実行してください
- 追加件数の目安は、神奈川県 7 店舗、埼玉県 4 店舗、千葉県 3 店舗です

0件だったときの確認手順:

- `output/jexer/debug/*.source.html` を見て、そもそもスケジュール表が取得できているか確認します
- `output/jexer/debug/*.html-keywords.json` を見て、`table` や `schedule` などのキーワードが HTML に含まれるか確認します
- `output/jexer/debug/*.gemini-input.txt` を見て、Gemini に渡した入力が想定どおりか確認します
- `output/jexer/debug/*.gemini-response.json` と `*.gemini-response-text.txt` を見て、Gemini が 0 件を返したのか、返却自体が崩れているのかを切り分けます
- `records: []` なら HTML 構造とプロンプトの噛み合いをまず疑い、レスポンス保存に失敗していれば API エラーやパース失敗を疑ってください
- コスト確認では `*.summary.json` の `total_prompt_tokens / total_output_tokens / total_tokens` と、`debug/*.usage-metadata.json` の page ごとの usage を見比べると、どの店舗・どの候補判定で token が増えているか追いやすいです

抽出結果サマリー:

```bash
npm run summary:jexer -- --file=output/jexer/shinjuku-2026-04-13T12-00-00-000Z.json
```

- 総 records 件数
- `needs_review=true` 件数
- `unresolved` 件数
- `program_brand` ごとの件数
- `category_primary` ごとの件数
- 頻出 `raw_program_name` 上位

JEXER 抽出 JSON の取り込み:

```bash
npm run import:jexer -- --file=output/jexer/shinjuku-2026-04-13T12-00-00-000Z.json
```

- `class_schedules` を対象に手動取り込みします
- `gym_locations` は `location_name` で対応付けます。見つからない店舗は warning を出して skip します
- `programs` は `canonical_program_name` を優先して対応付けし、未登録なら小さく作成します。`canonical_program_name` がない場合は `raw_program_name` を使います
- `class_schedules` には `raw_program_name`、`canonical_program_name`、`duration_minutes`、`program_brand`、`category_primary`、`tags`、`needs_review`、`confidence`、`source_page_url`、`weekday`、`start_time`、`end_time`、`instructor_name` を保存します
- 同じ `location_id + weekday + start_time + end_time + raw_program_name + source_page_url` の行があれば update、なければ insert します
- まず確認だけしたい場合は `--dry-run` を付けてください
- 神奈川・埼玉・千葉の JEXER 系店舗を先に `gym_locations` へ入れておくと、`location not found` を個別に潰す運用を減らせます

JEXER 系店舗の追加方針:

- `location_type` は `fitness_club / fitness_spa / light_gym / flat / sopra / bodymake_gym / fitness_studio` を想定しています
- 今の `class_schedules` 抽出対象として優先しやすいのは、`fitness_spa` と `sopra`、必要に応じて `fitness_studio / bodymake_gym` です
- 後回しでよいのは、通常クラス時刻表を持たないことが多い `light_gym` と `flat` です
- 今回の一括追加 SQL で入る店舗は次のとおりです
- 神奈川県: `JEXER 川崎`, `JEXER 横浜`, `JEXER 新川崎`, `JEXER 東神奈川`, `JEXER Light Gym アーバン保土ヶ谷店`, `JEXER BODY MAKE GYM モザイクモール港北店`, `JEXER Pilates Studio NEWoMan横浜店`
- 埼玉県: `JEXER 大宮`, `JEXER 浦和`, `JEXER 戸田公園`, `JEXER Light Gym 大宮店`
- 千葉県: `JEXER Light Gym シャポー市川店`, `JEXER Gym Flat イオンモール柏店`, `JEXER sopra シャポー船橋店`

DB投入前の目安:

- `unresolved` が多すぎないかを先に確認します。0 が理想ですが、まずは少数件まで下がっているかを見ます
- `needs_review` は一括レビューできる件数に収まっているかを見ます。安全な `similar` は review なしに倒し、曖昧なものだけ残す方針です
- `program_brand=null` の比率もざっくり確認します。ブランド系プログラムが多い店舗なのにほぼ `null` なら、master 追加前に投入しない方が安全です

## よくある詰まりどころ

- `.env.local` を更新しても画面に反映されない
  - Next.js を再起動してください。
- `/admin/data` が開けない
  - `ADMIN_ACCESS_KEY` を設定したうえで、`/admin/data?key=設定した値` でアクセスしてください。
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
