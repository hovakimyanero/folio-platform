import SwiftUI

struct ProjectCard: View {
    let project: Project

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            // Cover image
            AsyncImage(url: URL(string: project.cover ?? "")) { phase in
                switch phase {
                case .success(let image):
                    image
                        .resizable()
                        .aspectRatio(4/3, contentMode: .fill)
                case .failure:
                    Rectangle()
                        .fill(Color.gray.opacity(0.2))
                        .aspectRatio(4/3, contentMode: .fill)
                        .overlay {
                            Image(systemName: "photo")
                                .foregroundColor(.gray)
                        }
                default:
                    Rectangle()
                        .fill(Color.gray.opacity(0.1))
                        .aspectRatio(4/3, contentMode: .fill)
                        .overlay { ProgressView() }
                }
            }
            .clipped()
            .cornerRadius(12)

            // Info
            VStack(alignment: .leading, spacing: 4) {
                Text(project.title)
                    .font(.callout.bold())
                    .lineLimit(1)

                HStack(spacing: 12) {
                    if let author = project.author {
                        HStack(spacing: 4) {
                            AsyncImage(url: URL(string: author.avatar ?? "")) { phase in
                                if let img = phase.image {
                                    img.resizable()
                                } else {
                                    Circle().fill(Color.gray.opacity(0.3))
                                }
                            }
                            .frame(width: 18, height: 18)
                            .clipShape(Circle())

                            Text(author.displayName ?? author.username)
                                .font(.caption)
                                .foregroundColor(.secondary)
                                .lineLimit(1)
                        }
                    }

                    Spacer()

                    HStack(spacing: 4) {
                        Image(systemName: "heart.fill")
                            .font(.caption2)
                            .foregroundColor(.pink)
                        Text("\(project.count?.likes ?? 0)")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }

                    HStack(spacing: 4) {
                        Image(systemName: "eye.fill")
                            .font(.caption2)
                            .foregroundColor(.gray)
                        Text("\(project.viewCount ?? 0)")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
            }
            .padding(.horizontal, 4)
        }
    }
}
