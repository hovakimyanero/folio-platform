import Foundation

@MainActor
class ProjectsViewModel: ObservableObject {
    @Published var projects: [Project] = []
    @Published var isLoading = false
    @Published var error: String?
    @Published var currentPage = 1
    @Published var totalPages = 1
    @Published var sort = "latest"
    @Published var category: String?

    private let api = APIService.shared

    func load(page: Int = 1) async {
        isLoading = true
        var query: [String: String] = [
            "page": "\(page)",
            "limit": "12",
            "sort": sort
        ]
        if let cat = category { query["category"] = cat }

        do {
            let response: ProjectsResponse = try await api.get("/projects", query: query, auth: false)
            if page == 1 {
                projects = response.projects
            } else {
                projects.append(contentsOf: response.projects)
            }
            currentPage = response.pagination.page
            totalPages = response.pagination.pages
        } catch let err as APIError {
            error = err.errorDescription
        } catch {
            self.error = error.localizedDescription
        }
        isLoading = false
    }

    func loadMore() async {
        guard currentPage < totalPages, !isLoading else { return }
        await load(page: currentPage + 1)
    }

    func refresh() async {
        currentPage = 1
        await load()
    }
}

@MainActor
class ProjectDetailViewModel: ObservableObject {
    @Published var project: Project?
    @Published var comments: [Comment] = []
    @Published var isLoading = false
    @Published var isLiked = false
    @Published var likesCount = 0
    @Published var error: String?

    private let api = APIService.shared

    func load(id: String) async {
        isLoading = true
        do {
            let response: SingleProjectResponse = try await api.get("/projects/\(id)", auth: false)
            project = response.project
            isLiked = response.project.isLiked ?? false
            likesCount = response.project.count?.likes ?? response.project.likeCount ?? 0

            let commentsResp: CommentsResponse = try await api.get("/comments/projects/\(id)/comments", auth: false)
            comments = commentsResp.comments
        } catch let err as APIError {
            error = err.errorDescription
        } catch {
            self.error = error.localizedDescription
        }
        isLoading = false
    }

    func toggleLike(projectId: String) async {
        do {
            let resp: LikeResponse = try await api.post("/likes/project/\(projectId)")
            isLiked = resp.liked
            likesCount += resp.liked ? 1 : -1
        } catch {}
    }

    func addComment(projectId: String, text: String) async {
        do {
            let body: [String: Any] = ["content": text, "projectId": projectId]
            let comment: Comment = try await api.post("/comments", body: body)
            comments.insert(comment, at: 0)
        } catch {}
    }

    func deleteComment(id: String, projectId: String) async {
        do {
            try await api.delete("/comments/\(id)")
            comments.removeAll { $0.id == id }
        } catch {}
    }
}
