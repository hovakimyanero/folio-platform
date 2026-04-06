package com.folio.app.data.models

import com.google.gson.annotations.SerializedName

// User
data class User(
    val id: String,
    val email: String? = null,
    val username: String,
    val displayName: String? = null,
    val avatar: String? = null,
    val cover: String? = null,
    val bio: String? = null,
    val website: String? = null,
    val location: String? = null,
    val role: String? = null,
    val skills: List<String>? = null,
    val specialization: List<String>? = null,
    val languages: List<String>? = null,
    val isVerified: Boolean? = null,
    val isAdmin: Boolean? = null,
    val isFollowing: Boolean? = null,
    val createdAt: String? = null,
    @SerializedName("_count") val count: UserCounts? = null
)

data class UserCounts(
    val followers: Int? = null,
    val following: Int? = null,
    val projects: Int? = null
)

// Project
data class Project(
    val id: String,
    val title: String,
    val description: String? = null,
    val cover: String? = null,
    val published: Boolean? = null,
    val featured: Boolean? = null,
    val viewCount: Int? = null,
    val likeCount: Int? = null,
    val commentCount: Int? = null,
    val tags: List<String>? = null,
    val tools: List<String>? = null,
    val colors: List<String>? = null,
    val categoryId: String? = null,
    val authorId: String? = null,
    val createdAt: String? = null,
    val updatedAt: String? = null,
    val author: User? = null,
    val media: List<ProjectMedia>? = null,
    val category: Category? = null,
    var isLiked: Boolean? = null,
    var isFollowing: Boolean? = null,
    @SerializedName("_count") val count: ProjectCounts? = null
)

data class ProjectCounts(
    val likes: Int? = null,
    val comments: Int? = null
)

data class ProjectMedia(
    val id: String,
    val url: String,
    val type: String? = null,
    val order: Int? = null
)

data class Category(
    val id: String? = null,
    val name: String,
    val slug: String? = null
)

// Collection
data class Collection(
    val id: String,
    val name: String,
    val description: String? = null,
    val cover: String? = null,
    val isPrivate: Boolean? = null,
    val userId: String? = null,
    val createdAt: String? = null,
    val user: User? = null,
    val items: List<CollectionItem>? = null,
    @SerializedName("_count") val count: CollectionCounts? = null
) {
    val title: String get() = name
}

data class CollectionCounts(val items: Int? = null)

data class CollectionItem(
    val id: String,
    val project: Project? = null
)

// Challenge
data class Challenge(
    val id: String,
    val title: String,
    val description: String? = null,
    val cover: String? = null,
    val rules: String? = null,
    val deadline: String? = null,
    val isActive: Boolean? = null,
    val createdAt: String? = null,
    val entries: List<ChallengeEntry>? = null,
    val hasEntered: Boolean? = null,
    @SerializedName("_count") val count: ChallengeCounts? = null
)

data class ChallengeCounts(val entries: Int? = null)

data class ChallengeEntry(
    val id: String,
    val userId: String? = null,
    val projectId: String? = null,
    val score: Double? = null,
    val isWinner: Boolean? = null,
    val createdAt: String? = null,
    val user: User? = null,
    val project: Project? = null
)

// Comment
data class Comment(
    val id: String,
    val content: String,
    val userId: String? = null,
    val projectId: String? = null,
    val parentId: String? = null,
    val createdAt: String? = null,
    val updatedAt: String? = null,
    val user: User? = null,
    val replies: List<Comment>? = null
)

// Conversation & Message
data class Conversation(
    val partner: User? = null,
    val lastMessage: Message? = null,
    val unread: Int? = null
) {
    val id: String get() = partner?.id ?: ""
}

data class Message(
    val id: String,
    val content: String? = null,
    val senderId: String? = null,
    val receiverId: String? = null,
    val read: Boolean? = null,
    val fileUrl: String? = null,
    val fileName: String? = null,
    val createdAt: String? = null,
    val sender: User? = null,
    val receiver: User? = null
) {
    val text: String get() = content ?: ""
}

// Notification
data class AppNotification(
    val id: String,
    val type: String? = null,
    var read: Boolean? = null,
    val recipientId: String? = null,
    val actorId: String? = null,
    val entityType: String? = null,
    val entityId: String? = null,
    val createdAt: String? = null,
    val actor: User? = null
)
