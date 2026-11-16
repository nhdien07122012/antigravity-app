# 📝 Nhật Ký Thay Đổi (CHANGELOG)

Tất cả các thay đổi đáng chú ý của dự án Antigravity Mobile sẽ được ghi nhận tại đây theo chuẩn kỷ luật phần mềm.

---

## [v1.0.0] - Build 11 - 2026-11-16
- **Commit:** `9bfa618`
- **Mục tiêu thay đổi tóm tắt:** Chuyển đổi toàn diện dự án (Strategic Pivot) thành **Bộ Chứa Đa Dự Án Native Cho Google Antigravity Remote** trên iOS (.ipa); tích hợp Camera QR Scanner & Link Importer; áp dụng cơ chế Zero-Reload Keep-Alive Frame Engine duy trì đồng thời nhiều phiên dự án trong RAM không cần tải lại và không ngắt kết nối WebSocket/WebRTC; dọn sạch toàn bộ mã nguồn mô phỏng cũ.
- **Chi tiết kỹ thuật các file đã chỉnh sửa:**
  - `src/types/index.ts`: Tái cấu trúc hoàn toàn định nghĩa kiểu dữ liệu `RemoteWorkspace` và `AppSettings`.
  - `src/services/workspaceStore.ts`: Xây dựng module lưu trữ dữ liệu liên tục với `@capacitor/preferences`, bộ giải mã thông minh URL kết nối Google Remote trích xuất `sessionId` và `Email`.
  - `src/components/KeepAliveContainer.tsx`: Động cơ giữ phiên hoạt động trong bộ nhớ RAM, ẩn hiện bằng CSS state giúp chuyển đổi giữa các dự án tức thì 0ms, bảo toàn vị trí cuộn và trạng thái luồng chat WebSocket với Google Cloud.
  - `src/components/FloatingDock.tsx`: Thanh công cụ nổi chuẩn giao diện iOS Glassmorphism, chuyển đổi tab mượt mà, hỗ trợ thêm dự án mới, ẩn toàn màn hình và mở cài đặt.
  - `src/components/CameraQRScanner.tsx`: Máy quét mã QR trực tiếp qua camera sau của iPhone (`html5-qrcode`), hiệu ứng rung Haptics (`@capacitor/haptics`), tự động điền và ghép nối nhanh bằng clipboard.
  - `src/components/ManageWorkspacesModal.tsx`: Hộp thoại quản lý đa dự án, đổi tên phiên làm việc, xóa tab, mở tab ngoài Safari.
  - `src/components/SettingsModal.tsx`: Hộp thoại cấu hình email Google mặc định, kích hoạt Zero-Reload Keep-Alive, và rung phản hồi.
  - `src/App.tsx`: Tái lập trình file gốc ứng dụng thành bộ chứa đa dự án tối giản, tốc độ cao.
  - Dọn dẹp triệt để 14 tệp thành phần mô phỏng cũ không còn sử dụng (`ApprovalBanner`, `ArtifactModal`, `ChatCanvas`, `Header`, `InputArea`, `LiveRemoteModal`, `QRScannerModal`, `Sidebar`, `ThinkingBlock`, `ToolExecutionCard`, `WidgetPreviewModal`, `antigravityClient`, `storage`, `widgetBridge`).
  - `scripts/sync-ios.js`: Tối ưu hóa chu trình build: tăng version trước -> build web bundle -> sync native iOS.
  - `src/version.ts`: Tăng số hiệu bản dựng lên `Build 11` (`v1.0.0 (Build 11)`).
  - `ios/App/App.xcodeproj/project.pbxproj`: Đồng bộ `CURRENT_PROJECT_VERSION = 11`.
- **Lệnh hoàn tác mẫu:**
  ```bash
  git revert 9bfa618 --no-edit
  ```

---

## [v1.0.0] - Build 10 - 2026-11-16
- **Commit:** `25b4681`
- **Mục tiêu thay đổi tóm tắt:** Kích hoạt cơ chế Real-time Live Synchronization tự động đồng bộ tức thì các tin nhắn, khối tư duy (*thinking*), và công cụ (*tool execution*) giữa phiên làm việc Google Remote Control / Antigravity host và ứng dụng di động; bổ sung huy hiệu trạng thái `● Realtime Live` tại Header.
- **Chi tiết kỹ thuật các file đã chỉnh sửa:**
  - `src/App.tsx`: Tích hợp bộ lắng nghe `useEffect` đồng bộ thời gian thực chu kỳ 2 giây trực tiếp từ `transcript.jsonl` của phiên đang mở; tự động phát hiện tin nhắn mới gửi từ Google Remote web / desktop và cập nhật vào `currentSession`; tích hợp chu kỳ 8 giây tự động quét phát hiện các phiên chat mới.
  - `src/components/Header.tsx`: Bổ sung huy hiệu động `● Realtime Live` viền xanh ngọc báo hiệu trạng thái kết nối trực tiếp với Google Remote session.
  - `src/version.ts`: Tăng số hiệu bản dựng lên `Build 10` (`v1.0.0 (Build 10)`).
  - `ios/App/App.xcodeproj/project.pbxproj`: Đồng bộ `CURRENT_PROJECT_VERSION = 10`.
- **Lệnh hoàn tác mẫu:**
  ```bash
  git revert 25b4681 --no-edit
  ```

---

## [v1.0.0] - Build 9 - 2026-11-16
- **Commit:** `d5a0f7d`
- **Mục tiêu thay đổi tóm tắt:** Đồng bộ 100% tính năng phân loại hội thoại theo từng Project giữa Mobile (.ipa) và Windows (Web), giải quyết triệt để lỗi mất kết nối host trên native iOS qua bộ cấu hình Server URL động, hỗ trợ phân nhóm Accordion Project Folders, tìm kiếm hội thoại, và cấp phép Apple App Transport Security (ATS).
- **Chi tiết kỹ thuật các file đã chỉnh sửa:**
  - `src/services/storage.ts`: Xây dựng hàm `getServerBaseUrl()` tự động chuyển tiếp API call sang máy tính server (`http://192.168.1.4:5173` hoặc Tailscale) khi app chạy trong môi trường Native Capacitor iOS (`capacitor://` / `ionic://`); hỗ trợ lưu và lấy URL server từ Preferences.
  - `src/components/Sidebar.tsx`: Nâng cấp giao diện hiển thị hội thoại: hỗ trợ xem theo từng dự án hoặc xem toàn bộ gom nhóm trực quan theo từng Folder Dự án (Accordion Grouping) chuẩn Antigravity Windows; thêm thanh tìm kiếm hội thoại thời gian thực; thêm nút đồng bộ dữ liệu tức thì từ host.
  - `src/components/SettingsModal.tsx`: Tích hợp bảng cấu hình Host Server URL với các nút bấm nhanh 1 chạm (Wi-Fi, Tailscale, Localhost) và công cụ Ping Test đo độ trễ mạng trực tiếp từ điện thoại.
  - `src/components/Header.tsx`: Bổ sung tương tác chạm trực tiếp vào tên dự án ở giữa header để mở nhanh menu dự án/hội thoại.
  - `ios/App/App/Info.plist`: Cấp phép `NSAppTransportSecurity` (`NSAllowsArbitraryLoads`, `NSAllowsLocalNetworking`) cho phép app native iOS giao tiếp qua mạng LAN/Wi-Fi với PC host.
  - `capacitor.config.ts`: Kích hoạt `server.cleartext: true` cho Capacitor WebView.
  - `vite.config.ts`: Xử lý HTTP OPTIONS preflight request cho toàn bộ API cầu nối; kích hoạt `server.cors: true`.
  - `src/types/index.ts`: Bổ sung trường `projectName` vào giao diện `Session`.
  - `src/version.ts`: Tăng số hiệu bản dựng lên `Build 9` (`v1.0.0 (Build 9)`).
  - `ios/App/App.xcodeproj/project.pbxproj`: Đồng bộ `CURRENT_PROJECT_VERSION = 9`.
- **Lệnh hoàn tác mẫu:**
  ```bash
  git revert d5a0f7d --no-edit
  ```

---

## [v1.0.0] - Build 8 - 2026-11-16
- **Commit:** `4dbfd5b`
- **Mục tiêu thay đổi tóm tắt:** Khắc phục lỗi GitHub Actions `The configuration 'macos-14-arm64-us-x1' is not supported` bằng cách nâng cấp runner lên `macos-15`, tích hợp cấu hình shared scheme `App.xcscheme` chuẩn Xcode cho xcodebuild, và đồng bộ tự động `pod install`.
- **Chi tiết kỹ thuật các file đã chỉnh sửa:**
  - `.github/workflows/build-ipa.yml`: Chuyển đổi môi trường runner từ `macos-14` (đã bị GitHub khai tử) sang `macos-15` (macOS Sequoia ổn định nhất với Xcode 16 pre-installed); thêm lệnh `cd ios/App && pod install` đảm bảo CocoaPods native dependencies; thiết lập đích đến `generic/platform=iOS` cho xcodebuild archive.
  - `ios/App/App.xcodeproj/xcshareddata/xcschemes/App.xcscheme`: Tạo tệp cấu hình Scheme dùng chung cho Xcode và xcodebuild trên CI.
  - `src/version.ts`: Tăng số hiệu bản dựng lên `Build 8` (`v1.0.0 (Build 8)`).
  - `ios/App/App.xcodeproj/project.pbxproj`: Đồng bộ `CURRENT_PROJECT_VERSION = 8`.
- **Lệnh hoàn tác mẫu:**
  ```bash
  git revert 4dbfd5b --no-edit
  ```

---

## [v1.0.0] - Build 7 - 2026-11-16
- **Commit:** `46121fe`
- **Mục tiêu thay đổi tóm tắt:** Thiết lập quy trình tự động build file `.ipa` qua GitHub Actions tạo GitHub Release với link tải trực tiếp; bổ sung icon PWA và Web App Manifest cho trải nghiệm native tức thì trên Safari iOS.
- **Chi tiết kỹ thuật các file đã chỉnh sửa:**
  - `.github/workflows/build-ipa.yml`: Bổ sung quyền ghi (`permissions: contents: write`), tích hợp `softprops/action-gh-release@v2` tự động xuất bản gói `AntigravityMobile.ipa` lên GitHub Release và cấp link tải trực tiếp công khai cho iPhone.
  - `public/manifest.json`: Tạo file Web App Manifest chuẩn PWA (standalone mode, theme color, icons).
  - `public/logo.svg`: Tạo biểu tượng logo Antigravity vector sắc nét phục vụ icon app.
  - `index.html`: Khai báo `apple-touch-icon` và link tới `manifest.json`.
  - `src/version.ts`: Tăng số hiệu bản dựng lên `Build 7` (`v1.0.0 (Build 7)`).
  - `ios/App/App.xcodeproj/project.pbxproj`: Đồng bộ `CURRENT_PROJECT_VERSION = 7`.
- **Lệnh hoàn tác mẫu:**
  ```bash
  git revert 46121fe --no-edit
  ```

---

## [v1.0.0] - Build 6 - 2026-11-16
- **Commit:** `c0c55b2`
- **Mục tiêu thay đổi tóm tắt:** Khắc phục triệt để phản hồi tin nhắn giả định (mock canned response), kết nối phản hồi thông minh thời gian thực từ máy chủ (`/api/chat`), hỗ trợ thực thi trực tiếp lệnh terminal qua cú pháp `run <cmd>`, và phân loại tự động danh sách cuộc hội thoại theo từng Project thực tế trên máy tính host.
- **Chi tiết kỹ thuật các file đã chỉnh sửa:**
  - `vite.config.ts`: Bổ sung API `POST /api/chat` xử lý tin nhắn tương tác thực tế từ app mobile, trả lời thông minh dựa trên bối cảnh dự án đang mở và hỗ trợ thực thi lệnh dòng lệnh an toàn trên máy chủ (`run_command`); bổ sung hàm `getProjectList()` đọc danh sách dự án thật từ `~/.gemini/config/projects/`.
  - `src/services/antigravityClient.ts`: Loại bỏ hoàn toàn chuỗi văn bản mẫu cứng (`Tôi đã xử lý yêu cầu...`); chuyển hướng toàn bộ tin nhắn chat người dùng gọi qua `storage.sendChatMessage` gửi tới `/api/chat` trên máy chủ.
  - `src/services/storage.ts`: Thêm `fetchRealProjects()` lấy danh mục dự án thật từ host; cập nhật `fetchRealServerSessions(projectId)` lọc danh sách hội thoại theo từng dự án cụ thể; thêm `sendChatMessage(prompt, projectId, projectName)` gọi bridge API.
  - `src/components/Sidebar.tsx`: Cập nhật bộ chọn Project Dropdown hiển thị đầy đủ tên các dự án thật kèm số lượng hội thoại của từng dự án (badge đếm số session); chọn dự án sẽ lọc ngay các hội thoại thuộc dự án đó.
  - `src/App.tsx`: Nạp danh mục project thật khi khởi động app; truyền bối cảnh `activeProjectId` và `projectName` khi gửi tin nhắn chat; cập nhật danh sách hội thoại tương ứng khi chuyển đổi dự án.
  - `src/version.ts`: Tăng số hiệu bản dựng lên `Build 6` (`v1.0.0 (Build 6)`).
  - `ios/App/App.xcodeproj/project.pbxproj`: Đồng bộ `CURRENT_PROJECT_VERSION = 6`.
- **Lệnh hoàn tác mẫu:**
  ```bash
  git revert c0c55b2 --no-edit
  ```

---

## [v1.0.0] - Build 4 - 2026-11-16
- **Commit:** `d4d5d90`
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
- **Commit:** `d4d5d90`
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
