import SwiftUI

struct MainTabView: View {
    @EnvironmentObject var authVM: AuthViewModel
    @StateObject private var notificationsVM = NotificationsViewModel()

    var body: some View {
        TabView {
            HomeView()
                .tabItem {
                    Label("Главная", systemImage: "house.fill")
                }

            ProjectsExploreView()
                .tabItem {
                    Label("Проекты", systemImage: "square.grid.2x2.fill")
                }

            UploadView()
                .tabItem {
                    Label("Загрузить", systemImage: "plus.circle.fill")
                }

            NotificationsView()
                .tabItem {
                    Label("Уведомления", systemImage: "bell.fill")
                }
                .badge(notificationsVM.unreadCount)

            ProfileView(username: authVM.currentUser?.username ?? "")
                .tabItem {
                    Label("Профиль", systemImage: "person.fill")
                }
        }
        .task {
            await notificationsVM.load()
        }
        .environmentObject(notificationsVM)
    }
}
