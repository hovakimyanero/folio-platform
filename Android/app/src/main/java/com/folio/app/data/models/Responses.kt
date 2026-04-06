package com.folio.app.data.models

// API response wrappers
data class AuthResponse(
    val user: User? = null,
    val accessToken: String? = null,
    val refreshToken: String? = null,
    val message: String? = null,
    val needsVerification: Boolean? = null
)

data class UserResponse(val user: User)

data class ProjectsResponse(
    val projects: List<Project>,
    val pagination: Pagination? = null
)

data class Pagination(
    val page: Int,
    val limit: Int,
    val total: Int,
    val pages: Int
)

data class SingleProjectResponse(
    val project: Project,
    val similar: List<Project>? = null,
    val moreByAuthor: List<Project>? = null
)

data class CollectionsResponse(val collections: List<Collection>)
data class CollectionResponse(val collection: Collection)
data class ChallengesResponse(val challenges: List<Challenge>)
data class ChallengeResponse(val challenge: Challenge)
data class CommentsResponse(val comments: List<Comment>)
data class ConversationsResponse(val conversations: List<Conversation>)
data class MessagesListResponse(val messages: List<Message>)

data class NotificationsResponse(
    val notifications: List<AppNotification>,
    val unreadCount: Int? = null
)

data class LikeResponse(val liked: Boolean)
data class FollowResponse(val following: Boolean)

data class PresignResponse(val uploads: List<PresignUpload>)

data class PresignUpload(
    val uploadUrl: String,
    val fileUrl: String,
    val key: String
)

data class ErrorResponse(val error: ErrorDetail)
data class ErrorDetail(val message: String, val code: String? = null)

data class MessageBody(val message: String)
