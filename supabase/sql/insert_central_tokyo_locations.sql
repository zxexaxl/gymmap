-- Central Sports 東京都内クラブの一括追加 SQL です。
-- 対象:
-- - 2026-04-19 の Central discovery 結果で `selected_studio_schedule_url` が見つかった都内クラブ
-- 前提:
-- - `gym_brands.slug = 'central-sports'` のブランドが存在すること
-- 方針:
-- - city は今回は null
-- - location_type は暫定で全件 `fitness_club`
-- - 既存 slug と重複する店舗は insert しない

with central_brand as (
  select id
  from gym_brands
  where slug = 'central-sports'
  limit 1
)
insert into gym_locations (
  brand_id,
  name,
  slug,
  prefecture,
  city,
  official_url,
  source_url,
  location_type,
  is_active
)
select
  central_brand.id,
  data.name,
  data.slug,
  data.prefecture,
  data.city,
  data.official_url,
  data.source_url,
  data.location_type,
  true
from central_brand
cross join (
  values
    ('スタジオ ヨガピス 大森', 'central-yogapis-omori', '東京都', null, 'https://www.central.co.jp/club/yogapis_omori/', 'https://www.central.co.jp/club/yogapis_omori/', 'fitness_club'),
    ('セントラルウェルネスクラブ 成城', 'central-seijo', '東京都', null, 'https://www.central.co.jp/club/seijo/', 'https://www.central.co.jp/club/seijo/', 'fitness_club'),
    ('セントラルウェルネスクラブ24 ときわ台', 'central-tokiwadai', '東京都', null, 'https://www.central.co.jp/club/tokiwadai/', 'https://www.central.co.jp/club/tokiwadai/', 'fitness_club'),
    ('セントラルウェルネスクラブ24 葛西', 'central-cw-kasai', '東京都', null, 'https://www.central.co.jp/club/cw-kasai/', 'https://www.central.co.jp/club/cw-kasai/', 'fitness_club'),
    ('セントラルウェルネスクラブ24 京成小岩', 'central-cw-keiseikoiwa', '東京都', null, 'https://www.central.co.jp/club/cw-keiseikoiwa/', 'https://www.central.co.jp/club/cw-keiseikoiwa/', 'fitness_club'),
    ('セントラルウェルネスクラブ24 上池袋', 'central-w-kamiikebukuro', '東京都', null, 'https://www.central.co.jp/club/w_kamiikebukuro/', 'https://www.central.co.jp/club/w_kamiikebukuro/', 'fitness_club'),
    ('セントラルウェルネスクラブ24 清瀬', 'central-kiyose', '東京都', null, 'https://www.central.co.jp/club/kiyose/', 'https://www.central.co.jp/club/kiyose/', 'fitness_club'),
    ('セントラルウェルネスクラブ24 西新井', 'central-w-nishiarai', '東京都', null, 'https://www.central.co.jp/club/w_nishiarai/', 'https://www.central.co.jp/club/w_nishiarai/', 'fitness_club'),
    ('セントラルウェルネスクラブ24 大森', 'central-omori', '東京都', null, 'https://www.central.co.jp/club/omori/', 'https://www.central.co.jp/club/omori/', 'fitness_club'),
    ('セントラルウェルネスクラブ24 東十条', 'central-higashijujo', '東京都', null, 'https://www.central.co.jp/club/higashijujo/', 'https://www.central.co.jp/club/higashijujo/', 'fitness_club'),
    ('セントラルウェルネスクラブ24 南千住', 'central-minamisenjyu', '東京都', null, 'https://www.central.co.jp/club/minamisenjyu/', 'https://www.central.co.jp/club/minamisenjyu/', 'fitness_club'),
    ('セントラルウェルネスクラブ24 保谷', 'central-minamioizumi', '東京都', null, 'https://www.central.co.jp/club/minamioizumi/', 'https://www.central.co.jp/club/minamioizumi/', 'fitness_club'),
    ('セントラルスポーツ ジム24 亀有', 'central-gc24-kameari', '東京都', null, 'https://www.central.co.jp/club/gc24-kameari/', 'https://www.central.co.jp/club/gc24-kameari/', 'fitness_club'),
    ('セントラルスポーツ ジムスタ 飯田橋サクラテラス', 'central-cf-iidabashi', '東京都', null, 'https://www.central.co.jp/club/cf-iidabashi/', 'https://www.central.co.jp/club/cf-iidabashi/', 'fitness_club'),
    ('セントラルスポーツジム24金町', 'central-csg24-kanamachi', '東京都', null, 'https://www.central.co.jp/club/csg24-kanamachi/', 'https://www.central.co.jp/club/csg24-kanamachi/', 'fitness_club'),
    ('セントラルフィットネスクラブ 亀有', 'central-kameari', '東京都', null, 'https://www.central.co.jp/club/kameari/', 'https://www.central.co.jp/club/kameari/', 'fitness_club'),
    ('セントラルフィットネスクラブ 西台', 'central-nishidai', '東京都', null, 'https://www.central.co.jp/club/nishidai/', 'https://www.central.co.jp/club/nishidai/', 'fitness_club'),
    ('セントラルフィットネスクラブ 青砥', 'central-aoto', '東京都', null, 'https://www.central.co.jp/club/aoto/', 'https://www.central.co.jp/club/aoto/', 'fitness_club'),
    ('セントラルフィットネスクラブ 竹の塚', 'central-takenotsuka', '東京都', null, 'https://www.central.co.jp/club/takenotsuka/', 'https://www.central.co.jp/club/takenotsuka/', 'fitness_club'),
    ('セントラルフィットネスクラブ 天王洲', 'central-tennozu', '東京都', null, 'https://www.central.co.jp/club/tennozu/', 'https://www.central.co.jp/club/tennozu/', 'fitness_club'),
    ('セントラルフィットネスクラブ 八王子', 'central-hachioji', '東京都', null, 'https://www.central.co.jp/club/hachioji/', 'https://www.central.co.jp/club/hachioji/', 'fitness_club'),
    ('セントラルフィットネスクラブ 府中', 'central-fuchu', '東京都', null, 'https://www.central.co.jp/club/fuchu/', 'https://www.central.co.jp/club/fuchu/', 'fitness_club'),
    ('セントラルフィットネスクラブ24 下北沢', 'central-shimokitazawa', '東京都', null, 'https://www.central.co.jp/club/shimokitazawa/', 'https://www.central.co.jp/club/shimokitazawa/', 'fitness_club'),
    ('セントラルフィットネスクラブ24 福生', 'central-fussa', '東京都', null, 'https://www.central.co.jp/club/fussa/', 'https://www.central.co.jp/club/fussa/', 'fitness_club'),
    ('セントラルフィットネスクラブ24 用賀', 'central-yoga', '東京都', null, 'https://www.central.co.jp/club/yoga/', 'https://www.central.co.jp/club/yoga/', 'fitness_club'),
    ('セントラルフィットネスクラブ24月島・佃', 'central-tsukuda', '東京都', null, 'https://www.central.co.jp/club/tsukuda/', 'https://www.central.co.jp/club/tsukuda/', 'fitness_club'),
    ('セントラルフィットネスクラブ24国立', 'central-kunitachi', '東京都', null, 'https://www.central.co.jp/club/kunitachi/', 'https://www.central.co.jp/club/kunitachi/', 'fitness_club'),
    ('セントラルフィットネスクラブ24青梅', 'central-ome', '東京都', null, 'https://www.central.co.jp/club/ome/', 'https://www.central.co.jp/club/ome/', 'fitness_club'),
    ('トーアセントラルフィットネスクラブ 阿佐谷', 'central-toa-asagaya', '東京都', null, 'https://www.central.co.jp/club/toa-asagaya/', 'https://www.central.co.jp/club/toa-asagaya/', 'fitness_club'),
    ('ゆうぽうと世田谷レクセンター', 'central-setagaya-rec', '東京都', null, 'https://www.central.co.jp/club/setagaya-rec/', 'https://www.central.co.jp/club/setagaya-rec/', 'fitness_club'),
    ('ラヴィセントラルフィットネスクラブ 蒲田', 'central-lavie-kamata', '東京都', null, 'https://www.central.co.jp/club/lavie-kamata/', 'https://www.central.co.jp/club/lavie-kamata/', 'fitness_club')
) as data(name, slug, prefecture, city, official_url, source_url, location_type)
where not exists (
  select 1
  from gym_locations existing
  where existing.slug = data.slug
);
