import Foundation
import SwiftUI

@MainActor
class SettingsViewModel: ObservableObject {
    @Published var displayName = ""
    @Published var bio = ""
    @Published var website = ""
    @Published var location = ""
    @Published var isSaving = false
    @Published var error: String?
    @Published var saved = false

    private let api = APIService.shared

    func loadProfile(_ user: User) {
        displayName = user.displayName ?? ""
        bio = user.bio ?? ""
        website = user.website ?? ""
        location = user.location ?? ""
    }

    func save() async -> User? {
        isSaving = true
        error = nil
        saved = false
        do {
            let body: [String: Any] = [
                "displayName": displayName,
                "bio": bio,
                "website": website,
                "location": location
            ]
            let user: User = try await api.patch("/users/profile", body: body)
            saved = true
            isSaving = false
            return user
        } catch let err as APIError {
            error = err.errorDescription
            isSaving = false
            return nil
        } catch {
            self.error = error.localizedDescription
            isSaving = false
            return nil
        }
    }

    func uploadAvatar(imageData: Data) async -> User? {
        do {
            let data = try await api.uploadMultipart(
                "/users/profile",
                fields: [:],
                files: [(name: "avatar", filename: "avatar.jpg", mime: "image/jpeg", data: imageData)]
            )
            let user = try JSONDecoder().decode(User.self, from: data)
            return user
        } catch {
            self.error = "Ошибка загрузки аватара"
            return nil
        }
    }
}
