import SwiftUI

struct ChallengesView: View {
    @StateObject private var vm = ChallengesViewModel()

    var body: some View {
        NavigationStack {
            ScrollView {
                if vm.isLoading && vm.challenges.isEmpty {
                    ProgressView().padding(.top, 60)
                } else if vm.challenges.isEmpty {
                    VStack(spacing: 12) {
                        Image(systemName: "trophy")
                            .font(.system(size: 50))
                            .foregroundColor(.gray)
                        Text("Нет активных челленджей")
                            .foregroundColor(.secondary)
                    }
                    .padding(.top, 60)
                } else {
                    LazyVStack(spacing: 16) {
                        ForEach(vm.challenges) { challenge in
                            NavigationLink {
                                ChallengeDetailView(challengeId: challenge.id)
                            } label: {
                                ChallengeCard(challenge: challenge)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    .padding()
                }
            }
            .navigationTitle("Челленджи")
            .refreshable { await vm.load() }
            .task { await vm.load() }
        }
    }
}

struct ChallengeCard: View {
    let challenge: Challenge

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            if let cover = challenge.cover {
                AsyncImage(url: URL(string: cover)) { phase in
                    if let img = phase.image {
                        img.resizable().aspectRatio(16/9, contentMode: .fill)
                    } else {
                        Rectangle().fill(Color.orange.opacity(0.1)).aspectRatio(16/9, contentMode: .fill)
                    }
                }
                .clipped()
                .cornerRadius(12)
            }

            VStack(alignment: .leading, spacing: 6) {
                Text(challenge.title)
                    .font(.headline)
                if let desc = challenge.description {
                    Text(desc)
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .lineLimit(2)
                }

                HStack {
                    Label("\(challenge.count?.entries ?? 0) работ", systemImage: "photo.stack")
                        .font(.caption)
                        .foregroundColor(.secondary)

                    Spacer()

                    if let isActive = challenge.isActive {
                        Text(isActive ? "Активный" : "Завершён")
                            .font(.caption)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 2)
                            .background((isActive ? Color.green : Color.gray).opacity(0.15))
                            .foregroundColor(isActive ? .green : .gray)
                            .cornerRadius(8)
                    }
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(16)
        .shadow(color: .black.opacity(0.05), radius: 8, y: 2)
    }

    }
}

struct ChallengeDetailView: View {
    let challengeId: String
    @StateObject private var vm = ChallengeDetailViewModel()

    var body: some View {
        ScrollView {
            if vm.isLoading {
                ProgressView().padding(.top, 60)
            } else if let challenge = vm.challenge {
                VStack(alignment: .leading, spacing: 20) {
                    if let cover = challenge.cover {
                        AsyncImage(url: URL(string: cover)) { phase in
                            if let img = phase.image {
                                img.resizable().aspectRatio(contentMode: .fit)
                            } else {
                                Color.gray.opacity(0.1).aspectRatio(16/9, contentMode: .fit)
                            }
                        }
                    }

                    VStack(alignment: .leading, spacing: 12) {
                        Text(challenge.title)
                            .font(.title.bold())
                        if let desc = challenge.description {
                            Text(desc)
                                .foregroundColor(.secondary)
                        }

                        if let start = challenge.startDate, let end = challenge.endDate {
                            HStack {
                                Label(formatDate(start), systemImage: "calendar")
                                Text("—")
                                Text(formatDate(end))
                            }
                            .font(.caption)
                            .foregroundColor(.secondary)
                        }
                    }
                    .padding(.horizontal)

                    if vm.entries.isEmpty {
                        Text("Нет работ")
                            .foregroundColor(.secondary)
                            .frame(maxWidth: .infinity)
                            .padding(.top, 32)
                    } else {
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Работы участников")
                                .font(.headline)
                                .padding(.horizontal)

                            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                                ForEach(vm.entries) { project in
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
        }
        .navigationBarTitleDisplayMode(.inline)
        .task { await vm.load(id: challengeId) }
    }

    func formatDate(_ dateString: String) -> String {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        guard let date = f.date(from: dateString) else { return dateString }
        let df = DateFormatter()
        df.dateStyle = .medium
        df.locale = Locale(identifier: "ru_RU")
        return df.string(from: date)
    }
}
