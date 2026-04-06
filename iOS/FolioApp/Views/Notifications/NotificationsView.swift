import SwiftUI

struct NotificationsView: View {
    @EnvironmentObject var notificationsVM: NotificationsViewModel

    var body: some View {
        NavigationStack {
            List {
                if notificationsVM.isLoading && notificationsVM.notifications.isEmpty {
                    ProgressView()
                        .frame(maxWidth: .infinity)
                        .listRowSeparator(.hidden)
                } else if notificationsVM.notifications.isEmpty {
                    VStack(spacing: 12) {
                        Image(systemName: "bell.slash")
                            .font(.system(size: 40))
                            .foregroundColor(.gray)
                        Text("Нет уведомлений")
                            .foregroundColor(.secondary)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.top, 40)
                    .listRowSeparator(.hidden)
                } else {
                    ForEach(notificationsVM.notifications) { notification in
                        NotificationRow(notification: notification)
                            .onTapGesture {
                                Task { await notificationsVM.markAsRead(id: notification.id) }
                            }
                            .listRowBackground(
                                (notification.read ?? false) ? Color.clear : Color.blue.opacity(0.05)
                            )
                    }
                }
            }
            .listStyle(.plain)
            .navigationTitle("Уведомления")
            .toolbar {
                if notificationsVM.unreadCount > 0 {
                    ToolbarItem(placement: .navigationBarTrailing) {
                        Button("Прочитать все") {
                            Task { await notificationsVM.markAllRead() }
                        }
                        .font(.caption)
                    }
                }
            }
            .refreshable {
                await notificationsVM.load()
            }
            .task {
                await notificationsVM.load()
            }
        }
    }
}

struct NotificationRow: View {
    let notification: AppNotification

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: iconName)
                .font(.title3)
                .foregroundColor(iconColor)
                .frame(width: 32, height: 32)

            VStack(alignment: .leading, spacing: 4) {
                Text(notification.message ?? notificationText)
                    .font(.callout)
                    .lineLimit(3)

                if let date = notification.createdAt {
                    Text(formatRelative(date))
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }

            Spacer()

            if !(notification.read ?? false) {
                Circle()
                    .fill(Color.blue)
                    .frame(width: 8, height: 8)
            }
        }
        .padding(.vertical, 4)
    }

    var notificationText: String {
        switch notification.type {
        case "LIKE": return "Кому-то понравился ваш проект"
        case "COMMENT": return "Новый комментарий к вашему проекту"
        case "FOLLOW": return "На вас подписались"
        case "MESSAGE": return "Новое сообщение"
        default: return notification.type ?? "Уведомление"
        }
    }

    var iconName: String {
        switch notification.type {
        case "LIKE": return "heart.fill"
        case "COMMENT": return "bubble.right.fill"
        case "FOLLOW": return "person.badge.plus"
        case "MESSAGE": return "envelope.fill"
        default: return "bell.fill"
        }
    }

    var iconColor: Color {
        switch notification.type {
        case "LIKE": return .pink
        case "COMMENT": return .blue
        case "FOLLOW": return .green
        case "MESSAGE": return .orange
        default: return .gray
        }
    }

    func formatRelative(_ dateString: String) -> String {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        guard let date = f.date(from: dateString) else { return dateString }
        let diff = Date().timeIntervalSince(date)
        if diff < 60 { return "только что" }
        if diff < 3600 { return "\(Int(diff/60)) мин. назад" }
        if diff < 86400 { return "\(Int(diff/3600)) ч. назад" }
        if diff < 604800 { return "\(Int(diff/86400)) дн. назад" }
        let df = DateFormatter()
        df.dateStyle = .short
        df.locale = Locale(identifier: "ru_RU")
        return df.string(from: date)
    }
}
