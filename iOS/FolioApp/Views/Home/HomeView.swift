import SwiftUI

struct HomeView: View {
    @StateObject private var vm = HomeViewModel()

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 32) {
                    // Hero
                    VStack(spacing: 12) {
                        Text("Folio")
                            .font(.system(size: 42, weight: .bold))
                        Text("Платформа для дизайнеров и креативных профессионалов")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.top, 20)

                    // Categories
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Категории")
                            .font(.title2.bold())
                            .padding(.horizontal)

                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 10) {
                                ForEach(vm.categories, id: \.self) { cat in
                                    NavigationLink {
                                        CategoryProjectsView(category: cat)
                                    } label: {
                                        Text(cat)
                                            .font(.callout)
                                            .padding(.horizontal, 16)
                                            .padding(.vertical, 8)
                                            .background(Color.blue.opacity(0.1))
                                            .foregroundColor(.blue)
                                            .cornerRadius(20)
                                    }
                                }
                            }
                            .padding(.horizontal)
                        }
                    }

                    // Trending
                    VStack(alignment: .leading, spacing: 12) {
                        HStack {
                            Text("Популярное")
                                .font(.title2.bold())
                            Spacer()
                            NavigationLink("Все") {
                                ProjectsExploreView(initialSort: "popular")
                            }
                            .font(.callout)
                        }
                        .padding(.horizontal)

                        ScrollView(.horizontal, showsIndicators: false) {
                            LazyHStack(spacing: 12) {
                                ForEach(vm.trending) { project in
                                    NavigationLink {
                                        ProjectDetailView(projectId: project.id)
                                    } label: {
                                        ProjectCard(project: project)
                                            .frame(width: 260)
                                    }
                                    .buttonStyle(.plain)
                                }
                            }
                            .padding(.horizontal)
                        }
                    }

                    // Latest
                    VStack(alignment: .leading, spacing: 12) {
                        HStack {
                            Text("Новое")
                                .font(.title2.bold())
                            Spacer()
                            NavigationLink("Все") {
                                ProjectsExploreView(initialSort: "latest")
                            }
                            .font(.callout)
                        }
                        .padding(.horizontal)

                        LazyVGrid(columns: [
                            GridItem(.flexible()),
                            GridItem(.flexible())
                        ], spacing: 12) {
                            ForEach(vm.latest) { project in
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
                .padding(.bottom, 20)
            }
            .navigationTitle("")
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Text("Folio")
                        .font(.title2.bold())
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    NavigationLink {
                        SearchView()
                    } label: {
                        Image(systemName: "magnifyingglass")
                    }
                }
            }
            .refreshable {
                await vm.load()
            }
            .task {
                if vm.trending.isEmpty {
                    await vm.load()
                }
            }
        }
    }
}

struct CategoryProjectsView: View {
    let category: String
    @StateObject private var vm = ProjectsViewModel()

    var body: some View {
        ScrollView {
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

            if vm.isLoading {
                ProgressView()
                    .padding()
            }
        }
        .navigationTitle(category)
        .task {
            vm.category = category
            await vm.load()
        }
    }
}
