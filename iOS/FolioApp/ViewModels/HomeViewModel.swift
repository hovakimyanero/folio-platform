import Foundation

@MainActor
class HomeViewModel: ObservableObject {
    @Published var trending: [Project] = []
    @Published var latest: [Project] = []
    @Published var categories: [String] = [
        "Графический дизайн", "UI/UX", "Иллюстрация", "3D",
        "Моушн-дизайн", "Фотография", "Веб-дизайн", "Брендинг"
    ]
    @Published var isLoading = false
    @Published var error: String?

    private let api = APIService.shared

    func load() async {
        isLoading = true
        do {
            async let trendingReq: ProjectsResponse = api.get("/projects", query: ["sort": "popular", "limit": "8"], auth: false)
            async let latestReq: ProjectsResponse = api.get("/projects", query: ["sort": "latest", "limit": "8"], auth: false)
            let (t, l) = try await (trendingReq, latestReq)
            trending = t.projects
            latest = l.projects
        } catch let err as APIError {
            error = err.errorDescription
        } catch {
            self.error = error.localizedDescription
        }
        isLoading = false
    }
}
