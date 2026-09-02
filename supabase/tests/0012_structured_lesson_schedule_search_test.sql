begin;

select no_plan();

insert into public.gym_brands (id, name, slug)
values
  ('12000000-0000-0000-0000-000000000001', 'S1R1 Alpha', 's1r1-alpha'),
  ('12000000-0000-0000-0000-000000000002', 'S1R1 Beta', 's1r1-beta');

insert into public.programs (id, name, slug)
values ('12000000-0000-0000-0000-000000000101', 'S1R1 Program', 's1r1-program');

insert into public.gym_locations (
  id,
  brand_id,
  name,
  slug,
  prefecture,
  city,
  address_line,
  is_active
)
values
  ('12000000-0000-0000-0000-000000000201', '12000000-0000-0000-0000-000000000001', 'S1R1 港', 's1r1-minato', '東京都', '港区芝', '芝1-1', true),
  ('12000000-0000-0000-0000-000000000202', '12000000-0000-0000-0000-000000000001', 'S1R1 渋谷', 's1r1-shibuya', '東京都', ' 渋谷区　広尾 ', '広尾1-1', true),
  ('12000000-0000-0000-0000-000000000203', '12000000-0000-0000-0000-000000000001', 'S1R1 横浜', 's1r1-yokohama', '神奈川県', '横浜市港南区', '港南1-1', true),
  ('12000000-0000-0000-0000-000000000204', '12000000-0000-0000-0000-000000000002', 'S1R1 大阪港', 's1r1-osaka-minato', '大阪府', '港区', '海岸通1-1', true),
  ('12000000-0000-0000-0000-000000000205', '12000000-0000-0000-0000-000000000001', 'S1R1 東京市区町村なし', 's1r1-tokyo-blank-city', '東京都', null, '丸の内1-1', true),
  ('12000000-0000-0000-0000-000000000206', '12000000-0000-0000-0000-000000000001', 'S1R1 HYROX only control', 's1r1-non-lesson', '東京都', '港区', '芝2-2', true),
  ('12000000-0000-0000-0000-000000000207', '12000000-0000-0000-0000-000000000001', 'S1R1 inactive Lesson', 's1r1-inactive', '東京都', '港区', '芝3-3', false);

insert into public.lesson_location_memberships (location_id, authority_source)
values
  ('12000000-0000-0000-0000-000000000201', 's1r1-test'),
  ('12000000-0000-0000-0000-000000000202', 's1r1-test'),
  ('12000000-0000-0000-0000-000000000203', 's1r1-test'),
  ('12000000-0000-0000-0000-000000000204', 's1r1-test'),
  ('12000000-0000-0000-0000-000000000205', 's1r1-test'),
  ('12000000-0000-0000-0000-000000000207', 's1r1-test');

insert into public.class_schedules (
  id,
  location_id,
  program_id,
  raw_program_name,
  weekday,
  start_time,
  end_time,
  duration_minutes,
  valid_from,
  normalized_text,
  comparison_key,
  canonical_program_name,
  program_brand,
  extracted_at
)
values
  ('12000000-0000-0000-0000-000000000301', '12000000-0000-0000-0000-000000000201', '12000000-0000-0000-0000-000000000101', 'Old BODYCOMBAT', 'monday', '08:00', '08:45', 45, '2026-01-01', 'old bodycombat', 'oldbodycombat', 'BODYCOMBAT', 'LES MILLS', '2026-01-02 00:00:00+00'),
  ('12000000-0000-0000-0000-000000000302', '12000000-0000-0000-0000-000000000201', '12000000-0000-0000-0000-000000000101', 'BODYCOMBAT', 'monday', '09:00', '09:45', 45, '2026-08-01', 'bodycombat', 'bodycombat', 'BODYCOMBAT', 'LES MILLS', '2026-08-02 00:00:00+00'),
  ('12000000-0000-0000-0000-000000000303', '12000000-0000-0000-0000-000000000201', '12000000-0000-0000-0000-000000000101', 'BODYCOMBAT 45', 'monday', '09:00', '09:45', 45, '2026-08-01', 'bodycombat 45', 'bodycombat45', 'BODYCOMBAT 45', 'LES MILLS', '2026-08-03 00:00:00+00'),
  ('12000000-0000-0000-0000-000000000304', '12000000-0000-0000-0000-000000000201', '12000000-0000-0000-0000-000000000101', 'Power BODYCOMBAT', 'monday', '09:00', '09:45', 45, '2026-08-01', 'power bodycombat', 'powerbodycombat', 'Power BODYCOMBAT', 'LES MILLS', '2026-08-04 00:00:00+00'),
  ('12000000-0000-0000-0000-000000000305', '12000000-0000-0000-0000-000000000201', '12000000-0000-0000-0000-000000000101', 'Canonical alias', 'monday', '09:00', '09:45', 45, '2026-08-01', 'canonical alias', 'canonicalalias', 'Alias Canonical', null, '2026-08-05 00:00:00+00'),
  ('12000000-0000-0000-0000-000000000306', '12000000-0000-0000-0000-000000000201', '12000000-0000-0000-0000-000000000101', 'Brand alias', 'monday', '09:00', '09:45', 45, '2026-08-01', 'brand alias', 'brandalias', null, 'Alias Brand', '2026-08-06 00:00:00+00'),
  ('12000000-0000-0000-0000-000000000307', '12000000-0000-0000-0000-000000000201', '12000000-0000-0000-0000-000000000101', 'Morning short', 'tuesday', '06:00', '06:30', 30, '2026-08-01', 'morning short', 'morningshort', null, null, '2026-08-07 00:00:00+00'),
  ('12000000-0000-0000-0000-000000000308', '12000000-0000-0000-0000-000000000201', '12000000-0000-0000-0000-000000000101', 'Afternoon long', 'friday', '12:00', '13:00', 60, '2026-08-01', 'afternoon long', 'afternoonlong', null, null, '2026-08-08 00:00:00+00'),
  ('12000000-0000-0000-0000-000000000309', '12000000-0000-0000-0000-000000000201', '12000000-0000-0000-0000-000000000101', 'Evening null duration', 'sunday', '18:00', '19:00', null, '2026-08-01', 'evening null duration', 'eveningnullduration', null, null, '2026-08-09 00:00:00+00'),
  ('12000000-0000-0000-0000-000000000310', '12000000-0000-0000-0000-000000000202', '12000000-0000-0000-0000-000000000101', 'Shibuya', 'wednesday', '10:00', '10:45', 45, null, 'shibuya', 'shibuya', null, null, '2026-08-10 00:00:00+00'),
  ('12000000-0000-0000-0000-000000000311', '12000000-0000-0000-0000-000000000203', '12000000-0000-0000-0000-000000000101', 'Yokohama', 'thursday', '10:00', '10:45', 45, null, 'yokohama', 'yokohama', null, null, '2026-08-11 00:00:00+00'),
  ('12000000-0000-0000-0000-000000000312', '12000000-0000-0000-0000-000000000204', '12000000-0000-0000-0000-000000000101', 'Osaka', 'friday', '10:00', '10:45', 45, null, 'osaka', 'osaka', null, null, '2026-08-12 00:00:00+00'),
  ('12000000-0000-0000-0000-000000000313', '12000000-0000-0000-0000-000000000205', '12000000-0000-0000-0000-000000000101', 'Blank city', 'saturday', '10:00', '10:45', 45, null, 'blank city', 'blankcity', null, null, '2026-08-13 00:00:00+00'),
  ('12000000-0000-0000-0000-000000000314', '12000000-0000-0000-0000-000000000206', '12000000-0000-0000-0000-000000000101', 'Non Lesson', 'monday', '07:00', '07:45', 45, null, 'non lesson', 'nonlesson', null, null, '2026-08-14 00:00:00+00'),
  ('12000000-0000-0000-0000-000000000315', '12000000-0000-0000-0000-000000000207', '12000000-0000-0000-0000-000000000101', 'Inactive', 'monday', '07:00', '07:45', 45, null, 'inactive', 'inactive', null, null, '2026-08-15 00:00:00+00');

select is(
  (
    select count(*)
    from pg_proc
    where pronamespace = 'public'::regnamespace
      and proname = 'search_structured_lesson_class_schedule_page'
      and pg_get_function_identity_arguments(oid) = 'p_query text, p_query_compact text, p_canonical_names text[], p_program_brands text[], p_weekday text, p_time_range text, p_duration_range text, p_brand text, p_prefecture text, p_municipality text, p_offset integer, p_limit integer'
  ),
  1::bigint,
  'structured Lesson RPC has the approved identity'
);

select results_eq(
  $$select pg_get_function_result(pg_proc.oid), lanname, provolatile, prosecdef, proconfig
    from pg_proc
    join pg_language on pg_language.oid = pg_proc.prolang
    where pronamespace = 'public'::regnamespace
      and proname = 'search_structured_lesson_class_schedule_page'$$,
  $$select
      column1 as pg_get_function_result,
      column2 as lanname,
      column3 as provolatile,
      column4 as prosecdef,
      column5 as proconfig
    from (values (
      'TABLE(schedule_id uuid, result_order bigint, total_count bigint, latest_schedule_update timestamp with time zone)'::text,
      'sql'::name,
      's'::"char",
      false,
      array['search_path=public']::text[]
    )) expected$$,
  'structured Lesson RPC metadata is stable, invoker, SQL, and fixed to public'
);

select ok(
  to_regprocedure(
    'public.search_lesson_class_schedule_page(text,text,text[],text[],text,text,text,text,text,integer,integer)'
  ) is not null
  and pg_get_functiondef(
    'public.search_lesson_class_schedule_page(text,text,text[],text[],text,text,text,text,text,integer,integer)'::regprocedure
  ) like '%p_area text DEFAULT%'
  and pg_get_functiondef(
    'public.search_lesson_class_schedule_page(text,text,text[],text[],text,text,text,text,text,integer,integer)'::regprocedure
  ) not like '%p_prefecture text DEFAULT%',
  'existing free-text RPC identity and area contract remain intact'
);

select ok(
  has_function_privilege(
    'anon',
    'public.search_structured_lesson_class_schedule_page(text,text,text[],text[],text,text,text,text,text,text,integer,integer)',
    'EXECUTE'
  )
  and has_function_privilege(
    'authenticated',
    'public.search_structured_lesson_class_schedule_page(text,text,text[],text[],text,text,text,text,text,text,integer,integer)',
    'EXECUTE'
  ),
  'anon and authenticated can execute the structured Lesson RPC'
);

select ok(
  not exists (
    select 1
    from pg_proc
    cross join lateral aclexplode(coalesce(proacl, acldefault('f', proowner))) grants
    where pg_proc.oid = 'public.search_structured_lesson_class_schedule_page(text,text,text[],text[],text,text,text,text,text,text,integer,integer)'::regprocedure
      and grants.grantee = 0
      and grants.privilege_type = 'EXECUTE'
  ),
  'PUBLIC has no execute grant on the structured Lesson RPC'
);

select like(
  obj_description(
    'public.search_structured_lesson_class_schedule_page(text,text,text[],text[],text,text,text,text,text,text,integer,integer)'::regprocedure,
    'pg_proc'
  ),
  '%must remain aligned with search_lesson_class_schedule_page%',
  'function comment records the free-text parity obligation'
);

select results_eq(
  $$select schedule_id, result_order, total_count, latest_schedule_update
    from public.search_lesson_class_schedule_page(p_area => '東京都 港区')$$,
  $$select schedule_id, result_order, total_count, latest_schedule_update
    from public.search_structured_lesson_class_schedule_page(p_prefecture => '東京都', p_municipality => '港区')$$,
  'area-only structured RPC matches the current RPC on a controlled same-area fixture'
);

select results_eq(
  $$select schedule_id, result_order, total_count, latest_schedule_update
    from public.search_lesson_class_schedule_page(
      p_query => 'bodycombat',
      p_query_compact => 'bodycombat',
      p_canonical_names => array['Alias Canonical'],
      p_program_brands => array['Alias Brand'],
      p_area => '東京都 港区'
    )$$,
  $$select schedule_id, result_order, total_count, latest_schedule_update
    from public.search_structured_lesson_class_schedule_page(
      p_query => 'bodycombat',
      p_query_compact => 'bodycombat',
      p_canonical_names => array['Alias Canonical'],
      p_program_brands => array['Alias Brand'],
      p_prefecture => '東京都',
      p_municipality => '港区'
    )$$,
  'program scoring and alias expansion inputs remain parity-locked'
);

select results_eq(
  $$select schedule_id from public.search_structured_lesson_class_schedule_page(
      p_query => 'bodycombat',
      p_query_compact => 'bodycombat',
      p_canonical_names => array['Alias Canonical'],
      p_program_brands => array['Alias Brand'],
      p_prefecture => '東京都',
      p_municipality => '港区'
    ) where schedule_id is not null$$,
  $$values
    ('12000000-0000-0000-0000-000000000302'::uuid),
    ('12000000-0000-0000-0000-000000000303'::uuid),
    ('12000000-0000-0000-0000-000000000304'::uuid),
    ('12000000-0000-0000-0000-000000000306'::uuid),
    ('12000000-0000-0000-0000-000000000305'::uuid)$$,
  'exact, prefix, substring, program-brand, and canonical-alias scores order identically'
);

select results_eq(
  $$select schedule_id, result_order, total_count from public.search_structured_lesson_class_schedule_page(
      p_prefecture => '東京都', p_municipality => '港区', p_limit => 2, p_offset => 0
    )$$,
  $$values
    ('12000000-0000-0000-0000-000000000302'::uuid, 1::bigint, 8::bigint),
    ('12000000-0000-0000-0000-000000000303'::uuid, 2::bigint, 8::bigint)$$,
  'page one uses stable server ordering and exact total count'
);

select results_eq(
  $$select schedule_id, result_order, total_count from public.search_structured_lesson_class_schedule_page(
      p_prefecture => '東京都', p_municipality => '港区', p_limit => 2, p_offset => 2
    )$$,
  $$values
    ('12000000-0000-0000-0000-000000000304'::uuid, 3::bigint, 8::bigint),
    ('12000000-0000-0000-0000-000000000305'::uuid, 4::bigint, 8::bigint)$$,
  'page two continues without duplicate or missing boundary rows'
);

select results_eq(
  $$select schedule_id from public.search_structured_lesson_class_schedule_page(
      p_prefecture => '東京都', p_municipality => '港区'
    ) where schedule_id is not null$$,
  $$values
    ('12000000-0000-0000-0000-000000000302'::uuid),
    ('12000000-0000-0000-0000-000000000303'::uuid),
    ('12000000-0000-0000-0000-000000000304'::uuid),
    ('12000000-0000-0000-0000-000000000305'::uuid),
    ('12000000-0000-0000-0000-000000000306'::uuid),
    ('12000000-0000-0000-0000-000000000307'::uuid),
    ('12000000-0000-0000-0000-000000000308'::uuid),
    ('12000000-0000-0000-0000-000000000309'::uuid)$$,
  'Tokyo Minato matches only the intended active Lesson member and latest period'
);

select results_eq(
  $$select schedule_id from public.search_structured_lesson_class_schedule_page(
      p_prefecture => '東京都', p_municipality => '渋谷区'
    ) where schedule_id is not null$$,
  $$values ('12000000-0000-0000-0000-000000000310'::uuid)$$,
  'municipality prefix matches Shibuya ward neighborhood text'
);

select results_eq(
  $$select schedule_id from public.search_structured_lesson_class_schedule_page(
      p_prefecture => '神奈川県', p_municipality => '横浜市'
    ) where schedule_id is not null$$,
  $$values ('12000000-0000-0000-0000-000000000311'::uuid)$$,
  'municipality prefix matches Yokohama city ward text'
);

select is(
  (select max(total_count) from public.search_structured_lesson_class_schedule_page(
    p_prefecture => '東京都', p_municipality => '横浜市'
  )),
  0::bigint,
  'prefecture and municipality identity cannot cross-match'
);

select is(
  (select max(total_count) from public.search_structured_lesson_class_schedule_page(
    p_prefecture => '東京都', p_municipality => ''
  )),
  10::bigint,
  'blank municipality performs an exact prefecture-only search'
);

select is(
  (select max(total_count) from public.search_structured_lesson_class_schedule_page(
    p_prefecture => '東京都', p_municipality => '港区'
  )),
  8::bigint,
  'blank city, non-Lesson, inactive, and other-prefecture controls are excluded'
);

select results_eq(
  $$select schedule_id, total_count from public.search_structured_lesson_class_schedule_page(
      p_prefecture => '', p_municipality => ''
    )$$,
  $$values (null::uuid, 0::bigint)$$,
  'blank prefecture fails closed with only zero-count metadata'
);

select results_eq(
  $$select schedule_id, result_order, total_count from public.search_lesson_class_schedule_page(
      p_weekday => 'monday', p_area => '東京都 港区'
    )$$,
  $$select schedule_id, result_order, total_count from public.search_structured_lesson_class_schedule_page(
      p_weekday => 'monday', p_prefecture => '東京都', p_municipality => '港区'
    )$$,
  'weekday filtering remains parity-locked'
);

select results_eq(
  $$select schedule_id, result_order, total_count from public.search_lesson_class_schedule_page(
      p_time_range => 'morning', p_area => '東京都 港区'
    )$$,
  $$select schedule_id, result_order, total_count from public.search_structured_lesson_class_schedule_page(
      p_time_range => 'morning', p_prefecture => '東京都', p_municipality => '港区'
    )$$,
  'time-range boundaries remain parity-locked'
);

select results_eq(
  $$select schedule_id from public.search_structured_lesson_class_schedule_page(
      p_time_range => 'morning', p_prefecture => '東京都', p_municipality => '港区'
    ) where schedule_id is not null$$,
  $$values
    ('12000000-0000-0000-0000-000000000302'::uuid),
    ('12000000-0000-0000-0000-000000000303'::uuid),
    ('12000000-0000-0000-0000-000000000304'::uuid),
    ('12000000-0000-0000-0000-000000000305'::uuid),
    ('12000000-0000-0000-0000-000000000306'::uuid),
    ('12000000-0000-0000-0000-000000000307'::uuid)$$,
  'morning includes 06:00 and excludes the 12:00 boundary'
);

select results_eq(
  $$select schedule_id, result_order, total_count from public.search_lesson_class_schedule_page(
      p_duration_range => 'short', p_area => '東京都 港区'
    )$$,
  $$select schedule_id, result_order, total_count from public.search_structured_lesson_class_schedule_page(
      p_duration_range => 'short', p_prefecture => '東京都', p_municipality => '港区'
    )$$,
  'duration filtering and null-duration exclusion remain parity-locked'
);

select results_eq(
  $$select schedule_id from public.search_structured_lesson_class_schedule_page(
      p_duration_range => 'long', p_prefecture => '東京都', p_municipality => '港区'
    ) where schedule_id is not null$$,
  $$values ('12000000-0000-0000-0000-000000000308'::uuid)$$,
  'long duration includes 60 minutes while excluding null duration'
);

select results_eq(
  $$select schedule_id, result_order, total_count from public.search_lesson_class_schedule_page(
      p_brand => 'S1R1 Alpha', p_area => '東京都 港区'
    )$$,
  $$select schedule_id, result_order, total_count from public.search_structured_lesson_class_schedule_page(
      p_brand => 'S1R1 Alpha', p_prefecture => '東京都', p_municipality => '港区'
    )$$,
  'brand filtering remains parity-locked'
);

select is(
  (select max(latest_schedule_update) from public.search_structured_lesson_class_schedule_page(
    p_prefecture => '東京都', p_municipality => '港区'
  )),
  '2026-08-09 00:00:00+00'::timestamptz,
  'latest_schedule_update is the latest matched schedule extraction timestamp'
);

select results_eq(
  $$select schedule_id from public.search_structured_lesson_class_schedule_page(
      p_prefecture => '東京都', p_municipality => '港区', p_offset => -10, p_limit => 0
    ) where schedule_id is not null$$,
  $$values ('12000000-0000-0000-0000-000000000302'::uuid)$$,
  'negative offset and zero limit mirror current greatest-based clamping'
);

set local role anon;

select is(
  (select total_count from public.search_structured_lesson_class_schedule_page(
    p_prefecture => '東京都', p_municipality => '港区'
  ) limit 1),
  8::bigint,
  'anon can execute structured Lesson search through invoker-readable authority'
);

reset role;
set local role authenticated;

select is(
  (select total_count from public.search_structured_lesson_class_schedule_page(
    p_prefecture => '東京都', p_municipality => '港区'
  ) limit 1),
  8::bigint,
  'authenticated can execute structured Lesson search through invoker-readable authority'
);

reset role;

select * from finish();
rollback;
