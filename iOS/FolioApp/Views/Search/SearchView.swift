import SwiftUI

struct SearchView: View {
    @StateObject private var vm = SearchViewModel()

    var body: some View {
        VStack(spacing: 0) {
            // Search bar
            HStack {
                Image(systemName: "magnifyingglass")
                    .foregroundColor(.secondary)
                TextField("Поиск...", text: $vm.query)
                    .textFieldStyle(.plain)
                    .autocapitalization(.none)
                    .onSubmit { Task { await vm.search() } }
                if !vm.query.isEmpty {
                    Button {
                        vm.clear()
                    } label: {
                        Image(systemName: "xmark.circle.fill")
                            .foregroundColor(.secondary)
                    }
                }
            }
            .padding()
            .background(Color(.systemGray6))
            .cornerRadius(12)
            .padding()

            // Type picker
            Picker("Тип", selection: $vm.searchType) {
                ForEach(SearchViewModel.SearchType.allCases, id: \.self) { type in
                    Text(type.rawValue).tag(type)
                }
            }
            .pickerStyle(.segmented)
            .padding(.horizontal)
            .onChange(of: vm.searchType) { _ in
                if !vm.query.isEmpty {
                    Task { await vm.search() }
                }
            }

            if vm.isLoading {
                Spacer()
                ProgressView()
                Spacer()
            } else {
                ScrollView {
                    switch vm.searchType {
                    case .projects:
                        if vm.projects.isEmpty && !vm.query.isEmpty {
                            emptyState("Проекты не найдены")
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
                            .padding()
                        }

                    case .users:
                        if vm.users.isEmpty && !vm.query.isEmpty {
                            emptyState("Пользователи не найдены")
                        } else {
                            LazyVStack(spacing: 8) {
                                ForEach(vm.users) { user in
                                    NavigationLink {
                                        ProfileView(username: user.username)
                                    } label: {
                                        UserRow(user: user)
                                    }
                                    .buttonStyle(.plain)
                                }
                            }
                            .padding()
                        }
                    }
                }
            }
        }
        .navigationTitle("Поиск")
        .navigationBarTitleDisplayMode(.inline)
    }

    @ViewBuilder
    func emptyState(_ text: String) -> some View {
        VStack(spacing: 12) {
            Image(systemName: "magnifyingglass")
                .font(.system(size: 40))
                .foregroundColor(.gray)
            Text(text)
                .foregroundColor(.secondary)
        }
        .padding(.top, 60)
    }
}

struct UserRow: View {
    let user: User

    var body: some View {
        HStack(spacing: 12) {
            AsyncImage(url: URL(string: user.avatar ?? "")) { phase in
                if let img = phase.image {
                    img.resizable()
                } else {
                    Circle().fill(Color.gray.opacity(0.3))
                }
            }
            .frame(width: 44, height: 44)
            .clipShape(Circle())

            VStack(alignment: .leading, spacing: 2) {
                Text(user.displayName ?? user.username)
                    .font(.callout.bold())
                Text("@\(user.username)")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            Spacer()
        }
        .padding(.vertical, 4)
    }
}
