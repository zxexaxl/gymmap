-- H2-5 reviewed new-location import candidate: LOCAL REHEARSAL ONLY.
-- The complete production-like transaction is rolled back unconditionally.
-- Never run this file against production.
begin;

select pg_advisory_xact_lock(hashtext('gymmap:h2-5:new-location-import-rehearsal'));

-- Current production identity baseline: 7 brands / 369 locations.
insert into public.gym_brands (id, name, slug, official_url, description) values
  ('0f49d25a-b01b-4edd-89bd-5457f5c6459e'::uuid, 'Sports Club NAS', 'sports-club-nas', null, null),
  ('8e66d169-68bf-4da1-8ed7-42307976e4ab'::uuid, 'Central Sports', 'central-sports', null, null),
  ('b04baf0e-ded3-48f3-a2d9-127ae8f7c817'::uuid, 'JEXER', 'jexer', 'https://www.jexer.jp/'::text, 'JR東日本系の総合型フィットネスクラブブランド'::text),
  ('bef520a9-236f-4ef9-b59d-28ae328090ca'::uuid, 'Megalos', 'megalos', null, null),
  ('dd9e21fe-f2a1-4728-92f8-8c89fa83931e'::uuid, 'Gold''s Gym', 'golds-gym', null, null),
  ('ee1927f5-3d6d-4e4e-b632-ad9210540d56'::uuid, 'Konami Sports Club', 'konami-sports', null, null),
  ('f0c8c2f9-103a-4b7f-a385-5b0bb4a29aec'::uuid, 'Tipness', 'tipness', null, null);

insert into public.gym_locations (
  id, brand_id, name, slug, postal_code, prefecture, city, address_line,
  latitude, longitude, nearest_station, official_url, source_url, location_type,
  is_active, last_verified_at
) values
  (
    '00ace1b2-3586-4fa1-b3a3-41ac33fccf97'::uuid, 'f0c8c2f9-103a-4b7f-a385-5b0bb4a29aec'::uuid, '川口店', 'tipness-shp048',
    null, '埼玉県'::text, '川口市'::text, null,
    35.802391, 139.719049, null,
    'https://tip.tipness.co.jp/shop_info/SHP048/'::text, 'https://tip.tipness.co.jp/shop_info/SHP048/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '00e32da0-39cf-486f-8613-43b91b4e2253'::uuid, '8e66d169-68bf-4da1-8ed7-42307976e4ab'::uuid, 'セントラルフィットネスクラブ24 袖ケ浦駅前', 'central-cf-sodegaura',
    '299-0269'::text, '千葉県'::text, '袖ケ浦市'::text, '袖ケ浦駅前 1-39-10 ゆりまち袖ケ浦駅前モール内'::text,
    35.432512, 139.957818, null,
    'https://www.central.co.jp/club/cf-sodegaura/'::text, 'https://www.central.co.jp/club/cf-sodegaura/'::text, 'fitness_club'::text,
    true, '2026-08-09T12:29:34.761+00:00'::timestamptz
  ),
  (
    '018ad6c3-7c03-439d-936a-2583fa08d204'::uuid, 'ee1927f5-3d6d-4e4e-b632-ad9210540d56'::uuid, 'コナミスポーツクラブ 府中', 'konami-sports-004469',
    null, '東京都'::text, '府中市宮西町'::text, null,
    35.671253, 139.476746, null,
    'https://information.konamisportsclub.jp/ksc/004469/'::text, 'https://information.konamisportsclub.jp/ksc/004469/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '03358968-053c-4d9e-a351-d73c5998a2bd'::uuid, '0f49d25a-b01b-4edd-89bd-5457f5c6459e'::uuid, 'NAS西日暮里', 'sports-club-nas-nishinippori-index',
    null, '東京都'::text, '荒川区'::text, null,
    35.731556, 139.768158, null,
    'https://www.nas-club.co.jp/nishinippori/index.html'::text, 'https://www.nas-club.co.jp/nishinippori/index.html'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '03c28466-15ed-4254-8914-89e747e4d1fc'::uuid, 'ee1927f5-3d6d-4e4e-b632-ad9210540d56'::uuid, 'コナミスポーツクラブ 東大島', 'konami-sports-000589',
    null, '東京都'::text, '江東区大島'::text, null,
    35.690628, 139.842834, null,
    'https://information.konamisportsclub.jp/ksc/000589/'::text, 'https://information.konamisportsclub.jp/ksc/000589/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '04323f77-2eeb-4b40-8728-5eab8c746369'::uuid, '8e66d169-68bf-4da1-8ed7-42307976e4ab'::uuid, 'セントラルウェルネスクラブ 大宮宮原', 'central-omiyamiyahara',
    '331-0812'::text, '埼玉県'::text, 'さいたま市北区'::text, '宮原町1-855-3'::text,
    35.933509, 139.624131, null,
    'https://www.central.co.jp/club/omiyamiyahara/'::text, 'https://www.central.co.jp/club/omiyamiyahara/'::text, 'fitness_club'::text,
    true, '2026-08-09T12:29:34.761+00:00'::timestamptz
  ),
  (
    '0523126f-b19d-430e-b3b7-1b3f8ffa46f6'::uuid, 'ee1927f5-3d6d-4e4e-b632-ad9210540d56'::uuid, 'コナミスポーツクラブ 中央林間', 'konami-sports-004464',
    null, '神奈川県'::text, '大和市中央林間'::text, null,
    35.509087, 139.446655, null,
    'https://information.konamisportsclub.jp/ksc/004464/'::text, 'https://information.konamisportsclub.jp/ksc/004464/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '05c3f597-9a35-4f4b-870a-f76d2526f58d'::uuid, 'ee1927f5-3d6d-4e4e-b632-ad9210540d56'::uuid, 'コナミスポーツクラブ 入間', 'konami-sports-004498',
    null, '埼玉県'::text, '入間市豊岡'::text, null,
    35.840942, 139.387405, null,
    'https://information.konamisportsclub.jp/ksc/004498/'::text, 'https://information.konamisportsclub.jp/ksc/004498/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '06acd243-c482-4f92-b88d-dc1f2a8ceabd'::uuid, '8e66d169-68bf-4da1-8ed7-42307976e4ab'::uuid, 'セントラルウェルネスクラブ24 ときわ台', 'central-tokiwadai',
    null, '東京都'::text, null, null,
    35.764013, 139.687183, null,
    'https://www.central.co.jp/club/tokiwadai/'::text, 'https://www.central.co.jp/club/tokiwadai/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '09618323-4243-4b5f-abed-f8757290c074'::uuid, 'b04baf0e-ded3-48f3-a2d9-127ae8f7c817'::uuid, 'JEXER 横浜', 'jexer-yokohama',
    null, '神奈川県'::text, '横浜市'::text, null,
    35.468845, 139.624023, null,
    'https://www.jexer.jp/fitness/yokohama/'::text, 'https://www.jexer.jp/fitness/yokohama/'::text, 'fitness_spa'::text,
    true, null
  ),
  (
    '0a073939-e0b0-4032-854a-6b5c542e2ce2'::uuid, 'f0c8c2f9-103a-4b7f-a385-5b0bb4a29aec'::uuid, '田無店', 'tipness-shp032',
    null, '東京都'::text, '西東京市'::text, null,
    35.728692, 139.539451, null,
    'https://tip.tipness.co.jp/shop_info/SHP032/'::text, 'https://tip.tipness.co.jp/shop_info/SHP032/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '0a651430-ef60-4d87-9fb5-d014eb69a8cf'::uuid, '0f49d25a-b01b-4edd-89bd-5457f5c6459e'::uuid, 'NAS南林間', 'sports-club-nas-minamirinkan-index',
    null, '神奈川県'::text, '大和市'::text, null,
    35.49374, 139.448273, null,
    'https://www.nas-club.co.jp/minamirinkan/index.html'::text, 'https://www.nas-club.co.jp/minamirinkan/index.html'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '0ab423f6-ce0d-4457-b9a9-051705e2b2c6'::uuid, '8e66d169-68bf-4da1-8ed7-42307976e4ab'::uuid, 'セントラルスポーツ生涯学習プラザ', 'central-p-yachiyo',
    '276-0042'::text, '千葉県'::text, '八千代市'::text, 'ゆりのき台3-7-3 セントラルスポーツ生涯学習プラザ内'::text,
    35.729183, 140.099994, null,
    'https://www.central.co.jp/club/p-yachiyo/'::text, 'https://www.central.co.jp/club/p-yachiyo/'::text, 'fitness_club'::text,
    true, '2026-08-09T12:29:34.761+00:00'::timestamptz
  ),
  (
    '0ad9211c-42ac-4c3c-969b-c4c99e1c7bba'::uuid, '8e66d169-68bf-4da1-8ed7-42307976e4ab'::uuid, 'セントラルフィットネスクラブ 府中', 'central-fuchu',
    null, '東京都'::text, null, null,
    35.669737, 139.485605, null,
    'https://www.central.co.jp/club/fuchu/'::text, 'https://www.central.co.jp/club/fuchu/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '0b2edc28-bf3f-47e0-b5b0-3303cf50a620'::uuid, 'bef520a9-236f-4ef9-b59d-28ae328090ca'::uuid, 'メガロス 立川北館', 'megalos-tachikawa-kita',
    null, '東京都'::text, '立川市'::text, null,
    35.696514, 139.412796, null,
    'https://megalos.co.jp/tachikawa_kita/'::text, 'https://megalos.co.jp/tachikawa_kita/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '0c1a85bf-eccd-48b7-af72-dd0a03fca018'::uuid, 'f0c8c2f9-103a-4b7f-a385-5b0bb4a29aec'::uuid, '瑞江店', 'tipness-shp076',
    null, '東京都'::text, '江戸川区'::text, null,
    35.692341, 139.896212, null,
    'https://tip.tipness.co.jp/shop_info/SHP076/'::text, 'https://tip.tipness.co.jp/shop_info/SHP076/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '0c836cba-bc37-4724-a9f1-90d9a51ec2f6'::uuid, 'b04baf0e-ded3-48f3-a2d9-127ae8f7c817'::uuid, 'JEXER 板橋', 'jexer-itabashi',
    '114-0023'::text, '東京都'::text, '北区'::text, '滝野川 7-4-1'::text,
    35.745, 139.7197, '板橋駅'::text,
    'https://www.jexer.jp/fitness/itabashi/'::text, 'https://www.jexer.jp/mb/itabashi/index.html'::text, 'fitness_spa'::text,
    true, '2026-04-14T05:34:31.732803+00:00'::timestamptz
  ),
  (
    '0c94c1ea-2b42-4901-9617-15b7585238d8'::uuid, '0f49d25a-b01b-4edd-89bd-5457f5c6459e'::uuid, 'NAS聖蹟桜ヶ丘', 'sports-club-nas-seisekisakuragaoka-index',
    '206-0011'::text, '東京都'::text, '多摩市'::text, '関戸1-7-5 京王聖蹟桜ヶ丘ショッピングセンターC館3F'::text,
    null, null, '京王線 聖蹟桜ヶ丘駅'::text,
    'https://www.nas-club.co.jp/seisekisakuragaoka/index.html'::text, 'https://www.nas-club.co.jp/seisekisakuragaoka/index.html'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '0d6c4838-daa4-45ba-abaa-e61c82321b9d'::uuid, 'ee1927f5-3d6d-4e4e-b632-ad9210540d56'::uuid, 'コナミスポーツ テニススクール 大宮', 'konami-sports-000355',
    null, '埼玉県'::text, 'さいたま市大宮区桜木町'::text, null,
    35.90699, 139.621796, null,
    'https://information.konamisportsclub.jp/ksc/000355/'::text, 'https://information.konamisportsclub.jp/ksc/000355/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '0da31bbf-a76f-4718-86ee-11e25da011b1'::uuid, 'dd9e21fe-f2a1-4728-92f8-8c89fa83931e'::uuid, '府中東京', 'golds-gym-13240',
    '183-0022'::text, '東京都'::text, '府中市'::text, '宮西町1-4-1 府中トーセイビルI 4F'::text,
    35.671703, 139.478622, '京王線『府中駅』南口より徒歩１分 / 〈府中駅からのアクセス〉 / ・京王線府中駅南口を出て右へ / ・八王子方面の階段を降りて正面の横断歩道を渡り左へ / ・けやき並木通りを大國魂神社方面に約100m進んで頂きます / 〈府中本町駅からのアクセス〉 / ・改札を出て右へ / ・『府中本町駅入り口』（1つ目）の信号を左へ / ・『府中市役所前』（2つ目）の信号を右へ / ・大國魂神社前のT字路を左折し約130m進んで頂きます / 〈お車でのアクセス〉 / ・国道20号線で『寿町三丁目』の交差点を南へ / ・『合同庁舎入口』（2つ目）の信号を左折 / ・約120m進むと、左手にRAKU SPA station府中駐車場がございます'::text,
    'https://www.goldsgym.jp/shop/fuchu-tokyo/'::text, 'https://www.goldsgym.jp/shop/fuchu-tokyo/'::text, 'fitness_club'::text,
    true, '2026-08-13T10:50:11.569+00:00'::timestamptz
  ),
  (
    '0e3962b2-9535-4437-bb90-5dd70219b18a'::uuid, '8e66d169-68bf-4da1-8ed7-42307976e4ab'::uuid, 'セントラルウェルネスクラブ24 葛西', 'central-cw-kasai',
    null, '東京都'::text, null, null,
    35.664596, 139.871885, null,
    'https://www.central.co.jp/club/cw-kasai/'::text, 'https://www.central.co.jp/club/cw-kasai/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '0f236465-ab4c-4351-b1c1-dfc75f6dd43c'::uuid, '8e66d169-68bf-4da1-8ed7-42307976e4ab'::uuid, 'セントラルウェルネスクラブ 成瀬', 'central-w-naruse',
    '194-0011'::text, '東京都'::text, '町田市'::text, '成瀬が丘2-28-1'::text,
    35.535534, 139.471211, null,
    'https://www.central.co.jp/club/w-naruse/'::text, 'https://www.central.co.jp/club/w-naruse/'::text, 'fitness_club'::text,
    true, '2026-08-09T12:29:34.76+00:00'::timestamptz
  ),
  (
    '0f863ce4-a2f2-480b-b1c8-84a315891385'::uuid, 'ee1927f5-3d6d-4e4e-b632-ad9210540d56'::uuid, 'コナミスポーツクラブ 船堀', 'konami-sports-003964',
    null, '東京都'::text, '江戸川区'::text, null,
    35.683487, 139.863815, null,
    'https://information.konamisportsclub.jp/ksc/003964/'::text, 'https://information.konamisportsclub.jp/ksc/003964/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '0fc2f970-9ed9-4aaf-b841-b8d133fcfd65'::uuid, 'f0c8c2f9-103a-4b7f-a385-5b0bb4a29aec'::uuid, '藤沢店', 'tipness-shp013',
    null, '神奈川県'::text, '藤沢市'::text, null,
    35.338208, 139.484519, null,
    'https://tip.tipness.co.jp/shop_info/SHP013/'::text, 'https://tip.tipness.co.jp/shop_info/SHP013/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '10080990-dd5c-4b51-94f5-f905631b560b'::uuid, 'bef520a9-236f-4ef9-b59d-28ae328090ca'::uuid, 'メガロス 葛飾', 'megalos-katsushika',
    null, '東京都'::text, '葛飾区'::text, null,
    35.736729, 139.839722, null,
    'https://megalos.co.jp/katsushika/'::text, 'https://megalos.co.jp/katsushika/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '10da182a-a717-4671-a56c-b73c4d573c2b'::uuid, 'f0c8c2f9-103a-4b7f-a385-5b0bb4a29aec'::uuid, '鶴見店', 'tipness-shp084',
    null, '神奈川県'::text, '横浜市'::text, null,
    35.508401, 139.677668, null,
    'https://tip.tipness.co.jp/shop_info/SHP084/'::text, 'https://tip.tipness.co.jp/shop_info/SHP084/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '11a70808-f4ce-4db8-ac4c-ad36b7455ff9'::uuid, '8e66d169-68bf-4da1-8ed7-42307976e4ab'::uuid, 'ゆうぽうと世田谷レクセンター', 'central-setagaya-rec',
    null, '東京都'::text, null, null,
    35.61968, 139.610489, null,
    'https://www.central.co.jp/club/setagaya-rec/'::text, 'https://www.central.co.jp/club/setagaya-rec/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '11c7c552-2f99-4191-8a4b-2602893c2b0f'::uuid, 'f0c8c2f9-103a-4b7f-a385-5b0bb4a29aec'::uuid, '喜多見店', 'tipness-shp034',
    null, '東京都'::text, '世田谷区'::text, null,
    35.638018, 139.589276, null,
    'https://tip.tipness.co.jp/shop_info/SHP034/'::text, 'https://tip.tipness.co.jp/shop_info/SHP034/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '11cbe1ac-68bf-452f-b234-f3ad59d23472'::uuid, '8e66d169-68bf-4da1-8ed7-42307976e4ab'::uuid, 'セントラルスポーツ ジム24 亀有', 'central-gc24-kameari',
    null, '東京都'::text, null, null,
    35.763392, 139.846487, null,
    'https://www.central.co.jp/club/gc24-kameari/'::text, 'https://www.central.co.jp/club/gc24-kameari/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '11f1aa35-0559-43a4-9cdb-1bc2e511683e'::uuid, 'bef520a9-236f-4ef9-b59d-28ae328090ca'::uuid, 'メガロス 小岩', 'megalos-koiwa',
    null, '東京都'::text, '江戸川区'::text, null,
    35.732491, 139.881607, null,
    'https://megalos.co.jp/koiwa/'::text, 'https://megalos.co.jp/koiwa/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '14b57a02-7162-4d20-8d1f-972a986efe25'::uuid, '8e66d169-68bf-4da1-8ed7-42307976e4ab'::uuid, 'セントラルフィットネスクラブ24自由が丘', 'central-jiyugaoka',
    '152-0031'::text, '東京都'::text, '目黒区'::text, '中根1-14-17'::text,
    35.615313, 139.671361, null,
    'https://www.central.co.jp/club/jiyugaoka/'::text, 'https://www.central.co.jp/club/jiyugaoka/'::text, 'fitness_club'::text,
    true, '2026-08-09T12:29:34.761+00:00'::timestamptz
  ),
  (
    '15048f39-6e49-4dc9-9dd7-f162ad9d9836'::uuid, 'f0c8c2f9-103a-4b7f-a385-5b0bb4a29aec'::uuid, '川崎店', 'tipness-shp056',
    null, '神奈川県'::text, '川崎市'::text, null,
    35.530179, 139.701786, null,
    'https://tip.tipness.co.jp/shop_info/SHP056/'::text, 'https://tip.tipness.co.jp/shop_info/SHP056/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '164f5be8-e1f3-4c74-9dd1-ffeb4a1c65bd'::uuid, 'bef520a9-236f-4ef9-b59d-28ae328090ca'::uuid, 'メガロス東小金井学童クラブ', 'megalos-megalos-wp-higashikoganei',
    null, '東京都'::text, '小金井市'::text, null,
    35.702507, 139.527008, null,
    'https://megalos.co.jp/megalos_wp/higashikoganei/'::text, 'https://megalos.co.jp/megalos_wp/higashikoganei/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '1660c395-8107-4577-a20e-d41fd0e7b09e'::uuid, '0f49d25a-b01b-4edd-89bd-5457f5c6459e'::uuid, 'ホットヨガスタジオ美温 東京オペラシティ', 'sports-club-nas-store-operacity-index',
    null, '東京都'::text, '新宿区'::text, null,
    35.684101, 139.685852, null,
    'http://www.bion-yoga.jp/store/operacity/index.html'::text, 'http://www.bion-yoga.jp/store/operacity/index.html'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '168abfae-3d6a-4d21-8121-d3f486bba370'::uuid, 'f0c8c2f9-103a-4b7f-a385-5b0bb4a29aec'::uuid, '宮崎台店', 'tipness-shp026',
    null, '神奈川県'::text, '川崎市'::text, null,
    35.586486, 139.590086, null,
    'https://tip.tipness.co.jp/shop_info/SHP026/'::text, 'https://tip.tipness.co.jp/shop_info/SHP026/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '17ec32f7-7e80-44bf-a3c5-9be6b5381b6d'::uuid, 'dd9e21fe-f2a1-4728-92f8-8c89fa83931e'::uuid, '笹塚東京', 'golds-gym-2222',
    '151-0073'::text, '東京都'::text, '渋谷区'::text, '笹塚1-61-8​​ホテルブーゲンビリア新宿​内​ B​1F・B2F'::text,
    35.673157, 139.663559, '京王線「笹塚駅」より徒歩5分（ドコモショップ横） / ■笹塚駅からの道のりは こちら'::text,
    'https://www.goldsgym.jp/shop/sasazuka-tokyo/'::text, 'https://www.goldsgym.jp/shop/sasazuka-tokyo/'::text, 'fitness_club'::text,
    true, '2026-08-13T10:50:11.569+00:00'::timestamptz
  ),
  (
    '182a59c2-3803-4f05-b29e-50bd173edb35'::uuid, '0f49d25a-b01b-4edd-89bd-5457f5c6459e'::uuid, 'NAS蕨', 'sports-club-nas-warabi-index',
    null, '埼玉県'::text, '蕨市'::text, null,
    35.826038, 139.689926, null,
    'https://www.nas-club.co.jp/warabi/index.html'::text, 'https://www.nas-club.co.jp/warabi/index.html'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '185aa989-799f-44a9-b091-6d2b2d1f61a0'::uuid, 'bef520a9-236f-4ef9-b59d-28ae328090ca'::uuid, 'メガロス ルフレ立川南ー女性専用スタジオー', 'megalos-tachikawa-reflet',
    null, '東京都'::text, '立川市'::text, null,
    35.696514, 139.412796, null,
    'https://megalos.co.jp/tachikawa_reflet/'::text, 'https://megalos.co.jp/tachikawa_reflet/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '18dc9389-1c37-461c-80be-650c6ff23651'::uuid, '0f49d25a-b01b-4edd-89bd-5457f5c6459e'::uuid, 'Premium Sports Club NAS 銀座（プレミアム店舗）', 'sports-club-nas-ginza-index',
    null, '東京都'::text, '中央区'::text, null,
    35.674328, 139.766403, null,
    'https://www.nas-club.co.jp/ginza/index.html'::text, 'https://www.nas-club.co.jp/ginza/index.html'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '18e4d786-21fa-42be-90a1-5a46bbbd09cf'::uuid, 'ee1927f5-3d6d-4e4e-b632-ad9210540d56'::uuid, 'コナミスポーツクラブ たまプラーザ', 'konami-sports-006026',
    null, '神奈川県'::text, '横浜市青葉区美しが丘'::text, null,
    35.579865, 139.555603, null,
    'https://information.konamisportsclub.jp/ksc/006026/'::text, 'https://information.konamisportsclub.jp/ksc/006026/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '19bbc276-298f-4900-8d49-d3d6c57b6e54'::uuid, '0f49d25a-b01b-4edd-89bd-5457f5c6459e'::uuid, 'ホットヨガスタジオPURUMO 篠崎', 'sports-club-nas-store-shinozaki',
    null, '東京都'::text, '江戸川区'::text, null,
    35.706078, 139.904526, null,
    'http://purumo.jp/store/shinozaki/'::text, 'http://purumo.jp/store/shinozaki/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '19eb2e11-3c18-443a-aadc-8d729bb760a1'::uuid, 'bef520a9-236f-4ef9-b59d-28ae328090ca'::uuid, 'メガロス 日比谷シャンテ', 'megalos-hibiya',
    null, '東京都'::text, '千代田区'::text, null,
    35.672913, 139.759964, null,
    'https://megalos.co.jp/hibiya/'::text, 'https://megalos.co.jp/hibiya/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '1dcd10e5-4b9a-4633-bc1d-1be9edcb75b8'::uuid, '8e66d169-68bf-4da1-8ed7-42307976e4ab'::uuid, 'セントラルフィットネスクラブ24 藤沢', 'central-fujisawa',
    '251-0026'::text, '神奈川県'::text, '藤沢市'::text, '鵠沼東2-3-101'::text,
    35.335035, 139.490643, null,
    'https://www.central.co.jp/club/fujisawa/'::text, 'https://www.central.co.jp/club/fujisawa/'::text, 'fitness_club'::text,
    true, '2026-08-09T12:29:34.761+00:00'::timestamptz
  ),
  (
    '1e17baad-434b-4eb5-b860-fe3224307673'::uuid, '0f49d25a-b01b-4edd-89bd-5457f5c6459e'::uuid, 'NAS篠崎', 'sports-club-nas-shinozaki-index',
    '133-0061'::text, '東京都'::text, '江戸川区'::text, '篠崎町2-6-21'::text,
    null, null, '都営新宿線 篠崎駅南口 徒歩2分'::text,
    'https://www.nas-club.co.jp/shinozaki/index.html'::text, 'https://www.nas-club.co.jp/shinozaki/index.html'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '1e1dc6eb-ec16-4850-978a-ac3c513f55ab'::uuid, 'dd9e21fe-f2a1-4728-92f8-8c89fa83931e'::uuid, '原宿東京', 'golds-gym-13150',
    '150-0001'::text, '東京都'::text, '渋谷区'::text, '神宮前6-31-17V28 4F・3F・B2F'::text,
    35.668793, 139.704422, 'JR山手線原宿駅(表参道口)から　徒歩3分 / ・表参道口改札を出て右折し、信号を渡って直進します。 / ・表参道通りを正面に見て左折し、ソフトバンク正面の横断歩道を渡ります。 / ・左手に見えるハリーポッターの建物に入り、正面の左側エレベーターで4階へ上がってください。 / 東京メトロ　明治神宮前駅(千代田線・副都心線)から　徒歩1分 / ・6番出口正面のエレベーターに乗ると、4階のフロントに直通します。 / ・B2Fにも入口に繋がるエレベーターがあります。 / ※雨の日でも濡れることなく来店できて便利です。'::text,
    'https://www.goldsgym.jp/shop/harajuku-tokyo/'::text, 'https://www.goldsgym.jp/shop/harajuku-tokyo/'::text, 'fitness_club'::text,
    true, '2026-08-13T10:50:11.569+00:00'::timestamptz
  ),
  (
    '1ea5db28-281b-4957-b98e-6cfff45115f3'::uuid, 'ee1927f5-3d6d-4e4e-b632-ad9210540d56'::uuid, 'コナミスポーツクラブ 池袋', 'konami-sports-004486',
    null, '東京都'::text, '豊島区東池袋'::text, null,
    35.727917, 139.719849, null,
    'https://information.konamisportsclub.jp/ksc/004486/'::text, 'https://information.konamisportsclub.jp/ksc/004486/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '201a101d-6d8b-43a3-9c12-c7235e1380d4'::uuid, 'f0c8c2f9-103a-4b7f-a385-5b0bb4a29aec'::uuid, '南行徳店', 'tipness-shp060',
    null, '千葉県'::text, '市川市'::text, null,
    35.673154, 139.900651, null,
    'https://tip.tipness.co.jp/shop_info/SHP060/'::text, 'https://tip.tipness.co.jp/shop_info/SHP060/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '210b096b-02f9-49cc-add5-2dce06e8f209'::uuid, 'bef520a9-236f-4ef9-b59d-28ae328090ca'::uuid, 'メガロス ルフレ みなとみらいー女性専用スタジオー', 'megalos-minatomirai-reflet',
    null, '神奈川県'::text, '横浜市'::text, null,
    35.459259, 139.626877, null,
    'https://megalos.co.jp/minatomirai_reflet/'::text, 'https://megalos.co.jp/minatomirai_reflet/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '22ab074f-fc13-41df-9f2b-d99705f27c0d'::uuid, 'dd9e21fe-f2a1-4728-92f8-8c89fa83931e'::uuid, '横浜馬車道（フランチャイズ店）', 'golds-gym-20210924',
    '231-0005'::text, '神奈川県'::text, '中区'::text, '本町4-43A-PLACE馬車道'::text,
    35.449142, 139.637439, 'みなとみらい線　馬車道駅「7番出口」より徒歩１分'::text,
    'https://www.goldsgym.jp/shop/yokohama-bashamichi/'::text, 'https://www.goldsgym.jp/shop/yokohama-bashamichi/'::text, 'fitness_club'::text,
    true, '2026-08-13T10:50:11.57+00:00'::timestamptz
  ),
  (
    '244d14a0-ad1c-47b0-8ed4-d8d29895854e'::uuid, '8e66d169-68bf-4da1-8ed7-42307976e4ab'::uuid, 'セントラルフィットネスクラブ24 東松山高坂', 'central-cf-higashimatsuyama',
    '355-0048'::text, '埼玉県'::text, '東松山市'::text, 'あずま町3-1-2 C棟'::text,
    36.003295, 139.406313, null,
    'https://www.central.co.jp/club/cf-higashimatsuyama/'::text, 'https://www.central.co.jp/club/cf-higashimatsuyama/'::text, 'fitness_club'::text,
    true, '2026-08-09T12:29:34.761+00:00'::timestamptz
  ),
  (
    '25a6905c-300f-48c6-9b71-8b752dce69cb'::uuid, '8e66d169-68bf-4da1-8ed7-42307976e4ab'::uuid, 'セントラルフィットネスクラブ24 本八幡', 'central-cf-motoyawata',
    '272-0021'::text, '千葉県'::text, '市川市'::text, '八幡3-4-1 アクス本八幡 B1F'::text,
    35.723364, 139.926525, null,
    'https://www.central.co.jp/club/cf-motoyawata/'::text, 'https://www.central.co.jp/club/cf-motoyawata/'::text, 'fitness_club'::text,
    true, '2026-08-09T12:29:34.761+00:00'::timestamptz
  ),
  (
    '26739c76-fdde-4e5c-9ba9-dbaaf1877683'::uuid, '8e66d169-68bf-4da1-8ed7-42307976e4ab'::uuid, 'トーアセントラルフィットネスクラブ 阿佐谷', 'central-toa-asagaya',
    null, '東京都'::text, null, null,
    35.705246, 139.635007, null,
    'https://www.central.co.jp/club/toa-asagaya/'::text, 'https://www.central.co.jp/club/toa-asagaya/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '27327d27-dc03-4b1c-87f1-32b77b14a42b'::uuid, 'ee1927f5-3d6d-4e4e-b632-ad9210540d56'::uuid, 'コナミスポーツクラブ 新百合ヶ丘', 'konami-sports-004488',
    null, '神奈川県'::text, '川崎市麻生区上麻生'::text, null,
    null, null, null,
    'https://information.konamisportsclub.jp/ksc/004488/'::text, 'https://information.konamisportsclub.jp/ksc/004488/'::text, 'fitness_club'::text,
    false, null
  ),
  (
    '27d0e5a5-2882-40ba-b4ba-e2e20c07de2a'::uuid, '0f49d25a-b01b-4edd-89bd-5457f5c6459e'::uuid, 'ホットヨガスタジオ BODY UP東大宮', 'sports-club-nas-bodyup-higashiomiya',
    null, '埼玉県'::text, 'さいたま市'::text, null,
    35.947292, 139.64183, null,
    'https://www.nas-club.co.jp/bodyup/higashiomiya/'::text, 'https://www.nas-club.co.jp/bodyup/higashiomiya/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '28e8a93d-afea-43b0-8298-e2cd02bb7bff'::uuid, '8e66d169-68bf-4da1-8ed7-42307976e4ab'::uuid, 'セントラルフィットネスクラブ24 下北沢', 'central-shimokitazawa',
    null, '東京都'::text, null, null,
    35.663087, 139.669923, null,
    'https://www.central.co.jp/club/shimokitazawa/'::text, 'https://www.central.co.jp/club/shimokitazawa/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '2902139c-55ea-46b5-8e20-f9ec780a1bdf'::uuid, 'dd9e21fe-f2a1-4728-92f8-8c89fa83931e'::uuid, '東中野東京', 'golds-gym-13130',
    '164-0003'::text, '東京都'::text, '中野区'::text, '東中野5-1-1ユニゾンモール 2F'::text,
    35.706509, 139.686829, 'JR総武線『東中野駅』東口改札を出て、 / 左手階段を降りて徒歩2分 / 都営大江戸線『東中野駅』A1出口より徒歩3分'::text,
    'https://www.goldsgym.jp/shop/higashi-nakano-tokyo/'::text, 'https://www.goldsgym.jp/shop/higashi-nakano-tokyo/'::text, 'fitness_club'::text,
    true, '2026-08-13T10:50:11.569+00:00'::timestamptz
  ),
  (
    '298260d6-d28d-44d6-bfe1-be7434636a9e'::uuid, '0f49d25a-b01b-4edd-89bd-5457f5c6459e'::uuid, 'NAS溝の口', 'sports-club-nas-mizonokuchi-index',
    null, '神奈川県'::text, '川崎市'::text, null,
    35.600491, 139.612717, null,
    'https://www.nas-club.co.jp/mizonokuchi/index.html'::text, 'https://www.nas-club.co.jp/mizonokuchi/index.html'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '2b2ee883-99c9-4c7f-9e9a-6cc60fbecfaf'::uuid, 'f0c8c2f9-103a-4b7f-a385-5b0bb4a29aec'::uuid, '武蔵藤沢店', 'tipness-shp046',
    null, '埼玉県'::text, '入間市'::text, null,
    35.819466, 139.413489, null,
    'https://tip.tipness.co.jp/shop_info/SHP046/'::text, 'https://tip.tipness.co.jp/shop_info/SHP046/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '2b30e721-1ffb-4150-8a71-c2cf866ce064'::uuid, 'ee1927f5-3d6d-4e4e-b632-ad9210540d56'::uuid, 'コナミスポーツクラブ 荻窪南口', 'konami-sports-006024',
    null, '東京都'::text, '杉並区荻窪'::text, null,
    35.70435, 139.622192, null,
    'https://information.konamisportsclub.jp/ksc/006024/'::text, 'https://information.konamisportsclub.jp/ksc/006024/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '2baffe57-a60b-441c-bcba-79fc8195f237'::uuid, '8e66d169-68bf-4da1-8ed7-42307976e4ab'::uuid, 'セントラルウェルネスクラブ 志木', 'central-shiki',
    '353-0004'::text, '埼玉県'::text, '志木市'::text, '本町5-16-21'::text,
    35.825544, 139.57732, null,
    'https://www.central.co.jp/club/shiki/'::text, 'https://www.central.co.jp/club/shiki/'::text, 'fitness_club'::text,
    true, '2026-08-09T12:29:34.761+00:00'::timestamptz
  ),
  (
    '2ce96b74-dd12-4f7c-8dec-9c2969912e85'::uuid, 'dd9e21fe-f2a1-4728-92f8-8c89fa83931e'::uuid, 'ノース東京', 'golds-gym-13120',
    '170-0004'::text, '東京都'::text, '豊島区'::text, '北大塚2-24-20永信ビル 3F'::text,
    35.733543, 139.728745, 'JR山手線『大塚駅』北口より徒歩2分 / 都電荒川線『大塚駅』より徒歩2分 / 都電荒川線『巣鴨新田駅』より徒歩2分'::text,
    'https://www.goldsgym.jp/shop/north-tokyo/'::text, 'https://www.goldsgym.jp/shop/north-tokyo/'::text, 'fitness_club'::text,
    true, '2026-08-13T10:50:11.569+00:00'::timestamptz
  ),
  (
    '2e43f2e9-3eff-41c0-93dd-912366e74d93'::uuid, 'ee1927f5-3d6d-4e4e-b632-ad9210540d56'::uuid, 'コナミスポーツクラブ 成増', 'konami-sports-007833',
    null, '東京都'::text, '板橋区成増'::text, null,
    35.780704, 139.630295, null,
    'https://information.konamisportsclub.jp/ksc/007833/'::text, 'https://information.konamisportsclub.jp/ksc/007833/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '2ead116f-c26b-440b-a424-499523a2a96d'::uuid, 'bef520a9-236f-4ef9-b59d-28ae328090ca'::uuid, 'メガロス 上永谷', 'megalos-kaminagaya',
    null, '神奈川県'::text, '横浜市'::text, null,
    35.39933, 139.572235, null,
    'https://megalos.co.jp/kaminagaya/'::text, 'https://megalos.co.jp/kaminagaya/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '2eb34665-7306-4c4a-8056-bb89f96df65d'::uuid, 'bef520a9-236f-4ef9-b59d-28ae328090ca'::uuid, 'メガロス 柏', 'megalos-kashiwa',
    null, '千葉県'::text, '柏市'::text, null,
    35.86372, 139.978546, null,
    'https://megalos.co.jp/kashiwa/'::text, 'https://megalos.co.jp/kashiwa/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '2f0eb4d9-dd5d-4411-9ef0-2899bf1d325f'::uuid, '8e66d169-68bf-4da1-8ed7-42307976e4ab'::uuid, 'セントラルウェルネスクラブ24 保谷', 'central-minamioizumi',
    null, '東京都'::text, null, null,
    35.747334, 139.569292, null,
    'https://www.central.co.jp/club/minamioizumi/'::text, 'https://www.central.co.jp/club/minamioizumi/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '2f7ad40c-ade1-43c3-a959-c4ba21b4f6cf'::uuid, 'bef520a9-236f-4ef9-b59d-28ae328090ca'::uuid, 'メガロス 玉川学園テニススクール', 'megalos-tamagawa',
    null, '東京都'::text, '町田市'::text, null,
    35.554913, 139.478973, null,
    'https://megalos.co.jp/tamagawa/'::text, 'https://megalos.co.jp/tamagawa/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '2fd6da8a-1764-4310-bc65-5761819a1414'::uuid, 'dd9e21fe-f2a1-4728-92f8-8c89fa83931e'::uuid, '行徳千葉アスレチックセンター', 'golds-gym-12150',
    '272-0132'::text, '千葉県'::text, '市'::text, '川市湊新田1-6-8スーパーセレクション 2F'::text,
    35.681, 139.912003, '東京メトロ 東西線『行徳駅』より徒歩3分 / 駅からの経路案内は こちら'::text,
    'https://www.goldsgym.jp/shop/gyotoku-chiba-athletic-center/'::text, 'https://www.goldsgym.jp/shop/gyotoku-chiba-athletic-center/'::text, 'fitness_club'::text,
    true, '2026-08-13T10:50:11.57+00:00'::timestamptz
  ),
  (
    '30156a18-9e61-491f-9e55-2c7d96a91ffb'::uuid, 'ee1927f5-3d6d-4e4e-b632-ad9210540d56'::uuid, 'コナミスポーツクラブ 川越', 'konami-sports-004447',
    null, '埼玉県'::text, '川越市鯨井新田'::text, null,
    35.935177, 139.421906, null,
    'https://information.konamisportsclub.jp/ksc/004447/'::text, 'https://information.konamisportsclub.jp/ksc/004447/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '317903f2-0565-4d44-8387-672cdad53ce2'::uuid, 'dd9e21fe-f2a1-4728-92f8-8c89fa83931e'::uuid, 'サウス東京', 'golds-gym-13230',
    '140-0011'::text, '東京都'::text, '品川区'::text, '東大井5-2-1おおい元気館 4F'::text,
    35.608265, 139.73555, 'JR 京浜東北線 「大井町駅」東口より徒歩１分 / ■大井町線からのアクセス→ こちら / ■京浜東北線（中央口）からのアクセス→ こちら'::text,
    'https://www.goldsgym.jp/shop/south-tokyo/'::text, 'https://www.goldsgym.jp/shop/south-tokyo/'::text, 'fitness_club'::text,
    true, '2026-08-13T10:50:11.569+00:00'::timestamptz
  ),
  (
    '31c554b5-36ce-4c97-b6bc-293b9c74e2f0'::uuid, '0f49d25a-b01b-4edd-89bd-5457f5c6459e'::uuid, 'ホットヨガスタジオ美温 新鎌ヶ谷', 'sports-club-nas-store-shinkamagaya-index',
    null, '千葉県'::text, '鎌ケ谷市'::text, null,
    35.780136, 140.001419, null,
    'http://www.bion-yoga.jp/store/shinkamagaya/index.html'::text, 'http://www.bion-yoga.jp/store/shinkamagaya/index.html'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '337ae852-7d5c-4773-9330-08c4a69988c3'::uuid, 'dd9e21fe-f2a1-4728-92f8-8c89fa83931e'::uuid, 'エクスプレス本川越埼玉', 'golds-gym-honkawagoe-saitama',
    '350-0043'::text, '埼玉県'::text, '川越市'::text, '新富町1丁目3番12'::text,
    35.916039, 139.482925, ''::text,
    'https://www.goldsgym.jp/shop/honkawagoe-saitama/'::text, 'https://www.goldsgym.jp/shop/honkawagoe-saitama/'::text, 'fitness_club'::text,
    true, '2026-08-13T10:50:11.57+00:00'::timestamptz
  ),
  (
    '34ec37a4-21de-4327-a76c-184c5600018e'::uuid, 'ee1927f5-3d6d-4e4e-b632-ad9210540d56'::uuid, 'コナミスポーツクラブ 市川', 'konami-sports-000401',
    null, '千葉県'::text, '市川市鬼高'::text, null,
    35.715031, 139.932663, null,
    'https://information.konamisportsclub.jp/ksc/000401/'::text, 'https://information.konamisportsclub.jp/ksc/000401/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '351f22af-0774-4ddf-97d2-8c62afdad522'::uuid, 'ee1927f5-3d6d-4e4e-b632-ad9210540d56'::uuid, 'コナミスポーツクラブ 二子玉川', 'konami-sports-004461',
    null, '東京都'::text, '世田谷区玉川'::text, null,
    35.615719, 139.627838, null,
    'https://information.konamisportsclub.jp/ksc/004461/'::text, 'https://information.konamisportsclub.jp/ksc/004461/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '35378a15-5eb1-4539-8996-87e753abe9dd'::uuid, 'dd9e21fe-f2a1-4728-92f8-8c89fa83931e'::uuid, '曳舟東京', 'golds-gym-18116',
    '131-0046'::text, '東京都'::text, '墨田区'::text, '京島1-47-10'::text,
    35.718689, 139.821793, '京成「曳舟駅」　東口改札　徒歩3分 / 東武「曳舟駅」　徒歩 9分 / ※東武「曳舟駅」からの道のりは こちら（PDF） / ※京成「曳舟駅」からの道のりは こちら（PDF）'::text,
    'https://www.goldsgym.jp/shop/hikifune-tokyo/'::text, 'https://www.goldsgym.jp/shop/hikifune-tokyo/'::text, 'fitness_club'::text,
    true, '2026-08-13T10:50:11.569+00:00'::timestamptz
  ),
  (
    '3567bde9-4641-497b-81c8-3067e41ece0d'::uuid, '0f49d25a-b01b-4edd-89bd-5457f5c6459e'::uuid, 'NAS光が丘', 'sports-club-nas-hikarigaoka-index',
    '179-0072'::text, '東京都'::text, '練馬区'::text, '光が丘5-1-1 光が丘IMA イマミセ5F'::text,
    null, null, '都営大江戸線 光が丘駅'::text,
    'https://www.nas-club.co.jp/hikarigaoka/index.html'::text, 'https://www.nas-club.co.jp/hikarigaoka/index.html'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '35b367b4-dea5-426e-98b4-5d56ef05aa83'::uuid, 'f0c8c2f9-103a-4b7f-a385-5b0bb4a29aec'::uuid, 'TIP.X TOKYO池袋', 'tipness-shp010',
    null, '東京都'::text, '豊島区'::text, null,
    35.728128, 139.709514, null,
    'https://tip.tipness.co.jp/shop_info/SHP010/'::text, 'https://tip.tipness.co.jp/shop_info/SHP010/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '382be847-fa4b-4a44-ad2e-09f74540d700'::uuid, '0f49d25a-b01b-4edd-89bd-5457f5c6459e'::uuid, 'NAS若葉台', 'sports-club-nas-wakabadai-index',
    null, '東京都'::text, '稲城市'::text, null,
    35.620197, 139.473724, null,
    'https://www.nas-club.co.jp/wakabadai/index.html'::text, 'https://www.nas-club.co.jp/wakabadai/index.html'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '38ee0fae-427d-454e-8716-263617475017'::uuid, 'f0c8c2f9-103a-4b7f-a385-5b0bb4a29aec'::uuid, '新小岩店', 'tipness-shp037',
    null, '東京都'::text, '葛飾区'::text, null,
    35.717099, 139.857231, null,
    'https://tip.tipness.co.jp/shop_info/SHP037/'::text, 'https://tip.tipness.co.jp/shop_info/SHP037/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '393cd8a5-1675-4127-a4bc-7821fd4f3949'::uuid, 'ee1927f5-3d6d-4e4e-b632-ad9210540d56'::uuid, 'コナミスポーツ テニススクール 西葛西', 'konami-sports-004062',
    null, '東京都'::text, '江戸川区西葛西'::text, null,
    35.663467, 139.858871, null,
    'https://information.konamisportsclub.jp/ksc/004062/'::text, 'https://information.konamisportsclub.jp/ksc/004062/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '3a242fe1-3d7c-4241-b526-d3139d5a602f'::uuid, 'dd9e21fe-f2a1-4728-92f8-8c89fa83931e'::uuid, '千葉NTジョイフル', 'golds-gym-20211026',
    '270-1331'::text, '千葉県'::text, '印西市'::text, '牧の原2-4'::text,
    35.806999, 140.155777, ''::text,
    'https://www.goldsgym.jp/shop/chiba-newtown-joyful-athletic-club-2/'::text, 'https://www.goldsgym.jp/shop/chiba-newtown-joyful-athletic-club-2/'::text, 'fitness_club'::text,
    true, '2026-08-13T10:50:11.569+00:00'::timestamptz
  ),
  (
    '3ac83341-7cba-4a7d-8cd0-910bbfe7a538'::uuid, '8e66d169-68bf-4da1-8ed7-42307976e4ab'::uuid, 'The Premier Club (ザ プリミアクラブ)', 'central-premier',
    '105-6003'::text, '東京都'::text, '港区'::text, '虎ノ門4-3-1 城山トラストタワー3F'::text,
    35.664654, 139.743242, null,
    'https://www.central.co.jp/club/premier/'::text, 'https://www.central.co.jp/club/premier/'::text, 'fitness_club'::text,
    true, '2026-08-09T12:29:34.761+00:00'::timestamptz
  ),
  (
    '3ad133e1-a9fd-41e9-a98f-7e15d0abd4fe'::uuid, '8e66d169-68bf-4da1-8ed7-42307976e4ab'::uuid, 'セントラルスポーツジム24金町', 'central-csg24-kanamachi',
    null, '東京都'::text, null, null,
    35.769819, 139.870142, null,
    'https://www.central.co.jp/club/csg24-kanamachi/'::text, 'https://www.central.co.jp/club/csg24-kanamachi/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '3c357975-c089-4e3b-800f-59353f264fb4'::uuid, '0f49d25a-b01b-4edd-89bd-5457f5c6459e'::uuid, 'NAS町屋', 'sports-club-nas-machiya-index',
    null, '東京都'::text, '荒川区'::text, null,
    35.741871, 139.779709, null,
    'https://www.nas-club.co.jp/machiya/index.html'::text, 'https://www.nas-club.co.jp/machiya/index.html'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '3c3e118a-2991-469a-b91f-7f2b966a3016'::uuid, '0f49d25a-b01b-4edd-89bd-5457f5c6459e'::uuid, 'NAS新川崎', 'sports-club-nas-shinkawasaki-index',
    null, '神奈川県'::text, '川崎市'::text, null,
    35.550671, 139.670135, null,
    'https://www.nas-club.co.jp/shinkawasaki/index.html'::text, 'https://www.nas-club.co.jp/shinkawasaki/index.html'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '3debb6ed-17d5-4f18-8f13-2195a6ab62ca'::uuid, '8e66d169-68bf-4da1-8ed7-42307976e4ab'::uuid, 'セントラルフィットネスクラブ24千葉ニュータウン', 'central-chiba-newtown',
    '270-1392'::text, '千葉県'::text, '印西市'::text, '中央北3-2 イオンモール千葉ニュータウン シネマ・スポーツ棟1F'::text,
    35.80132, 140.111, null,
    'https://www.central.co.jp/club/chiba_newtown/'::text, 'https://www.central.co.jp/club/chiba_newtown/'::text, 'fitness_club'::text,
    true, '2026-08-09T12:29:34.761+00:00'::timestamptz
  ),
  (
    '3e497f9d-59d0-444c-815c-5b9258851e9a'::uuid, 'dd9e21fe-f2a1-4728-92f8-8c89fa83931e'::uuid, 'さいたまスーパーアリーナ', 'golds-gym-11110',
    '330-0081'::text, '埼玉県'::text, 'さいたま市中央区'::text, '新都心8番地さいたまスーパーアリーナ 6F'::text,
    35.896194, 139.630676, 'JR（京浜東北線・宇都宮線・高崎線）『さいたま新都心駅』西口より徒歩3分 / JR埼京線『北与野駅』西口より徒歩5分'::text,
    'https://www.goldsgym.jp/shop/saitama-super-arena/'::text, 'https://www.goldsgym.jp/shop/saitama-super-arena/'::text, 'fitness_club'::text,
    true, '2026-08-13T10:50:11.57+00:00'::timestamptz
  ),
  (
    '3e4b05c0-3f9f-4c16-8430-2949a16beccd'::uuid, 'ee1927f5-3d6d-4e4e-b632-ad9210540d56'::uuid, 'コナミスポーツクラブ 妙典', 'konami-sports-004067',
    null, '千葉県'::text, '市川市妙典'::text, null,
    35.691811, 139.926605, null,
    'https://information.konamisportsclub.jp/ksc/004067/'::text, 'https://information.konamisportsclub.jp/ksc/004067/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '4083818b-5295-422e-a492-b11a80cee7ba'::uuid, 'ee1927f5-3d6d-4e4e-b632-ad9210540d56'::uuid, 'コナミスポーツクラブ 本店', 'konami-sports-004501',
    null, '東京都'::text, '品川区東品川'::text, null,
    35.60828, 139.745392, null,
    'https://information.konamisportsclub.jp/ksc/004501/'::text, 'https://information.konamisportsclub.jp/ksc/004501/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '411439e1-c682-4263-b41a-5612cfb136c7'::uuid, '8e66d169-68bf-4da1-8ed7-42307976e4ab'::uuid, 'セントラルウェルネスクラブ24 南千住', 'central-minamisenjyu',
    null, '東京都'::text, null, null,
    35.734671, 139.800585, null,
    'https://www.central.co.jp/club/minamisenjyu/'::text, 'https://www.central.co.jp/club/minamisenjyu/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '41c5e004-a3e1-4cc5-9eae-fccde499bd83'::uuid, '8e66d169-68bf-4da1-8ed7-42307976e4ab'::uuid, 'セントラルフィットネスクラブ 市川', 'central-ichikawa',
    '272-0034'::text, '千葉県'::text, '市川市'::text, '市川1-3-18 4F・5F'::text,
    35.72958, 139.909676, null,
    'https://www.central.co.jp/club/ichikawa/'::text, 'https://www.central.co.jp/club/ichikawa/'::text, 'fitness_club'::text,
    true, '2026-08-09T12:29:34.761+00:00'::timestamptz
  ),
  (
    '424cc279-6576-44f4-b9dc-b47d54940933'::uuid, '8e66d169-68bf-4da1-8ed7-42307976e4ab'::uuid, 'セントラルウェルネスクラブ24 桶川北本', 'central-kitamoto',
    '364-0014'::text, '埼玉県'::text, '北本市'::text, '二ツ家4-103-1'::text,
    36.011006, 139.551305, null,
    'https://www.central.co.jp/club/kitamoto/'::text, 'https://www.central.co.jp/club/kitamoto/'::text, 'fitness_club'::text,
    true, '2026-08-09T12:29:34.761+00:00'::timestamptz
  ),
  (
    '425b8c4f-17ec-4fdd-ae8f-12158d93b2c7'::uuid, 'b04baf0e-ded3-48f3-a2d9-127ae8f7c817'::uuid, 'JEXER Light Gym アーバン保土ヶ谷店', 'jexer-lightgym-hodogaya',
    null, '神奈川県'::text, '横浜市'::text, null,
    35.448349, 139.600281, null,
    'https://jexer.jp/lightgym/hodogaya/index.html'::text, 'https://jexer.jp/lightgym/hodogaya/index.html'::text, 'light_gym'::text,
    true, null
  ),
  (
    '430b0c5b-5273-48c9-97c5-5b78697274e3'::uuid, 'b04baf0e-ded3-48f3-a2d9-127ae8f7c817'::uuid, 'JEXER Light Gym シャポー市川店', 'jexer-lightgym-ichikawa',
    null, '千葉県'::text, '市川市'::text, null,
    35.72897, 139.907639, null,
    'https://jexer.jp/lightgym/ichikawa/index.html'::text, 'https://jexer.jp/lightgym/ichikawa/index.html'::text, 'light_gym'::text,
    true, null
  ),
  (
    '444cb45a-acaa-4136-9b04-cae047f1cf90'::uuid, 'ee1927f5-3d6d-4e4e-b632-ad9210540d56'::uuid, 'コナミスポーツクラブ 目黒青葉台', 'konami-sports-004446',
    null, '東京都'::text, '目黒区青葉台'::text, null,
    35.648643, 139.693359, null,
    'https://information.konamisportsclub.jp/ksc/004446/'::text, 'https://information.konamisportsclub.jp/ksc/004446/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '44d936d9-9619-42dc-a422-5b03fc8a9f4c'::uuid, 'b04baf0e-ded3-48f3-a2d9-127ae8f7c817'::uuid, 'JEXER 池袋', 'jexer-ikebukuro',
    '171-0021'::text, '東京都'::text, '豊島区'::text, '西池袋 1-6-1'::text,
    35.7295, 139.7109, '池袋駅'::text,
    'https://www.jexer.jp/fitness/ikebukuro/'::text, 'https://www.jexer.jp/mb/ikebukuro/index.html'::text, 'fitness_spa'::text,
    true, '2026-04-14T05:34:31.732803+00:00'::timestamptz
  ),
  (
    '44f3137a-8811-4765-ab8f-c6c58294245e'::uuid, 'dd9e21fe-f2a1-4728-92f8-8c89fa83931e'::uuid, 'イースト東京', 'golds-gym-13110',
    '136-0076'::text, '東京都'::text, '江東区'::text, '南砂3-3-6'::text,
    35.672211, 139.826416, '東京メトロ東西線 「南砂町」駅西口（１番出口）より徒歩3分'::text,
    'https://www.goldsgym.jp/shop/east-tokyo/'::text, 'https://www.goldsgym.jp/shop/east-tokyo/'::text, 'fitness_club'::text,
    true, '2026-08-13T10:50:11.568+00:00'::timestamptz
  ),
  (
    '46196deb-39ce-4893-9fc3-76f2ca51b9f7'::uuid, '8e66d169-68bf-4da1-8ed7-42307976e4ab'::uuid, '曽谷 セントラルスイムクラブ', 'central-soya',
    '272-0832'::text, '千葉県'::text, '市川市'::text, '曽谷4-2-6'::text,
    35.744964, 139.931601, null,
    'https://www.central.co.jp/club/soya/'::text, 'https://www.central.co.jp/club/soya/'::text, 'fitness_club'::text,
    true, '2026-08-09T12:29:34.761+00:00'::timestamptz
  ),
  (
    '464eecef-90b1-4b58-9037-6d60e669beff'::uuid, 'f0c8c2f9-103a-4b7f-a385-5b0bb4a29aec'::uuid, '横浜店', 'tipness-shp070',
    null, '神奈川県'::text, '横浜市'::text, null,
    35.465965, 139.617251, null,
    'https://tip.tipness.co.jp/shop_info/SHP070/'::text, 'https://tip.tipness.co.jp/shop_info/SHP070/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '465d7755-5ddf-44bb-93ed-8ee55e5dbd0f'::uuid, 'b04baf0e-ded3-48f3-a2d9-127ae8f7c817'::uuid, 'JEXER 四ツ谷', 'jexer-yotsuya',
    '160-0004'::text, '東京都'::text, '新宿区'::text, '四谷 1-5'::text,
    35.686, 139.7303, '四ツ谷駅'::text,
    'https://www.jexer.jp/fitness/yotsuya/'::text, 'https://www.jexer.jp/mb/yotsuya/index.html'::text, 'fitness_spa'::text,
    true, '2026-04-14T05:34:31.732803+00:00'::timestamptz
  ),
  (
    '4776a1a2-09a1-49f0-9264-986698ccf499'::uuid, '0f49d25a-b01b-4edd-89bd-5457f5c6459e'::uuid, 'フィットネス&スパNAS リバーシティ21', 'sports-club-nas-rivercity21-index',
    null, '東京都'::text, '中央区'::text, null,
    35.668316, 139.786987, null,
    'https://www.nas-club.co.jp/rivercity21/index.html'::text, 'https://www.nas-club.co.jp/rivercity21/index.html'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '47cf58fc-2d3f-400e-abbb-f09f99cce630'::uuid, 'ee1927f5-3d6d-4e4e-b632-ad9210540d56'::uuid, 'コナミスポーツクラブ 横浜', 'konami-sports-004079',
    null, '神奈川県'::text, '横浜市神奈川区沢渡'::text, null,
    35.470966, 139.617157, null,
    'https://information.konamisportsclub.jp/ksc/004079/'::text, 'https://information.konamisportsclub.jp/ksc/004079/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '48313d25-ca7d-417e-8909-323d7de35282'::uuid, 'dd9e21fe-f2a1-4728-92f8-8c89fa83931e'::uuid, 'ウエスト東京', 'golds-gym-13140',
    '164-0001'::text, '東京都'::text, '中野区'::text, '中野4-3-1サンクォーレタワー 3F'::text,
    35.708858, 139.66452, '中野駅（ＪＲ 総武線・中央線、東京メトロ 東西線）　北口より徒歩5分'::text,
    'https://www.goldsgym.jp/shop/west-tokyo/'::text, 'https://www.goldsgym.jp/shop/west-tokyo/'::text, 'fitness_club'::text,
    true, '2026-08-13T10:50:11.569+00:00'::timestamptz
  ),
  (
    '485f6f9b-4e6b-4e73-aa8b-0a1cf09cebcc'::uuid, 'f0c8c2f9-103a-4b7f-a385-5b0bb4a29aec'::uuid, 'イオンモール川口店', 'tipness-shp099',
    null, '埼玉県'::text, '川口市'::text, null,
    35.837593, 139.722916, null,
    'https://tip.tipness.co.jp/shop_info/SHP099/'::text, 'https://tip.tipness.co.jp/shop_info/SHP099/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '48640b21-4ba0-4cdd-8d23-43d6ec4154ef'::uuid, 'dd9e21fe-f2a1-4728-92f8-8c89fa83931e'::uuid, '聖蹟桜ヶ丘東京', 'golds-gym-191002',
    '206-0011'::text, '東京都'::text, '多摩市'::text, '関戸4-72ヴィータモールせいせき 6階'::text,
    35.649632, 139.447052, '駅前商業ビルVITA MALL SEISEKI6F　駅徒歩1分 / 京王線　聖蹟桜ヶ丘駅　西口改札出て左 / 館内各所で外気を取り入れた換気を実施しております。'::text,
    'https://www.goldsgym.jp/shop/seiseki-sakuragaoka-tokyo/'::text, 'https://www.goldsgym.jp/shop/seiseki-sakuragaoka-tokyo/'::text, 'fitness_club'::text,
    true, '2026-08-13T10:50:11.569+00:00'::timestamptz
  ),
  (
    '4a23ce70-8c98-4202-8f80-6a6c52f1a913'::uuid, 'b04baf0e-ded3-48f3-a2d9-127ae8f7c817'::uuid, 'JEXER 新小岩', 'jexer-shinkoiwa',
    '124-0024'::text, '東京都'::text, '葛飾区'::text, '新小岩 1-45-1'::text,
    35.7161, 139.8582, '新小岩駅'::text,
    'https://www.jexer.jp/fitness/shinkoiwa/'::text, 'https://www.jexer.jp/mb/shinkoiwa/index.html'::text, 'fitness_spa'::text,
    true, '2026-04-14T05:34:31.732803+00:00'::timestamptz
  ),
  (
    '4a929dc0-bece-4591-a236-bff7fbc64444'::uuid, 'dd9e21fe-f2a1-4728-92f8-8c89fa83931e'::uuid, '渋谷東京', 'golds-gym-13180',
    '150-0002'::text, '東京都'::text, '渋谷区'::text, '渋谷1-23-16cocoti 9F・10F・11F'::text,
    35.662025, 139.702377, '渋谷駅下車(JR各線・東京メトロ銀座線・半蔵門線・東急東横線 / 京王井の頭線・副都心線)明治通りを原宿方面に徒歩4分、 / 東京メトロB1番出口から徒歩1分 / レイヤード宮下パーク北街区目の前cocoti9F'::text,
    'https://www.goldsgym.jp/shop/shibuya-tokyo/'::text, 'https://www.goldsgym.jp/shop/shibuya-tokyo/'::text, 'fitness_club'::text,
    true, '2026-08-13T10:50:11.569+00:00'::timestamptz
  ),
  (
    '4a9830bc-f964-4246-9a60-3bbd0833cc6f'::uuid, '8e66d169-68bf-4da1-8ed7-42307976e4ab'::uuid, 'セントラルフィットネスクラブ24 武蔵小杉', 'central-musashikosugi',
    '211-0004'::text, '神奈川県'::text, '川崎市中原区'::text, '新丸子東3-1159'::text,
    35.573714, 139.662129, null,
    'https://www.central.co.jp/club/musashikosugi/'::text, 'https://www.central.co.jp/club/musashikosugi/'::text, 'fitness_club'::text,
    true, '2026-08-09T12:29:34.761+00:00'::timestamptz
  ),
  (
    '4ad263d4-204c-4b17-91a6-bdb6cd9c488e'::uuid, 'bef520a9-236f-4ef9-b59d-28ae328090ca'::uuid, 'メガロス 本八幡', 'megalos-motoyawata',
    null, '千葉県'::text, '市川市'::text, null,
    35.718903, 139.926605, null,
    'https://megalos.co.jp/motoyawata/'::text, 'https://megalos.co.jp/motoyawata/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '4ae21029-6c58-409c-a959-7c5dc2a725dc'::uuid, '0f49d25a-b01b-4edd-89bd-5457f5c6459e'::uuid, 'ホットヨガスタジオ美温 藤沢', 'sports-club-nas-store-fujisawa-index',
    null, '神奈川県'::text, '藤沢市'::text, null,
    35.340285, 139.485338, null,
    'http://www.bion-yoga.jp/store/fujisawa/index.html'::text, 'http://www.bion-yoga.jp/store/fujisawa/index.html'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '4b86a7bf-7534-4fee-ac5b-b99051aba54b'::uuid, 'ee1927f5-3d6d-4e4e-b632-ad9210540d56'::uuid, 'コナミスポーツクラブ 恵比寿', 'konami-sports-006023',
    null, '東京都'::text, '渋谷区広尾'::text, null,
    35.650364, 139.712311, null,
    'https://information.konamisportsclub.jp/ksc/006023/'::text, 'https://information.konamisportsclub.jp/ksc/006023/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '4bcd39d2-7c66-4929-b0a4-5667e8304252'::uuid, '8e66d169-68bf-4da1-8ed7-42307976e4ab'::uuid, 'セントラルスポーツクラブ 戸塚', 'central-totsuka',
    '245-0015'::text, '神奈川県'::text, '横浜市泉区'::text, '中田西4-37-1'::text,
    35.403931, 139.505543, null,
    'https://www.central.co.jp/club/totsuka/'::text, 'https://www.central.co.jp/club/totsuka/'::text, 'fitness_club'::text,
    true, '2026-08-09T12:29:34.761+00:00'::timestamptz
  ),
  (
    '4bdd7c7e-f36d-4e1e-8f19-a86163ee69f2'::uuid, 'ee1927f5-3d6d-4e4e-b632-ad9210540d56'::uuid, 'コナミスポーツクラブ 洋光台', 'konami-sports-004048',
    null, '神奈川県'::text, '横浜市磯子区洋光台'::text, null,
    35.379379, 139.594833, null,
    'https://information.konamisportsclub.jp/ksc/004048/'::text, 'https://information.konamisportsclub.jp/ksc/004048/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '4c5a52e9-8cb5-4c70-91c4-5a24e373323d'::uuid, '8e66d169-68bf-4da1-8ed7-42307976e4ab'::uuid, 'セントラルスポーツ ジムスタ ハレノテラス東大宮', 'central-gs-higashiomiya',
    '337-0006'::text, '埼玉県'::text, 'さいたま市見沼区'::text, '島町393 ハレノテラスB棟2F'::text,
    35.94556, 139.65121, null,
    'https://www.central.co.jp/club/gs-higashiomiya/'::text, 'https://www.central.co.jp/club/gs-higashiomiya/'::text, 'fitness_club'::text,
    true, '2026-08-09T12:29:34.761+00:00'::timestamptz
  ),
  (
    '4d3bd3ba-cb00-44be-bdd6-d9b901f73195'::uuid, 'dd9e21fe-f2a1-4728-92f8-8c89fa83931e'::uuid, '千葉ニュータウン', 'golds-gym-chiba-newtown',
    '270-1340'::text, '千葉県'::text, '印西市'::text, '中央南1-8千葉ニュータウン駅前センタービル 3階'::text,
    35.798595, 140.117126, '北総線千葉ニュータウン中央駅南口　徒歩1分'::text,
    'https://www.goldsgym.jp/shop/chiba-newtown/'::text, 'https://www.goldsgym.jp/shop/chiba-newtown/'::text, 'fitness_club'::text,
    true, '2026-08-13T10:50:11.569+00:00'::timestamptz
  ),
  (
    '4e05cd99-0d51-417b-b0a7-504b2bb3b392'::uuid, 'ee1927f5-3d6d-4e4e-b632-ad9210540d56'::uuid, 'コナミスポーツクラブ 一橋学園', 'konami-sports-004054',
    null, '東京都'::text, '小平市上水本町'::text, null,
    35.715714, 139.478317, null,
    'https://information.konamisportsclub.jp/ksc/004054/'::text, 'https://information.konamisportsclub.jp/ksc/004054/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '4e405c7e-9201-4c6e-981e-14fd219b602d'::uuid, '0f49d25a-b01b-4edd-89bd-5457f5c6459e'::uuid, 'ホットヨガスタジオ美温 溝の口', 'sports-club-nas-store-mizonokuchi-index',
    null, '神奈川県'::text, '川崎市'::text, null,
    35.600491, 139.612717, null,
    'http://www.bion-yoga.jp/store/mizonokuchi/index.html'::text, 'http://www.bion-yoga.jp/store/mizonokuchi/index.html'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '50497437-f4cb-43d8-8563-290951b2de7e'::uuid, 'dd9e21fe-f2a1-4728-92f8-8c89fa83931e'::uuid, '立川東京', 'golds-gym-20201101',
    '190-8507'::text, '東京都'::text, '立川市'::text, '曙町2-39-3立川高島屋S.C. 7階'::text,
    35.700424, 139.4133, '多摩地域最大のターミナル駅 立川駅北口から徒歩３分。'::text,
    'https://www.goldsgym.jp/shop/tachikawa-tokyo/'::text, 'https://www.goldsgym.jp/shop/tachikawa-tokyo/'::text, 'fitness_club'::text,
    true, '2026-08-13T10:50:11.569+00:00'::timestamptz
  ),
  (
    '5050299b-2a87-4ccd-9e96-0eafd4af0f3f'::uuid, 'f0c8c2f9-103a-4b7f-a385-5b0bb4a29aec'::uuid, '大泉学園店', 'tipness-shp028',
    null, '東京都'::text, '練馬区'::text, null,
    35.749725, 139.588208, null,
    'https://tip.tipness.co.jp/shop_info/SHP028/'::text, 'https://tip.tipness.co.jp/shop_info/SHP028/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '511973fa-6cd8-4a43-a504-8335156700ef'::uuid, 'f0c8c2f9-103a-4b7f-a385-5b0bb4a29aec'::uuid, '二俣川店', 'tipness-shp052',
    null, '神奈川県'::text, '横浜市'::text, null,
    35.463324, 139.531222, null,
    'https://tip.tipness.co.jp/shop_info/SHP052/'::text, 'https://tip.tipness.co.jp/shop_info/SHP052/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '51bca044-25e7-4610-91b1-04590a26da4a'::uuid, '8e66d169-68bf-4da1-8ed7-42307976e4ab'::uuid, 'ザバススポーツクラブ/藤が丘', 'central-csp-fujigaoka',
    '227-0043'::text, '神奈川県'::text, '横浜市青葉区'::text, '藤が丘1-36-1'::text,
    35.54363, 139.529639, null,
    'https://www.central.co.jp/club/csp-fujigaoka/'::text, 'https://www.central.co.jp/club/csp-fujigaoka/'::text, 'fitness_club'::text,
    true, '2026-08-09T12:29:34.761+00:00'::timestamptz
  ),
  (
    '52c6ec3d-cd0d-47f2-9407-16baab513f75'::uuid, 'f0c8c2f9-103a-4b7f-a385-5b0bb4a29aec'::uuid, '三軒茶屋店', 'tipness-shp051',
    null, '東京都'::text, '世田谷区'::text, null,
    35.64389, 139.671131, null,
    'https://tip.tipness.co.jp/shop_info/SHP051/'::text, 'https://tip.tipness.co.jp/shop_info/SHP051/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '52eba899-475e-4cc7-bf27-42591c2fa94f'::uuid, '8e66d169-68bf-4da1-8ed7-42307976e4ab'::uuid, 'セントラルフィットネスクラブ 亀有', 'central-kameari',
    null, '東京都'::text, null, null,
    35.766608, 139.848448, null,
    'https://www.central.co.jp/club/kameari/'::text, 'https://www.central.co.jp/club/kameari/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '55aea77b-0f52-4b72-849e-8aab4f5041e7'::uuid, 'f0c8c2f9-103a-4b7f-a385-5b0bb4a29aec'::uuid, '吉祥寺店', 'tipness-shp004',
    null, '東京都'::text, '武蔵野市'::text, null,
    35.701971, 139.580827, null,
    'https://tip.tipness.co.jp/shop_info/SHP004/'::text, 'https://tip.tipness.co.jp/shop_info/SHP004/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '569aecf8-aa02-41da-b37a-7e2e20f160fb'::uuid, 'dd9e21fe-f2a1-4728-92f8-8c89fa83931e'::uuid, '浜松町東京', 'golds-gym-13210',
    '105-0022'::text, '東京都'::text, '港区'::text, '海岸1-2-3汐留芝離宮ビルディング 2階'::text,
    35.656849, 139.759186, 'JR浜松町駅　北口改札を出て、徒歩2分 / 都営大江戸線/都営浅草線　大門駅　B1出口から徒歩2分'::text,
    'https://www.goldsgym.jp/shop/hamamatsucho-tokyo/'::text, 'https://www.goldsgym.jp/shop/hamamatsucho-tokyo/'::text, 'fitness_club'::text,
    true, '2026-08-13T10:50:11.569+00:00'::timestamptz
  ),
  (
    '56bf5c0b-9395-4c9c-968f-d5e1f57c6490'::uuid, 'dd9e21fe-f2a1-4728-92f8-8c89fa83931e'::uuid, '南大沢東京', 'golds-gym-10210',
    '192-0364'::text, '東京都'::text, '八王子市'::text, '南大沢2丁目30番地サザンウインズ南大沢 2F'::text,
    35.613979, 139.381302, '京王相模原線　南大沢駅　徒歩1分 / 駅からのアクセスは こちら'::text,
    'https://www.goldsgym.jp/shop/minami-osawa-tokyo/'::text, 'https://www.goldsgym.jp/shop/minami-osawa-tokyo/'::text, 'fitness_club'::text,
    true, '2026-08-13T10:50:11.569+00:00'::timestamptz
  ),
  (
    '57160390-2938-452a-9b7b-07ea951ecb81'::uuid, '8e66d169-68bf-4da1-8ed7-42307976e4ab'::uuid, 'ヨコハマフィットネスプラザ(セントラルスイムクラブ 横浜)', 'central-yokohama',
    '221-0865'::text, '神奈川県'::text, '横浜市神奈川区'::text, '片倉1-25ー16'::text,
    35.489357, 139.606499, null,
    'https://www.central.co.jp/club/yokohama/'::text, 'https://www.central.co.jp/club/yokohama/'::text, 'fitness_club'::text,
    true, '2026-08-09T12:29:34.761+00:00'::timestamptz
  ),
  (
    '588965e2-30e0-49fc-91c7-de141991e8e2'::uuid, 'bef520a9-236f-4ef9-b59d-28ae328090ca'::uuid, 'メガロス 調布', 'megalos-chofu',
    null, '東京都'::text, '調布市'::text, null,
    35.654728, 139.544235, null,
    'https://megalos.co.jp/chofu/'::text, 'https://megalos.co.jp/chofu/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '58b263a7-db8f-441d-b56a-0470dce96b9d'::uuid, 'dd9e21fe-f2a1-4728-92f8-8c89fa83931e'::uuid, '本八幡千葉', 'golds-gym-12180',
    '272-0021'::text, '千葉県'::text, '市'::text, '川市八幡2-15-10PATIO 8F'::text,
    35.721352, 139.927353, 'JR総武線　本八幡駅北口　徒歩30秒 / 都営新宿線　本八幡駅A2出口　徒歩1分 / ＜ A2出口を出たら総武線北口方面へ> / 京成本線　京成八幡駅2番出口　徒歩4分 / ＜ 2番出口を出たら総武線北口方面へ>'::text,
    'https://www.goldsgym.jp/shop/motoyawata-chiba/'::text, 'https://www.goldsgym.jp/shop/motoyawata-chiba/'::text, 'fitness_club'::text,
    true, '2026-08-13T10:50:11.57+00:00'::timestamptz
  ),
  (
    '595d83cc-5e45-43b1-9df9-d48602ce19e7'::uuid, 'ee1927f5-3d6d-4e4e-b632-ad9210540d56'::uuid, 'コナミスポーツクラブ 武蔵境', 'konami-sports-006028',
    null, '東京都'::text, '武蔵野市境南町'::text, null,
    35.70187, 139.5457, null,
    'https://information.konamisportsclub.jp/ksc/006028/'::text, 'https://information.konamisportsclub.jp/ksc/006028/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '5a8305ce-b2a3-4810-93e6-7d0bb45a122b'::uuid, '0f49d25a-b01b-4edd-89bd-5457f5c6459e'::uuid, 'ホットヨガスタジオ美温 高尾', 'sports-club-nas-store-takao-index',
    null, '東京都'::text, '八王子市'::text, null,
    35.643543, 139.289185, null,
    'http://www.bion-yoga.jp/store/takao/index.html'::text, 'http://www.bion-yoga.jp/store/takao/index.html'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '5cae9ce1-430f-4b97-a8df-82685e88917c'::uuid, 'b04baf0e-ded3-48f3-a2d9-127ae8f7c817'::uuid, 'JEXER Light Gym 大宮店', 'jexer-lightgym-omiya',
    null, '埼玉県'::text, 'さいたま市'::text, null,
    35.904289, 139.624069, null,
    'https://jexer.jp/lightgym/omiya/index.html'::text, 'https://jexer.jp/lightgym/omiya/index.html'::text, 'light_gym'::text,
    true, null
  ),
  (
    '5da19f77-98fc-41d9-a0b7-e0bd8077badf'::uuid, '8e66d169-68bf-4da1-8ed7-42307976e4ab'::uuid, 'セントラルフィットネスクラブ24青梅', 'central-ome',
    null, '東京都'::text, null, null,
    35.78954, 139.277091, null,
    'https://www.central.co.jp/club/ome/'::text, 'https://www.central.co.jp/club/ome/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '5e5f13d2-a1d5-43db-bb23-72e2d90e13c0'::uuid, '0f49d25a-b01b-4edd-89bd-5457f5c6459e'::uuid, 'NAS戸塚', 'sports-club-nas-totsuka-index',
    null, '神奈川県'::text, '横浜市'::text, null,
    35.402151, 139.535122, null,
    'https://www.nas-club.co.jp/totsuka/index.html'::text, 'https://www.nas-club.co.jp/totsuka/index.html'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '5eb4c5ef-ec13-46bb-a3f8-f9afe02bfa5e'::uuid, 'b04baf0e-ded3-48f3-a2d9-127ae8f7c817'::uuid, 'JEXER 赤羽', 'jexer-akabane',
    '115-0045'::text, '東京都'::text, '北区'::text, '赤羽 1-1-1'::text,
    35.7778, 139.7217, '赤羽駅'::text,
    'https://www.jexer.jp/fitness/akabane/'::text, 'https://www.jexer.jp/mb/akabane/index.html'::text, 'fitness_spa'::text,
    true, '2026-04-14T05:34:31.732803+00:00'::timestamptz
  ),
  (
    '5eb89bac-9dc8-49b9-b25e-758133fa2679'::uuid, 'f0c8c2f9-103a-4b7f-a385-5b0bb4a29aec'::uuid, '明大前店', 'tipness-shp062',
    null, '東京都'::text, '世田谷区'::text, null,
    35.668907, 139.650199, null,
    'https://tip.tipness.co.jp/shop_info/SHP062/'::text, 'https://tip.tipness.co.jp/shop_info/SHP062/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '5f4b9335-9717-4462-9109-f91ec989658e'::uuid, 'f0c8c2f9-103a-4b7f-a385-5b0bb4a29aec'::uuid, '王子店', 'tipness-shp096',
    null, '東京都'::text, '北区'::text, null,
    35.754129, 139.737126, null,
    'https://tip.tipness.co.jp/shop_info/SHP096/'::text, 'https://tip.tipness.co.jp/shop_info/SHP096/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '5fc7839a-b1e7-486a-8a80-ac7673850a2b'::uuid, 'dd9e21fe-f2a1-4728-92f8-8c89fa83931e'::uuid, '幕張千葉WBG', 'golds-gym-12120',
    '261-7101'::text, '千葉県'::text, '千葉市美浜区'::text, '中瀬2-6-1ワールドビジネスガーデンマリブダイニング 1F'::text,
    35.648041, 140.038834, '海浜幕張駅（JR京葉線・武蔵野線）南口より徒歩5分'::text,
    'https://www.goldsgym.jp/shop/makuhari-chiba-wbg/'::text, 'https://www.goldsgym.jp/shop/makuhari-chiba-wbg/'::text, 'fitness_club'::text,
    true, '2026-08-13T10:50:11.57+00:00'::timestamptz
  ),
  (
    '6483517d-07ba-434a-942f-a0aa53967958'::uuid, 'ee1927f5-3d6d-4e4e-b632-ad9210540d56'::uuid, 'コナミスポーツクラブ 川口', 'konami-sports-004060',
    null, '埼玉県'::text, '川口市宮町'::text, null,
    35.806213, 139.699142, null,
    'https://information.konamisportsclub.jp/ksc/004060/'::text, 'https://information.konamisportsclub.jp/ksc/004060/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '64d76b82-3bee-4e75-b86d-06b5ebe3fd94'::uuid, 'f0c8c2f9-103a-4b7f-a385-5b0bb4a29aec'::uuid, '東新宿店', 'tipness-shp082',
    null, '東京都'::text, '新宿区'::text, null,
    35.696619, 139.708387, null,
    'https://tip.tipness.co.jp/shop_info/SHP082/'::text, 'https://tip.tipness.co.jp/shop_info/SHP082/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '64e4f833-c98f-4687-9885-14a230e8d1f7'::uuid, '8e66d169-68bf-4da1-8ed7-42307976e4ab'::uuid, 'セントラルフィットネスクラブ 青砥', 'central-aoto',
    null, '東京都'::text, null, null,
    35.744347, 139.854732, null,
    'https://www.central.co.jp/club/aoto/'::text, 'https://www.central.co.jp/club/aoto/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '651beadc-a37a-48bf-ac0b-74f754db4ade'::uuid, 'ee1927f5-3d6d-4e4e-b632-ad9210540d56'::uuid, 'コナミスポーツクラブ 稲城', 'konami-sports-004085',
    null, '東京都'::text, '稲城市東長沼'::text, null,
    35.636536, 139.501068, null,
    'https://information.konamisportsclub.jp/ksc/004085/'::text, 'https://information.konamisportsclub.jp/ksc/004085/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '65cdb988-4b0b-4717-be43-4f219632b21e'::uuid, 'b04baf0e-ded3-48f3-a2d9-127ae8f7c817'::uuid, 'JEXER Pilates Studio NEWoMan横浜店', 'jexer-pilates-yokohama',
    null, '神奈川県'::text, '横浜市'::text, null,
    35.467613, 139.622757, null,
    'https://www.jexer.jp/pilatesstudio/yokohama/index.html'::text, 'https://www.jexer.jp/pilatesstudio/yokohama/index.html'::text, 'fitness_studio'::text,
    true, null
  ),
  (
    '66076b50-7ca1-4b40-9ea3-d1ae833d8abd'::uuid, 'dd9e21fe-f2a1-4728-92f8-8c89fa83931e'::uuid, '戸塚神奈川', 'golds-gym-14130',
    '244-0003'::text, '神奈川県'::text, '横浜市戸塚区'::text, '戸塚町10番地戸塚モディ 6F'::text,
    35.400505, 139.534561, ''::text,
    'https://www.goldsgym.jp/shop/totsuka-kanagawa/'::text, 'https://www.goldsgym.jp/shop/totsuka-kanagawa/'::text, 'fitness_club'::text,
    true, '2026-08-13T10:50:11.57+00:00'::timestamptz
  ),
  (
    '664b01e9-78d2-411c-b057-4dc97485f3f6'::uuid, 'b04baf0e-ded3-48f3-a2d9-127ae8f7c817'::uuid, 'JEXER 川崎', 'jexer-kawasaki',
    null, '神奈川県'::text, '川崎市'::text, null,
    35.528698, 139.693161, null,
    'https://www.jexer.jp/fitness/kawasaki/'::text, 'https://www.jexer.jp/fitness/kawasaki/'::text, 'fitness_spa'::text,
    true, null
  ),
  (
    '6712e78e-b781-435d-802e-1b4ac3b01b76'::uuid, 'dd9e21fe-f2a1-4728-92f8-8c89fa83931e'::uuid, '湘南神奈川', 'golds-gym-14170',
    '251-0047'::text, '神奈川県'::text, '藤沢市'::text, '辻堂2-7-1湘南パールビル 3・4F'::text,
    35.336494, 139.446548, ''::text,
    'https://www.goldsgym.jp/shop/shonan-kanagawa/'::text, 'https://www.goldsgym.jp/shop/shonan-kanagawa/'::text, 'fitness_club'::text,
    true, '2026-08-13T10:50:11.57+00:00'::timestamptz
  ),
  (
    '6909f440-0fc4-4551-bb2c-f9093d9d4f26'::uuid, 'bef520a9-236f-4ef9-b59d-28ae328090ca'::uuid, 'メガロス 日吉', 'megalos-hiyoshi',
    null, '神奈川県'::text, '横浜市'::text, null,
    35.545563, 139.64476, null,
    'https://megalos.co.jp/hiyoshi/'::text, 'https://megalos.co.jp/hiyoshi/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '69a84121-46ea-410e-b104-619ac07b5a85'::uuid, 'bef520a9-236f-4ef9-b59d-28ae328090ca'::uuid, 'メガロス キッズ錦糸町', 'megalos-kinshicho',
    null, '東京都'::text, '墨田区'::text, null,
    35.699387, 139.811615, null,
    'https://megalos.co.jp/kinshicho/'::text, 'https://megalos.co.jp/kinshicho/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '6a0ecd3f-2fe5-4cf4-8abd-f0e600219717'::uuid, '8e66d169-68bf-4da1-8ed7-42307976e4ab'::uuid, 'セントラルウェルネスクラブ24 京成小岩', 'central-cw-keiseikoiwa',
    null, '東京都'::text, null, null,
    35.743994, 139.881774, null,
    'https://www.central.co.jp/club/cw-keiseikoiwa/'::text, 'https://www.central.co.jp/club/cw-keiseikoiwa/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '6adde647-f74a-439e-8694-724a7225a70e'::uuid, 'dd9e21fe-f2a1-4728-92f8-8c89fa83931e'::uuid, '表参道東京', 'golds-gym-13160',
    '150-0001'::text, '東京都'::text, '渋谷区'::text, '神宮前4-3-2表参道スクエアビル 2・3F'::text,
    35.666824, 139.71109, '表参道駅(東京メトロ 銀座線・半蔵門線・千代田線)　A2出口より徒歩2分 / 明治神宮前駅(東京メトロ副都心・千代田線)　出口5より徒歩7分'::text,
    'https://www.goldsgym.jp/shop/omotesando-tokyo/'::text, 'https://www.goldsgym.jp/shop/omotesando-tokyo/'::text, 'fitness_club'::text,
    true, '2026-08-13T10:50:11.569+00:00'::timestamptz
  ),
  (
    '6b17b219-ca52-4668-bf29-682a07f97584'::uuid, '0f49d25a-b01b-4edd-89bd-5457f5c6459e'::uuid, 'NAS松戸', 'sports-club-nas-matsudo-index',
    null, '千葉県'::text, '松戸市'::text, null,
    35.784428, 139.899124, null,
    'https://www.nas-club.co.jp/matsudo/index.html'::text, 'https://www.nas-club.co.jp/matsudo/index.html'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '6bc863f7-6303-4120-8af7-90e8d193e5a1'::uuid, 'f0c8c2f9-103a-4b7f-a385-5b0bb4a29aec'::uuid, '中野店', 'tipness-shp007',
    null, '東京都'::text, '中野区'::text, null,
    35.705355, 139.66718, null,
    'https://tip.tipness.co.jp/shop_info/SHP007/'::text, 'https://tip.tipness.co.jp/shop_info/SHP007/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '6bd70d3b-ba8a-4572-8a82-69bbb1992040'::uuid, '8e66d169-68bf-4da1-8ed7-42307976e4ab'::uuid, 'ラヴィセントラルフィットネスクラブ 蒲田', 'central-lavie-kamata',
    null, '東京都'::text, null, null,
    35.555902, 139.712119, null,
    'https://www.central.co.jp/club/lavie-kamata/'::text, 'https://www.central.co.jp/club/lavie-kamata/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '6c020cab-4640-4d32-856f-c934f88f91a4'::uuid, 'b04baf0e-ded3-48f3-a2d9-127ae8f7c817'::uuid, 'JEXER sopra シャポー船橋店', 'jexer-sopra-funabashi',
    null, '千葉県'::text, '船橋市'::text, null,
    35.702137, 139.983231, null,
    'https://www.jexer.jp/sopra/funabashi/index.html'::text, 'https://www.jexer.jp/sopra/funabashi/index.html'::text, 'sopra'::text,
    true, null
  ),
  (
    '6dc5ffa2-5421-46c9-82cf-fc634b4b4549'::uuid, 'f0c8c2f9-103a-4b7f-a385-5b0bb4a29aec'::uuid, '下井草店', 'tipness-shp029',
    null, '東京都'::text, '杉並区'::text, null,
    35.72339, 139.624858, null,
    'https://tip.tipness.co.jp/shop_info/SHP029/'::text, 'https://tip.tipness.co.jp/shop_info/SHP029/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '6e54d33b-009d-45a8-928c-7ddb62e7da44'::uuid, 'ee1927f5-3d6d-4e4e-b632-ad9210540d56'::uuid, 'コナミスポーツ ジュニアスクール 西葛西', 'konami-sports-004046',
    null, '東京都'::text, '江戸川区西葛西'::text, null,
    35.66396, 139.858978, null,
    'https://information.konamisportsclub.jp/ksc/004046/'::text, 'https://information.konamisportsclub.jp/ksc/004046/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '6eccf134-363d-45a1-bedb-c1469748c5d5'::uuid, '8e66d169-68bf-4da1-8ed7-42307976e4ab'::uuid, 'セントラルフィットネスクラブ24月島・佃', 'central-tsukuda',
    null, '東京都'::text, null, null,
    35.669091, 139.783461, null,
    'https://www.central.co.jp/club/tsukuda/'::text, 'https://www.central.co.jp/club/tsukuda/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '6f8b8eff-8bd7-4b83-b18b-0121cf63d991'::uuid, 'dd9e21fe-f2a1-4728-92f8-8c89fa83931e'::uuid, '銀座中央', 'golds-gym-13205',
    '104-0061'::text, '東京都'::text, '中央区'::text, '銀座3丁目4-12文祥堂銀座ビル B1・B2F'::text,
    35.672558, 139.765289, 'JR有楽町駅中央口より徒歩5分 / 東京メトロ　日比谷線、銀座線　銀座駅A9出口より徒歩2分'::text,
    'https://www.goldsgym.jp/shop/ginza-chuo-2/'::text, 'https://www.goldsgym.jp/shop/ginza-chuo-2/'::text, 'fitness_club'::text,
    true, '2026-08-13T10:50:11.569+00:00'::timestamptz
  ),
  (
    '7030c555-c51d-4d5c-b9d5-ade8f985690f'::uuid, '8e66d169-68bf-4da1-8ed7-42307976e4ab'::uuid, 'セントラルウェルネスクラブ24 越谷', 'central-w-koshigaya',
    '343-0821'::text, '埼玉県'::text, '越谷市'::text, '瓦曽根1-20-35'::text,
    35.884726, 139.788081, null,
    'https://www.central.co.jp/club/w_koshigaya/'::text, 'https://www.central.co.jp/club/w_koshigaya/'::text, 'fitness_club'::text,
    true, '2026-08-09T12:29:34.761+00:00'::timestamptz
  ),
  (
    '7157a181-603e-429a-bac8-b45fa697a436'::uuid, 'dd9e21fe-f2a1-4728-92f8-8c89fa83931e'::uuid, '行徳千葉フィットネスセンター', 'golds-gym-12140',
    '272-0133'::text, '千葉県'::text, '市'::text, '川市行徳駅前2-3-1ポニービル 2F'::text,
    35.683121, 139.914185, '東京メトロ東西線『行徳駅』改札出て左　徒歩20秒　ドン・キホーテの2F / 駅からの経路案内は こちら'::text,
    'https://www.goldsgym.jp/shop/gyotoku-chiba-fitness-center/'::text, 'https://www.goldsgym.jp/shop/gyotoku-chiba-fitness-center/'::text, 'fitness_club'::text,
    true, '2026-08-13T10:50:11.57+00:00'::timestamptz
  ),
  (
    '73a4df85-88c1-4545-a74b-4fcf9a5ffaf8'::uuid, 'dd9e21fe-f2a1-4728-92f8-8c89fa83931e'::uuid, '幕張ベイパークアリーナ', 'golds-gym-12131',
    '261-0014'::text, '千葉県'::text, '千葉市美浜区'::text, '若葉3-1-37幕張ベイパークウェルネスセンター'::text,
    35.649914, 140.049454, '海浜幕張駅北口より徒歩13分 / バス：千葉海浜交通、ZOZOPARK停留所より徒歩3分'::text,
    'https://www.goldsgym.jp/shop/makuhari-baypark-arena/'::text, 'https://www.goldsgym.jp/shop/makuhari-baypark-arena/'::text, 'fitness_club'::text,
    true, '2026-08-13T10:50:11.57+00:00'::timestamptz
  ),
  (
    '743c3b39-3ff8-437f-834e-ee622f99a541'::uuid, '8e66d169-68bf-4da1-8ed7-42307976e4ab'::uuid, 'スタジオ ヨガピス 越谷レイクタウン', 'central-yogapis-koshigaya',
    '343-0828'::text, '埼玉県'::text, '越谷市'::text, 'レイクタウン8-11-1 レイクタウンオークラビル7F'::text,
    35.876097, 139.822688, null,
    'https://www.central.co.jp/club/yogapis_koshigaya/'::text, 'https://www.central.co.jp/club/yogapis_koshigaya/'::text, 'fitness_club'::text,
    true, '2026-08-09T12:29:34.761+00:00'::timestamptz
  ),
  (
    '74576ce5-3642-4e07-937e-bb8a29eba0ba'::uuid, 'dd9e21fe-f2a1-4728-92f8-8c89fa83931e'::uuid, 'サウス東京ANNEX', 'golds-gym-13220',
    '143-0023'::text, '東京都'::text, '大田区'::text, '山王2-4-1大森駅前ビル 6F・7F'::text,
    35.588875, 139.727402, 'JR京浜東北線『大森駅』西口より徒歩1分 / 大森駅からの行き方は こちら'::text,
    'https://www.goldsgym.jp/shop/south-tokyo-annex/'::text, 'https://www.goldsgym.jp/shop/south-tokyo-annex/'::text, 'fitness_club'::text,
    true, '2026-08-13T10:50:11.569+00:00'::timestamptz
  ),
  (
    '74cbc2b6-0e8a-47a1-851c-0ee1c5747176'::uuid, 'dd9e21fe-f2a1-4728-92f8-8c89fa83931e'::uuid, '吉川埼玉（フランチャイズ店）', 'golds-gym-11100',
    '342-0041'::text, '埼玉県'::text, '吉川市'::text, '保1-13-3ライフ吉川駅前店 2F'::text,
    35.878237, 139.844119, ''::text,
    'https://www.goldsgym.jp/shop/yoshikawa-saitama-%ef%bc%88fc%ef%bc%89/'::text, 'https://www.goldsgym.jp/shop/yoshikawa-saitama-%ef%bc%88fc%ef%bc%89/'::text, 'fitness_club'::text,
    true, '2026-08-13T10:50:11.57+00:00'::timestamptz
  ),
  (
    '7506536c-aa79-4717-9d24-1f49fc34e6b0'::uuid, 'b04baf0e-ded3-48f3-a2d9-127ae8f7c817'::uuid, 'JEXER 大宮', 'jexer-omiya-saitama',
    null, '埼玉県'::text, 'さいたま市'::text, null,
    35.909622, 139.621246, null,
    'https://www.jexer.jp/fitness/omiya/'::text, 'https://www.jexer.jp/fitness/omiya/'::text, 'fitness_spa'::text,
    true, null
  ),
  (
    '751fd6cc-2eca-4567-bc0d-221f267dfd14'::uuid, 'ee1927f5-3d6d-4e4e-b632-ad9210540d56'::uuid, 'コナミスポーツクラブ 西新井', 'konami-sports-004043',
    null, '東京都'::text, '足立区梅島'::text, null,
    35.778095, 139.790802, null,
    'https://information.konamisportsclub.jp/ksc/004043/'::text, 'https://information.konamisportsclub.jp/ksc/004043/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '7537e772-d986-4878-9a0a-b87394888bf2'::uuid, '8e66d169-68bf-4da1-8ed7-42307976e4ab'::uuid, 'スタジオ ヨガピス 稲毛海岸', 'central-yogapis-inagekaigan',
    '261-0004'::text, '千葉県'::text, '千葉市美浜区'::text, '高洲1-22-23 稲毛海岸ニイクラビル3F'::text,
    35.630065, 140.073873, null,
    'https://www.central.co.jp/club/yogapis_inagekaigan/'::text, 'https://www.central.co.jp/club/yogapis_inagekaigan/'::text, 'fitness_club'::text,
    true, '2026-08-09T12:29:34.761+00:00'::timestamptz
  ),
  (
    '765a55aa-e058-4058-bce4-f4e23c5ae671'::uuid, 'bef520a9-236f-4ef9-b59d-28ae328090ca'::uuid, 'メガロス 横浜天王町', 'megalos-yokohama',
    null, '神奈川県'::text, '横浜市'::text, null,
    35.454716, 139.600159, null,
    'https://megalos.co.jp/yokohama/'::text, 'https://megalos.co.jp/yokohama/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '78e2a73f-4ede-4f9c-be0f-dae40737751b'::uuid, 'ee1927f5-3d6d-4e4e-b632-ad9210540d56'::uuid, 'コナミスポーツクラブ 西船橋', 'konami-sports-004423',
    null, '千葉県'::text, '船橋市印内町'::text, null,
    35.706207, 139.959335, null,
    'https://information.konamisportsclub.jp/ksc/004423/'::text, 'https://information.konamisportsclub.jp/ksc/004423/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '79c1d97b-f4c3-46ae-a00b-58c27ba17635'::uuid, '0f49d25a-b01b-4edd-89bd-5457f5c6459e'::uuid, 'ホットヨガスタジオ BODY UP西葛西', 'sports-club-nas-bodyup-nishikasai',
    null, '東京都'::text, '江戸川区'::text, null,
    35.664047, 139.860092, null,
    'https://www.nas-club.co.jp/bodyup/nishikasai/'::text, 'https://www.nas-club.co.jp/bodyup/nishikasai/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '79ce671d-8b2f-4775-a3af-2f0a1d7d59b4'::uuid, 'ee1927f5-3d6d-4e4e-b632-ad9210540d56'::uuid, 'コナミスポーツクラブ 橋本', 'konami-sports-000584',
    null, '神奈川県'::text, '相模原市緑区西橋本'::text, null,
    35.597233, 139.337524, null,
    'https://information.konamisportsclub.jp/ksc/000584/'::text, 'https://information.konamisportsclub.jp/ksc/000584/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '79ebe020-390d-47cb-9fce-5d8002817d78'::uuid, 'dd9e21fe-f2a1-4728-92f8-8c89fa83931e'::uuid, '西葛西東京', 'golds-gym-180914',
    '134-0088'::text, '東京都'::text, '江戸川区'::text, '西葛西6-16-1 3~7F'::text,
    35.663647, 139.859467, '『東京メトロ』東西線　西葛西駅南口より徒歩1分 / 直通エレベーターにて4階受付へお越しください。（サイゼリア上） / ■店舗外観は こちら'::text,
    'https://www.goldsgym.jp/shop/nishikasai-tokyo/'::text, 'https://www.goldsgym.jp/shop/nishikasai-tokyo/'::text, 'fitness_club'::text,
    true, '2026-08-13T10:50:11.569+00:00'::timestamptz
  ),
  (
    '7ac86be3-a1cb-48e5-aff2-5404a97283cf'::uuid, 'b04baf0e-ded3-48f3-a2d9-127ae8f7c817'::uuid, 'JEXER 新川崎', 'jexer-shinkawasaki-kanagawa',
    null, '神奈川県'::text, '川崎市'::text, null,
    35.550236, 139.673828, null,
    'https://www.jexer.jp/fitness/shinkawasaki/'::text, 'https://www.jexer.jp/fitness/shinkawasaki/'::text, 'fitness_spa'::text,
    true, null
  ),
  (
    '7b478d60-3ef1-449c-af6f-0998232db047'::uuid, 'f0c8c2f9-103a-4b7f-a385-5b0bb4a29aec'::uuid, 'TIP.X TOKYO渋谷', 'tipness-shp001',
    null, '東京都'::text, '渋谷区'::text, null,
    35.66123, 139.699169, null,
    'https://tip.tipness.co.jp/shop_info/SHP001/'::text, 'https://tip.tipness.co.jp/shop_info/SHP001/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '7c8ef293-536e-4b7b-8550-8194fccdecaf'::uuid, 'bef520a9-236f-4ef9-b59d-28ae328090ca'::uuid, 'メガロス西新宿キッズアフタースクール', 'megalos-nishishinjuku',
    null, '東京都'::text, '新宿区'::text, null,
    35.684006, 139.688629, null,
    'https://megalos.co.jp/nishishinjuku/'::text, 'https://megalos.co.jp/nishishinjuku/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '7caf723d-ff00-4dbc-a401-5848196725b4'::uuid, 'b04baf0e-ded3-48f3-a2d9-127ae8f7c817'::uuid, 'JEXER 亀戸', 'jexer-kameido',
    '136-0071'::text, '東京都'::text, '江東区'::text, '亀戸 5-1-1'::text,
    35.6975, 139.8268, '亀戸駅'::text,
    'https://www.jexer.jp/fitness/kameido/'::text, 'https://www.jexer.jp/mb/kameido/index.html'::text, 'fitness_spa'::text,
    true, '2026-04-14T05:34:31.732803+00:00'::timestamptz
  ),
  (
    '7d3f79b7-5588-4ba7-a424-740b1d95720a'::uuid, 'ee1927f5-3d6d-4e4e-b632-ad9210540d56'::uuid, 'コナミスポーツクラブ 蒲田', 'konami-sports-007876',
    null, '東京都'::text, '大田区蒲田'::text, null,
    35.559505, 139.716522, null,
    'https://information.konamisportsclub.jp/ksc/007876/'::text, 'https://information.konamisportsclub.jp/ksc/007876/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '7d7216d0-692e-45dd-ad3c-6c4980fdc50a'::uuid, 'dd9e21fe-f2a1-4728-92f8-8c89fa83931e'::uuid, '原宿ANNEX', 'golds-gym-9999',
    '150-0001'::text, '東京都'::text, '渋谷区'::text, '神宮前1-5-8神宮前タワービルディング B1F(フロントは1F)'::text,
    35.670582, 139.706863, '■東京メトロ 千代田線・副都心線「明治神宮前駅」5番出口より徒歩5分 / ■JR原宿駅竹下口より徒歩5分 竹下通りを抜けた左手のビル、アシックスの隣が受付となります。 / ■JR原宿駅竹下口からの裏道は こちら'::text,
    'https://www.goldsgym.jp/shop/harajuku-annex-tokyo/'::text, 'https://www.goldsgym.jp/shop/harajuku-annex-tokyo/'::text, 'fitness_club'::text,
    true, '2026-08-13T10:50:11.569+00:00'::timestamptz
  ),
  (
    '7e20e850-40b7-4fe9-b529-1104c2ea0f97'::uuid, 'bef520a9-236f-4ef9-b59d-28ae328090ca'::uuid, 'メガロス 草加', 'megalos-souka',
    null, '埼玉県'::text, '草加市'::text, null,
    35.830425, 139.804596, null,
    'https://megalos.co.jp/souka/'::text, 'https://megalos.co.jp/souka/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '80fce337-a4b3-44dc-8f39-f872b23adb66'::uuid, 'bef520a9-236f-4ef9-b59d-28ae328090ca'::uuid, 'メガロス 田端', 'megalos-tabata',
    null, '東京都'::text, '北区'::text, null,
    35.737652, 139.763275, null,
    'https://megalos.co.jp/tabata/'::text, 'https://megalos.co.jp/tabata/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '828093ec-b432-4a15-87a4-d838ab9d964d'::uuid, '0f49d25a-b01b-4edd-89bd-5457f5c6459e'::uuid, 'NAS藤沢', 'sports-club-nas-fujisawa-index',
    null, '神奈川県'::text, '藤沢市'::text, null,
    35.340285, 139.485338, null,
    'https://www.nas-club.co.jp/fujisawa/index.html'::text, 'https://www.nas-club.co.jp/fujisawa/index.html'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '835e625f-5f75-45a1-a1b2-12e99b82d892'::uuid, 'ee1927f5-3d6d-4e4e-b632-ad9210540d56'::uuid, 'コナミスポーツクラブ 川崎', 'konami-sports-004479',
    null, '神奈川県'::text, '川崎市幸区堀川町'::text, null,
    35.531395, 139.695801, null,
    'https://information.konamisportsclub.jp/ksc/004479/'::text, 'https://information.konamisportsclub.jp/ksc/004479/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '8454a9ce-85cd-47fe-9a3a-41336f81ba47'::uuid, 'dd9e21fe-f2a1-4728-92f8-8c89fa83931e'::uuid, '国立東京', 'golds-gym-20220627',
    '186-0004'::text, '東京都'::text, '国立市'::text, '中1-9-30国立せきやビル 5F'::text,
    35.697727, 139.445435, 'JR「国立駅」南口より徒歩2分 / 詳しくは こちら'::text,
    'https://www.goldsgym.jp/shop/kunitachi-tokyo/'::text, 'https://www.goldsgym.jp/shop/kunitachi-tokyo/'::text, 'fitness_club'::text,
    true, '2026-08-13T10:50:11.569+00:00'::timestamptz
  ),
  (
    '8576870a-5a72-4883-b321-a15c303029f2'::uuid, 'dd9e21fe-f2a1-4728-92f8-8c89fa83931e'::uuid, '厚木神奈川', 'golds-gym-14160',
    '243-0018'::text, '神奈川県'::text, '厚木市'::text, '中町2-4-13本厚木駅前ビル 5・6F'::text,
    35.440498, 139.365251, '小田急線『本厚木駅』北口より徒歩1分'::text,
    'https://www.goldsgym.jp/shop/atsugi-kanagawa/'::text, 'https://www.goldsgym.jp/shop/atsugi-kanagawa/'::text, 'fitness_club'::text,
    true, '2026-08-13T10:50:11.57+00:00'::timestamptz
  ),
  (
    '85bb7afe-f968-4ecc-8d4e-1d0a0d482216'::uuid, 'ee1927f5-3d6d-4e4e-b632-ad9210540d56'::uuid, 'コナミスポーツクラブ 行田', 'konami-sports-000590',
    null, '埼玉県'::text, '行田市持田'::text, null,
    null, null, null,
    'https://information.konamisportsclub.jp/ksc/000590/'::text, 'https://information.konamisportsclub.jp/ksc/000590/'::text, 'fitness_club'::text,
    false, null
  ),
  (
    '861e1cc8-a67b-406c-b6eb-c38b7edba944'::uuid, 'dd9e21fe-f2a1-4728-92f8-8c89fa83931e'::uuid, '代々木公園PREMIUM', 'golds-gym-13191',
    '151-0053'::text, '東京都'::text, '渋谷区'::text, '代々木5-66-3'::text,
    35.671547, 139.690659, '小田急小田原線「代々木八幡駅」南口より徒歩5分 / 東京メトロ千代田線「代々木公園駅」3番出口より徒歩3分'::text,
    'https://www.goldsgym.jp/shop/yoyogi-koen-premium/'::text, 'https://www.goldsgym.jp/shop/yoyogi-koen-premium/'::text, 'fitness_club'::text,
    true, '2026-08-13T10:50:11.569+00:00'::timestamptz
  ),
  (
    '86dab9f3-d4dd-4cef-bfad-d5d0df95f4b7'::uuid, 'dd9e21fe-f2a1-4728-92f8-8c89fa83931e'::uuid, '新所沢埼玉', 'golds-gym-11130',
    '359-1111'::text, '埼玉県'::text, '所沢市'::text, '緑町1-1-11西武ショッピングプラザ新所沢グリーンハイツ B1F'::text,
    35.805317, 139.456284, ''::text,
    'https://www.goldsgym.jp/shop/shintokorozawa-saitama/'::text, 'https://www.goldsgym.jp/shop/shintokorozawa-saitama/'::text, 'fitness_club'::text,
    true, '2026-08-13T10:50:11.57+00:00'::timestamptz
  ),
  (
    '8997e22c-b724-4431-bd21-d7800a01faad'::uuid, 'ee1927f5-3d6d-4e4e-b632-ad9210540d56'::uuid, 'コナミスポーツクラブ 磯子', 'konami-sports-006033',
    null, '神奈川県'::text, '横浜市磯子区森'::text, null,
    35.398876, 139.616302, null,
    'https://information.konamisportsclub.jp/ksc/006033/'::text, 'https://information.konamisportsclub.jp/ksc/006033/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '89cd1ac4-77b1-4682-9157-3f3e6c9c8fa2'::uuid, 'dd9e21fe-f2a1-4728-92f8-8c89fa83931e'::uuid, '八王子東京', 'golds-gym-13260',
    '192-0083'::text, '東京都'::text, '八王子市'::text, '旭町5-1八王子ツインタワーB館 5F6F'::text,
    35.656246, 139.338104, '■JR(八高線・中央線・横浜線)『八王子駅』北口より徒歩1分 / JR八王子駅からのアクセスは こちら / ■京王電鉄京王線『京王八王子駅』西口より徒歩8分 / 京王八王子駅からのアクセスは こちら'::text,
    'https://www.goldsgym.jp/shop/hachioji-tokyo/'::text, 'https://www.goldsgym.jp/shop/hachioji-tokyo/'::text, 'fitness_club'::text,
    true, '2026-08-13T10:50:11.569+00:00'::timestamptz
  ),
  (
    '89e394b2-1095-4b4c-a7f2-7841e72a93d3'::uuid, '0f49d25a-b01b-4edd-89bd-5457f5c6459e'::uuid, 'NASおゆみ野', 'sports-club-nas-oyumino-index',
    null, '千葉県'::text, '千葉市'::text, null,
    35.552597, 140.185684, null,
    'https://www.nas-club.co.jp/oyumino/index.html'::text, 'https://www.nas-club.co.jp/oyumino/index.html'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '8af08331-9f78-41cb-822e-e82263378dbc'::uuid, 'dd9e21fe-f2a1-4728-92f8-8c89fa83931e'::uuid, '柏千葉', 'golds-gym-12110',
    '277-0863'::text, '千葉県'::text, '柏市'::text, '豊四季135-108'::text,
    35.866505, 139.935379, 'グリーンバス【長崎入口】徒歩１分'::text,
    'https://www.goldsgym.jp/shop/kashiwa-chiba/'::text, 'https://www.goldsgym.jp/shop/kashiwa-chiba/'::text, 'fitness_club'::text,
    true, '2026-08-13T10:50:11.57+00:00'::timestamptz
  ),
  (
    '8bd1fd5e-2ad1-478c-a4d1-3f2210523d1e'::uuid, '8e66d169-68bf-4da1-8ed7-42307976e4ab'::uuid, 'セントラルフィットネスクラブ 八千代台', 'central-yachiyodai',
    '276-0032'::text, '千葉県'::text, '八千代市'::text, '八千代台東1-1-10 ユアエルム レストラン街5F'::text,
    35.699724, 140.092366, null,
    'https://www.central.co.jp/club/yachiyodai/'::text, 'https://www.central.co.jp/club/yachiyodai/'::text, 'fitness_club'::text,
    true, '2026-08-09T12:29:34.761+00:00'::timestamptz
  ),
  (
    '8cf199da-a248-4527-85e5-14f596b59a52'::uuid, 'bef520a9-236f-4ef9-b59d-28ae328090ca'::uuid, 'メガロス ルフレ武蔵小金井ー女性専用スタジオー', 'megalos-musashi-reflet',
    null, '東京都'::text, '小金井市'::text, null,
    35.702068, 139.512924, null,
    'https://megalos.co.jp/musashi_reflet/'::text, 'https://megalos.co.jp/musashi_reflet/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '8e11785f-52ba-4ef4-933a-2db32f2181cd'::uuid, '8e66d169-68bf-4da1-8ed7-42307976e4ab'::uuid, 'セントラルフィットネスクラブ24 二俣川', 'central-futamatagawa',
    '241-0821'::text, '神奈川県'::text, '横浜市旭区'::text, '二俣川2-52-4'::text,
    35.462441, 139.533263, null,
    'https://www.central.co.jp/club/futamatagawa/'::text, 'https://www.central.co.jp/club/futamatagawa/'::text, 'fitness_club'::text,
    true, '2026-08-09T12:29:34.761+00:00'::timestamptz
  ),
  (
    '8e45998e-b463-4da4-b184-d03b6b84f468'::uuid, '8e66d169-68bf-4da1-8ed7-42307976e4ab'::uuid, 'セントラルフィットネスクラブ 谷津(ラボ・トレーニングセンター)', 'central-cf-yatsu',
    '275-0026'::text, '千葉県'::text, '習志野市'::text, '谷津3-1-1'::text,
    35.682774, 140.007015, null,
    'https://www.central.co.jp/club/cf-yatsu/'::text, 'https://www.central.co.jp/club/cf-yatsu/'::text, 'fitness_club'::text,
    true, '2026-08-09T12:29:34.761+00:00'::timestamptz
  ),
  (
    '8ec985d0-ac1f-488d-8726-41079f63a7a4'::uuid, 'bef520a9-236f-4ef9-b59d-28ae328090ca'::uuid, 'メガロス 三鷹', 'megalos-mitaka',
    null, '東京都'::text, '武蔵野市'::text, null,
    35.704479, 139.56134, null,
    'https://megalos.co.jp/mitaka/'::text, 'https://megalos.co.jp/mitaka/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '908b6737-ee22-475d-adcc-7b87f3ee1470'::uuid, '0f49d25a-b01b-4edd-89bd-5457f5c6459e'::uuid, 'NAS PILATES 新御徒町', 'sports-club-nas-nas-pilates',
    null, '東京都'::text, '台東区'::text, null,
    35.708015, 139.780197, null,
    'https://www.nas-club.co.jp/nas-pilates/'::text, 'https://www.nas-club.co.jp/nas-pilates/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '909bf238-fd23-4506-9f90-d758c0efa529'::uuid, 'ee1927f5-3d6d-4e4e-b632-ad9210540d56'::uuid, 'コナミスポーツクラブ 和光', 'konami-sports-007851',
    null, '埼玉県'::text, '和光市白子'::text, null,
    35.768478, 139.620392, null,
    'https://information.konamisportsclub.jp/ksc/007851/'::text, 'https://information.konamisportsclub.jp/ksc/007851/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '942690ac-4923-4f20-afb3-a643dac24efc'::uuid, 'ee1927f5-3d6d-4e4e-b632-ad9210540d56'::uuid, 'コナミスポーツクラブ 所沢', 'konami-sports-004053',
    null, '埼玉県'::text, '所沢市星の宮'::text, null,
    35.788303, 139.463516, null,
    'https://information.konamisportsclub.jp/ksc/004053/'::text, 'https://information.konamisportsclub.jp/ksc/004053/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '942c2e01-0e8b-490d-acba-794af03ad468'::uuid, '8e66d169-68bf-4da1-8ed7-42307976e4ab'::uuid, 'セントラルフィットネスクラブ24 越谷レイクタウン', 'central-koshigaya-lt',
    '343-0828'::text, '埼玉県'::text, '越谷市'::text, 'レイクタウン7-2-8'::text,
    35.87272, 139.817264, null,
    'https://www.central.co.jp/club/koshigaya_lt/'::text, 'https://www.central.co.jp/club/koshigaya_lt/'::text, 'fitness_club'::text,
    true, '2026-08-09T12:29:34.761+00:00'::timestamptz
  ),
  (
    '9541d545-4e7c-4288-99dc-5ca6b5305dd0'::uuid, 'ee1927f5-3d6d-4e4e-b632-ad9210540d56'::uuid, 'コナミスポーツクラブ 武蔵浦和', 'konami-sports-004081',
    null, '埼玉県'::text, 'さいたま市南区別所'::text, null,
    35.847588, 139.64859, null,
    'https://information.konamisportsclub.jp/ksc/004081/'::text, 'https://information.konamisportsclub.jp/ksc/004081/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '9615896e-66e8-4246-9ddd-d96c41574d80'::uuid, 'b04baf0e-ded3-48f3-a2d9-127ae8f7c817'::uuid, 'JEXER 大塚', 'jexer-otsuka',
    '170-0005'::text, '東京都'::text, '豊島区'::text, '南大塚 3-33-1'::text,
    35.7312, 139.7289, '大塚駅'::text,
    'https://www.jexer.jp/fitness/otsuka/'::text, 'https://www.jexer.jp/mb/otsuka/index.html'::text, 'fitness_spa'::text,
    true, '2026-04-14T05:34:31.732803+00:00'::timestamptz
  ),
  (
    '962098d1-649a-4bbc-8664-9d7491bea867'::uuid, '8e66d169-68bf-4da1-8ed7-42307976e4ab'::uuid, 'セントラルフィットネスクラブ 湘南ライフタウン', 'central-shonanlt',
    '251-0861'::text, '神奈川県'::text, '藤沢市'::text, '大庭5254-1'::text,
    35.360322, 139.447181, null,
    'https://www.central.co.jp/club/shonanlt/'::text, 'https://www.central.co.jp/club/shonanlt/'::text, 'fitness_club'::text,
    true, '2026-08-09T12:29:34.761+00:00'::timestamptz
  ),
  (
    '9695ea05-b4d0-4203-b843-f34890406fa4'::uuid, 'b04baf0e-ded3-48f3-a2d9-127ae8f7c817'::uuid, 'JEXER 上野', 'jexer-ueno',
    '110-0005'::text, '東京都'::text, '台東区'::text, '上野 7-1-1'::text,
    35.7138, 139.7773, '上野駅'::text,
    'https://www.jexer.jp/fitness/ueno/'::text, 'https://www.jexer.jp/mb/ueno/index.html'::text, 'fitness_spa'::text,
    true, '2026-04-14T05:34:31.732803+00:00'::timestamptz
  ),
  (
    '96c9a614-327e-4d50-99d9-ef2c5c9666af'::uuid, '0f49d25a-b01b-4edd-89bd-5457f5c6459e'::uuid, 'NAS PILATES ON THE GO 西葛西店', 'sports-club-nas-np-onthego-nishikasai',
    null, '東京都'::text, '江戸川区'::text, null,
    35.664047, 139.860092, null,
    'https://www.nas-club.co.jp/np-onthego/nishikasai/'::text, 'https://www.nas-club.co.jp/np-onthego/nishikasai/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '98f753b8-b355-40b2-b67e-f6f84bee5b13'::uuid, '8e66d169-68bf-4da1-8ed7-42307976e4ab'::uuid, 'セントラルウェルネスクラブ24 西新井', 'central-w-nishiarai',
    null, '東京都'::text, null, null,
    35.775002, 139.789986, null,
    'https://www.central.co.jp/club/w_nishiarai/'::text, 'https://www.central.co.jp/club/w_nishiarai/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '992c9e25-4024-46cb-873d-f36d66065287'::uuid, 'ee1927f5-3d6d-4e4e-b632-ad9210540d56'::uuid, 'コナミスポーツクラブ 目黒', 'konami-sports-006022',
    null, '東京都'::text, '目黒区下目黒'::text, null,
    35.632729, 139.713303, null,
    'https://information.konamisportsclub.jp/ksc/006022/'::text, 'https://information.konamisportsclub.jp/ksc/006022/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '9bdfd2b1-eabd-47fc-b865-d10488cbe1c2'::uuid, '8e66d169-68bf-4da1-8ed7-42307976e4ab'::uuid, 'ニッセイセントラルフィットネスクラブ 松戸', 'central-nissay-matsudo',
    '270-2222'::text, '千葉県'::text, '松戸市'::text, '高塚新田123-15'::text,
    35.755387, 139.943113, null,
    'https://www.central.co.jp/club/nissay-matsudo/'::text, 'https://www.central.co.jp/club/nissay-matsudo/'::text, 'fitness_club'::text,
    true, '2026-08-09T12:29:34.761+00:00'::timestamptz
  ),
  (
    '9be683a9-d814-427b-8321-4570d4465427'::uuid, 'b04baf0e-ded3-48f3-a2d9-127ae8f7c817'::uuid, 'JEXER 浦和', 'jexer-urawa',
    null, '埼玉県'::text, 'さいたま市'::text, null,
    35.858215, 139.657028, null,
    'https://www.jexer.jp/fitness/urawa/'::text, 'https://www.jexer.jp/fitness/urawa/'::text, 'fitness_spa'::text,
    true, null
  ),
  (
    '9beb6d1c-8bad-4715-8abd-dce69abb31fa'::uuid, 'bef520a9-236f-4ef9-b59d-28ae328090ca'::uuid, 'メガロス 神奈川', 'megalos-kanagawa',
    null, '神奈川県'::text, '横浜市'::text, null,
    35.489563, 139.648804, null,
    'https://megalos.co.jp/kanagawa/'::text, 'https://megalos.co.jp/kanagawa/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '9d9dd8c7-e287-4943-b8d2-2799857a87e1'::uuid, '8e66d169-68bf-4da1-8ed7-42307976e4ab'::uuid, 'セントラルウェルネスクラブ トレッサ(大倉山)', 'central-w-ookurayama',
    '222-0002'::text, '神奈川県'::text, '横浜市港北区'::text, '師岡町700 トレッサ横浜 北棟 4F'::text,
    35.525761, 139.646667, null,
    'https://www.central.co.jp/club/w_ookurayama/'::text, 'https://www.central.co.jp/club/w_ookurayama/'::text, 'fitness_club'::text,
    true, '2026-08-09T12:29:34.761+00:00'::timestamptz
  ),
  (
    '9d9f9b81-9cc8-4737-918f-464977ce7923'::uuid, '0f49d25a-b01b-4edd-89bd-5457f5c6459e'::uuid, 'NAS平塚', 'sports-club-nas-hiratsuka-index',
    null, '神奈川県'::text, '平塚市'::text, null,
    35.327976, 139.349014, null,
    'https://www.nas-club.co.jp/hiratsuka/index.html'::text, 'https://www.nas-club.co.jp/hiratsuka/index.html'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '9df58e2e-045f-482a-ae1e-5f0001276630'::uuid, 'dd9e21fe-f2a1-4728-92f8-8c89fa83931e'::uuid, '町田東京', 'golds-gym-13250',
    '194-0013'::text, '東京都'::text, '町田市'::text, '原町田4丁目1-14プラザ町田 3・4F(受付4F)'::text,
    35.540924, 139.448471, 'JR 横浜線『町田駅』ターミナル口より徒歩30秒 / 小田急線『町田駅』西口より徒歩6分 / ■駅からのアクセスは こちら（PDF）'::text,
    'https://www.goldsgym.jp/shop/machida-tokyo/'::text, 'https://www.goldsgym.jp/shop/machida-tokyo/'::text, 'fitness_club'::text,
    true, '2026-08-13T10:50:11.569+00:00'::timestamptz
  ),
  (
    '9e52aa43-9fa3-48db-a5bc-62897cfa32a3'::uuid, '8e66d169-68bf-4da1-8ed7-42307976e4ab'::uuid, 'セントラルスポーツクラブ 東戸塚', 'central-higashitotsuka-s',
    '244-0805'::text, '神奈川県'::text, '横浜市戸塚区'::text, '川上町415-2'::text,
    35.427745, 139.546972, null,
    'https://www.central.co.jp/club/higashitotsuka-s/'::text, 'https://www.central.co.jp/club/higashitotsuka-s/'::text, 'fitness_club'::text,
    true, '2026-08-09T12:29:34.761+00:00'::timestamptz
  ),
  (
    '9eb03e31-decf-484b-8859-83977ce32609'::uuid, '0f49d25a-b01b-4edd-89bd-5457f5c6459e'::uuid, 'NAS武蔵浦和', 'sports-club-nas-musashiurawa-index',
    '336-0021'::text, '埼玉県'::text, 'さいたま市南区'::text, '別所7-6-8 ライブタワー武蔵浦和3F'::text,
    null, null, 'JR埼京線 武蔵浦和駅'::text,
    'https://www.nas-club.co.jp/musashiurawa/index.html'::text, 'https://www.nas-club.co.jp/musashiurawa/index.html'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '9f043139-a32a-4537-93de-2ff777ca9cc8'::uuid, '8e66d169-68bf-4da1-8ed7-42307976e4ab'::uuid, 'ザバススポーツクラブ/和光', 'central-csp-wako',
    '351-0112'::text, '埼玉県'::text, '和光市'::text, '丸山台1-1-2'::text,
    35.787726, 139.613886, null,
    'https://www.central.co.jp/club/csp-wako/'::text, 'https://www.central.co.jp/club/csp-wako/'::text, 'fitness_club'::text,
    true, '2026-08-09T12:29:34.761+00:00'::timestamptz
  ),
  (
    '9f4b7e31-2b18-4225-ba9b-022299aae5c1'::uuid, 'bef520a9-236f-4ef9-b59d-28ae328090ca'::uuid, 'メガロス ゼロプラス 恵比寿ーパーソナルジムー', 'megalos-ebisu',
    null, '東京都'::text, '渋谷区'::text, null,
    35.644894, 139.708603, null,
    'https://megalos.co.jp/ebisu/'::text, 'https://megalos.co.jp/ebisu/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    '9f7b1380-c866-40e1-adad-b68bdb765b84'::uuid, 'dd9e21fe-f2a1-4728-92f8-8c89fa83931e'::uuid, '津田沼千葉', 'golds-gym-12170',
    '275-0016'::text, '千葉県'::text, '習志野市'::text, '津田沼5-12-4NARASHINOCREST 地下1階'::text,
    35.682686, 140.024017, '京成津田沼駅（京成線、新京成線）　改札出て左の階段をおりて徒歩1分 / 京成津田沼駅からの案内は こちら'::text,
    'https://www.goldsgym.jp/shop/tsudanuma-chiba/'::text, 'https://www.goldsgym.jp/shop/tsudanuma-chiba/'::text, 'fitness_club'::text,
    true, '2026-08-13T10:50:11.57+00:00'::timestamptz
  ),
  (
    'a01d4d46-2fd5-48fc-bac4-420ddd9516b4'::uuid, 'b04baf0e-ded3-48f3-a2d9-127ae8f7c817'::uuid, 'JEXER 戸田公園', 'jexer-todakoen',
    null, '埼玉県'::text, '戸田市'::text, null,
    35.806149, 139.680344, null,
    'https://www.jexer.jp/fitness/todakoen/'::text, 'https://www.jexer.jp/fitness/todakoen/'::text, 'fitness_spa'::text,
    true, null
  ),
  (
    'a024a2e7-7f31-4458-b2c3-145476abe464'::uuid, 'dd9e21fe-f2a1-4728-92f8-8c89fa83931e'::uuid, '溝の口神奈川', 'golds-gym-14110',
    '213-0001'::text, '神奈川県'::text, '川崎市高津区'::text, '溝口1丁目1番30号溝の口ブロックスビル 2F・3F(受付は3Fになります。)'::text,
    35.599087, 139.611191, 'JR南武線　武蔵溝の口駅 南口 徒歩1分 / 東急田園都市線　溝の口駅 南口 徒歩2分'::text,
    'https://www.goldsgym.jp/shop/mizonokuchi-kanagawa/'::text, 'https://www.goldsgym.jp/shop/mizonokuchi-kanagawa/'::text, 'fitness_club'::text,
    true, '2026-08-13T10:50:11.57+00:00'::timestamptz
  ),
  (
    'a061fb6d-25a4-464c-8a80-a4eb7ab71639'::uuid, '8e66d169-68bf-4da1-8ed7-42307976e4ab'::uuid, 'セントラルフィットネスクラブ24 茂原', 'central-cf-mobara',
    '297-0074'::text, '千葉県'::text, '茂原市'::text, '小林1740-1'::text,
    35.439188, 140.282053, null,
    'https://www.central.co.jp/club/cf-mobara/'::text, 'https://www.central.co.jp/club/cf-mobara/'::text, 'fitness_club'::text,
    true, '2026-08-09T12:29:34.761+00:00'::timestamptz
  ),
  (
    'a13e3fe4-3569-4503-9bbb-4c7c69834bef'::uuid, '8e66d169-68bf-4da1-8ed7-42307976e4ab'::uuid, 'セントラルウェルネスクラブ24 清瀬', 'central-kiyose',
    null, '東京都'::text, null, null,
    35.774207, 139.518518, null,
    'https://www.central.co.jp/club/kiyose/'::text, 'https://www.central.co.jp/club/kiyose/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    'a18b3504-d1c8-4d05-999a-5fd6c8c6fa47'::uuid, 'b04baf0e-ded3-48f3-a2d9-127ae8f7c817'::uuid, 'JEXER 東神奈川', 'jexer-higashi-kanagawa',
    null, '神奈川県'::text, '横浜市'::text, null,
    35.477715, 139.633194, null,
    'https://www.jexer.jp/fitness/higashikanagawa/'::text, 'https://www.jexer.jp/fitness/higashikanagawa/'::text, 'fitness_spa'::text,
    true, null
  ),
  (
    'a1cfa7ee-4cf3-47a9-aff6-b54ecdd320d2'::uuid, '8e66d169-68bf-4da1-8ed7-42307976e4ab'::uuid, 'セントラルウェルネスクラブ 成城', 'central-seijo',
    null, '東京都'::text, null, null,
    35.653725, 139.61542, null,
    'https://www.central.co.jp/club/seijo/'::text, 'https://www.central.co.jp/club/seijo/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    'a254f858-f313-48f2-8a8b-c854b9b2b27c'::uuid, '8e66d169-68bf-4da1-8ed7-42307976e4ab'::uuid, 'セントラルウェルネスクラブ 慶應日吉', 'central-cw-hiyoshi',
    '223-0061'::text, '神奈川県'::text, '横浜市港北区'::text, '日吉4-1-1 慶應義塾大学日吉キャンパス 協生館地下1F'::text,
    35.551997, 139.64723, null,
    'https://www.central.co.jp/club/cw-hiyoshi/'::text, 'https://www.central.co.jp/club/cw-hiyoshi/'::text, 'fitness_club'::text,
    true, '2026-08-09T12:29:34.761+00:00'::timestamptz
  ),
  (
    'a27ef8cf-d45b-4109-8e33-a56b2ff3f57b'::uuid, '8e66d169-68bf-4da1-8ed7-42307976e4ab'::uuid, 'ザバススポーツクラブ/鶴見', 'central-csp-tsurumi',
    '230-0062'::text, '神奈川県'::text, '横浜市鶴見区'::text, '豊岡町9-11'::text,
    35.50867, 139.672814, null,
    'https://www.central.co.jp/club/csp-tsurumi/'::text, 'https://www.central.co.jp/club/csp-tsurumi/'::text, 'fitness_club'::text,
    true, '2026-08-09T12:29:34.761+00:00'::timestamptz
  ),
  (
    'a456a6e2-2a2e-4b47-a477-c552ba213315'::uuid, '0f49d25a-b01b-4edd-89bd-5457f5c6459e'::uuid, 'NAS吉祥寺', 'sports-club-nas-kichijoji-index',
    null, '東京都'::text, '武蔵野市'::text, null,
    35.701477, 139.58136, null,
    'https://www.nas-club.co.jp/kichijoji/index.html'::text, 'https://www.nas-club.co.jp/kichijoji/index.html'::text, 'fitness_club'::text,
    true, null
  ),
  (
    'a48641f7-89a6-499f-8ad6-ab7008277898'::uuid, '8e66d169-68bf-4da1-8ed7-42307976e4ab'::uuid, 'セントラルフィットネスクラブ24 小手指', 'central-cf-kotesashi',
    '359-1141'::text, '埼玉県'::text, '所沢市'::text, '小手指町1-6 小手指タワーズ ディアスカイタワー2F・3F'::text,
    35.801807, 139.438063, null,
    'https://www.central.co.jp/club/cf-kotesashi/'::text, 'https://www.central.co.jp/club/cf-kotesashi/'::text, 'fitness_club'::text,
    true, '2026-08-09T12:29:34.761+00:00'::timestamptz
  ),
  (
    'a4aa3543-2b4e-4e70-b946-46adc7580d09'::uuid, '8e66d169-68bf-4da1-8ed7-42307976e4ab'::uuid, 'セントラルウェルネスクラブさいたま新都心 THE MARK GRAND HOTEL', 'central-shintoshin-saitama',
    '330-0081'::text, '埼玉県'::text, 'さいたま市中央区'::text, '新都心3-2 THE MARK GRAND HOTEL 6F'::text,
    35.889426, 139.634954, null,
    'https://www.central.co.jp/club/shintoshin-saitama/'::text, 'https://www.central.co.jp/club/shintoshin-saitama/'::text, 'fitness_club'::text,
    true, '2026-08-09T12:29:34.761+00:00'::timestamptz
  ),
  (
    'a63ef69d-deee-4fb0-9c96-17c2606e9a5a'::uuid, 'dd9e21fe-f2a1-4728-92f8-8c89fa83931e'::uuid, '久喜埼玉', 'golds-gym-20200508',
    '346-0003'::text, '埼玉県'::text, '久喜市'::text, '久喜中央1-1-20クッキープラザ 4F'::text,
    36.066628, 139.676788, ''::text,
    'https://www.goldsgym.jp/shop/kuki-saitama/'::text, 'https://www.goldsgym.jp/shop/kuki-saitama/'::text, 'fitness_club'::text,
    true, '2026-08-13T10:50:11.57+00:00'::timestamptz
  ),
  (
    'a6d34e4b-6cc1-4f6f-9fd0-793240e203d4'::uuid, '0f49d25a-b01b-4edd-89bd-5457f5c6459e'::uuid, 'NAS東大宮（新館）', 'sports-club-nas-higashiomiya-newbuild-index',
    '337-0051'::text, '埼玉県'::text, 'さいたま市見沼区'::text, '東大宮5丁目26-1'::text,
    null, null, 'JR宇都宮線 東大宮駅東口 徒歩3分'::text,
    'https://www.nas-club.co.jp/higashiomiya_newbuild/index.html'::text, 'https://www.nas-club.co.jp/higashiomiya_newbuild/index.html'::text, 'fitness_club'::text,
    true, null
  ),
  (
    'a92b62b8-3e03-4e28-bede-099c77740b8b'::uuid, 'ee1927f5-3d6d-4e4e-b632-ad9210540d56'::uuid, 'コナミスポーツクラブ 北上尾', 'konami-sports-007879',
    null, '埼玉県'::text, '上尾市緑丘'::text, null,
    35.986954, 139.578842, null,
    'https://information.konamisportsclub.jp/ksc/007879/'::text, 'https://information.konamisportsclub.jp/ksc/007879/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    'a9acea09-f2b8-49a7-8d38-0b5977257e09'::uuid, '8e66d169-68bf-4da1-8ed7-42307976e4ab'::uuid, 'セントラルスポーツ ジムスタ24 武蔵新城', 'central-gs-musashishinjo',
    '211-0044'::text, '神奈川県'::text, '川崎市中原区'::text, '新城1-4-17 グランシャトー2F'::text,
    35.585631, 139.631272, null,
    'https://www.central.co.jp/club/gs-musashishinjo/'::text, 'https://www.central.co.jp/club/gs-musashishinjo/'::text, 'fitness_club'::text,
    true, '2026-08-09T12:29:34.761+00:00'::timestamptz
  ),
  (
    'aa0ac95d-0a4a-49b7-ae0a-2c0bdad7cec5'::uuid, '8e66d169-68bf-4da1-8ed7-42307976e4ab'::uuid, 'セントラルフィットネスクラブ24 流山', 'central-nagareyama',
    '270-0157'::text, '千葉県'::text, '流山市'::text, '平和台3-6-1'::text,
    35.851696, 139.903348, null,
    'https://www.central.co.jp/club/nagareyama/'::text, 'https://www.central.co.jp/club/nagareyama/'::text, 'fitness_club'::text,
    true, '2026-08-09T12:29:34.761+00:00'::timestamptz
  ),
  (
    'aa1c49db-7c6a-4ba6-b99a-871ec999f8a2'::uuid, 'f0c8c2f9-103a-4b7f-a385-5b0bb4a29aec'::uuid, '国分寺店', 'tipness-shp031',
    null, '東京都'::text, '国分寺市'::text, null,
    35.701037, 139.478565, null,
    'https://tip.tipness.co.jp/shop_info/SHP031/'::text, 'https://tip.tipness.co.jp/shop_info/SHP031/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    'aa524396-ba4a-4842-8c70-d514274493f6'::uuid, '8e66d169-68bf-4da1-8ed7-42307976e4ab'::uuid, 'セントラルフィットネスクラブ 八王子', 'central-hachioji',
    null, '東京都'::text, null, null,
    35.660624, 139.341062, null,
    'https://www.central.co.jp/club/hachioji/'::text, 'https://www.central.co.jp/club/hachioji/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    'aa9a5e34-754d-43a5-aee5-3540305ed05c'::uuid, 'dd9e21fe-f2a1-4728-92f8-8c89fa83931e'::uuid, '大宮さいたま', 'golds-gym-1112',
    '330-0854'::text, '埼玉県'::text, 'さいたま市大宮区'::text, '桜木町2-1-1大宮アルシェビル 7F'::text,
    35.906166, 139.622147, ''::text,
    'https://www.goldsgym.jp/shop/omiya-saitama/'::text, 'https://www.goldsgym.jp/shop/omiya-saitama/'::text, 'fitness_club'::text,
    true, '2026-08-13T10:50:11.57+00:00'::timestamptz
  ),
  (
    'abe646dd-0b4f-428f-b6d9-a4c93c71c908'::uuid, '8e66d169-68bf-4da1-8ed7-42307976e4ab'::uuid, 'セントラルフィットネスクラブ24 福生', 'central-fussa',
    null, '東京都'::text, null, null,
    35.740727, 139.329322, null,
    'https://www.central.co.jp/club/fussa/'::text, 'https://www.central.co.jp/club/fussa/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    'ada0c215-5d3e-411b-aa58-9f04eb721c86'::uuid, 'dd9e21fe-f2a1-4728-92f8-8c89fa83931e'::uuid, '銀座東京', 'golds-gym-13200',
    '104-0061'::text, '東京都'::text, '中央区'::text, '銀座1-2-1東京都高速道路紺屋ビル 2F'::text,
    35.675804, 139.766449, '●東京メトロ（銀座線・丸ノ内線・日比谷線）『銀座駅』出口C8番より徒歩8分 / ●東京メトロ 有楽町線『銀座一丁目駅』出口3番より徒歩1分 / ●東京メトロ（銀座線）『京橋駅』出口3番より徒歩4分 / ●都営浅草線『宝町駅』出口A4番より徒歩15分 / ●JR(京浜東北線・山手線） 有楽町駅　京橋口より徒歩4分 / 銀座中央店は こちら'::text,
    'https://www.goldsgym.jp/shop/ginza-tokyo/'::text, 'https://www.goldsgym.jp/shop/ginza-tokyo/'::text, 'fitness_club'::text,
    true, '2026-08-13T10:50:11.569+00:00'::timestamptz
  ),
  (
    'aec3bfa8-5db9-485e-b3bb-d696e6d07d15'::uuid, 'b04baf0e-ded3-48f3-a2d9-127ae8f7c817'::uuid, 'JEXER Gym Flat イオンモール柏店', 'jexer-flat-kashiwa',
    null, '千葉県'::text, '柏市'::text, null,
    35.852562, 139.9599, null,
    'https://www.jexer.jp/flat/kashiwa/index.html'::text, 'https://www.jexer.jp/flat/kashiwa/index.html'::text, 'flat'::text,
    true, null
  ),
  (
    'afe426b7-bf66-4e40-8eb4-9a53f483547d'::uuid, 'bef520a9-236f-4ef9-b59d-28ae328090ca'::uuid, 'メガロス 中延', 'megalos-nakanobu',
    null, '東京都'::text, '品川区'::text, null,
    35.6059, 139.714386, null,
    'https://megalos.co.jp/nakanobu/'::text, 'https://megalos.co.jp/nakanobu/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    'b0748f9b-8070-4820-9440-01fcce1086a3'::uuid, 'dd9e21fe-f2a1-4728-92f8-8c89fa83931e'::uuid, '代々木上原東京', 'golds-gym-13190',
    '151-0066'::text, '東京都'::text, '渋谷区'::text, '西原3-8-5アコルデ代々木上原内'::text,
    35.66946, 139.680283, '〒 151-0066 東京都渋谷区西原3-8-5 アコルデ代々木上原内 / 千代田線、小田急線　代々木上原駅　駅ビル内　改札を出て左に回りこみ徒歩10秒'::text,
    'https://www.goldsgym.jp/shop/yoyogi-uehara-tokyo/'::text, 'https://www.goldsgym.jp/shop/yoyogi-uehara-tokyo/'::text, 'fitness_club'::text,
    true, '2026-08-13T10:50:11.569+00:00'::timestamptz
  ),
  (
    'b18edf9d-fef4-4cf6-9999-7102a30b28a1'::uuid, '8e66d169-68bf-4da1-8ed7-42307976e4ab'::uuid, 'セントラルフィットネスクラブ24 市ヶ尾', 'central-ichigao',
    '225-0024'::text, '神奈川県'::text, '横浜市青葉区'::text, '市ヶ尾町1162-7'::text,
    35.554013, 139.543133, null,
    'https://www.central.co.jp/club/ichigao/'::text, 'https://www.central.co.jp/club/ichigao/'::text, 'fitness_club'::text,
    true, '2026-08-09T12:29:34.761+00:00'::timestamptz
  ),
  (
    'b1dd4591-ecbd-4087-abb8-01938b263ad8'::uuid, 'ee1927f5-3d6d-4e4e-b632-ad9210540d56'::uuid, 'コナミスポーツクラブ 希望が丘', 'konami-sports-006027',
    null, '神奈川県'::text, '横浜市旭区東希望が丘'::text, null,
    35.461487, 139.515198, null,
    'https://information.konamisportsclub.jp/ksc/006027/'::text, 'https://information.konamisportsclub.jp/ksc/006027/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    'b28336ce-7abc-4dfb-927f-ae8efa78fcc6'::uuid, 'ee1927f5-3d6d-4e4e-b632-ad9210540d56'::uuid, 'コナミスポーツクラブ 三ツ境', 'konami-sports-004071',
    null, '神奈川県'::text, '横浜市瀬谷区三ツ境'::text, null,
    35.466576, 139.504166, null,
    'https://information.konamisportsclub.jp/ksc/004071/'::text, 'https://information.konamisportsclub.jp/ksc/004071/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    'b286f695-a3ca-4aa3-b1ab-1ac91e64cb8b'::uuid, '8e66d169-68bf-4da1-8ed7-42307976e4ab'::uuid, 'ザバススポーツクラブ/新松戸', 'central-csp-shinmatsudo',
    '270-0034'::text, '千葉県'::text, '松戸市'::text, '新松戸4-20'::text,
    35.827455, 139.919439, null,
    'https://www.central.co.jp/club/csp-shinmatsudo/'::text, 'https://www.central.co.jp/club/csp-shinmatsudo/'::text, 'fitness_club'::text,
    true, '2026-08-09T12:29:34.761+00:00'::timestamptz
  ),
  (
    'b29488aa-912c-474a-96d9-9c9213fba1dc'::uuid, 'f0c8c2f9-103a-4b7f-a385-5b0bb4a29aec'::uuid, '蘇我店', 'tipness-shp065',
    null, '千葉県'::text, '千葉市'::text, null,
    35.592618, 140.119661, null,
    'https://tip.tipness.co.jp/shop_info/SHP065/'::text, 'https://tip.tipness.co.jp/shop_info/SHP065/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    'b2a0699e-e859-4e51-8534-4de30f106f28'::uuid, 'b04baf0e-ded3-48f3-a2d9-127ae8f7c817'::uuid, 'JEXER BODY MAKE GYM モザイクモール港北店', 'jexer-bodymake-kohoku',
    null, '神奈川県'::text, '横浜市'::text, null,
    35.555016, 139.577957, null,
    'https://www.jexer.jp/bodymakegym/kohoku/index.html'::text, 'https://www.jexer.jp/bodymakegym/kohoku/index.html'::text, 'bodymake_gym'::text,
    true, null
  ),
  (
    'b3def4af-997a-4698-bdeb-bcd46e1d2738'::uuid, '0f49d25a-b01b-4edd-89bd-5457f5c6459e'::uuid, 'ホットヨガスタジオ美温 武蔵浦和', 'sports-club-nas-store-musashiurawa-index',
    null, '埼玉県'::text, 'さいたま市'::text, null,
    35.845951, 139.648346, null,
    'http://www.bion-yoga.jp/store/musashiurawa/index.html'::text, 'http://www.bion-yoga.jp/store/musashiurawa/index.html'::text, 'fitness_club'::text,
    true, null
  ),
  (
    'b58b176c-9a0b-4ee7-86eb-17ef4efb4b1b'::uuid, '8e66d169-68bf-4da1-8ed7-42307976e4ab'::uuid, 'セントラルフィットネスクラブ 東戸塚駅前', 'central-higashitotsuka-f',
    '244-0805'::text, '神奈川県'::text, '横浜市戸塚区'::text, '川上町97-1'::text,
    35.430205, 139.553797, null,
    'https://www.central.co.jp/club/higashitotsuka-f/'::text, 'https://www.central.co.jp/club/higashitotsuka-f/'::text, 'fitness_club'::text,
    true, '2026-08-09T12:29:34.761+00:00'::timestamptz
  ),
  (
    'b5d0318f-f0e1-4f37-80f1-76e8acd011c0'::uuid, '8e66d169-68bf-4da1-8ed7-42307976e4ab'::uuid, 'セントラルスポーツ ジムスタ 新浦安', 'central-gs-shinurayasu',
    '279-0014'::text, '千葉県'::text, '浦安市'::text, '明海4-1-1 ニューコースト新浦安 3F'::text,
    35.642924, 139.922863, null,
    'https://www.central.co.jp/club/gs-shinurayasu/'::text, 'https://www.central.co.jp/club/gs-shinurayasu/'::text, 'fitness_club'::text,
    true, '2026-08-09T12:29:34.761+00:00'::timestamptz
  ),
  (
    'b6abbbf0-0f70-456b-9fb9-a13c8c4eb134'::uuid, 'f0c8c2f9-103a-4b7f-a385-5b0bb4a29aec'::uuid, '六本木店', 'tipness-shp008',
    null, '東京都'::text, '港区'::text, null,
    35.661864, 139.731374, null,
    'https://tip.tipness.co.jp/shop_info/SHP008/'::text, 'https://tip.tipness.co.jp/shop_info/SHP008/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    'b74415d3-2d04-40a4-ba11-3c91f4e26f1d'::uuid, 'b04baf0e-ded3-48f3-a2d9-127ae8f7c817'::uuid, 'JEXER 新宿', 'jexer-shinjuku',
    '151-0053'::text, '東京都'::text, '渋谷区'::text, '代々木二丁目1番5号 JR南新宿ビル1F'::text,
    35.6889, 139.6997, '新宿駅'::text,
    'https://www.jexer.jp/fitness/shinjuku/'::text, 'https://www.jexer.jp/mb/shinjuku/schedule/index.html'::text, 'fitness_spa'::text,
    true, '2026-04-13T23:20:10.092538+00:00'::timestamptz
  ),
  (
    'b7501ba8-c364-4e0a-9967-a0af60454d9d'::uuid, 'ee1927f5-3d6d-4e4e-b632-ad9210540d56'::uuid, 'コナミスポーツクラブ 厚木', 'konami-sports-000643',
    null, '神奈川県'::text, '厚木市戸室'::text, null,
    35.448647, 139.343338, null,
    'https://information.konamisportsclub.jp/ksc/000643/'::text, 'https://information.konamisportsclub.jp/ksc/000643/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    'b789cc9f-8510-434c-b9e7-6a6e7a450295'::uuid, '8e66d169-68bf-4da1-8ed7-42307976e4ab'::uuid, 'セントラルウェルネスクラブ 新浦安', 'central-shinurayasu',
    '279-0012'::text, '千葉県'::text, '浦安市'::text, '入船1-4-1 イオン新浦安店4F'::text,
    35.6492, 139.915342, null,
    'https://www.central.co.jp/club/shinurayasu/'::text, 'https://www.central.co.jp/club/shinurayasu/'::text, 'fitness_club'::text,
    true, '2026-08-09T12:29:34.761+00:00'::timestamptz
  ),
  (
    'b85d7a6c-6e14-444b-89db-686d3d59f2f0'::uuid, 'bef520a9-236f-4ef9-b59d-28ae328090ca'::uuid, 'メガロス 立川南館', 'megalos-tachikawa-kita-2',
    null, '東京都'::text, '立川市'::text, null,
    35.696514, 139.412796, null,
    'https://megalos.co.jp/tachikawa_kita/'::text, 'https://megalos.co.jp/tachikawa_kita/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    'b8e0068d-2728-4c2c-a872-2d44450e33d2'::uuid, '8e66d169-68bf-4da1-8ed7-42307976e4ab'::uuid, 'セントラルフィットネスクラブ24 蘇我', 'central-soga',
    '260-0842'::text, '千葉県'::text, '千葉市中央区'::text, '南町2-6-10'::text,
    35.582639, 140.133674, null,
    'https://www.central.co.jp/club/soga/'::text, 'https://www.central.co.jp/club/soga/'::text, 'fitness_club'::text,
    true, '2026-08-09T12:29:34.761+00:00'::timestamptz
  ),
  (
    'b8f2f557-72a2-418a-8b09-976df593a998'::uuid, 'bef520a9-236f-4ef9-b59d-28ae328090ca'::uuid, 'メガロス 綱島', 'megalos-tsunashima',
    null, '神奈川県'::text, '横浜市'::text, null,
    35.536896, 139.630692, null,
    'https://megalos.co.jp/tsunashima/'::text, 'https://megalos.co.jp/tsunashima/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    'b9a2be3b-5beb-488c-8ab0-c9dad23345ba'::uuid, '8e66d169-68bf-4da1-8ed7-42307976e4ab'::uuid, 'セントラルフィットネスクラブ24 館山', 'central-tateyama',
    '294-0036'::text, '千葉県'::text, '館山市'::text, '館山83-2'::text,
    34.985934, 139.85239, null,
    'https://www.central.co.jp/club/tateyama/'::text, 'https://www.central.co.jp/club/tateyama/'::text, 'fitness_club'::text,
    true, '2026-08-09T12:29:34.761+00:00'::timestamptz
  ),
  (
    'ba2062a6-5831-4efc-92e2-b223473da05c'::uuid, 'f0c8c2f9-103a-4b7f-a385-5b0bb4a29aec'::uuid, '五反田店', 'tipness-shp005',
    null, '東京都'::text, '品川区'::text, null,
    35.625367, 139.725956, null,
    'https://tip.tipness.co.jp/shop_info/SHP005/'::text, 'https://tip.tipness.co.jp/shop_info/SHP005/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    'baadc3ff-caa2-4f9d-ab8a-49c7f69ee136'::uuid, '8e66d169-68bf-4da1-8ed7-42307976e4ab'::uuid, 'セントラルウェルネスクラブ24 柏', 'central-kashiwa',
    '277-0842'::text, '千葉県'::text, '柏市'::text, '末広町6-1 5F'::text,
    35.864375, 139.969557, null,
    'https://www.central.co.jp/club/kashiwa/'::text, 'https://www.central.co.jp/club/kashiwa/'::text, 'fitness_club'::text,
    true, '2026-08-09T12:29:34.761+00:00'::timestamptz
  ),
  (
    'bb9fce1e-593f-4c18-9fb7-89aa6c3f2b67'::uuid, '0f49d25a-b01b-4edd-89bd-5457f5c6459e'::uuid, 'NAS湘南台', 'sports-club-nas-shonandai-index',
    null, '神奈川県'::text, '藤沢市'::text, null,
    35.398144, 139.468567, null,
    'https://www.nas-club.co.jp/shonandai/index.html'::text, 'https://www.nas-club.co.jp/shonandai/index.html'::text, 'fitness_club'::text,
    true, null
  ),
  (
    'bbe7a12f-d21c-4d17-989c-2f955c89ee99'::uuid, 'bef520a9-236f-4ef9-b59d-28ae328090ca'::uuid, 'メガロス 大和', 'megalos-yamato',
    null, '神奈川県'::text, '大和市'::text, null,
    35.466671, 139.460648, null,
    'https://megalos.co.jp/yamato/'::text, 'https://megalos.co.jp/yamato/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    'bbf47e32-f58a-4def-a996-e97709b02f51'::uuid, 'bef520a9-236f-4ef9-b59d-28ae328090ca'::uuid, 'メガロス 白金台', 'megalos-shirokanedai',
    null, '東京都'::text, '港区'::text, null,
    35.636162, 139.723221, null,
    'https://megalos.co.jp/shirokanedai/'::text, 'https://megalos.co.jp/shirokanedai/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    'bc432038-904d-450a-82ff-6fa000609de9'::uuid, 'ee1927f5-3d6d-4e4e-b632-ad9210540d56'::uuid, 'コナミスポーツ ジュニアスクール 中野', 'konami-sports-007701',
    null, '東京都'::text, '中野区'::text, null,
    35.704216, 139.66597, null,
    'https://information.konamisportsclub.jp/ksc/007701/'::text, 'https://information.konamisportsclub.jp/ksc/007701/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    'bc4db254-ec07-4096-a33d-29507ec7665f'::uuid, '0f49d25a-b01b-4edd-89bd-5457f5c6459e'::uuid, 'NAS PILATES ON THE GO リバーシティ21', 'sports-club-nas-np-onthego-rivercity21',
    null, '東京都'::text, '中央区'::text, null,
    35.668316, 139.786987, null,
    'https://www.nas-club.co.jp/np-onthego/rivercity21/'::text, 'https://www.nas-club.co.jp/np-onthego/rivercity21/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    'bc7ff933-8ac4-446f-b76b-c366aad32dde'::uuid, '8e66d169-68bf-4da1-8ed7-42307976e4ab'::uuid, 'セントラルフィットネスクラブ 千葉', 'central-chiba-f',
    '260-0028'::text, '千葉県'::text, '千葉市中央区'::text, '新町18-14 千葉新町ビル1F'::text,
    35.610089, 140.113423, null,
    'https://www.central.co.jp/club/chiba-f/'::text, 'https://www.central.co.jp/club/chiba-f/'::text, 'fitness_club'::text,
    true, '2026-08-09T12:29:34.761+00:00'::timestamptz
  ),
  (
    'bcffdab7-942f-42df-9751-062628858b4a'::uuid, '0f49d25a-b01b-4edd-89bd-5457f5c6459e'::uuid, 'ホットヨガスタジオPURUMO蕨', 'sports-club-nas-store-warabi',
    null, '埼玉県'::text, '蕨市'::text, null,
    35.826038, 139.689926, null,
    'http://purumo.jp/store/warabi/'::text, 'http://purumo.jp/store/warabi/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    'bd2eb014-4b53-45e8-bd19-0026488186a5'::uuid, '8e66d169-68bf-4da1-8ed7-42307976e4ab'::uuid, 'セントラルスポーツクラブ 岩槻', 'central-iwatsuki',
    '339-0056'::text, '埼玉県'::text, 'さいたま市岩槻区'::text, '加倉1-1-8'::text,
    35.948154, 139.690872, null,
    'https://www.central.co.jp/club/iwatsuki/'::text, 'https://www.central.co.jp/club/iwatsuki/'::text, 'fitness_club'::text,
    true, '2026-08-09T12:29:34.761+00:00'::timestamptz
  ),
  (
    'bde2dab8-c9d1-42f2-9cce-2315dbe783f0'::uuid, '8e66d169-68bf-4da1-8ed7-42307976e4ab'::uuid, 'セントラルウェルネスクラブ24 上池袋', 'central-w-kamiikebukuro',
    null, '東京都'::text, null, null,
    35.737186, 139.723162, null,
    'https://www.central.co.jp/club/w_kamiikebukuro/'::text, 'https://www.central.co.jp/club/w_kamiikebukuro/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    'be169f7d-c29b-44e2-b474-3ad820dfbc1d'::uuid, 'bef520a9-236f-4ef9-b59d-28ae328090ca'::uuid, 'メガロス ルフレ 麻布十番ー女性専用ジム＆スタジオー', 'megalos-azabujuban-reflet',
    null, '東京都'::text, '港区'::text, null,
    35.654858, 139.735077, null,
    'https://megalos.co.jp/azabujuban_reflet/'::text, 'https://megalos.co.jp/azabujuban_reflet/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    'bef0b8d1-3394-4138-9921-7aa36ac30319'::uuid, 'ee1927f5-3d6d-4e4e-b632-ad9210540d56'::uuid, 'コナミスポーツクラブ 上大岡', 'konami-sports-004409',
    null, '神奈川県'::text, '横浜市港南区上大岡西'::text, null,
    35.407303, 139.59494, null,
    'https://information.konamisportsclub.jp/ksc/004409/'::text, 'https://information.konamisportsclub.jp/ksc/004409/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    'bef4398d-d772-4669-8702-897cfa1b26ba'::uuid, 'ee1927f5-3d6d-4e4e-b632-ad9210540d56'::uuid, 'コナミスポーツクラブ 大森町', 'konami-sports-007877',
    null, '東京都'::text, '大田区大森西'::text, null,
    35.574268, 139.733627, null,
    'https://information.konamisportsclub.jp/ksc/007877/'::text, 'https://information.konamisportsclub.jp/ksc/007877/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    'bf7c5aad-2505-46ea-9a4e-cfa36ecad4d3'::uuid, '8e66d169-68bf-4da1-8ed7-42307976e4ab'::uuid, 'セントラルフィットネスクラブ 24 新三郷', 'central-misato',
    '341-0021'::text, '埼玉県'::text, '三郷市'::text, 'さつき平2-1-1'::text,
    35.852829, 139.865504, null,
    'https://www.central.co.jp/club/misato/'::text, 'https://www.central.co.jp/club/misato/'::text, 'fitness_club'::text,
    true, '2026-08-09T12:29:34.761+00:00'::timestamptz
  ),
  (
    'c1e2c989-1cfb-4327-92bd-4ef338cecd05'::uuid, 'f0c8c2f9-103a-4b7f-a385-5b0bb4a29aec'::uuid, '蒲田店', 'tipness-shp041',
    null, '東京都'::text, '大田区'::text, null,
    35.561686, 139.720371, null,
    'https://tip.tipness.co.jp/shop_info/SHP041/'::text, 'https://tip.tipness.co.jp/shop_info/SHP041/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    'c2bc347e-c362-4acd-907f-f339241f8d8f'::uuid, '8e66d169-68bf-4da1-8ed7-42307976e4ab'::uuid, 'セントラルフィットネスクラブ 西台', 'central-nishidai',
    null, '東京都'::text, null, null,
    null, null, null,
    'https://www.central.co.jp/club/nishidai/'::text, 'https://www.central.co.jp/club/nishidai/'::text, 'fitness_club'::text,
    false, null
  ),
  (
    'c38288a6-0477-48bd-9d26-80003d6010be'::uuid, 'bef520a9-236f-4ef9-b59d-28ae328090ca'::uuid, 'メガロス 武蔵小金井', 'megalos-musashi',
    null, '東京都'::text, '小金井市'::text, null,
    35.702068, 139.512924, null,
    'https://megalos.co.jp/musashi/'::text, 'https://megalos.co.jp/musashi/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    'c3afed3c-5a34-4eb4-bc9b-57f4a6b2013a'::uuid, '0f49d25a-b01b-4edd-89bd-5457f5c6459e'::uuid, 'ホットヨガスタジオ美温 大崎', 'sports-club-nas-store-osaki-index',
    null, '東京都'::text, '品川区'::text, null,
    35.619083, 139.726807, null,
    'http://www.bion-yoga.jp/store/osaki/index.html'::text, 'http://www.bion-yoga.jp/store/osaki/index.html'::text, 'fitness_club'::text,
    true, null
  ),
  (
    'c4a705ac-82e1-4fe4-941d-e2e632addcd1'::uuid, 'ee1927f5-3d6d-4e4e-b632-ad9210540d56'::uuid, 'コナミスポーツクラブ 船橋', 'konami-sports-004404',
    null, '千葉県'::text, '船橋市湊町'::text, null,
    35.694977, 139.980835, null,
    'https://information.konamisportsclub.jp/ksc/004404/'::text, 'https://information.konamisportsclub.jp/ksc/004404/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    'c4d82126-3eee-4321-87e9-38bbfc9d447b'::uuid, 'ee1927f5-3d6d-4e4e-b632-ad9210540d56'::uuid, 'コナミスポーツクラブ 飯田橋', 'konami-sports-004414',
    null, '東京都'::text, '新宿区揚場町'::text, null,
    35.70155, 139.742813, null,
    'https://information.konamisportsclub.jp/ksc/004414/'::text, 'https://information.konamisportsclub.jp/ksc/004414/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    'c53e7e0a-2c89-4e30-8a04-b4fcb6ba5807'::uuid, 'f0c8c2f9-103a-4b7f-a385-5b0bb4a29aec'::uuid, '宮前平店', 'tipness-shp074',
    null, '神奈川県'::text, '川崎市'::text, null,
    35.584726, 139.583643, null,
    'https://tip.tipness.co.jp/shop_info/SHP074/'::text, 'https://tip.tipness.co.jp/shop_info/SHP074/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    'c5730a5c-4046-4a3c-9987-61ffaf48bb05'::uuid, 'ee1927f5-3d6d-4e4e-b632-ad9210540d56'::uuid, 'コナミスポーツ テニススクール 狭山', 'konami-sports-004033',
    null, '埼玉県'::text, '狭山市入間川'::text, null,
    35.860973, 139.407822, null,
    'https://information.konamisportsclub.jp/ksc/004033/'::text, 'https://information.konamisportsclub.jp/ksc/004033/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    'c58a12a7-dfd3-4592-b23d-52657c18d49a'::uuid, '0f49d25a-b01b-4edd-89bd-5457f5c6459e'::uuid, 'NAS芦花公園', 'sports-club-nas-rokakoen-index',
    '157-0062'::text, '東京都'::text, '世田谷区'::text, '南烏山1-10-22 1・2F'::text,
    null, null, '京王線 芦花公園駅 徒歩3分'::text,
    'https://www.nas-club.co.jp/rokakoen/index.html'::text, 'https://www.nas-club.co.jp/rokakoen/index.html'::text, 'fitness_club'::text,
    true, null
  ),
  (
    'c59c867d-f815-49d9-a932-753a2d903f5f'::uuid, '8e66d169-68bf-4da1-8ed7-42307976e4ab'::uuid, 'セントラルスポーツ ジムスタ さいたま中央(大宮)', 'central-gs-saitamachuo',
    '338-0001'::text, '埼玉県'::text, 'さいたま市中央区'::text, '上落合8-3-32 HOME''Sさいたま中央2F'::text,
    35.899685, 139.622793, null,
    'https://www.central.co.jp/club/gs-saitamachuo/'::text, 'https://www.central.co.jp/club/gs-saitamachuo/'::text, 'fitness_club'::text,
    true, '2026-08-09T12:29:34.761+00:00'::timestamptz
  ),
  (
    'c657c796-54aa-4e88-bd83-f099ab06edf7'::uuid, 'ee1927f5-3d6d-4e4e-b632-ad9210540d56'::uuid, 'グランサイズ 恵比寿ガーデン', 'konami-sports-004103',
    null, '東京都'::text, '目黒区三田1丁目'::text, null,
    35.641702, 139.7138, null,
    'https://information.konamisportsclub.jp/004103.html'::text, 'https://information.konamisportsclub.jp/004103.html'::text, 'fitness_club'::text,
    true, null
  ),
  (
    'c749c310-41b8-48a9-8aea-58fe28bd9e5a'::uuid, '8e66d169-68bf-4da1-8ed7-42307976e4ab'::uuid, 'セントラルフィットネスクラブ24 用賀', 'central-yoga',
    null, '東京都'::text, null, null,
    35.62535, 139.633887, null,
    'https://www.central.co.jp/club/yoga/'::text, 'https://www.central.co.jp/club/yoga/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    'c7a630c8-ac8b-47af-b817-7a2dc3c2fc4e'::uuid, 'bef520a9-236f-4ef9-b59d-28ae328090ca'::uuid, 'メガロス 相模大野', 'megalos-sagamiono',
    null, '神奈川県'::text, '相模原市'::text, null,
    35.531738, 139.435242, null,
    'https://megalos.co.jp/sagamiono/'::text, 'https://megalos.co.jp/sagamiono/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    'c8694141-4d79-4d06-a73b-cad40aaaa4ea'::uuid, 'ee1927f5-3d6d-4e4e-b632-ad9210540d56'::uuid, 'コナミスポーツクラブ 津田沼', 'konami-sports-004411',
    null, '千葉県'::text, '習志野市津田沼'::text, null,
    35.688187, 140.025925, null,
    'https://information.konamisportsclub.jp/ksc/004411/'::text, 'https://information.konamisportsclub.jp/ksc/004411/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    'c8c5f48a-7a3d-45d1-9b71-63c77bcb992c'::uuid, 'f0c8c2f9-103a-4b7f-a385-5b0bb4a29aec'::uuid, '綾瀬店', 'tipness-shp049',
    null, '東京都'::text, '足立区'::text, null,
    35.764219, 139.827373, null,
    'https://tip.tipness.co.jp/shop_info/SHP049/'::text, 'https://tip.tipness.co.jp/shop_info/SHP049/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    'c8fb3095-4f31-4e78-899d-190bd2858613'::uuid, 'bef520a9-236f-4ef9-b59d-28ae328090ca'::uuid, 'メガロス ルフレ 恵比寿ー女性専用ジム＆スタジオー', 'megalos-ebisu-reflet',
    null, '東京都'::text, '渋谷区'::text, null,
    35.644894, 139.708603, null,
    'https://megalos.co.jp/ebisu_reflet/'::text, 'https://megalos.co.jp/ebisu_reflet/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    'c90667d4-11e6-40a1-8b9d-33b38247e605'::uuid, '8e66d169-68bf-4da1-8ed7-42307976e4ab'::uuid, 'セントラルフィットネスクラブ 新川崎', 'central-shinkawasaki',
    '212-0054'::text, '神奈川県'::text, '川崎市幸区'::text, '小倉1-1 パークシティ新川崎内 プール棟'::text,
    35.547882, 139.675343, null,
    'https://www.central.co.jp/club/shinkawasaki/'::text, 'https://www.central.co.jp/club/shinkawasaki/'::text, 'fitness_club'::text,
    true, '2026-08-09T12:29:34.761+00:00'::timestamptz
  ),
  (
    'c93337d0-c24a-4b7e-b15a-dc5a02307bde'::uuid, 'dd9e21fe-f2a1-4728-92f8-8c89fa83931e'::uuid, '横須賀神奈川', 'golds-gym-14150',
    '238-0007'::text, '神奈川県'::text, '横須賀市'::text, '若松町2-4横須賀中央駅前ビル 5F'::text,
    35.279613, 139.669983, '京急横須賀中央駅より徒歩1分'::text,
    'https://www.goldsgym.jp/shop/yokosuka-kanagawa/'::text, 'https://www.goldsgym.jp/shop/yokosuka-kanagawa/'::text, 'fitness_club'::text,
    true, '2026-08-13T10:50:11.57+00:00'::timestamptz
  ),
  (
    'c988e636-3c6b-4d3b-8988-abfeac4e844a'::uuid, 'bef520a9-236f-4ef9-b59d-28ae328090ca'::uuid, 'メガロス 吉祥寺', 'megalos-kichijoji',
    null, '東京都'::text, '武蔵野市'::text, null,
    35.70406, 139.586182, null,
    'https://megalos.co.jp/kichijoji/'::text, 'https://megalos.co.jp/kichijoji/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    'ca898b23-03ed-4bbc-be14-7f8a48f21016'::uuid, '8e66d169-68bf-4da1-8ed7-42307976e4ab'::uuid, 'セントラルフィットネスクラブ24 溝ノ口', 'central-mizonokuchi',
    '213-0001'::text, '神奈川県'::text, '川崎市高津区'::text, '溝口2-10-22'::text,
    35.601333, 139.610604, null,
    'https://www.central.co.jp/club/mizonokuchi/'::text, 'https://www.central.co.jp/club/mizonokuchi/'::text, 'fitness_club'::text,
    true, '2026-08-09T12:29:34.761+00:00'::timestamptz
  ),
  (
    'cb527185-617f-48b1-8e41-189d7bceec9f'::uuid, 'dd9e21fe-f2a1-4728-92f8-8c89fa83931e'::uuid, '東浦和さいたま（フランチャイズ店）', 'golds-gym-higashi-urawa-saitama-fc',
    '336-0932'::text, '埼玉県'::text, 'さいたま市緑区'::text, '大字中尾緑島2503-3'::text,
    35.866632, 139.684056, '浦和駅　徒歩20分 / 浦和駅東口　国際興業バス　浦04系統　大谷口県営住宅　下車　徒歩3分 / 東浦和駅　徒歩20分'::text,
    'https://www.goldsgym.jp/shop/higashi-urawa-saitama%ef%bc%88fc%ef%bc%89/'::text, 'https://www.goldsgym.jp/shop/higashi-urawa-saitama%ef%bc%88fc%ef%bc%89/'::text, 'fitness_club'::text,
    true, '2026-08-13T10:50:11.57+00:00'::timestamptz
  ),
  (
    'cc32cd61-2224-403b-9e9f-c673eae0deaf'::uuid, 'ee1927f5-3d6d-4e4e-b632-ad9210540d56'::uuid, 'エグザス 奏の杜', 'konami-sports-004112',
    null, '千葉県'::text, '習志野市'::text, null,
    35.69038, 140.014679, null,
    'https://information.konamisportsclub.jp/ksc/004112/'::text, 'https://information.konamisportsclub.jp/ksc/004112/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    'cd5e7438-ca50-4458-8a07-20cabe3e9e4f'::uuid, 'ee1927f5-3d6d-4e4e-b632-ad9210540d56'::uuid, 'コナミスポーツクラブ 北小金', 'konami-sports-004475',
    null, '千葉県'::text, '松戸市小金'::text, null,
    35.832893, 139.931442, null,
    'https://information.konamisportsclub.jp/ksc/004475/'::text, 'https://information.konamisportsclub.jp/ksc/004475/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    'ce0f6e5d-3455-4305-85b8-68a50dd5a57b'::uuid, '0f49d25a-b01b-4edd-89bd-5457f5c6459e'::uuid, 'NAS大崎', 'sports-club-nas-osaki-index',
    '141-0032'::text, '東京都'::text, '品川区'::text, '大崎2-1-3 ダイワロイネットホテル（フロント2F）'::text,
    null, null, 'JR山手線 大崎駅南改札口 徒歩2分'::text,
    'https://www.nas-club.co.jp/osaki/index.html'::text, 'https://www.nas-club.co.jp/osaki/index.html'::text, 'fitness_club'::text,
    true, null
  ),
  (
    'ce1fe2ba-7861-402b-956e-dc3c36a29543'::uuid, '8e66d169-68bf-4da1-8ed7-42307976e4ab'::uuid, 'セントラルフィットネスクラブ 湘南平塚', 'central-hiratsuka',
    '254-0034'::text, '神奈川県'::text, '平塚市'::text, '宝町3-1 MNプラザ4F'::text,
    35.329618, 139.350883, null,
    'https://www.central.co.jp/club/hiratsuka/'::text, 'https://www.central.co.jp/club/hiratsuka/'::text, 'fitness_club'::text,
    true, '2026-08-09T12:29:34.761+00:00'::timestamptz
  ),
  (
    'ce3e0130-27bc-4c0f-9220-d4a1e8fb9bf4'::uuid, 'f0c8c2f9-103a-4b7f-a385-5b0bb4a29aec'::uuid, '新百合ヶ丘店', 'tipness-shp035',
    null, '神奈川県'::text, '川崎市'::text, null,
    35.60306, 139.509271, null,
    'https://tip.tipness.co.jp/shop_info/SHP035/'::text, 'https://tip.tipness.co.jp/shop_info/SHP035/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    'cf9547b0-a38d-48b0-99aa-b9aa7db2a1fd'::uuid, '8e66d169-68bf-4da1-8ed7-42307976e4ab'::uuid, 'セントラルフィットネスクラブ センター南', 'central-centerminami',
    '224-0032'::text, '神奈川県'::text, '横浜市都筑区'::text, '茅ヶ崎中央55-1 パインクリエイトビル5F'::text,
    35.547253, 139.573766, null,
    'https://www.central.co.jp/club/centerminami/'::text, 'https://www.central.co.jp/club/centerminami/'::text, 'fitness_club'::text,
    true, '2026-08-09T12:29:34.761+00:00'::timestamptz
  ),
  (
    'cfa96f1a-1e83-42cf-9dcf-c51beea96eb9'::uuid, '0f49d25a-b01b-4edd-89bd-5457f5c6459e'::uuid, 'NAS新鎌ヶ谷', 'sports-club-nas-shinkamagaya-index',
    null, '千葉県'::text, '鎌ケ谷市'::text, null,
    35.780136, 140.001419, null,
    'https://www.nas-club.co.jp/shinkamagaya/index.html'::text, 'https://www.nas-club.co.jp/shinkamagaya/index.html'::text, 'fitness_club'::text,
    true, null
  ),
  (
    'cfb41388-ffda-447d-a609-ddb8fbc5bfac'::uuid, 'ee1927f5-3d6d-4e4e-b632-ad9210540d56'::uuid, 'コナミスポーツクラブ 五井', 'konami-sports-004039',
    null, '千葉県'::text, '市原市五井'::text, null,
    35.519863, 140.088348, null,
    'https://information.konamisportsclub.jp/ksc/004039/'::text, 'https://information.konamisportsclub.jp/ksc/004039/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    'd07c4ee0-e8b4-4813-a2f3-7d0693e3b164'::uuid, 'f0c8c2f9-103a-4b7f-a385-5b0bb4a29aec'::uuid, '東武練馬店', 'tipness-shp025',
    null, '東京都'::text, '練馬区'::text, null,
    35.767401, 139.661524, null,
    'https://tip.tipness.co.jp/shop_info/SHP025/'::text, 'https://tip.tipness.co.jp/shop_info/SHP025/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    'd0bc145b-d10e-4303-ae9b-fa6b64483f82'::uuid, '8e66d169-68bf-4da1-8ed7-42307976e4ab'::uuid, 'セントラルウェルネスクラブ ワンズモール長沼', 'central-naganuma',
    '263-0005'::text, '千葉県'::text, '千葉市稲毛区'::text, '長沼町330-50 ワンズモール3F'::text,
    35.65636, 140.117751, null,
    'https://www.central.co.jp/club/naganuma/'::text, 'https://www.central.co.jp/club/naganuma/'::text, 'fitness_club'::text,
    true, '2026-08-09T12:29:34.761+00:00'::timestamptz
  ),
  (
    'd12c13b2-a6b7-4845-8590-577a5444a0a9'::uuid, 'dd9e21fe-f2a1-4728-92f8-8c89fa83931e'::uuid, '南船橋千葉', 'golds-gym-minamifunabashi-chiba',
    '273-0012'::text, '千葉県'::text, '船橋市'::text, '浜町2-2-7ららぽーとTOKYO-BAYNorthGate 4F'::text,
    35.687626, 139.992218, 'JR京葉線《南船橋駅》より徒歩約10分 / 京成本線《船橋競馬場駅》より徒歩約5分'::text,
    'https://www.goldsgym.jp/shop/minamifunabashi-chiba/'::text, 'https://www.goldsgym.jp/shop/minamifunabashi-chiba/'::text, 'fitness_club'::text,
    true, '2026-08-13T10:50:11.57+00:00'::timestamptz
  ),
  (
    'd24cef24-e2bb-4137-a227-34e451c2639d'::uuid, 'ee1927f5-3d6d-4e4e-b632-ad9210540d56'::uuid, 'コナミスポーツクラブ 碑文谷', 'konami-sports-006034',
    null, '東京都'::text, '目黒区碑文谷'::text, null,
    35.625423, 139.689285, null,
    'https://information.konamisportsclub.jp/ksc/006034/'::text, 'https://information.konamisportsclub.jp/ksc/006034/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    'd2f92acb-e82f-4b48-ac42-28213ce6134b'::uuid, '8e66d169-68bf-4da1-8ed7-42307976e4ab'::uuid, 'セントラルウェルネスクラブ24 能見台', 'central-noukendai',
    '236-0058'::text, '神奈川県'::text, '横浜市金沢区'::text, '能見台東10-2'::text,
    35.357771, 139.624799, null,
    'https://www.central.co.jp/club/noukendai/'::text, 'https://www.central.co.jp/club/noukendai/'::text, 'fitness_club'::text,
    true, '2026-08-09T12:29:34.761+00:00'::timestamptz
  ),
  (
    'd4287117-6a00-48a9-bf86-6bd971b01424'::uuid, '8e66d169-68bf-4da1-8ed7-42307976e4ab'::uuid, 'セントラルウェルネスクラブ24 大森', 'central-omori',
    null, '東京都'::text, null, null,
    35.586757, 139.727756, null,
    'https://www.central.co.jp/club/omori/'::text, 'https://www.central.co.jp/club/omori/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    'd548b263-bcb0-4d41-9b4e-ee518074b301'::uuid, '8e66d169-68bf-4da1-8ed7-42307976e4ab'::uuid, 'セントラルフィットネスクラブ24 緑園都市', 'central-ryokuentoshi',
    '245-0002'::text, '神奈川県'::text, '横浜市泉区'::text, '緑園4-2-1'::text,
    35.440385, 139.522675, null,
    'https://www.central.co.jp/club/ryokuentoshi/'::text, 'https://www.central.co.jp/club/ryokuentoshi/'::text, 'fitness_club'::text,
    true, '2026-08-09T12:29:34.761+00:00'::timestamptz
  ),
  (
    'd5b340d4-cbde-4e09-9df0-df2e18f8ff34'::uuid, '8e66d169-68bf-4da1-8ed7-42307976e4ab'::uuid, 'セントラルウェルネスクラブ24 長津田みなみ台', 'central-w-nagatsuta',
    '226-0018'::text, '神奈川県'::text, '横浜市緑区'::text, '長津田みなみ台1-38-1'::text,
    35.5225, 139.498103, null,
    'https://www.central.co.jp/club/w_nagatsuta/'::text, 'https://www.central.co.jp/club/w_nagatsuta/'::text, 'fitness_club'::text,
    true, '2026-08-09T12:29:34.761+00:00'::timestamptz
  ),
  (
    'd6327390-b3a1-450f-a465-0b19af531dca'::uuid, 'ee1927f5-3d6d-4e4e-b632-ad9210540d56'::uuid, 'コナミスポーツクラブ 五香', 'konami-sports-004089',
    null, '千葉県'::text, '松戸市常盤平'::text, null,
    35.79715, 139.965775, null,
    'https://information.konamisportsclub.jp/ksc/004089/'::text, 'https://information.konamisportsclub.jp/ksc/004089/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    'd6d78edb-20fe-4732-90ad-0aed0f47dd22'::uuid, '8e66d169-68bf-4da1-8ed7-42307976e4ab'::uuid, 'セントラルスポーツ ジムスタ 飯田橋サクラテラス', 'central-cf-iidabashi',
    null, '東京都'::text, null, null,
    35.698512, 139.743535, null,
    'https://www.central.co.jp/club/cf-iidabashi/'::text, 'https://www.central.co.jp/club/cf-iidabashi/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    'd724bed0-1782-4763-9981-32d87f4a906d'::uuid, 'f0c8c2f9-103a-4b7f-a385-5b0bb4a29aec'::uuid, '鴨居店', 'tipness-shp067',
    null, '神奈川県'::text, '横浜市'::text, null,
    35.515522, 139.564532, null,
    'https://tip.tipness.co.jp/shop_info/SHP067/'::text, 'https://tip.tipness.co.jp/shop_info/SHP067/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    'd72f7e59-9152-425c-8906-66a17abd4179'::uuid, 'bef520a9-236f-4ef9-b59d-28ae328090ca'::uuid, 'メガロス 八王子', 'megalos-hachiouji',
    null, '東京都'::text, '八王子市'::text, null,
    35.653885, 139.342545, null,
    'https://megalos.co.jp/hachiouji/'::text, 'https://megalos.co.jp/hachiouji/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    'd75c411f-2b58-476d-aa68-f7bde9000002'::uuid, 'dd9e21fe-f2a1-4728-92f8-8c89fa83931e'::uuid, '東陽町スーパーセンター', 'golds-gym-71221',
    '135-0016'::text, '東京都'::text, '江東区'::text, '東陽2-2-20'::text,
    35.666416, 139.816544, '東陽町駅からの案内は こちら'::text,
    'https://www.goldsgym.jp/shop/toyocho-super-center/'::text, 'https://www.goldsgym.jp/shop/toyocho-super-center/'::text, 'fitness_club'::text,
    true, '2026-08-13T10:50:11.569+00:00'::timestamptz
  ),
  (
    'd8e80d88-49f5-40f2-965a-c8f67e9fee68'::uuid, 'bef520a9-236f-4ef9-b59d-28ae328090ca'::uuid, 'メガロス 市ヶ尾', 'megalos-ichigao',
    null, '神奈川県'::text, '横浜市'::text, null,
    35.551044, 139.541061, null,
    'https://megalos.co.jp/ichigao/'::text, 'https://megalos.co.jp/ichigao/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    'd9b45eec-2081-4229-8896-86fb188aee47'::uuid, '0f49d25a-b01b-4edd-89bd-5457f5c6459e'::uuid, 'NAS Wellness&Spa CLUB芝浦アイランド （プレミアム店舗）', 'sports-club-nas-shibaura-index',
    null, '東京都'::text, '港区'::text, null,
    35.639462, 139.751404, null,
    'https://www.nas-club.co.jp/shibaura/index.html'::text, 'https://www.nas-club.co.jp/shibaura/index.html'::text, 'fitness_club'::text,
    true, null
  ),
  (
    'db43ad08-4ef1-4319-b4d1-c5fd9e3f232b'::uuid, '8e66d169-68bf-4da1-8ed7-42307976e4ab'::uuid, 'ザバススポーツクラブ/金沢八景', 'central-csp-hakkei',
    '236-0031'::text, '神奈川県'::text, '横浜市金沢区'::text, '六浦1-16-3'::text,
    35.323375, 139.619974, null,
    'https://www.central.co.jp/club/csp-hakkei/'::text, 'https://www.central.co.jp/club/csp-hakkei/'::text, 'fitness_club'::text,
    true, '2026-08-09T12:29:34.761+00:00'::timestamptz
  ),
  (
    'db6a571d-6a93-4554-ac9d-f0c2ce69eb23'::uuid, '0f49d25a-b01b-4edd-89bd-5457f5c6459e'::uuid, 'NAS瀬谷', 'sports-club-nas-seya-index',
    null, '神奈川県'::text, '横浜市'::text, null,
    35.469475, 139.484146, null,
    'https://www.nas-club.co.jp/seya/index.html'::text, 'https://www.nas-club.co.jp/seya/index.html'::text, 'fitness_club'::text,
    true, null
  ),
  (
    'dc9a4b60-578b-41b9-a2c1-2b4a8e1a6dbc'::uuid, '8e66d169-68bf-4da1-8ed7-42307976e4ab'::uuid, 'セントラルウェルネスクラブ 我孫子', 'central-w-abiko',
    '270-1166'::text, '千葉県'::text, '我孫子市'::text, '我孫子1-10-2 YSビル 4F'::text,
    35.873764, 140.011176, null,
    'https://www.central.co.jp/club/w_abiko/'::text, 'https://www.central.co.jp/club/w_abiko/'::text, 'fitness_club'::text,
    true, '2026-08-09T12:29:34.761+00:00'::timestamptz
  ),
  (
    'dcd7ba00-e1aa-4ec9-93df-e9756af4c1d7'::uuid, 'dd9e21fe-f2a1-4728-92f8-8c89fa83931e'::uuid, '練馬高野台東京', 'golds-gym-20220509',
    '177-0033'::text, '東京都'::text, '練馬区'::text, '高野台1-7-17NFプラザ 3F・4F'::text,
    35.741123, 139.617416, '西武池袋線　練馬高野台駅　北口すぐ / 駅からのルートは こちら をご覧ください。'::text,
    'https://www.goldsgym.jp/shop/nerima-takanodai-tokyo/'::text, 'https://www.goldsgym.jp/shop/nerima-takanodai-tokyo/'::text, 'fitness_club'::text,
    true, '2026-08-13T10:50:11.569+00:00'::timestamptz
  ),
  (
    'dcf1e86c-bd44-4b48-b806-86f949f2a60c'::uuid, 'ee1927f5-3d6d-4e4e-b632-ad9210540d56'::uuid, 'コナミスポーツクラブ 渋谷', 'konami-sports-007871',
    null, '東京都'::text, '渋谷区神泉町'::text, null,
    35.657814, 139.691086, null,
    'https://information.konamisportsclub.jp/ksc/007871/'::text, 'https://information.konamisportsclub.jp/ksc/007871/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    'dd4f01fe-6fa6-40c6-aa18-1b8069ee2a68'::uuid, 'ee1927f5-3d6d-4e4e-b632-ad9210540d56'::uuid, 'コナミスポーツクラブ 五反田', 'konami-sports-003930',
    null, '東京都'::text, '品川区東五反田'::text, null,
    35.626194, 139.726898, null,
    'https://information.konamisportsclub.jp/ksc/003930/'::text, 'https://information.konamisportsclub.jp/ksc/003930/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    'dfabad5e-8467-4c8c-872b-d73d3263bef2'::uuid, 'f0c8c2f9-103a-4b7f-a385-5b0bb4a29aec'::uuid, '国領店', 'tipness-shp023',
    null, '東京都'::text, '調布市'::text, null,
    35.651246, 139.55788, null,
    'https://tip.tipness.co.jp/shop_info/SHP023/'::text, 'https://tip.tipness.co.jp/shop_info/SHP023/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    'dfb825c8-a54c-4e34-a4c4-cadf7f3fc1ea'::uuid, 'bef520a9-236f-4ef9-b59d-28ae328090ca'::uuid, 'メガロス 鷺沼', 'megalos-saginuma',
    null, '神奈川県'::text, '川崎市'::text, null,
    35.57679, 139.576797, null,
    'https://megalos.co.jp/saginuma/'::text, 'https://megalos.co.jp/saginuma/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    'e0bbcdb4-d0b1-4fc0-bd6c-754634dc03a4'::uuid, 'ee1927f5-3d6d-4e4e-b632-ad9210540d56'::uuid, 'コナミスポーツクラブ 自由が丘駅前', 'konami-sports-006029',
    null, '東京都'::text, '目黒区自由が丘'::text, null,
    35.607292, 139.667267, null,
    'https://information.konamisportsclub.jp/ksc/006029/'::text, 'https://information.konamisportsclub.jp/ksc/006029/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    'e0d65ac4-daf4-47cf-b767-d625e4bdb76e'::uuid, '8e66d169-68bf-4da1-8ed7-42307976e4ab'::uuid, 'セントラルフィットネスクラブ 天王洲', 'central-tennozu',
    null, '東京都'::text, null, null,
    35.622849, 139.749884, null,
    'https://www.central.co.jp/club/tennozu/'::text, 'https://www.central.co.jp/club/tennozu/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    'e146cfd2-23b3-4d37-91c8-bbbce79fac6f'::uuid, '8e66d169-68bf-4da1-8ed7-42307976e4ab'::uuid, 'セントラルウェルネスクラブ24 東十条', 'central-higashijujo',
    null, '東京都'::text, null, null,
    35.763005, 139.731864, null,
    'https://www.central.co.jp/club/higashijujo/'::text, 'https://www.central.co.jp/club/higashijujo/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    'e1ef05b0-8681-4b07-ba62-e4e9923fea83'::uuid, 'dd9e21fe-f2a1-4728-92f8-8c89fa83931e'::uuid, '成田千葉', 'golds-gym-12100',
    '286-0017'::text, '千葉県'::text, '成田市'::text, '赤坂2-1-14そよら成田別館 1F'::text,
    35.778236, 140.290726, ''::text,
    'https://www.goldsgym.jp/shop/narita-chiba/'::text, 'https://www.goldsgym.jp/shop/narita-chiba/'::text, 'fitness_club'::text,
    true, '2026-08-13T10:50:11.57+00:00'::timestamptz
  ),
  (
    'e2919fb8-c681-4c3d-8995-816c974d2d4f'::uuid, 'ee1927f5-3d6d-4e4e-b632-ad9210540d56'::uuid, 'コナミスポーツクラブ 武蔵野', 'konami-sports-003932',
    null, '東京都'::text, '武蔵野市中町'::text, null,
    35.705696, 139.560577, null,
    'https://information.konamisportsclub.jp/ksc/003932/'::text, 'https://information.konamisportsclub.jp/ksc/003932/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    'e3dd4357-765c-4c6d-9d87-117f5a8c8d46'::uuid, 'ee1927f5-3d6d-4e4e-b632-ad9210540d56'::uuid, 'コナミスポーツクラブ 稲毛', 'konami-sports-004462',
    null, '千葉県'::text, '千葉市稲毛区小仲台'::text, null,
    35.635712, 140.096039, null,
    'https://information.konamisportsclub.jp/ksc/004462/'::text, 'https://information.konamisportsclub.jp/ksc/004462/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    'e50f9b01-d9ba-4732-b648-b397946a1804'::uuid, 'ee1927f5-3d6d-4e4e-b632-ad9210540d56'::uuid, 'コナミスポーツクラブ 都賀', 'konami-sports-004483',
    null, '千葉県'::text, '千葉市若葉区都賀'::text, null,
    35.635288, 140.150253, null,
    'https://information.konamisportsclub.jp/ksc/004483/'::text, 'https://information.konamisportsclub.jp/ksc/004483/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    'e5250e8c-8a51-41e1-87e6-56f332efc044'::uuid, '0f49d25a-b01b-4edd-89bd-5457f5c6459e'::uuid, 'NAS PILATES ON THE GO 大崎', 'sports-club-nas-np-onthego-osaki',
    null, '東京都'::text, '品川区'::text, null,
    35.619083, 139.726807, null,
    'https://www.nas-club.co.jp/np-onthego/osaki/'::text, 'https://www.nas-club.co.jp/np-onthego/osaki/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    'e6146c86-7f0d-44ac-b9a3-897aae6bf8c0'::uuid, '0f49d25a-b01b-4edd-89bd-5457f5c6459e'::uuid, 'NAS中山', 'sports-club-nas-nakayama-index',
    null, '神奈川県'::text, '横浜市'::text, null,
    35.515598, 139.536102, null,
    'https://www.nas-club.co.jp/nakayama/index.html'::text, 'https://www.nas-club.co.jp/nakayama/index.html'::text, 'fitness_club'::text,
    true, null
  ),
  (
    'e84c2ea2-bc63-4788-b050-590cfefebe42'::uuid, 'dd9e21fe-f2a1-4728-92f8-8c89fa83931e'::uuid, '浦安千葉', 'golds-gym-12160',
    '279-0002'::text, '千葉県'::text, '浦安市'::text, '北栄1-13-25 トライアル西友パートII 5F'::text,
    35.66581, 139.893646, ''::text,
    'https://www.goldsgym.jp/shop/urayasu-chiba/'::text, 'https://www.goldsgym.jp/shop/urayasu-chiba/'::text, 'fitness_club'::text,
    true, '2026-08-13T10:50:11.57+00:00'::timestamptz
  ),
  (
    'eaa92d86-5be5-4666-b2b6-88286c679fb8'::uuid, 'dd9e21fe-f2a1-4728-92f8-8c89fa83931e'::uuid, '幕張千葉ANNEX', 'golds-gym-12130',
    '261-0021'::text, '千葉県'::text, '千葉市美浜区'::text, 'ひび野2丁目4番地プレナ幕張 3F'::text,
    35.647892, 140.040405, '海浜幕張駅（JR京葉線・武蔵野線）南口より徒歩30秒'::text,
    'https://www.goldsgym.jp/shop/makuhari-chiba-annex/'::text, 'https://www.goldsgym.jp/shop/makuhari-chiba-annex/'::text, 'fitness_club'::text,
    true, '2026-08-13T10:50:11.57+00:00'::timestamptz
  ),
  (
    'eb8fa12a-f0e2-4b0d-9ba6-8d9d214c3402'::uuid, '0f49d25a-b01b-4edd-89bd-5457f5c6459e'::uuid, 'NAS PILATES ON THE GO 篠崎店', 'sports-club-nas-np-onthego-shinozaki',
    null, '東京都'::text, '江戸川区'::text, null,
    35.706078, 139.904526, null,
    'https://www.nas-club.co.jp/np-onthego/shinozaki/'::text, 'https://www.nas-club.co.jp/np-onthego/shinozaki/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    'ec0cc1c7-fa4d-42c7-8959-28548f43cda8'::uuid, '8e66d169-68bf-4da1-8ed7-42307976e4ab'::uuid, 'スタジオ ヨガピス 大森', 'central-yogapis-omori',
    null, '東京都'::text, null, null,
    35.586848, 139.727704, null,
    'https://www.central.co.jp/club/yogapis_omori/'::text, 'https://www.central.co.jp/club/yogapis_omori/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    'ed70f030-3c2e-4e9e-a9e1-eb97fbb74b43'::uuid, 'bef520a9-236f-4ef9-b59d-28ae328090ca'::uuid, 'メガロス 小平テニススクール', 'megalos-kodaira',
    null, '東京都'::text, '小平市'::text, null,
    35.727024, 139.475922, null,
    'https://megalos.co.jp/kodaira/'::text, 'https://megalos.co.jp/kodaira/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    'ed7a84ff-79bb-4a85-a5a4-13e5f51c8139'::uuid, '0f49d25a-b01b-4edd-89bd-5457f5c6459e'::uuid, 'NAS PILATES ON THE GO 新川崎店', 'sports-club-nas-np-onthego-shinkawasaki',
    null, '神奈川県'::text, '川崎市'::text, null,
    35.550671, 139.670135, null,
    'https://www.nas-club.co.jp/np-onthego/shinkawasaki/'::text, 'https://www.nas-club.co.jp/np-onthego/shinkawasaki/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    'ed9cacc2-de55-4018-8ffc-0ec1fbb20a71'::uuid, 'f0c8c2f9-103a-4b7f-a385-5b0bb4a29aec'::uuid, '氷川台店', 'tipness-shp063',
    null, '東京都'::text, '練馬区'::text, null,
    35.747165, 139.666384, null,
    'https://tip.tipness.co.jp/shop_info/SHP063/'::text, 'https://tip.tipness.co.jp/shop_info/SHP063/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    'edaa978c-bd36-4b50-be59-10c95da79242'::uuid, 'dd9e21fe-f2a1-4728-92f8-8c89fa83931e'::uuid, '四ツ谷東京', 'golds-gym-13121',
    '102-0085'::text, '東京都'::text, '千代田区'::text, '六番町13番地2桃園学園ビル'::text,
    35.686192, 139.732376, 'JR中央・総武線　麹町口改札出て右　徒歩3分'::text,
    'https://www.goldsgym.jp/shop/yotsuya-tokyo/'::text, 'https://www.goldsgym.jp/shop/yotsuya-tokyo/'::text, 'fitness_club'::text,
    true, '2026-08-13T10:50:11.569+00:00'::timestamptz
  ),
  (
    'edfc105a-7b1c-4445-a992-087a5751a76b'::uuid, 'ee1927f5-3d6d-4e4e-b632-ad9210540d56'::uuid, 'コナミスポーツ テニススクール 浦和', 'konami-sports-007804',
    null, '埼玉県'::text, 'さいたま市浦和区高砂'::text, null,
    35.857994, 139.656189, null,
    'https://information.konamisportsclub.jp/ksc/007804/'::text, 'https://information.konamisportsclub.jp/ksc/007804/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    'eeb7591f-f951-43e6-a9ab-6f75a05ac9db'::uuid, 'ee1927f5-3d6d-4e4e-b632-ad9210540d56'::uuid, 'コナミスポーツクラブ 武蔵小杉', 'konami-sports-004070',
    null, '神奈川県'::text, '川崎市中原区新丸子東'::text, null,
    35.574745, 139.660706, null,
    'https://information.konamisportsclub.jp/ksc/004070/'::text, 'https://information.konamisportsclub.jp/ksc/004070/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    'ef04dd0c-af52-4e84-95f6-ca83a1b8752a'::uuid, '8e66d169-68bf-4da1-8ed7-42307976e4ab'::uuid, 'セントラルフィットネスクラブ 稲毛海岸', 'central-inagekaigan',
    '261-0004'::text, '千葉県'::text, '千葉市美浜区'::text, '高洲3-23-2 稲毛海岸ビル 3F'::text,
    35.629037, 140.074623, null,
    'https://www.central.co.jp/club/inagekaigan/'::text, 'https://www.central.co.jp/club/inagekaigan/'::text, 'fitness_club'::text,
    true, '2026-08-09T12:29:34.761+00:00'::timestamptz
  ),
  (
    'ef9af54d-f1e3-4b76-8420-c0c095272c33'::uuid, '0f49d25a-b01b-4edd-89bd-5457f5c6459e'::uuid, 'NAS高尾', 'sports-club-nas-takao-index',
    null, '東京都'::text, '八王子市'::text, null,
    35.643543, 139.289185, null,
    'https://www.nas-club.co.jp/takao/index.html'::text, 'https://www.nas-club.co.jp/takao/index.html'::text, 'fitness_club'::text,
    true, null
  ),
  (
    'efcff219-a407-49a8-907c-875ed89356e7'::uuid, 'dd9e21fe-f2a1-4728-92f8-8c89fa83931e'::uuid, '南青山東京', 'golds-gym-13170',
    '107-0062'::text, '東京都'::text, '港区'::text, '南青山6-2-2南青山ホームズ B1F'::text,
    35.660999, 139.715378, '東京メトロ 銀座線・千代田線・半蔵門線『表参道駅』B1番出口またはB3番出口 / 写真で分かるB3番出口からのアクセス'::text,
    'https://www.goldsgym.jp/shop/minami-aoyama-tokyo/'::text, 'https://www.goldsgym.jp/shop/minami-aoyama-tokyo/'::text, 'fitness_club'::text,
    true, '2026-08-13T10:50:11.569+00:00'::timestamptz
  ),
  (
    'f184b593-1779-410d-9224-c1616f4a45e8'::uuid, 'b04baf0e-ded3-48f3-a2d9-127ae8f7c817'::uuid, 'JEXER 大井町', 'jexer-oimachi',
    '140-0014'::text, '東京都'::text, '品川区'::text, '大井 1-2-1'::text,
    35.6064, 139.7346, '大井町駅'::text,
    'https://www.jexer.jp/fitness/oimachi/'::text, 'https://www.jexer.jp/mb/oi/schedule/index.html'::text, 'fitness_spa'::text,
    true, '2026-04-14T05:18:19.979336+00:00'::timestamptz
  ),
  (
    'f1cc03a7-927f-4e3d-95e1-1ced5afad241'::uuid, '0f49d25a-b01b-4edd-89bd-5457f5c6459e'::uuid, 'NAS永山', 'sports-club-nas-nagayama-index',
    null, '東京都'::text, '多摩市'::text, null,
    35.628056, 139.449677, null,
    'https://www.nas-club.co.jp/nagayama/index.html'::text, 'https://www.nas-club.co.jp/nagayama/index.html'::text, 'fitness_club'::text,
    true, null
  ),
  (
    'f1cc1fbf-be4e-4037-963b-0e59bbad91f6'::uuid, '0f49d25a-b01b-4edd-89bd-5457f5c6459e'::uuid, 'NAS西葛西', 'sports-club-nas-nishikasai-index',
    '134-0088'::text, '東京都'::text, '江戸川区'::text, '西葛西6-15-24'::text,
    null, null, '東京メトロ東西線 西葛西駅南口 徒歩1分'::text,
    'https://www.nas-club.co.jp/nishikasai/index.html'::text, 'https://www.nas-club.co.jp/nishikasai/index.html'::text, 'fitness_club'::text,
    true, null
  ),
  (
    'f3c2b93c-d387-45bf-a026-6bf35b40ed9c'::uuid, 'bef520a9-236f-4ef9-b59d-28ae328090ca'::uuid, 'メガロス南砂町SUNAMO', 'megalos-minamisunamachi',
    null, '東京都'::text, '江東区'::text, null,
    35.665485, 139.834488, null,
    'https://megalos.co.jp/minamisunamachi/'::text, 'https://megalos.co.jp/minamisunamachi/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    'f443a3eb-fd84-4a7f-aaa2-39aacd1f64eb'::uuid, '0f49d25a-b01b-4edd-89bd-5457f5c6459e'::uuid, 'ホットヨガスタジオ美温 芦花公園', 'sports-club-nas-store-rokakouen-index',
    null, '東京都'::text, '世田谷区'::text, null,
    35.667217, 139.608749, null,
    'http://www.bion-yoga.jp/store/rokakouen/index.html'::text, 'http://www.bion-yoga.jp/store/rokakouen/index.html'::text, 'fitness_club'::text,
    true, null
  ),
  (
    'f4800198-859e-4f8f-8505-446166c21389'::uuid, 'f0c8c2f9-103a-4b7f-a385-5b0bb4a29aec'::uuid, '木場店', 'tipness-shp036',
    null, '東京都'::text, '江東区'::text, null,
    35.667403, 139.803917, null,
    'https://tip.tipness.co.jp/shop_info/SHP036/'::text, 'https://tip.tipness.co.jp/shop_info/SHP036/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    'f643f446-b52d-4b53-9115-058f83cb7f02'::uuid, 'f0c8c2f9-103a-4b7f-a385-5b0bb4a29aec'::uuid, '駒沢大学店', 'tipness-shp100',
    null, '東京都'::text, '世田谷区'::text, null,
    35.633897, 139.662646, null,
    'https://tip.tipness.co.jp/shop_info/SHP100/'::text, 'https://tip.tipness.co.jp/shop_info/SHP100/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    'f719e993-a9bb-4929-bebe-5422c63fced7'::uuid, '8e66d169-68bf-4da1-8ed7-42307976e4ab'::uuid, 'セントラルフィットネスクラブ 竹の塚', 'central-takenotsuka',
    null, '東京都'::text, null, null,
    35.794601, 139.794832, null,
    'https://www.central.co.jp/club/takenotsuka/'::text, 'https://www.central.co.jp/club/takenotsuka/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    'f727954d-7f06-4bc7-b4ae-1330c2ae2d77'::uuid, 'ee1927f5-3d6d-4e4e-b632-ad9210540d56'::uuid, 'コナミスポーツ ジュニアスクール 五香', 'konami-sports-004041',
    null, '千葉県'::text, '松戸市'::text, null,
    35.799583, 139.965332, null,
    'https://information.konamisportsclub.jp/ksc/004041/'::text, 'https://information.konamisportsclub.jp/ksc/004041/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    'f7ce3ad0-a886-4020-bd31-adc7635b30c2'::uuid, 'f0c8c2f9-103a-4b7f-a385-5b0bb4a29aec'::uuid, '練馬店', 'tipness-shp069',
    null, '東京都'::text, '練馬区'::text, null,
    35.737534, 139.653571, null,
    'https://tip.tipness.co.jp/shop_info/SHP069/'::text, 'https://tip.tipness.co.jp/shop_info/SHP069/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    'f8476603-5974-43b2-9ed8-f0aa71d1b1d8'::uuid, 'bef520a9-236f-4ef9-b59d-28ae328090ca'::uuid, 'メガロス 町田', 'megalos-machida',
    null, '東京都'::text, '町田市'::text, null,
    35.546425, 139.440552, null,
    'https://megalos.co.jp/machida/'::text, 'https://megalos.co.jp/machida/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    'f8a7114e-09c7-4ba2-9e11-938cfe88cae8'::uuid, '0f49d25a-b01b-4edd-89bd-5457f5c6459e'::uuid, 'テニスクラブNASこしがや', 'sports-club-nas-tennis_koshigaya-index',
    null, '埼玉県'::text, '越谷市'::text, null,
    35.880196, 139.78425, null,
    'https://www.nas-club.co.jp/tennis_koshigaya/index.html'::text, 'https://www.nas-club.co.jp/tennis_koshigaya/index.html'::text, 'fitness_club'::text,
    true, null
  ),
  (
    'f93e8f4e-4bca-471b-b362-60d1858d5e89'::uuid, '8e66d169-68bf-4da1-8ed7-42307976e4ab'::uuid, 'セントラルフィットネスクラブ24 目黒', 'central-meguro',
    '152-0001'::text, '東京都'::text, '目黒区'::text, '中央町2-26-7'::text,
    35.62976, 139.690635, null,
    'https://www.central.co.jp/club/meguro/'::text, 'https://www.central.co.jp/club/meguro/'::text, 'fitness_club'::text,
    true, '2026-08-09T12:29:34.761+00:00'::timestamptz
  ),
  (
    'f94f8ca2-b0c6-460f-b8c9-8ce9a31f66de'::uuid, 'dd9e21fe-f2a1-4728-92f8-8c89fa83931e'::uuid, '北千住東京', 'golds-gym-13100',
    '120-0034'::text, '東京都'::text, '足立区'::text, '千住1-4-1東京芸術センター 5F'::text,
    35.746788, 139.80011, '●東武スカイツリーライン（伊勢崎線）『北千住駅』仲町出口より徒歩8分（千住警察署方面） / ●JR常磐線『北千住駅』仲町出口より徒歩8分（千住警察署方面） / ●つくばエクスプレス『北千住駅』仲町出口より徒歩8分（千住警察署方面） / ●東京メトロ（日比谷線）『北千住駅』仲町出口より徒歩8分（千住警察署方面） / ●東京メトロ（千代田線）『北千住駅』より徒歩7分 1番出口（千住警察署方面） / 千住警察署並びの、東京芸術センター5階へお越しください'::text,
    'https://www.goldsgym.jp/shop/kitasenju-tokyo/'::text, 'https://www.goldsgym.jp/shop/kitasenju-tokyo/'::text, 'fitness_club'::text,
    true, '2026-08-13T10:50:11.569+00:00'::timestamptz
  ),
  (
    'fa583059-6ab3-4fae-b31a-1c53db766636'::uuid, '8e66d169-68bf-4da1-8ed7-42307976e4ab'::uuid, 'セントラルフィットネスクラブ24国立', 'central-kunitachi',
    null, '東京都'::text, null, null,
    35.694707, 139.451641, null,
    'https://www.central.co.jp/club/kunitachi/'::text, 'https://www.central.co.jp/club/kunitachi/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    'fa7e926b-cf60-4f5c-bfb3-9a90a0417fbf'::uuid, '8e66d169-68bf-4da1-8ed7-42307976e4ab'::uuid, 'セントラルウェルネスクラブ おおたかの森', 'central-ootakanomori',
    '270-0139'::text, '千葉県'::text, '流山市'::text, 'おおたかの森南1-5-1 流山おおたかの森S・C 3F'::text,
    35.86965, 139.925857, null,
    'https://www.central.co.jp/club/ootakanomori/'::text, 'https://www.central.co.jp/club/ootakanomori/'::text, 'fitness_club'::text,
    true, '2026-08-09T12:29:34.761+00:00'::timestamptz
  ),
  (
    'fb51d9cd-2c67-4bc9-a787-9e7e2ceb2ae7'::uuid, '0f49d25a-b01b-4edd-89bd-5457f5c6459e'::uuid, 'ホットヨガスタジオ美温 三鷹', 'sports-club-nas-store-mitaka-index',
    null, '東京都'::text, '三鷹市'::text, null,
    35.701328, 139.56105, null,
    'http://www.bion-yoga.jp/store/mitaka/index.html'::text, 'http://www.bion-yoga.jp/store/mitaka/index.html'::text, 'fitness_club'::text,
    true, null
  ),
  (
    'fb8c476c-aff0-40ad-a45c-8edb48efcc0a'::uuid, '0f49d25a-b01b-4edd-89bd-5457f5c6459e'::uuid, 'インドアテニススクール NAS光が丘', 'sports-club-nas-tennis_hikarigaoka-index',
    null, '東京都'::text, '練馬区'::text, null,
    35.76001, 139.628372, null,
    'https://www.nas-club.co.jp/tennis_hikarigaoka/index.html'::text, 'https://www.nas-club.co.jp/tennis_hikarigaoka/index.html'::text, 'fitness_club'::text,
    true, null
  ),
  (
    'fddd580f-a5f6-4b9f-b94c-866806bab69f'::uuid, '8e66d169-68bf-4da1-8ed7-42307976e4ab'::uuid, 'セントラルフィットネスクラブ24 南青山', 'central-minamiaoyama',
    '107-0062'::text, '東京都'::text, '港区'::text, '南青山6-1-3 コレッツィオーネB1F'::text,
    35.662523, 139.716251, null,
    'https://www.central.co.jp/club/minamiaoyama/'::text, 'https://www.central.co.jp/club/minamiaoyama/'::text, 'fitness_club'::text,
    true, '2026-08-09T12:29:34.761+00:00'::timestamptz
  ),
  (
    'fdf9bab6-43d0-4d3b-9670-82a8f720e17b'::uuid, 'dd9e21fe-f2a1-4728-92f8-8c89fa83931e'::uuid, '横浜上星川（フランチャイズ店）', 'golds-gym-14140',
    '240-0042'::text, '神奈川県'::text, '横浜市保土ケ谷区'::text, '上星川3丁目1-1'::text,
    35.467758, 139.579773, '相鉄線上星川駅南口すぐ'::text,
    'https://www.goldsgym.jp/shop/yokohama-kamihoshikawa/'::text, 'https://www.goldsgym.jp/shop/yokohama-kamihoshikawa/'::text, 'fitness_club'::text,
    true, '2026-08-13T10:50:11.57+00:00'::timestamptz
  ),
  (
    'ffd3af8e-082a-47ce-9115-7e5f2590d094'::uuid, 'ee1927f5-3d6d-4e4e-b632-ad9210540d56'::uuid, 'コナミスポーツクラブ 下総中山', 'konami-sports-004442',
    null, '千葉県'::text, '船橋市本中山2丁目'::text, null,
    35.714153, 139.944305, null,
    'https://information.konamisportsclub.jp/ksc/004442/'::text, 'https://information.konamisportsclub.jp/ksc/004442/'::text, 'fitness_club'::text,
    true, null
  ),
  (
    'fff68016-fd3b-4a66-adca-96fd35ed4269'::uuid, 'f0c8c2f9-103a-4b7f-a385-5b0bb4a29aec'::uuid, '船橋店', 'tipness-shp027',
    null, '千葉県'::text, '船橋市'::text, null,
    35.704258, 139.987098, null,
    'https://tip.tipness.co.jp/shop_info/SHP027/'::text, 'https://tip.tipness.co.jp/shop_info/SHP027/'::text, 'fitness_club'::text,
    true, null
  );

-- Recreate the exact H2-3 six-club graph before applying the H2-5 set.
create temp table h23_baseline (
  location_id uuid not null, external_id text not null, official_name text not null,
  source_url text not null, source_hash text not null, observed_at timestamptz not null,
  stale_at timestamptz not null, source_metadata jsonb not null, identity_metadata jsonb not null,
  evidence_metadata jsonb not null, affiliation_hash text not null, discipline_hash text not null
) on commit drop;
insert into h23_baseline values
  (
    '4d3bd3ba-cb00-44be-bdd6-d9b901f73195'::uuid, 'HGY_CckOFxMw5VG60QfRbUzlk3VMy', 'ゴールドジム千葉ニュータウン',
    'https://hyrox-training-finder.hyrox.com/gym/HGY_CckOFxMw5VG60QfRbUzlk3VMy', '487145a500744223d292705752d44737dabd5924695f433e5e5f3402aee05616',
    '2026-08-28T17:26:12.761Z'::timestamptz, '2026-11-26T17:26:12.761Z'::timestamptz,
    '{"namespace":"hyrox-training-club","external_identifier":"HGY_CckOFxMw5VG60QfRbUzlk3VMy","official_name":"ゴールドジム千葉ニュータウン"}'::jsonb, '{"official_name":"ゴールドジム千葉ニュータウン"}'::jsonb,
    '{"finder_listing":true,"official_external_id":"HGY_CckOFxMw5VG60QfRbUzlk3VMy","official_name":"ゴールドジム千葉ニュータウン"}'::jsonb, 'a5827701c1c2c7ebebd83e705288382272ac65e5b6d053f930e8a4aeafef52ac', 'b3374bcb683b2df1e84447ee02e9d8c1b5e8fd5d83e6169e926da3ab72e01290'
  ),
  (
    '569aecf8-aa02-41da-b37a-7e2e20f160fb'::uuid, 'HGY_f2kvOaab0cCRi8pkmmU0AHBis', '株式会社THINKフィットネス ゴールドジム浜松町東京',
    'https://hyrox-training-finder.hyrox.com/gym/HGY_f2kvOaab0cCRi8pkmmU0AHBis', '26b7005edea3935d27564cc6937b01d58061f5af91ec616a1c6ce26a3db72339',
    '2026-08-28T17:26:12.761Z'::timestamptz, '2026-11-26T17:26:12.761Z'::timestamptz,
    '{"namespace":"hyrox-training-club","external_identifier":"HGY_f2kvOaab0cCRi8pkmmU0AHBis","official_name":"株式会社THINKフィットネス ゴールドジム浜松町東京"}'::jsonb, '{"official_name":"株式会社THINKフィットネス ゴールドジム浜松町東京"}'::jsonb,
    '{"finder_listing":true,"official_external_id":"HGY_f2kvOaab0cCRi8pkmmU0AHBis","official_name":"株式会社THINKフィットネス ゴールドジム浜松町東京"}'::jsonb, 'f1f8c58190fed1e1dee034ef793a3598b3ee68b26a88ec754914e75cd46a7ca2', 'fd638791bb81960420c080d6fade4be52d3d64170cff5afcade3ac8de6f11804'
  ),
  (
    'd75c411f-2b58-476d-aa68-f7bde9000002'::uuid, 'HGY_HfEQpiP2Ha2HB3HYzCFuZJA7R', 'ゴールドジム東陽町スーパーセンター',
    'https://hyrox-training-finder.hyrox.com/gym/HGY_HfEQpiP2Ha2HB3HYzCFuZJA7R', 'a06dafd86055fbfaa63af234ae41c7eb82fb7a9da79d43fd63e40b0826f97550',
    '2026-08-28T17:26:12.761Z'::timestamptz, '2026-11-26T17:26:12.761Z'::timestamptz,
    '{"namespace":"hyrox-training-club","external_identifier":"HGY_HfEQpiP2Ha2HB3HYzCFuZJA7R","official_name":"ゴールドジム東陽町スーパーセンター"}'::jsonb, '{"official_name":"ゴールドジム東陽町スーパーセンター"}'::jsonb,
    '{"finder_listing":true,"official_external_id":"HGY_HfEQpiP2Ha2HB3HYzCFuZJA7R","official_name":"ゴールドジム東陽町スーパーセンター"}'::jsonb, '0a3f3293625396942eff00f16ce1466ddb3cba3288c7acb5ff34d4c9466736cc', '0d93db9f9f6c26afc6ad205a6bc481a8f4475351012c4502e8a96bf3fac81ace'
  ),
  (
    '7d7216d0-692e-45dd-ad3c-6c4980fdc50a'::uuid, 'HGY_IyVQTdTdvlkUGVmcaAvVV5BHD', 'ゴールドジム原宿ANNEX',
    'https://hyrox-training-finder.hyrox.com/gym/HGY_IyVQTdTdvlkUGVmcaAvVV5BHD', 'b6ec6bde1ac432b82920dfb6f32e48ca6f8ecde1c09b283ef5c77efd43e1c046',
    '2026-08-28T17:26:12.761Z'::timestamptz, '2026-11-26T17:26:12.761Z'::timestamptz,
    '{"namespace":"hyrox-training-club","external_identifier":"HGY_IyVQTdTdvlkUGVmcaAvVV5BHD","official_name":"ゴールドジム原宿ANNEX"}'::jsonb, '{"official_name":"ゴールドジム原宿ANNEX"}'::jsonb,
    '{"finder_listing":true,"official_external_id":"HGY_IyVQTdTdvlkUGVmcaAvVV5BHD","official_name":"ゴールドジム原宿ANNEX"}'::jsonb, '27e0b4317dd8dd7593215bc25aa5e77291f1219fbed12f4262182902f56973d1', 'a4d46e58d28d29f4efc96dea131949ebd225802e647a57c7adbff844d56fa8f7'
  ),
  (
    '1e1dc6eb-ec16-4850-978a-ac3c513f55ab'::uuid, 'HGY_QPyi483gAfTjVXv2QoNn5d55m', 'ゴールドジムハラジュクトウキョウ',
    'https://hyrox-training-finder.hyrox.com/gym/HGY_QPyi483gAfTjVXv2QoNn5d55m', '3b4644916fab76fd308962e158aebe25681db3bf9ecb258d17755a607bcc221c',
    '2026-08-28T17:26:12.761Z'::timestamptz, '2026-11-26T17:26:12.761Z'::timestamptz,
    '{"namespace":"hyrox-training-club","external_identifier":"HGY_QPyi483gAfTjVXv2QoNn5d55m","official_name":"ゴールドジムハラジュクトウキョウ"}'::jsonb, '{"official_name":"ゴールドジムハラジュクトウキョウ"}'::jsonb,
    '{"finder_listing":true,"official_external_id":"HGY_QPyi483gAfTjVXv2QoNn5d55m","official_name":"ゴールドジムハラジュクトウキョウ"}'::jsonb, '610279df6b1965fa11bc1a1d15db17e8f9665febd355068fbf6d68ca09bc4830', '0f65c5bb177075234cc4e5cda45f11d546182786e1ddb04f59d82aa64b2771a5'
  ),
  (
    'e84c2ea2-bc63-4788-b050-590cfefebe42'::uuid, 'HGY_x72wxyNcqCoMCbZxzQkr7nHAk', 'ゴールドジム浦安千葉',
    'https://hyrox-training-finder.hyrox.com/gym/HGY_x72wxyNcqCoMCbZxzQkr7nHAk', 'a6c627e31621d10a4490707426cb457ec245c08d3f62b72e4f098ef7ce792032',
    '2026-08-28T17:26:12.761Z'::timestamptz, '2026-11-26T17:26:12.761Z'::timestamptz,
    '{"namespace":"hyrox-training-club","external_identifier":"HGY_x72wxyNcqCoMCbZxzQkr7nHAk","official_name":"ゴールドジム浦安千葉"}'::jsonb, '{"official_name":"ゴールドジム浦安千葉"}'::jsonb,
    '{"finder_listing":true,"official_external_id":"HGY_x72wxyNcqCoMCbZxzQkr7nHAk","official_name":"ゴールドジム浦安千葉"}'::jsonb, 'f7a2bbf1613252ce9ab15ab170ed7dc912543ced119817e1bda754a7e51cd41c', 'b655563951d4c29780433113a692ee3c0081ddb6918bcc9227d14cb127fa8f33'
  );

insert into public.training_sources (
  location_id, url, canonical_url, source_kind, publisher_authority, availability_state,
  last_checked_at, unavailable_since, review_required, content_hash, metadata_json
)
select location_id, source_url, source_url, 'finder', 'governing_body', 'available', observed_at, null, false, source_hash, source_metadata
from h23_baseline;

insert into public.location_external_identifiers (
  location_id, namespace, external_identifier, training_source_id, verification_status, verified_at, metadata_json
)
select baseline.location_id, 'hyrox-training-club', baseline.external_id, source.id, 'confirmed', baseline.observed_at, baseline.identity_metadata
from h23_baseline baseline join public.training_sources source on source.canonical_url = baseline.source_url;

insert into public.location_training_disciplines (
  location_id, discipline_id, support_state, verification_status, last_confirmed_at, stale_at, notes
)
select baseline.location_id, discipline.id, 'available', 'confirmed', baseline.observed_at, baseline.stale_at, null
from h23_baseline baseline cross join public.training_disciplines discipline where discipline.slug = 'hyrox';

insert into public.training_affiliations (
  location_id, discipline_id, affiliation_type, awarding_organization, external_identifier,
  affiliation_state, verification_status, valid_from, valid_to, last_confirmed_at, stale_at, notes
)
select baseline.location_id, discipline.id, 'training_club', 'HYROX', baseline.external_id,
  'active', 'confirmed', null, null, baseline.observed_at, baseline.stale_at, null
from h23_baseline baseline cross join public.training_disciplines discipline where discipline.slug = 'hyrox';

insert into public.training_evidence (
  training_source_id, training_affiliation_id, assertion, review_status, evidence_text,
  structured_evidence, observed_at, reviewed_at, content_hash
)
select source.id, affiliation.id, 'supports', 'accepted', null, baseline.evidence_metadata,
  baseline.observed_at, baseline.observed_at, baseline.affiliation_hash
from h23_baseline baseline
join public.training_sources source on source.canonical_url = baseline.source_url
join public.training_affiliations affiliation on affiliation.location_id = baseline.location_id and affiliation.external_identifier = baseline.external_id;

insert into public.training_evidence (
  training_source_id, location_training_discipline_id, assertion, review_status, evidence_text,
  structured_evidence, observed_at, reviewed_at, content_hash
)
select source.id, location_discipline.id, 'supports', 'accepted', null, baseline.evidence_metadata,
  baseline.observed_at, baseline.observed_at, baseline.discipline_hash
from h23_baseline baseline
join public.training_sources source on source.canonical_url = baseline.source_url
join public.training_disciplines discipline on discipline.slug = 'hyrox'
join public.location_training_disciplines location_discipline on location_discipline.location_id = baseline.location_id and location_discipline.discipline_id = discipline.id;

do $baseline$
begin
  if (select count(*) from public.gym_brands) <> 7
     or (select count(*) from public.gym_locations) <> 369
     or (select count(*) from public.training_sources) <> 6
     or (select count(*) from public.location_external_identifiers where namespace = 'hyrox-training-club') <> 6
     or (select count(*) from public.location_training_disciplines) <> 6
     or (select count(*) from public.training_affiliations where awarding_organization = 'HYROX') <> 6
     or (select count(*) from public.training_evidence) <> 12
     or (select count(*) from public.published_location_training_disciplines) <> 6
     or (select count(*) from public.published_training_affiliations where is_official) <> 6 then
    raise exception 'Production-like H2-3 baseline mismatch';
  end if;
end;
$baseline$;

create temp table h25_brands (
  brand_ref text primary key, name text not null, slug text not null, official_url text not null, description text
) on commit drop;
insert into h25_brands values
  ('brand:anytime-fitness', 'Anytime Fitness', 'anytime-fitness', 'https://www.anytimefitness.co.jp/', null),
  ('brand:beequick-fitness', 'BeeQuick Fitness', 'beequick-fitness', 'https://www.beequick.jp/', null),
  ('brand:crossfit-ashiya', 'CrossFit Ashiya', 'crossfit-ashiya', 'https://crossfitashiya.com/', null),
  ('brand:crossfit-hakata-shingu', 'CrossFit Hakata Shingu', 'crossfit-hakata-shingu', 'https://www.crossfit-hakata-shingu.com/', null),
  ('brand:crossfit-kumamoto', 'CrossFit Kumamoto', 'crossfit-kumamoto', 'https://www.crossfitkumamoto.com/', null),
  ('brand:crossfit-otoyo-strength', 'CrossFit Otoyo Strength', 'crossfit-otoyo-strength', 'https://www.otoyostrength.com/', null),
  ('brand:crossfit-rakuhoku', 'CrossFit Rakuhoku', 'crossfit-rakuhoku', 'https://crossfitrakuhoku.com/', null),
  ('brand:crossfit-takarazuka', 'CrossFit Takarazuka', 'crossfit-takarazuka', 'https://crossfittakarazuka.com/', null),
  ('brand:crossfitokayama', 'crossfitokayama', 'crossfitokayama', 'https://www.crossfitokayama.com/', null),
  ('brand:g-zone', 'g-zone', 'g-zone', 'https://g-zone.co.jp/', null),
  ('brand:h-field-sports-performance-center', 'H-Field Sports Performance Center', 'h-field-sports-performance-center', 'https://www.h-fieldsendai.com/', null),
  ('brand:improve-kyoto', 'Improve KYOTO', 'improve-kyoto', 'https://improve-hyrox.com/', null),
  ('brand:nota-gym', 'NOTA GYM', 'nota-gym', 'https://nota-gym.com/', null),
  ('brand:stance-fitness', 'STANCE FITNESS', 'stance-fitness', 'https://stance-design.jp/', null),
  ('brand:takamatsu-crossfit', 'Takamatsu CrossFit', 'takamatsu-crossfit', 'https://takamatsu-crossfit.jp/', null),
  ('brand:xtry', 'ＸＴＲＹ', 'xtry', 'https://www.xtry.jp/', null);

create temp table h25_locations (
  location_ref text primary key, brand_ref text not null, name text not null, slug text not null,
  postal_code text not null, prefecture text not null, city text not null, address_line text not null,
  latitude numeric not null, longitude numeric not null, nearest_station text, official_url text not null,
  source_url text not null, location_type text not null, is_active boolean not null,
  observed_at timestamptz not null, external_id text not null, official_name text not null,
  source_hash text not null, stale_at timestamptz not null, source_metadata jsonb not null,
  identity_metadata jsonb not null, evidence_metadata jsonb not null,
  affiliation_hash text not null, discipline_hash text not null
) on commit drop;
insert into h25_locations values
  (
    'location:g-zone-park', 'brand:g-zone', 'g-zone PARK', 'g-zone-park',
    '6150933', '京都府', '京都市右京区', '615-0933, 京都府, 京都市右京区梅津後藤町1-3',
    35.0032571, 135.7020504, null, 'https://g-zone.co.jp/park/', 'https://hyrox-training-finder.hyrox.com/gym/HGY_C0V7CK7K15SLUrMhBvyyO0phM',
    'fitness_studio', true, '2026-08-29T13:50:28.000Z'::timestamptz,
    'HGY_C0V7CK7K15SLUrMhBvyyO0phM', 'g-zone PARK', '7d816bd2de9103ff26b1f03a3de05de017e56db86d5b78f09fe6421577482f2a',
    '2026-11-27T13:50:28.000Z'::timestamptz, '{"namespace":"hyrox-training-club","external_identifier":"HGY_C0V7CK7K15SLUrMhBvyyO0phM","official_name":"g-zone PARK"}'::jsonb,
    '{"official_name":"g-zone PARK"}'::jsonb, '{"finder_listing":true,"official_external_id":"HGY_C0V7CK7K15SLUrMhBvyyO0phM","official_name":"g-zone PARK"}'::jsonb,
    'c81a31ad62fdf55ba3e1d05863dec0f5042a259d786f199d3a553cc57442d006', 'ea1264b0aabd9034cda5462137928346b966e451a41f990869033b384e1c8eec'
  ),
  (
    'location:takamatsu-crossfit', 'brand:takamatsu-crossfit', 'Takamatsu CrossFit', 'takamatsu-crossfit',
    '7618056', '香川県', '高松市', '7618056, 高松市, 上天神町634',
    34.3111792, 134.0363775, null, 'https://takamatsu-crossfit.jp/', 'https://hyrox-training-finder.hyrox.com/gym/HGY_c816ru6QeTv14At3O51pjK8au',
    'fitness_studio', true, '2026-08-29T13:50:28.000Z'::timestamptz,
    'HGY_c816ru6QeTv14At3O51pjK8au', 'Takamatsu CrossFit', '60441bbfc88abe4786f7325aef25f6850a8a13b4d69172db18e286ed035169bb',
    '2026-11-27T13:50:28.000Z'::timestamptz, '{"namespace":"hyrox-training-club","external_identifier":"HGY_c816ru6QeTv14At3O51pjK8au","official_name":"Takamatsu CrossFit"}'::jsonb,
    '{"official_name":"Takamatsu CrossFit"}'::jsonb, '{"finder_listing":true,"official_external_id":"HGY_c816ru6QeTv14At3O51pjK8au","official_name":"Takamatsu CrossFit"}'::jsonb,
    '6b3e5849f172d306bef317de9545c63d3420ea1b5ece82e61c8e3e3ba6003b8e', 'bd35dc253dccc87a05492654f47655020966329944343d8b435d0951f29b9e00'
  ),
  (
    'location:crossfit-ashiya', 'brand:crossfit-ashiya', 'CrossFit Ashiya', 'crossfit-ashiya',
    '6590013', '兵庫県', '芦屋市', '659-0013, Ashiya,HYOGO, 7-5 Iwazono-cho',
    34.7413476, 135.3114397, null, 'https://crossfitashiya.com/', 'https://hyrox-training-finder.hyrox.com/gym/HGY_Cl8QF5olON4Y0D7mho4iGg34L',
    'fitness_studio', true, '2026-08-29T13:50:28.000Z'::timestamptz,
    'HGY_Cl8QF5olON4Y0D7mho4iGg34L', 'CrossFit Ashiya', '24d4eaa958d1249bd73455f09de3d8c8555afaae8b363fc160501d5c9a084ec1',
    '2026-11-27T13:50:28.000Z'::timestamptz, '{"namespace":"hyrox-training-club","external_identifier":"HGY_Cl8QF5olON4Y0D7mho4iGg34L","official_name":"CrossFit Ashiya"}'::jsonb,
    '{"official_name":"CrossFit Ashiya"}'::jsonb, '{"finder_listing":true,"official_external_id":"HGY_Cl8QF5olON4Y0D7mho4iGg34L","official_name":"CrossFit Ashiya"}'::jsonb,
    '6f5a408e2858eab98c963024e6731ba7425e139934ae069709887be1556138de', 'c673eac24536e4937af0596244b66f9341b454d32e567b47ac4bcb8ad52b2fea'
  ),
  (
    'location:beequick-fitness-sanda', 'brand:beequick-fitness', 'Beequick Fitness　Sanda', 'beequick-fitness-sanda',
    '6691321', '兵庫県', '三田市', '669-1321, Hyogo-ken Sanda-shi, keyakidai 1-6-2',
    34.908318, 135.1865807, null, 'https://www.beequick.jp/location/sanda/', 'https://hyrox-training-finder.hyrox.com/gym/HGY_e48JpyZiFH8V9aqp7zJ8ouQju',
    'fitness_club', true, '2026-08-29T13:50:28.000Z'::timestamptz,
    'HGY_e48JpyZiFH8V9aqp7zJ8ouQju', 'Beequick Fitness　Sanda', '0364b7fb77ac564358827f71259f64292953f8ac1bd4d28a398bdddb799bdf8b',
    '2026-11-27T13:50:28.000Z'::timestamptz, '{"namespace":"hyrox-training-club","external_identifier":"HGY_e48JpyZiFH8V9aqp7zJ8ouQju","official_name":"Beequick Fitness　Sanda"}'::jsonb,
    '{"official_name":"Beequick Fitness　Sanda"}'::jsonb, '{"finder_listing":true,"official_external_id":"HGY_e48JpyZiFH8V9aqp7zJ8ouQju","official_name":"Beequick Fitness　Sanda"}'::jsonb,
    'a3c97797981728e1d7bea3ce4b3d04be05c772193466d8954516e0cee93d46d0', '54a296136444beb5ea57fb4f222330d05b47e5479a1fb4207629b2c7cdeb6248'
  ),
  (
    'location:stance-fitness-2nd', 'brand:stance-fitness', 'STANCE FITNESS ２ND', 'stance-fitness-2nd',
    '6008387', '京都府', '京都市下京区', '6008387, 京 都 市, 下 京 区 高 辻 大 宮 町 1 0 3 大 宮 高 辻 ビ ル 2 階',
    35.0001186, 135.7491414, null, 'https://stance-design.jp/', 'https://hyrox-training-finder.hyrox.com/gym/HGY_gdqY3Z5sigmQLLGmSGbjG26sR',
    'fitness_studio', true, '2026-08-29T13:50:28.000Z'::timestamptz,
    'HGY_gdqY3Z5sigmQLLGmSGbjG26sR', 'STANCE FITNESS ２ND', '268c6559a58d42655644a4f8bf37b96cf78cc21fe0a1b682a8c0f4e86aca6e20',
    '2026-11-27T13:50:28.000Z'::timestamptz, '{"namespace":"hyrox-training-club","external_identifier":"HGY_gdqY3Z5sigmQLLGmSGbjG26sR","official_name":"STANCE FITNESS ２ND"}'::jsonb,
    '{"official_name":"STANCE FITNESS ２ND"}'::jsonb, '{"finder_listing":true,"official_external_id":"HGY_gdqY3Z5sigmQLLGmSGbjG26sR","official_name":"STANCE FITNESS ２ND"}'::jsonb,
    '2206ffc9654c42cbe0bd72a915d263afae2404437bc2486ef8ec2d48cd530b31', 'cf8cd354fa64693b16af4e2892b7af9685d33123825a689493b89e9bc658af4c'
  ),
  (
    'location:improve-kyoto', 'brand:improve-kyoto', 'Improve KYOTO', 'improve-kyoto',
    '6048221', '京都府', '京都市中京区', '6048221, 京都, B1F, 280 Tenjinyama-cho, Nishikikoji-dori Muromachi Nishi-iru, Nakagyo-ku',
    35.005198, 135.7572444, null, 'https://improve-hyrox.com/', 'https://hyrox-training-finder.hyrox.com/gym/HGY_gp7GcAxbIZtxk5KpvoDwAOOcr',
    'fitness_studio', true, '2026-08-29T13:50:28.000Z'::timestamptz,
    'HGY_gp7GcAxbIZtxk5KpvoDwAOOcr', 'Improve KYOTO', 'ccb85cc542b849b749e95ce195d5be7b680c1863d089dca6bc23a79075676555',
    '2026-11-27T13:50:28.000Z'::timestamptz, '{"namespace":"hyrox-training-club","external_identifier":"HGY_gp7GcAxbIZtxk5KpvoDwAOOcr","official_name":"Improve KYOTO"}'::jsonb,
    '{"official_name":"Improve KYOTO"}'::jsonb, '{"finder_listing":true,"official_external_id":"HGY_gp7GcAxbIZtxk5KpvoDwAOOcr","official_name":"Improve KYOTO"}'::jsonb,
    'ab3424dcdadf115d5cc1b3ffa4ce8b5a72927d35d93b290b64eb9cd2843d287f', '5753a07eec0098ce2dd46039f33faf8500ed108552a061418ca1a4e740bf7c48'
  ),
  (
    'location:crossfit-rakuhoku', 'brand:crossfit-rakuhoku', 'CrossFit Rakuhoku', 'crossfit-rakuhoku',
    '6068004', '京都府', '京都市左京区', '606-8004, Kyoto, 7-1 Yamabanakawabatacho',
    35.0511036, 135.7898774, null, 'https://crossfitrakuhoku.com/', 'https://hyrox-training-finder.hyrox.com/gym/HGY_GyudKibCcLKI0LIwxnYTcv2Te',
    'fitness_studio', true, '2026-08-29T13:50:28.000Z'::timestamptz,
    'HGY_GyudKibCcLKI0LIwxnYTcv2Te', 'CrossFit Rakuhoku', '5d71c8b716cea028c30885496690ab0cf5877be4c44a323c057b76a3df284ccd',
    '2026-11-27T13:50:28.000Z'::timestamptz, '{"namespace":"hyrox-training-club","external_identifier":"HGY_GyudKibCcLKI0LIwxnYTcv2Te","official_name":"CrossFit Rakuhoku"}'::jsonb,
    '{"official_name":"CrossFit Rakuhoku"}'::jsonb, '{"finder_listing":true,"official_external_id":"HGY_GyudKibCcLKI0LIwxnYTcv2Te","official_name":"CrossFit Rakuhoku"}'::jsonb,
    'd70f5731ce5d74bc5452bceb633232939fc023ebc7051e19805a94ab9ead6d43', '5b1c481a948fbaab06f538a6d0f2b5fe2f468c33f560c4aa5956125a8597be91'
  ),
  (
    'location:anytime-fitness-nagaokakyo', 'brand:anytime-fitness', 'ANYTIME FITNESS NAGAOKAKYO', 'anytime-fitness-nagaokakyo',
    '6170826', '京都府', '長岡京市', '6170826, 長岡京市, 開田4-22-5',
    34.92221970000001, 135.6935862, null, 'https://www.anytimefitness.co.jp/nagaokakyo/', 'https://hyrox-training-finder.hyrox.com/gym/HGY_IXvBUmAfS03dK1N7KeulKnC6O',
    'fitness_club', true, '2026-08-29T13:50:28.000Z'::timestamptz,
    'HGY_IXvBUmAfS03dK1N7KeulKnC6O', 'ANYTIME FITNESS NAGAOKAKYO', '54fd731dde007c4ed226c8c17891716506917cf91e935c31d63bafa51df00e7f',
    '2026-11-27T13:50:28.000Z'::timestamptz, '{"namespace":"hyrox-training-club","external_identifier":"HGY_IXvBUmAfS03dK1N7KeulKnC6O","official_name":"ANYTIME FITNESS NAGAOKAKYO"}'::jsonb,
    '{"official_name":"ANYTIME FITNESS NAGAOKAKYO"}'::jsonb, '{"finder_listing":true,"official_external_id":"HGY_IXvBUmAfS03dK1N7KeulKnC6O","official_name":"ANYTIME FITNESS NAGAOKAKYO"}'::jsonb,
    '38ddeb8cdbbadff9dba102b076dc00f1f5aa217e10b750c1c9f3450605708772', '2c497facd81a5e82f082a3953cbebefc621c839db71ca137102cce97b8560471'
  ),
  (
    'location:crossfit-kumamoto', 'brand:crossfit-kumamoto', 'CrossFit Kumamoto', 'crossfit-kumamoto',
    '8600822', '熊本県', '熊本市中央区', '8600822, Kumamoto, 331-1 Motoyamamachi Chuo-ku',
    32.7877427, 130.6964067, null, 'https://www.crossfitkumamoto.com/', 'https://hyrox-training-finder.hyrox.com/gym/HGY_kCFMRp8Q0qOkn2iMEYikZq4Kg',
    'fitness_studio', true, '2026-08-29T13:50:28.000Z'::timestamptz,
    'HGY_kCFMRp8Q0qOkn2iMEYikZq4Kg', 'CrossFit Kumamoto', '5333106fe78520fcd7b986446dd3fa8030fbd40dfaaf3d118313f7dbeaaf192f',
    '2026-11-27T13:50:28.000Z'::timestamptz, '{"namespace":"hyrox-training-club","external_identifier":"HGY_kCFMRp8Q0qOkn2iMEYikZq4Kg","official_name":"CrossFit Kumamoto"}'::jsonb,
    '{"official_name":"CrossFit Kumamoto"}'::jsonb, '{"finder_listing":true,"official_external_id":"HGY_kCFMRp8Q0qOkn2iMEYikZq4Kg","official_name":"CrossFit Kumamoto"}'::jsonb,
    'accc9917f4b98c2fd34270fdf4d53f62c181c1f6f4f9d7e584b45c9bad14aa6d', 'e03a7239719472fd3330535cdc190c4edc2308a79283d173f84034fa65bd5bac'
  ),
  (
    'location:crossfit-otoyo-strength', 'brand:crossfit-otoyo-strength', 'CrossFit Otoyo Strength', 'crossfit-otoyo-strength',
    '7890166', '高知県', '長岡郡大豊町', '7890166, Kochi, 317-1 Higashidoi, Otoyo-cho, Nagaoka-gun',
    33.7937737, 133.7574224, null, 'https://www.otoyostrength.com/', 'https://hyrox-training-finder.hyrox.com/gym/HGY_Kg433w73iQIbSdY97CXEbzUk9',
    'fitness_studio', true, '2026-08-29T13:50:28.000Z'::timestamptz,
    'HGY_Kg433w73iQIbSdY97CXEbzUk9', 'CrossFit Otoyo Strength', '26eea70895fb121a8fcf2ac5b869ba7349437dbff4218dd38e8730aa36a99322',
    '2026-11-27T13:50:28.000Z'::timestamptz, '{"namespace":"hyrox-training-club","external_identifier":"HGY_Kg433w73iQIbSdY97CXEbzUk9","official_name":"CrossFit Otoyo Strength"}'::jsonb,
    '{"official_name":"CrossFit Otoyo Strength"}'::jsonb, '{"finder_listing":true,"official_external_id":"HGY_Kg433w73iQIbSdY97CXEbzUk9","official_name":"CrossFit Otoyo Strength"}'::jsonb,
    '11c71a3fa5f84be2c7164dc2dde86acc6a17189573c80e3a1ec7bccb20e842f1', '62de6d21612646883cb2ced5471db9785bfc27d2d0eb4c7f4f7786e6f1ff1a25'
  ),
  (
    'location:crossfit-takarazuka', 'brand:crossfit-takarazuka', 'CrossFit Takarazuka', 'crossfit-takarazuka',
    '6650822', '兵庫県', '宝塚市', '665-0822, Takarazuka, 1-13-18 Akuranaka',
    34.8032594, 135.3718761, null, 'https://crossfittakarazuka.com/', 'https://hyrox-training-finder.hyrox.com/gym/HGY_lO4q9FsvCxkbgiBXhBLDbHDI0',
    'fitness_studio', true, '2026-08-29T13:50:28.000Z'::timestamptz,
    'HGY_lO4q9FsvCxkbgiBXhBLDbHDI0', 'CrossFit Takarazuka', '3c528fefc9667b627dd3a9226858709782ea48713865206ef53814b3d1dd0991',
    '2026-11-27T13:50:28.000Z'::timestamptz, '{"namespace":"hyrox-training-club","external_identifier":"HGY_lO4q9FsvCxkbgiBXhBLDbHDI0","official_name":"CrossFit Takarazuka"}'::jsonb,
    '{"official_name":"CrossFit Takarazuka"}'::jsonb, '{"finder_listing":true,"official_external_id":"HGY_lO4q9FsvCxkbgiBXhBLDbHDI0","official_name":"CrossFit Takarazuka"}'::jsonb,
    'e1631592e33847740225f84106f6280720860ef857163e52f888d254a8621c43', 'c34fc0d3ddbaadde67be1a7319cbf1cdd94c3e37b89730eb356ee4b1b1624f6c'
  ),
  (
    'location:xtry', 'brand:xtry', 'ＸＴＲＹ', 'xtry',
    '7000973', '岡山県', '岡山市北区', '7000973, 岡山市, 岡山県岡山市北区下中野377-1',
    34.6383425, 133.9051427, null, 'https://www.xtry.jp/', 'https://hyrox-training-finder.hyrox.com/gym/HGY_MFCsmHPD9dh968h6jJoJMVRcr',
    'fitness_studio', true, '2026-08-29T13:50:28.000Z'::timestamptz,
    'HGY_MFCsmHPD9dh968h6jJoJMVRcr', 'ＸＴＲＹ', 'dcd12c7b7983be79075e26ffd9aa780fdaa83fd43f446de5bfc0acba68033e58',
    '2026-11-27T13:50:28.000Z'::timestamptz, '{"namespace":"hyrox-training-club","external_identifier":"HGY_MFCsmHPD9dh968h6jJoJMVRcr","official_name":"ＸＴＲＹ"}'::jsonb,
    '{"official_name":"ＸＴＲＹ"}'::jsonb, '{"finder_listing":true,"official_external_id":"HGY_MFCsmHPD9dh968h6jJoJMVRcr","official_name":"ＸＴＲＹ"}'::jsonb,
    'f688d3a4542148abc6eb8ba709439c17d490d956d498cf6532c9c87b5fb302b7', 'a028582b5b4a7a4bd4ca43019512687745e5405cba9bade009664497e303c781'
  ),
  (
    'location:h-field-sports-performance-center', 'brand:h-field-sports-performance-center', 'H-Field Sports Performance Center', 'h-field-sports-performance-center',
    '9800023', '宮城県', '仙台市青葉区', '980-0023, Sendai, 青葉区北目町2番40号',
    38.2551376, 140.8763012, null, 'https://www.h-fieldsendai.com/', 'https://hyrox-training-finder.hyrox.com/gym/HGY_QT7VhrLDp4OIr5MJDDdEFDsGs',
    'fitness_studio', true, '2026-08-29T13:50:28.000Z'::timestamptz,
    'HGY_QT7VhrLDp4OIr5MJDDdEFDsGs', 'H-Field Sports Performance Center', '59c486fbc288f567c2fa60bfa31fa5a73b6c474b3be2ec0d3e4a5f802c1587b6',
    '2026-11-27T13:50:28.000Z'::timestamptz, '{"namespace":"hyrox-training-club","external_identifier":"HGY_QT7VhrLDp4OIr5MJDDdEFDsGs","official_name":"H-Field Sports Performance Center"}'::jsonb,
    '{"official_name":"H-Field Sports Performance Center"}'::jsonb, '{"finder_listing":true,"official_external_id":"HGY_QT7VhrLDp4OIr5MJDDdEFDsGs","official_name":"H-Field Sports Performance Center"}'::jsonb,
    'de232e5aa337b4d97da8e90b68f3940aca172afe57a9980cd0486e4c2cd35f71', 'ee5a376144541a710f3f62b6734cba57b83e48d7f607defa31f4eb0f1c1505ba'
  ),
  (
    'location:beequick-kyotango', 'brand:beequick-fitness', 'Beequick Kyotango', 'beequick-kyotango',
    '6270005', '京都府', '京丹後市', '627-0005, Kyoto-fu kyotango-shi, mineyamachoshinmachi 1981-1',
    35.613771, 135.0987115, null, 'https://www.beequick.jp/location/kyotango/', 'https://hyrox-training-finder.hyrox.com/gym/HGY_VNYgC17BsAJ3cLgavQTUPCgay',
    'fitness_club', true, '2026-08-29T13:50:28.000Z'::timestamptz,
    'HGY_VNYgC17BsAJ3cLgavQTUPCgay', 'Beequick Kyotango', '2a09cb3f75fb90acd87a731b1b99a3e14407a026c5c09542b1a560747f0639b3',
    '2026-11-27T13:50:28.000Z'::timestamptz, '{"namespace":"hyrox-training-club","external_identifier":"HGY_VNYgC17BsAJ3cLgavQTUPCgay","official_name":"Beequick Kyotango"}'::jsonb,
    '{"official_name":"Beequick Kyotango"}'::jsonb, '{"finder_listing":true,"official_external_id":"HGY_VNYgC17BsAJ3cLgavQTUPCgay","official_name":"Beequick Kyotango"}'::jsonb,
    '658fe44d7ddb803bd9dd271d26adbfa268e64c1169c9a23bf2097c9d75014f3c', '757280c7e92789e385a8d4a9d33a0f3032bf073ee85bc7d69faa5ee1291c54ed'
  ),
  (
    'location:crossfitokayama', 'brand:crossfitokayama', 'crossfitokayama', 'crossfitokayama',
    '7028011', '岡山県', '岡山市南区', '702-8011, Okayama-shi, Crossfitokayama 2978-8 Kori Minami-ku',
    34.5843808, 133.9566847, null, 'https://www.crossfitokayama.com/', 'https://hyrox-training-finder.hyrox.com/gym/HGY_w0fsND7jBYlmRipHytS9TFkH8',
    'fitness_studio', true, '2026-08-29T13:50:28.000Z'::timestamptz,
    'HGY_w0fsND7jBYlmRipHytS9TFkH8', 'crossfitokayama', 'f374ca98902ef029bb5e43b799657c27bbc307224e6286b654ee345db4ec7a0c',
    '2026-11-27T13:50:28.000Z'::timestamptz, '{"namespace":"hyrox-training-club","external_identifier":"HGY_w0fsND7jBYlmRipHytS9TFkH8","official_name":"crossfitokayama"}'::jsonb,
    '{"official_name":"crossfitokayama"}'::jsonb, '{"finder_listing":true,"official_external_id":"HGY_w0fsND7jBYlmRipHytS9TFkH8","official_name":"crossfitokayama"}'::jsonb,
    'd429672d2c7633218bb124597dfba4c7331bde4d1dfff907929c2067e7db55f6', 'c1b295df3f891ad674ec08a3845b62125995b4d9c35be4d88cb31d5e2b06b4a3'
  ),
  (
    'location:nota-gym-6150851', 'brand:nota-gym', 'NOTA GYM 西京極店', 'nota-gym-6150851',
    '6150851', '京都府', '京都市右京区', '615-0851, 京都市, 京都市右京区西京極西池田町9番地4 コスミック西京極2階',
    34.9925695, 135.7195654, null, 'https://nota-gym.com/', 'https://hyrox-training-finder.hyrox.com/gym/HGY_w8GnFtzgPzHOTZfWMBGzdEtoC',
    'fitness_studio', true, '2026-08-29T13:50:28.000Z'::timestamptz,
    'HGY_w8GnFtzgPzHOTZfWMBGzdEtoC', 'NOTA GYM 西京極店', '1850e9301cfc9e12db94c8ea46dc7500f4f2f8ae15fc833be0871bc5fe5957e5',
    '2026-11-27T13:50:28.000Z'::timestamptz, '{"namespace":"hyrox-training-club","external_identifier":"HGY_w8GnFtzgPzHOTZfWMBGzdEtoC","official_name":"NOTA GYM 西京極店"}'::jsonb,
    '{"official_name":"NOTA GYM 西京極店"}'::jsonb, '{"finder_listing":true,"official_external_id":"HGY_w8GnFtzgPzHOTZfWMBGzdEtoC","official_name":"NOTA GYM 西京極店"}'::jsonb,
    'ccec488210886ede5d08bc36f885682ca06ae52f28de06e6cde2fcf2d0f899cf', '572c0d8cfd09e393167e174916600df166382cb3b94b92743534d1e476fada31'
  ),
  (
    'location:crossfit-hakata-shingu', 'brand:crossfit-hakata-shingu', 'CrossFit Hakata Shingu', 'crossfit-hakata-shingu',
    '8110101', '福岡県', '糟屋郡新宮町', '8110101, Fukuoka, 1793-7 harugami  Oaza Shingumachi kasuyagun',
    33.6950473, 130.4501025, null, 'https://www.crossfit-hakata-shingu.com/', 'https://hyrox-training-finder.hyrox.com/gym/HGY_wKwr756BgwTwHLwcICNji4PJx',
    'fitness_studio', true, '2026-08-29T13:50:28.000Z'::timestamptz,
    'HGY_wKwr756BgwTwHLwcICNji4PJx', 'CrossFit Hakata Shingu', 'cfecd623243002178127260523287851ebeef7224ecfc56f550b4c25cf51d90c',
    '2026-11-27T13:50:28.000Z'::timestamptz, '{"namespace":"hyrox-training-club","external_identifier":"HGY_wKwr756BgwTwHLwcICNji4PJx","official_name":"CrossFit Hakata Shingu"}'::jsonb,
    '{"official_name":"CrossFit Hakata Shingu"}'::jsonb, '{"finder_listing":true,"official_external_id":"HGY_wKwr756BgwTwHLwcICNji4PJx","official_name":"CrossFit Hakata Shingu"}'::jsonb,
    'e823071e3d53800deece95421764fd2009b0e1d860cf1b2d971faacac858c14c', 'f81a58d8e5594b8e0eed1a9b7a6736759e2700b0aecbb57375241ac7f78b7900'
  );

create function pg_temp.apply_h25_candidate()
returns void language plpgsql as $function$
begin
  if (select count(*) from h25_brands) <> 16
     or (select count(*) from h25_locations) <> 17 then
    raise exception 'H2-5 requires exact reviewed brand/location counts';
  end if;
  if exists (select slug from h25_brands group by slug having count(*) > 1)
     or exists (select name from h25_brands group by name having count(*) > 1) then
    raise exception 'Duplicate candidate brand identity';
  end if;
  if exists (
    select 1 from h25_brands candidate join public.gym_brands existing on existing.slug = candidate.slug or existing.name = candidate.name
    where existing.slug <> candidate.slug or existing.name <> candidate.name
  ) then raise exception 'Brand semantic identity collision'; end if;
  if exists (select slug from h25_locations group by slug having count(*) > 1)
     or exists (select external_id from h25_locations group by external_id having count(*) > 1) then
    raise exception 'Duplicate candidate location identity';
  end if;
  if exists (
    select 1 from h25_locations candidate join public.gym_locations existing on existing.slug = candidate.slug
    where existing.name <> candidate.name or existing.official_url is distinct from candidate.official_url
       or existing.address_line is distinct from candidate.address_line or existing.location_type is distinct from candidate.location_type
  ) then raise exception 'Location semantic identity collision'; end if;
  if exists (
    select 1 from h25_locations candidate join public.gym_locations existing
      on existing.official_url = candidate.official_url or existing.address_line = candidate.address_line
    where existing.slug <> candidate.slug
  ) then raise exception 'Location URL or address belongs to another slug'; end if;
  if exists (
    select 1 from h25_locations candidate join public.location_external_identifiers identity
      on identity.namespace = 'hyrox-training-club' and identity.external_identifier = candidate.external_id
    join public.gym_locations existing on existing.id = identity.location_id
    where existing.slug <> candidate.slug
  ) then raise exception 'HYROX external identifier belongs to another location'; end if;
  if exists (
    select 1 from h25_locations candidate join public.training_sources source on source.canonical_url = candidate.source_url
    join public.gym_locations existing on existing.id = source.location_id
    where existing.slug <> candidate.slug or source.publisher_authority <> 'governing_body' or source.source_kind <> 'finder'
  ) then raise exception 'Canonical HYROX source conflicts with another identity'; end if;

  insert into public.gym_brands (name, slug, official_url, description)
  select name, slug, official_url, description from h25_brands
  on conflict (slug) do nothing;

  insert into public.gym_locations (
    brand_id, name, slug, postal_code, prefecture, city, address_line, latitude,
    longitude, nearest_station, official_url, source_url, location_type, is_active, last_verified_at
  )
  select brand.id, candidate.name, candidate.slug, candidate.postal_code, candidate.prefecture,
    candidate.city, candidate.address_line, candidate.latitude, candidate.longitude,
    candidate.nearest_station, candidate.official_url, candidate.source_url, candidate.location_type,
    candidate.is_active, candidate.observed_at
  from h25_locations candidate
  join h25_brands candidate_brand on candidate_brand.brand_ref = candidate.brand_ref
  join public.gym_brands brand on brand.slug = candidate_brand.slug
  where not exists (select 1 from public.gym_locations existing where existing.slug = candidate.slug);

  update public.training_sources source
  set url = candidate.source_url, availability_state = 'available', last_checked_at = candidate.observed_at,
    unavailable_since = null, review_required = false, content_hash = candidate.source_hash,
    metadata_json = candidate.source_metadata
  from h25_locations candidate
  where source.canonical_url = candidate.source_url and (source.last_checked_at is null or candidate.observed_at > source.last_checked_at);

  insert into public.training_sources (
    location_id, url, canonical_url, source_kind, publisher_authority, availability_state,
    last_checked_at, unavailable_since, review_required, content_hash, metadata_json
  )
  select location.id, candidate.source_url, candidate.source_url, 'finder', 'governing_body',
    'available', candidate.observed_at, null, false, candidate.source_hash, candidate.source_metadata
  from h25_locations candidate join public.gym_locations location on location.slug = candidate.slug
  where not exists (select 1 from public.training_sources source where source.canonical_url = candidate.source_url);

  insert into public.location_external_identifiers (
    location_id, namespace, external_identifier, training_source_id, verification_status, verified_at, metadata_json
  )
  select location.id, 'hyrox-training-club', candidate.external_id, source.id, 'confirmed', candidate.observed_at, candidate.identity_metadata
  from h25_locations candidate join public.gym_locations location on location.slug = candidate.slug
  join public.training_sources source on source.canonical_url = candidate.source_url
  on conflict (namespace, external_identifier) do update set
    training_source_id = case when excluded.verified_at > location_external_identifiers.verified_at then excluded.training_source_id else location_external_identifiers.training_source_id end,
    verification_status = case when excluded.verified_at > location_external_identifiers.verified_at then excluded.verification_status else location_external_identifiers.verification_status end,
    verified_at = greatest(location_external_identifiers.verified_at, excluded.verified_at),
    metadata_json = case when excluded.verified_at > location_external_identifiers.verified_at then excluded.metadata_json else location_external_identifiers.metadata_json end;

  insert into public.location_training_disciplines (
    location_id, discipline_id, support_state, verification_status, last_confirmed_at, stale_at, notes
  )
  select location.id, discipline.id, 'available', 'confirmed', candidate.observed_at, candidate.stale_at, null
  from h25_locations candidate join public.gym_locations location on location.slug = candidate.slug
  cross join public.training_disciplines discipline where discipline.slug = 'hyrox'
  on conflict (location_id, discipline_id) do update set support_state = excluded.support_state,
    verification_status = excluded.verification_status, last_confirmed_at = excluded.last_confirmed_at, stale_at = excluded.stale_at
  where excluded.last_confirmed_at > location_training_disciplines.last_confirmed_at;

  insert into public.training_affiliations (
    location_id, discipline_id, affiliation_type, awarding_organization, external_identifier,
    affiliation_state, verification_status, valid_from, valid_to, last_confirmed_at, stale_at, notes
  )
  select location.id, discipline.id, 'training_club', 'HYROX', candidate.external_id,
    'active', 'confirmed', null, null, candidate.observed_at, candidate.stale_at, null
  from h25_locations candidate join public.gym_locations location on location.slug = candidate.slug
  cross join public.training_disciplines discipline where discipline.slug = 'hyrox'
  on conflict (location_id, discipline_id, affiliation_type, awarding_organization) do update set
    external_identifier = excluded.external_identifier, affiliation_state = excluded.affiliation_state,
    verification_status = excluded.verification_status, last_confirmed_at = excluded.last_confirmed_at, stale_at = excluded.stale_at
  where excluded.last_confirmed_at > training_affiliations.last_confirmed_at;

  insert into public.training_evidence (
    training_source_id, training_affiliation_id, assertion, review_status, evidence_text,
    structured_evidence, observed_at, reviewed_at, content_hash
  )
  select source.id, affiliation.id, 'supports', 'accepted', null, candidate.evidence_metadata,
    candidate.observed_at, candidate.observed_at, candidate.affiliation_hash
  from h25_locations candidate join public.gym_locations location on location.slug = candidate.slug
  join public.training_sources source on source.canonical_url = candidate.source_url
  join public.training_affiliations affiliation on affiliation.location_id = location.id and affiliation.external_identifier = candidate.external_id
  where not exists (select 1 from public.training_evidence evidence where evidence.training_source_id = source.id and evidence.training_affiliation_id = affiliation.id and evidence.content_hash = candidate.affiliation_hash);

  insert into public.training_evidence (
    training_source_id, location_training_discipline_id, assertion, review_status, evidence_text,
    structured_evidence, observed_at, reviewed_at, content_hash
  )
  select source.id, location_discipline.id, 'supports', 'accepted', null, candidate.evidence_metadata,
    candidate.observed_at, candidate.observed_at, candidate.discipline_hash
  from h25_locations candidate join public.gym_locations location on location.slug = candidate.slug
  join public.training_sources source on source.canonical_url = candidate.source_url
  join public.training_disciplines discipline on discipline.slug = 'hyrox'
  join public.location_training_disciplines location_discipline on location_discipline.location_id = location.id and location_discipline.discipline_id = discipline.id
  where not exists (select 1 from public.training_evidence evidence where evidence.training_source_id = source.id and evidence.location_training_discipline_id = location_discipline.id and evidence.content_hash = candidate.discipline_hash);
end;
$function$;

select pg_temp.apply_h25_candidate();
select pg_temp.apply_h25_candidate();

do $verify$
declare search_count integer; search_total bigint;
begin
  if (select count(*) from public.gym_brands) <> 23
     or (select count(*) from public.gym_locations) <> 386
     or (select count(*) from public.training_sources) <> 23
     or (select count(*) from public.location_external_identifiers where namespace = 'hyrox-training-club') <> 23
     or (select count(*) from public.location_training_disciplines) <> 23
     or (select count(*) from public.training_affiliations where awarding_organization = 'HYROX') <> 23
     or (select count(*) from public.training_evidence) <> 46 then
    raise exception 'H2-5 logical row counts or idempotency mismatch';
  end if;
  if (select count(*) from public.published_location_training_disciplines) <> 23
     or (select count(*) from public.published_training_affiliations where is_official) <> 23 then
    raise exception 'H2-5 publication count mismatch';
  end if;
  if not exists (
    select 1 from public.published_training_discipline_summary
    where slug = 'hyrox' and published_location_count = 23 and official_location_count = 23
  ) then raise exception 'H2-5 summary mismatch'; end if;
  select count(*), max(total_count) into search_count, search_total
  from public.search_training_locations('hyrox', '', '', true, '{}', '{}', null, 0, 100)
  where official and not class_available and not open_training_available
    and equipment_slugs = '{}'::text[] and capability_slugs = '{}'::text[];
  if search_count <> 23 or search_total <> 23 then raise exception 'H2-5 search result mismatch'; end if;
  if (select count(*) from public.search_training_locations('hyrox', '', '', true, '{}', '{}', null, 0, 10)) <> 10
     or (select count(*) from public.search_training_locations('hyrox', '', '', true, '{}', '{}', null, 10, 100)) <> 13 then
    raise exception 'H2-5 search pagination count mismatch';
  end if;
  if exists (
    select location_id from public.search_training_locations('hyrox', '', '', true, '{}', '{}', null, 0, 10)
    intersect
    select location_id from public.search_training_locations('hyrox', '', '', true, '{}', '{}', null, 10, 100)
  ) then raise exception 'H2-5 search pagination contains duplicate locations'; end if;
  if exists (
    select 1 from public.search_training_locations('hyrox', '', '', true, '{}', '{}', null, 0, 10) where total_count <> 23
  ) or exists (
    select 1 from public.search_training_locations('hyrox', '', '', true, '{}', '{}', null, 10, 100) where total_count <> 23
  ) then raise exception 'H2-5 search pagination total_count mismatch'; end if;
  if (select count(*) from public.location_equipment) <> 0
     or (select count(*) from public.location_training_capabilities) <> 0
     or (select count(*) from public.program_training_disciplines) <> 0 then
    raise exception 'Out-of-scope inferred facts exist';
  end if;
  if has_table_privilege('anon', 'public.training_sources', 'select')
     or has_table_privilege('anon', 'public.training_evidence', 'select')
     or has_table_privilege('authenticated', 'public.training_sources', 'select')
     or has_table_privilege('authenticated', 'public.training_evidence', 'select') then
    raise exception 'Private provenance grants leaked';
  end if;
end;
$verify$;

do $freshness$
declare target text := (select min(external_id) from h25_locations); original timestamptz;
begin
  select relation.last_confirmed_at into original
  from public.location_training_disciplines relation
  join public.gym_locations location on location.id = relation.location_id
  join h25_locations candidate on candidate.slug = location.slug
  where candidate.external_id = target;
  update h25_locations set observed_at = observed_at - interval '1 day', stale_at = stale_at - interval '1 day' where external_id = target;
  perform pg_temp.apply_h25_candidate();
  if exists (
    select 1 from public.location_training_disciplines relation join public.gym_locations location on location.id = relation.location_id
    join h25_locations candidate on candidate.slug = location.slug where candidate.external_id = target and relation.last_confirmed_at <> original
  ) then raise exception 'Older observation regressed freshness'; end if;
end;
$freshness$;

do $conflicts$
declare first_slug text := (select min(slug) from h25_locations); first_external text := (select external_id from h25_locations where slug = first_slug);
begin
  begin
    update h25_brands set name = name || ' conflict' where slug = (select min(slug) from h25_brands);
    perform pg_temp.apply_h25_candidate();
    raise exception 'Expected brand collision was not blocked';
  exception when raise_exception then
    if sqlerrm <> 'Brand semantic identity collision' then raise; end if;
  end;
  begin
    update h25_locations set name = name || ' conflict' where slug = first_slug;
    perform pg_temp.apply_h25_candidate();
    raise exception 'Expected location collision was not blocked';
  exception when raise_exception then
    if sqlerrm <> 'Location semantic identity collision' then raise; end if;
  end;
  begin
    update h25_locations set external_id = (select external_id from h23_baseline limit 1) where slug = first_slug;
    perform pg_temp.apply_h25_candidate();
    raise exception 'Expected HGY collision was not blocked';
  exception when raise_exception then
    if sqlerrm <> 'HYROX external identifier belongs to another location' then raise; end if;
  end;
end;
$conflicts$;

-- The transaction includes all identity and training facts atomically, then proves rollback cleanup.
rollback;
