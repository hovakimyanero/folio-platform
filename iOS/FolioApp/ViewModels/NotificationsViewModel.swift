import Foundation

@MainActor
class NotificationsViewModel: ObservableObject {
    @Published var notifications: [AppNotification] = []
    @Published var unreadCount = 0
    @Published var isLoading = false

    private let api = APIService.shared

    func load() async {
        isLoading = true
        do {
            let resp: NotificationsResponse = try await api.get("/notifications")
            notifications = resp.notifications
            unreadCount = resp.unreadCount ?? notifications.filter { !($0.read ?? false) }.count
        } catch {}
        isLoading = false
    }

    func markAsRead(id: String) async {
        do {
            let _: AppNotification = try await api.patch("/notifications/\(id)/read")
            if let idx = notifications.firstIndex(where: { $0.id == id }) {
                notifications[idx].read = true
                unreadCount = max(0, unreadCount - 1)
            }
        } catch {}
    }

    func markAllRead() async {
        do {
            _ = try await api.requestRaw("PATCH", "/notifications/read-all")
            for i in notifications.indices {
                notifications[i].read = true
            }
            unreadCount = 0
        } catch {}
    }
}
