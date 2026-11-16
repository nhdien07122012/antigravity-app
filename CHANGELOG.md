# 📝 Nhật Ký Thay Đổi (CHANGELOG)

Tất cả các thay đổi đáng chú ý của dự án Antigravity Mobile sẽ được ghi nhận tại đây theo chuẩn kỷ luật phần mềm.

---

## [v1.0.0] - Build 4 - 2026-11-16
- **Commit:** `PENDING_COMMIT` (sẽ được gắn SHA ngay sau khi commit)
- **Mục tiêu thay đổi tóm tắt:** Tích hợp cầu nối đồng bộ 100% dữ liệu thực tế từ Antigravity Brain trên máy chủ (`~/.gemini/antigravity/brain/`), hỗ trợ mở trực tiếp phiên Google Remote Control (`3a713708-cef0-49ba-b842-af9504802f6a-v2`) và nạp tự động toàn bộ 17 phiên chat thật cùng lịch sử tin nhắn thực tế.
- **Chi tiết kỹ thuật các file đã chỉnh sửa:**
  - `vite.config.ts`: Bổ sung Vite middleware plugin `antigravity-bridge-plugin` cung cấp 3 API: `/api/server-info`, `/api/real-sessions`, `/api/real-transcript/:id`.
  - `src/services/storage.ts`: Thêm hàm nạp phiên chat thật (`fetchRealServerSessions`) và transcript thật (`fetchRealTranscript`).
  - `src/components/LiveRemoteModal.tsx`: Modal điều khiển phiên Google Remote Control, mở link 1 chạm và đồng bộ máy chủ.
  - `src/components/Header.tsx`: Bổ sung nút truy cập nhanh "Remote Live" kết nối link Google Remote của người dùng.
  - `src/components/QRScannerModal.tsx`: Tự động phân tích link Google AccountChooser và trích xuất session ID `3a713708-cef0-49ba-b842-af9504802f6a-v2`.
  - `src/components/Sidebar.tsx`: Cập nhật menu hiển thị 17 phiên làm việc thực tế trên server.
  - `src/App.tsx`: Tự động đồng bộ tin nhắn thật, thinking thật, tool execution thật từ máy chủ server.
  - `src/version.ts`: Tăng phiên bản bản dựng lên `Build 4`.
  - `ios/App/App.xcodeproj/project.pbxproj`: Đồng bộ `CURRENT_PROJECT_VERSION = 4`.
- **Lệnh hoàn tác mẫu:**
  ```bash
  git revert HEAD --no-edit
  ```

---

## [v1.0.0] - Build 3 - 2026-11-16
- **Commit:** `025c0c0`
- **Mục tiêu thay đổi tóm tắt:** Chuyển đổi toàn diện sang giao diện sáng (Light Theme) tinh tế chuẩn Apple/ChatGPT, tăng kích thước font chữ (15px-16px) và độ tương phản cao giúp dễ đọc trên iPhone và máy tính.
- **Chi tiết kỹ thuật các file đã chỉnh sửa:**
  - `index.html`: Cập nhật class `light` và `theme-color: #ffffff`.
  - `src/index.css`: Nền trắng ngà `#f9fafb`, thanh cuộn sáng, tối ưu font chữ SF Pro Text sắc nét.
  - `src/components/Header.tsx`: Header trắng viền mỏng xám nhạt, độ tương phản cao.
  - `src/components/ChatCanvas.tsx`: Tăng font chữ lên 15px, dãn dòng 28px, chữ màu đen than `#111827` rõ nét.
  - `src/components/InputArea.tsx`: Khung nhập liệu nền sáng, cỡ chữ 16px chống tự động zoom trên Safari iOS.
  - `src/components/Sidebar.tsx`: Menu trượt nền trắng, hiển thị dự án và phiên chat to rõ.
  - `src/components/ThinkingBlock.tsx`: Khối suy nghĩ tông màu vàng ấm nhạt `amber-50`, chữ `amber-950`.
  - `src/components/ToolExecutionCard.tsx`: Thẻ terminal và diff code nền sáng, độ tương phản cao.
  - `src/components/ApprovalBanner.tsx`: Thẻ phê duyệt nổi bật viền đôi vàng cam, nút bấm to rõ ràng.
  - `src/components/SettingsModal.tsx`, `QRScannerModal.tsx`, `WidgetPreviewModal.tsx`, `ArtifactModal.tsx`: Đồng bộ tất cả modal sang theme sáng.
  - `src/version.ts`: Tăng phiên bản bản dựng lên `Build 3`.
  - `ios/App/App.xcodeproj/project.pbxproj`: Đồng bộ `CURRENT_PROJECT_VERSION = 3`.
- **Lệnh hoàn tác mẫu:**
  ```bash
  git revert HEAD --no-edit
  ```

---

## [v1.0.0] - Build 4 - 2026-11-16
- **Commit:** `PENDING_COMMIT` (sẽ được gắn SHA ngay sau khi commit)
- **Mục tiêu thay đổi tóm tắt:** Tích hợp cầu nối đồng bộ 100% dữ liệu thực tế từ Antigravity Brain trên máy chủ (`~/.gemini/antigravity/brain/`), hỗ trợ mở trực tiếp phiên Google Remote Control (`3a713708-cef0-49ba-b842-af9504802f6a-v2`) và nạp tự động toàn bộ 17 phiên chat thật cùng lịch sử tin nhắn thực tế.
- **Chi tiết kỹ thuật các file đã chỉnh sửa:**
  - `vite.config.ts`: Bổ sung Vite middleware plugin `antigravity-bridge-plugin` cung cấp 3 API: `/api/server-info`, `/api/real-sessions`, `/api/real-transcript/:id`.
  - `src/services/storage.ts`: Thêm hàm nạp phiên chat thật (`fetchRealServerSessions`) và transcript thật (`fetchRealTranscript`).
  - `src/components/LiveRemoteModal.tsx`: Modal điều khiển phiên Google Remote Control, mở link 1 chạm và đồng bộ máy chủ.
  - `src/components/Header.tsx`: Bổ sung nút truy cập nhanh "Remote Live" kết nối link Google Remote của người dùng.
  - `src/components/QRScannerModal.tsx`: Tự động phân tích link Google AccountChooser và trích xuất session ID `3a713708-cef0-49ba-b842-af9504802f6a-v2`.
  - `src/components/Sidebar.tsx`: Cập nhật menu hiển thị 17 phiên làm việc thực tế trên server.
  - `src/App.tsx`: Tự động đồng bộ tin nhắn thật, thinking thật, tool execution thật từ máy chủ server.
  - `src/version.ts`: Tăng phiên bản bản dựng lên `Build 4`.
  - `ios/App/App.xcodeproj/project.pbxproj`: Đồng bộ `CURRENT_PROJECT_VERSION = 4`.
- **Lệnh hoàn tác mẫu:**
  ```bash
  git revert HEAD --no-edit
  ```

---

## [v1.0.0] - Build 2 - 2026-11-16
- **Commit:** `4be59a2`
- **Mục tiêu thay đổi tóm tắt:** Khởi tạo kiến trúc dự án Antigravity Mobile (iOS/IPA), tích hợp Remote Control QR Code, Chat Canvas chuẩn ChatGPT/Claude, hệ thống phê duyệt lệnh (Tool Approval Banner), và Module WidgetKit iOS (Swift/SwiftUI).
- **Chi tiết kỹ thuật các file đã chỉnh sửa:**
  - `PROJECT_RULES.md`: Bộ quy chuẩn kỷ luật bắt buộc của dự án.
  - `package.json`, `vite.config.ts`, `tailwind.config.js`: Cấu hình nền tảng React + TypeScript + Tailwind CSS + Capacitor.
  - `src/version.ts`: Khởi tạo thông tin phiên bản giao diện `v1.0.0 (Build 2)`.
  - `src/types/index.ts`: Định nghĩa cấu trúc dữ liệu Host, Session, Message, ToolCall, Project.
  - `src/services/storage.ts`: Lưu trữ trạng thái ngoại tuyến bằng Capacitor Preferences.
  - `src/services/antigravityClient.ts`: Client kết nối WebSocket / Remote Control và bộ mô phỏng suy nghĩ & tool execution.
  - `src/services/widgetBridge.ts`: Kênh đồng bộ trạng thái máy chủ sang iOS App Group (`group.com.antigravity.mobile`).
  - `src/components/Header.tsx`: Header phong cách iOS với thông tin host và nút thao tác nhanh.
  - `src/components/Sidebar.tsx`: Menu trượt chọn dự án/phiên chat, gắn thẻ **UI Version Tag** theo Rule 3.
  - `src/components/ChatCanvas.tsx`: Khung chat thời gian thực với thinking accordion và avatar bot/user.
  - `src/components/ThinkingBlock.tsx`: Hộp suy nghĩ có thể thu gọn/mở rộng kiểu Claude & Gemini 2.0.
  - `src/components/ToolExecutionCard.tsx`: Thẻ hiển thị lệnh terminal, diff code và kết quả đầu ra.
  - `src/components/ApprovalBanner.tsx`: Thẻ phê duyệt thực thi lệnh trực quan (Proceed / Reject).
  - `src/components/InputArea.tsx`: Khung nhập liệu ChatGPT với Slash Command menu (`/`), Voice dictation, Attachments.
  - `src/components/QRScannerModal.tsx`: Trình quét mã QR Camera & tab kết nối thủ công.
  - `src/components/SettingsModal.tsx`: Quản lý cấu hình server, model AI, tool policy và đồng bộ widget.
  - `src/components/WidgetPreviewModal.tsx`: Mô phỏng trực quan Widget màn hình chính iOS (Small, Medium, Lock Screen).
  - `ios/App/AntigravityWidget/`: Mã nguồn native Swift/SwiftUI (`AntigravityWidget.swift`, `WidgetSharedData.swift`) hỗ trợ WidgetKit.
  - `scripts/bump-build.js` & `scripts/sync-ios.js`: Tự động tăng build number và đồng bộ mã nguồn sang native iOS.
  - `.github/workflows/build-ipa.yml`: Workflow tự động biên dịch file `.ipa` trên macOS runner cho Sideloading.
- **Lệnh hoàn tác mẫu:**
  ```bash
  git revert 4be59a2 --no-edit
  ```
