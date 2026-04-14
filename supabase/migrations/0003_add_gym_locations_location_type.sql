alter table gym_locations
  add column if not exists location_type text
  check (
    location_type in (
      'fitness_club',
      'fitness_spa',
      'light_gym',
      'flat',
      'sopra',
      'bodymake_gym',
      'fitness_studio'
    )
  );
