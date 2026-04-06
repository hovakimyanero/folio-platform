import SwiftUI

struct ContentView: View {
    @EnvironmentObject var authVM: AuthViewModel

    var body: some View {
        Group {
            switch authVM.state {
            case .loading:
                ProgressView("Загрузка...")
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            case .authenticated:
                MainTabView()
            case .unauthenticated:
                AuthView()
            }
        }
    }
}
