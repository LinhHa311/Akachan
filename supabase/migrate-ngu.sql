-- Thêm chức năng ghi giấc ngủ (nút Ngủ / Dậy).
-- Chỉ cần chạy 1 lần: SQL Editor → New query → dán file này → Run.
-- Dữ liệu cũ giữ nguyên; các dòng 'breast_bottle' / 'pump' không còn hiện trong app.

alter table public.entries add column if not exists end_at timestamptz; -- lúc dậy, null khi đang ngủ

alter table public.entries drop constraint if exists entries_type_check;
alter table public.entries add constraint entries_type_check
  check (type in ('breast', 'breast_bottle', 'formula', 'pump', 'pee', 'poop', 'sleep'));

alter table public.entries drop constraint if exists entries_sleep_end_check;
alter table public.entries add constraint entries_sleep_end_check check (end_at is null or end_at >= at);

-- Muốn xoá hẳn dữ liệu sữa mẹ bình / vắt sữa cũ thì bỏ dấu -- ở dòng dưới rồi chạy (không lấy lại được):
-- delete from public.entries where type in ('breast_bottle', 'pump');
