import Foundation

@MainActor
class MessagesViewModel: ObservableObject {
    @Published var conversations: [Conversation] = []
    @Published var messages: [Message] = []
    @Published var isLoading = false
    @Published var error: String?

    private let api = APIService.shared

    func loadConversations() async {
        isLoading = true
        do {
            let resp: ConversationsResponse = try await api.get("/messages/conversations")
            conversations = resp.conversations
        } catch let err as APIError {
            error = err.errorDescription
        } catch {
            self.error = error.localizedDescription
        }
        isLoading = false
    }

    func loadMessages(conversationId: String) async {
        isLoading = true
        do {
            let resp: MessagesListResponse = try await api.get("/messages/\(conversationId)")
            messages = resp.messages
        } catch let err as APIError {
            error = err.errorDescription
        } catch {
            self.error = error.localizedDescription
        }
        isLoading = false
    }

    func sendMessage(to userId: String, text: String) async {
        do {
            let body: [String: Any] = ["receiverId": userId, "content": text]
            let msg: Message = try await api.post("/messages", body: body)
            messages.append(msg)
        } catch {}
    }

    func startConversation(userId: String) async -> Conversation? {
        do {
            let body = ["recipientId": userId]
            let conv: Conversation = try await api.post("/messages/conversations", body: body)
            return conv
        } catch { return nil }
    }
}


