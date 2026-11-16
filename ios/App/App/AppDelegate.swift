import UIKit
import WebKit
import AVFoundation

// MARK: - Data Models
struct RemoteWorkspace: Codable {
    var id: String
    var name: String
    var url: String
    var sessionId: String?
    var accountEmail: String?
    var colorHex: String
}

// MARK: - Workspace Manager
class WorkspaceStore {
    static let shared = WorkspaceStore()
    private let keyWorkspaces = "ag_remote_workspaces"
    private let keyActiveId = "ag_active_workspace_id"

    static let defaultWorkspace = RemoteWorkspace(
        id: "ws_default",
        name: "antigravity-app",
        url: "https://antigravity.google.com",
        sessionId: nil,
        accountEmail: "dien07122012@gmail.com",
        colorHex: "#2563EB"
    )

    func getWorkspaces() -> [RemoteWorkspace] {
        if let data = UserDefaults.standard.data(forKey: keyWorkspaces),
           var list = try? JSONDecoder().decode([RemoteWorkspace].self, from: data), !list.isEmpty {
            var changed = false
            for i in 0..<list.count {
                if list[i].url.contains("3a713708-cef0-49ba-b842-af9504802f6a-v2") {
                    list[i].url = "https://antigravity.google.com"
                    list[i].sessionId = nil
                    changed = true
                }
            }
            if changed {
                saveWorkspaces(list)
            }
            return list
        }
        return [WorkspaceStore.defaultWorkspace]
    }

    func saveWorkspaces(_ list: [RemoteWorkspace]) {
        if let data = try? JSONEncoder().encode(list) {
            UserDefaults.standard.set(data, forKey: keyWorkspaces)
        }
    }

    func getActiveWorkspaceId() -> String {
        return UserDefaults.standard.string(forKey: keyActiveId) ?? WorkspaceStore.defaultWorkspace.id
    }

    func setActiveWorkspaceId(_ id: String) {
        UserDefaults.standard.set(id, forKey: keyActiveId)
    }

    func parseGoogleRemoteUrl(_ rawUrl: String) -> (url: String, sessionId: String?, email: String?, suggestedName: String) {
        let clean = rawUrl.trimmingCharacters(in: .whitespacesAndNewlines)
        var sessionId: String? = nil
        var email: String? = nil
        var suggestedName = "Dự án mới"

        if let components = URLComponents(string: clean) {
            if let items = components.queryItems {
                for item in items {
                    if item.name == "Email" {
                        email = item.value
                    } else if item.name == "continue" {
                        if let cont = item.value, let match = cont.range(of: "/r/([a-zA-Z0-9\\-_]+)", options: .regularExpression) {
                            let sub = String(cont[match])
                            sessionId = sub.replacingOccurrences(of: "/r/", with: "")
                        }
                    }
                }
            }
        }

        if sessionId == nil {
            if let match = clean.range(of: "/r/([a-zA-Z0-9\\-_]+)", options: .regularExpression) {
                let sub = String(clean[match])
                sessionId = sub.replacingOccurrences(of: "/r/", with: "")
            }
        }

        if let sid = sessionId {
            let prefix = sid.prefix(8)
            suggestedName = "Dự án (\(prefix))"
        }

        return (clean, sessionId, email, suggestedName)
    }
}

// MARK: - App Delegate
@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        let win = UIWindow(frame: UIScreen.main.bounds)
        win.rootViewController = MainViewController()
        win.makeKeyAndVisible()
        self.window = win
        return true
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        return true
    }
}

// MARK: - Main Container View Controller
class MainViewController: UIViewController, WKNavigationDelegate, WKUIDelegate, QRScannerDelegate {

    private var workspaces: [RemoteWorkspace] = []
    private var activeWorkspaceId: String = ""
    private var webViews: [String: WKWebView] = [:]

    // Container for WKWebViews
    private let containerView = UIView()

    // Floating Capsule Dock (Build 13 layout with smooth rounded corners & zero square shadow)
    private let dockContainerView = UIView()
    private let dockEffectView = UIVisualEffectView(effect: UIBlurEffect(style: .systemMaterialLight))
    private let dockScrollView = UIScrollView()
    private let dockStackView = UIStackView()
    private let actionStackView = UIStackView()
    private let addButton = UIButton(type: .system)
    private let reloadButton = UIButton(type: .system)
    private let settingsButton = UIButton(type: .system)
    private let fullscreenButton = UIButton(type: .system)
    private let restoreButton = UIButton(type: .system)

    private var isFullscreen = false
    private var currentZoom: CGFloat = 1.0

    override var preferredStatusBarStyle: UIStatusBarStyle {
        return traitCollection.userInterfaceStyle == .dark ? .lightContent : .darkContent
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .systemBackground

        let savedZoom = UserDefaults.standard.double(forKey: "ag_page_zoom")
        if savedZoom >= 0.7 && savedZoom <= 2.5 {
            currentZoom = CGFloat(savedZoom)
        }

        setupLayout()
        updateDockTheme()
        loadWorkspaces()
    }

    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()
        // Ensure precise capsule shadow path: eliminates any rectangular/square shadow artifact!
        if dockContainerView.bounds.width > 0 && dockContainerView.bounds.height > 0 {
            dockContainerView.layer.shadowPath = UIBezierPath(
                roundedRect: dockContainerView.bounds,
                cornerRadius: 24
            ).cgPath
        }
    }

    override func traitCollectionDidChange(_ previousTraitCollection: UITraitCollection?) {
        super.traitCollectionDidChange(previousTraitCollection)
        updateDockTheme()
        renderDockTabs()
    }

    private func updateDockTheme() {
        let isDark = traitCollection.userInterfaceStyle == .dark
        dockEffectView.effect = UIBlurEffect(style: isDark ? .systemUltraThinMaterialDark : .systemThinMaterialLight)

        let dockBg = isDark
            ? UIColor(red: 0.08, green: 0.08, blue: 0.10, alpha: 0.82)
            : UIColor(red: 0.98, green: 0.98, blue: 1.00, alpha: 0.88)
        dockEffectView.contentView.backgroundColor = dockBg

        let borderColor = isDark
            ? UIColor(white: 1.0, alpha: 0.18).cgColor
            : UIColor(white: 0.0, alpha: 0.12).cgColor

        dockEffectView.layer.borderColor = borderColor
        dockContainerView.layer.shadowColor = UIColor.black.cgColor
        dockContainerView.layer.shadowOpacity = isDark ? 0.32 : 0.15

        let tintColor: UIColor = isDark ? .white : .label
        addButton.tintColor = UIColor(red: 0.15, green: 0.45, blue: 1.0, alpha: 1.0)
        addButton.backgroundColor = UIColor(red: 0.15, green: 0.45, blue: 1.0, alpha: isDark ? 0.22 : 0.12)
        reloadButton.tintColor = tintColor.withAlphaComponent(0.85)
        settingsButton.tintColor = tintColor.withAlphaComponent(0.85)
        fullscreenButton.tintColor = tintColor.withAlphaComponent(0.85)
    }

    // MARK: - Setup UI Elements
    private func setupLayout() {
        // 1. Container for WKWebViews
        containerView.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(containerView)

        // 2. Dock Container (holds the smooth capsule shadow)
        dockContainerView.translatesAutoresizingMaskIntoConstraints = false
        dockContainerView.backgroundColor = .clear
        dockContainerView.layer.cornerRadius = 24
        dockContainerView.layer.cornerCurve = .continuous
        dockContainerView.layer.masksToBounds = false
        dockContainerView.layer.shadowRadius = 12
        dockContainerView.layer.shadowOffset = CGSize(width: 0, height: 4)
        view.addSubview(dockContainerView)

        // 3. Dock Frosted Glass Effect (strictly clipped to cornerRadius = 24, zero square halo)
        dockEffectView.translatesAutoresizingMaskIntoConstraints = false
        dockEffectView.layer.cornerRadius = 24
        dockEffectView.layer.cornerCurve = .continuous
        dockEffectView.clipsToBounds = true
        dockEffectView.layer.borderWidth = 0.65
        dockContainerView.addSubview(dockEffectView)

        let dockContentView = dockEffectView.contentView
        dockContentView.layer.cornerRadius = 24
        dockContentView.layer.cornerCurve = .continuous
        dockContentView.clipsToBounds = true

        // 4. Scrollable Project Tabs
        dockScrollView.translatesAutoresizingMaskIntoConstraints = false
        dockScrollView.showsHorizontalScrollIndicator = false
        dockContentView.addSubview(dockScrollView)

        dockStackView.translatesAutoresizingMaskIntoConstraints = false
        dockStackView.axis = .horizontal
        dockStackView.spacing = 8
        dockStackView.alignment = .center
        dockScrollView.addSubview(dockStackView)

        // 5. Action Buttons Stack
        actionStackView.translatesAutoresizingMaskIntoConstraints = false
        actionStackView.axis = .horizontal
        actionStackView.spacing = 4
        actionStackView.alignment = .center
        dockContentView.addSubview(actionStackView)

        setupActionButton(addButton, iconName: "plus", action: #selector(handleAddWorkspace))
        setupActionButton(reloadButton, iconName: "arrow.clockwise", action: #selector(handleReloadActiveTab))
        setupActionButton(settingsButton, iconName: "gearshape", action: #selector(handleSettingsTapped))
        setupActionButton(fullscreenButton, iconName: "arrow.up.left.and.arrow.down.right", action: #selector(toggleFullscreen))

        actionStackView.addArrangedSubview(addButton)
        actionStackView.addArrangedSubview(reloadButton)
        actionStackView.addArrangedSubview(settingsButton)
        actionStackView.addArrangedSubview(fullscreenButton)

        // 6. Restore Floating Button (shown in fullscreen)
        restoreButton.translatesAutoresizingMaskIntoConstraints = false
        restoreButton.setImage(UIImage(systemName: "arrow.down.right.and.arrow.up.left"), for: .normal)
        restoreButton.tintColor = .white
        restoreButton.backgroundColor = UIColor.black.withAlphaComponent(0.8)
        restoreButton.layer.cornerRadius = 20
        restoreButton.layer.cornerCurve = .continuous
        restoreButton.layer.borderColor = UIColor.white.withAlphaComponent(0.2).cgColor
        restoreButton.layer.borderWidth = 0.5
        restoreButton.layer.shadowColor = UIColor.black.cgColor
        restoreButton.layer.shadowOpacity = 0.35
        restoreButton.layer.shadowRadius = 8
        restoreButton.alpha = 0
        restoreButton.addTarget(self, action: #selector(toggleFullscreen), for: .touchUpInside)
        view.addSubview(restoreButton)

        // Constraints - Build 13 layout
        NSLayoutConstraint.activate([
            // Container fills screen starting below status bar
            containerView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            containerView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            containerView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            containerView.bottomAnchor.constraint(equalTo: view.bottomAnchor),

            // Floating dock pinned safely above home indicator (Build 13)
            dockContainerView.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            dockContainerView.leadingAnchor.constraint(greaterThanOrEqualTo: view.leadingAnchor, constant: 12),
            dockContainerView.trailingAnchor.constraint(lessThanOrEqualTo: view.trailingAnchor, constant: -12),
            dockContainerView.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor, constant: -8),
            dockContainerView.heightAnchor.constraint(equalToConstant: 48),

            // Dock effect view fills dock container
            dockEffectView.topAnchor.constraint(equalTo: dockContainerView.topAnchor),
            dockEffectView.bottomAnchor.constraint(equalTo: dockContainerView.bottomAnchor),
            dockEffectView.leadingAnchor.constraint(equalTo: dockContainerView.leadingAnchor),
            dockEffectView.trailingAnchor.constraint(equalTo: dockContainerView.trailingAnchor),

            // Dock scroll view
            dockScrollView.leadingAnchor.constraint(equalTo: dockContentView.leadingAnchor, constant: 8),
            dockScrollView.trailingAnchor.constraint(equalTo: actionStackView.leadingAnchor, constant: -8),
            dockScrollView.topAnchor.constraint(equalTo: dockContentView.topAnchor),
            dockScrollView.bottomAnchor.constraint(equalTo: dockContentView.bottomAnchor),

            // Dock stack inside scroll view
            dockStackView.leadingAnchor.constraint(equalTo: dockScrollView.leadingAnchor),
            dockStackView.trailingAnchor.constraint(equalTo: dockScrollView.trailingAnchor),
            dockStackView.topAnchor.constraint(equalTo: dockScrollView.topAnchor),
            dockStackView.bottomAnchor.constraint(equalTo: dockScrollView.bottomAnchor),
            dockStackView.heightAnchor.constraint(equalTo: dockScrollView.heightAnchor),

            // Action stack
            actionStackView.trailingAnchor.constraint(equalTo: dockContentView.trailingAnchor, constant: -8),
            actionStackView.centerYAnchor.constraint(equalTo: dockContentView.centerYAnchor),

            addButton.widthAnchor.constraint(equalToConstant: 30),
            addButton.heightAnchor.constraint(equalToConstant: 30),
            reloadButton.widthAnchor.constraint(equalToConstant: 30),
            reloadButton.heightAnchor.constraint(equalToConstant: 30),
            settingsButton.widthAnchor.constraint(equalToConstant: 30),
            settingsButton.heightAnchor.constraint(equalToConstant: 30),
            fullscreenButton.widthAnchor.constraint(equalToConstant: 30),
            fullscreenButton.heightAnchor.constraint(equalToConstant: 30),

            // Restore button
            restoreButton.trailingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.trailingAnchor, constant: -16),
            restoreButton.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor, constant: -16),
            restoreButton.widthAnchor.constraint(equalToConstant: 40),
            restoreButton.heightAnchor.constraint(equalToConstant: 40)
        ])
    }

    private func setupActionButton(_ button: UIButton, iconName: String, action: Selector) {
        button.translatesAutoresizingMaskIntoConstraints = false
        button.setImage(UIImage(systemName: iconName), for: .normal)
        button.layer.cornerRadius = 15
        button.layer.cornerCurve = .continuous
        button.addTarget(self, action: action, for: .touchUpInside)
    }

    // MARK: - Workspaces Lifecycle & Zero-Reload Keep-Alive
    private func loadWorkspaces() {
        workspaces = WorkspaceStore.shared.getWorkspaces()
        activeWorkspaceId = WorkspaceStore.shared.getActiveWorkspaceId()

        if !workspaces.contains(where: { $0.id == activeWorkspaceId }), let first = workspaces.first {
            activeWorkspaceId = first.id
            WorkspaceStore.shared.setActiveWorkspaceId(first.id)
        }

        for ws in workspaces {
            _ = ensureWebView(for: ws)
        }

        updateActiveVisibility()
        renderDockTabs()
    }

    private func ensureWebView(for ws: RemoteWorkspace) -> WKWebView {
        if let existing = webViews[ws.id] {
            return existing
        }

        let config = WKWebViewConfiguration()
        config.allowsInlineMediaPlayback = true
        config.mediaTypesRequiringUserActionForPlayback = []
        config.websiteDataStore = WKWebsiteDataStore.default()

        let webView = WKWebView(frame: .zero, configuration: config)
        webView.translatesAutoresizingMaskIntoConstraints = false
        webView.customUserAgent = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1"
        webView.allowsBackForwardNavigationGestures = true
        webView.navigationDelegate = self
        webView.uiDelegate = self
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        // Add bottom inset so page content can scroll comfortably above the dock
        webView.scrollView.contentInset.bottom = 60
        webView.scrollView.scrollIndicatorInsets.bottom = 60
        webView.backgroundColor = .systemBackground

        containerView.addSubview(webView)
        NSLayoutConstraint.activate([
            webView.topAnchor.constraint(equalTo: containerView.topAnchor),
            webView.leadingAnchor.constraint(equalTo: containerView.leadingAnchor),
            webView.trailingAnchor.constraint(equalTo: containerView.trailingAnchor),
            webView.bottomAnchor.constraint(equalTo: containerView.bottomAnchor)
        ])

        let cleanUrl = ws.url.trimmingCharacters(in: .whitespacesAndNewlines)
        if let targetUrl = URL(string: cleanUrl) ?? URL(string: cleanUrl.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? "") {
            let request = URLRequest(url: targetUrl)
            webView.load(request)
        }

        webViews[ws.id] = webView
        return webView
    }

    private func switchWorkspace(to id: String) {
        guard id != activeWorkspaceId else { return }
        activeWorkspaceId = id
        WorkspaceStore.shared.setActiveWorkspaceId(id)

        updateActiveVisibility()
        renderDockTabs()

        UIImpactFeedbackGenerator(style: .light).impactOccurred()
    }

    private func updateActiveVisibility() {
        for (wsId, wv) in webViews {
            let isActive = (wsId == activeWorkspaceId)
            wv.isHidden = !isActive
        }
    }

    private func renderDockTabs() {
        dockStackView.arrangedSubviews.forEach {
            dockStackView.removeArrangedSubview($0)
            $0.removeFromSuperview()
        }

        let isDark = traitCollection.userInterfaceStyle == .dark

        for ws in workspaces {
            let isActive = (ws.id == activeWorkspaceId)

            let button = UIButton(type: .system)
            button.translatesAutoresizingMaskIntoConstraints = false
            button.tag = workspaces.firstIndex(where: { $0.id == ws.id }) ?? 0

            let prefix = isActive ? "● " : ""
            button.setTitle("\(prefix)\(ws.name)", for: .normal)
            button.setTitleColor(isActive ? .white : (isDark ? UIColor(white: 0.90, alpha: 1.0) : UIColor.label), for: .normal)
            button.titleLabel?.font = UIFont.systemFont(ofSize: 13, weight: isActive ? .bold : .medium)
            button.contentEdgeInsets = UIEdgeInsets(top: 6, left: 14, bottom: 6, right: 14)

            button.backgroundColor = isActive
                ? UIColor(red: 0.15, green: 0.39, blue: 0.92, alpha: 1.0)
                : (isDark ? UIColor(white: 1.0, alpha: 0.12) : UIColor(white: 0.0, alpha: 0.06))

            button.layer.cornerRadius = 17
            button.layer.cornerCurve = .continuous
            button.clipsToBounds = true

            if isActive {
                button.layer.shadowColor = UIColor(red: 0.15, green: 0.39, blue: 0.92, alpha: 0.55).cgColor
                button.layer.shadowOpacity = 0.5
                button.layer.shadowRadius = 6
                button.layer.shadowOffset = CGSize(width: 0, height: 2)
            } else {
                button.layer.shadowOpacity = 0
            }

            button.addTarget(self, action: #selector(handleTabTapped(_:)), for: .touchUpInside)

            let longPress = UILongPressGestureRecognizer(target: self, action: #selector(handleTabLongPressed(_:)))
            button.addGestureRecognizer(longPress)

            dockStackView.addArrangedSubview(button)
        }
    }

    @objc private func toggleFullscreen() {
        isFullscreen.toggle()
        UIView.animate(withDuration: 0.28, delay: 0, options: .curveEaseInOut) {
            self.dockContainerView.alpha = self.isFullscreen ? 0 : 1
            self.dockContainerView.transform = self.isFullscreen ? CGAffineTransform(translationX: 0, y: 30) : .identity
            self.restoreButton.alpha = self.isFullscreen ? 1 : 0
        }
    }

    // MARK: - Actions
    @objc private func handleTabTapped(_ sender: UIButton) {
        let index = sender.tag
        if index < workspaces.count {
            switchWorkspace(to: workspaces[index].id)
        }
    }

    @objc private func handleTabLongPressed(_ gesture: UILongPressGestureRecognizer) {
        guard gesture.state == .began, let button = gesture.view as? UIButton else { return }
        let index = button.tag
        guard index < workspaces.count else { return }
        let ws = workspaces[index]

        let sheet = UIAlertController(title: ws.name, message: "Tùy chọn cho dự án", preferredStyle: .actionSheet)

        sheet.addAction(UIAlertAction(title: "Đổi tên dự án", style: .default, handler: { _ in
            self.showRenameDialog(for: ws)
        }))

        sheet.addAction(UIAlertAction(title: "Tải lại trang", style: .default, handler: { _ in
            self.webViews[ws.id]?.reload()
        }))

        if workspaces.count > 1 {
            sheet.addAction(UIAlertAction(title: "Đóng tab dự án này", style: .destructive, handler: { _ in
                self.removeWorkspace(ws)
            }))
        }

        sheet.addAction(UIAlertAction(title: "Hủy", style: .cancel))

        if let popover = sheet.popoverPresentationController {
            popover.sourceView = button
            popover.sourceRect = button.bounds
        }

        present(sheet, animated: true)
    }

    private func showRenameDialog(for ws: RemoteWorkspace) {
        let alert = UIAlertController(title: "Đổi Tên Dự Án", message: "Nhập tên dễ nhớ cho tab dự án này:", preferredStyle: .alert)
        alert.addTextField { tf in
            tf.text = ws.name
        }
        alert.addAction(UIAlertAction(title: "Hủy", style: .cancel))
        alert.addAction(UIAlertAction(title: "Lưu", style: .default, handler: { _ in
            if let newName = alert.textFields?.first?.text?.trimmingCharacters(in: .whitespacesAndNewlines), !newName.isEmpty {
                if let idx = self.workspaces.firstIndex(where: { $0.id == ws.id }) {
                    self.workspaces[idx].name = newName
                    WorkspaceStore.shared.saveWorkspaces(self.workspaces)
                    self.renderDockTabs()
                }
            }
        }))
        present(alert, animated: true)
    }

    private func removeWorkspace(_ ws: RemoteWorkspace) {
        guard let idx = workspaces.firstIndex(where: { $0.id == ws.id }) else { return }

        if let wv = webViews[ws.id] {
            wv.stopLoading()
            wv.removeFromSuperview()
            webViews.removeValue(forKey: ws.id)
        }

        workspaces.remove(at: idx)
        if workspaces.isEmpty {
            workspaces = [WorkspaceStore.defaultWorkspace]
        }
        WorkspaceStore.shared.saveWorkspaces(workspaces)

        if activeWorkspaceId == ws.id {
            activeWorkspaceId = workspaces.first?.id ?? ""
            WorkspaceStore.shared.setActiveWorkspaceId(activeWorkspaceId)
        }

        updateActiveVisibility()
        renderDockTabs()
    }

    @objc private func handleAddWorkspace() {
        let scanner = QRScannerViewController()
        scanner.delegate = self
        scanner.modalPresentationStyle = .fullScreen
        present(scanner, animated: true)
    }

    @objc private func handleReloadActiveTab() {
        if let active = webViews[activeWorkspaceId] {
            active.reload()
            UIImpactFeedbackGenerator(style: .medium).impactOccurred()
        }
    }

    // MARK: - Zoom, Font Size & Project Settings
    @objc private func handleSettingsTapped() {
        let percent = Int(currentZoom * 100)
        let sheet = UIAlertController(
            title: "Cài Đặt & Điều Khiển Dự Án",
            message: "Mức phóng to hiện tại: \(percent)%",
            preferredStyle: .actionSheet
        )

        sheet.addAction(UIAlertAction(title: "🔍 Phóng to chữ & giao diện (+10%)", style: .default, handler: { _ in
            self.adjustZoom(by: 0.1)
        }))

        sheet.addAction(UIAlertAction(title: "🔍 Thu nhỏ chữ & giao diện (-10%)", style: .default, handler: { _ in
            self.adjustZoom(by: -0.1)
        }))

        if currentZoom != 1.0 {
            sheet.addAction(UIAlertAction(title: "↺ Đặt lại kích thước chuẩn (100%)", style: .default, handler: { _ in
                self.setZoom(1.0)
            }))
        }

        if let active = workspaces.first(where: { $0.id == activeWorkspaceId }) {
            sheet.addAction(UIAlertAction(title: "🔗 Cập nhật liên kết URL / Phiên mới", style: .default, handler: { _ in
                self.showUpdateUrlDialog(for: active)
            }))
            sheet.addAction(UIAlertAction(title: "✏️ Đổi tên tab (\(active.name))", style: .default, handler: { _ in
                self.showRenameDialog(for: active)
            }))
        }

        sheet.addAction(UIAlertAction(title: "🔑 Đăng nhập tài khoản Google", style: .default, handler: { _ in
            self.navigateToGoogleLogin()
        }))

        sheet.addAction(UIAlertAction(title: "🔄 Tải lại trang này", style: .default, handler: { _ in
            self.handleReloadActiveTab()
        }))

        if workspaces.count > 1, let active = workspaces.first(where: { $0.id == activeWorkspaceId }) {
            sheet.addAction(UIAlertAction(title: "🗑️ Xóa tab này (\(active.name))", style: .destructive, handler: { _ in
                self.removeWorkspace(active)
            }))
        }

        sheet.addAction(UIAlertAction(title: "🧹 Xóa dữ liệu Cache & Phiên cũ", style: .destructive, handler: { _ in
            self.clearCacheAndReload()
        }))

        sheet.addAction(UIAlertAction(title: "Đóng", style: .cancel))

        if let popover = sheet.popoverPresentationController {
            popover.sourceView = settingsButton
            popover.sourceRect = settingsButton.bounds
        }

        present(sheet, animated: true)
    }

    private func showUpdateUrlDialog(for ws: RemoteWorkspace) {
        let alert = UIAlertController(
            title: "Cập Nhật Liên Kết Dự Án",
            message: "Nhập hoặc dán link Google Antigravity Remote mới:",
            preferredStyle: .alert
        )
        alert.addTextField { tf in
            tf.text = ws.url
            tf.placeholder = "https://antigravity.google.com/..."
            tf.clearButtonMode = .whileEditing
        }
        alert.addAction(UIAlertAction(title: "Hủy", style: .cancel))
        alert.addAction(UIAlertAction(title: "Cập Nhật & Tải Lại", style: .default, handler: { _ in
            if let newUrl = alert.textFields?.first?.text?.trimmingCharacters(in: .whitespacesAndNewlines), !newUrl.isEmpty {
                if let idx = self.workspaces.firstIndex(where: { $0.id == ws.id }) {
                    let parsed = WorkspaceStore.shared.parseGoogleRemoteUrl(newUrl)
                    self.workspaces[idx].url = parsed.url
                    if let sid = parsed.sessionId { self.workspaces[idx].sessionId = sid }
                    if let email = parsed.email { self.workspaces[idx].accountEmail = email }
                    WorkspaceStore.shared.saveWorkspaces(self.workspaces)

                    if let wv = self.webViews[ws.id] {
                        let clean = parsed.url.trimmingCharacters(in: .whitespacesAndNewlines)
                        if let targetUrl = URL(string: clean) ?? URL(string: clean.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? "") {
                            wv.load(URLRequest(url: targetUrl))
                        }
                    }
                    self.renderDockTabs()
                    UIImpactFeedbackGenerator(style: .medium).impactOccurred()
                }
            }
        }))
        present(alert, animated: true)
    }

    private func navigateToGoogleLogin() {
        if let active = webViews[activeWorkspaceId] {
            if let loginUrl = URL(string: "https://accounts.google.com") {
                active.load(URLRequest(url: loginUrl))
                UIImpactFeedbackGenerator(style: .medium).impactOccurred()
            }
        }
    }

    private func clearCacheAndReload() {
        let dataStore = WKWebsiteDataStore.default()
        let dataTypes = WKWebsiteDataStore.allWebsiteDataTypes()
        dataStore.removeData(ofTypes: dataTypes, modifiedSince: Date(timeIntervalSince1970: 0)) {
            DispatchQueue.main.async {
                self.handleReloadActiveTab()
                let alert = UIAlertController(title: "Đã Xóa Dữ Liệu Cache", message: "Bộ nhớ đệm và các phiên lưu cũ đã được làm mới thành công.", preferredStyle: .alert)
                alert.addAction(UIAlertAction(title: "Đóng", style: .default))
                self.present(alert, animated: true)
            }
        }
    }

    private func showAccessDeniedBanner() {
        let alert = UIAlertController(
            title: "Phiên Kết Nối Hết Hạn (Lỗi 403)",
            message: "Phiên làm việc này đã kết thúc trên máy chủ hoặc tài khoản cần cấp lại quyền truy cập. Bạn có muốn quét mã QR mới hoặc đăng nhập lại Google?",
            preferredStyle: .alert
        )
        alert.addAction(UIAlertAction(title: "Quét Mã QR Mới", style: .default, handler: { _ in
            self.handleAddWorkspace()
        }))
        alert.addAction(UIAlertAction(title: "Đăng Nhập Google", style: .default, handler: { _ in
            self.navigateToGoogleLogin()
        }))
        alert.addAction(UIAlertAction(title: "Đóng", style: .cancel))
        present(alert, animated: true)
    }

    private func adjustZoom(by delta: CGFloat) {
        let newZoom = max(0.7, min(2.2, currentZoom + delta))
        setZoom(newZoom)
    }

    private func setZoom(_ zoom: CGFloat) {
        currentZoom = (zoom * 10).rounded() / 10.0
        UserDefaults.standard.set(Double(currentZoom), forKey: "ag_page_zoom")

        for (_, wv) in webViews {
            applyZoom(currentZoom, to: wv)
        }

        UIImpactFeedbackGenerator(style: .medium).impactOccurred()
    }

    private func applyZoom(_ zoom: CGFloat, to webView: WKWebView) {
        if #available(iOS 14.0, *) {
            webView.pageZoom = zoom
        }
        let percent = Int(zoom * 100)
        webView.evaluateJavaScript("document.body.style.zoom = '\(percent)%'", completionHandler: nil)
    }

    // MARK: - WKNavigationDelegate & WKUIDelegate
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        // Safe navigation finish: apply zoom without destroying Google DOM
        if currentZoom != 1.0 {
            applyZoom(currentZoom, to: webView)
        }
    }

    func webView(_ webView: WKWebView, decidePolicyFor navigationResponse: WKNavigationResponse, decisionHandler: @escaping (WKNavigationResponsePolicy) -> Void) {
        if let httpResponse = navigationResponse.response as? HTTPURLResponse {
            if httpResponse.statusCode == 403 {
                DispatchQueue.main.async {
                    self.showAccessDeniedBanner()
                }
            }
        }
        decisionHandler(.allow)
    }

    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        print("[WKWebView] didFailProvisionalNavigation: \(error.localizedDescription)")
    }

    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        print("[WKWebView] didFail: \(error.localizedDescription)")
    }

    func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration, for navigationAction: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
        if navigationAction.targetFrame == nil {
            webView.load(navigationAction.request)
        }
        return nil
    }

    // MARK: - QRScannerDelegate
    func didScanWorkspace(url: String, customName: String?) {
        let parsed = WorkspaceStore.shared.parseGoogleRemoteUrl(url)

        if let existingIdx = workspaces.firstIndex(where: { (parsed.sessionId != nil && $0.sessionId == parsed.sessionId) || $0.url == parsed.url }) {
            // Update URL & reload existing workspace
            workspaces[existingIdx].url = parsed.url
            if let sid = parsed.sessionId { workspaces[existingIdx].sessionId = sid }
            if let email = parsed.email { workspaces[existingIdx].accountEmail = email }
            WorkspaceStore.shared.saveWorkspaces(workspaces)

            let existingId = workspaces[existingIdx].id
            if let wv = webViews[existingId] {
                let clean = parsed.url.trimmingCharacters(in: .whitespacesAndNewlines)
                if let targetUrl = URL(string: clean) ?? URL(string: clean.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? "") {
                    wv.load(URLRequest(url: targetUrl))
                }
            }
            switchWorkspace(to: existingId)
            return
        }

        let newId = "ws_\(Int(Date().timeIntervalSince1970))"
        let name = customName ?? parsed.suggestedName
        let newWs = RemoteWorkspace(
            id: newId,
            name: name,
            url: parsed.url,
            sessionId: parsed.sessionId,
            accountEmail: parsed.email,
            colorHex: "#2563EB"
        )

        workspaces.append(newWs)
        WorkspaceStore.shared.saveWorkspaces(workspaces)

        _ = ensureWebView(for: newWs)
        switchWorkspace(to: newId)
    }
}

// MARK: - Native QR Scanner View Controller
protocol QRScannerDelegate: AnyObject {
    func didScanWorkspace(url: String, customName: String?)
}

class QRScannerViewController: UIViewController, AVCaptureMetadataOutputObjectsDelegate {

    weak var delegate: QRScannerDelegate?

    private var captureSession: AVCaptureSession?
    private var previewLayer: AVCaptureVideoPreviewLayer?
    private let closeButton = UIButton(type: .system)
    private let pasteButton = UIButton(type: .system)
    private let titleLabel = UILabel()

    override var preferredStatusBarStyle: UIStatusBarStyle {
        return .lightContent
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .black

        setupCamera()
        setupUI()
    }

    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()
        previewLayer?.frame = view.bounds
    }

    private func setupCamera() {
        let session = AVCaptureSession()

        guard let videoCaptureDevice = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .back),
              let videoInput = try? AVCaptureDeviceInput(device: videoCaptureDevice),
              session.canAddInput(videoInput) else {
            showCameraUnavailableAlert()
            return
        }

        session.addInput(videoInput)

        let metadataOutput = AVCaptureMetadataOutput()
        if session.canAddOutput(metadataOutput) {
            session.addOutput(metadataOutput)
            metadataOutput.setMetadataObjectsDelegate(self, queue: DispatchQueue.main)
            metadataOutput.metadataObjectTypes = [.qr]
        }

        let layer = AVCaptureVideoPreviewLayer(session: session)
        layer.videoGravity = .resizeAspectFill
        layer.frame = view.layer.bounds
        view.layer.addSublayer(layer)
        self.previewLayer = layer

        self.captureSession = session

        DispatchQueue.global(qos: .userInitiated).async {
            session.startRunning()
        }
    }

    private func setupUI() {
        titleLabel.translatesAutoresizingMaskIntoConstraints = false
        titleLabel.text = "Quét Mã QR Google Antigravity Remote"
        titleLabel.textColor = .white
        titleLabel.font = UIFont.systemFont(ofSize: 16, weight: .bold)
        titleLabel.textAlignment = .center
        view.addSubview(titleLabel)

        closeButton.translatesAutoresizingMaskIntoConstraints = false
        closeButton.setImage(UIImage(systemName: "xmark.circle.fill"), for: .normal)
        closeButton.tintColor = .white
        closeButton.addTarget(self, action: #selector(handleClose), for: .touchUpInside)
        view.addSubview(closeButton)

        let reticle = UIView()
        reticle.translatesAutoresizingMaskIntoConstraints = false
        reticle.layer.borderColor = UIColor(red: 0.15, green: 0.39, blue: 0.92, alpha: 1.0).cgColor
        reticle.layer.borderWidth = 3
        reticle.layer.cornerRadius = 16
        reticle.backgroundColor = .clear
        view.addSubview(reticle)

        pasteButton.translatesAutoresizingMaskIntoConstraints = false
        pasteButton.setTitle(" Dán Link Từ Bộ Nhớ Tạm", for: .normal)
        pasteButton.setImage(UIImage(systemName: "doc.on.clipboard"), for: .normal)
        pasteButton.setTitleColor(.white, for: .normal)
        pasteButton.titleLabel?.font = UIFont.systemFont(ofSize: 14, weight: .bold)
        pasteButton.tintColor = .white
        pasteButton.backgroundColor = UIColor(red: 0.15, green: 0.39, blue: 0.92, alpha: 1.0)
        pasteButton.layer.cornerRadius = 24
        pasteButton.contentEdgeInsets = UIEdgeInsets(top: 10, left: 20, bottom: 10, right: 20)
        pasteButton.addTarget(self, action: #selector(handlePasteLink), for: .touchUpInside)
        view.addSubview(pasteButton)

        NSLayoutConstraint.activate([
            titleLabel.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 16),
            titleLabel.centerXAnchor.constraint(equalTo: view.centerXAnchor),

            closeButton.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 12),
            closeButton.trailingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.trailingAnchor, constant: -16),
            closeButton.widthAnchor.constraint(equalToConstant: 36),
            closeButton.heightAnchor.constraint(equalToConstant: 36),

            reticle.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            reticle.centerYAnchor.constraint(equalTo: view.centerYAnchor, constant: -30),
            reticle.widthAnchor.constraint(equalToConstant: 240),
            reticle.heightAnchor.constraint(equalToConstant: 240),

            pasteButton.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor, constant: -30),
            pasteButton.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            pasteButton.heightAnchor.constraint(equalToConstant: 48),
            pasteButton.widthAnchor.constraint(greaterThanOrEqualToConstant: 220)
        ])
    }

    @objc private func handleClose() {
        captureSession?.stopRunning()
        dismiss(animated: true)
    }

    @objc private func handlePasteLink() {
        let clipboard = UIPasteboard.general.string?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        let defaultText = clipboard.starts(with: "http") ? clipboard : ""

        let alert = UIAlertController(
            title: "Nhập Hoặc Dán Liên Kết",
            message: "Dán link Google Antigravity Remote hoặc nhập URL kết nối:",
            preferredStyle: .alert
        )
        alert.addTextField { tf in
            tf.text = defaultText
            tf.placeholder = "https://antigravity.google.com/..."
            tf.clearButtonMode = .whileEditing
        }
        alert.addAction(UIAlertAction(title: "Hủy", style: .cancel))
        alert.addAction(UIAlertAction(title: "Mở Dự Án", style: .default, handler: { _ in
            if let text = alert.textFields?.first?.text?.trimmingCharacters(in: .whitespacesAndNewlines), !text.isEmpty {
                self.captureSession?.stopRunning()
                self.dismiss(animated: true) {
                    self.delegate?.didScanWorkspace(url: text, customName: nil)
                }
            }
        }))
        present(alert, animated: true)
    }

    private func showCameraUnavailableAlert() {
        let alert = UIAlertController(
            title: "Không Thể Dùng Camera",
            message: "Thiết bị không hỗ trợ camera hoặc chưa cấp quyền. Bạn có thể dán link trực tiếp từ bộ nhớ tạm.",
            preferredStyle: .alert
        )
        alert.addAction(UIAlertAction(title: "Dán Link", style: .default, handler: { _ in
            self.handlePasteLink()
        }))
        alert.addAction(UIAlertAction(title: "Đóng", style: .cancel, handler: { _ in
            self.dismiss(animated: true)
        }))
        present(alert, animated: true)
    }

    // AVCaptureMetadataOutputObjectsDelegate
    func metadataOutput(_ output: AVCaptureMetadataOutput, didOutput metadataObjects: [AVMetadataObject], from connection: AVCaptureConnection) {
        if let metadataObject = metadataObjects.first as? AVMetadataMachineReadableCodeObject,
           metadataObject.type == .qr,
           let stringValue = metadataObject.stringValue {
            captureSession?.stopRunning()
            UIImpactFeedbackGenerator(style: .heavy).impactOccurred()
            dismiss(animated: true) {
                self.delegate?.didScanWorkspace(url: stringValue, customName: nil)
            }
        }
    }
}
