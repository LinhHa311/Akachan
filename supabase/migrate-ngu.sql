-- Thêm chức năng ghi giấc ngủ (nút Ngủ / Dậy).
-- Chỉ cần chạy 1 lần: SQL Editor → New query → dán file này → Run.
-- Dữ liệu sữa mẹ bình ('breast_bottle') và vắt sữa ('pump') cũ bị xoá ở cuối file.

alter table public.entries add column if not exists end_at timestamptz; -- lúc dậy, null khi đang ngủ

alter table public.entries drop constraint if exists entries_type_check;
alter table public.entries add constraint entries_type_check
  check (type in ('breast', 'breast_bottle', 'formula', 'pump', 'pee', 'poop', 'sleep'));

alter table public.entries drop constraint if exists entries_sleep_end_check;
alter table public.entries add constraint entries_sleep_end_check check (end_at is null or end_at >= at);

-- Xoá hẳn dữ liệu sữa mẹ bình / vắt sữa cũ, app không dùng nữa (không lấy lại được):
delete from public.entries where type in ('breast_bottle', 'pump');
