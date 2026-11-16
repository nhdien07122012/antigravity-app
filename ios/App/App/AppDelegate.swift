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
        url: "https://accounts.google.com/AccountChooser?Email=dien07122012%40gmail.com&continue=https%3A%2F%2Fantigravity.google.com%2Fr%2F3a713708-cef0-49ba-b842-af9504802f6a-v2",
        sessionId: "3a713708-cef0-49ba-b842-af9504802f6a-v2",
        accountEmail: "dien07122012@gmail.com",
        colorHex: "#2563EB"
    )

    func getWorkspaces() -> [RemoteWorkspace] {
        if let data = UserDefaults.standard.data(forKey: keyWorkspaces),
           let list = try? JSONDecoder().decode([RemoteWorkspace].self, from: data), !list.isEmpty {
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
class MainViewController: UIViewController, WKNavigationDelegate, QRScannerDelegate {

    private var workspaces: [RemoteWorkspace] = []
    private var activeWorkspaceId: String = ""
    private var webViews: [String: WKWebView] = [:]

    // Container for WKWebViews
    private let containerView = UIView()
    private var containerBottomToDockConstraint: NSLayoutConstraint!
    private var containerBottomToViewConstraint: NSLayoutConstraint!

    // Liquid Glass Dynamic Island Bottom Dock (Build 17)
    private let dockView = UIVisualEffectView(effect: UIBlurEffect(style: .systemThinMaterial))
    private let dockScrollView = UIScrollView()
    private let dockStackView = UIStackView()
    private let actionStackView = UIStackView()
    private let dividerView = UIView()
    private let addButton = UIButton(type: .system)
    private let reloadButton = UIButton(type: .system)
    private let settingsButton = UIButton(type: .system)
    private let fullscreenButton = UIButton(type: .system)
    private let collapseButton = UIButton(type: .system)

    // Floating Mini Restore Pill (For Fullscreen & Minimized Modes)
    private let restorePill = UIVisualEffectView(effect: UIBlurEffect(style: .systemThinMaterial))
    private let restorePillButton = UIButton(type: .system)
    private var restorePillTrailingConstraint: NSLayoutConstraint!
    private var restorePillBottomConstraint: NSLayoutConstraint!

    private var isDockMinimized = false
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

    deinit {
        NotificationCenter.default.removeObserver(self)
    }

    override func traitCollectionDidChange(_ previousTraitCollection: UITraitCollection?) {
        super.traitCollectionDidChange(previousTraitCollection)
        updateDockTheme()
        renderDockTabs()
    }

    private func updateDockTheme() {
        let isDark = traitCollection.userInterfaceStyle == .dark
        let blurStyle: UIBlurEffect.Style = isDark ? .systemUltraThinMaterialDark : .systemThinMaterialLight
        dockView.effect = UIBlurEffect(style: blurStyle)
        restorePill.effect = UIBlurEffect(style: blurStyle)

        let dockBg = isDark
            ? UIColor(red: 0.08, green: 0.08, blue: 0.10, alpha: 0.85)
            : UIColor(red: 0.98, green: 0.98, blue: 1.00, alpha: 0.88)
        dockView.contentView.backgroundColor = dockBg
        restorePill.contentView.backgroundColor = dockBg

        let borderColor = isDark
            ? UIColor(white: 1.0, alpha: 0.20).cgColor
            : UIColor(white: 0.0, alpha: 0.12).cgColor

        dockView.layer.borderColor = borderColor
        restorePill.layer.borderColor = borderColor

        dockView.layer.shadowColor = UIColor.black.cgColor
        dockView.layer.shadowOpacity = isDark ? 0.45 : 0.18
        restorePill.layer.shadowColor = UIColor.black.cgColor

        dividerView.backgroundColor = isDark
            ? UIColor(white: 1.0, alpha: 0.18)
            : UIColor(white: 0.0, alpha: 0.14)

        let tintColor: UIColor = isDark ? .white : .label
        addButton.tintColor = UIColor(red: 0.15, green: 0.45, blue: 1.0, alpha: 1.0)
        addButton.backgroundColor = UIColor(red: 0.15, green: 0.45, blue: 1.0, alpha: isDark ? 0.25 : 0.12)
        reloadButton.tintColor = tintColor.withAlphaComponent(0.85)
        settingsButton.tintColor = tintColor.withAlphaComponent(0.85)
        fullscreenButton.tintColor = tintColor.withAlphaComponent(0.85)
        collapseButton.tintColor = tintColor.withAlphaComponent(0.85)

        restorePillButton.setTitleColor(isDark ? .white : .label, for: .normal)
        restorePillButton.tintColor = isDark ? .white : .label
    }

    // MARK: - Setup UI Elements
    private func setupLayout() {
        // 1. Container for WKWebViews
        containerView.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(containerView)

        // 2. Liquid Glass Dynamic Island Dock
        dockView.translatesAutoresizingMaskIntoConstraints = false
        dockView.layer.cornerRadius = 21
        dockView.layer.cornerCurve = .continuous
        dockView.layer.masksToBounds = false
        dockView.layer.shadowRadius = 16
        dockView.layer.shadowOffset = CGSize(width: 0, height: 4)
        dockView.layer.borderWidth = 0.65
        view.addSubview(dockView)

        let dockContentView = dockView.contentView
        dockContentView.layer.cornerRadius = 21
        dockContentView.layer.cornerCurve = .continuous
        dockContentView.clipsToBounds = true

        // 3. Scrollable Project Tabs inside Dock
        dockScrollView.translatesAutoresizingMaskIntoConstraints = false
        dockScrollView.showsHorizontalScrollIndicator = false
        dockContentView.addSubview(dockScrollView)

        dockStackView.translatesAutoresizingMaskIntoConstraints = false
        dockStackView.axis = .horizontal
        dockStackView.spacing = 6
        dockStackView.alignment = .center
        dockScrollView.addSubview(dockStackView)

        // 4. Subtle Vertical Divider
        dividerView.translatesAutoresizingMaskIntoConstraints = false
        dockContentView.addSubview(dividerView)

        // 5. Action Buttons Stack
        actionStackView.translatesAutoresizingMaskIntoConstraints = false
        actionStackView.axis = .horizontal
        actionStackView.spacing = 3
        actionStackView.alignment = .center
        dockContentView.addSubview(actionStackView)

        setupActionButton(addButton, iconName: "plus", action: #selector(handleAddWorkspace))
        setupActionButton(reloadButton, iconName: "arrow.clockwise", action: #selector(handleReloadActiveTab))
        setupActionButton(settingsButton, iconName: "textformat.size", action: #selector(handleSettingsTapped))
        setupActionButton(fullscreenButton, iconName: "arrow.up.left.and.arrow.down.right", action: #selector(toggleFullscreen))
        setupActionButton(collapseButton, iconName: "chevron.down", action: #selector(toggleDockMinimized))

        actionStackView.addArrangedSubview(addButton)
        actionStackView.addArrangedSubview(reloadButton)
        actionStackView.addArrangedSubview(settingsButton)
        actionStackView.addArrangedSubview(fullscreenButton)
        actionStackView.addArrangedSubview(collapseButton)

        // 6. Floating Mini Restore Pill (Shown in fullscreen / minimized)
        restorePill.translatesAutoresizingMaskIntoConstraints = false
        restorePill.layer.cornerRadius = 15
        restorePill.layer.cornerCurve = .continuous
        restorePill.layer.masksToBounds = false
        restorePill.layer.shadowRadius = 10
        restorePill.layer.shadowOffset = CGSize(width: 0, height: 3)
        restorePill.layer.shadowOpacity = 0.35
        restorePill.layer.borderWidth = 0.5
        restorePill.alpha = 0
        view.addSubview(restorePill)

        let pillContentView = restorePill.contentView
        pillContentView.layer.cornerRadius = 15
        pillContentView.layer.cornerCurve = .continuous
        pillContentView.clipsToBounds = true

        restorePillButton.translatesAutoresizingMaskIntoConstraints = false
        restorePillButton.titleLabel?.font = UIFont.systemFont(ofSize: 11, weight: .bold)
        restorePillButton.setImage(UIImage(systemName: "folder.fill"), for: .normal)
        restorePillButton.contentEdgeInsets = UIEdgeInsets(top: 5, left: 10, bottom: 5, right: 10)
        restorePillButton.addTarget(self, action: #selector(handleRestorePillTapped), for: .touchUpInside)
        pillContentView.addSubview(restorePillButton)

        let pillPan = UIPanGestureRecognizer(target: self, action: #selector(handlePillPan(_:)))
        restorePill.addGestureRecognizer(pillPan)

        // Setup Layout Constraints
        // CRITICAL ZERO-OVERLAP GUARANTEE: In normal mode, containerView.bottomAnchor is pinned
        // strictly to dockView.topAnchor so Google's chat box & buttons are NEVER covered!
        containerBottomToDockConstraint = containerView.bottomAnchor.constraint(equalTo: dockView.topAnchor, constant: -4)
        containerBottomToViewConstraint = containerView.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor)

        restorePillTrailingConstraint = restorePill.trailingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.trailingAnchor, constant: -12)
        restorePillBottomConstraint = restorePill.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor, constant: -10)

        NSLayoutConstraint.activate([
            // Container pinned directly below status bar
            containerView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            containerView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            containerView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            containerBottomToDockConstraint,

            // Dock pinned to bottom safe area with comfortable horizontal margins
            dockView.leadingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.leadingAnchor, constant: 8),
            dockView.trailingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.trailingAnchor, constant: -8),
            dockView.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor, constant: -3),
            dockView.heightAnchor.constraint(equalToConstant: 42),

            // Scrollable workspace tabs
            dockScrollView.leadingAnchor.constraint(equalTo: dockContentView.leadingAnchor, constant: 6),
            dockScrollView.trailingAnchor.constraint(equalTo: dividerView.leadingAnchor, constant: -5),
            dockScrollView.topAnchor.constraint(equalTo: dockContentView.topAnchor),
            dockScrollView.bottomAnchor.constraint(equalTo: dockContentView.bottomAnchor),

            dockStackView.leadingAnchor.constraint(equalTo: dockScrollView.leadingAnchor),
            dockStackView.trailingAnchor.constraint(equalTo: dockScrollView.trailingAnchor),
            dockStackView.topAnchor.constraint(equalTo: dockScrollView.topAnchor),
            dockStackView.bottomAnchor.constraint(equalTo: dockScrollView.bottomAnchor),
            dockStackView.heightAnchor.constraint(equalTo: dockScrollView.heightAnchor),

            // Vertical divider
            dividerView.trailingAnchor.constraint(equalTo: actionStackView.leadingAnchor, constant: -5),
            dividerView.centerYAnchor.constraint(equalTo: dockContentView.centerYAnchor),
            dividerView.widthAnchor.constraint(equalToConstant: 0.8),
            dividerView.heightAnchor.constraint(equalToConstant: 22),

            // Action buttons stack
            actionStackView.trailingAnchor.constraint(equalTo: dockContentView.trailingAnchor, constant: -6),
            actionStackView.centerYAnchor.constraint(equalTo: dockContentView.centerYAnchor),

            // Restore Pill
            restorePillTrailingConstraint,
            restorePillBottomConstraint,
            restorePill.heightAnchor.constraint(equalToConstant: 30),

            restorePillButton.topAnchor.constraint(equalTo: pillContentView.topAnchor),
            restorePillButton.bottomAnchor.constraint(equalTo: pillContentView.bottomAnchor),
            restorePillButton.leadingAnchor.constraint(equalTo: pillContentView.leadingAnchor),
            restorePillButton.trailingAnchor.constraint(equalTo: pillContentView.trailingAnchor)
        ])

        // Register keyboard observers to auto-hide dock during typing
        NotificationCenter.default.addObserver(self, selector: #selector(keyboardWillShow(_:)), name: UIResponder.keyboardWillShowNotification, object: nil)
        NotificationCenter.default.addObserver(self, selector: #selector(keyboardWillHide(_:)), name: UIResponder.keyboardWillHideNotification, object: nil)
    }

    private func setupActionButton(_ button: UIButton, iconName: String, action: Selector) {
        button.translatesAutoresizingMaskIntoConstraints = false
        button.setImage(UIImage(systemName: iconName), for: .normal)
        button.layer.cornerRadius = 13
        button.layer.cornerCurve = .continuous
        button.addTarget(self, action: action, for: .touchUpInside)
        NSLayoutConstraint.activate([
            button.widthAnchor.constraint(equalToConstant: 26),
            button.heightAnchor.constraint(equalToConstant: 26)
        ])
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
        updateRestorePillTitle()
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
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.backgroundColor = .systemBackground

        containerView.addSubview(webView)
        NSLayoutConstraint.activate([
            webView.topAnchor.constraint(equalTo: containerView.topAnchor),
            webView.leadingAnchor.constraint(equalTo: containerView.leadingAnchor),
            webView.trailingAnchor.constraint(equalTo: containerView.trailingAnchor),
            webView.bottomAnchor.constraint(equalTo: containerView.bottomAnchor)
        ])

        if let targetUrl = URL(string: ws.url) {
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
        updateRestorePillTitle()

        UIImpactFeedbackGenerator(style: .light).impactOccurred()
    }

    private func updateActiveVisibility() {
        for (wsId, wv) in webViews {
            let isActive = (wsId == activeWorkspaceId)
            wv.isHidden = !isActive
        }
    }

    private func updateRestorePillTitle() {
        if let active = workspaces.first(where: { $0.id == activeWorkspaceId }) {
            restorePillButton.setTitle(" \(active.name) ▴", for: .normal)
        } else {
            restorePillButton.setTitle(" Dự án ▴", for: .normal)
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
            button.titleLabel?.font = UIFont.systemFont(ofSize: 11, weight: isActive ? .bold : .medium)
            button.contentEdgeInsets = UIEdgeInsets(top: 4, left: 10, bottom: 4, right: 10)

            button.backgroundColor = isActive
                ? UIColor(red: 0.12, green: 0.45, blue: 1.0, alpha: 0.95)
                : (isDark ? UIColor(white: 1.0, alpha: 0.12) : UIColor(white: 0.0, alpha: 0.06))

            button.layer.cornerRadius = 12
            button.layer.cornerCurve = .continuous
            button.clipsToBounds = true

            if isActive {
                button.layer.shadowColor = UIColor(red: 0.15, green: 0.45, blue: 1.0, alpha: 0.55).cgColor
                button.layer.shadowOpacity = 0.6
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

    // MARK: - Toggle Expanded / Collapsed Dock
    @objc private func toggleDockMinimized() {
        isDockMinimized = true
        applyDockVisibilityState(animated: true)
    }

    @objc private func toggleFullscreen() {
        isFullscreen.toggle()
        applyDockVisibilityState(animated: true)
    }

    @objc private func handleRestorePillTapped() {
        isDockMinimized = false
        isFullscreen = false
        applyDockVisibilityState(animated: true)
    }

    private func applyDockVisibilityState(animated: Bool) {
        let shouldHide = isDockMinimized || isFullscreen

        let duration = animated ? 0.32 : 0.0
        UIView.animate(withDuration: duration, delay: 0, usingSpringWithDamping: 0.82, initialSpringVelocity: 0.4, options: .curveEaseInOut) {
            if shouldHide {
                self.containerBottomToDockConstraint.isActive = false
                self.containerBottomToViewConstraint.isActive = true
                self.dockView.alpha = 0
                self.dockView.transform = CGAffineTransform(translationX: 0, y: 35)
                self.restorePill.alpha = 0.85
                self.restorePill.transform = .identity
            } else {
                self.containerBottomToViewConstraint.isActive = false
                self.containerBottomToDockConstraint.isActive = true
                self.dockView.alpha = 1
                self.dockView.transform = .identity
                self.restorePill.alpha = 0
                self.restorePill.transform = CGAffineTransform(translationX: 0, y: 20)
            }
            self.view.layoutIfNeeded()
        }
        UIImpactFeedbackGenerator(style: .medium).impactOccurred()
    }

    // Drag mini restore pill anywhere along edges
    @objc private func handlePillPan(_ gesture: UIPanGestureRecognizer) {
        let translation = gesture.translation(in: view)

        if gesture.state == .changed {
            restorePillTrailingConstraint.constant += translation.x
            restorePillBottomConstraint.constant += translation.y
            gesture.setTranslation(.zero, in: view)
        } else if gesture.state == .ended {
            // Clamp pill inside safe bounds
            let maxTrailing = -6.0
            let minTrailing = -(view.bounds.width - restorePill.bounds.width - 12.0)
            let clampedTrailing = min(maxTrailing, max(minTrailing, Double(restorePillTrailingConstraint.constant)))

            let minBottom = -6.0
            let maxBottom = -(view.bounds.height - view.safeAreaInsets.top - view.safeAreaInsets.bottom - 60.0)
            let clampedBottom = min(minBottom, max(maxBottom, Double(restorePillBottomConstraint.constant)))

            UIView.animate(withDuration: 0.25, delay: 0, options: .curveEaseOut) {
                self.restorePillTrailingConstraint.constant = CGFloat(clampedTrailing)
                self.restorePillBottomConstraint.constant = CGFloat(clampedBottom)
                self.view.layoutIfNeeded()
            }
        }
    }

    // Keyboard handling: auto-hide dock during typing so nothing is obscured
    @objc private func keyboardWillShow(_ notification: Notification) {
        guard !isDockMinimized && !isFullscreen else { return }
        UIView.animate(withDuration: 0.22) {
            self.dockView.alpha = 0
        }
    }

    @objc private func keyboardWillHide(_ notification: Notification) {
        guard !isDockMinimized && !isFullscreen else { return }
        UIView.animate(withDuration: 0.22) {
            self.dockView.alpha = 1
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
                    self.updateRestorePillTitle()
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
        updateRestorePillTitle()
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

    // MARK: - Zoom & Font Size Settings
    @objc private func handleSettingsTapped() {
        let percent = Int(currentZoom * 100)
        let sheet = UIAlertController(
            title: "Cài Đặt Cỡ Chữ & Thu Phóng",
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
            sheet.addAction(UIAlertAction(title: "✏️ Đổi tên tab (\(active.name))", style: .default, handler: { _ in
                self.showRenameDialog(for: active)
            }))
        }

        sheet.addAction(UIAlertAction(title: "Hủy", style: .cancel))

        if let popover = sheet.popoverPresentationController {
            popover.sourceView = settingsButton
            popover.sourceRect = settingsButton.bounds
        }

        present(sheet, animated: true)
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

    // MARK: - WKNavigationDelegate
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        // Continuous cleaner script with MutationObserver: hides dev logo and eliminates extra header padding
        let script = """
        (function() {
            var style = document.createElement('style');
            style.id = 'ag-mobile-cleaner-v3';
            style.textContent = `
                header, nav, [role="banner"], [class*="header" i], [class*="topbar" i], .boqOnegoogleliteOgbOneGoogleBar, #gb {
                    padding-top: 0px !important;
                    margin-top: 0px !important;
                }
                [aria-label*="Antigravity" i], [title*="Antigravity" i] {
                    display: none !important;
                }
            `;
            if (!document.getElementById('ag-mobile-cleaner-v3')) {
                (document.head || document.documentElement).appendChild(style);
            }

            function removeDevLogo() {
                var candidates = document.querySelectorAll('svg, img, [role="img"], a, button');
                for (var i = 0; i < candidates.length; i++) {
                    var el = candidates[i];
                    var rect = el.getBoundingClientRect();
                    // Antigravity dev logo sits in the top-left area
                    if (rect.left >= 0 && rect.left < 60 && rect.top >= 0 && rect.top < 65 && rect.width > 12 && rect.width < 50) {
                        var text = (el.innerText || el.closest('button, [role="button"]')?.innerText || '');
                        if (!text.includes('DELL') && !text.includes('Sign')) {
                            var target = el.closest('a, button, div[role="button"]') || el;
                            target.style.setProperty('display', 'none', 'important');
                            target.style.setProperty('width', '0px', 'important');
                            target.style.setProperty('visibility', 'hidden', 'important');
                        }
                    }
                }
            }

            removeDevLogo();
            var observer = new MutationObserver(removeDevLogo);
            observer.observe(document.body || document.documentElement, { childList: true, subtree: true });
        })();
        """
        webView.evaluateJavaScript(script, completionHandler: nil)

        if currentZoom != 1.0 {
            applyZoom(currentZoom, to: webView)
        }
    }

    // MARK: - QRScannerDelegate
    func didScanWorkspace(url: String, customName: String?) {
        let parsed = WorkspaceStore.shared.parseGoogleRemoteUrl(url)

        if let existing = workspaces.first(where: { (parsed.sessionId != nil && $0.sessionId == parsed.sessionId) || $0.url == parsed.url }) {
            switchWorkspace(to: existing.id)
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
        if let clipboardText = UIPasteboard.general.string, !clipboardText.isEmpty {
            captureSession?.stopRunning()
            UIImpactFeedbackGenerator(style: .medium).impactOccurred()
            dismiss(animated: true) {
                self.delegate?.didScanWorkspace(url: clipboardText, customName: nil)
            }
        } else {
            let alert = UIAlertController(title: "Nhập Link Kết Nối", message: "Nhập URL Google Antigravity Remote:", preferredStyle: .alert)
            alert.addTextField { tf in
                tf.placeholder = "https://accounts.google.com/..."
            }
            alert.addAction(UIAlertAction(title: "Hủy", style: .cancel))
            alert.addAction(UIAlertAction(title: "Mở", style: .default, handler: { _ in
                if let text = alert.textFields?.first?.text?.trimmingCharacters(in: .whitespacesAndNewlines), !text.isEmpty {
                    self.captureSession?.stopRunning()
                    self.dismiss(animated: true) {
                        self.delegate?.didScanWorkspace(url: text, customName: nil)
                    }
                }
            }))
            present(alert, animated: true)
        }
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
