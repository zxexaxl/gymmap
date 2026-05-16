with nas_brand as (
  select id
  from gym_brands
  where slug = 'sports-club-nas'
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
  nas_brand.id,
  data.name,
  data.slug,
  data.prefecture,
  data.city,
  data.official_url,
  data.source_url,
  data.location_type
from nas_brand
cross join (
  values
    ('NASおゆみ野', 'sports-club-nas-oyumino-index', '千葉県', '千葉市', 'https://www.nas-club.co.jp/oyumino/index.html', 'https://www.nas-club.co.jp/oyumino/index.html', 'fitness_club'),
    ('NAS松戸', 'sports-club-nas-matsudo-index', '千葉県', '松戸市', 'https://www.nas-club.co.jp/matsudo/index.html', 'https://www.nas-club.co.jp/matsudo/index.html', 'fitness_club'),
    ('NAS新鎌ヶ谷', 'sports-club-nas-shinkamagaya-index', '千葉県', '鎌ケ谷市', 'https://www.nas-club.co.jp/shinkamagaya/index.html', 'https://www.nas-club.co.jp/shinkamagaya/index.html', 'fitness_club'),
    ('ホットヨガスタジオ美温 新鎌ヶ谷', 'sports-club-nas-store-shinkamagaya-index', '千葉県', '鎌ケ谷市', 'http://www.bion-yoga.jp/store/shinkamagaya/index.html', 'http://www.bion-yoga.jp/store/shinkamagaya/index.html', 'fitness_club'),
    ('ホットヨガスタジオ BODY UP東大宮', 'sports-club-nas-bodyup-higashiomiya', '埼玉県', 'さいたま市', 'https://www.nas-club.co.jp/bodyup/higashiomiya/', 'https://www.nas-club.co.jp/bodyup/higashiomiya/', 'fitness_club'),
    ('ホットヨガスタジオ美温 武蔵浦和', 'sports-club-nas-store-musashiurawa-index', '埼玉県', 'さいたま市', 'http://www.bion-yoga.jp/store/musashiurawa/index.html', 'http://www.bion-yoga.jp/store/musashiurawa/index.html', 'fitness_club'),
    ('NAS蕨', 'sports-club-nas-warabi-index', '埼玉県', '蕨市', 'https://www.nas-club.co.jp/warabi/index.html', 'https://www.nas-club.co.jp/warabi/index.html', 'fitness_club'),
    ('ホットヨガスタジオPURUMO蕨', 'sports-club-nas-store-warabi', '埼玉県', '蕨市', 'http://purumo.jp/store/warabi/', 'http://purumo.jp/store/warabi/', 'fitness_club'),
    ('テニスクラブNASこしがや', 'sports-club-nas-tennis_koshigaya-index', '埼玉県', '越谷市', 'https://www.nas-club.co.jp/tennis_koshigaya/index.html', 'https://www.nas-club.co.jp/tennis_koshigaya/index.html', 'fitness_club'),
    ('ホットヨガスタジオ美温 三鷹', 'sports-club-nas-store-mitaka-index', '東京都', '三鷹市', 'http://www.bion-yoga.jp/store/mitaka/index.html', 'http://www.bion-yoga.jp/store/mitaka/index.html', 'fitness_club'),
    ('ホットヨガスタジオ美温 芦花公園', 'sports-club-nas-store-rokakouen-index', '東京都', '世田谷区', 'http://www.bion-yoga.jp/store/rokakouen/index.html', 'http://www.bion-yoga.jp/store/rokakouen/index.html', 'fitness_club'),
    ('NAS PILATES ON THE GO リバーシティ21', 'sports-club-nas-np-onthego-rivercity21', '東京都', '中央区', 'https://www.nas-club.co.jp/np-onthego/rivercity21/', 'https://www.nas-club.co.jp/np-onthego/rivercity21/', 'fitness_club'),
    ('Premium Sports Club NAS 銀座（プレミアム店舗）', 'sports-club-nas-ginza-index', '東京都', '中央区', 'https://www.nas-club.co.jp/ginza/index.html', 'https://www.nas-club.co.jp/ginza/index.html', 'fitness_club'),
    ('フィットネス&スパNAS リバーシティ21', 'sports-club-nas-rivercity21-index', '東京都', '中央区', 'https://www.nas-club.co.jp/rivercity21/index.html', 'https://www.nas-club.co.jp/rivercity21/index.html', 'fitness_club'),
    ('NAS高尾', 'sports-club-nas-takao-index', '東京都', '八王子市', 'https://www.nas-club.co.jp/takao/index.html', 'https://www.nas-club.co.jp/takao/index.html', 'fitness_club'),
    ('ホットヨガスタジオ美温 高尾', 'sports-club-nas-store-takao-index', '東京都', '八王子市', 'http://www.bion-yoga.jp/store/takao/index.html', 'http://www.bion-yoga.jp/store/takao/index.html', 'fitness_club'),
    ('NAS PILATES 新御徒町', 'sports-club-nas-nas-pilates', '東京都', '台東区', 'https://www.nas-club.co.jp/nas-pilates/', 'https://www.nas-club.co.jp/nas-pilates/', 'fitness_club'),
    ('NAS PILATES ON THE GO 大崎', 'sports-club-nas-np-onthego-osaki', '東京都', '品川区', 'https://www.nas-club.co.jp/np-onthego/osaki/', 'https://www.nas-club.co.jp/np-onthego/osaki/', 'fitness_club'),
    ('ホットヨガスタジオ美温 大崎', 'sports-club-nas-store-osaki-index', '東京都', '品川区', 'http://www.bion-yoga.jp/store/osaki/index.html', 'http://www.bion-yoga.jp/store/osaki/index.html', 'fitness_club'),
    ('NAS永山', 'sports-club-nas-nagayama-index', '東京都', '多摩市', 'https://www.nas-club.co.jp/nagayama/index.html', 'https://www.nas-club.co.jp/nagayama/index.html', 'fitness_club'),
    ('ホットヨガスタジオ美温 東京オペラシティ', 'sports-club-nas-store-operacity-index', '東京都', '新宿区', 'http://www.bion-yoga.jp/store/operacity/index.html', 'http://www.bion-yoga.jp/store/operacity/index.html', 'fitness_club'),
    ('NAS吉祥寺', 'sports-club-nas-kichijoji-index', '東京都', '武蔵野市', 'https://www.nas-club.co.jp/kichijoji/index.html', 'https://www.nas-club.co.jp/kichijoji/index.html', 'fitness_club'),
    ('NAS PILATES ON THE GO 篠崎店', 'sports-club-nas-np-onthego-shinozaki', '東京都', '江戸川区', 'https://www.nas-club.co.jp/np-onthego/shinozaki/', 'https://www.nas-club.co.jp/np-onthego/shinozaki/', 'fitness_club'),
    ('NAS PILATES ON THE GO 西葛西店', 'sports-club-nas-np-onthego-nishikasai', '東京都', '江戸川区', 'https://www.nas-club.co.jp/np-onthego/nishikasai/', 'https://www.nas-club.co.jp/np-onthego/nishikasai/', 'fitness_club'),
    ('ホットヨガスタジオ BODY UP西葛西', 'sports-club-nas-bodyup-nishikasai', '東京都', '江戸川区', 'https://www.nas-club.co.jp/bodyup/nishikasai/', 'https://www.nas-club.co.jp/bodyup/nishikasai/', 'fitness_club'),
    ('ホットヨガスタジオPURUMO 篠崎', 'sports-club-nas-store-shinozaki', '東京都', '江戸川区', 'http://purumo.jp/store/shinozaki/', 'http://purumo.jp/store/shinozaki/', 'fitness_club'),
    ('NAS Wellness&Spa CLUB芝浦アイランド （プレミアム店舗）', 'sports-club-nas-shibaura-index', '東京都', '港区', 'https://www.nas-club.co.jp/shibaura/index.html', 'https://www.nas-club.co.jp/shibaura/index.html', 'fitness_club'),
    ('NAS若葉台', 'sports-club-nas-wakabadai-index', '東京都', '稲城市', 'https://www.nas-club.co.jp/wakabadai/index.html', 'https://www.nas-club.co.jp/wakabadai/index.html', 'fitness_club'),
    ('インドアテニススクール NAS光が丘', 'sports-club-nas-tennis_hikarigaoka-index', '東京都', '練馬区', 'https://www.nas-club.co.jp/tennis_hikarigaoka/index.html', 'https://www.nas-club.co.jp/tennis_hikarigaoka/index.html', 'fitness_club'),
    ('NAS町屋', 'sports-club-nas-machiya-index', '東京都', '荒川区', 'https://www.nas-club.co.jp/machiya/index.html', 'https://www.nas-club.co.jp/machiya/index.html', 'fitness_club'),
    ('NAS西日暮里', 'sports-club-nas-nishinippori-index', '東京都', '荒川区', 'https://www.nas-club.co.jp/nishinippori/index.html', 'https://www.nas-club.co.jp/nishinippori/index.html', 'fitness_club'),
    ('NAS南林間', 'sports-club-nas-minamirinkan-index', '神奈川県', '大和市', 'https://www.nas-club.co.jp/minamirinkan/index.html', 'https://www.nas-club.co.jp/minamirinkan/index.html', 'fitness_club'),
    ('NAS PILATES ON THE GO 新川崎店', 'sports-club-nas-np-onthego-shinkawasaki', '神奈川県', '川崎市', 'https://www.nas-club.co.jp/np-onthego/shinkawasaki/', 'https://www.nas-club.co.jp/np-onthego/shinkawasaki/', 'fitness_club'),
    ('NAS新川崎', 'sports-club-nas-shinkawasaki-index', '神奈川県', '川崎市', 'https://www.nas-club.co.jp/shinkawasaki/index.html', 'https://www.nas-club.co.jp/shinkawasaki/index.html', 'fitness_club'),
    ('NAS溝の口', 'sports-club-nas-mizonokuchi-index', '神奈川県', '川崎市', 'https://www.nas-club.co.jp/mizonokuchi/index.html', 'https://www.nas-club.co.jp/mizonokuchi/index.html', 'fitness_club'),
    ('ホットヨガスタジオ美温 溝の口', 'sports-club-nas-store-mizonokuchi-index', '神奈川県', '川崎市', 'http://www.bion-yoga.jp/store/mizonokuchi/index.html', 'http://www.bion-yoga.jp/store/mizonokuchi/index.html', 'fitness_club'),
    ('NAS平塚', 'sports-club-nas-hiratsuka-index', '神奈川県', '平塚市', 'https://www.nas-club.co.jp/hiratsuka/index.html', 'https://www.nas-club.co.jp/hiratsuka/index.html', 'fitness_club'),
    ('NAS中山', 'sports-club-nas-nakayama-index', '神奈川県', '横浜市', 'https://www.nas-club.co.jp/nakayama/index.html', 'https://www.nas-club.co.jp/nakayama/index.html', 'fitness_club'),
    ('NAS戸塚', 'sports-club-nas-totsuka-index', '神奈川県', '横浜市', 'https://www.nas-club.co.jp/totsuka/index.html', 'https://www.nas-club.co.jp/totsuka/index.html', 'fitness_club'),
    ('NAS瀬谷', 'sports-club-nas-seya-index', '神奈川県', '横浜市', 'https://www.nas-club.co.jp/seya/index.html', 'https://www.nas-club.co.jp/seya/index.html', 'fitness_club'),
    ('NAS湘南台', 'sports-club-nas-shonandai-index', '神奈川県', '藤沢市', 'https://www.nas-club.co.jp/shonandai/index.html', 'https://www.nas-club.co.jp/shonandai/index.html', 'fitness_club'),
    ('NAS藤沢', 'sports-club-nas-fujisawa-index', '神奈川県', '藤沢市', 'https://www.nas-club.co.jp/fujisawa/index.html', 'https://www.nas-club.co.jp/fujisawa/index.html', 'fitness_club'),
    ('ホットヨガスタジオ美温 藤沢', 'sports-club-nas-store-fujisawa-index', '神奈川県', '藤沢市', 'http://www.bion-yoga.jp/store/fujisawa/index.html', 'http://www.bion-yoga.jp/store/fujisawa/index.html', 'fitness_club')
) as data(name, slug, prefecture, city, official_url, source_url, location_type)
where not exists (
  select 1
  from gym_locations existing
  where existing.slug = data.slug
);
