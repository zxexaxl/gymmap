alter table class_schedules
  add column if not exists canonical_program_name text,
  add column if not exists normalized_text text,
  add column if not exists comparison_key text,
  add column if not exists program_brand text,
  add column if not exists category_primary text,
  add column if not exists tags text[],
  add column if not exists match_method text check (match_method in ('exact', 'similar', 'unresolved')),
  add column if not exists confidence numeric(4, 2),
  add column if not exists needs_review boolean not null default false;
