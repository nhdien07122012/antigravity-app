# 🤖 Project Standard Rules & AI Agent Instructions

Tài liệu này là bộ quy chuẩn kỷ luật bắt buộc dành cho mọi AI Agent và Developer khi làm việc trên dự án này. Mọi hành động chỉnh sửa mã nguồn, cấu trúc dữ liệu hoặc giao diện đều phải tuân thủ nghiêm ngặt các điều khoản dưới đây:

---

## 🛡️ 1. QUY TẮC BẢO TOÀN PHẠM VI & XÁC NHẬN KHI CÓ ẢNH HƯỞNG LIÊN ĐỚI (Scope Preservation & Impact Confirmation - BẮT BUỘC SỐ 1)

> [!CAUTION]
> **ĐIỀU KHOẢN BẤT DI BẤT DỊCH:**
> 1. **Giữ nguyên 100% các chức năng không được đề cập**:
>    - Mỗi khi người dùng yêu cầu thêm mới, sửa lỗi hoặc thay đổi một tính năng/giao diện cụ thể: AI **CHỈ ĐƯỢC PHÉP** can thiệp đúng vào phạm vi được yêu cầu.
>    - Mọi tính năng, màn hình, cấu trúc dữ liệu, luồng tính toán khác KHÔNG được đề cập trong yêu cầu **BẮT BUỘC PHẢI GIỮ NGUYÊN HOÀN TOÀN**. Tuyệt đối không tự ý tái cấu trúc (refactor), xóa bỏ, đổi tên hàm hay thay đổi cách hoạt động vốn có của các phần khác.
> 2. **Bắt buộc dừng lại hỏi ý kiến trước khi làm nếu có tác động liên đới**:
>    - Nếu việc thực hiện yêu cầu bắt buộc phải sửa đổi, can thiệp hoặc có nguy cơ làm ảnh hưởng/lỗi bất kỳ chức năng liên quan nào khác: AI **PHẢI DỪNG LẠI NGAY LẬP TỨC, GIẢI THÍCH RÕ NGUY CƠ VÀ XIN Ý KIẾN NGƯỜI DÙNG** trước khi viết code.
>    - Chỉ được phép tiến hành khi người dùng đã xem xét và đồng ý với phương án tác động liên đới đó.
> 3. **Kiểm tra hồi quy (No Regression)**:
>    - Tuyệt đối không xóa bỏ hay sửa đổi các hàm tiện ích dùng chung (format tiền tệ, định dạng ngày giờ, theme, navigation...) mà các trang hoặc sự kiện khác đang sử dụng.

---

## 📌 2. QUY TẮC NHẬT KÝ THAY ĐỔI (Changelog & Rollback Rule)
- Mọi lần thay đổi (dù lớn hay nhỏ), **BẮT BUỘC** phải cập nhật một mục phiên bản mới lên đầu file `CHANGELOG.md` trước khi commit.
- Mỗi bản ghi trong `CHANGELOG.md` phải có đầy đủ:
  - Số hiệu Phiên bản (Version) & Mã bản dựng (Build Number).
  - Commit SHA.
  - Mục tiêu thay đổi tóm tắt.
  - Chi tiết kỹ thuật các file đã chỉnh sửa.
  - **Lệnh hoàn tác mẫu (`git revert <commit_sha> --no-edit`)** để người dùng có thể rollback lập tức khi cần.

---

## 🏷️ 3. QUY TẮC PHIÊN BẢN GIAO DIỆN (UI Versioning Rule)
- **Khi có thay đổi lớn** (thêm tính năng mới, thay đổi luồng nghiệp vụ quan trọng hoặc cập nhật layout lớn): Tăng version hiển thị trên UI (ví dụ thẻ `<span class="version-tag">` tại Header/Footer) lên 1 chấm nhỏ (vd: `v1.0` ➔ `v1.1`...).
- **Khi là bản vá lỗi nhỏ / CSS hotfix**: Giữ nguyên version tag trên UI, chỉ tăng số hiệu Build version ở file cấu hình nền tảng và ghi chú trong `CHANGELOG.md`.

---

## 🔄 4. QUY TẮC ĐỒNG BỘ ĐA NỀN TẢNG (Platform Sync & Build Rules)
*(Áp dụng cho các dự án Web + Mobile / Capacitor / Cordova / Native)*:
1. **Đồng bộ mã nguồn Web sang Mobile**:
   - Khi chỉnh sửa bất kỳ file Web nào ở thư mục gốc (`.html`, `.js`, `.css`, `assets/`, `src/`), **BẮT BUỘC** đồng bộ bản sao sang thư mục phân phối (ví dụ: `dist/`).
   - Sau khi đồng bộ thư mục phân phối, **BẮT BUỘC** chạy lệnh sync nền tảng (ví dụ: `npx cap sync ios`).
2. **Tự động tăng Build Number**:
   - Khi hoàn tất tính năng hoặc sửa lỗi, tăng số `Build Version` trong các file cấu hình tương ứng của từng nền tảng (ví dụ: `CURRENT_PROJECT_VERSION` trong `project.pbxproj` của iOS, `versionCode` trong `build.gradle` của Android).
3. **An toàn môi trường thực thi (PowerShell / Terminal)**:
   - Khi chạy các script phức tạp hoặc có chuỗi ký tự đặc biệt trên terminal, ưu tiên tạo script tạm thời (`.js` hoặc `.py`), thực thi rồi xóa bỏ để tránh lỗi cú pháp escape chuỗi.

---

## 🎨 5. QUY TẮC THIẾT KẾ GIAO DIỆN PHẲNG & HỆ THỐNG ICON HEROICONS (BẮT BUỘC - KHÔNG DÙNG EMOJI)
- **Tuyệt đối KHÔNG sử dụng icon emoji** trong bất kỳ thành phần giao diện, nút bấm, menu, thanh dock, action sheet, tiêu đề modal, thông báo toast/alert hay nhãn lựa chọn nào của ứng dụng (cả Web UI và Native iOS).
- **Bắt buộc sử dụng hệ thống icon Heroicons chính thức** (`@heroicons/react/24/outline` hoặc `@heroicons/react/24/solid`) cho toàn bộ giao diện Web/React và SF Symbols / Heroicons vector phẳng cho Native iOS.
- **Phong cách thiết kế:** Giao diện phẳng (Flat UI), tối giản, tinh tế, hiện đại chuẩn phong cách Apple iOS 18 và Tailwind CSS; nhãn chữ và biểu tượng phải tách biệt rõ ràng, không ghép emoji vào chuỗi văn bản.
- **Quy tắc vĩnh viễn:** Mọi tính năng phát triển trong tương lai đều phải tuân thủ nguyên tắc này mà không cần hỏi lại người dùng.

---

## 🚀 6. CHECKLIST BẮT BUỘC TRƯỚC KHI BÁO CÁO HOÀN THÀNH
Trước khi thông báo hoàn tất nhiệm vụ cho người dùng, AI phải tự kiểm tra:
- [ ] **Bảo toàn phạm vi**: Tất cả chức năng ngoài yêu cầu đều nguyên vẹn 100%, không bị ảnh hưởng ngoài ý muốn.
- [ ] Nếu có ảnh hưởng liên đới: Đã hỏi ý kiến và được người dùng đồng ý trước khi can thiệp.
- [ ] **Flat UI & Heroicons**: Tuyệt đối không dùng emoji, 100% sử dụng hệ thống icon Heroicons chuẩn.
- [ ] Đã kiểm tra cú pháp, sự kiện DOM, không gây crash ứng dụng.
- [ ] Đã đồng bộ sang thư mục phân phối (`dist/`).
- [ ] Đã chạy lệnh sync nền tảng (`npx cap sync ios`).
- [ ] Đã tăng Build Number ở các file cấu hình nền tảng.
- [ ] Đã ghi đầy đủ nhật ký kỹ thuật vào `CHANGELOG.md`.
- [ ] Đã commit và push mã nguồn sạch sẽ lên Git remote.
