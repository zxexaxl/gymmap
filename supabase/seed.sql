insert into gym_brands (id, name, slug, official_url, description)
values
  ('11111111-1111-1111-1111-111111111111', 'Gold''s Gym', 'golds-gym', 'https://www.goldsgym.jp/', 'フリーウェイトとスタジオプログラムの両方が強いブランド'),
  ('22222222-2222-2222-2222-222222222222', 'Konami Sports Club', 'konami-sports-club', 'https://www.konami.com/sportsclub/', '幅広い会員層向けの総合型スポーツクラブ'),
  ('33333333-3333-3333-3333-333333333333', 'Central Sports', 'central-sports', 'https://www.central.co.jp/', 'スイミングとスタジオのバランスが良い総合型ジム')
on conflict (id) do nothing;

insert into gym_locations (
  id, brand_id, name, slug, postal_code, prefecture, city, address_line, latitude, longitude,
  nearest_station, official_url, source_url, is_active, last_verified_at
)
values
  ('aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaa1', '11111111-1111-1111-1111-111111111111', 'Gold''s Gym 渋谷東京', 'golds-gym-shibuya', '150-0042', '東京都', '渋谷区', '宇田川町 31-2 渋谷BEAM 6F', 35.661800, 139.698100, '渋谷駅', 'https://www.goldsgym.jp/shop/13110', 'https://www.goldsgym.jp/shop/13110/program', true, now()),
  ('aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaa2', '11111111-1111-1111-1111-111111111111', 'Gold''s Gym 銀座中央', 'golds-gym-ginza', '104-0061', '東京都', '中央区', '銀座 1-2-4 サクセス銀座ファーストビル', 35.674500, 139.769000, '銀座一丁目駅', 'https://www.goldsgym.jp/shop/13120', 'https://www.goldsgym.jp/shop/13120/program', true, now()),
  ('bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbb1', '22222222-2222-2222-2222-222222222222', 'コナミスポーツクラブ 新宿', 'konami-shinjuku', '160-0023', '東京都', '新宿区', '西新宿 1-1-5', 35.690500, 139.699400, '新宿駅', 'https://www.konami.com/sportsclub/shisetsu/shinjuku/', 'https://www.konami.com/sportsclub/shisetsu/shinjuku/program/', true, now()),
  ('bbbbbbb2-bbbb-bbbb-bbbb-bbbbbbbbbbb2', '22222222-2222-2222-2222-222222222222', 'コナミスポーツクラブ 池袋', 'konami-ikebukuro', '171-0022', '東京都', '豊島区', '南池袋 1-28-1', 35.728900, 139.710100, '池袋駅', 'https://www.konami.com/sportsclub/shisetsu/ikebukuro/', 'https://www.konami.com/sportsclub/shisetsu/ikebukuro/program/', true, now()),
  ('ccccccc1-cccc-cccc-cccc-ccccccccccc1', '33333333-3333-3333-3333-333333333333', 'セントラルスポーツ 大森', 'central-omori', '143-0016', '東京都', '大田区', '大森北 1-8-2 icot大森', 35.588900, 139.728400, '大森駅', 'https://www.central.co.jp/club/omori/', 'https://www.central.co.jp/club/omori/schedule/', true, now()),
  ('ccccccc2-cccc-cccc-cccc-ccccccccccc2', '33333333-3333-3333-3333-333333333333', 'セントラルスポーツ 錦糸町', 'central-kinshicho', '130-0013', '東京都', '墨田区', '錦糸 1-5-10', 35.697400, 139.814900, '錦糸町駅', 'https://www.central.co.jp/club/kinshicho/', 'https://www.central.co.jp/club/kinshicho/schedule/', true, now())
on conflict (id) do nothing;

insert into programs (id, name, slug, category, description, intensity_level, beginner_friendly, default_duration_minutes)
values
  ('44444444-4444-4444-4444-444444444441', 'BODYCOMBAT', 'bodycombat', 'Les Mills', '格闘技の動きを取り入れた有酸素プログラム', 4, false, 45),
  ('44444444-4444-4444-4444-444444444442', 'BODYPUMP', 'bodypump', 'Les Mills', 'バーベルを使った全身筋力トレーニング', 4, false, 45),
  ('44444444-4444-4444-4444-444444444443', 'Yoga', 'yoga', 'Mind & Body', '呼吸と姿勢を整える定番クラス', 2, true, 60),
  ('44444444-4444-4444-4444-444444444444', 'Pilates', 'pilates', 'Mind & Body', '体幹を意識したコンディショニング', 2, true, 50)
on conflict (id) do nothing;

insert into program_aliases (id, program_id, alias_name)
values
  ('55555555-5555-5555-5555-555555555551', '44444444-4444-4444-4444-444444444441', 'ボディコンバット'),
  ('55555555-5555-5555-5555-555555555552', '44444444-4444-4444-4444-444444444442', 'ボディパンプ'),
  ('55555555-5555-5555-5555-555555555553', '44444444-4444-4444-4444-444444444443', 'ヨガ'),
  ('55555555-5555-5555-5555-555555555554', '44444444-4444-4444-4444-444444444444', 'ピラティス')
on conflict (id) do nothing;

insert into class_schedules (
  id, location_id, program_id, raw_program_name, weekday, start_time, end_time, duration_minutes,
  studio_name, instructor_name, source_page_url, valid_from, extracted_at
)
values
  ('66666666-6666-6666-6666-666666666661', 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaa1', '44444444-4444-4444-4444-444444444441', 'BODYCOMBAT 45', 'monday', '19:00', '19:45', 45, 'Studio A', 'Saito', 'https://example.com/golds-shibuya/bodycombat', '2026-04-01', now()),
  ('66666666-6666-6666-6666-666666666662', 'aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaa2', '44444444-4444-4444-4444-444444444442', 'BODYPUMP 45', 'wednesday', '18:30', '19:15', 45, 'Main Studio', 'Tanaka', 'https://example.com/golds-ginza/bodypump', '2026-04-01', now()),
  ('66666666-6666-6666-6666-666666666663', 'bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbb1', '44444444-4444-4444-4444-444444444443', 'Morning Yoga', 'tuesday', '10:00', '11:00', 60, 'Studio 2', 'Aki', 'https://example.com/konami-shinjuku/yoga', '2026-04-01', now()),
  ('66666666-6666-6666-6666-666666666664', 'bbbbbbb2-bbbb-bbbb-bbbb-bbbbbbbbbbb2', '44444444-4444-4444-4444-444444444444', 'Pilates Basic', 'friday', '20:00', '20:50', 50, 'Body Studio', 'Mori', 'https://example.com/konami-ikebukuro/pilates', '2026-04-01', now()),
  ('66666666-6666-6666-6666-666666666665', 'ccccccc1-cccc-cccc-cccc-ccccccccccc1', '44444444-4444-4444-4444-444444444443', 'Relax Yoga', 'saturday', '09:30', '10:30', 60, 'Studio Green', 'Kato', 'https://example.com/central-omori/yoga', '2026-04-01', now()),
  ('66666666-6666-6666-6666-666666666666', 'ccccccc2-cccc-cccc-cccc-ccccccccccc2', '44444444-4444-4444-4444-444444444441', 'BODYCOMBAT 30', 'sunday', '13:00', '13:30', 30, 'Studio Red', 'Nakamura', 'https://example.com/central-kinshicho/bodycombat', '2026-04-01', now())
on conflict (id) do nothing;

insert into source_pages (
  id, location_id, source_type, url, format, parser_key, last_fetched_at, last_parsed_at, fetch_status, parse_status, notes
)
values
  ('77777777-7777-7777-7777-777777777771', 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'location_schedule', 'https://www.goldsgym.jp/shop/13110/program', 'html', 'manual_seed_v1', now(), now(), 'success', 'success', 'MVP seed data'),
  ('77777777-7777-7777-7777-777777777772', 'aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'location_schedule', 'https://www.goldsgym.jp/shop/13120/program', 'html', 'manual_seed_v1', now(), now(), 'success', 'success', 'MVP seed data'),
  ('77777777-7777-7777-7777-777777777773', 'bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 'location_schedule', 'https://www.konami.com/sportsclub/shisetsu/shinjuku/program/', 'html', 'manual_seed_v1', now(), now(), 'success', 'success', 'MVP seed data'),
  ('77777777-7777-7777-7777-777777777774', 'bbbbbbb2-bbbb-bbbb-bbbb-bbbbbbbbbbb2', 'location_schedule', 'https://www.konami.com/sportsclub/shisetsu/ikebukuro/program/', 'html', 'manual_seed_v1', now(), now(), 'success', 'success', 'MVP seed data'),
  ('77777777-7777-7777-7777-777777777775', 'ccccccc1-cccc-cccc-cccc-ccccccccccc1', 'location_schedule', 'https://www.central.co.jp/club/omori/schedule/', 'html', 'manual_seed_v1', now(), now(), 'success', 'success', 'MVP seed data'),
  ('77777777-7777-7777-7777-777777777776', 'ccccccc2-cccc-cccc-cccc-ccccccccccc2', 'location_schedule', 'https://www.central.co.jp/club/kinshicho/schedule/', 'html', 'manual_seed_v1', now(), now(), 'success', 'success', 'MVP seed data')
on conflict (id) do nothing;

insert into ingestion_runs (
  id, started_at, finished_at, trigger_type, status, total_sources, success_count, failed_count, warning_count, logs_json
)
values
  ('88888888-8888-8888-8888-888888888881', now(), now(), 'manual', 'success', 6, 6, 0, 0, '{"message":"Seed data inserted"}'::jsonb)
on conflict (id) do nothing;

insert into ingestion_items (
  id, run_id, source_page_id, status, detected_records, inserted_records, updated_records, error_message, raw_output_json
)
values
  ('99999999-9999-9999-9999-999999999991', '88888888-8888-8888-8888-888888888881', '77777777-7777-7777-7777-777777777771', 'success', 1, 1, 0, null, '{"parser":"manual_seed_v1"}'::jsonb),
  ('99999999-9999-9999-9999-999999999992', '88888888-8888-8888-8888-888888888881', '77777777-7777-7777-7777-777777777772', 'success', 1, 1, 0, null, '{"parser":"manual_seed_v1"}'::jsonb),
  ('99999999-9999-9999-9999-999999999993', '88888888-8888-8888-8888-888888888881', '77777777-7777-7777-7777-777777777773', 'success', 1, 1, 0, null, '{"parser":"manual_seed_v1"}'::jsonb),
  ('99999999-9999-9999-9999-999999999994', '88888888-8888-8888-8888-888888888881', '77777777-7777-7777-7777-777777777774', 'success', 1, 1, 0, null, '{"parser":"manual_seed_v1"}'::jsonb),
  ('99999999-9999-9999-9999-999999999995', '88888888-8888-8888-8888-888888888881', '77777777-7777-7777-7777-777777777775', 'success', 1, 1, 0, null, '{"parser":"manual_seed_v1"}'::jsonb),
  ('99999999-9999-9999-9999-999999999996', '88888888-8888-8888-8888-888888888881', '77777777-7777-7777-7777-777777777776', 'success', 1, 1, 0, null, '{"parser":"manual_seed_v1"}'::jsonb)
on conflict (id) do nothing;
