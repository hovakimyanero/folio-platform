import SwiftUI

struct CollectionsView: View {
    @StateObject private var vm = CollectionsViewModel()
    @EnvironmentObject var authVM: AuthViewModel
    @State private var showCreate = false
    @State private var newTitle = ""
    @State private var newDescription = ""

    var body: some View {
        NavigationStack {
            ScrollView {
                if vm.isLoading && vm.collections.isEmpty {
                    ProgressView().padding(.top, 60)
                } else if vm.collections.isEmpty {
                    VStack(spacing: 12) {
                        Image(systemName: "folder")
                            .font(.system(size: 50))
                            .foregroundColor(.gray)
                        Text("Нет коллекций")
                            .foregroundColor(.secondary)
                    }
                    .padding(.top, 60)
                } else {
                    LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 16) {
                        ForEach(vm.collections) { collection in
                            NavigationLink {
                                CollectionDetailView(collectionId: collection.id)
                            } label: {
                                CollectionCard(collection: collection)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    .padding()
                }
            }
            .navigationTitle("Коллекции")
            .toolbar {
                if authVM.isAuthenticated {
                    ToolbarItem(placement: .navigationBarTrailing) {
                        Button {
                            showCreate = true
                        } label: {
                            Image(systemName: "plus")
                        }
                    }
                }
            }
            .refreshable { await vm.load() }
            .task { await vm.load() }
            .alert("Новая коллекция", isPresented: $showCreate) {
                TextField("Название", text: $newTitle)
                TextField("Описание", text: $newDescription)
                Button("Создать") {
                    Task {
                        _ = await vm.create(title: newTitle, description: newDescription)
                        newTitle = ""
                        newDescription = ""
                    }
                }
                Button("Отмена", role: .cancel) {}
            }
        }
    }
}

struct CollectionCard: View {
    let collection: Collection

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            // Preview image
            if let firstItem = collection.items?.first, let cover = firstItem.project?.cover {
                AsyncImage(url: URL(string: cover)) { phase in
                    if let img = phase.image {
                        img.resizable().aspectRatio(4/3, contentMode: .fill)
                    } else {
                        placeholderRect
                    }
                }
                .clipped()
                .cornerRadius(12)
            } else {
                placeholderRect
                    .cornerRadius(12)
            }

            Text(collection.title)
                .font(.callout.bold())
                .lineLimit(1)

            Text("\(collection.count?.items ?? collection.items?.count ?? 0) проектов")
                .font(.caption)
                .foregroundColor(.secondary)
        }
    }

    var placeholderRect: some View {
        Rectangle()
            .fill(Color.gray.opacity(0.15))
            .aspectRatio(4/3, contentMode: .fill)
            .overlay {
                Image(systemName: "folder")
                    .font(.title)
                    .foregroundColor(.gray)
            }
    }
}

struct CollectionDetailView: View {
    let collectionId: String
    @StateObject private var vm = CollectionDetailViewModel()

    var body: some View {
        ScrollView {
            if vm.isLoading {
                ProgressView().padding(.top, 60)
            } else {
                VStack(alignment: .leading, spacing: 16) {
                    if let col = vm.collection {
                        Text(col.title)
                            .font(.title.bold())
                            .padding(.horizontal)
                        if let desc = col.description, !desc.isEmpty {
                            Text(desc)
                                .foregroundColor(.secondary)
                                .padding(.horizontal)
                        }
                    }

                    if vm.projects.isEmpty {
                        VStack(spacing: 8) {
                            Image(systemName: "photo.on.rectangle")
                                .font(.system(size: 40))
                                .foregroundColor(.gray)
                            Text("Коллекция пуста")
                                .foregroundColor(.secondary)
                        }
                        .frame(maxWidth: .infinity)
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
            }
        }
        .navigationBarTitleDisplayMode(.inline)
        .task { await vm.load(id: collectionId) }
    }
}
