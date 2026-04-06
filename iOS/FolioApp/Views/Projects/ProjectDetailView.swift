import SwiftUI

struct ProjectDetailView: View {
    let projectId: String
    @StateObject private var vm = ProjectDetailViewModel()
    @EnvironmentObject var authVM: AuthViewModel
    @State private var commentText = ""
    @State private var showShareSheet = false

    var body: some View {
        ScrollView {
            if vm.isLoading {
                ProgressView()
                    .frame(maxHeight: .infinity)
                    .padding(.top, 100)
            } else if let project = vm.project {
                VStack(alignment: .leading, spacing: 20) {
                    // Cover
                    AsyncImage(url: URL(string: project.cover ?? "")) { phase in
                        if let img = phase.image {
                            img.resizable().aspectRatio(contentMode: .fit)
                        } else {
                            Rectangle()
                                .fill(Color.gray.opacity(0.1))
                                .aspectRatio(16/9, contentMode: .fit)
                                .overlay { ProgressView() }
                        }
                    }

                    VStack(alignment: .leading, spacing: 16) {
                        // Title & actions
                        HStack {
                            Text(project.title)
                                .font(.title.bold())
                            Spacer()
                            Button {
                                Task { await vm.toggleLike(projectId: project.id) }
                            } label: {
                                HStack(spacing: 4) {
                                    Image(systemName: vm.isLiked ? "heart.fill" : "heart")
                                        .foregroundColor(vm.isLiked ? .pink : .gray)
                                    Text("\(vm.likesCount)")
                                        .font(.callout)
                                }
                            }
                        }

                        // Author
                        if let author = project.author {
                            NavigationLink {
                                ProfileView(username: author.username)
                            } label: {
                                HStack(spacing: 10) {
                                    AsyncImage(url: URL(string: author.avatar ?? "")) { phase in
                                        if let img = phase.image {
                                            img.resizable()
                                        } else {
                                            Circle().fill(Color.gray.opacity(0.3))
                                        }
                                    }
                                    .frame(width: 36, height: 36)
                                    .clipShape(Circle())

                                    VStack(alignment: .leading) {
                                        Text(author.displayName ?? author.username)
                                            .font(.callout.bold())
                                        Text("@\(author.username)")
                                            .font(.caption)
                                            .foregroundColor(.secondary)
                                    }
                                }
                            }
                            .buttonStyle(.plain)
                        }

                        // Description
                        if let desc = project.description, !desc.isEmpty {
                            Text(desc)
                                .font(.body)
                                .foregroundColor(.secondary)
                        }

                        // Category & tags
                        HStack {
                            if let cat = project.category {
                                Text(cat)
                                    .font(.caption)
                                    .padding(.horizontal, 10)
                                    .padding(.vertical, 4)
                                    .background(Color.blue.opacity(0.1))
                                    .foregroundColor(.blue)
                                    .cornerRadius(12)
                            }

                            if let tags = project.tags {
                                ForEach(tags, id: \.self) { tag in
                                    Text("#\(tag)")
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                }
                            }
                        }

                        // Stats
                        HStack(spacing: 20) {
                            Label("\(project.viewCount ?? 0)", systemImage: "eye")
                            Label("\(vm.likesCount)", systemImage: "heart")
                            Label("\(vm.comments.count)", systemImage: "bubble.right")
                        }
                        .font(.caption)
                        .foregroundColor(.secondary)

                        // Media gallery
                        let mediaUrls = (project.media ?? []).filter { $0.url != project.cover }
                        if !mediaUrls.isEmpty {
                            VStack(spacing: 12) {
                                ForEach(mediaUrls, id: \.id) { media in
                                    AsyncImage(url: URL(string: media.url)) { phase in
                                        if let img = phase.image {
                                            img.resizable().aspectRatio(contentMode: .fit)
                                        } else {
                                            Rectangle()
                                                .fill(Color.gray.opacity(0.1))
                                                .aspectRatio(16/9, contentMode: .fit)
                                                .overlay { ProgressView() }
                                        }
                                    }
                                    .cornerRadius(8)
                                }
                            }
                        }

                        Divider()

                        // Comments section
                        VStack(alignment: .leading, spacing: 12) {
                            Text("Комментарии (\(vm.comments.count))")
                                .font(.headline)

                            if authVM.isAuthenticated {
                                HStack {
                                    TextField("Написать комментарий...", text: $commentText)
                                        .textFieldStyle(.roundedBorder)
                                    Button {
                                        Task {
                                            await vm.addComment(projectId: project.id, text: commentText)
                                            commentText = ""
                                        }
                                    } label: {
                                        Image(systemName: "paperplane.fill")
                                    }
                                    .disabled(commentText.trimmingCharacters(in: .whitespaces).isEmpty)
                                }
                            }

                            ForEach(vm.comments) { comment in
                                CommentRow(comment: comment) {
                                    Task { await vm.deleteComment(id: comment.id, projectId: project.id) }
                                }
                            }
                        }
                    }
                    .padding(.horizontal)
                }
            } else if let error = vm.error {
                Text(error)
                    .foregroundColor(.red)
                    .padding()
            }
        }
        .navigationBarTitleDisplayMode(.inline)
        .task {
            await vm.load(id: projectId)
        }
    }
}

struct CommentRow: View {
    let comment: Comment
    let onDelete: () -> Void
    @EnvironmentObject var authVM: AuthViewModel

    var body: some View {
        HStack(alignment: .top, spacing: 10) {
            AsyncImage(url: URL(string: comment.author?.avatar ?? "")) { phase in
                if let img = phase.image {
                    img.resizable()
                } else {
                    Circle().fill(Color.gray.opacity(0.3))
                }
            }
            .frame(width: 32, height: 32)
            .clipShape(Circle())

            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text(comment.author?.displayName ?? comment.author?.username ?? "")
                        .font(.caption.bold())
                    Spacer()
                    if let date = comment.createdAt {
                        Text(formatRelativeDate(date))
                            .font(.caption2)
                            .foregroundColor(.secondary)
                    }
                }
                Text(comment.text)
                    .font(.callout)
            }

            if comment.author?.id == authVM.currentUser?.id {
                Button(role: .destructive) {
                    onDelete()
                } label: {
                    Image(systemName: "trash")
                        .font(.caption)
                }
            }
        }
        .padding(.vertical, 4)
    }
}

private func formatRelativeDate(_ dateString: String) -> String {
    let formatter = ISO8601DateFormatter()
    formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
    guard let date = formatter.date(from: dateString) else { return dateString }
    let diff = Date().timeIntervalSince(date)
    if diff < 60 { return "только что" }
    if diff < 3600 { return "\(Int(diff / 60)) мин." }
    if diff < 86400 { return "\(Int(diff / 3600)) ч." }
    if diff < 604800 { return "\(Int(diff / 86400)) дн." }
    let df = DateFormatter()
    df.dateStyle = .short
    return df.string(from: date)
}
