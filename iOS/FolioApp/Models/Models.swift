import Foundation

// MARK: - User
struct User: Codable, Identifiable {
    let id: String
    let email: String?
    let username: String
    var displayName: String?
    var avatar: String?
    var cover: String?
    var bio: String?
    var website: String?
    var location: String?
    var skills: [String]?
    var specialization: [String]?
    var languages: [String]?
    var role: String?
    var isVerified: Bool?
    var isAdmin: Bool?
    var isFollowing: Bool?
    var count: UserCounts?

    enum CodingKeys: String, CodingKey {
        case id, email, username, displayName, avatar, cover, bio, website
        case location, skills, specialization, languages, role, isVerified, isAdmin
        case isFollowing
        case count = "_count"
    }
}

struct UserCounts: Codable {
    let followers: Int?
    let following: Int?
    let projects: Int?
}

// MARK: - Project
struct Project: Codable, Identifiable {
    let id: String
    let title: String
    let description: String?
    let cover: String?
    let published: Bool?
    let featured: Bool?
    let viewCount: Int?
    let likeCount: Int?
    let commentCount: Int?
    let tags: [String]?
    let tools: [String]?
    let colors: [String]?
    let categoryId: String?
    let authorId: String?
    let createdAt: String?
    let updatedAt: String?
    let author: User?
    let media: [ProjectMedia]?
    let category: Category?
    var isLiked: Bool?
    var isFollowing: Bool?
    var count: ProjectCounts?

    enum CodingKeys: String, CodingKey {
        case id, title, description, cover, published, featured
        case viewCount, likeCount, commentCount, tags, tools, colors
        case categoryId, authorId, createdAt, updatedAt
        case author, media, category, isLiked, isFollowing
        case count = "_count"
    }
}

struct ProjectCounts: Codable {
    let likes: Int?
    let comments: Int?
}

struct ProjectMedia: Codable, Identifiable {
    let id: String
    let url: String
    let type: String?
    let order: Int?
}

struct Category: Codable, Identifiable {
    let id: String?
    let name: String
    let slug: String?
}

// MARK: - Collection
struct Collection: Codable, Identifiable {
    let id: String
    let name: String          // API uses "name"
    let description: String?
    let cover: String?
    let isPrivate: Bool?
    let userId: String?
    let createdAt: String?
    let user: User?
    let items: [CollectionItem]?
    var count: CollectionCounts?

    enum CodingKeys: String, CodingKey {
        case id, name, description, cover, isPrivate, userId, createdAt
        case user, items
        case count = "_count"
    }

    var title: String { name }  // Convenience alias
}

struct CollectionCounts: Codable {
    let items: Int?
}

struct CollectionItem: Codable, Identifiable {
    let id: String
    let project: Project?
}

// MARK: - Challenge
struct Challenge: Codable, Identifiable {
    let id: String
    let title: String
    let description: String?
    let cover: String?
    let rules: String?
    let deadline: String?
    let isActive: Bool?
    let createdAt: String?
    let entries: [ChallengeEntry]?
    var hasEntered: Bool?
    var count: ChallengeCounts?

    enum CodingKeys: String, CodingKey {
        case id, title, description, cover, rules, deadline, isActive
        case createdAt, entries, hasEntered
        case count = "_count"
    }
}

struct ChallengeCounts: Codable {
    let entries: Int?
}

struct ChallengeEntry: Codable, Identifiable {
    let id: String
    let userId: String?
    let projectId: String?
    let score: Double?
    let isWinner: Bool?
    let createdAt: String?
    let user: User?
    let project: Project?
}

// MARK: - Comment
struct Comment: Codable, Identifiable {
    let id: String
    let content: String       // API uses "content"
    let userId: String?
    let projectId: String?
    let parentId: String?
    let createdAt: String?
    let updatedAt: String?
    let user: User?           // API uses "user"
    let replies: [Comment]?

    var text: String { content }  // Convenience alias
    var author: User? { user }    // Convenience alias
}

// MARK: - Conversation & Message
struct Conversation: Codable, Identifiable {
    let partner: User?
    let lastMessage: Message?
    let unread: Int?

    // Conversations from this API don't have a real ID
    var id: String { partner?.id ?? UUID().uuidString }
}

struct Message: Codable, Identifiable {
    let id: String
    let content: String?       // API uses "content"
    let senderId: String?
    let receiverId: String?
    let read: Bool?
    let fileUrl: String?
    let fileName: String?
    let createdAt: String?
    let sender: User?
    let receiver: User?

    var text: String? { content }  // Convenience alias
}

// MARK: - Notification
struct AppNotification: Codable, Identifiable {
    let id: String
    let type: String?
    var read: Bool?
    let recipientId: String?
    let actorId: String?
    let entityType: String?
    let entityId: String?
    let createdAt: String?
    let actor: User?
    let message: String?     // Not in API but kept for flexibility
}

// MARK: - API Responses
struct AuthResponse: Codable {
    let user: User?
    let accessToken: String?
    let refreshToken: String?
    let message: String?
    let needsVerification: Bool?
}

struct UserResponse: Codable {
    let user: User
}

struct ProjectsResponse: Codable {
    let projects: [Project]
    let pagination: Pagination?
}

struct Pagination: Codable {
    let page: Int
    let limit: Int
    let total: Int
    let pages: Int
}

struct SingleProjectResponse: Codable {
    let project: Project
    let similar: [Project]?
    let moreByAuthor: [Project]?
}

struct CollectionsResponse: Codable {
    let collections: [Collection]
}

struct CollectionResponse: Codable {
    let collection: Collection
}

struct ChallengesResponse: Codable {
    let challenges: [Challenge]
}

struct ChallengeResponse: Codable {
    let challenge: Challenge
}

struct CommentsResponse: Codable {
    let comments: [Comment]
}

struct LikeResponse: Codable {
    let liked: Bool
}

struct FollowResponse: Codable {
    let following: Bool
}

struct PresignResponse: Codable {
    let uploads: [PresignUpload]
}

struct PresignUpload: Codable {
    let uploadUrl: String
    let fileUrl: String
    let key: String
}

struct NotificationsResponse: Codable {
    let notifications: [AppNotification]
    let unreadCount: Int?
}

struct ConversationsResponse: Codable {
    let conversations: [Conversation]
}

struct MessagesListResponse: Codable {
    let messages: [Message]
}

struct ErrorResponse: Codable {
    let error: ErrorDetail
}

struct ErrorDetail: Codable {
    let message: String
    let code: String?
}
