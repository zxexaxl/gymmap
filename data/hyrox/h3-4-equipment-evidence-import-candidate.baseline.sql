\set ON_ERROR_STOP on
-- LOCAL-ONLY production-logical baseline for H3-4. No production connection is accepted.
do $$ begin if current_database() !~ '^gymmap_h3_4_rehearsal' then raise exception 'H3-4 baseline is local-rehearsal only'; end if; end $$;
begin;
insert into public.gym_brands(id,name,slug) values
  ('5952b027-1ad8-412d-845e-98394ee6c1c8', 'BEYOND', 'beyond'),
  ('00c65504-466c-4798-a576-c7e9aee2464a', 'Freeletics Goals', 'freeletics-goals'),
  ('dd9e21fe-f2a1-4728-92f8-8c89fa83931e', 'Gold''s Gym', 'golds-gym'),
  ('c89ccfb7-e8f9-42a0-9ced-b49c460d50d7', 'LUAANA CLUB 蒲田池上店', 'luaana-club'),
  ('fecea2f9-3e4d-4367-8012-6b234025b251', 'MEIJI PARK', 'meiji-park'),
  ('d7d4c609-2ed2-4b05-8784-51faf76dc838', 'Orangetheory Fitness', 'orangetheory-fitness'),
  ('ca37ac4b-a8a8-4f22-a211-08f174b28118', 'RESTORE BASE', 'restore-base'),
  ('e93af020-658c-45bc-8724-378e24d7cfaf', 'SamiFitness', 'samifitness'),
  ('d0554cc8-ceb7-4038-92c2-260dc0c81249', 'STANCE FITNESS', 'stance-fitness'),
  ('472fc4c5-1e25-4678-af1e-f3288f6f0017', 'Takamatsu CrossFit', 'takamatsu-crossfit'),
  ('cf0250e5-b66c-43de-b4f5-5e6e517e0055', 'TrueFitness 吹田', 'truefitness'),
  ('0169c026-533a-43b4-9071-cc4ca5f4d5ad', 'UFC GYM', 'ufc-gym'),
  ('d349f045-701c-4505-8439-006c2b789137', 'Yoshiyuki Hirano 善之 平野', 'yoshiyuki-hirano');
insert into public.gym_brands(id,name,slug) values ('34000000-0000-4000-8000-000000000000','H3-4 baseline other brands','h3-4-baseline-other-brands');
create temp table h34_sample_location_input(id uuid primary key,brand_id uuid,name text,slug text,prefecture text,city text,address_line text,latitude numeric,longitude numeric,official_url text,hgy text);
insert into h34_sample_location_input values
  ('cc8f2cee-62bd-4756-abfd-5f1b27a9c9d4', 'd349f045-701c-4505-8439-006c2b789137', 'Yoshiyuki Hirano 善之 平野', 'yoshiyuki-hirano-5770002', '大阪府', '東大阪市', '577-0002, osaka, higashiosakashi, 1-3-25, inadauemachi', 34.692082, 135.581847, 'https://www.field-gym.com/higashiosaka/', 'HGY_0PfI4t6UgVADRV7RfgXX48PR8'),
  ('c629c669-807e-4467-b638-cb1f97df8975', 'ca37ac4b-a8a8-4f22-a211-08f174b28118', 'RESTORE BASE', 'restore-base-2310806', '神奈川県', '横浜市中区', '2310806, Yokohama, Naka-ward honmoku 2-325', 35.429976, 139.661192, 'https://restorebase.jp/', 'HGY_1kQTLdyeblDc6Nbt13qiH5oib'),
  ('23d0e430-6eda-44d8-aef6-f8a3aa99f06c', 'e93af020-658c-45bc-8724-378e24d7cfaf', 'SamiFitness', 'samifitness-1060047', '東京都', '港区', '1060047, Tokyo, Minami Azabu 5-2-9', 35.655111, 139.724808, 'https://samifitnesstokyo.com/', 'HGY_6okPO396AJbISj7LTMTlrkEPD'),
  ('99abe458-52ae-44a4-8f1a-3f747ff9bfb8', 'c89ccfb7-e8f9-42a0-9ced-b49c460d50d7', 'LUAANA CLUB 蒲田池上店', 'luaana-club-1460082', '東京都', '大田区', '1460082, Ota-ku, 7-10-10 Ikegami', 35.5716, 139.701801, 'https://www.luaanaclub.com/', 'HGY_7FDA3W6p88v6evTHGBhfHFrvP'),
  ('83a8de7f-36e4-4ece-bd31-a0e98b295ff8', '5952b027-1ad8-412d-845e-98394ee6c1c8', 'BEYOND 浜松店', 'beyond-4300924', '静岡県', '浜松市中央区', '4300924, 静岡県浜松市, 中央区龍禅寺町７４−１ フジビル 101', 34.698081, 137.739427, 'https://beyond-gym.com/gym/gym-hamamatsu/', 'HGY_A6L66KJGjc8HfLRFmuyJgBMyQ'),
  ('5326a371-18d2-4c51-9109-e59242521f16', '472fc4c5-1e25-4678-af1e-f3288f6f0017', 'Takamatsu CrossFit', 'takamatsu-crossfit', '香川県', '高松市', '7618056, 高松市, 上天神町634', 34.311179, 134.036378, 'https://takamatsu-crossfit.jp/', 'HGY_c816ru6QeTv14At3O51pjK8au'),
  ('eae47de3-da8a-4f5e-8cdf-444bb413b90c', '0169c026-533a-43b4-9071-cc4ca5f4d5ad', 'UFC Gym 用賀', 'ufc-gym-1580096', '東京都', '世田谷区', '158-0096, Tokyo, Setagaya Tamagawadai 2-22-20', 35.624863, 139.632577, 'https://yoga.ufcgym.co.jp/', 'HGY_e0rqkrg7L4ataPZD4gGoOL0W9'),
  ('569aecf8-aa02-41da-b37a-7e2e20f160fb', 'dd9e21fe-f2a1-4728-92f8-8c89fa83931e', '浜松町東京', 'golds-gym-13210', '東京都', '港区', '海岸1-2-3汐留芝離宮ビルディング 2階', 35.656849, 139.759186, 'https://www.goldsgym.jp/shop/hamamatsucho-tokyo/', 'HGY_f2kvOaab0cCRi8pkmmU0AHBis'),
  ('a6ad9646-4983-4a73-93db-89fcf2bf868c', 'd0554cc8-ceb7-4038-92c2-260dc0c81249', 'STANCE FITNESS ２ND', 'stance-fitness-2nd', '京都府', '京都市下京区', '6008387, 京 都 市, 下 京 区 高 辻 大 宮 町 1 0 3 大 宮 高 辻 ビ ル 2 階', 35.000119, 135.749141, 'https://stance-design.jp/', 'HGY_gdqY3Z5sigmQLLGmSGbjG26sR'),
  ('d75c411f-2b58-476d-aa68-f7bde9000002', 'dd9e21fe-f2a1-4728-92f8-8c89fa83931e', '東陽町スーパーセンター', 'golds-gym-71221', '東京都', '江東区', '東陽2-2-20', 35.666416, 139.816544, 'https://www.goldsgym.jp/shop/toyocho-super-center/', 'HGY_HfEQpiP2Ha2HB3HYzCFuZJA7R'),
  ('73a4df85-88c1-4545-a74b-4fcf9a5ffaf8', 'dd9e21fe-f2a1-4728-92f8-8c89fa83931e', '幕張ベイパークアリーナ', 'golds-gym-12131', '千葉県', '千葉市美浜区', '若葉3-1-37幕張ベイパークウェルネスセンター', 35.649914, 140.049454, 'https://www.goldsgym.jp/shop/makuhari-baypark-arena/', 'HGY_mkqpr1PrUO2WFjQgpVsFUSkMv'),
  ('295cc8bc-32d9-48f4-8b79-b2f18e85cd78', 'd7d4c609-2ed2-4b05-8784-51faf76dc838', 'オレンジセオリーフィットネス溝の口', 'hyrox-training-club-2130001', '神奈川県', '川崎市高津区', '2130001, Kawasaki, 1-13-18-B1 Mizonokuchi, Takatsu', 35.5997, 139.614626, 'https://www.orangetheoryfitness.co.jp/mizonokuchi/', 'HGY_n4xTGpLhdouLv9TzuLk2J1OoV'),
  ('4a0b9292-1283-49ac-a3b2-c7bd38133a31', '00c65504-466c-4798-a576-c7e9aee2464a', 'Freeletics Goals', 'freeletics-goals-2310011', '神奈川県', '横浜市中区', '231-0011, Yokohama, Kanagawa, SSKnot 1F  5-69 Otamachi Naka-ku', 35.448615, 139.635391, 'https://www.freeleticsgoals.com/en/', 'HGY_u1B3yXynkPyPxOuTQPXyjceFr'),
  ('611fbcc9-2fa4-46cb-9963-e03c2a414ae3', 'fecea2f9-3e4d-4367-8012-6b234025b251', 'MEIJI PARK', 'meiji-park-1600013', '東京都', '新宿区', '1600013, Tokyo, MEIJI PARK, 5-7 Kasumigaokamachi, Shinjuku City', 35.675207, 139.713666, 'https://www.meiji-park.com/', 'HGY_wWrNDerG0IQoFDsAo4L7w3io2'),
  ('dbeed152-b421-4f15-acf8-8586a5a85aa7', 'cf0250e5-b66c-43de-b4f5-5e6e517e0055', 'TrueFitness 吹田', 'truefitness-5640027', '大阪府', '吹田市', '5640027, Suita-shi , Osaka, 2F, Suita SANKUSU No.2 Building, 2-101 Asahi-cho', 34.763098, 135.525423, 'https://true-f.com/', 'HGY_XsJSB4jNTUfR4otyZrmg22J81');
insert into public.gym_locations(id,brand_id,name,slug,prefecture,city,address_line,latitude,longitude,official_url,source_url,location_type,is_active,last_verified_at)
      select id,brand_id,name,slug,prefecture,city,address_line,latitude,longitude,official_url,official_url,'fitness_studio',true,'2026-08-30T00:00:00Z'::timestamptz from h34_sample_location_input;
insert into public.gym_locations(id,brand_id,name,slug,prefecture,city,address_line,latitude,longitude,official_url,source_url,location_type,is_active,last_verified_at)
      select ('34000000-0000-4000-8001-'||lpad(gs::text,12,'0'))::uuid,'34000000-0000-4000-8000-000000000000','H3-4 baseline location '||gs,'h3-4-baseline-location-'||gs,'東京都','テスト区','H3-4 baseline address '||gs,35+(gs::numeric/10000),139+(gs::numeric/10000),'https://baseline.invalid/location/'||gs,'https://baseline.invalid/location/'||gs,'fitness_studio',true,'2026-08-30T00:00:00Z'::timestamptz from generate_series(1,67) gs;
insert into public.training_sources(location_id,url,canonical_url,source_kind,publisher_authority,availability_state,last_checked_at,review_required,content_hash,metadata_json)
      select id,'https://baseline.invalid/finder/'||id,'https://baseline.invalid/finder/'||id,'finder','governing_body','available','2026-08-30T00:00:00Z',false,encode(digest('baseline-source:'||id,'sha256'),'hex'),'{}'::jsonb from gym_locations;
insert into public.location_external_identifiers(location_id,namespace,external_identifier,training_source_id,verification_status,verified_at,metadata_json)
      select l.id,'hyrox-training-club',coalesce(i.hgy,'HGY_BASELINE_'||replace(l.id::text,'-','')),s.id,'confirmed','2026-08-30T00:00:00Z','{}'::jsonb
      from gym_locations l join training_sources s on s.location_id=l.id and s.source_kind='finder' left join h34_sample_location_input i on i.id=l.id;
insert into public.location_training_disciplines(location_id,discipline_id,support_state,verification_status,last_confirmed_at,stale_at)
      select l.id,d.id,'available','confirmed','2026-08-30T00:00:00Z','2026-11-28T00:00:00Z' from gym_locations l cross join training_disciplines d where d.slug='hyrox';
insert into public.training_affiliations(location_id,discipline_id,affiliation_type,awarding_organization,external_identifier,affiliation_state,verification_status,last_confirmed_at,stale_at)
      select l.id,d.id,'training_club','HYROX',x.external_identifier,'active','confirmed','2026-08-30T00:00:00Z','2026-11-28T00:00:00Z'
      from gym_locations l cross join training_disciplines d join location_external_identifiers x on x.location_id=l.id and x.namespace='hyrox-training-club' where d.slug='hyrox';
insert into public.training_evidence(training_source_id,location_training_discipline_id,assertion,review_status,observed_at,reviewed_at,content_hash,structured_evidence)
      select s.id,ld.id,'supports','accepted','2026-08-30T00:00:00Z','2026-08-30T00:00:00Z',encode(digest('baseline-discipline:'||ld.id,'sha256'),'hex'),'{}'::jsonb from location_training_disciplines ld join training_sources s on s.location_id=ld.location_id and s.source_kind='finder';
insert into public.training_evidence(training_source_id,training_affiliation_id,assertion,review_status,observed_at,reviewed_at,content_hash,structured_evidence)
      select s.id,a.id,'supports','accepted','2026-08-30T00:00:00Z','2026-08-30T00:00:00Z',encode(digest('baseline-affiliation:'||a.id,'sha256'),'hex'),'{}'::jsonb from training_affiliations a join training_sources s on s.location_id=a.location_id and s.source_kind='finder';
do $$ declare n bigint; begin
      if (select count(*) from training_sources)<>82 then raise exception 'baseline source mismatch'; end if;
      if (select count(*) from training_evidence)<>164 then raise exception 'baseline evidence mismatch'; end if;
      if (select count(*) from published_location_training_disciplines where discipline_slug='hyrox')<>82 then raise exception 'baseline publication mismatch'; end if;
      if (select official_location_count from published_training_discipline_summary where slug='hyrox')<>82 then raise exception 'baseline official mismatch'; end if;
      select max(total_count) into n from search_training_locations('hyrox',p_limit=>100); if n<>82 then raise exception 'baseline search mismatch'; end if;
    end $$;
commit;
select 'H3-4 production-logical baseline PASS' as result;
