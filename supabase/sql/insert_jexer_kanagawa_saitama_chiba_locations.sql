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
  location_type,
  is_active
)
select
  jexer_brand.id,
  data.name,
  data.slug,
  data.prefecture,
  data.city,
  data.official_url,
  data.source_url,
  data.location_type,
  true
from jexer_brand
cross join (
  values
    ('JEXER 川崎', 'jexer-kawasaki', '神奈川県', '川崎市', 'https://www.jexer.jp/fitness/kawasaki/', 'https://www.jexer.jp/fitness/kawasaki/', 'fitness_spa'),
    ('JEXER 横浜', 'jexer-yokohama', '神奈川県', '横浜市', 'https://www.jexer.jp/fitness/yokohama/', 'https://www.jexer.jp/fitness/yokohama/', 'fitness_spa'),
    ('JEXER 新川崎', 'jexer-shinkawasaki-kanagawa', '神奈川県', '川崎市', 'https://www.jexer.jp/fitness/shinkawasaki/', 'https://www.jexer.jp/fitness/shinkawasaki/', 'fitness_spa'),
    ('JEXER 東神奈川', 'jexer-higashi-kanagawa', '神奈川県', '横浜市', 'https://www.jexer.jp/fitness/higashikanagawa/', 'https://www.jexer.jp/fitness/higashikanagawa/', 'fitness_spa'),
    ('JEXER Light Gym アーバン保土ヶ谷店', 'jexer-lightgym-hodogaya', '神奈川県', '横浜市', 'https://jexer.jp/lightgym/hodogaya/index.html', 'https://jexer.jp/lightgym/hodogaya/index.html', 'light_gym'),
    ('JEXER BODY MAKE GYM モザイクモール港北店', 'jexer-bodymake-kohoku', '神奈川県', '横浜市', 'https://www.jexer.jp/bodymakegym/kohoku/index.html', 'https://www.jexer.jp/bodymakegym/kohoku/index.html', 'bodymake_gym'),
    ('JEXER Pilates Studio NEWoMan横浜店', 'jexer-pilates-yokohama', '神奈川県', '横浜市', 'https://www.jexer.jp/pilatesstudio/yokohama/index.html', 'https://www.jexer.jp/pilatesstudio/yokohama/index.html', 'fitness_studio'),
    ('JEXER 大宮', 'jexer-omiya-saitama', '埼玉県', 'さいたま市', 'https://www.jexer.jp/fitness/omiya/', 'https://www.jexer.jp/fitness/omiya/', 'fitness_spa'),
    ('JEXER 浦和', 'jexer-urawa', '埼玉県', 'さいたま市', 'https://www.jexer.jp/fitness/urawa/', 'https://www.jexer.jp/fitness/urawa/', 'fitness_spa'),
    ('JEXER 戸田公園', 'jexer-todakoen', '埼玉県', '戸田市', 'https://www.jexer.jp/fitness/todakoen/', 'https://www.jexer.jp/fitness/todakoen/', 'fitness_spa'),
    ('JEXER Light Gym 大宮店', 'jexer-lightgym-omiya', '埼玉県', 'さいたま市', 'https://jexer.jp/lightgym/omiya/index.html', 'https://jexer.jp/lightgym/omiya/index.html', 'light_gym'),
    ('JEXER Light Gym シャポー市川店', 'jexer-lightgym-ichikawa', '千葉県', '市川市', 'https://jexer.jp/lightgym/ichikawa/index.html', 'https://jexer.jp/lightgym/ichikawa/index.html', 'light_gym'),
    ('JEXER Gym Flat イオンモール柏店', 'jexer-flat-kashiwa', '千葉県', '柏市', 'https://www.jexer.jp/flat/kashiwa/index.html', 'https://www.jexer.jp/flat/kashiwa/index.html', 'flat'),
    ('JEXER sopra シャポー船橋店', 'jexer-sopra-funabashi', '千葉県', '船橋市', 'https://www.jexer.jp/sopra/funabashi/index.html', 'https://www.jexer.jp/sopra/funabashi/index.html', 'sopra')
) as data(name, slug, prefecture, city, official_url, source_url, location_type)
where not exists (
  select 1
  from gym_locations existing
  where existing.slug = data.slug
);
