-- Managed Lesson publication: incomplete source rows remain HOLD.
-- Run as a complete packet; a failure rolls back the entire batch.
begin;
lock table public.gym_locations, public.lesson_location_memberships in share row exclusive mode;

with golds_brand as (
  select id
  from gym_brands
  where slug = 'golds-gym'
  limit 1
), inserted_locations as (
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
  golds_brand.id,
  data.name,
  data.slug,
  data.prefecture,
  data.city,
  data.official_url,
  data.source_url,
  data.location_type
from golds_brand
cross join (
  values
    ('幕張ベイパークアリーナ', 'golds-gym-12131', '千葉県', '千葉市', 'https://www.goldsgym.jp/shop/12131', 'https://www.goldsgym.jp/shop/12131', 'fitness_club'),
    ('幕張千葉ANNEX', 'golds-gym-12130', '千葉県', '千葉市', 'https://www.goldsgym.jp/shop/12130', 'https://www.goldsgym.jp/shop/12130', 'fitness_club'),
    ('幕張千葉WBG', 'golds-gym-12120', '千葉県', '千葉市', 'https://www.goldsgym.jp/shop/12120', 'https://www.goldsgym.jp/shop/12120', 'fitness_club'),
    ('千葉ニュータウンジョイフルアスレティッククラブ', 'golds-gym-20211026', '千葉県', '印西市', 'https://www.goldsgym.jp/shop/20211026', 'https://www.goldsgym.jp/shop/20211026', 'fitness_club'),
    ('本八幡千葉', 'golds-gym-12180', '千葉県', '市川市', 'https://www.goldsgym.jp/shop/12180', 'https://www.goldsgym.jp/shop/12180', 'fitness_club'),
    ('行徳千葉アスレチックセンター', 'golds-gym-12150', '千葉県', '市川市', 'https://www.goldsgym.jp/shop/12150', 'https://www.goldsgym.jp/shop/12150', 'fitness_club'),
    ('行徳千葉フィットネスセンター (OPEN 24 HOURS)', 'golds-gym-12140', '千葉県', '市川市', 'https://www.goldsgym.jp/shop/12140', 'https://www.goldsgym.jp/shop/12140', 'fitness_club'),
    ('成田千葉', 'golds-gym-12100', '千葉県', '成田市', 'https://www.goldsgym.jp/shop/12100', 'https://www.goldsgym.jp/shop/12100', 'fitness_club'),
    ('柏千葉 （豊四季）', 'golds-gym-12110', '千葉県', '柏市', 'https://www.goldsgym.jp/shop/12110', 'https://www.goldsgym.jp/shop/12110', 'fitness_club'),
    ('浦安千葉', 'golds-gym-12160', '千葉県', '浦安市', 'https://www.goldsgym.jp/shop/12160', 'https://www.goldsgym.jp/shop/12160', 'fitness_club'),
    ('津田沼千葉', 'golds-gym-12170', '千葉県', '習志野市', 'https://www.goldsgym.jp/shop/12170', 'https://www.goldsgym.jp/shop/12170', 'fitness_club'),
    ('さいたまスーパーアリーナ', 'golds-gym-11110', '埼玉県', 'さいたま市', 'https://www.goldsgym.jp/shop/11110', 'https://www.goldsgym.jp/shop/11110', 'fitness_club'),
    ('大宮さいたま (OPEN 24 HOURS)', 'golds-gym-1112', '埼玉県', 'さいたま市', 'https://www.goldsgym.jp/shop/1112', 'https://www.goldsgym.jp/shop/1112', 'fitness_club'),
    ('久喜埼玉', 'golds-gym-20200508', '埼玉県', '久喜市', 'https://www.goldsgym.jp/shop/20200508', 'https://www.goldsgym.jp/shop/20200508', 'fitness_club'),
    ('吉川埼玉 （フランチャイズ店）', 'golds-gym-11100', '埼玉県', '吉川市', 'https://www.goldsgym.jp/shop/11100', 'https://www.goldsgym.jp/shop/11100', 'fitness_club'),
    ('新所沢埼玉', 'golds-gym-11130', '埼玉県', '所沢市', 'https://www.goldsgym.jp/shop/11130', 'https://www.goldsgym.jp/shop/11130', 'fitness_club'),
    ('銀座中央', 'golds-gym-13205', '東京都', '中央区', 'https://www.goldsgym.jp/shop/13205', 'https://www.goldsgym.jp/shop/13205', 'fitness_club'),
    ('銀座東京 (OPEN 24 HOURS)', 'golds-gym-13200', '東京都', '中央区', 'https://www.goldsgym.jp/shop/13200', 'https://www.goldsgym.jp/shop/13200', 'fitness_club'),
    ('ウエスト東京', 'golds-gym-13140', '東京都', '中野区', 'https://www.goldsgym.jp/shop/13140', 'https://www.goldsgym.jp/shop/13140', 'fitness_club'),
    ('東中野東京', 'golds-gym-13130', '東京都', '中野区', 'https://www.goldsgym.jp/shop/13130', 'https://www.goldsgym.jp/shop/13130', 'fitness_club'),
    ('八王子東京', 'golds-gym-13260', '東京都', '八王子市', 'https://www.goldsgym.jp/shop/13260', 'https://www.goldsgym.jp/shop/13260', 'fitness_club'),
    ('南大沢東京', 'golds-gym-10210', '東京都', '八王子市', 'https://www.goldsgym.jp/shop/10210', 'https://www.goldsgym.jp/shop/10210', 'fitness_club'),
    ('四ツ谷東京', 'golds-gym-13121', '東京都', '千代田区', 'https://www.goldsgym.jp/shop/13121', 'https://www.goldsgym.jp/shop/13121', 'fitness_club'),
    ('サウス東京 (OPEN 24 HOURS)', 'golds-gym-13230', '東京都', '品川区', 'https://www.goldsgym.jp/shop/13230', 'https://www.goldsgym.jp/shop/13230', 'fitness_club'),
    ('国立東京', 'golds-gym-20220627', '東京都', '国立市', 'https://www.goldsgym.jp/shop/20220627', 'https://www.goldsgym.jp/shop/20220627', 'fitness_club'),
    ('曳舟東京 (OPEN 24 HOURS)', 'golds-gym-18116', '東京都', '墨田区', 'https://www.goldsgym.jp/shop/18116', 'https://www.goldsgym.jp/shop/18116', 'fitness_club'),
    ('聖蹟桜ヶ丘東京', 'golds-gym-191002', '東京都', '多摩市', 'https://www.goldsgym.jp/shop/191002', 'https://www.goldsgym.jp/shop/191002', 'fitness_club'),
    ('サウス東京ANNEX', 'golds-gym-13220', '東京都', '大田区', 'https://www.goldsgym.jp/shop/13220', 'https://www.goldsgym.jp/shop/13220', 'fitness_club'),
    ('府中東京 (OPEN 24 HOURS)', 'golds-gym-13240', '東京都', '府中市', 'https://www.goldsgym.jp/shop/13240', 'https://www.goldsgym.jp/shop/13240', 'fitness_club'),
    ('西葛西東京 (OPEN 24 HOURS)', 'golds-gym-180914', '東京都', '江戸川区', 'https://www.goldsgym.jp/shop/180914', 'https://www.goldsgym.jp/shop/180914', 'fitness_club'),
    ('イースト東京', 'golds-gym-13110', '東京都', '江東区', 'https://www.goldsgym.jp/shop/13110', 'https://www.goldsgym.jp/shop/13110', 'fitness_club'),
    ('東陽町スーパーセンター', 'golds-gym-71221', '東京都', '江東区', 'https://www.goldsgym.jp/shop/71221', 'https://www.goldsgym.jp/shop/71221', 'fitness_club'),
    ('代々木上原東京', 'golds-gym-13190', '東京都', '渋谷区', 'https://www.goldsgym.jp/shop/13190', 'https://www.goldsgym.jp/shop/13190', 'fitness_club'),
    ('代々木公園PREMIUM', 'golds-gym-13191', '東京都', '渋谷区', 'https://www.goldsgym.jp/shop/13191', 'https://www.goldsgym.jp/shop/13191', 'fitness_club'),
    ('原宿ANNEX', 'golds-gym-9999', '東京都', '渋谷区', 'https://www.goldsgym.jp/shop/9999', 'https://www.goldsgym.jp/shop/9999', 'fitness_club'),
    ('原宿東京 (OPEN 24 HOURS)', 'golds-gym-13150', '東京都', '渋谷区', 'https://www.goldsgym.jp/shop/13150', 'https://www.goldsgym.jp/shop/13150', 'fitness_club'),
    ('渋谷東京', 'golds-gym-13180', '東京都', '渋谷区', 'https://www.goldsgym.jp/shop/13180', 'https://www.goldsgym.jp/shop/13180', 'fitness_club'),
    ('笹塚東京 (OPEN 24 HOURS)', 'golds-gym-2222', '東京都', '渋谷区', 'https://www.goldsgym.jp/shop/2222', 'https://www.goldsgym.jp/shop/2222', 'fitness_club'),
    ('表参道東京', 'golds-gym-13160', '東京都', '渋谷区', 'https://www.goldsgym.jp/shop/13160', 'https://www.goldsgym.jp/shop/13160', 'fitness_club'),
    ('南青山東京', 'golds-gym-13170', '東京都', '港区', 'https://www.goldsgym.jp/shop/13170', 'https://www.goldsgym.jp/shop/13170', 'fitness_club'),
    ('浜松町東京', 'golds-gym-13210', '東京都', '港区', 'https://www.goldsgym.jp/shop/13210', 'https://www.goldsgym.jp/shop/13210', 'fitness_club'),
    ('町田東京', 'golds-gym-13250', '東京都', '町田市', 'https://www.goldsgym.jp/shop/13250', 'https://www.goldsgym.jp/shop/13250', 'fitness_club'),
    ('立川東京', 'golds-gym-20201101', '東京都', '立川市', 'https://www.goldsgym.jp/shop/20201101', 'https://www.goldsgym.jp/shop/20201101', 'fitness_club'),
    ('練馬高野台東京', 'golds-gym-20220509', '東京都', '練馬区', 'https://www.goldsgym.jp/shop/20220509', 'https://www.goldsgym.jp/shop/20220509', 'fitness_club'),
    ('ノース東京', 'golds-gym-13120', '東京都', '豊島区', 'https://www.goldsgym.jp/shop/13120', 'https://www.goldsgym.jp/shop/13120', 'fitness_club'),
    ('北千住東京', 'golds-gym-13100', '東京都', '足立区', 'https://www.goldsgym.jp/shop/13100', 'https://www.goldsgym.jp/shop/13100', 'fitness_club'),
    ('厚木神奈川 (OPEN 24 HOURS)', 'golds-gym-14160', '神奈川県', '厚木市', 'https://www.goldsgym.jp/shop/14160', 'https://www.goldsgym.jp/shop/14160', 'fitness_club'),
    ('溝の口神奈川', 'golds-gym-14110', '神奈川県', '川崎市', 'https://www.goldsgym.jp/shop/14110', 'https://www.goldsgym.jp/shop/14110', 'fitness_club'),
    ('戸塚神奈川', 'golds-gym-14130', '神奈川県', '横浜市', 'https://www.goldsgym.jp/shop/14130', 'https://www.goldsgym.jp/shop/14130', 'fitness_club'),
    ('横浜上星川 ※フランチャイズ店 (OPEN 24 HOURS)', 'golds-gym-14140', '神奈川県', '横浜市', 'https://www.goldsgym.jp/shop/14140', 'https://www.goldsgym.jp/shop/14140', 'fitness_club'),
    ('横浜馬車道 （フランチャイズ店） ※OPEN 24 HOURS', 'golds-gym-20210924', '神奈川県', '横浜市', 'https://www.goldsgym.jp/shop/20210924', 'https://www.goldsgym.jp/shop/20210924', 'fitness_club'),
    ('横須賀神奈川 (OPEN 24 HOURS)', 'golds-gym-14150', '神奈川県', '横須賀市', 'https://www.goldsgym.jp/shop/14150', 'https://www.goldsgym.jp/shop/14150', 'fitness_club'),
    ('湘南神奈川 (OPEN 24 HOURS)', 'golds-gym-14170', '神奈川県', '藤沢市', 'https://www.goldsgym.jp/shop/14170', 'https://www.goldsgym.jp/shop/14170', 'fitness_club')
) as data(name, slug, prefecture, city, official_url, source_url, location_type)
where not exists (
  select 1
  from gym_locations existing
  where existing.slug = data.slug
)
returning id
)

insert into lesson_location_memberships (location_id, authority_source)
select inserted_locations.id, 'lesson-location-seed:golds-kanto'
from inserted_locations
on conflict (location_id) do nothing;

do $$
begin
  if exists (
    select 1 from public.gym_locations g
    join public.lesson_location_memberships m on m.location_id = g.id
    where g.is_active and (
      g.latitude is null or g.longitude is null
      or not (g.latitude between -90 and 90)
      or not (g.longitude between -180 and 180)
    )
  ) then
    raise exception 'LESSON_COORDINATE_PUBLICATION_HOLD: active Lesson location requires complete valid coordinates';
  end if;
end;
$$;

commit;
