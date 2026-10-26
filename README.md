# Sam's Daily 🍼

Web app nhỏ, miễn phí, để hai vợ chồng ghi nhật ký em bé sơ sinh: cữ bú, tiểu tiện, đại tiện, kèm tổng hợp và biểu đồ so sánh từng ngày.

## Tính năng

- **Ghi nhanh** bằng 4 nút lớn (dùng một tay lúc nửa đêm):
  - 🤱 Sữa mẹ: số phút bú
  - 🍼 Sữa công thức: số ml (có nút nhanh 20 / 40 / 60 ml)
  - 💧 Tiểu, 💩 Đại: bấm một lần là ghi lại giờ hiện tại
- **Hôm nay**: danh sách theo giờ, xoá được, kèm tổng trong ngày (số cữ bú, tổng ml, số phút sữa mẹ, số lần tiểu/đại)
- **Thống kê** 7 hoặc 30 ngày:
  - Biểu đồ tổng ml sữa công thức mỗi ngày
  - Biểu đồ số cữ bú, số lần tiểu, số lần đại mỗi ngày
  - Bảng số để so sánh chính xác

## Công nghệ (đều miễn phí)

| Phần | Dùng |
|---|---|
| Giao diện | [Vite](https://vite.dev) + React |
| Dữ liệu + đăng nhập | [Supabase](https://supabase.com) (gói free) |
| Biểu đồ | [Chart.js](https://www.chartjs.org) + react-chartjs-2 |
| Deploy | [Vercel](https://vercel.com) hoặc GitHub Pages |

Dữ liệu nằm trong một bảng `entries` (xem [supabase/schema.sql](supabase/schema.sql)). Phần tổng hợp theo ngày được tính ngay trên trình duyệt theo giờ địa phương.

## Cài đặt

### 1. Supabase

1. Tạo project mới trên [supabase.com](https://supabase.com).
2. Vào **SQL Editor**, dán nội dung [supabase/schema.sql](supabase/schema.sql) rồi chạy.
3. Vào **Authentication → Users**, tạo 2 tài khoản (email + mật khẩu) cho vợ và chồng.
4. Vào **Authentication → Sign In / Providers** và tắt **Allow new users to sign up** để người lạ không đăng ký được.
5. Vào **Project Settings → API**, copy **Project URL** và **anon public key**.

> Gói free sẽ tạm dừng project nếu 7 ngày không có ai dùng. Khi đó bấm **Restore** trong dashboard là chạy lại.

### 2. Chạy trên máy

```bash
cp .env.example .env   # rồi điền VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY
npm install
npm run dev
```

### 3. Deploy lên Vercel

1. Import repo này trên [vercel.com](https://vercel.com). Vercel tự nhận ra đây là project Vite.
2. Thêm 2 biến môi trường `VITE_SUPABASE_URL` và `VITE_SUPABASE_ANON_KEY`.
3. Deploy. Sau đó, mỗi lần push lên `main` Vercel sẽ tự cập nhật.

Trên điện thoại, mở link rồi chọn **Thêm vào màn hình chính** để dùng như một app.

## Lộ trình

- [x] Khung dự án: đăng nhập, ghi nhanh, hôm nay, thống kê 7/30 ngày
- [ ] PWA (icon, chạy toàn màn hình), sửa mục đã ghi, đồng hồ đếm giờ bú
- [ ] Chọn khoảng ngày tuỳ ý, xuất CSV
- [ ] Nhắc giờ bú, cân nặng/chiều cao
