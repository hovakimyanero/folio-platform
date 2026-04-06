import Foundation

@MainActor
class CollectionsViewModel: ObservableObject {
    @Published var collections: [Collection] = []
    @Published var isLoading = false
    @Published var error: String?

    private let api = APIService.shared

    func load() async {
        isLoading = true
        do {
            let resp: CollectionsResponse = try await api.get("/collections", auth: false)
            collections = resp.collections
        } catch let err as APIError {
            error = err.errorDescription
        } catch {
            self.error = error.localizedDescription
        }
        isLoading = false
    }

    func loadMy() async {
        isLoading = true
        do {
            let resp: CollectionsResponse = try await api.get("/collections/my")
            collections = resp.collections
        } catch let err as APIError {
            error = err.errorDescription
        } catch {
            self.error = error.localizedDescription
        }
        isLoading = false
    }

    func create(title: String, description: String) async -> Collection? {
        do {
            let body: [String: Any] = ["name": title, "description": description]
            let col: Collection = try await api.post("/collections", body: body)
            collections.insert(col, at: 0)
            return col
        } catch { return nil }
    }

    func delete(id: String) async {
        do {
            try await api.delete("/collections/\(id)")
            collections.removeAll { $0.id == id }
        } catch {}
    }

    func addProject(collectionId: String, projectId: String) async {
        do {
            let body = ["projectId": projectId]
            let _: [String: String] = try await api.post("/collections/\(collectionId)/projects", body: body)
        } catch {}
    }
}

@MainActor
class CollectionDetailViewModel: ObservableObject {
    @Published var collection: Collection?
    @Published var projects: [Project] = []
    @Published var isLoading = false

    private let api = APIService.shared

    func load(id: String) async {
        isLoading = true
        do {
            let resp: CollectionResponse = try await api.get("/collections/\(id)", auth: false)
            collection = resp.collection
            let col = resp.collection
            projects = col.items?.compactMap { $0.project } ?? []
        } catch {}
        isLoading = false
    }

    func removeProject(collectionId: String, projectId: String) async {
        do {
            try await api.delete("/collections/\(collectionId)/projects/\(projectId)")
            projects.removeAll { $0.id == projectId }
        } catch {}
    }
}
