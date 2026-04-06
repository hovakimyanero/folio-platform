import SwiftUI

struct ProfileView: View {
    let username: String
    @StateObject private var vm = ProfileViewModel()
    @EnvironmentObject var authVM: AuthViewModel
    @State private var showSettings = false

    private var isOwnProfile: Bool {
        authVM.currentUser?.username == username
    }

    var body: some View {
        ScrollView {
            if vm.isLoading && vm.user == nil {
                ProgressView()
                    .padding(.top, 100)
            } else if let user = vm.user {
                VStack(spacing: 20) {
                    // Header
                    VStack(spacing: 12) {
                        AsyncImage(url: URL(string: user.avatar ?? "")) { phase in
                            if let img = phase.image {
                                img.resizable()
                            } else {
                                Circle()
                                    .fill(Color.gray.opacity(0.3))
                                    .overlay {
                                        Text(String(user.username.prefix(1)).uppercased())
                                            .font(.title.bold())
                                            .foregroundColor(.white)
                                    }
                            }
                        }
                        .frame(width: 100, height: 100)
                        .clipShape(Circle())

                        Text(user.displayName ?? user.username)
                            .font(.title2.bold())
                        Text("@\(user.username)")
                            .font(.subheadline)
                            .foregroundColor(.secondary)

                        if let bio = user.bio, !bio.isEmpty {
                            Text(bio)
                                .font(.body)
                                .foregroundColor(.secondary)
                                .multilineTextAlignment(.center)
                                .padding(.horizontal, 32)
                        }

                        HStack(spacing: 24) {
                            if let location = user.location, !location.isEmpty {
                                Label(location, systemImage: "mappin")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                            if let website = user.website, !website.isEmpty {
                                Label("Сайт", systemImage: "link")
                                    .font(.caption)
                                    .foregroundColor(.blue)
                            }
                        }

                        // Stats row
                        HStack(spacing: 32) {
                            VStack {
                                Text("\(vm.projects.count)")
                                    .font(.headline)
                                Text("Проектов")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                            VStack {
                                Text("\(user.count?.followers ?? 0)")
                                    .font(.headline)
                                Text("Подписчиков")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                            VStack {
                                Text("\(user.count?.following ?? 0)")
                                    .font(.headline)
                                Text("Подписок")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                        }
                        .padding(.top, 8)

                        // Action buttons
                        HStack(spacing: 12) {
                            if isOwnProfile {
                                Button("Настройки") {
                                    showSettings = true
                                }
                                .buttonStyle(.bordered)

                                NavigationLink("Сообщения") {
                                    ConversationsView()
                                }
                                .buttonStyle(.bordered)
                            } else {
                                Button(vm.isFollowing ? "Отписаться" : "Подписаться") {
                                    Task { await vm.toggleFollow(userId: user.id) }
                                }
                                .buttonStyle(vm.isFollowing ? .bordered : .borderedProminent)

                                NavigationLink("Сообщение") {
                                    ChatView(recipientId: user.id, recipientName: user.displayName ?? user.username)
                                }
                                .buttonStyle(.bordered)
                            }
                        }
                    }
                    .padding(.top, 20)

                    Divider().padding(.horizontal)

                    // Projects grid
                    if vm.projects.isEmpty {
                        VStack(spacing: 8) {
                            Image(systemName: "photo.on.rectangle")
                                .font(.system(size: 40))
                                .foregroundColor(.gray)
                            Text("Нет проектов")
                                .foregroundColor(.secondary)
                        }
                        .padding(.top, 40)
                    } else {
                        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                            ForEach(vm.projects) { project in
                                NavigationLink {
                                    ProjectDetailView(projectId: project.id)
                                } label: {
                                    ProjectCard(project: project)
                                }
                                .buttonStyle(.plain)
                            }
                        }
                        .padding(.horizontal)
                    }
                }
            } else if let error = vm.error {
                Text(error)
                    .foregroundColor(.red)
                    .padding()
            }
        }
        .navigationTitle(username)
        .navigationBarTitleDisplayMode(.inline)
        .sheet(isPresented: $showSettings) {
            SettingsView()
        }
        .refreshable {
            await vm.loadProfile(username: username)
        }
        .task {
            if vm.user == nil && !username.isEmpty {
                await vm.loadProfile(username: username)
            }
        }
    }
}
