package com.folio.app.data.api

import com.folio.app.data.models.*
import okhttp3.MultipartBody
import okhttp3.RequestBody
import retrofit2.Response
import retrofit2.http.*

interface ApiService {

    // Auth
    @POST("auth/register")
    suspend fun register(@Body body: Map<String, String>): Response<AuthResponse>

    @POST("auth/login")
    suspend fun login(@Body body: Map<String, String>): Response<AuthResponse>

    @GET("auth/me")
    suspend fun getMe(): Response<User>

    @POST("auth/refresh")
    suspend fun refreshToken(@Body body: Map<String, String>): Response<AuthResponse>

    @POST("auth/forgot-password")
    suspend fun forgotPassword(@Body body: Map<String, String>): Response<MessageBody>

    @POST("auth/resend-verification")
    suspend fun resendVerification(@Body body: Map<String, String>): Response<MessageBody>

    // Projects
    @GET("projects")
    suspend fun getProjects(
        @QueryMap params: Map<String, String>
    ): Response<ProjectsResponse>

    @GET("projects/{id}")
    suspend fun getProject(@Path("id") id: String): Response<SingleProjectResponse>

    @POST("projects/presign")
    suspend fun presignUrls(@Body body: Map<String, Any>): Response<PresignResponse>

    @POST("projects/create")
    suspend fun createProject(@Body body: Map<String, Any>): Response<Project>

    @POST("projects/{id}/like")
    suspend fun likeProject(@Path("id") id: String): Response<LikeResponse>

    @DELETE("projects/{id}/like")
    suspend fun unlikeProject(@Path("id") id: String): Response<LikeResponse>

    // Users
    @GET("users/{username}")
    suspend fun getUser(@Path("username") username: String): Response<UserResponse>

    @GET("users/{username}/projects")
    suspend fun getUserProjects(@Path("username") username: String): Response<ProjectsResponse>

    @POST("users/{id}/follow")
    suspend fun toggleFollow(@Path("id") id: String): Response<FollowResponse>

    @PATCH("users/me")
    suspend fun updateProfile(@Body body: Map<String, String>): Response<User>

    @Multipart
    @PATCH("users/me")
    suspend fun uploadAvatar(@Part avatar: MultipartBody.Part): Response<User>

    // Comments
    @GET("comments/projects/{projectId}/comments")
    suspend fun getComments(@Path("projectId") projectId: String): Response<CommentsResponse>

    @POST("comments")
    suspend fun createComment(@Body body: Map<String, String>): Response<Comment>

    @DELETE("comments/{id}")
    suspend fun deleteComment(@Path("id") id: String): Response<Unit>

    // Collections
    @GET("collections")
    suspend fun getCollections(): Response<CollectionsResponse>

    @GET("collections/my")
    suspend fun getMyCollections(): Response<CollectionsResponse>

    @GET("collections/{id}")
    suspend fun getCollection(@Path("id") id: String): Response<CollectionResponse>

    @POST("collections")
    suspend fun createCollection(@Body body: Map<String, String>): Response<Collection>

    @DELETE("collections/{id}")
    suspend fun deleteCollection(@Path("id") id: String): Response<Unit>

    @POST("collections/{id}/projects")
    suspend fun addToCollection(
        @Path("id") collectionId: String,
        @Body body: Map<String, String>
    ): Response<Unit>

    @DELETE("collections/{collectionId}/projects/{projectId}")
    suspend fun removeFromCollection(
        @Path("collectionId") collectionId: String,
        @Path("projectId") projectId: String
    ): Response<Unit>

    // Challenges
    @GET("challenges")
    suspend fun getChallenges(): Response<ChallengesResponse>

    @GET("challenges/{id}")
    suspend fun getChallenge(@Path("id") id: String): Response<ChallengeResponse>

    // Messages
    @GET("messages")
    suspend fun getConversations(): Response<ConversationsResponse>

    @GET("messages/{partnerId}")
    suspend fun getMessages(@Path("partnerId") partnerId: String): Response<MessagesListResponse>

    @POST("messages")
    suspend fun sendMessage(@Body body: Map<String, String>): Response<Message>

    // Notifications
    @GET("notifications")
    suspend fun getNotifications(): Response<NotificationsResponse>

    @PATCH("notifications/{id}/read")
    suspend fun markNotificationRead(@Path("id") id: String): Response<AppNotification>

    @PATCH("notifications/read-all")
    suspend fun markAllNotificationsRead(): Response<Unit>
}
