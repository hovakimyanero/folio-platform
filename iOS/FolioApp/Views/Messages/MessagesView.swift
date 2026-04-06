import SwiftUI

struct ConversationsView: View {
    @StateObject private var vm = MessagesViewModel()
    @EnvironmentObject var authVM: AuthViewModel

    var body: some View {
        List {
            if vm.isLoading && vm.conversations.isEmpty {
                ProgressView()
                    .frame(maxWidth: .infinity)
                    .listRowSeparator(.hidden)
            } else if vm.conversations.isEmpty {
                VStack(spacing: 12) {
                    Image(systemName: "bubble.left.and.bubble.right")
                        .font(.system(size: 40))
                        .foregroundColor(.gray)
                    Text("Нет сообщений")
                        .foregroundColor(.secondary)
                }
                .frame(maxWidth: .infinity)
                .padding(.top, 40)
                .listRowSeparator(.hidden)
            } else {
                ForEach(vm.conversations) { conversation in
                    let other = conversation.partner
                    NavigationLink {
                        ChatView(
                            recipientId: other?.id ?? "",
                            recipientName: other?.displayName ?? other?.username ?? "Чат",
                            conversationId: conversation.id
                        )
                    } label: {
                        HStack(spacing: 12) {
                            AsyncImage(url: URL(string: other?.avatar ?? "")) { phase in
                                if let img = phase.image {
                                    img.resizable()
                                } else {
                                    Circle().fill(Color.gray.opacity(0.3))
                                }
                            }
                            .frame(width: 48, height: 48)
                            .clipShape(Circle())

                            VStack(alignment: .leading, spacing: 4) {
                                Text(other?.displayName ?? other?.username ?? "")
                                    .font(.callout.bold())
                                if let last = conversation.lastMessage {
                                    Text(last.content ?? "")
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                        .lineLimit(1)
                                }
                            }

                            Spacer()

                            if let unread = conversation.unread, unread > 0 {
                                Text("\(unread)")
                                    .font(.caption2)
                                    .padding(6)
                                    .background(Color.blue)
                                    .foregroundColor(.white)
                                    .clipShape(Circle())
                            }
                        }
                    }
                }
            }
        }
        .listStyle(.plain)
        .navigationTitle("Сообщения")
        .refreshable { await vm.loadConversations() }
        .task { await vm.loadConversations() }
    }
}

struct ChatView: View {
    let recipientId: String
    let recipientName: String
    var conversationId: String?

    @StateObject private var vm = MessagesViewModel()
    @State private var messageText = ""

    var body: some View {
        VStack(spacing: 0) {
            ScrollViewReader { proxy in
                ScrollView {
                    LazyVStack(spacing: 8) {
                        ForEach(vm.messages) { message in
                            MessageBubble(message: message, isMine: message.senderId == currentUserId)
                                .id(message.id)
                        }
                    }
                    .padding()
                }
                .onChange(of: vm.messages.count) { _ in
                    if let last = vm.messages.last {
                        withAnimation { proxy.scrollTo(last.id, anchor: .bottom) }
                    }
                }
            }

            Divider()

            // Input
            HStack(spacing: 10) {
                TextField("Сообщение...", text: $messageText)
                    .textFieldStyle(.roundedBorder)

                Button {
                    let text = messageText
                    messageText = ""
                    Task { await vm.sendMessage(to: recipientId, text: text) }
                } label: {
                    Image(systemName: "paperplane.fill")
                        .foregroundColor(.blue)
                }
                .disabled(messageText.trimmingCharacters(in: .whitespaces).isEmpty)
            }
            .padding()
        }
        .navigationTitle(recipientName)
        .navigationBarTitleDisplayMode(.inline)
        .task {
            if let cid = conversationId {
                await vm.loadMessages(conversationId: cid)
            }
        }
    }

    @EnvironmentObject var authVM: AuthViewModel
    private var currentUserId: String? { authVM.currentUser?.id }
}

struct MessageBubble: View {
    let message: Message
    let isMine: Bool

    var body: some View {
        HStack {
            if isMine { Spacer() }
            VStack(alignment: isMine ? .trailing : .leading, spacing: 2) {
                Text(message.text ?? "")
                    .padding(.horizontal, 12)
                    .padding(.vertical, 8)
                    .background(isMine ? Color.blue : Color(.systemGray5))
                    .foregroundColor(isMine ? .white : .primary)
                    .cornerRadius(16)

                if let date = message.createdAt {
                    Text(formatTime(date))
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }
            }
            if !isMine { Spacer() }
        }
    }

    func formatTime(_ dateString: String) -> String {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        guard let date = f.date(from: dateString) else { return "" }
        let df = DateFormatter()
        df.timeStyle = .short
        return df.string(from: date)
    }
}
