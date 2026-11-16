import Foundation

public struct WidgetSharedData: Codable {
    public let hostName: String
    public let isOnline: Bool
    public let activeProject: String
    public let currentTask: String
    public let pendingApprovalsCount: Int
    public let lastUpdated: String
    public let cpuUsage: Int
    public let memoryUsage: Int

    public static let `default` = WidgetSharedData(
        hostName: "Dell PC Server",
        isOnline: true,
        activeProject: "antigravity-app",
        currentTask: "Sẵn sàng nhận lệnh",
        pendingApprovalsCount: 0,
        lastUpdated: "12:00",
        cpuUsage: 14,
        memoryUsage: 38
    )

    public static func load() -> WidgetSharedData {
        let appGroupId = "group.com.antigravity.mobile"
        if let userDefaults = UserDefaults(suiteName: appGroupId),
           let rawData = userDefaults.string(forKey: "antigravity_widget_data")?.data(using: .utf8),
           let decoded = try? JSONDecoder().decode(WidgetSharedData.self, from: rawData) {
            return decoded
        }
        return .default
    }
}
