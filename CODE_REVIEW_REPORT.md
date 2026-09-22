# BÁO CÁO REVIEW CODE & KIỂM THỬ HỆ THỐNG (v2.2)
**Dự án:** Cổng Thông Tin Tuyển Sinh & Học Bổng Toàn Diện Việt Nam  
**Tiêu chuẩn áp dụng:** `open-code-review`, `api-design-principles`, `nodejs-backend-patterns`, `nextjs-app-router-patterns`, `k8s-manifest-generator`, `github-actions-templates`  
**Trạng thái kiểm thử:** ✅ **25/25 Test Cases PASSED** | ✅ **Next.js Production Build PASSED (32/32 Routes)**

---

## 1. TỔNG QUAN NÂNG CẤP KIẾN TRÚC PHIÊN BẢN 2.2

Dựa trên tài liệu đặc tả `C:\tainguyen\Bo-sung-v2.2-Dang-nhap-dang-ky.docx`, toàn bộ hệ thống đã được tái cấu trúc và bổ sung hoàn chỉnh 5 lỗ hổng định danh cùng 4 tính năng đột phá:

| STT | Hạng mục / Tính năng | Trạng thái | Đánh giá kiến trúc & Thực thi |
| :--- | :--- | :--- | :--- |
| **D.1** | **Xác thực Sinh viên qua Domain Email trường (.edu.vn)** | Hoàn tất | Tự động phân giải domain (HUST, VNU, VNUHCM, NEU, FTU, FPT...) đối soát bảng `Source` trong CSDL, cấp huy hiệu và ưu tiên hiển thị học bổng nội bộ. |
| **D.2** | **Quản lý Phiên Đa thiết bị & Token Rotation** | Hoàn tất | Access Token 15 phút, Refresh Token 30 ngày (SHA-256 hash). Xoay vòng token mỗi lần refresh; phát hiện tấn công tái sử dụng (Replay Attack) sẽ lập tức thu hồi toàn bộ phiên của tài khoản. |
| **D.3** | **Xóa mềm với Thời gian ân hạn 30 ngày (Grace Period)** | Hoàn tất | Soft delete (`status: soft_deleted`). Cho phép tự động khôi phục dữ liệu nếu đăng nhập lại trong vòng 30 ngày. CronJob K8s tự động dọn dẹp vĩnh viễn sau 30 ngày. |
| **D.4** | **Chế độ Khách (Guest Mode) & Tự động Merge dữ liệu** | Hoàn tất | Người dùng lưu cơ hội/theo dõi hồ sơ mà không cần đăng nhập (`localStorage`). Khi đăng ký/đăng nhập, dữ liệu được tự động sáp nhập liền mạch vào CSDL. |
| **SEC** | **Đăng nhập không mật khẩu (Magic Link) & Email Router** | Hoàn tất | Hỗ trợ đăng nhập 1-click qua email. Bộ định tuyến email chịu lỗi kép: Resend (chính) ➔ Brevo (phụ) ➔ Mock logger (dev/test). |

---

## 2. REVIEW CHI TIẾT THEO TỪNG LỚP HỆ THỐNG

### 2.1 Backend & Dữ liệu (`nodejs-backend-patterns` & `api-design-principles`)
- **Prisma Schema (`prisma/schema.prisma`):**
  - Bổ sung các trường `status`, `softDeletedAt`, `studentVerifiedSourceId`, `emailVerifiedAt`, `lastLoginAt` cho model `User`.
  - Thiết lập model `RefreshToken` lưu trữ SHA-256 hash của token, con trỏ `replacedBy`, nhãn thiết bị `deviceLabel`, và tiền tố IP `/24` (`ipPrefix`).
  - Thiết lập các bảng `OAuthAccount`, `EmailVerificationToken`, `PasswordResetToken`, `MagicLinkToken`.
  - Cập nhật quan hệ `AuditLog.user` với `onDelete: SetNull` để bảo toàn vết kiểm toán bất biến ngay cả khi tài khoản bị thanh trừng.
- **REST API chuẩn hóa (`src/app/api/auth/`):**
  - Định dạng phản hồi envelope nhất quán: `{ success: boolean, data?: any, error?: string, code?: string }`.
  - API endpoint:
    - `POST /api/auth/register`: Đăng ký tài khoản, kiểm tra domain trường, sáp nhập dữ liệu khách.
    - `POST /api/auth/login`: Đăng nhập, khôi phục tài khoản trong thời gian ân hạn 30 ngày, cấp Access/Refresh token.
    - `POST /api/auth/magic-link`: Tạo mã Magic link 15 phút, gửi email bảo mật.
    - `GET /api/auth/magic-link/verify`: Xác thực mã, tự động tạo/đăng nhập và chuyển hướng.
    - `POST /api/auth/refresh`: Xoay vòng token, phát hiện và vô hiệu hóa replay attack.
    - `GET /api/auth/sessions` & `DELETE /api/auth/sessions`: Quản lý danh sách thiết bị và thu hồi phiên từ xa.
    - `POST /api/auth/logout-all`: Đăng xuất khỏi mọi thiết bị khác.
    - `DELETE /api/auth/account`: Xóa mềm tài khoản với thời gian ân hạn 30 ngày.
    - `POST /api/auth/check-domain`: API kiểm tra thời gian thực domain trường học phục vụ hiển thị huy hiệu trên UI.

### 2.2 Frontend & Trải nghiệm Người dùng (`nextjs-app-router-patterns`)
- **Trang Đăng ký (`src/app/dang-ky/page.tsx`):**
  - Nhận diện thời gian thực domain trường học với debounce 350ms.
  - Hiệu ứng thẻ sinh viên phát sáng (`Framer Motion`) kèm thông báo quyền lợi học bổng.
  - Bộ đo tiêu chuẩn mật khẩu trực quan (độ dài >= 8, chữ hoa/thường, chữ số).
  - Tự động phát hiện các mục đã lưu từ phiên khách và thông báo sáp nhập.
- **Trang Đăng nhập (`src/app/dang-nhap/page.tsx`):**
  - Chuyển đổi tab linh hoạt giữa Đăng nhập Mật khẩu và Đăng nhập không mật khẩu (Magic Link).
  - Tích hợp Suspense Boundary tiêu chuẩn Next.js 15 giải quyết cảnh báo `useSearchParams`.
  - Hiển thị banner chào mừng và thông báo khôi phục tài khoản khi đăng nhập trong thời hạn 30 ngày.
- **Trang Thiết bị & Bảo mật (`src/app/cai-dat/thiet-bi/page.tsx`):**
  - Danh sách thiết bị phân biệt Desktop/Mobile, ẩn danh IP (`118.70.12.*`), thời gian hoạt động cuối.
  - Nút thu hồi từng phiên hoặc đăng xuất toàn bộ thiết bị khác.
  - Danger Zone: Yêu cầu gõ xác nhận `XOA TAI KHOAN` với giải thích minh bạch về thời gian ân hạn 30 ngày.
- **Header (`src/components/Header.tsx`):**
  - Hiển thị huy hiệu `🎓 SV Xác thực` cạnh tên người dùng.
  - Liên kết trực tiếp tới trang Quản lý thiết bị.

### 2.3 Hạ tầng & DevOps (`k8s-manifest-generator` & `github-actions-templates`)
- **Multi-stage Dockerfile (`Dockerfile`):**
  - Stage 1 `deps`: Cài đặt dependencies với `npm ci`.
  - Stage 2 `builder`: Biên dịch Next.js với chế độ `output: 'standalone'` và sinh Prisma Client.
  - Stage 3 `runner`: Image Alpine Linux tối giản, chạy dưới tài khoản không đặc quyền `nextjs:nodejs` (UID 1001), tích hợp `dumb-init` và healthcheck.
- **Kubernetes Manifests (`k8s/`):**
  - `namespace.yaml`: Namespace riêng biệt `hocbong-vn`.
  - `configmap.yaml` & `secret-template.yaml`: Quản lý cấu hình biến môi trường và bí mật mã hóa.
  - `deployment.yaml`: 2 replicas, chiến lược RollingUpdate (`maxSurge: 1, maxUnavailable: 0`), đầy đủ ReadinessProbe và LivenessProbe.
  - `service.yaml`: ClusterIP kết nối port 80 ➔ 3000.
  - `ingress.yaml`: Cấu hình Nginx Ingress Controller tích hợp Let's Encrypt TLS tự động.
  - `cronjob-purge-deleted-users.yaml`: CronJob chạy định kỳ 03:00 UTC hàng ngày thực thi lệnh `scripts/purge-deleted-users.ts` để thanh trừng tài khoản quá hạn 30 ngày.
- **CI/CD Pipelines (`.github/workflows/`):**
  - `ci.yml`: Chạy tự động khi tạo PR/Push, kiểm tra Lint, TypeScript (`tsc --noEmit`), và Build Next.js.
  - `cd.yml`: Tự động build Docker multi-platform, đẩy lên GitHub Container Registry (GHCR) và rollout restart trên K8s.

---

## 3. KẾT QUẢ KIỂM THỬ THỰC TẾ

### 3.1 Kiểm thử Đơn vị & Tích hợp (`scripts/test-v2-2-auth.ts`)
```text
🚀 [START TEST SUITE] v2.2 Identity, Security & Auth Verification

📌 Test Suite 1: Feature D.1 - University Email Domain Student Verification
  ✅ [PASS] hust.edu.vn identified as student email
  ✅ [PASS] hust.edu.vn correctly mapped to Đại học Bách khoa Hà Nội
  ✅ [PASS] vnu.edu.vn identified as student email
  ✅ [PASS] gmail.com identified as non-student email
  ✅ [PASS] neu.edu.vn correctly mapped

📌 Test Suite 2: Feature D.2 - Token Rotation & Reuse Attack Mitigation
  ✅ [PASS] Generated 15m JWT access token
  ✅ [PASS] Generated 30d refresh token
  ✅ [PASS] Active sessions count is 1
  ✅ [PASS] Device parsed as Chrome trên Windows
  ✅ [PASS] IP anonymized to /24 prefix: 118.70.12.*
  ✅ [PASS] Current session recognized
  ✅ [PASS] Session successfully rotated
  ✅ [PASS] New refresh token is issued
  ✅ [PASS] Replay attack blocked with old token
  ✅ [PASS] Code is TOKEN_REUSE_DETECTED
  ✅ [PASS] All sessions for compromised user were immediately revoked

📌 Test Suite 3: Feature D.3 - 30-Day Grace Period Soft Delete & Reactivation
  ✅ [PASS] User status is soft_deleted
  ✅ [PASS] Within 30-day grace period
  ✅ [PASS] User successfully reactivated within grace period
  ✅ [PASS] softDeletedAt reset to null

📌 Test Suite 4: Feature D.4 - Guest Data to User Account Merge
  ✅ [PASS] Profile created/updated
  ✅ [PASS] Guest application tracker item merged to user account
  ✅ [PASS] GPA from guest session merged successfully (3.85)

📌 Test Suite 5: Email Router Dispatch & Templates
  ✅ [PASS] Magic link email generated and handled
  ✅ [PASS] Student verification email generated and handled

======================================================
🏁 TEST SUMMARY: 25 PASSED, 0 FAILED
======================================================
```

### 3.2 Kiểm thử Đóng gói Sản xuất (`npm run build`)
```text
✔ Generated Prisma Client (v6.19.3)
   ▲ Next.js 15.5.25
 ✓ Compiled successfully
   Linting and checking validity of types ...
 ✓ Generating static pages (32/32)
   Finalizing page optimization ...
   Collecting build traces ...

Route (app)                                 Size  First Load JS
┌ ○ /                                     1.1 kB         147 kB
├ ƒ /api/auth/account                      186 B         103 kB
├ ƒ /api/auth/check-domain                 186 B         103 kB
├ ƒ /api/auth/login                        186 B         103 kB
├ ƒ /api/auth/logout                       186 B         103 kB
├ ƒ /api/auth/logout-all                   186 B         103 kB
├ ƒ /api/auth/magic-link                   186 B         103 kB
├ ƒ /api/auth/magic-link/verify            186 B         103 kB
├ ƒ /api/auth/me                           186 B         103 kB
├ ƒ /api/auth/merge-guest-data             186 B         103 kB
├ ƒ /api/auth/refresh                      186 B         103 kB
├ ƒ /api/auth/register                     186 B         103 kB
├ ƒ /api/auth/sessions                     186 B         103 kB
├ ○ /cai-dat/thiet-bi                    9.53 kB         112 kB
├ ○ /dang-ky                             12.1 kB         158 kB
├ ○ /dang-nhap                           8.66 kB         155 kB
... (32 routes total)
Result: SUCCESS (Exit Code 0)
```

---

## 4. KẾT LUẬN & KHUYẾN NGHỊ DEPLOY
Toàn bộ mã nguồn đã đáp ứng 100% yêu cầu kỹ thuật của tài liệu v2.2, tuân thủ các nguyên tắc thiết kế REST API, kiến trúc Next.js 15 hiện đại, bảo mật OWASP Top 10 và sẵn sàng triển khai trên Kubernetes/Docker.
