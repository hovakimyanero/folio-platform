import Foundation
import Combine

enum AuthState {
    case loading
    case authenticated(User)
    case unauthenticated
}

@MainActor
class AuthViewModel: ObservableObject {
    @Published var state: AuthState = .loading
    @Published var error: String?
    @Published var isLoading = false
    @Published var verificationSent = false
    @Published var resetSent = false

    var currentUser: User? {
        if case .authenticated(let user) = state { return user }
        return nil
    }

    var isAuthenticated: Bool {
        if case .authenticated = state { return true }
        return false
    }

    private let api = APIService.shared

    init() {
        Task { await checkAuth() }
    }

    func checkAuth() async {
        guard KeychainService.accessToken != nil else {
            state = .unauthenticated
            return
        }
        do {
            let user: User = try await api.get("/auth/me")
            state = .authenticated(user)
        } catch {
            KeychainService.accessToken = nil
            KeychainService.refreshToken = nil
            state = .unauthenticated
        }
    }

    func login(email: String, password: String) async {
        isLoading = true
        error = nil
        do {
            let body: [String: Any] = ["email": email, "password": password]
            let response: AuthResponse = try await api.post("/auth/login", body: body, auth: false)
            if let token = response.accessToken {
                KeychainService.accessToken = token
                if let refresh = response.refreshToken {
                    KeychainService.refreshToken = refresh
                }
                if let user = response.user {
                    state = .authenticated(user)
                } else {
                    await checkAuth()
                }
            }
        } catch let err as APIError {
            error = err.errorDescription
        } catch {
            self.error = error.localizedDescription
        }
        isLoading = false
    }

    func register(username: String, email: String, password: String) async {
        isLoading = true
        error = nil
        verificationSent = false
        do {
            let body: [String: Any] = ["username": username, "email": email, "password": password]
            let _: AuthResponse = try await api.post("/auth/register", body: body, auth: false)
            verificationSent = true
        } catch let err as APIError {
            error = err.errorDescription
        } catch {
            self.error = error.localizedDescription
        }
        isLoading = false
    }

    func forgotPassword(email: String) async {
        isLoading = true
        error = nil
        resetSent = false
        do {
            let body = ["email": email]
            let _: [String: String] = try await api.post("/auth/forgot-password", body: body, auth: false)
            resetSent = true
        } catch let err as APIError {
            error = err.errorDescription
        } catch {
            self.error = error.localizedDescription
        }
        isLoading = false
    }

    func resendVerification(email: String) async {
        do {
            let body = ["email": email]
            let _: [String: String] = try await api.post("/auth/resend-verification", body: body, auth: false)
        } catch {}
    }

    func logout() {
        KeychainService.accessToken = nil
        KeychainService.refreshToken = nil
        state = .unauthenticated
    }
}
