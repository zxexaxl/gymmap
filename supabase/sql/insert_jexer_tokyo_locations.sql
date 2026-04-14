with jexer_brand as (
  select id
  from gym_brands
  where slug = 'jexer'
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
  is_active
)
select
  jexer_brand.id,
  data.name,
  data.slug,
  '東京都',
  data.city,
  data.official_url,
  data.source_url,
  true
from jexer_brand
cross join (
  values
    ('JEXER 新宿', 'jexer-shinjuku', '渋谷区', 'https://www.jexer.jp/fitness/shinjuku/', 'https://www.jexer.jp/mb/shinjuku/schedule/index.html'),
    ('JEXER 大井町', 'jexer-oimachi', '品川区', 'https://www.jexer.jp/fitness/oimachi/', 'https://www.jexer.jp/mb/oi/'),
    ('JEXER 上野', 'jexer-ueno', '台東区', 'https://www.jexer.jp/fitness/ueno/', 'https://www.jexer.jp/mb/ueno/'),
    ('JEXER 池袋', 'jexer-ikebukuro', '豊島区', 'https://www.jexer.jp/fitness/ikebukuro/', 'https://www.jexer.jp/mb/ikebukuro/'),
    ('JEXER 亀戸', 'jexer-kameido', '江東区', 'https://www.jexer.jp/fitness/kameido/', 'https://www.jexer.jp/mb/kameido/'),
    ('JEXER 四ツ谷', 'jexer-yotsuya', '新宿区', 'https://www.jexer.jp/fitness/yotsuya/', 'https://www.jexer.jp/mb/yotsuya/'),
    ('JEXER 赤羽', 'jexer-akabane', '北区', 'https://www.jexer.jp/fitness/akabane/', 'https://www.jexer.jp/mb/akabane/'),
    ('JEXER 大塚', 'jexer-otsuka', '豊島区', 'https://www.jexer.jp/fitness/otsuka/', 'https://www.jexer.jp/mb/otsuka/'),
    ('JEXER 板橋', 'jexer-itabashi', '板橋区', 'https://www.jexer.jp/fitness/itabashi/', 'https://www.jexer.jp/mb/itabashi/'),
    ('JEXER 新小岩', 'jexer-shinkoiwa', '葛飾区', 'https://www.jexer.jp/fitness/shinkoiwa/', 'https://www.jexer.jp/mb/shinkoiwa/')
) as data(name, slug, city, official_url, source_url)
where not exists (
  select 1
  from gym_locations existing
  where existing.slug = data.slug
);
