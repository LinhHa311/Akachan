-- Thêm 2 loại ghi mới: 'breast_bottle' (sữa mẹ bình) và 'pump' (vắt sữa).
-- Chỉ cần chạy 1 lần trên project đã tạo từ schema.sql bản cũ:
-- SQL Editor → New query → dán file này → Run. Dữ liệu cũ giữ nguyên.

alter table public.entries drop constraint if exists entries_type_check;
alter table public.entries add constraint entries_type_check
  check (type in ('breast', 'breast_bottle', 'formula', 'pump', 'pee', 'poop'));
