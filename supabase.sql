create table if not exists public.scores (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  nama text not null,
  kelas text not null,
  absen int,
  benar int not null,
  total int not null,
  nilai int not null
);

-- RLS aktif tanpa policy: hanya server (service_role key) yang bisa baca/tulis tabel ini.
alter table public.scores enable row level security;
