-- Managed Lesson publication: incomplete source rows remain HOLD.
-- Run as a complete packet; a failure rolls back the entire batch.
begin;
lock table public.gym_locations, public.lesson_location_memberships in share row exclusive mode;

with tipness_brand as (
  select id
  from gym_brands
  where slug = 'tipness'
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
  tipness_brand.id,
  data.name,
  data.slug,
  data.prefecture,
  data.city,
  data.official_url,
  data.source_url,
  data.location_type
from tipness_brand
cross join (
  values
    ('蘇我店', 'tipness-shp065', '千葉県', '千葉市', 'https://tip.tipness.co.jp/shop_info/SHP065/', 'https://tip.tipness.co.jp/shop_info/SHP065/', 'fitness_club'),
    ('南行徳店', 'tipness-shp060', '千葉県', '市川市', 'https://tip.tipness.co.jp/shop_info/SHP060/', 'https://tip.tipness.co.jp/shop_info/SHP060/', 'fitness_club'),
    ('船橋店', 'tipness-shp027', '千葉県', '船橋市', 'https://tip.tipness.co.jp/shop_info/SHP027/', 'https://tip.tipness.co.jp/shop_info/SHP027/', 'fitness_club'),
    ('武蔵藤沢店', 'tipness-shp046', '埼玉県', '入間市', 'https://tip.tipness.co.jp/shop_info/SHP046/', 'https://tip.tipness.co.jp/shop_info/SHP046/', 'fitness_club'),
    ('イオンモール川口店', 'tipness-shp099', '埼玉県', '川口市', 'https://tip.tipness.co.jp/shop_info/SHP099/', 'https://tip.tipness.co.jp/shop_info/SHP099/', 'fitness_club'),
    ('川口店', 'tipness-shp048', '埼玉県', '川口市', 'https://tip.tipness.co.jp/shop_info/SHP048/', 'https://tip.tipness.co.jp/shop_info/SHP048/', 'fitness_club'),
    ('三軒茶屋店', 'tipness-shp051', '東京都', '世田谷区', 'https://tip.tipness.co.jp/shop_info/SHP051/', 'https://tip.tipness.co.jp/shop_info/SHP051/', 'fitness_club'),
    ('喜多見店', 'tipness-shp034', '東京都', '世田谷区', 'https://tip.tipness.co.jp/shop_info/SHP034/', 'https://tip.tipness.co.jp/shop_info/SHP034/', 'fitness_club'),
    ('明大前店', 'tipness-shp062', '東京都', '世田谷区', 'https://tip.tipness.co.jp/shop_info/SHP062/', 'https://tip.tipness.co.jp/shop_info/SHP062/', 'fitness_club'),
    ('駒沢大学店', 'tipness-shp100', '東京都', '世田谷区', 'https://tip.tipness.co.jp/shop_info/SHP100/', 'https://tip.tipness.co.jp/shop_info/SHP100/', 'fitness_club'),
    ('中野店', 'tipness-shp007', '東京都', '中野区', 'https://tip.tipness.co.jp/shop_info/SHP007/', 'https://tip.tipness.co.jp/shop_info/SHP007/', 'fitness_club'),
    ('王子店', 'tipness-shp096', '東京都', '北区', 'https://tip.tipness.co.jp/shop_info/SHP096/', 'https://tip.tipness.co.jp/shop_info/SHP096/', 'fitness_club'),
    ('五反田店', 'tipness-shp005', '東京都', '品川区', 'https://tip.tipness.co.jp/shop_info/SHP005/', 'https://tip.tipness.co.jp/shop_info/SHP005/', 'fitness_club'),
    ('国分寺店', 'tipness-shp031', '東京都', '国分寺市', 'https://tip.tipness.co.jp/shop_info/SHP031/', 'https://tip.tipness.co.jp/shop_info/SHP031/', 'fitness_club'),
    ('蒲田店', 'tipness-shp041', '東京都', '大田区', 'https://tip.tipness.co.jp/shop_info/SHP041/', 'https://tip.tipness.co.jp/shop_info/SHP041/', 'fitness_club'),
    ('東新宿店', 'tipness-shp082', '東京都', '新宿区', 'https://tip.tipness.co.jp/shop_info/SHP082/', 'https://tip.tipness.co.jp/shop_info/SHP082/', 'fitness_club'),
    ('下井草店', 'tipness-shp029', '東京都', '杉並区', 'https://tip.tipness.co.jp/shop_info/SHP029/', 'https://tip.tipness.co.jp/shop_info/SHP029/', 'fitness_club'),
    ('吉祥寺店', 'tipness-shp004', '東京都', '武蔵野市', 'https://tip.tipness.co.jp/shop_info/SHP004/', 'https://tip.tipness.co.jp/shop_info/SHP004/', 'fitness_club'),
    ('瑞江店', 'tipness-shp076', '東京都', '江戸川区', 'https://tip.tipness.co.jp/shop_info/SHP076/', 'https://tip.tipness.co.jp/shop_info/SHP076/', 'fitness_club'),
    ('木場店', 'tipness-shp036', '東京都', '江東区', 'https://tip.tipness.co.jp/shop_info/SHP036/', 'https://tip.tipness.co.jp/shop_info/SHP036/', 'fitness_club'),
    ('TIP.X TOKYO渋谷', 'tipness-shp001', '東京都', '渋谷区', 'https://tip.tipness.co.jp/shop_info/SHP001/', 'https://tip.tipness.co.jp/shop_info/SHP001/', 'fitness_club'),
    ('六本木店', 'tipness-shp008', '東京都', '港区', 'https://tip.tipness.co.jp/shop_info/SHP008/', 'https://tip.tipness.co.jp/shop_info/SHP008/', 'fitness_club'),
    ('大泉学園店', 'tipness-shp028', '東京都', '練馬区', 'https://tip.tipness.co.jp/shop_info/SHP028/', 'https://tip.tipness.co.jp/shop_info/SHP028/', 'fitness_club'),
    ('東武練馬店', 'tipness-shp025', '東京都', '練馬区', 'https://tip.tipness.co.jp/shop_info/SHP025/', 'https://tip.tipness.co.jp/shop_info/SHP025/', 'fitness_club'),
    ('氷川台店', 'tipness-shp063', '東京都', '練馬区', 'https://tip.tipness.co.jp/shop_info/SHP063/', 'https://tip.tipness.co.jp/shop_info/SHP063/', 'fitness_club'),
    ('練馬店', 'tipness-shp069', '東京都', '練馬区', 'https://tip.tipness.co.jp/shop_info/SHP069/', 'https://tip.tipness.co.jp/shop_info/SHP069/', 'fitness_club'),
    ('新小岩店', 'tipness-shp037', '東京都', '葛飾区', 'https://tip.tipness.co.jp/shop_info/SHP037/', 'https://tip.tipness.co.jp/shop_info/SHP037/', 'fitness_club'),
    ('田無店', 'tipness-shp032', '東京都', '西東京市', 'https://tip.tipness.co.jp/shop_info/SHP032/', 'https://tip.tipness.co.jp/shop_info/SHP032/', 'fitness_club'),
    ('国領店', 'tipness-shp023', '東京都', '調布市', 'https://tip.tipness.co.jp/shop_info/SHP023/', 'https://tip.tipness.co.jp/shop_info/SHP023/', 'fitness_club'),
    ('TIP.X TOKYO池袋', 'tipness-shp010', '東京都', '豊島区', 'https://tip.tipness.co.jp/shop_info/SHP010/', 'https://tip.tipness.co.jp/shop_info/SHP010/', 'fitness_club'),
    ('綾瀬店', 'tipness-shp049', '東京都', '足立区', 'https://tip.tipness.co.jp/shop_info/SHP049/', 'https://tip.tipness.co.jp/shop_info/SHP049/', 'fitness_club'),
    ('宮前平店', 'tipness-shp074', '神奈川県', '川崎市', 'https://tip.tipness.co.jp/shop_info/SHP074/', 'https://tip.tipness.co.jp/shop_info/SHP074/', 'fitness_club'),
    ('宮崎台店', 'tipness-shp026', '神奈川県', '川崎市', 'https://tip.tipness.co.jp/shop_info/SHP026/', 'https://tip.tipness.co.jp/shop_info/SHP026/', 'fitness_club'),
    ('川崎店', 'tipness-shp056', '神奈川県', '川崎市', 'https://tip.tipness.co.jp/shop_info/SHP056/', 'https://tip.tipness.co.jp/shop_info/SHP056/', 'fitness_club'),
    ('新百合ヶ丘店', 'tipness-shp035', '神奈川県', '川崎市', 'https://tip.tipness.co.jp/shop_info/SHP035/', 'https://tip.tipness.co.jp/shop_info/SHP035/', 'fitness_club'),
    ('二俣川店', 'tipness-shp052', '神奈川県', '横浜市', 'https://tip.tipness.co.jp/shop_info/SHP052/', 'https://tip.tipness.co.jp/shop_info/SHP052/', 'fitness_club'),
    ('横浜店', 'tipness-shp070', '神奈川県', '横浜市', 'https://tip.tipness.co.jp/shop_info/SHP070/', 'https://tip.tipness.co.jp/shop_info/SHP070/', 'fitness_club'),
    ('鴨居店', 'tipness-shp067', '神奈川県', '横浜市', 'https://tip.tipness.co.jp/shop_info/SHP067/', 'https://tip.tipness.co.jp/shop_info/SHP067/', 'fitness_club'),
    ('鶴見店', 'tipness-shp084', '神奈川県', '横浜市', 'https://tip.tipness.co.jp/shop_info/SHP084/', 'https://tip.tipness.co.jp/shop_info/SHP084/', 'fitness_club'),
    ('藤沢店', 'tipness-shp013', '神奈川県', '藤沢市', 'https://tip.tipness.co.jp/shop_info/SHP013/', 'https://tip.tipness.co.jp/shop_info/SHP013/', 'fitness_club')
) as data(name, slug, prefecture, city, official_url, source_url, location_type)
where not exists (
  select 1
  from gym_locations existing
  where existing.slug = data.slug
)
returning id
)

insert into lesson_location_memberships (location_id, authority_source)
select inserted_locations.id, 'lesson-location-seed:tipness-kanto'
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
