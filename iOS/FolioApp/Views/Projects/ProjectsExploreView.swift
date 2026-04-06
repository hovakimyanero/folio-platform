import SwiftUI

struct ProjectsExploreView: View {
    @StateObject private var vm = ProjectsViewModel()
    var initialSort: String = "latest"

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Sort picker
                Picker("Сортировка", selection: $vm.sort) {
                    Text("Новые").tag("latest")
                    Text("Популярные").tag("popular")
                }
                .pickerStyle(.segmented)
                .padding()
                .onChange(of: vm.sort) { _ in
                    Task { await vm.refresh() }
                }

                ScrollView {
                    LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                        ForEach(vm.projects) { project in
                            NavigationLink {
                                ProjectDetailView(projectId: project.id)
                            } label: {
                                ProjectCard(project: project)
                            }
                            .buttonStyle(.plain)
                            .onAppear {
                                if project.id == vm.projects.last?.id {
                                    Task { await vm.loadMore() }
                                }
                            }
                        }
                    }
                    .padding(.horizontal)

                    if vm.isLoading {
                        ProgressView()
                            .padding()
                    }
                }
            }
            .navigationTitle("Проекты")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    NavigationLink {
                        SearchView()
                    } label: {
                        Image(systemName: "magnifyingglass")
                    }
                }
            }
            .refreshable {
                await vm.refresh()
            }
            .task {
                if vm.projects.isEmpty {
                    vm.sort = initialSort
                    await vm.load()
                }
            }
        }
    }
}
