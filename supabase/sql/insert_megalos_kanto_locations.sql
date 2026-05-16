with megalos_brand as (
  select id
  from gym_brands
  where slug = 'megalos'
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
  location_type
)
select
  megalos_brand.id,
  data.name,
  data.slug,
  data.prefecture,
  data.city,
  data.official_url,
  data.source_url,
  data.location_type
from megalos_brand
cross join (
  values
    ('メガロス 八王子', 'megalos-hachiouji', '東京都', '八王子市', 'https://megalos.co.jp/hachiouji/', 'https://megalos.co.jp/hachiouji/', 'fitness_club'),
    ('メガロス 田端', 'megalos-tabata', '東京都', '北区', 'https://megalos.co.jp/tabata/', 'https://megalos.co.jp/tabata/', 'fitness_club'),
    ('メガロス 日比谷シャンテ', 'megalos-hibiya', '東京都', '千代田区', 'https://megalos.co.jp/hibiya/', 'https://megalos.co.jp/hibiya/', 'fitness_club'),
    ('メガロス 中延', 'megalos-nakanobu', '東京都', '品川区', 'https://megalos.co.jp/nakanobu/', 'https://megalos.co.jp/nakanobu/', 'fitness_club'),
    ('メガロス キッズ錦糸町', 'megalos-kinshicho', '東京都', '墨田区', 'https://megalos.co.jp/kinshicho/', 'https://megalos.co.jp/kinshicho/', 'fitness_club'),
    ('メガロス 小平テニススクール', 'megalos-kodaira', '東京都', '小平市', 'https://megalos.co.jp/kodaira/', 'https://megalos.co.jp/kodaira/', 'fitness_club'),
    ('メガロス ルフレ武蔵小金井ー女性専用スタジオー', 'megalos-musashi-reflet', '東京都', '小金井市', 'https://megalos.co.jp/musashi_reflet/', 'https://megalos.co.jp/musashi_reflet/', 'fitness_club'),
    ('メガロス 武蔵小金井', 'megalos-musashi', '東京都', '小金井市', 'https://megalos.co.jp/musashi/', 'https://megalos.co.jp/musashi/', 'fitness_club'),
    ('メガロス東小金井学童クラブ', 'megalos-megalos-wp-higashikoganei', '東京都', '小金井市', 'https://megalos.co.jp/megalos_wp/higashikoganei/', 'https://megalos.co.jp/megalos_wp/higashikoganei/', 'fitness_club'),
    ('メガロス西新宿キッズアフタースクール', 'megalos-nishishinjuku', '東京都', '新宿区', 'https://megalos.co.jp/nishishinjuku/', 'https://megalos.co.jp/nishishinjuku/', 'fitness_club'),
    ('メガロス 三鷹', 'megalos-mitaka', '東京都', '武蔵野市', 'https://megalos.co.jp/mitaka/', 'https://megalos.co.jp/mitaka/', 'fitness_club'),
    ('メガロス 吉祥寺', 'megalos-kichijoji', '東京都', '武蔵野市', 'https://megalos.co.jp/kichijoji/', 'https://megalos.co.jp/kichijoji/', 'fitness_club'),
    ('メガロス 小岩', 'megalos-koiwa', '東京都', '江戸川区', 'https://megalos.co.jp/koiwa/', 'https://megalos.co.jp/koiwa/', 'fitness_club'),
    ('メガロス南砂町SUNAMO', 'megalos-minamisunamachi', '東京都', '江東区', 'https://megalos.co.jp/minamisunamachi/', 'https://megalos.co.jp/minamisunamachi/', 'fitness_club'),
    ('メガロス ゼロプラス 恵比寿ーパーソナルジムー', 'megalos-ebisu', '東京都', '渋谷区', 'https://megalos.co.jp/ebisu/', 'https://megalos.co.jp/ebisu/', 'fitness_club'),
    ('メガロス ルフレ 恵比寿ー女性専用ジム＆スタジオー', 'megalos-ebisu-reflet', '東京都', '渋谷区', 'https://megalos.co.jp/ebisu_reflet/', 'https://megalos.co.jp/ebisu_reflet/', 'fitness_club'),
    ('メガロス ルフレ 麻布十番ー女性専用ジム＆スタジオー', 'megalos-azabujuban-reflet', '東京都', '港区', 'https://megalos.co.jp/azabujuban_reflet/', 'https://megalos.co.jp/azabujuban_reflet/', 'fitness_club'),
    ('メガロス 白金台', 'megalos-shirokanedai', '東京都', '港区', 'https://megalos.co.jp/shirokanedai/', 'https://megalos.co.jp/shirokanedai/', 'fitness_club'),
    ('メガロス 玉川学園テニススクール', 'megalos-tamagawa', '東京都', '町田市', 'https://megalos.co.jp/tamagawa/', 'https://megalos.co.jp/tamagawa/', 'fitness_club'),
    ('メガロス 町田', 'megalos-machida', '東京都', '町田市', 'https://megalos.co.jp/machida/', 'https://megalos.co.jp/machida/', 'fitness_club'),
    ('メガロス ルフレ立川南ー女性専用スタジオー', 'megalos-tachikawa-reflet', '東京都', '立川市', 'https://megalos.co.jp/tachikawa_reflet/', 'https://megalos.co.jp/tachikawa_reflet/', 'fitness_club'),
    ('メガロス 立川北館', 'megalos-tachikawa-kita', '東京都', '立川市', 'https://megalos.co.jp/tachikawa_kita/', 'https://megalos.co.jp/tachikawa_kita/', 'fitness_club'),
    ('メガロス 立川南館', 'megalos-tachikawa-kita-2', '東京都', '立川市', 'https://megalos.co.jp/tachikawa_kita/', 'https://megalos.co.jp/tachikawa_kita/', 'fitness_club'),
    ('メガロス 葛飾', 'megalos-katsushika', '東京都', '葛飾区', 'https://megalos.co.jp/katsushika/', 'https://megalos.co.jp/katsushika/', 'fitness_club'),
    ('メガロス 調布', 'megalos-chofu', '東京都', '調布市', 'https://megalos.co.jp/chofu/', 'https://megalos.co.jp/chofu/', 'fitness_club'),
    ('メガロス 大和', 'megalos-yamato', '神奈川県', '大和市', 'https://megalos.co.jp/yamato/', 'https://megalos.co.jp/yamato/', 'fitness_club'),
    ('メガロス 鷺沼', 'megalos-saginuma', '神奈川県', '川崎市', 'https://megalos.co.jp/saginuma/', 'https://megalos.co.jp/saginuma/', 'fitness_club'),
    ('メガロス ルフレ みなとみらいー女性専用スタジオー', 'megalos-minatomirai-reflet', '神奈川県', '横浜市', 'https://megalos.co.jp/minatomirai_reflet/', 'https://megalos.co.jp/minatomirai_reflet/', 'fitness_club'),
    ('メガロス 上永谷', 'megalos-kaminagaya', '神奈川県', '横浜市', 'https://megalos.co.jp/kaminagaya/', 'https://megalos.co.jp/kaminagaya/', 'fitness_club'),
    ('メガロス 市ヶ尾', 'megalos-ichigao', '神奈川県', '横浜市', 'https://megalos.co.jp/ichigao/', 'https://megalos.co.jp/ichigao/', 'fitness_club'),
    ('メガロス 日吉', 'megalos-hiyoshi', '神奈川県', '横浜市', 'https://megalos.co.jp/hiyoshi/', 'https://megalos.co.jp/hiyoshi/', 'fitness_club'),
    ('メガロス 横浜天王町', 'megalos-yokohama', '神奈川県', '横浜市', 'https://megalos.co.jp/yokohama/', 'https://megalos.co.jp/yokohama/', 'fitness_club'),
    ('メガロス 神奈川', 'megalos-kanagawa', '神奈川県', '横浜市', 'https://megalos.co.jp/kanagawa/', 'https://megalos.co.jp/kanagawa/', 'fitness_club'),
    ('メガロス 綱島', 'megalos-tsunashima', '神奈川県', '横浜市', 'https://megalos.co.jp/tsunashima/', 'https://megalos.co.jp/tsunashima/', 'fitness_club'),
    ('メガロス 相模大野', 'megalos-sagamiono', '神奈川県', '相模原市', 'https://megalos.co.jp/sagamiono/', 'https://megalos.co.jp/sagamiono/', 'fitness_club'),
    ('メガロス 本八幡', 'megalos-motoyawata', '千葉県', '市川市', 'https://megalos.co.jp/motoyawata/', 'https://megalos.co.jp/motoyawata/', 'fitness_club'),
    ('メガロス 柏', 'megalos-kashiwa', '千葉県', '柏市', 'https://megalos.co.jp/kashiwa/', 'https://megalos.co.jp/kashiwa/', 'fitness_club'),
    ('メガロス 草加', 'megalos-souka', '埼玉県', '草加市', 'https://megalos.co.jp/souka/', 'https://megalos.co.jp/souka/', 'fitness_club')
) as data(name, slug, prefecture, city, official_url, source_url, location_type)
where not exists (
  select 1
  from gym_locations existing
  where existing.slug = data.slug
);
