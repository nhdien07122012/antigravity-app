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

    private let containerView = UIView()
    private let dockView = UIVisualEffectView(effect: UIBlurEffect(style: .systemUltraThinMaterialDark))
    private let dockScrollView = UIScrollView()
    private let dockStackView = UIStackView()
    private let actionStackView = UIStackView()
    private let addButton = UIButton(type: .system)
    private let reloadButton = UIButton(type: .system)
    private let fullscreenButton = UIButton(type: .system)
    private let restoreButton = UIButton(type: .system)

    private var isFullscreen = false

    override var preferredStatusBarStyle: UIStatusBarStyle {
        return .default
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .black

        setupLayout()
        loadWorkspaces()
    }

    // MARK: - Setup UI Elements
    private func setupLayout() {
        // 1. Container for WKWebViews
        containerView.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(containerView)

        // 2. Floating Dock Capsule (Liquid Glass Dynamic Island Style)
        dockView.translatesAutoresizingMaskIntoConstraints = false
        dockView.layer.cornerRadius = 22
        dockView.layer.cornerCurve = .continuous
        dockView.layer.masksToBounds = false
        dockView.layer.shadowColor = UIColor.black.cgColor
        dockView.layer.shadowOpacity = 0.5
        dockView.layer.shadowRadius = 18
        dockView.layer.shadowOffset = CGSize(width: 0, height: 4)
        dockView.layer.borderColor = UIColor(white: 1.0, alpha: 0.18).cgColor
        dockView.layer.borderWidth = 0.75
        view.addSubview(dockView)

        let dockContentView = dockView.contentView
        dockContentView.layer.cornerRadius = 22
        dockContentView.layer.cornerCurve = .continuous
        dockContentView.clipsToBounds = true
        dockContentView.backgroundColor = UIColor(red: 0.05, green: 0.05, blue: 0.07, alpha: 0.75)

        // 3. Scrollable Project Tabs
        dockScrollView.translatesAutoresizingMaskIntoConstraints = false
        dockScrollView.showsHorizontalScrollIndicator = false
        dockContentView.addSubview(dockScrollView)

        dockStackView.translatesAutoresizingMaskIntoConstraints = false
        dockStackView.axis = .horizontal
        dockStackView.spacing = 8
        dockStackView.alignment = .center
        dockScrollView.addSubview(dockStackView)

        // 4. Action Buttons Stack (+, Reload, Fullscreen)
        actionStackView.translatesAutoresizingMaskIntoConstraints = false
        actionStackView.axis = .horizontal
        actionStackView.spacing = 4
        actionStackView.alignment = .center
        dockContentView.addSubview(actionStackView)

        // Add (+) Button
        addButton.translatesAutoresizingMaskIntoConstraints = false
        addButton.setImage(UIImage(systemName: "plus"), for: .normal)
        addButton.tintColor = UIColor(red: 0.4, green: 0.75, blue: 1.0, alpha: 1.0)
        addButton.backgroundColor = UIColor(red: 0.15, green: 0.45, blue: 1.0, alpha: 0.25)
        addButton.layer.cornerRadius = 14
        addButton.layer.cornerCurve = .continuous
        addButton.addTarget(self, action: #selector(handleAddWorkspace), for: .touchUpInside)
        actionStackView.addArrangedSubview(addButton)

        // Reload (↻) Button
        reloadButton.translatesAutoresizingMaskIntoConstraints = false
        reloadButton.setImage(UIImage(systemName: "arrow.clockwise"), for: .normal)
        reloadButton.tintColor = UIColor(white: 0.85, alpha: 1.0)
        reloadButton.addTarget(self, action: #selector(handleReloadActiveTab), for: .touchUpInside)
        actionStackView.addArrangedSubview(reloadButton)

        // Fullscreen (⤢) Button
        fullscreenButton.translatesAutoresizingMaskIntoConstraints = false
        fullscreenButton.setImage(UIImage(systemName: "arrow.up.left.and.arrow.down.right"), for: .normal)
        fullscreenButton.tintColor = UIColor(white: 0.85, alpha: 1.0)
        fullscreenButton.addTarget(self, action: #selector(toggleFullscreen), for: .touchUpInside)
        actionStackView.addArrangedSubview(fullscreenButton)

        // 5. Restore Floating Button (shown in fullscreen)
        restoreButton.translatesAutoresizingMaskIntoConstraints = false
        restoreButton.setImage(UIImage(systemName: "arrow.down.right.and.arrow.up.left"), for: .normal)
        restoreButton.tintColor = .white
        restoreButton.backgroundColor = UIColor.black.withAlphaComponent(0.8)
        restoreButton.layer.cornerRadius = 18
        restoreButton.layer.cornerCurve = .continuous
        restoreButton.layer.borderColor = UIColor.white.withAlphaComponent(0.2).cgColor
        restoreButton.layer.borderWidth = 0.5
        restoreButton.layer.shadowColor = UIColor.black.cgColor
        restoreButton.layer.shadowOpacity = 0.4
        restoreButton.layer.shadowRadius = 8
        restoreButton.alpha = 0
        restoreButton.addTarget(self, action: #selector(toggleFullscreen), for: .touchUpInside)
        view.addSubview(restoreButton)

        // Constraints
        NSLayoutConstraint.activate([
            // Container fills entire screen
            containerView.topAnchor.constraint(equalTo: view.topAnchor),
            containerView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            containerView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            containerView.bottomAnchor.constraint(equalTo: view.bottomAnchor),

            // Floating dock pinned closer to bottom (Dynamic Island look)
            dockView.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            dockView.leadingAnchor.constraint(greaterThanOrEqualTo: view.leadingAnchor, constant: 14),
            dockView.trailingAnchor.constraint(lessThanOrEqualTo: view.trailingAnchor, constant: -14),
            dockView.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor, constant: 0),
            dockView.heightAnchor.constraint(equalToConstant: 44),

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

            addButton.widthAnchor.constraint(equalToConstant: 28),
            addButton.heightAnchor.constraint(equalToConstant: 28),
            reloadButton.widthAnchor.constraint(equalToConstant: 28),
            reloadButton.heightAnchor.constraint(equalToConstant: 28),
            fullscreenButton.widthAnchor.constraint(equalToConstant: 28),
            fullscreenButton.heightAnchor.constraint(equalToConstant: 28),

            // Restore button
            restoreButton.trailingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.trailingAnchor, constant: -16),
            restoreButton.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor, constant: -16),
            restoreButton.widthAnchor.constraint(equalToConstant: 36),
            restoreButton.heightAnchor.constraint(equalToConstant: 36)
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

        // Initialize WKWebViews for all workspaces
        for ws in workspaces {
            ensureWebView(for: ws)
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
        // Share website data store so Google login session persists across all project tabs!
        config.websiteDataStore = WKWebsiteDataStore.default()

        let webView = WKWebView(frame: .zero, configuration: config)
        webView.translatesAutoresizingMaskIntoConstraints = false
        // Genuine Mobile Safari User-Agent ensures Google Accounts allows standard login!
        webView.customUserAgent = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1"
        webView.allowsBackForwardNavigationGestures = true
        webView.navigationDelegate = self
        webView.scrollView.contentInsetAdjustmentBehavior = .always
        webView.backgroundColor = .white

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

    // Zero-Reload Switch: 0ms DOM toggle
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

        for ws in workspaces {
            let isActive = (ws.id == activeWorkspaceId)

            let button = UIButton(type: .system)
            button.translatesAutoresizingMaskIntoConstraints = false
            button.tag = workspaces.firstIndex(where: { $0.id == ws.id }) ?? 0

            // Liquid Glass Capsule Tab
            button.setTitle(ws.name, for: .normal)
            button.setTitleColor(isActive ? .white : UIColor(white: 0.82, alpha: 1.0), for: .normal)
            button.titleLabel?.font = UIFont.systemFont(ofSize: 12, weight: isActive ? .bold : .medium)
            button.contentEdgeInsets = UIEdgeInsets(top: 5, left: 11, bottom: 5, right: 11)

            button.backgroundColor = isActive ? UIColor(red: 0.12, green: 0.45, blue: 1.0, alpha: 0.95) : UIColor(white: 1.0, alpha: 0.10)
            button.layer.cornerRadius = 14
            button.layer.cornerCurve = .continuous
            button.clipsToBounds = true

            if isActive {
                button.layer.shadowColor = UIColor(red: 0.15, green: 0.45, blue: 1.0, alpha: 0.55).cgColor
                button.layer.shadowOpacity = 0.6
                button.layer.shadowRadius = 8
                button.layer.shadowOffset = CGSize(width: 0, height: 2)
            } else {
                button.layer.shadowOpacity = 0
            }

            button.addTarget(self, action: #selector(handleTabTapped(_:)), for: .touchUpInside)

            // Long press to rename or delete
            let longPress = UILongPressGestureRecognizer(target: self, action: #selector(handleTabLongPressed(_:)))
            button.addGestureRecognizer(longPress)

            dockStackView.addArrangedSubview(button)
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

        // Remove WKWebView from view hierarchy and memory
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

    @objc private func toggleFullscreen() {
        isFullscreen.toggle()
        UIView.animate(withDuration: 0.28, delay: 0, options: .curveEaseInOut) {
            self.dockView.alpha = self.isFullscreen ? 0 : 1
            self.dockView.transform = self.isFullscreen ? CGAffineTransform(translationX: 0, y: 30) : .identity
            self.restoreButton.alpha = self.isFullscreen ? 1 : 0
        }
    }

    // MARK: - QRScannerDelegate
    func didScanWorkspace(url: String, customName: String?) {
        let parsed = WorkspaceStore.shared.parseGoogleRemoteUrl(url)

        // If project with same session or URL already exists, simply switch to it
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

        // Instantiate native WKWebView
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
        // Overlay Title
        titleLabel.translatesAutoresizingMaskIntoConstraints = false
        titleLabel.text = "Quét Mã QR Google Antigravity Remote"
        titleLabel.textColor = .white
        titleLabel.font = UIFont.systemFont(ofSize: 16, weight: .bold)
        titleLabel.textAlignment = .center
        view.addSubview(titleLabel)

        // Close Button
        closeButton.translatesAutoresizingMaskIntoConstraints = false
        closeButton.setImage(UIImage(systemName: "xmark.circle.fill"), for: .normal)
        closeButton.tintColor = .white
        closeButton.addTarget(self, action: #selector(handleClose), for: .touchUpInside)
        view.addSubview(closeButton)

        // Target Reticle Box
        let reticle = UIView()
        reticle.translatesAutoresizingMaskIntoConstraints = false
        reticle.layer.borderColor = UIColor(red: 0.15, green: 0.39, blue: 0.92, alpha: 1.0).cgColor
        reticle.layer.borderWidth = 3
        reticle.layer.cornerRadius = 16
        reticle.backgroundColor = .clear
        view.addSubview(reticle)

        // Paste Button (Universal UIKit)
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
