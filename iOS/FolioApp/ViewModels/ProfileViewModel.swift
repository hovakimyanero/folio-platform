import Foundation

@MainActor
class ProfileViewModel: ObservableObject {
    @Published var user: User?
    @Published var projects: [Project] = []
    @Published var stats: UserStats?
    @Published var isLoading = false
    @Published var error: String?
    @Published var isFollowing = false

    private let api = APIService.shared

    func loadProfile(username: String) async {
        isLoading = true
        do {
            let resp: UserResponse = try await api.get("/users/\(username)", auth: false)
            user = resp.user
            isFollowing = resp.user.isFollowing ?? false
            let projResp: ProjectsResponse = try await api.get("/users/\(username)/projects", auth: false)
            projects = projResp.projects
        } catch let err as APIError {
            error = err.errorDescription
        } catch {
            self.error = error.localizedDescription
        }
        isLoading = false
    }

    func toggleFollow(userId: String) async {
        do {
            let resp: FollowResponse = try await api.post("/users/\(userId)/follow")
            isFollowing = resp.following
        } catch {}
    }
}


