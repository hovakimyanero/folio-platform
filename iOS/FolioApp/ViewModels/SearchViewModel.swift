import Foundation

@MainActor
class SearchViewModel: ObservableObject {
    @Published var query = ""
    @Published var projects: [Project] = []
    @Published var users: [User] = []
    @Published var isLoading = false
    @Published var searchType: SearchType = .projects

    enum SearchType: String, CaseIterable {
        case projects = "Проекты"
        case users = "Пользователи"
    }

    private let api = APIService.shared

    func search() async {
        guard !query.trimmingCharacters(in: .whitespaces).isEmpty else { return }
        isLoading = true
        do {
            switch searchType {
            case .projects:
                let resp: ProjectsResponse = try await api.get("/projects", query: ["search": query], auth: false)
                projects = resp.projects
            case .users:
                let resp: ProjectsResponse = try await api.get("/projects", query: ["search": query], auth: false)
                // No user search endpoint; search by projects and extract unique authors
                users = Array(Set(resp.projects.compactMap { $0.author }.map { $0.id }).compactMap { id in resp.projects.first(where: { $0.author?.id == id })?.author })
            }
        } catch {}
        isLoading = false
    }

    func clear() {
        query = ""
        projects = []
        users = []
    }
}


