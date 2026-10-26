-- Chạy file này trong Supabase: SQL Editor → New query → Run

create table if not exists public.entries (
  id           bigint generated always as identity primary key,
  type         text not null check (type in ('breast', 'formula', 'pee', 'poop')),
  at           timestamptz not null default now(),
  duration_min integer check (duration_min >= 0), -- chỉ dùng cho sữa mẹ
  amount_ml    integer check (amount_ml >= 0),    -- chỉ dùng cho sữa công thức
  note         text,
  created_by   uuid default auth.uid() references auth.users (id),
  created_at   timestamptz not null default now()
);

create index if not exists entries_at_idx on public.entries (at desc);

-- Chỉ người đã đăng nhập mới đọc/ghi được.
-- Nhớ tắt đăng ký mới (Authentication → Sign In / Providers → tắt "Allow new users to sign up")
-- sau khi đã tạo 2 tài khoản của vợ chồng.
alter table public.entries enable row level security;

create policy "authenticated can read"   on public.entries for select to authenticated using (true);
create policy "authenticated can insert" on public.entries for insert to authenticated with check (true);
create policy "authenticated can update" on public.entries for update to authenticated using (true);
create policy "authenticated can delete" on public.entries for delete to authenticated using (true);
