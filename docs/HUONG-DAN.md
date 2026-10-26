# Hướng dẫn làm và vận hành Sam's Diary

Tài liệu này tóm tắt cách app được làm từ đầu, cách sửa tính năng hằng ngày và cách vận hành. Mục đích: đọc để hiểu, rồi tự làm được app tương tự.

- App: https://akachan-ten.vercel.app
- Code: https://github.com/LinhHa311/Akachan
- Chi phí: 0 đồng (GitHub, Supabase và Vercel đều dùng gói free)

---

## 1. Bức tranh tổng thể

```
 iPhone (Safari / icon trên màn hình chính)
        │  mở link
        ▼
 Vercel ── phát file web tĩnh (HTML, JS, CSS, icon)
        ▲
        │  tự build & deploy mỗi lần push
 GitHub ── lưu code (nhánh main)
        ▲
        │  git push
 Máy tính ── sửa code, chạy thử bằng `npm run dev`

 Trên iPhone, code JS gọi thẳng tới:
 Supabase ── đăng nhập (Auth) + database Postgres (bảng entries)
```

Vercel không có backend. Nó chỉ phát file web tĩnh. Mọi dữ liệu do trình duyệt đọc/ghi trực tiếp với Supabase. Bảo mật nằm ở **RLS** của Supabase (xem mục 6).

| Thành phần | Dùng để làm gì |
|---|---|
| **Vite** | Công cụ chạy thử (`npm run dev`) và đóng gói (`npm run build`) ra thư mục `dist/` |
| **React** | Viết giao diện dạng component (Login, QuickAdd, DayView, Stats…) |
| **Supabase** | Database Postgres + đăng nhập email/mật khẩu, có gói free |
| **Chart.js** | Vẽ biểu đồ cột trong tab Thống kê |
| **Vercel** | Đưa web lên mạng (HTTPS), tự deploy khi có push lên `main` |
| **PWA** | Cho phép "Thêm vào MH chính" trên iPhone, mở như app thật |

---

## 2. Các bước làm từ đầu (đúng thứ tự đã làm)

### Bước 1: Repo và khung dự án
1. Tạo repo trống trên GitHub, clone về máy.
2. Tạo khung Vite + React: `package.json`, `vite.config.js`, `index.html`, `src/main.jsx`, `src/App.jsx`.
3. Cài thư viện: `npm install` (react, @supabase/supabase-js, chart.js, react-chartjs-2).
4. `.gitignore` phải có `node_modules`, `dist`, `.env` để không đẩy key và file build lên GitHub.

### Bước 2: Supabase
1. Tạo project trên supabase.com.
2. **SQL Editor → New query**: dán [supabase/schema.sql](../supabase/schema.sql) → **Run**. Lệnh này tạo bảng `entries` và bật RLS. Không cần bấm Save; vào Table Editor không thấy bảng thì tải lại trang và chọn schema `public`.
3. **Authentication → Users → Add user**: tạo tài khoản cho từng người, tick **Auto Confirm User**.
4. **Authentication → Sign In / Providers**: tắt **Allow new users to sign up** → **Save changes**.
5. Lấy **Project URL** (`https://<project-id>.supabase.co`, *không phải* link dashboard) và **publishable key** (`sb_publishable_...`).

### Bước 3: Chạy trên máy
```bash
cp .env.example .env    # điền VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY
npm install
npm run dev             # mở http://localhost:5173
```

### Bước 4: Deploy lên Vercel
1. Đăng nhập vercel.com bằng GitHub, cài Vercel GitHub App với **Only select repositories** → chọn repo này.
2. **Add New → Project → Import** repo. Vercel tự nhận ra Vite.
3. **Không** bấm "Add" Supabase ở phần Optional Integrations (nó sẽ tạo project Supabase mới).
4. **Settings → Environment Variables → Add Environment Variable**:
   - Type: **Config**
   - Dán cả 2 dòng `.env` vào ô Key, Vercel tự tách.
   - Gặp cảnh báo "might expose sensitive information" → **Mark as Safe** (publishable key vốn công khai).
5. **Deployments → ⋯ → Redeploy** (không tick "Use existing Build Cache"). Biến `VITE_...` được gắn vào code **lúc build**, nên thêm/sửa biến xong **luôn phải Redeploy**.

### Bước 5: Biến web thành "app" trên iPhone (PWA)
- [public/manifest.webmanifest](../public/manifest.webmanifest): tên app, màu, icon, `display: standalone` (toàn màn hình).
- [index.html](../index.html): thẻ `apple-mobile-web-app-*`, `viewport-fit=cover`, `apple-touch-icon`.
- [src/index.css](../src/index.css):
  - `env(safe-area-inset-*)` để chừa chỗ tai thỏ và thanh home.
  - Ô nhập `font-size: 16px` để iOS không tự phóng to.
  - `touch-action: manipulation` để bấm nhanh 2 lần không bị zoom.
- Icon vẽ bằng [scripts/make-icons.mjs](../scripts/make-icons.mjs); sửa xong chạy `node scripts/make-icons.mjs`.

Cài trên iPhone: mở link bằng **Safari → Chia sẻ → Thêm vào MH chính → đăng nhập lại** (app ở màn hình chính lưu đăng nhập tách riêng với Safari).

---

## 3. Đọc code ở đâu

| File | Nội dung |
|---|---|
| [src/App.jsx](../src/App.jsx) | Khung chính: kiểm tra đăng nhập, header, tab Ngày / Thống kê |
| [src/components/Login.jsx](../src/components/Login.jsx) | Màn đăng nhập email + mật khẩu |
| [src/components/Clock.jsx](../src/components/Clock.jsx) | Đồng hồ giờ + ngày ở đầu trang |
| [src/components/QuickAdd.jsx](../src/components/QuickAdd.jsx) | 4 nút ghi nhanh; nút ml mặc định ở `ML_PRESETS` |
| [src/components/DayView.jsx](../src/components/DayView.jsx) | Xem từng ngày: chuyển ngày, ô tổng, danh sách, xoá (bấm 2 lần) |
| [src/components/Stats.jsx](../src/components/Stats.jsx) | Biểu đồ + bảng số 7/30 ngày, bấm dòng để mở ngày |
| [src/lib/entries.js](../src/lib/entries.js) | Đọc/ghi/xoá Supabase, gom số liệu theo ngày (`summarizeByDay`) |
| [src/lib/supabase.js](../src/lib/supabase.js) | Tạo kết nối Supabase từ biến `.env` |
| [supabase/schema.sql](../supabase/schema.sql) | Cấu trúc bảng `entries` + quyền RLS |

Dữ liệu chỉ có **1 bảng** `entries`. Mỗi lần ghi là 1 dòng: `type` (`breast` bú mẹ / `breast_bottle` sữa mẹ bình / `formula` / `pump` vắt sữa / `pee` / `poop`), `at` (thời điểm), `duration_min` hoặc `amount_ml`. Tổng theo ngày không lưu riêng mà tính trên trình duyệt theo giờ địa phương.

**Thử tự sửa:** đổi `const ML_PRESETS = [20, 40, 60]` trong `QuickAdd.jsx` thành số khác, chạy `npm run dev` và xem kết quả.

---

## 4. Quy trình sửa tính năng hằng ngày

```bash
npm run dev                 # 1. chạy thử trên máy, sửa code, xem ở localhost:5173
npm run build               # 2. kiểm tra build không lỗi
git add <các file đã sửa>   # 3. commit
git commit -m "Mô tả thay đổi"
git push origin main        # 4. push → Vercel tự build & deploy (~1 phút)
```

5. Trên iPhone: tắt hẳn app (vuốt lên) rồi mở lại để lấy bản mới.
6. Lỗi thì vào Vercel → **Deployments** → bản trước → **Instant Rollback** để quay lại ngay.

Mẹo xem giao diện iPhone trên máy: Chrome → DevTools (F12) → biểu tượng điện thoại → chọn iPhone.

⚠️ `npm run dev` trên máy dùng **chung database thật** với app trên iPhone. Muốn thử thêm/xoá thoải mái thì tạo thêm một project Supabase riêng để test và dùng key của nó trong `.env`.

---

## 5. Vận hành

| Việc | Cách làm |
|---|---|
| Thêm người nhà | Supabase → Authentication → Users → **Add user** (Auto Confirm). Không cần bật đăng ký mới |
| Đổi / quên mật khẩu | Supabase → Users → chọn user → đặt mật khẩu mới |
| Xem / sửa dữ liệu trực tiếp | Supabase → **Table Editor** → `entries` |
| Sao lưu dữ liệu | Table Editor → `entries` → **Export to CSV** (nên làm định kỳ) |
| Supabase bị tạm dừng | Gói free tự dừng sau **7 ngày không ai dùng** → vào dashboard bấm **Restore** |
| Xem lỗi khi deploy | Vercel → Deployments → bấm vào bản deploy → **Build Logs** |
| Quay lại bản cũ | Vercel → Deployments → **Instant Rollback** |
| Đổi tên app | Sửa `index.html`, `manifest.webmanifest`, các thẻ `<h1>`; trên iPhone phải xoá icon và thêm lại |

---

## 6. Bảo mật: 3 điều cần nhớ

1. **Publishable key (`sb_publishable_...`) là công khai.** Nó nằm trong code web, ai mở link cũng thấy được. Không sao, vì:
2. **RLS (Row Level Security)** trong `schema.sql` chỉ cho người **đã đăng nhập** đọc/ghi bảng `entries`.
3. **Tắt đăng ký mới** để chỉ những tài khoản bạn tự tạo mới đăng nhập được. Nếu bật lại, người lạ có thể tự tạo tài khoản rồi đọc/xoá toàn bộ nhật ký.

**Tuyệt đối không** đưa vào code, Vercel hay chat: **secret key** (`sb_secret_...`), **service_role key**, mật khẩu database. Các key này bỏ qua RLS.

---

## 7. Các lỗi đã gặp và cách xử lý

| Hiện tượng | Nguyên nhân | Cách xử lý |
|---|---|---|
| `git push` báo `403 Permission denied to <user khác>` | Máy đăng nhập GitHub bằng tài khoản khác chủ repo | Đăng nhập Git bằng tài khoản chủ repo, hoặc thêm tài khoản kia làm collaborator |
| Không kết nối được Supabase | Dùng nhầm link dashboard | URL đúng dạng `https://<project-id>.supabase.co` |
| Run SQL xong không thấy bảng | Giao diện chưa cập nhật | Tải lại trang, chọn schema `public` |
| App báo "Chưa cấu hình Supabase" trên Vercel | Chưa có biến môi trường, hoặc thêm rồi nhưng chưa build lại | Thêm biến → **Redeploy** |
| Vercel cảnh báo key `VITE_..._KEY` | Vercel đoán là khoá bí mật | Publishable key → **Mark as Safe** |
| Bấm Xoá không có gì xảy ra trên iPhone | `confirm()` không hiện khi app chạy toàn màn hình | Đổi sang bấm 2 lần (Xoá → Xoá?) |
| Supabase "xoá" nhưng dòng vẫn còn, không báo lỗi | RLS chặn thì Supabase chỉ trả về 0 dòng | Dùng `.select()` sau `.delete()` và kiểm tra số dòng |
| Icon / tên app trên iPhone không đổi | iOS chỉ lấy lúc thêm vào màn hình chính | Xoá icon, thêm lại từ Safari |
| Biểu đồ trống lúc vừa mở | Đang chạy hiệu ứng | Chờ 1 giây |

---

## 8. Khái niệm nên học thêm (theo thứ tự)

1. **Git cơ bản**: `status`, `add`, `commit`, `push`, `log`. Đọc lịch sử commit của repo này để xem app lớn lên từng bước.
2. **React**: component, `props`, `useState` (dữ liệu thay đổi), `useEffect` (tải dữ liệu khi mở màn hình). Đọc `DayView.jsx` là đủ ví dụ.
3. **SQL + RLS trong Supabase**: đọc `schema.sql`, rồi thử viết câu `select` trong SQL Editor, ví dụ tổng ml theo ngày.
4. **Biến môi trường và build**: vì sao `VITE_...` phải Redeploy.
5. **CSS cho điện thoại**: flex, grid, `env(safe-area-inset-*)`.

---

## 9. Ý tưởng làm tiếp

- [ ] Ghi bù cho giờ đã qua (chọn giờ khi ghi), sửa mục đã ghi
- [ ] Đồng hồ đếm giờ bú (bấm bắt đầu / dừng)
- [ ] "Cữ bú gần nhất cách đây bao lâu" ở trang chính
- [ ] Xuất CSV ngay trong app
- [ ] Cân nặng / chiều cao, nhiều bé
- [ ] Project Supabase riêng để test
