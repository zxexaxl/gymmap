-- LOCAL REHEARSAL FIXTURE ONLY. IDs and fields mirror the reviewed H2-1 inventory.
insert into public.gym_brands (id, name, slug, official_url)
values (
  'dd9e21fe-f2a1-4728-92f8-8c89fa83931e',
  'Gold''s Gym',
  'golds-gym',
  'https://www.goldsgym.jp/'
)
on conflict (id) do nothing;

insert into public.gym_locations (
  id, brand_id, name, slug, postal_code, prefecture, city, address_line,
  latitude, longitude, official_url, source_url, is_active, location_type
)
values
  ('1e1dc6eb-ec16-4850-978a-ac3c513f55ab', 'dd9e21fe-f2a1-4728-92f8-8c89fa83931e', '原宿東京', 'golds-gym-13150', '150-0001', '東京都', '渋谷区', '神宮前6-31-17V28 4F・3F・B2F', 35.668793, 139.704422, 'https://www.goldsgym.jp/shop/harajuku-tokyo/', 'https://www.goldsgym.jp/shop/harajuku-tokyo/', true, 'fitness_club'),
  ('4d3bd3ba-cb00-44be-bdd6-d9b901f73195', 'dd9e21fe-f2a1-4728-92f8-8c89fa83931e', '千葉ニュータウン', 'golds-gym-chiba-newtown', '270-1340', '千葉県', '印西市', '中央南1-8千葉ニュータウン駅前センタービル 3階', 35.798595, 140.117126, 'https://www.goldsgym.jp/shop/chiba-newtown/', 'https://www.goldsgym.jp/shop/chiba-newtown/', true, 'fitness_club'),
  ('569aecf8-aa02-41da-b37a-7e2e20f160fb', 'dd9e21fe-f2a1-4728-92f8-8c89fa83931e', '浜松町東京', 'golds-gym-13210', '105-0022', '東京都', '港区', '海岸1-2-3汐留芝離宮ビルディング 2階', 35.656849, 139.759186, 'https://www.goldsgym.jp/shop/hamamatsucho-tokyo/', 'https://www.goldsgym.jp/shop/hamamatsucho-tokyo/', true, 'fitness_club'),
  ('7d7216d0-692e-45dd-ad3c-6c4980fdc50a', 'dd9e21fe-f2a1-4728-92f8-8c89fa83931e', '原宿ANNEX', 'golds-gym-9999', '150-0001', '東京都', '渋谷区', '神宮前1-5-8神宮前タワービルディング B1F(フロントは1F)', 35.670582, 139.706863, 'https://www.goldsgym.jp/shop/harajuku-annex-tokyo/', 'https://www.goldsgym.jp/shop/harajuku-annex-tokyo/', true, 'fitness_club'),
  ('d75c411f-2b58-476d-aa68-f7bde9000002', 'dd9e21fe-f2a1-4728-92f8-8c89fa83931e', '東陽町スーパーセンター', 'golds-gym-71221', '135-0016', '東京都', '江東区', '東陽2-2-20', 35.666416, 139.816544, 'https://www.goldsgym.jp/shop/toyocho-super-center/', 'https://www.goldsgym.jp/shop/toyocho-super-center/', true, 'fitness_club'),
  ('e84c2ea2-bc63-4788-b050-590cfefebe42', 'dd9e21fe-f2a1-4728-92f8-8c89fa83931e', '浦安千葉', 'golds-gym-12160', '279-0002', '千葉県', '浦安市', '北栄1-13-25 トライアル西友パートII 5F', 35.665810, 139.893646, 'https://www.goldsgym.jp/shop/urayasu-chiba/', 'https://www.goldsgym.jp/shop/urayasu-chiba/', true, 'fitness_club')
on conflict (id) do update
set is_active = excluded.is_active;
