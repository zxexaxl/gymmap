-- Konami Sports 東京・埼玉・千葉・神奈川の施設一括追加 SQL です。
-- 取得元: 検索結果ページの実データ API
-- - result page: https://www.konami.com/sportsclub/shisetsu/result.html?pref=%E5%9F%BC%E7%8E%89%E7%9C%8C$$%E5%8D%83%E8%91%89%E7%9C%8C$$%E6%9D%B1%E4%BA%AC%E9%83%BD$$%E7%A5%9E%E5%A5%88%E5%B7%9D%E7%9C%8C
-- - api: https://www.konami.com/sportsclub/api/facilities.php?pref[]=埼玉県&pref[]=千葉県&pref[]=東京都&pref[]=神奈川県
-- 前提:
-- - `gym_brands.slug = 'konami-sports'` のブランドが存在すること
-- 方針:
-- - location_type は全件 `fitness_club`
-- - slug 重複時は insert しない

with konami_brand as (
  select id
  from gym_brands
  where slug = 'konami-sports'
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
  konami_brand.id,
  data.name,
  data.slug,
  data.prefecture,
  data.city,
  data.official_url,
  data.source_url,
  data.location_type,
  true
from konami_brand
cross join (
  values
    ('グランサイズ 恵比寿ガーデン', 'konami-sports-004103', '東京都', '目黒区三田1丁目', 'https://information.konamisportsclub.jp/004103.html', 'https://information.konamisportsclub.jp/004103.html', 'fitness_club'),
    ('コナミスポーツ ジュニアスクール 中野', 'konami-sports-007701', '東京都', '中野区', 'https://information.konamisportsclub.jp/ksc/007701/', 'https://information.konamisportsclub.jp/ksc/007701/', 'fitness_club'),
    ('コナミスポーツ ジュニアスクール 西葛西', 'konami-sports-004046', '東京都', '江戸川区西葛西', 'https://information.konamisportsclub.jp/ksc/004046/', 'https://information.konamisportsclub.jp/ksc/004046/', 'fitness_club'),
    ('コナミスポーツ テニススクール 西葛西', 'konami-sports-004062', '東京都', '江戸川区西葛西', 'https://information.konamisportsclub.jp/ksc/004062/', 'https://information.konamisportsclub.jp/ksc/004062/', 'fitness_club'),
    ('コナミスポーツクラブ 一橋学園', 'konami-sports-004054', '東京都', '小平市上水本町', 'https://information.konamisportsclub.jp/ksc/004054/', 'https://information.konamisportsclub.jp/ksc/004054/', 'fitness_club'),
    ('コナミスポーツクラブ 二子玉川', 'konami-sports-004461', '東京都', '世田谷区玉川', 'https://information.konamisportsclub.jp/ksc/004461/', 'https://information.konamisportsclub.jp/ksc/004461/', 'fitness_club'),
    ('コナミスポーツクラブ 五反田', 'konami-sports-003930', '東京都', '品川区東五反田', 'https://information.konamisportsclub.jp/ksc/003930/', 'https://information.konamisportsclub.jp/ksc/003930/', 'fitness_club'),
    ('コナミスポーツクラブ 大森町', 'konami-sports-007877', '東京都', '大田区大森西', 'https://information.konamisportsclub.jp/ksc/007877/', 'https://information.konamisportsclub.jp/ksc/007877/', 'fitness_club'),
    ('コナミスポーツクラブ 府中', 'konami-sports-004469', '東京都', '府中市宮西町', 'https://information.konamisportsclub.jp/ksc/004469/', 'https://information.konamisportsclub.jp/ksc/004469/', 'fitness_club'),
    ('コナミスポーツクラブ 恵比寿', 'konami-sports-006023', '東京都', '渋谷区広尾', 'https://information.konamisportsclub.jp/ksc/006023/', 'https://information.konamisportsclub.jp/ksc/006023/', 'fitness_club'),
    ('コナミスポーツクラブ 成増', 'konami-sports-007833', '東京都', '板橋区成増', 'https://information.konamisportsclub.jp/ksc/007833/', 'https://information.konamisportsclub.jp/ksc/007833/', 'fitness_club'),
    ('コナミスポーツクラブ 本店', 'konami-sports-004501', '東京都', '品川区東品川', 'https://information.konamisportsclub.jp/ksc/004501/', 'https://information.konamisportsclub.jp/ksc/004501/', 'fitness_club'),
    ('コナミスポーツクラブ 東大島', 'konami-sports-000589', '東京都', '江東区大島', 'https://information.konamisportsclub.jp/ksc/000589/', 'https://information.konamisportsclub.jp/ksc/000589/', 'fitness_club'),
    ('コナミスポーツクラブ 武蔵境', 'konami-sports-006028', '東京都', '武蔵野市境南町', 'https://information.konamisportsclub.jp/ksc/006028/', 'https://information.konamisportsclub.jp/ksc/006028/', 'fitness_club'),
    ('コナミスポーツクラブ 武蔵野', 'konami-sports-003932', '東京都', '武蔵野市中町', 'https://information.konamisportsclub.jp/ksc/003932/', 'https://information.konamisportsclub.jp/ksc/003932/', 'fitness_club'),
    ('コナミスポーツクラブ 池袋', 'konami-sports-004486', '東京都', '豊島区東池袋', 'https://information.konamisportsclub.jp/ksc/004486/', 'https://information.konamisportsclub.jp/ksc/004486/', 'fitness_club'),
    ('コナミスポーツクラブ 渋谷', 'konami-sports-007871', '東京都', '渋谷区神泉町', 'https://information.konamisportsclub.jp/ksc/007871/', 'https://information.konamisportsclub.jp/ksc/007871/', 'fitness_club'),
    ('コナミスポーツクラブ 目黒', 'konami-sports-006022', '東京都', '目黒区下目黒', 'https://information.konamisportsclub.jp/ksc/006022/', 'https://information.konamisportsclub.jp/ksc/006022/', 'fitness_club'),
    ('コナミスポーツクラブ 目黒青葉台', 'konami-sports-004446', '東京都', '目黒区青葉台', 'https://information.konamisportsclub.jp/ksc/004446/', 'https://information.konamisportsclub.jp/ksc/004446/', 'fitness_club'),
    ('コナミスポーツクラブ 碑文谷', 'konami-sports-006034', '東京都', '目黒区碑文谷', 'https://information.konamisportsclub.jp/ksc/006034/', 'https://information.konamisportsclub.jp/ksc/006034/', 'fitness_club'),
    ('コナミスポーツクラブ 稲城', 'konami-sports-004085', '東京都', '稲城市東長沼', 'https://information.konamisportsclub.jp/ksc/004085/', 'https://information.konamisportsclub.jp/ksc/004085/', 'fitness_club'),
    ('コナミスポーツクラブ 自由が丘駅前', 'konami-sports-006029', '東京都', '目黒区自由が丘', 'https://information.konamisportsclub.jp/ksc/006029/', 'https://information.konamisportsclub.jp/ksc/006029/', 'fitness_club'),
    ('コナミスポーツクラブ 船堀', 'konami-sports-003964', '東京都', '江戸川区', 'https://information.konamisportsclub.jp/ksc/003964/', 'https://information.konamisportsclub.jp/ksc/003964/', 'fitness_club'),
    ('コナミスポーツクラブ 荻窪南口', 'konami-sports-006024', '東京都', '杉並区荻窪', 'https://information.konamisportsclub.jp/ksc/006024/', 'https://information.konamisportsclub.jp/ksc/006024/', 'fitness_club'),
    ('コナミスポーツクラブ 蒲田', 'konami-sports-007876', '東京都', '大田区蒲田', 'https://information.konamisportsclub.jp/ksc/007876/', 'https://information.konamisportsclub.jp/ksc/007876/', 'fitness_club'),
    ('コナミスポーツクラブ 西新井', 'konami-sports-004043', '東京都', '足立区梅島', 'https://information.konamisportsclub.jp/ksc/004043/', 'https://information.konamisportsclub.jp/ksc/004043/', 'fitness_club'),
    ('コナミスポーツクラブ 飯田橋', 'konami-sports-004414', '東京都', '新宿区揚場町', 'https://information.konamisportsclub.jp/ksc/004414/', 'https://information.konamisportsclub.jp/ksc/004414/', 'fitness_club'),
    ('コナミスポーツ テニススクール 大宮', 'konami-sports-000355', '埼玉県', 'さいたま市大宮区桜木町', 'https://information.konamisportsclub.jp/ksc/000355/', 'https://information.konamisportsclub.jp/ksc/000355/', 'fitness_club'),
    ('コナミスポーツ テニススクール 浦和', 'konami-sports-007804', '埼玉県', 'さいたま市浦和区高砂', 'https://information.konamisportsclub.jp/ksc/007804/', 'https://information.konamisportsclub.jp/ksc/007804/', 'fitness_club'),
    ('コナミスポーツ テニススクール 狭山', 'konami-sports-004033', '埼玉県', '狭山市入間川', 'https://information.konamisportsclub.jp/ksc/004033/', 'https://information.konamisportsclub.jp/ksc/004033/', 'fitness_club'),
    ('コナミスポーツクラブ 入間', 'konami-sports-004498', '埼玉県', '入間市豊岡', 'https://information.konamisportsclub.jp/ksc/004498/', 'https://information.konamisportsclub.jp/ksc/004498/', 'fitness_club'),
    ('コナミスポーツクラブ 北上尾', 'konami-sports-007879', '埼玉県', '上尾市緑丘', 'https://information.konamisportsclub.jp/ksc/007879/', 'https://information.konamisportsclub.jp/ksc/007879/', 'fitness_club'),
    ('コナミスポーツクラブ 和光', 'konami-sports-007851', '埼玉県', '和光市白子', 'https://information.konamisportsclub.jp/ksc/007851/', 'https://information.konamisportsclub.jp/ksc/007851/', 'fitness_club'),
    ('コナミスポーツクラブ 川口', 'konami-sports-004060', '埼玉県', '川口市宮町', 'https://information.konamisportsclub.jp/ksc/004060/', 'https://information.konamisportsclub.jp/ksc/004060/', 'fitness_club'),
    ('コナミスポーツクラブ 川越', 'konami-sports-004447', '埼玉県', '川越市鯨井新田', 'https://information.konamisportsclub.jp/ksc/004447/', 'https://information.konamisportsclub.jp/ksc/004447/', 'fitness_club'),
    ('コナミスポーツクラブ 所沢', 'konami-sports-004053', '埼玉県', '所沢市星の宮', 'https://information.konamisportsclub.jp/ksc/004053/', 'https://information.konamisportsclub.jp/ksc/004053/', 'fitness_club'),
    ('コナミスポーツクラブ 武蔵浦和', 'konami-sports-004081', '埼玉県', 'さいたま市南区別所', 'https://information.konamisportsclub.jp/ksc/004081/', 'https://information.konamisportsclub.jp/ksc/004081/', 'fitness_club'),
    ('コナミスポーツクラブ 行田', 'konami-sports-000590', '埼玉県', '行田市持田', 'https://information.konamisportsclub.jp/ksc/000590/', 'https://information.konamisportsclub.jp/ksc/000590/', 'fitness_club'),
    ('エグザス 奏の杜', 'konami-sports-004112', '千葉県', '習志野市', 'https://information.konamisportsclub.jp/ksc/004112/', 'https://information.konamisportsclub.jp/ksc/004112/', 'fitness_club'),
    ('コナミスポーツ ジュニアスクール 五香', 'konami-sports-004041', '千葉県', '松戸市', 'https://information.konamisportsclub.jp/ksc/004041/', 'https://information.konamisportsclub.jp/ksc/004041/', 'fitness_club'),
    ('コナミスポーツクラブ 下総中山', 'konami-sports-004442', '千葉県', '船橋市本中山2丁目', 'https://information.konamisportsclub.jp/ksc/004442/', 'https://information.konamisportsclub.jp/ksc/004442/', 'fitness_club'),
    ('コナミスポーツクラブ 五井', 'konami-sports-004039', '千葉県', '市原市五井', 'https://information.konamisportsclub.jp/ksc/004039/', 'https://information.konamisportsclub.jp/ksc/004039/', 'fitness_club'),
    ('コナミスポーツクラブ 五香', 'konami-sports-004089', '千葉県', '松戸市常盤平', 'https://information.konamisportsclub.jp/ksc/004089/', 'https://information.konamisportsclub.jp/ksc/004089/', 'fitness_club'),
    ('コナミスポーツクラブ 北小金', 'konami-sports-004475', '千葉県', '松戸市小金', 'https://information.konamisportsclub.jp/ksc/004475/', 'https://information.konamisportsclub.jp/ksc/004475/', 'fitness_club'),
    ('コナミスポーツクラブ 妙典', 'konami-sports-004067', '千葉県', '市川市妙典', 'https://information.konamisportsclub.jp/ksc/004067/', 'https://information.konamisportsclub.jp/ksc/004067/', 'fitness_club'),
    ('コナミスポーツクラブ 市川', 'konami-sports-000401', '千葉県', '市川市鬼高', 'https://information.konamisportsclub.jp/ksc/000401/', 'https://information.konamisportsclub.jp/ksc/000401/', 'fitness_club'),
    ('コナミスポーツクラブ 津田沼', 'konami-sports-004411', '千葉県', '習志野市津田沼', 'https://information.konamisportsclub.jp/ksc/004411/', 'https://information.konamisportsclub.jp/ksc/004411/', 'fitness_club'),
    ('コナミスポーツクラブ 稲毛', 'konami-sports-004462', '千葉県', '千葉市稲毛区小仲台', 'https://information.konamisportsclub.jp/ksc/004462/', 'https://information.konamisportsclub.jp/ksc/004462/', 'fitness_club'),
    ('コナミスポーツクラブ 船橋', 'konami-sports-004404', '千葉県', '船橋市湊町', 'https://information.konamisportsclub.jp/ksc/004404/', 'https://information.konamisportsclub.jp/ksc/004404/', 'fitness_club'),
    ('コナミスポーツクラブ 西船橋', 'konami-sports-004423', '千葉県', '船橋市印内町', 'https://information.konamisportsclub.jp/ksc/004423/', 'https://information.konamisportsclub.jp/ksc/004423/', 'fitness_club'),
    ('コナミスポーツクラブ 都賀', 'konami-sports-004483', '千葉県', '千葉市若葉区都賀', 'https://information.konamisportsclub.jp/ksc/004483/', 'https://information.konamisportsclub.jp/ksc/004483/', 'fitness_club'),
    ('コナミスポーツクラブ たまプラーザ', 'konami-sports-006026', '神奈川県', '横浜市青葉区美しが丘', 'https://information.konamisportsclub.jp/ksc/006026/', 'https://information.konamisportsclub.jp/ksc/006026/', 'fitness_club'),
    ('コナミスポーツクラブ 三ツ境', 'konami-sports-004071', '神奈川県', '横浜市瀬谷区三ツ境', 'https://information.konamisportsclub.jp/ksc/004071/', 'https://information.konamisportsclub.jp/ksc/004071/', 'fitness_club'),
    ('コナミスポーツクラブ 上大岡', 'konami-sports-004409', '神奈川県', '横浜市港南区上大岡西', 'https://information.konamisportsclub.jp/ksc/004409/', 'https://information.konamisportsclub.jp/ksc/004409/', 'fitness_club'),
    ('コナミスポーツクラブ 中央林間', 'konami-sports-004464', '神奈川県', '大和市中央林間', 'https://information.konamisportsclub.jp/ksc/004464/', 'https://information.konamisportsclub.jp/ksc/004464/', 'fitness_club'),
    ('コナミスポーツクラブ 厚木', 'konami-sports-000643', '神奈川県', '厚木市戸室', 'https://information.konamisportsclub.jp/ksc/000643/', 'https://information.konamisportsclub.jp/ksc/000643/', 'fitness_club'),
    ('コナミスポーツクラブ 川崎', 'konami-sports-004479', '神奈川県', '川崎市幸区堀川町', 'https://information.konamisportsclub.jp/ksc/004479/', 'https://information.konamisportsclub.jp/ksc/004479/', 'fitness_club'),
    ('コナミスポーツクラブ 希望が丘', 'konami-sports-006027', '神奈川県', '横浜市旭区東希望が丘', 'https://information.konamisportsclub.jp/ksc/006027/', 'https://information.konamisportsclub.jp/ksc/006027/', 'fitness_club'),
    ('コナミスポーツクラブ 新百合ヶ丘', 'konami-sports-004488', '神奈川県', '川崎市麻生区上麻生', 'https://information.konamisportsclub.jp/ksc/004488/', 'https://information.konamisportsclub.jp/ksc/004488/', 'fitness_club'),
    ('コナミスポーツクラブ 横浜', 'konami-sports-004079', '神奈川県', '横浜市神奈川区沢渡', 'https://information.konamisportsclub.jp/ksc/004079/', 'https://information.konamisportsclub.jp/ksc/004079/', 'fitness_club'),
    ('コナミスポーツクラブ 橋本', 'konami-sports-000584', '神奈川県', '相模原市緑区西橋本', 'https://information.konamisportsclub.jp/ksc/000584/', 'https://information.konamisportsclub.jp/ksc/000584/', 'fitness_club'),
    ('コナミスポーツクラブ 武蔵小杉', 'konami-sports-004070', '神奈川県', '川崎市中原区新丸子東', 'https://information.konamisportsclub.jp/ksc/004070/', 'https://information.konamisportsclub.jp/ksc/004070/', 'fitness_club'),
    ('コナミスポーツクラブ 洋光台', 'konami-sports-004048', '神奈川県', '横浜市磯子区洋光台', 'https://information.konamisportsclub.jp/ksc/004048/', 'https://information.konamisportsclub.jp/ksc/004048/', 'fitness_club'),
    ('コナミスポーツクラブ 磯子', 'konami-sports-006033', '神奈川県', '横浜市磯子区森', 'https://information.konamisportsclub.jp/ksc/006033/', 'https://information.konamisportsclub.jp/ksc/006033/', 'fitness_club')
) as data(name, slug, prefecture, city, official_url, source_url, location_type)
where not exists (
  select 1
  from gym_locations existing
  where existing.slug = data.slug
);
