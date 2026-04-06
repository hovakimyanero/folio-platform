import Foundation

@MainActor
class ChallengesViewModel: ObservableObject {
    @Published var challenges: [Challenge] = []
    @Published var isLoading = false
    @Published var error: String?

    private let api = APIService.shared

    func load() async {
        isLoading = true
        do {
            let resp: ChallengesResponse = try await api.get("/challenges", auth: false)
            challenges = resp.challenges
        } catch let err as APIError {
            error = err.errorDescription
        } catch {
            self.error = error.localizedDescription
        }
        isLoading = false
    }
}

@MainActor
class ChallengeDetailViewModel: ObservableObject {
    @Published var challenge: Challenge?
    @Published var entries: [Project] = []
    @Published var isLoading = false

    private let api = APIService.shared

    func load(id: String) async {
        isLoading = true
        do {
            let resp: ChallengeResponse = try await api.get("/challenges/\(id)", auth: false)
            challenge = resp.challenge
            entries = resp.challenge.entries?.compactMap { $0.project } ?? []
        } catch {}
        isLoading = false
    }
}
