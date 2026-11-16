import UIKit
import WebKit
import AVFoundation
import QuickLook
import UserNotifications
import AudioToolbox

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
                let lower = list[i].url.lowercased()
                if lower.contains("3a713708-cef0-49ba-b842-af9504802f6a-v2") || lower.contains(".ipa") || lower.contains("/releases/download/") {
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
class AppDelegate: UIResponder, UIApplicationDelegate, UNUserNotificationCenterDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Configure UNUserNotificationCenter
        UNUserNotificationCenter.current().delegate = self
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) { granted, error in
            if let error = error {
                print("[Notification] Auth error: \(error.localizedDescription)")
            }
        }

        let win = UIWindow(frame: UIScreen.main.bounds)
        win.rootViewController = MainViewController()
        win.makeKeyAndVisible()
        self.window = win
        return true
    }

    func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification, withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        if #available(iOS 14.0, *) {
            completionHandler([.banner, .sound, .badge])
        } else {
            completionHandler([.alert, .sound, .badge])
        }
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        return true
    }
}

// MARK: - Main Container View Controller
class MainViewController: UIViewController, WKNavigationDelegate, WKUIDelegate, QRScannerDelegate, WKScriptMessageHandler {

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
    private let backButton = UIButton(type: .system)
    private let addButton = UIButton(type: .system)
    private let reloadButton = UIButton(type: .system)
    private let ipaButton = UIButton(type: .system)
    private let settingsButton = UIButton(type: .system)
    private let fullscreenButton = UIButton(type: .system)
    private let restoreButton = UIButton(type: .system)

    // Completion Toast Banner
    private let toastBannerView = UIView()
    private let toastIconView = UIImageView()
    private let toastTitleLabel = UILabel()
    private let toastMessageLabel = UILabel()
    private var toastHideTimer: Timer?

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

        DownloadManager.shared.onActiveCountChanged = { [weak self] count in
            DispatchQueue.main.async {
                self?.updateDockDownloadBadge(activeCount: count)
            }
        }
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
        backButton.tintColor = tintColor.withAlphaComponent(0.85)
        addButton.tintColor = UIColor(red: 0.15, green: 0.45, blue: 1.0, alpha: 1.0)
        addButton.backgroundColor = UIColor(red: 0.15, green: 0.45, blue: 1.0, alpha: isDark ? 0.22 : 0.12)
        reloadButton.tintColor = tintColor.withAlphaComponent(0.85)
        ipaButton.tintColor = tintColor.withAlphaComponent(0.85)
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

        setupActionButton(backButton, iconName: "chevron.backward", action: #selector(handleGoBack))
        let longPressBack = UILongPressGestureRecognizer(target: self, action: #selector(handleBackLongPressed(_:)))
        backButton.addGestureRecognizer(longPressBack)

        setupActionButton(addButton, iconName: "plus", action: #selector(handleAddWorkspace))
        setupActionButton(reloadButton, iconName: "arrow.clockwise", action: #selector(handleReloadActiveTab))
        setupActionButton(ipaButton, iconName: "arrow.down.circle", action: #selector(handleIpaManagerTapped))
        setupActionButton(settingsButton, iconName: "gearshape", action: #selector(handleSettingsTapped))
        setupActionButton(fullscreenButton, iconName: "arrow.up.left.and.arrow.down.right", action: #selector(toggleFullscreen))

        actionStackView.addArrangedSubview(backButton)
        actionStackView.addArrangedSubview(addButton)
        actionStackView.addArrangedSubview(reloadButton)
        actionStackView.addArrangedSubview(ipaButton)
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

        // 7. Toast Banner View (Conversation Finished Notification)
        toastBannerView.translatesAutoresizingMaskIntoConstraints = false
        toastBannerView.backgroundColor = UIColor(red: 0.08, green: 0.12, blue: 0.16, alpha: 0.95)
        toastBannerView.layer.cornerRadius = 24
        toastBannerView.layer.cornerCurve = .continuous
        toastBannerView.layer.borderColor = UIColor(red: 0.20, green: 0.78, blue: 0.45, alpha: 0.5).cgColor
        toastBannerView.layer.borderWidth = 1
        toastBannerView.layer.shadowColor = UIColor.black.cgColor
        toastBannerView.layer.shadowOpacity = 0.35
        toastBannerView.layer.shadowRadius = 12
        toastBannerView.layer.shadowOffset = CGSize(width: 0, height: 4)
        toastBannerView.alpha = 0
        toastBannerView.isUserInteractionEnabled = true
        let toastTap = UITapGestureRecognizer(target: self, action: #selector(handleToastTapped))
        toastBannerView.addGestureRecognizer(toastTap)
        view.addSubview(toastBannerView)

        toastIconView.translatesAutoresizingMaskIntoConstraints = false
        toastIconView.image = UIImage(systemName: "checkmark.circle.fill")
        toastIconView.tintColor = UIColor(red: 0.20, green: 0.78, blue: 0.45, alpha: 1.0)
        toastIconView.contentMode = .scaleAspectFit
        toastBannerView.addSubview(toastIconView)

        toastTitleLabel.translatesAutoresizingMaskIntoConstraints = false
        toastTitleLabel.text = "Hội Thoại Hoàn Thành! 🎉"
        toastTitleLabel.font = UIFont.systemFont(ofSize: 13, weight: .bold)
        toastTitleLabel.textColor = .white
        toastBannerView.addSubview(toastTitleLabel)

        toastMessageLabel.translatesAutoresizingMaskIntoConstraints = false
        toastMessageLabel.text = "Phản hồi và tác vụ đã được xử lý xong."
        toastMessageLabel.font = UIFont.systemFont(ofSize: 11, weight: .regular)
        toastMessageLabel.textColor = UIColor.white.withAlphaComponent(0.85)
        toastBannerView.addSubview(toastMessageLabel)

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

            backButton.widthAnchor.constraint(equalToConstant: 30),
            backButton.heightAnchor.constraint(equalToConstant: 30),
            addButton.widthAnchor.constraint(equalToConstant: 30),
            addButton.heightAnchor.constraint(equalToConstant: 30),
            reloadButton.widthAnchor.constraint(equalToConstant: 30),
            reloadButton.heightAnchor.constraint(equalToConstant: 30),
            ipaButton.widthAnchor.constraint(equalToConstant: 30),
            ipaButton.heightAnchor.constraint(equalToConstant: 30),
            settingsButton.widthAnchor.constraint(equalToConstant: 30),
            settingsButton.heightAnchor.constraint(equalToConstant: 30),
            fullscreenButton.widthAnchor.constraint(equalToConstant: 30),
            fullscreenButton.heightAnchor.constraint(equalToConstant: 30),

            // Restore button
            restoreButton.trailingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.trailingAnchor, constant: -16),
            restoreButton.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor, constant: -16),
            restoreButton.widthAnchor.constraint(equalToConstant: 40),
            restoreButton.heightAnchor.constraint(equalToConstant: 40),

            // Toast banner constraints
            toastBannerView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 8),
            toastBannerView.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            toastBannerView.leadingAnchor.constraint(greaterThanOrEqualTo: view.leadingAnchor, constant: 16),
            toastBannerView.trailingAnchor.constraint(lessThanOrEqualTo: view.trailingAnchor, constant: -16),
            toastBannerView.heightAnchor.constraint(equalToConstant: 48),

            toastIconView.leadingAnchor.constraint(equalTo: toastBannerView.leadingAnchor, constant: 14),
            toastIconView.centerYAnchor.constraint(equalTo: toastBannerView.centerYAnchor),
            toastIconView.widthAnchor.constraint(equalToConstant: 24),
            toastIconView.heightAnchor.constraint(equalToConstant: 24),

            toastTitleLabel.topAnchor.constraint(equalTo: toastBannerView.topAnchor, constant: 8),
            toastTitleLabel.leadingAnchor.constraint(equalTo: toastIconView.trailingAnchor, constant: 10),
            toastTitleLabel.trailingAnchor.constraint(equalTo: toastBannerView.trailingAnchor, constant: -14),

            toastMessageLabel.topAnchor.constraint(equalTo: toastTitleLabel.bottomAnchor, constant: 2),
            toastMessageLabel.leadingAnchor.constraint(equalTo: toastIconView.trailingAnchor, constant: 10),
            toastMessageLabel.trailingAnchor.constraint(equalTo: toastBannerView.trailingAnchor, constant: -14)
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
        config.userContentController.add(self, name: "antigravityNative")

        let watcherScriptSource = """
        (function() {
            if (window.__agCompletionWatcherActive) return;
            window.__agCompletionWatcherActive = true;

            let isBusy = false;
            let busyStartTime = 0;
            let lastTitle = '';

            function detectBusyState() {
                const text = document.body ? document.body.innerText : '';
                const hasRunningText = /\\b\\d+\\s+tasks?\\s+running\\b/i.test(text) ||
                                       /\\b(thinking|generating response|executing|working\\.\\.\\.)\\b/i.test(text);

                const stopBtn = document.querySelector('button[aria-label*="Stop" i], button[title*="Stop" i], button[aria-label*="Dừng" i], button[data-testid*="stop" i]');
                const hasBusyAttr = !!document.querySelector('[aria-busy="true"], [role="progressbar"]');

                return hasRunningText || !!stopBtn || hasBusyAttr;
            }

            function check() {
                const currentlyBusy = detectBusyState();

                if (currentlyBusy) {
                    if (!isBusy) {
                        isBusy = true;
                        busyStartTime = Date.now();
                        const h = document.querySelector('h1, h2, [role="heading"], .conversation-title');
                        lastTitle = h ? h.textContent.trim() : document.title;
                    }
                } else {
                    if (isBusy) {
                        const elapsed = Date.now() - busyStartTime;
                        isBusy = false;
                        if (elapsed >= 2500) {
                            if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.antigravityNative) {
                                window.webkit.messageHandlers.antigravityNative.postMessage({
                                    action: 'conversationFinished',
                                    title: lastTitle || document.title || 'Hội thoại Antigravity'
                                });
                            }
                        }
                    }
                }
            }

            setInterval(check, 800);
        })();
        """

        let watcherUserScript = WKUserScript(source: watcherScriptSource, injectionTime: .atDocumentEnd, forMainFrameOnly: false)
        config.userContentController.addUserScript(watcherUserScript)

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
    // MARK: - Navigation History (Back Button)
    @objc private func handleGoBack() {
        UIImpactFeedbackGenerator(style: .light).impactOccurred()
        if let activeWv = webViews[activeWorkspaceId] {
            if activeWv.canGoBack {
                activeWv.goBack()
            } else {
                UIImpactFeedbackGenerator(style: .rigid).impactOccurred()
            }
        }
    }

    @objc private func handleBackLongPressed(_ gesture: UILongPressGestureRecognizer) {
        guard gesture.state == .began, let activeWv = webViews[activeWorkspaceId] else { return }
        let backList = activeWv.backForwardList.backList
        guard !backList.isEmpty else { return }

        let sheet = UIAlertController(title: "Lịch Sử Trang Trước", message: "Chạm để quay lại trang mong muốn:", preferredStyle: .actionSheet)
        for item in backList.suffix(6).reversed() {
            let title = (item.title?.isEmpty == false) ? item.title! : item.url.absoluteString
            sheet.addAction(UIAlertAction(title: title, style: .default, handler: { _ in
                activeWv.go(to: item)
            }))
        }
        sheet.addAction(UIAlertAction(title: "Hủy", style: .cancel))
        if let popover = sheet.popoverPresentationController {
            popover.sourceView = backButton
            popover.sourceRect = backButton.bounds
        }
        present(sheet, animated: true)
    }

    // MARK: - Conversation Completion Notification
    private func triggerConversationFinishedNotification(title: String) {
        let isEnabled = UserDefaults.standard.object(forKey: "ag_notifications_enabled") as? Bool ?? true
        guard isEnabled else { return }

        // 1. Success Haptics
        UINotificationFeedbackGenerator().notificationOccurred(.success)

        // 2. Play subtle notification chime
        AudioServicesPlaySystemSound(1025)

        // 3. Show Animated In-App Banner
        showToastBanner(
            title: "Hội Thoại Hoàn Thành! 🎉",
            message: title.isEmpty ? "Phản hồi và tác vụ đã được xử lý xong." : title
        )

        // 4. Fire Local Notification (for Background/Lockscreen or Banner)
        let content = UNMutableNotificationContent()
        content.title = "Antigravity Mobile 🎉"
        content.body = title.isEmpty ? "Hội thoại đã có kết quả! Chạm để xem chi tiết." : "Đã hoàn thành: \(title)"
        content.sound = .default
        content.badge = 1

        let request = UNNotificationRequest(identifier: UUID().uuidString, content: content, trigger: nil)
        UNUserNotificationCenter.current().add(request, withCompletionHandler: nil)
    }

    private func showToastBanner(title: String, message: String) {
        toastTitleLabel.text = title
        toastMessageLabel.text = message

        toastHideTimer?.invalidate()
        toastBannerView.transform = CGAffineTransform(translationX: 0, y: -50)

        UIView.animate(withDuration: 0.45, delay: 0, usingSpringWithDamping: 0.72, initialSpringVelocity: 0.6, options: .curveEaseOut) {
            self.toastBannerView.alpha = 1
            self.toastBannerView.transform = .identity
        }

        toastHideTimer = Timer.scheduledTimer(withTimeInterval: 4.0, repeats: false) { [weak self] _ in
            guard let self = self else { return }
            UIView.animate(withDuration: 0.35, delay: 0, options: .curveEaseIn) {
                self.toastBannerView.alpha = 0
                self.toastBannerView.transform = CGAffineTransform(translationX: 0, y: -50)
            }
        }
    }

    @objc private func handleToastTapped() {
        UIImpactFeedbackGenerator(style: .light).impactOccurred()
        toastHideTimer?.invalidate()
        UIView.animate(withDuration: 0.25) {
            self.toastBannerView.alpha = 0
            self.toastBannerView.transform = CGAffineTransform(translationX: 0, y: -50)
        }
    }
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

        sheet.addAction(UIAlertAction(title: "◀️ Quay lại trang trước", style: .default, handler: { _ in
            self.handleGoBack()
        }))

        let notifEnabled = UserDefaults.standard.object(forKey: "ag_notifications_enabled") as? Bool ?? true
        sheet.addAction(UIAlertAction(title: notifEnabled ? "🔔 Thông Báo Hoàn Thành: ĐANG BẬT" : "🔕 Thông Báo Hoàn Thành: ĐANG TẮT", style: .default, handler: { _ in
            let newState = !notifEnabled
            UserDefaults.standard.set(newState, forKey: "ag_notifications_enabled")
            UIImpactFeedbackGenerator(style: .medium).impactOccurred()
        }))

        sheet.addAction(UIAlertAction(title: "🎉 Thử nghiệm chuông & thông báo ngay", style: .default, handler: { _ in
            self.triggerConversationFinishedNotification(title: "Thử nghiệm: Xây Dựng Ứng Dụng Antigravity Mobile")
        }))

        sheet.addAction(UIAlertAction(title: "🔑 Đăng nhập tài khoản Google", style: .default, handler: { _ in
            self.navigateToGoogleLogin()
        }))

        sheet.addAction(UIAlertAction(title: "🔄 Tải lại trang này", style: .default, handler: { _ in
            self.handleReloadActiveTab()
        }))

        sheet.addAction(UIAlertAction(title: "📥 Trình Quản Lý Tải Về & Tệp (Safari Style)", style: .default, handler: { _ in
            self.handleIpaManagerTapped()
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

    private func updateDockDownloadBadge(activeCount: Int) {
        if activeCount > 0 {
            ipaButton.setImage(UIImage(systemName: "arrow.down.circle.fill"), for: .normal)
            ipaButton.tintColor = UIColor(red: 0.15, green: 0.45, blue: 1.0, alpha: 1.0)
        } else {
            ipaButton.setImage(UIImage(systemName: "arrow.down.circle"), for: .normal)
            let isDark = traitCollection.userInterfaceStyle == .dark
            ipaButton.tintColor = (isDark ? UIColor.white : UIColor.label).withAlphaComponent(0.85)
        }
    }

    // MARK: - IPA Download & Sideload Manager
    @objc private func handleIpaManagerTapped() {
        UIImpactFeedbackGenerator(style: .medium).impactOccurred()

        // Recover active webView if it was navigated to an IPA file URL (e.g. showing raw PK... binary text)
        if let activeWs = workspaces.first(where: { $0.id == activeWorkspaceId }),
           let wv = webViews[activeWorkspaceId] {
            let curUrl = wv.url?.absoluteString.lowercased() ?? ""
            if curUrl.contains(".ipa") || curUrl.contains("/releases/download/") {
                let clean = activeWs.url.trimmingCharacters(in: .whitespacesAndNewlines)
                if let targetUrl = URL(string: clean) ?? URL(string: clean.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? "") {
                    wv.load(URLRequest(url: targetUrl))
                }
            }
        }

        let ipaVC = IPAManagerViewController()
        let nav = UINavigationController(rootViewController: ipaVC)
        if #available(iOS 15.0, *) {
            if let sheet = nav.sheetPresentationController {
                sheet.detents = [.medium(), .large()]
                sheet.prefersGrabberVisible = true
                sheet.preferredCornerRadius = 24
            }
        }
        present(nav, animated: true)
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

    // MARK: - WKScriptMessageHandler
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        if message.name == "antigravityNative" {
            if let body = message.body as? [String: Any], let action = body["action"] as? String {
                if action == "openIpaManager" || action == "openDownloadManager" {
                    handleIpaManagerTapped()
                } else if action == "downloadUrl", let urlStr = body["url"] as? String, let url = URL(string: urlStr) {
                    let filename = body["filename"] as? String
                    DownloadManager.shared.startDownload(url: url, customFilename: filename)
                    handleIpaManagerTapped()
                } else if action == "conversationFinished" {
                    let title = body["title"] as? String ?? ""
                    DispatchQueue.main.async {
                        self.triggerConversationFinishedNotification(title: title)
                    }
                }
            } else if let action = message.body as? String {
                if action == "openIpaManager" || action == "openDownloadManager" {
                    handleIpaManagerTapped()
                } else if action == "goBack" {
                    DispatchQueue.main.async {
                        self.handleGoBack()
                    }
                }
            }
        }
    }

    private func isDownloadableUrl(_ url: URL?) -> (isDownload: Bool, suggestedFilename: String) {
        guard let url = url else { return (false, "") }
        let str = url.absoluteString.lowercased()

        let extensions = [".ipa", ".zip", ".deb", ".tar", ".gz", ".tgz", ".7z", ".rar", ".dmg", ".pkg", ".pdf", ".apk", ".dylib", ".mobileconfig"]
        for ext in extensions {
            if str.hasSuffix(ext) || str.contains("\(ext)?") || str.contains("\(ext)&") {
                let name = url.lastPathComponent.isEmpty ? "file\(ext)" : url.lastPathComponent
                return (true, name)
            }
        }

        if str.contains("/releases/download/") {
            let name = url.lastPathComponent.isEmpty ? "release_file" : url.lastPathComponent
            return (true, name)
        }

        if url.scheme == "antigravity" && url.host == "ipa" {
            return (true, "AntigravityMobile.ipa")
        }

        return (false, "")
    }

    private func promptSafariDownload(url: URL, suggestedFilename: String) {
        UIImpactFeedbackGenerator(style: .medium).impactOccurred()
        let cleanName = (suggestedFilename.removingPercentEncoding ?? suggestedFilename).trimmingCharacters(in: .whitespacesAndNewlines)
        let displayName = cleanName.isEmpty ? "tep_tai_ve" : cleanName

        let alert = UIAlertController(
            title: "Tải Tệp Về",
            message: "Bạn có muốn tải về \"\(displayName)\" không?",
            preferredStyle: .alert
        )

        alert.addAction(UIAlertAction(title: "Hủy", style: .cancel))

        alert.addAction(UIAlertAction(title: "Tải Về", style: .default, handler: { _ in
            DownloadManager.shared.startDownload(url: url, customFilename: displayName)
            self.showDownloadStartedToast(filename: displayName)
        }))

        present(alert, animated: true)
    }

    private func showDownloadStartedToast(filename: String) {
        let toast = UIAlertController(
            title: "Đang Bắt Đầu Tải 📥",
            message: "Tệp \"\(filename)\" đang được tải ngầm. Bạn có thể mở Trình Quản Lý Tải Về trên Dock để xem tiến trình.",
            preferredStyle: .actionSheet
        )
        toast.addAction(UIAlertAction(title: "Mở Trình Quản Lý Tải Về", style: .default, handler: { _ in
            self.handleIpaManagerTapped()
        }))
        toast.addAction(UIAlertAction(title: "Đóng", style: .cancel))
        if let popover = toast.popoverPresentationController {
            popover.sourceView = dockContainerView
            popover.sourceRect = dockContainerView.bounds
        }
        present(toast, animated: true)
    }

    // MARK: - WKNavigationDelegate & WKUIDelegate
    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        if let url = navigationAction.request.url {
            let check = isDownloadableUrl(url)
            if check.isDownload {
                decisionHandler(.cancel)
                DispatchQueue.main.async {
                    self.promptSafariDownload(url: url, suggestedFilename: check.suggestedFilename)
                }
                return
            }
        }
        decisionHandler(.allow)
    }

    func webView(_ webView: WKWebView, decidePolicyFor navigationResponse: WKNavigationResponse, decisionHandler: @escaping (WKNavigationResponsePolicy) -> Void) {
        if let url = navigationResponse.response.url {
            let check = isDownloadableUrl(url)
            if check.isDownload {
                decisionHandler(.cancel)
                let name = navigationResponse.response.suggestedFilename ?? check.suggestedFilename
                DispatchQueue.main.async {
                    self.promptSafariDownload(url: url, suggestedFilename: name)
                }
                return
            }
        }

        let mime = navigationResponse.response.mimeType?.lowercased() ?? ""
        let filename = navigationResponse.response.suggestedFilename ?? "file"
        if mime == "application/x-itunes-ipa" || mime == "application/octet-stream" || mime == "application/zip" || mime == "application/x-debian-package" {
            if filename.lowercased().hasSuffix(".ipa") || filename.lowercased().hasSuffix(".zip") || filename.lowercased().hasSuffix(".deb") || mime == "application/x-itunes-ipa" {
                decisionHandler(.cancel)
                if let url = navigationResponse.response.url {
                    DispatchQueue.main.async {
                        self.promptSafariDownload(url: url, suggestedFilename: filename)
                    }
                }
                return
            }
        }

        if let httpResponse = navigationResponse.response as? HTTPURLResponse {
            if httpResponse.statusCode == 403 {
                DispatchQueue.main.async {
                    self.showAccessDeniedBanner()
                }
            }
        }
        decisionHandler(.allow)
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        // Safe navigation finish: apply zoom without destroying Google DOM
        if currentZoom != 1.0 {
            applyZoom(currentZoom, to: webView)
        }
    }

    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        print("[WKWebView] didFailProvisionalNavigation: \(error.localizedDescription)")
    }

    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        print("[WKWebView] didFail: \(error.localizedDescription)")
    }

    func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration, for navigationAction: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
        if let url = navigationAction.request.url {
            let check = isDownloadableUrl(url)
            if check.isDownload {
                DispatchQueue.main.async {
                    self.promptSafariDownload(url: url, suggestedFilename: check.suggestedFilename)
                }
                return nil
            }
        }
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

// MARK: - Safari-Style Download Manager Helper Extensions
extension Int64 {
    var formattedFileSize: String {
        guard self > 0 else { return "0 KB" }
        let bcf = ByteCountFormatter()
        bcf.allowedUnits = [.useAll]
        bcf.countStyle = .file
        return bcf.string(fromByteCount: self)
    }
}

extension Date {
    var relativeDisplay: String {
        let df = DateFormatter()
        df.locale = Locale(identifier: "vi_VN")
        if Calendar.current.isDateInToday(self) {
            df.dateFormat = "'Hôm nay,' HH:mm"
        } else if Calendar.current.isDateInYesterday(self) {
            df.dateFormat = "'Hôm qua,' HH:mm"
        } else {
            df.dateFormat = "dd/MM/yyyy HH:mm"
        }
        return df.string(from: self)
    }
}

// MARK: - Download Item Model
struct DownloadItem: Codable {
    var id: String
    var url: String
    var filename: String
    var fileSize: Int64
    var downloadDate: Date
    var isIpa: Bool {
        return filename.lowercased().hasSuffix(".ipa")
    }
}

// MARK: - Safari-Style Download Manager Service (Singleton)
class DownloadManager: NSObject, URLSessionDownloadDelegate {
    static let shared = DownloadManager()

    private let keyDownloads = "ag_downloaded_items_v3"
    private(set) var items: [DownloadItem] = []

    struct ActiveDownload {
        var id: String
        var url: URL
        var filename: String
        var task: URLSessionDownloadTask
        var progress: Float
        var bytesWritten: Int64
        var totalBytesExpected: Int64
    }

    private(set) var activeDownloads: [String: ActiveDownload] = [:]

    var onDownloadsUpdated: (() -> Void)?
    var onProgressUpdated: ((String, Float, Int64, Int64) -> Void)?
    var onActiveCountChanged: ((Int) -> Void)?

    private lazy var urlSession: URLSession = {
        let config = URLSessionConfiguration.default
        return URLSession(configuration: config, delegate: self, delegateQueue: .main)
    }()

    var downloadsDirectory: URL {
        let docs = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        let dir = docs.appendingPathComponent("Downloads", isDirectory: true)
        if !FileManager.default.fileExists(atPath: dir.path) {
            try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true, attributes: nil)
        }
        return dir
    }

    override init() {
        super.init()
        loadItems()
        scanDirectory()
    }

    func loadItems() {
        if let data = UserDefaults.standard.data(forKey: keyDownloads),
           let list = try? JSONDecoder().decode([DownloadItem].self, from: data) {
            self.items = list
        }
    }

    func saveItems() {
        if let data = try? JSONEncoder().encode(items) {
            UserDefaults.standard.set(data, forKey: keyDownloads)
        }
    }

    func scanDirectory() {
        let fm = FileManager.default
        let docs = fm.urls(for: .documentDirectory, in: .userDomainMask)[0]
        var foundItems: [DownloadItem] = []
        var existingNames = Set<String>()

        // 1. Scan Downloads/ directory
        if let contents = try? fm.contentsOfDirectory(at: downloadsDirectory, includingPropertiesForKeys: [.fileSizeKey, .contentModificationDateKey]) {
            for fileUrl in contents {
                let name = fileUrl.lastPathComponent
                if name.hasPrefix(".") { continue }
                existingNames.insert(name)
                let attrs = try? fm.attributesOfItem(atPath: fileUrl.path)
                let size = (attrs?[.size] as? Int64) ?? 0
                let date = (attrs?[.modificationDate] as? Date) ?? Date()

                if let existing = items.first(where: { $0.filename == name }) {
                    foundItems.append(DownloadItem(id: existing.id, url: existing.url, filename: name, fileSize: size > 0 ? size : existing.fileSize, downloadDate: existing.downloadDate))
                } else {
                    foundItems.append(DownloadItem(id: UUID().uuidString, url: "", filename: name, fileSize: size, downloadDate: date))
                }
            }
        }

        // 2. Scan root Documents/ (e.g. AntigravityMobile.ipa from previous builds)
        if let rootContents = try? fm.contentsOfDirectory(at: docs, includingPropertiesForKeys: [.fileSizeKey, .contentModificationDateKey]) {
            for fileUrl in rootContents {
                let name = fileUrl.lastPathComponent
                if name.hasPrefix(".") || name == "Downloads" { continue }
                if name.lowercased().hasSuffix(".ipa") || name.lowercased().hasSuffix(".zip") {
                    if !existingNames.contains(name) {
                        existingNames.insert(name)
                        let attrs = try? fm.attributesOfItem(atPath: fileUrl.path)
                        let size = (attrs?[.size] as? Int64) ?? 0
                        let date = (attrs?[.modificationDate] as? Date) ?? Date()
                        foundItems.append(DownloadItem(id: UUID().uuidString, url: "", filename: name, fileSize: size, downloadDate: date))
                    }
                }
            }
        }

        foundItems.sort(by: { $0.downloadDate > $1.downloadDate })
        self.items = foundItems
        saveItems()
        onDownloadsUpdated?()
    }

    func getFileUrl(for item: DownloadItem) -> URL {
        let inDownloads = downloadsDirectory.appendingPathComponent(item.filename)
        if FileManager.default.fileExists(atPath: inDownloads.path) {
            return inDownloads
        }
        let inDocs = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0].appendingPathComponent(item.filename)
        if FileManager.default.fileExists(atPath: inDocs.path) {
            return inDocs
        }
        return inDownloads
    }

    func startDownload(url: URL, customFilename: String? = nil) {
        let id = UUID().uuidString
        var rawName = customFilename ?? url.lastPathComponent
        if rawName.isEmpty || rawName == "/" {
            rawName = "file_\(Int(Date().timeIntervalSince1970))"
            if url.absoluteString.lowercased().contains(".ipa") {
                rawName += ".ipa"
            }
        }
        if let qIdx = rawName.firstIndex(of: "?") {
            rawName = String(rawName[..<qIdx])
        }

        var request = URLRequest(url: url)
        request.setValue("Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1", forHTTPHeaderField: "User-Agent")
        request.setValue("application/octet-stream, */*", forHTTPHeaderField: "Accept")

        let task = urlSession.downloadTask(with: request)
        let active = ActiveDownload(
            id: id,
            url: url,
            filename: rawName,
            task: task,
            progress: 0.0,
            bytesWritten: 0,
            totalBytesExpected: 0
        )
        activeDownloads[id] = active
        task.resume()

        onDownloadsUpdated?()
        onActiveCountChanged?(activeDownloads.count)
    }

    func cancelDownload(id: String) {
        if let active = activeDownloads[id] {
            active.task.cancel()
            activeDownloads.removeValue(forKey: id)
            onDownloadsUpdated?()
            onActiveCountChanged?(activeDownloads.count)
        }
    }

    func deleteItem(_ item: DownloadItem) {
        let url = getFileUrl(for: item)
        try? FileManager.default.removeItem(at: url)
        items.removeAll(where: { $0.id == item.id })
        saveItems()
        onDownloadsUpdated?()
    }

    func renameItem(_ item: DownloadItem, newName: String) -> Bool {
        let cleanName = newName.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !cleanName.isEmpty else { return false }
        var targetName = cleanName
        if item.isIpa && !targetName.lowercased().hasSuffix(".ipa") {
            targetName += ".ipa"
        }

        let oldUrl = getFileUrl(for: item)
        let newUrl = downloadsDirectory.appendingPathComponent(targetName)
        do {
            try FileManager.default.moveItem(at: oldUrl, to: newUrl)
            if let idx = items.firstIndex(where: { $0.id == item.id }) {
                items[idx].filename = targetName
                saveItems()
                onDownloadsUpdated?()
            }
            return true
        } catch {
            return false
        }
    }

    func clearAll() {
        for item in items {
            let url = getFileUrl(for: item)
            try? FileManager.default.removeItem(at: url)
        }
        items.removeAll()
        saveItems()
        onDownloadsUpdated?()
    }

    // URLSessionDownloadDelegate
    func urlSession(_ session: URLSession, downloadTask: URLSessionDownloadTask, didWriteData bytesWritten: Int64, totalBytesWritten: Int64, totalBytesExpectedToWrite: Int64) {
        guard let entry = activeDownloads.first(where: { $0.value.task == downloadTask }) else { return }
        let id = entry.key
        let progress = totalBytesExpectedToWrite > 0 ? Float(totalBytesWritten) / Float(totalBytesExpectedToWrite) : 0.0

        activeDownloads[id]?.progress = progress
        activeDownloads[id]?.bytesWritten = totalBytesWritten
        activeDownloads[id]?.totalBytesExpected = totalBytesExpectedToWrite

        DispatchQueue.main.async {
            self.onProgressUpdated?(id, progress, totalBytesWritten, totalBytesExpectedToWrite)
        }
    }

    func urlSession(_ session: URLSession, downloadTask: URLSessionDownloadTask, didFinishDownloadingTo location: URL) {
        guard let entry = activeDownloads.first(where: { $0.value.task == downloadTask }) else { return }
        let active = entry.value
        let fm = FileManager.default

        var destUrl = downloadsDirectory.appendingPathComponent(active.filename)
        var counter = 1
        let baseName = (active.filename as NSString).deletingPathExtension
        let ext = (active.filename as NSString).pathExtension
        while fm.fileExists(atPath: destUrl.path) {
            let altName = ext.isEmpty ? "\(baseName)_\(counter)" : "\(baseName)_\(counter).\(ext)"
            destUrl = downloadsDirectory.appendingPathComponent(altName)
            counter += 1
        }

        do {
            try fm.moveItem(at: location, to: destUrl)
            let attrs = try fm.attributesOfItem(atPath: destUrl.path)
            let size = (attrs[.size] as? Int64) ?? 0

            let newItem = DownloadItem(
                id: UUID().uuidString,
                url: active.url.absoluteString,
                filename: destUrl.lastPathComponent,
                fileSize: size,
                downloadDate: Date()
            )

            DispatchQueue.main.async {
                self.items.insert(newItem, at: 0)
                self.activeDownloads.removeValue(forKey: active.id)
                self.saveItems()
                self.onDownloadsUpdated?()
                self.onActiveCountChanged?(self.activeDownloads.count)
                UINotificationFeedbackGenerator().notificationOccurred(.success)
            }
        } catch {
            DispatchQueue.main.async {
                self.activeDownloads.removeValue(forKey: active.id)
                self.onDownloadsUpdated?()
                self.onActiveCountChanged?(self.activeDownloads.count)
            }
        }
    }

    func urlSession(_ session: URLSession, task: URLSessionTask, didCompleteWithError error: Error?) {
        guard let task = task as? URLSessionDownloadTask,
              let entry = activeDownloads.first(where: { $0.value.task == task }) else { return }
        DispatchQueue.main.async {
            self.activeDownloads.removeValue(forKey: entry.key)
            self.onDownloadsUpdated?()
            self.onActiveCountChanged?(self.activeDownloads.count)
        }
    }
}

// MARK: - Safari-Style Download & File Manager View Controller
class SafariDownloadManagerViewController: UIViewController, UITableViewDataSource, UITableViewDelegate, QLPreviewControllerDataSource {

    private let tableView = UITableView(frame: .zero, style: .insetGrouped)
    private var previewItemUrl: URL?

    private let directAntigravityIpaUrl = URL(string: "https://github.com/nhdien07122012/antigravity-app/releases/download/latest/AntigravityMobile.ipa")!

    override func viewDidLoad() {
        super.viewDidLoad()
        title = "Tải Về & Tệp"
        view.backgroundColor = .systemGroupedBackground

        setupNavigationBar()
        setupTableView()
        setupHeaderCards()

        DownloadManager.shared.onDownloadsUpdated = { [weak self] in
            DispatchQueue.main.async {
                self?.tableView.reloadData()
            }
        }

        DownloadManager.shared.onProgressUpdated = { [weak self] id, progress, written, total in
            DispatchQueue.main.async {
                self?.updateProgressForActiveDownload(id: id, progress: progress, written: written, total: total)
            }
        }

        DownloadManager.shared.scanDirectory()
    }

    private func setupNavigationBar() {
        navigationItem.rightBarButtonItem = UIBarButtonItem(
            title: "Xong",
            style: .done,
            target: self,
            action: #selector(handleClose)
        )

        navigationItem.leftBarButtonItem = UIBarButtonItem(
            title: "Dọn Dẹp",
            style: .plain,
            target: self,
            action: #selector(handleClearAll)
        )
    }

    private func setupTableView() {
        tableView.translatesAutoresizingMaskIntoConstraints = false
        tableView.dataSource = self
        tableView.delegate = self
        tableView.register(UITableViewCell.self, forCellReuseIdentifier: "FileCell")
        view.addSubview(tableView)

        NSLayoutConstraint.activate([
            tableView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            tableView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            tableView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            tableView.bottomAnchor.constraint(equalTo: view.bottomAnchor)
        ])
    }

    private func setupHeaderCards() {
        let headerView = UIView()
        headerView.frame = CGRect(x: 0, y: 0, width: view.bounds.width, height: 190)

        let stack = UIStackView()
        stack.translatesAutoresizingMaskIntoConstraints = false
        stack.axis = .vertical
        stack.spacing = 10
        stack.distribution = .fillEqually
        headerView.addSubview(stack)

        NSLayoutConstraint.activate([
            stack.topAnchor.constraint(equalTo: headerView.topAnchor, constant: 12),
            stack.leadingAnchor.constraint(equalTo: headerView.leadingAnchor, constant: 16),
            stack.trailingAnchor.constraint(equalTo: headerView.trailingAnchor, constant: -16),
            stack.bottomAnchor.constraint(equalTo: headerView.bottomAnchor, constant: -12)
        ])

        // Button 1: Download from URL (Any Project)
        let customUrlBtn = createHeaderButton(
            title: " + Tải Tệp / IPA Từ Link Mới",
            subtitle: "Dán link tải từ GitHub hoặc trang web bất kỳ",
            icon: "plus.circle.fill",
            bgColor: UIColor(red: 0.15, green: 0.39, blue: 0.92, alpha: 1.0),
            textColor: .white,
            action: #selector(handleDownloadFromUrl)
        )
        stack.addArrangedSubview(customUrlBtn)

        // Button 2: Quick Download Antigravity Latest IPA
        let defaultAppBtn = createHeaderButton(
            title: " 🚀 Tải Antigravity IPA Mới Nhất",
            subtitle: "Bản phát hành chính thức từ GitHub Releases",
            icon: "arrow.down.circle",
            bgColor: UIColor.secondarySystemGroupedBackground,
            textColor: .label,
            action: #selector(handleDownloadAntigravityIpa)
        )
        defaultAppBtn.layer.borderWidth = 0.5
        defaultAppBtn.layer.borderColor = UIColor.separator.cgColor
        stack.addArrangedSubview(defaultAppBtn)

        // Button 3: Reveal in Files App
        let openFilesBtn = createHeaderButton(
            title: " 📂 Mở Trong Ứng Dụng \"Tệp\" (Files)",
            subtitle: "Xem thư mục Downloads trên iPhone của bạn",
            icon: "folder",
            bgColor: UIColor.secondarySystemGroupedBackground,
            textColor: .label,
            action: #selector(handleOpenInFiles)
        )
        openFilesBtn.layer.borderWidth = 0.5
        openFilesBtn.layer.borderColor = UIColor.separator.cgColor
        stack.addArrangedSubview(openFilesBtn)

        tableView.tableHeaderView = headerView
    }

    private func createHeaderButton(title: String, subtitle: String, icon: String, bgColor: UIColor, textColor: UIColor, action: Selector) -> UIButton {
        let btn = UIButton(type: .system)
        btn.backgroundColor = bgColor
        btn.layer.cornerRadius = 14
        btn.layer.cornerCurve = .continuous
        btn.contentEdgeInsets = UIEdgeInsets(top: 8, left: 14, bottom: 8, right: 14)
        btn.addTarget(self, action: action, for: .touchUpInside)

        let titleLabel = UILabel()
        titleLabel.translatesAutoresizingMaskIntoConstraints = false
        titleLabel.text = title
        titleLabel.font = UIFont.systemFont(ofSize: 14, weight: .bold)
        titleLabel.textColor = textColor

        let subLabel = UILabel()
        subLabel.translatesAutoresizingMaskIntoConstraints = false
        subLabel.text = subtitle
        subLabel.font = UIFont.systemFont(ofSize: 11, weight: .regular)
        subLabel.textColor = textColor.withAlphaComponent(0.8)

        let iconView = UIImageView(image: UIImage(systemName: icon))
        iconView.translatesAutoresizingMaskIntoConstraints = false
        iconView.tintColor = textColor
        iconView.contentMode = .scaleAspectFit

        let innerStack = UIStackView(arrangedSubviews: [titleLabel, subLabel])
        innerStack.translatesAutoresizingMaskIntoConstraints = false
        innerStack.axis = .vertical
        innerStack.spacing = 2
        innerStack.isUserInteractionEnabled = false

        btn.addSubview(iconView)
        btn.addSubview(innerStack)

        NSLayoutConstraint.activate([
            iconView.leadingAnchor.constraint(equalTo: btn.leadingAnchor, constant: 14),
            iconView.centerYAnchor.constraint(equalTo: btn.centerYAnchor),
            iconView.widthAnchor.constraint(equalToConstant: 24),
            iconView.heightAnchor.constraint(equalToConstant: 24),

            innerStack.leadingAnchor.constraint(equalTo: iconView.trailingAnchor, constant: 12),
            innerStack.trailingAnchor.constraint(equalTo: btn.trailingAnchor, constant: -14),
            innerStack.centerYAnchor.constraint(equalTo: btn.centerYAnchor)
        ])

        return btn
    }

    @objc private func handleClose() {
        dismiss(animated: true)
    }

    @objc private func handleClearAll() {
        guard !DownloadManager.shared.items.isEmpty else { return }
        let alert = UIAlertController(
            title: "Dọn Dẹp Danh Sách",
            message: "Bạn có muốn xóa toàn bộ danh sách tệp đã tải về khỏi bộ nhớ máy không?",
            preferredStyle: .actionSheet
        )
        alert.addAction(UIAlertAction(title: "Hủy", style: .cancel))
        alert.addAction(UIAlertAction(title: "Xóa Toàn Bộ Tệp", style: .destructive, handler: { _ in
            DownloadManager.shared.clearAll()
            UIImpactFeedbackGenerator(style: .medium).impactOccurred()
        }))
        if let popover = alert.popoverPresentationController {
            popover.barButtonItem = navigationItem.leftBarButtonItem
        }
        present(alert, animated: true)
    }

    @objc private func handleDownloadFromUrl() {
        let clipboard = UIPasteboard.general.string?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        let defaultText = clipboard.starts(with: "http") ? clipboard : ""

        let alert = UIAlertController(
            title: "Tải Tệp Từ Link Mới",
            message: "Nhập hoặc dán link URL file .ipa, .zip, .deb từ GitHub hoặc web:",
            preferredStyle: .alert
        )
        alert.addTextField { tf in
            tf.text = defaultText
            tf.placeholder = "https://example.com/app.ipa"
            tf.clearButtonMode = .whileEditing
            tf.keyboardType = .URL
        }
        alert.addAction(UIAlertAction(title: "Hủy", style: .cancel))
        alert.addAction(UIAlertAction(title: "Bắt Đầu Tải", style: .default, handler: { _ in
            if let text = alert.textFields?.first?.text?.trimmingCharacters(in: .whitespacesAndNewlines),
               let url = URL(string: text) {
                DownloadManager.shared.startDownload(url: url)
                UIImpactFeedbackGenerator(style: .medium).impactOccurred()
            }
        }))
        present(alert, animated: true)
    }

    @objc private func handleDownloadAntigravityIpa() {
        UIImpactFeedbackGenerator(style: .medium).impactOccurred()
        DownloadManager.shared.startDownload(url: directAntigravityIpaUrl, customFilename: "AntigravityMobile.ipa")
    }

    @objc private func handleOpenInFiles() {
        UIImpactFeedbackGenerator(style: .light).impactOccurred()
        let dir = DownloadManager.shared.downloadsDirectory
        let activityVC = UIActivityViewController(activityItems: [dir], applicationActivities: nil)
        if let popover = activityVC.popoverPresentationController {
            popover.sourceView = view
            popover.sourceRect = CGRect(x: view.bounds.midX, y: view.bounds.midY, width: 0, height: 0)
        }
        present(activityVC, animated: true)
    }

    private func updateProgressForActiveDownload(id: String, progress: Float, written: Int64, total: Int64) {
        let activeList = Array(DownloadManager.shared.activeDownloads.values)
        guard let row = activeList.firstIndex(where: { $0.id == id }) else { return }
        let indexPath = IndexPath(row: row, section: 0)
        if let cell = tableView.cellForRow(at: indexPath) {
            let percent = Int(progress * 100)
            let detail = total > 0 ? "\(written.formattedFileSize) / \(total.formattedFileSize) (\(percent)%)" : "\(written.formattedFileSize) đã tải..."
            cell.detailTextLabel?.text = detail
            if let pv = cell.contentView.subviews.first(where: { $0 is UIProgressView }) as? UIProgressView {
                pv.progress = progress
            }
        }
    }

    // UITableViewDataSource
    func numberOfSections(in tableView: UITableView) -> Int {
        let hasActive = !DownloadManager.shared.activeDownloads.isEmpty
        return hasActive ? 2 : 1
    }

    func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        let hasActive = !DownloadManager.shared.activeDownloads.isEmpty
        if hasActive && section == 0 {
            return DownloadManager.shared.activeDownloads.count
        }
        let itemsCount = DownloadManager.shared.items.count
        return itemsCount > 0 ? itemsCount : (hasActive ? 0 : 1)
    }

    func tableView(_ tableView: UITableView, titleForHeaderInSection section: Int) -> String? {
        let hasActive = !DownloadManager.shared.activeDownloads.isEmpty
        if hasActive && section == 0 {
            return "ĐANG TẢI VỀ (\(DownloadManager.shared.activeDownloads.count))"
        }
        let count = DownloadManager.shared.items.count
        return "TỆP ĐÃ TẢI VỀ (\(count))"
    }

    func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        let hasActive = !DownloadManager.shared.activeDownloads.isEmpty

        // Section: Active Downloads
        if hasActive && indexPath.section == 0 {
            let cell = UITableViewCell(style: .subtitle, reuseIdentifier: "ActiveDownloadCell")
            let activeList = Array(DownloadManager.shared.activeDownloads.values)
            guard indexPath.row < activeList.count else { return cell }
            let item = activeList[indexPath.row]

            cell.textLabel?.text = item.filename
            cell.textLabel?.font = UIFont.systemFont(ofSize: 14, weight: .bold)

            let percent = Int(item.progress * 100)
            cell.detailTextLabel?.text = item.totalBytesExpected > 0
                ? "\(item.bytesWritten.formattedFileSize) / \(item.totalBytesExpected.formattedFileSize) (\(percent)%)"
                : "Đang kết nối..."
            cell.detailTextLabel?.textColor = UIColor(red: 0.15, green: 0.39, blue: 0.92, alpha: 1.0)
            cell.imageView?.image = UIImage(systemName: "arrow.down.circle.fill")
            cell.imageView?.tintColor = UIColor(red: 0.15, green: 0.39, blue: 0.92, alpha: 1.0)

            let cancelBtn = UIButton(type: .system)
            cancelBtn.setImage(UIImage(systemName: "xmark.circle.fill"), for: .normal)
            cancelBtn.tintColor = .secondaryLabel
            cancelBtn.frame = CGRect(x: 0, y: 0, width: 30, height: 30)
            cancelBtn.tag = indexPath.row
            cancelBtn.addTarget(self, action: #selector(handleCancelActiveDownload(_:)), for: .touchUpInside)
            cell.accessoryView = cancelBtn
            return cell
        }

        // Section: Completed Downloads
        if DownloadManager.shared.items.isEmpty {
            let emptyCell = UITableViewCell(style: .default, reuseIdentifier: "EmptyCell")
            emptyCell.textLabel?.text = "Chưa có tệp tải về nào trong máy"
            emptyCell.textLabel?.textColor = .secondaryLabel
            emptyCell.textLabel?.font = UIFont.systemFont(ofSize: 13, weight: .regular)
            emptyCell.textLabel?.textAlignment = .center
            emptyCell.selectionStyle = .none
            return emptyCell
        }

        let cell = UITableViewCell(style: .subtitle, reuseIdentifier: "FileCell")
        guard indexPath.row < DownloadManager.shared.items.count else { return cell }
        let item = DownloadManager.shared.items[indexPath.row]

        cell.textLabel?.text = item.filename
        cell.textLabel?.font = UIFont.systemFont(ofSize: 14, weight: .semibold)

        let subtitle = "\(item.fileSize.formattedFileSize) • \(item.downloadDate.relativeDisplay)\(item.isIpa ? " • 🚀 Sideload IPA" : "")"
        cell.detailTextLabel?.text = subtitle
        cell.detailTextLabel?.textColor = .secondaryLabel

        // Color-coded icons
        if item.isIpa {
            cell.imageView?.image = UIImage(systemName: "app.badge.fill")
            cell.imageView?.tintColor = UIColor(red: 0.15, green: 0.39, blue: 0.92, alpha: 1.0)
        } else if item.filename.lowercased().hasSuffix(".zip") || item.filename.lowercased().hasSuffix(".deb") || item.filename.lowercased().hasSuffix(".rar") {
            cell.imageView?.image = UIImage(systemName: "archivebox.fill")
            cell.imageView?.tintColor = .systemOrange
        } else if item.filename.lowercased().hasSuffix(".pdf") {
            cell.imageView?.image = UIImage(systemName: "doc.text.fill")
            cell.imageView?.tintColor = .systemRed
        } else {
            cell.imageView?.image = UIImage(systemName: "doc.fill")
            cell.imageView?.tintColor = .secondaryLabel
        }

        let shareBtn = UIButton(type: .system)
        shareBtn.setImage(UIImage(systemName: "square.and.arrow.up"), for: .normal)
        shareBtn.tintColor = item.isIpa ? UIColor.systemGreen : UIColor(red: 0.15, green: 0.39, blue: 0.92, alpha: 1.0)
        shareBtn.frame = CGRect(x: 0, y: 0, width: 34, height: 34)
        shareBtn.tag = indexPath.row
        shareBtn.addTarget(self, action: #selector(handleShareRowButton(_:)), for: .touchUpInside)
        cell.accessoryView = shareBtn

        return cell
    }

    @objc private func handleCancelActiveDownload(_ sender: UIButton) {
        let activeList = Array(DownloadManager.shared.activeDownloads.values)
        if sender.tag < activeList.count {
            let active = activeList[sender.tag]
            DownloadManager.shared.cancelDownload(id: active.id)
            UIImpactFeedbackGenerator(style: .medium).impactOccurred()
        }
    }

    @objc private func handleShareRowButton(_ sender: UIButton) {
        if sender.tag < DownloadManager.shared.items.count {
            let item = DownloadManager.shared.items[sender.tag]
            shareFile(item, sourceView: sender)
        }
    }

    // UITableViewDelegate: Tapping a row
    func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
        tableView.deselectRow(at: indexPath, animated: true)
        let hasActive = !DownloadManager.shared.activeDownloads.isEmpty
        if hasActive && indexPath.section == 0 { return }

        guard indexPath.row < DownloadManager.shared.items.count else { return }
        let item = DownloadManager.shared.items[indexPath.row]
        let cell = tableView.cellForRow(at: indexPath)

        if item.isIpa {
            showIpaActionSheet(for: item, sourceView: cell ?? view)
        } else {
            showGeneralFileActionSheet(for: item, sourceView: cell ?? view)
        }
    }

    private func showIpaActionSheet(for item: DownloadItem, sourceView: UIView) {
        let sheet = UIAlertController(
            title: item.filename,
            message: "Dung lượng: \(item.fileSize.formattedFileSize) • Sẵn sàng Sideload vào iPhone",
            preferredStyle: .actionSheet
        )

        sheet.addAction(UIAlertAction(title: "🚀 Chia Sẻ Để Sideload (TrollStore / SideStore / AltStore)", style: .default, handler: { _ in
            self.shareFile(item, sourceView: sourceView)
        }))

        sheet.addAction(UIAlertAction(title: "📂 Mở Trong Ứng Dụng Tệp (Files)", style: .default, handler: { _ in
            self.shareFile(item, sourceView: sourceView)
        }))

        sheet.addAction(UIAlertAction(title: "✏️ Đổi Tên Tệp", style: .default, handler: { _ in
            self.showRenameDialog(for: item)
        }))

        sheet.addAction(UIAlertAction(title: "📋 Sao Chép Tên Tệp", style: .default, handler: { _ in
            UIPasteboard.general.string = item.filename
            UIImpactFeedbackGenerator(style: .light).impactOccurred()
        }))

        sheet.addAction(UIAlertAction(title: "🗑️ Xóa Tệp Này Khỏi Máy", style: .destructive, handler: { _ in
            DownloadManager.shared.deleteItem(item)
            UIImpactFeedbackGenerator(style: .medium).impactOccurred()
        }))

        sheet.addAction(UIAlertAction(title: "Hủy", style: .cancel))

        if let popover = sheet.popoverPresentationController {
            popover.sourceView = sourceView
            popover.sourceRect = sourceView.bounds
        }
        present(sheet, animated: true)
    }

    private func showGeneralFileActionSheet(for item: DownloadItem, sourceView: UIView) {
        let sheet = UIAlertController(
            title: item.filename,
            message: "Dung lượng: \(item.fileSize.formattedFileSize)",
            preferredStyle: .actionSheet
        )

        sheet.addAction(UIAlertAction(title: "👁️ Xem Nhanh Tệp (Quick Look)", style: .default, handler: { _ in
            self.previewFile(item)
        }))

        sheet.addAction(UIAlertAction(title: "🚀 Chia Sẻ Tệp", style: .default, handler: { _ in
            self.shareFile(item, sourceView: sourceView)
        }))

        sheet.addAction(UIAlertAction(title: "✏️ Đổi Tên Tệp", style: .default, handler: { _ in
            self.showRenameDialog(for: item)
        }))

        sheet.addAction(UIAlertAction(title: "🗑️ Xóa Tệp Này", style: .destructive, handler: { _ in
            DownloadManager.shared.deleteItem(item)
            UIImpactFeedbackGenerator(style: .medium).impactOccurred()
        }))

        sheet.addAction(UIAlertAction(title: "Hủy", style: .cancel))

        if let popover = sheet.popoverPresentationController {
            popover.sourceView = sourceView
            popover.sourceRect = sourceView.bounds
        }
        present(sheet, animated: true)
    }

    private func shareFile(_ item: DownloadItem, sourceView: UIView? = nil) {
        let fileUrl = DownloadManager.shared.getFileUrl(for: item)
        guard FileManager.default.fileExists(atPath: fileUrl.path) else { return }

        UIImpactFeedbackGenerator(style: .medium).impactOccurred()
        let activityVC = UIActivityViewController(activityItems: [fileUrl], applicationActivities: nil)
        if let popover = activityVC.popoverPresentationController {
            popover.sourceView = sourceView ?? view
            popover.sourceRect = sourceView?.bounds ?? CGRect(x: view.bounds.midX, y: view.bounds.midY, width: 0, height: 0)
        }
        present(activityVC, animated: true)
    }

    private func previewFile(_ item: DownloadItem) {
        let fileUrl = DownloadManager.shared.getFileUrl(for: item)
        guard FileManager.default.fileExists(atPath: fileUrl.path) else { return }

        self.previewItemUrl = fileUrl
        let previewVC = QLPreviewController()
        previewVC.dataSource = self
        present(previewVC, animated: true)
    }

    private func showRenameDialog(for item: DownloadItem) {
        let alert = UIAlertController(title: "Đổi Tên Tệp", message: "Nhập tên mới cho tệp:", preferredStyle: .alert)
        alert.addTextField { tf in
            tf.text = item.filename
            tf.clearButtonMode = .whileEditing
        }
        alert.addAction(UIAlertAction(title: "Hủy", style: .cancel))
        alert.addAction(UIAlertAction(title: "Lưu", style: .default, handler: { _ in
            if let newName = alert.textFields?.first?.text?.trimmingCharacters(in: .whitespacesAndNewlines), !newName.isEmpty {
                _ = DownloadManager.shared.renameItem(item, newName: newName)
            }
        }))
        present(alert, animated: true)
    }

    // Swipe Actions
    func tableView(_ tableView: UITableView, trailingSwipeActionsConfigurationForRowAt indexPath: IndexPath) -> UISwipeActionsConfiguration? {
        let hasActive = !DownloadManager.shared.activeDownloads.isEmpty
        if hasActive && indexPath.section == 0 { return nil }
        guard indexPath.row < DownloadManager.shared.items.count else { return nil }

        let item = DownloadManager.shared.items[indexPath.row]
        let deleteAction = UIContextualAction(style: .destructive, title: "Xóa") { _, _, completion in
            DownloadManager.shared.deleteItem(item)
            completion(true)
        }
        deleteAction.image = UIImage(systemName: "trash")
        return UISwipeActionsConfiguration(actions: [deleteAction])
    }

    func tableView(_ tableView: UITableView, leadingSwipeActionsConfigurationForRowAt indexPath: IndexPath) -> UISwipeActionsConfiguration? {
        let hasActive = !DownloadManager.shared.activeDownloads.isEmpty
        if hasActive && indexPath.section == 0 { return nil }
        guard indexPath.row < DownloadManager.shared.items.count else { return nil }

        let item = DownloadManager.shared.items[indexPath.row]
        let shareAction = UIContextualAction(style: .normal, title: "Chia Sẻ") { [weak self] _, _, completion in
            self?.shareFile(item)
            completion(true)
        }
        shareAction.backgroundColor = item.isIpa ? UIColor.systemGreen : UIColor(red: 0.15, green: 0.39, blue: 0.92, alpha: 1.0)
        shareAction.image = UIImage(systemName: "square.and.arrow.up")
        return UISwipeActionsConfiguration(actions: [shareAction])
    }

    // QLPreviewControllerDataSource
    func numberOfPreviewItems(in controller: QLPreviewController) -> Int {
        return previewItemUrl != nil ? 1 : 0
    }

    func previewController(_ controller: QLPreviewController, previewItemAt index: Int) -> QLPreviewItem {
        return (previewItemUrl ?? URL(fileURLWithPath: "")) as NSURL
    }
}

// Backward compatibility alias
typealias IPAManagerViewController = SafariDownloadManagerViewController

