import WidgetKit
import SwiftUI

struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> SimpleEntry {
        SimpleEntry(date: Date(), data: .default)
    }

    func getSnapshot(in context: Context, completion: @escaping (SimpleEntry) -> ()) {
        let entry = SimpleEntry(date: Date(), data: WidgetSharedData.load())
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> ()) {
        let entry = SimpleEntry(date: Date(), data: WidgetSharedData.load())
        // Refresh every 15 minutes or when triggered by the app via reloadAllTimelines
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 15, to: Date())!
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        completion(timeline)
    }
}

struct SimpleEntry: TimelineEntry {
    let date: Date
    let data: WidgetSharedData
}

struct AntigravityWidgetEntryView: View {
    var entry: Provider.Entry
    @Environment(\.widgetFamily) var family

    var body: some View {
        switch family {
        case .systemSmall:
            SmallWidgetView(data: entry.data)
        case .systemMedium:
            MediumWidgetView(data: entry.data)
        case .accessoryCircular:
            LockScreenCircularView(data: entry.data)
        default:
            MediumWidgetView(data: entry.data)
        }
    }
}

// MARK: - Medium Widget (Màn hình chính kích thước vừa)
struct MediumWidgetView: View {
    let data: WidgetSharedData

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            // Header
            HStack {
                HStack(spacing: 6) {
                    Image(systemName: "sparkles")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundColor(.white)
                        .padding(5)
                        .background(Color.blue)
                        .clipShape(RoundedRectangle(cornerRadius: 6))

                    VStack(alignment: .leading, spacing: 0) {
                        Text("Antigravity Host")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundColor(.white)
                        Text(data.hostName)
                            .font(.system(size: 9))
                            .foregroundColor(.gray)
                    }
                }

                Spacer()

                HStack(spacing: 4) {
                    Circle()
                        .fill(data.isOnline ? Color.green : Color.red)
                        .frame(width: 6, height: 6)
                    Text(data.isOnline ? "ONLINE" : "OFFLINE")
                        .font(.system(size: 9, weight: .bold))
                        .foregroundColor(data.isOnline ? .green : .red)
                }
                .padding(.horizontal, 6)
                .padding(.vertical, 2)
                .background(data.isOnline ? Color.green.opacity(0.15) : Color.red.opacity(0.15))
                .clipShape(Capsule())
            }

            // Project & Task Info Bar
            HStack {
                Image(systemName: "terminal")
                    .font(.system(size: 10))
                    .foregroundColor(.blue)
                Text(data.activeProject)
                    .font(.system(size: 10, weight: .medium, design: .monospaced))
                    .foregroundColor(.white)
                Spacer()
                Text("RAM: \(data.memoryUsage)% | CPU: \(data.cpuUsage)%")
                    .font(.system(size: 9, design: .monospaced))
                    .foregroundColor(.gray)
            }
            .padding(.horizontal, 8)
            .padding(.vertical, 6)
            .background(Color(red: 0.08, green: 0.08, blue: 0.1))
            .clipShape(RoundedRectangle(cornerRadius: 8))

            // Footer / Approvals
            HStack {
                if data.pendingApprovalsCount > 0 {
                    HStack(spacing: 4) {
                        Image(systemName: "exclamationmark.shield.fill")
                            .foregroundColor(.yellow)
                        Text("\(data.pendingApprovalsCount) lệnh chờ duyệt!")
                            .font(.system(size: 10, weight: .semibold))
                            .foregroundColor(.yellow)
                    }
                } else {
                    HStack(spacing: 4) {
                        Image(systemName: "checkmark.circle.fill")
                            .foregroundColor(.green)
                        Text("Agent sẵn sàng")
                            .font(.system(size: 10))
                            .foregroundColor(.gray)
                    }
                }
                Spacer()
                Text(data.lastUpdated)
                    .font(.system(size: 9, design: .monospaced))
                    .foregroundColor(.gray)
            }
        }
        .padding(12)
        .background(Color(red: 0.05, green: 0.05, blue: 0.07))
    }
}

// MARK: - Small Widget (Màn hình chính 2x2)
struct SmallWidgetView: View {
    let data: WidgetSharedData

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: "sparkles")
                    .font(.system(size: 10, weight: .bold))
                    .foregroundColor(.white)
                    .padding(5)
                    .background(Color.blue)
                    .clipShape(RoundedRectangle(cornerRadius: 6))
                Spacer()
                Circle()
                    .fill(data.isOnline ? Color.green : Color.red)
                    .frame(width: 8, height: 8)
            }

            Spacer()

            VStack(alignment: .leading, spacing: 2) {
                Text("MÁY CHỦ")
                    .font(.system(size: 8, weight: .bold))
                    .foregroundColor(.gray)
                Text(data.hostName)
                    .font(.system(size: 11, weight: .bold))
                    .foregroundColor(.white)
                    .lineLimit(1)
                Text(data.isOnline ? "● Sẵn sàng" : "○ Mất kết nối")
                    .font(.system(size: 9))
                    .foregroundColor(data.isOnline ? .green : .red)
            }

            HStack {
                Text("RAM: \(data.memoryUsage)%")
                    .font(.system(size: 8, design: .monospaced))
                    .foregroundColor(.gray)
                Spacer()
                Text(data.lastUpdated)
                    .font(.system(size: 8, design: .monospaced))
                    .foregroundColor(.gray)
            }
        }
        .padding(10)
        .background(Color(red: 0.05, green: 0.05, blue: 0.07))
    }
}

// MARK: - Lock Screen Widget
struct LockScreenCircularView: View {
    let data: WidgetSharedData

    var body: some View {
        ZStack {
            AccessoryWidgetBackground()
            VStack(spacing: 1) {
                Image(systemName: "sparkles")
                    .font(.system(size: 11))
                Text(data.isOnline ? "OK" : "ERR")
                    .font(.system(size: 9, weight: .bold))
            }
        }
    }
}

@main
struct AntigravityWidget: Widget {
    let kind: String = "AntigravityWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            AntigravityWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("Antigravity Server Monitor")
        .description("Giám sát trạng thái máy tính server và các lệnh chờ phê duyệt.")
        .supportedFamilies([.systemSmall, .systemMedium, .accessoryCircular])
    }
}
