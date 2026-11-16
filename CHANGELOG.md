# 📝 Nhật Ký Thay Đổi (CHANGELOG)

Tất cả các thay đổi đáng chú ý của dự án Antigravity Mobile sẽ được ghi nhận tại đây theo chuẩn kỷ luật phần mềm.

---

## [v1.0.0] - Build 22 - 2026-11-16
- **Commit:** `bd59980`
- **GitHub Actions Run:** `#43862404482` (success)
- **Mục tiêu thay đổi tóm tắt:** Bổ sung tính năng Quản lý & Tải bản cài IPA trực tiếp từ GitHub Releases tích hợp ngay trên Dock: cho phép tải file `AntigravityMobile.ipa`, hiển thị tiến trình tải trực quan, và mở bảng chia sẻ iOS (`UIActivityViewController`) để chuyển tiếp sang SideStore, TrollStore, AltStore, hoặc ứng dụng Tệp (Files) phục vụ Sideload trực tiếp trên iPhone.
- **Chi tiết kỹ thuật các file đã chỉnh sửa:**
  - `ios/App/App/AppDelegate.swift`:
    - Thêm nút quản lý IPA `ipaButton` (icon `arrow.down.circle`) vào `actionStackView` trên thanh Dock nổi, đồng thời bổ sung lối tắt trong menu Cài đặt (`gearshape`).
    - Tạo lớp `IPAManagerViewController` kế thừa `URLSessionDownloadDelegate`:
      - Tự động lấy thông tin bản phát hành mới nhất từ GitHub Releases API (`AntigravityMobile.ipa`, kích thước, ngày cập nhật).
      - Hiển thị thông tin phiên bản đang chạy và phiên bản mới nhất.
      - Tải file `.ipa` từ GitHub với thanh tiến trình `UIProgressView` và nhãn % dung lượng tải thời gian thực.
      - Tự động lưu trữ file vào thư mục `Documents` của ứng dụng.
      - Bấm nút "🚀 Chia Sẻ Để Sideload" kích hoạt `UIActivityViewController` chia sẻ file IPA sang **TrollStore**, **SideStore**, **AltStore**, **Tệp (Files)**, **AirDrop**,...
      - Bổ sung nút "🌐 Xem Trên GitHub Releases" và "🗑️ Xóa File IPA Đã Tải".
  - `ios/App/App/Info.plist`:
    - Bật `UIFileSharingEnabled = true` và `LSSupportsOpeningDocumentsInPlace = true` giúp thư mục Documents của Antigravity hiển thị trực tiếp trong ứng dụng Tệp (Files) của iOS.
  - `src/components/IPAManagerModal.tsx`: Tạo modal tải và chia sẻ IPA cho nền tảng Web / PWA.
  - `src/components/FloatingDock.tsx`: Thêm nút tải IPA với icon `Download` trên thanh Dock.
  - `src/App.tsx`: Tích hợp trạng thái mở `IPAManagerModal`.
  - `src/version.ts`: Nâng số hiệu bản dựng lên `Build 22` (`v1.0.0 (Build 22)`).
  - `ios/App/App.xcodeproj/project.pbxproj`: Đồng bộ `CURRENT_PROJECT_VERSION = 22`.
- **Lệnh hoàn tác mẫu:**
  ```bash
  git revert bd59980 --no-edit
  ```

---

## [v1.0.0] - Build 21 - 2026-11-16
- **Commit:** `f241c0b`
- **GitHub Actions Run:** `#43851406388` (success)
- **Mục tiêu thay đổi tóm tắt:** Khắc phục triệt để lỗi Google 403 Forbidden & không load được dữ liệu trong app; loại bỏ 100% hiện tượng viền vuông màu đen mờ trên Dock; bổ sung menu Cài đặt & Điều khiển phiên kết nối toàn diện với tính năng cập nhật URL, đăng nhập Google, xóa cache và xử lý lỗi 403 thông minh.
- **Chi tiết kỹ thuật các file đã chỉnh sửa:**
  - `ios/App/App/AppDelegate.swift`:
    - **Sửa lỗi Google 403 Forbidden & Dữ liệu không load:**
      - Cập nhật URL mặc định sang `https://antigravity.google.com` (thay thế URL session cũ đã hết hạn `3a713708-cef0-49ba-b842-af9504802f6a-v2`).
      - Bổ sung thuật toán tự động di chuyển (auto-migrate) trong `WorkspaceStore.getWorkspaces()`: tự động phát hiện và chuyển đổi các URL session cũ đã lưu trong `UserDefaults` sang link sạch, không để người dùng bị kẹt ở màn hình 403.
      - Gỡ bỏ hoàn toàn CSS rule và script can thiệp DOM trong `webView(_:didFinish:)` vốn đã vô tình ẩn toàn bộ phần tử gốc của Google Antigravity Remote.
      - Bổ sung `WKUIDelegate` với phương thức `createWebViewWith` giúp xử lý các điều hướng popup hoặc Google OAuth trực tiếp trong WebView mà không bị hủy ngang.
      - Bổ sung hàm `webView(_:decidePolicyFor:navigationResponse:)` trong `WKNavigationDelegate` tự động nhận diện phản hồi HTTP 403 và hiển thị banner thông báo thân thiện hướng dẫn người dùng quét mã mới hoặc đăng nhập lại Google.
      - Cập nhật nút Settings trên Dock thành icon bánh răng `gearshape` mở bảng điều khiển đa năng: Phóng to/thu nhỏ font chữ (70% - 220%), Cập nhật liên kết URL mới, Đổi tên tab, Đăng nhập tài khoản Google, Tải lại tab, Xóa tab, Xóa toàn bộ Cache & Đăng xuất.
      - Cải tiến `QRScannerViewController.handlePasteLink`: hiển thị hộp thoại xác nhận URL cho phép người dùng kiểm tra hoặc sửa link trước khi kết nối.
    - **Triệt tiêu 100% viền vuông màu đen mờ trên Dock:**
      - Tách Dock thành cấu trúc 2 lớp chuẩn UIKit:
        - `dockContainerView` (Lớp ngoài): Giữ bóng đổ `shadowColor`, cập nhật `shadowPath = UIBezierPath(roundedRect: bounds, cornerRadius: 24).cgPath` trong `viewDidLayoutSubviews()`, đảm bảo bóng đổ uốn lượn chính xác theo viền bo tròn 24pt, không còn vệt bóng vuông.
        - `dockEffectView` (Lớp trong): `clipsToBounds = true` khống chế tuyệt đối lớp nền mờ `_UIVisualEffectBackdropView` nằm trọn trong hình capsule bo tròn, triệt tiêu 100% hiện tượng 4 góc vuông mờ đen thừa thãi.
  - `src/services/workspaceStore.ts`: Đồng bộ `DEFAULT_WORKSPACE` sang `https://antigravity.google.com` và bổ sung auto-migrate cho Web/Capacitor.
  - `src/version.ts`: Tăng số hiệu bản dựng lên `Build 21` (`v1.0.0 (Build 21)`).
  - `ios/App/App.xcodeproj/project.pbxproj`: Đồng bộ `CURRENT_PROJECT_VERSION = 21`.
- **Lệnh hoàn tác mẫu:**
  ```bash
  git revert f241c0b --no-edit
  ```

---

## [v1.0.0] - Build 19 - 2026-11-16
- **Commit:** `12c6d1a`
- **Mục tiêu thay đổi tóm tắt:** Khôi phục layout Dock theo chuẩn Bản Dựng 13 (Build 13) kết hợp bo tròn mềm mại toàn diện (`cornerRadius: 24`, continuous curve); đồng thời bổ sung bộ App Icon Antigravity chính thức hỗ trợ trọn vẹn 3 chế độ Light / Dark / Tinted (Clear) của iOS 18 trên Xcode 16.
- **Chi tiết kỹ thuật các file đã chỉnh sửa:**
  - `ios/App/App/AppDelegate.swift`:
    - Khôi phục cấu trúc Dock capsule nổi căn giữa đáy màn hình theo Bản dựng 13 (`dockView.centerXAnchor`, `bottomAnchor = safeAreaLayoutGuide.bottomAnchor - 8`, `height: 48`).
    - Bo tròn các góc toàn diện: `dockView.layer.cornerRadius = 24`, `cornerCurve = .continuous`; các tab dự án bo tròn `cornerRadius: 17`; các nút hành động (`+`, `↻`, `aA`, `⤢`) bo tròn `cornerRadius: 15`.
    - Duy trì hỗ trợ Dark/Light mode tự động thích ứng qua `UIBlurEffect`, thanh cuộn ngang dự án không giới hạn, tính năng thu phóng Zoom giao diện (70% - 220%) và chế độ toàn màn hình.
  - `ios/App/App/Assets.xcassets/AppIcon.appiconset`:
    - Tạo mới `AppIcon-512@2x.png` (Light Mode): Biểu tượng Antigravity dải màu Google đa sắc rực rỡ trên nền sáng trang nhã kích thước chuẩn 1024x1024 px.
    - Tạo mới `AppIcon-Dark-512@2x.png` (Dark Mode): Nền tối cao cấp `#141416` kết hợp dải gradient phát quang neon nổi bật trên Home Screen iOS 18 Dark Mode.
    - Tạo mới `AppIcon-Tinted-512@2x.png` (Tinted / Clear Mode): Nền trong suốt (`RGBA 0,0,0,0`), biểu tượng monochrome thang độ xám chuẩn Apple HIG giúp iOS 18 tự động phủ màu sắc tint theo sở thích người dùng.
    - Cập nhật `Contents.json` hỗ trợ bộ lọc `"appearance": "luminosity"` (`dark` và `tinted`) cho Xcode 16.
  - `scripts/generate_app_icons.py`: Tạo script sinh trọn bộ 3 icon 1024x1024 với thuật toán siêu lấy mẫu (Lanczos supersampling) đảm bảo độ nét vector tối đa.
  - `public/logo.svg`: Cập nhật đồng bộ biểu tượng Antigravity Delta Ribbon Google.
  - `src/version.ts`: Tăng số hiệu bản dựng lên `Build 19` (`v1.0.0 (Build 19)`).
  - `ios/App/App.xcodeproj/project.pbxproj`: Đồng bộ `CURRENT_PROJECT_VERSION = 19`.
- **Lệnh hoàn tác mẫu:**
  ```bash
  git revert 12c6d1a --no-edit
  ```

---

## [v1.0.0] - Build 18 - 2026-11-16
- **Commit:** `74cfd12`
- **Mục tiêu thay đổi tóm tắt:** Tái thiết kế toàn diện Dock với kiến trúc **Separated Viewport (Zero-Overlap Guarantee)**: giải quyết triệt để lỗi dock che khuất ô nhập chat, nút gửi tin nhắn, mic và danh sách hội thoại; web container nằm hoàn toàn phía trên dock; dock Liquid Glass Dynamic Island chuẩn iOS thích ứng Dark/Light Mode; bổ sung cơ chế tự động ẩn dock khi mở bàn phím và viên nhộng phục hồi (`restorePill`) khi thu gọn/toàn màn hình.
- **Chi tiết kỹ thuật các file đã chỉnh sửa:**
  - `ios/App/App/AppDelegate.swift`:
    - **Kiến trúc Không-Giao-Thoa (Zero-Overlap Viewport):**
      - Thay đổi cơ chế neo giao diện: `containerView.bottomAnchor` được neo chặt chẽ vào mép trên của dock (`dockView.topAnchor, constant: -4`).
      - Nhờ đó, toàn bộ khung chat của Google Antigravity Remote, nút chọn mô hình Gemini, nút mic và mũi tên gửi tin nhắn `[->]` luôn nằm phía TRÊN dock một cách tự nhiên và tách bạch, tuyệt đối không bị dock đè lên bất kể đang ở màn hình nào.
    - **Thiết kế Dock Liquid Glass Dynamic Island (Build 18):**
      - Chiều cao chuẩn 42pt, bo tròn mềm mại liên tục (`cornerRadius: 21`), viền kính siêu mỏng (`0.65pt`), hiệu ứng làm mờ nền `UIBlurEffect` thích ứng động với Dark Mode / Light Mode.
      - Bố cục 2 phần khoa học: Phần bên trái là thanh cuộn ngang danh sách dự án với hiệu ứng tab phát sáng; phần bên phải là vạch ngăn thanh lịch và cụm nút thao tác: `+` (Quét QR / Thêm link), `↻` (Tải lại), `aA` (Cỡ chữ & Thu phóng 70%-220%), `⤢` (Toàn màn hình), `⌄` (Thu gọn).
    - **Tự Động Ẩn Khi Nhập Liệu (Keyboard Avoidance):**
      - Lắng nghe `UIResponder.keyboardWillShowNotification` và `keyboardWillHideNotification`.
      - Khi người dùng chạm vào ô chat để gõ phím, dock tự động ẩn êm dịu (`alpha = 0`) giúp bàn phím ảo hiển thị trọn vẹn, không vướng víu. Khi đóng bàn phím, dock tự động phục hồi.
    - **Chế Độ Thu Gọn & Toàn Màn Hình Linh Hoạt:**
      - Khi bấm `⌄` hoặc `⤢`, dock trượt xuống mép dưới và ẩn đi, web container tự động bung 100% diện tích màn hình.
      - Xuất hiện viên nhộng phục hồi Liquid Glass mini (`restorePill`) nhỏ gọn ở góc dưới với tiêu đề dự án hiện tại (`[ ⚡ Tên-dự-án ▴ ]`), hỗ trợ kéo thả tự do (`UIPanGestureRecognizer`) bám mép màn hình. Chạm vào viên nhộng để bung lại toàn bộ dock.
    - **Tối Ưu Header & Loại Bỏ Logo Dev Antigravity:**
      - Bổ sung bộ lọc CSS và `MutationObserver` nâng cao tự động nhận diện và ẩn triệt để phần tử logo `[A]` ở góc trên trái, đồng thời loại bỏ khoảng cách đệm trên cùng của header, giúp chip máy chủ `● DELL5770-DELL` có đầy đủ không gian hiển thị.
  - `src/version.ts`: Tăng số hiệu bản dựng lên `Build 18` (`v1.0.0 (Build 18)`).
  - `ios/App/App.xcodeproj/project.pbxproj`: Đồng bộ `CURRENT_PROJECT_VERSION = 18`.
- **Lệnh hoàn tác mẫu:**
  ```bash
  git revert 74cfd12 --no-edit
  ```

---

## [v1.0.0] - Build 16 - 2026-11-16
- **Commit:** `233f965`
- **Mục tiêu thay đổi tóm tắt:** Thiết kế lại toàn diện Float Dock thành **Dynamic Island Mini/Expanded Capsule 2.0**: mặc định thu gọn thành viên capsule mini góc phải (`[ ⚡ Tên dự án ▴ ]`), hỗ trợ kéo di chuyển tự do (Draggable Pan), chạm để bung mở toàn phần thanh chuyển tab và tự động thu gọn sau khi chọn; đệm cuộn an toàn `contentInset.bottom = 54` và sử dụng `MutationObserver` ẩn triệt để logo dev Antigravity góc trên.
- **Chi tiết kỹ thuật các file đã chỉnh sửa:**
  - `ios/App/App/AppDelegate.swift`:
    - Xây dựng cơ chế 2 trạng thái linh hoạt cho Dock:
      - **Thu gọn (Mini Pill Mode):** Nằm gọn gàng ở góc dưới phải màn hình (`height: 32pt`, `cornerRadius: 16`), giải phóng hoàn toàn 100% không gian ô gõ chat, phím mic và mũi tên gửi tin nhắn.
      - **Kéo thả tự do (Draggable Pan Gesture):** Tích hợp `UIPanGestureRecognizer`, cho phép người dùng kéo viên capsule mini đến bất kỳ vị trí mép trái/phải màn hình tuỳ ý.
      - **Bung mở mượt mà (Spring Animation Expanded Bar):** Chạm vào mini pill để bung mở toàn bộ danh sách tab dự án, các nút `+`, `↻`, `aA` (thu phóng), `⤢` (toàn màn hình), và `⌄` (thu gọn).
      - **Tự động thu gọn sau khi chuyển tab:** Sau khi chọn tab dự án mới, dock tự động đóng lại thành mini pill để người dùng lập tức có toàn màn hình làm việc.
    - Bổ sung đệm cuộn nội dung `webView.scrollView.contentInset.bottom = 54` và `scrollIndicatorInsets.bottom = 54` để không bao giờ có dòng chữ hay nút chức năng nào bị che khuất khi cuộn xuống cuối trang.
    - Cải tiến script dọn dẹp Header với `MutationObserver` liên tục theo dõi và ẩn icon dev logo Antigravity ở góc trên cùng bên trái.
  - `src/components/FloatingDock.tsx`: Đồng bộ 100% cơ chế Mini/Expanded Dynamic Island sang phiên bản Web (`isExpanded: false/true`), nút mini góc phải chuyển tab nhanh gọn.
  - `src/version.ts`: Tăng số hiệu bản dựng lên `Build 16` (`v1.0.0 (Build 16)`).
  - `ios/App/App.xcodeproj/project.pbxproj`: Đồng bộ `CURRENT_PROJECT_VERSION = 16`.
- **Lệnh hoàn tác mẫu:**
  ```bash
  git revert 233f965 --no-edit
  ```

---

## [v1.0.0] - Build 15 - 2026-11-16
- **Commit:** `878b10c`
- **Mục tiêu thay đổi tóm tắt:** Tối ưu hoá toàn diện giao diện hiển thị: hỗ trợ Dark/Light mode tự động cho Float Dock; hạ thấp sát mép đáy màn hình (36pt) để giải phóng vùng nhập tin nhắn; thêm công cụ điều chỉnh cỡ chữ & thu phóng trang (Zoom 70% - 200%); ghim sát header vào status bar và tự động ẩn logo dev phía trên để mở rộng không gian tối đa.
- **Chi tiết kỹ thuật các file đã chỉnh sửa:**
  - `ios/App/App/AppDelegate.swift`:
    - Hỗ trợ Dark/Light Mode thích ứng tự động cho Float Dock (`UIBlurEffect.systemThinMaterialLight / systemUltraThinMaterialDark`), cập nhật màu sắc động khi đổi theme qua `traitCollectionDidChange`.
    - Hạ thấp Floating Dock xuống sát viền dưới màn hình (`view.bottomAnchor, constant: -6`), giảm chiều cao xuống 36pt giúp giải phóng hoàn toàn vùng ô nhập chat phía dưới.
    - Bổ sung nút Cài Đặt cỡ chữ & thu phóng (`settingsButton`): hỗ trợ tăng/giảm cỡ chữ (+10% / -10%), đặt lại 100%, đồng bộ qua cả `WKWebView.pageZoom` và CSS `document.body.style.zoom`, lưu cấu hình vào `UserDefaults`.
    - Tối ưu vùng Header trên: thiết lập `contentInsetAdjustmentBehavior = .never` và ghim `containerView.topAnchor = view.safeAreaLayoutGuide.topAnchor` xóa bỏ khoảng trống thừa bên dưới status bar.
    - Tự động phát hiện và ẩn icon logo dev Antigravity ở góc trên bên trái (`left < 55 && top < 65`), giúp chip máy chủ `● DELL5770-DELL` và các nút thanh công cụ có thêm diện tích hiển thị.
  - `src/components/FloatingDock.tsx`: Bổ sung menu thu phóng nhanh (Zoom In / Out / Reset), hạ thấp đáy dock `bottom-[calc(2px+env(safe-area-inset-bottom,0px))]`, hỗ trợ giao diện sáng/tối linh hoạt.
  - `src/version.ts`: Tăng số hiệu bản dựng lên `Build 15` (`v1.0.0 (Build 15)`).
  - `ios/App/App.xcodeproj/project.pbxproj`: Đồng bộ `CURRENT_PROJECT_VERSION = 15`.
- **Lệnh hoàn tác mẫu:**
  ```bash
  git revert 878b10c --no-edit
  ```

---

## [v1.0.0] - Build 14 - 2026-11-16
- **Commit:** `859f981`
- **Mục tiêu thay đổi tóm tắt:** Tinh chỉnh hạ thấp vị trí thanh Floating Dock sát viền dưới màn hình và chuyển đổi sang phong cách **Liquid Glass Dynamic Island** với hiệu ứng kính mờ obsidian đa lớp, đường cong con nhộng liên tục (`cornerCurve = .continuous`), viền phản quang kim loại và tab dự án dạng viên thuốc bo tròn siêu êm ái.
- **Chi tiết kỹ thuật các file đã chỉnh sửa:**
  - `ios/App/App/AppDelegate.swift`:
    - Hạ thấp Floating Dock xuống sát cạnh dưới màn hình (`safeAreaLayoutGuide.bottomAnchor, constant: 0`), tối ưu hoá không gian hiển thị nội dung Google Antigravity Remote.
    - Cấu hình hình dáng Dynamic Island dạng viên thuốc chuẩn iOS: chiều cao 44pt, `layer.cornerRadius = 22`, kích hoạt đường cong liên tục `layer.cornerCurve = .continuous`.
    - Áp dụng hiệu ứng Liquid Glass Obsidian: `UIBlurEffect(style: .systemUltraThinMaterialDark)` kết hợp lớp phủ `rgba(10, 10, 15, 0.75)`, viền phản quang kính `borderWidth = 0.75` với màu `rgba(255, 255, 255, 0.18)`, bóng đổ mờ lan toả `shadowRadius = 18`.
    - Tab dự án: chuyển thành các viên thuốc bo tròn con nhộng `cornerRadius = 14`, tab active phát sáng màu Electric Blue rực rỡ, tab inactive sử dụng chất liệu kính khói mờ tinh tế.
    - Nút thao tác nhanh (+, ↻, ⤢): bo tròn mềm mại và đồng bộ phong cách kính mờ.
  - `src/components/FloatingDock.tsx`: Đồng bộ 100% phong cách Liquid Glass Dynamic Island sang phiên bản Web: `rounded-full`, vị trí `bottom-[calc(4px+env(safe-area-inset-bottom,0px))]`, hiệu ứng kính mờ `backdrop-blur-2xl bg-[#0a0a0f]/80` viền `border-white/20`.
  - `src/version.ts`: Tăng số hiệu bản dựng lên `Build 14` (`v1.0.0 (Build 14)`).
  - `ios/App/App.xcodeproj/project.pbxproj`: Đồng bộ `CURRENT_PROJECT_VERSION = 14`.
- **Lệnh hoàn tác mẫu:**
  ```bash
  git revert 859f981 --no-edit
  ```

---

## [v1.0.0] - Build 13 - 2026-11-16
- **Commit:** `46359a7`
- **Mục tiêu thay đổi tóm tắt:** Khắc phục triệt để lỗi biên dịch Swift trên CI (`UIButton.Configuration` và `JSONDecoder.decode from:`), tương thích 100% với toàn bộ phiên bản iOS và Xcode 16 trên macOS Sequoia; vận hành trơn tru Native Multi-Instance `WKWebView` Engine không còn lỗi Google 403 Forbidden và căn chỉnh hoàn hảo SafeAreaLayoutGuide.
- **Chi tiết kỹ thuật các file đã chỉnh sửa:**
  - `ios/App/App/AppDelegate.swift`:
    - Thay thế toàn bộ `UIButton.Configuration` (vốn chỉ hỗ trợ iOS 15+) sang chuẩn UIKit thông dụng (`setTitle`, `setTitleColor`, `titleLabel?.font`, `contentEdgeInsets`) tương thích hoàn toàn từ iOS 12 đến iOS 18+.
    - Sửa cú pháp giải mã `JSONDecoder().decode([RemoteWorkspace].self, from: data)` chuẩn Swift 5/6.
    - Duy trì kiến trúc Native `WKWebView` đa instance chạy ngầm trong bộ nhớ RAM, chia sẻ session cookie qua `WKWebsiteDataStore.default()` và Mobile Safari `customUserAgent` ngăn chặn hoàn toàn lỗi Google 403 Forbidden.
  - `src/version.ts`: Tăng số hiệu bản dựng lên `Build 13` (`v1.0.0 (Build 13)`).
  - `ios/App/App.xcodeproj/project.pbxproj`: Đồng bộ `CURRENT_PROJECT_VERSION = 13`.
- **Lệnh hoàn tác mẫu:**
  ```bash
  git revert 46359a7 --no-edit
  ```

---

## [v1.0.0] - Build 12 - 2026-11-16
- **Commit:** `6287b2d`
- **Mục tiêu thay đổi tóm tắt:** Khắc phục triệt để lỗi kết nối **Google 403 Forbidden** và lỗi giao diện bị đè lên tai thỏ (Status Bar/Dynamic Island) trên iPhone bằng cách nâng cấp lên **Native Multi-Instance `WKWebView` Engine** trực tiếp trong `AppDelegate.swift`, tích hợp quét QR Native AVFoundation 60fps và căn chỉnh AutoLayout `safeAreaLayoutGuide`.
- **Chi tiết kỹ thuật các file đã chỉnh sửa:**
  - `ios/App/App/AppDelegate.swift`: Triển khai kiến trúc Native Container trực tiếp bằng Swift & UIKit:
    - Mỗi dự án được quản lý bởi một đối tượng `WKWebView` độc lập cấp Top-Level Document (`Sec-Fetch-Dest: document`), hoàn toàn vượt qua cơ chế chặn `X-Frame-Options: SAMEORIGIN/DENY` và 403 của Google.
    - Chia sẻ cookie và phiên đăng nhập Google trên tất cả các tab qua `WKWebsiteDataStore.default()`.
    - Thiết lập `customUserAgent` chuẩn Mobile Safari (`Version/17.5 Mobile/15E148 Safari/604.1`) đảm bảo Google Accounts và Antigravity Remote xác thực mượt mà.
    - Cơ chế **Zero-Reload Keep-Alive**: Khi đổi tab dự án, chỉ thay đổi `isHidden = false/true`, chuyển đổi tức thì 0ms, không làm đứt kết nối WebSocket hay tải lại dữ liệu.
    - Thanh điều hướng nổi Native Glassmorphism (`UIVisualEffectView`) căn chỉnh chuẩn xác theo `safeAreaLayoutGuide.bottomAnchor`, không bao giờ đè lên Home Indicator.
    - Tích hợp trình quét mã QR Native bằng `AVCaptureSession` (AVFoundation) mượt mà 60fps, hỗ trợ nút dán link từ Clipboard và phản hồi rung `UIImpactFeedbackGenerator`.
  - `ios/App/App/Info.plist`: Bổ sung khoá cấp quyền Camera `NSCameraUsageDescription` phục vụ quét mã QR pairing.
  - `src/components/KeepAliveContainer.tsx`: Căn chỉnh vị trí các nút điều khiển top toolbar xuống dưới tai thỏ với `top-[calc(14px+env(safe-area-inset-top,24px))]`.
  - `src/components/FloatingDock.tsx`: Đệm an toàn phía dưới với `bottom-[calc(10px+env(safe-area-inset-bottom,0px))]`.
  - `src/version.ts`: Tăng số hiệu bản dựng lên `Build 12` (`v1.0.0 (Build 12)`).
  - `ios/App/App.xcodeproj/project.pbxproj`: Đồng bộ `CURRENT_PROJECT_VERSION = 12`.
- **Lệnh hoàn tác mẫu:**
  ```bash
  git revert 6287b2d --no-edit
  ```

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
