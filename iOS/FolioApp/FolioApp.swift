import SwiftUI

@main
struct FolioApp: App {
    @StateObject private var authVM = AuthViewModel()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(authVM)
                .preferredColorScheme(.dark)
        }
    }
}
