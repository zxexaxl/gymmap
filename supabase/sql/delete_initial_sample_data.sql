-- 構築当初のサンプル seed を削除するための SQL です。
-- 対象:
-- - Gold's Gym / Konami Sports Club / Central Sports の初期サンプル店舗
-- - それに紐づく class_schedules / source_pages / ingestion_items / ingestion_runs
-- 注意:
-- - 実運用で使っている同名ブランドがある場合に備え、まずは初期 seed の固定 ID を優先して削除します。

begin;

delete from ingestion_items
where run_id = '88888888-8888-8888-8888-888888888881';

delete from ingestion_runs
where id = '88888888-8888-8888-8888-888888888881';

delete from source_pages
where id in (
  '77777777-7777-7777-7777-777777777771',
  '77777777-7777-7777-7777-777777777772',
  '77777777-7777-7777-7777-777777777773',
  '77777777-7777-7777-7777-777777777774',
  '77777777-7777-7777-7777-777777777775',
  '77777777-7777-7777-7777-777777777776',
  '77777777-7777-7777-7777-777777777777',
  '77777777-7777-7777-7777-777777777778'
);

delete from class_schedules
where location_id in (
  'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
  'aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
  'aaaaaaa3-aaaa-aaaa-aaaa-aaaaaaaaaaa3',
  'bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
  'bbbbbbb2-bbbb-bbbb-bbbb-bbbbbbbbbbb2',
  'ccccccc1-cccc-cccc-cccc-ccccccccccc1',
  'ccccccc2-cccc-cccc-cccc-ccccccccccc2',
  'ccccccc3-cccc-cccc-cccc-ccccccccccc3'
);

delete from gym_locations
where id in (
  'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
  'aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
  'aaaaaaa3-aaaa-aaaa-aaaa-aaaaaaaaaaa3',
  'bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
  'bbbbbbb2-bbbb-bbbb-bbbb-bbbbbbbbbbb2',
  'ccccccc1-cccc-cccc-cccc-ccccccccccc1',
  'ccccccc2-cccc-cccc-cccc-ccccccccccc2',
  'ccccccc3-cccc-cccc-cccc-ccccccccccc3'
);

delete from program_aliases
where id in (
  '55555555-5555-5555-5555-555555555551',
  '55555555-5555-5555-5555-555555555552',
  '55555555-5555-5555-5555-555555555553',
  '55555555-5555-5555-5555-555555555554'
);

delete from programs
where id in (
  '44444444-4444-4444-4444-444444444441',
  '44444444-4444-4444-4444-444444444442',
  '44444444-4444-4444-4444-444444444443',
  '44444444-4444-4444-4444-444444444444'
)
and not exists (
  select 1
  from class_schedules
  where class_schedules.program_id = programs.id
);

delete from gym_brands
where id in (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333'
)
and not exists (
  select 1
  from gym_locations
  where gym_locations.brand_id = gym_brands.id
);

commit;
