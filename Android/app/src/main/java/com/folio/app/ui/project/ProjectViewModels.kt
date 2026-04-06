package com.folio.app.ui.project

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.folio.app.data.api.ApiService
import com.folio.app.data.models.Comment
import com.folio.app.data.models.Project
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class ProjectsViewModel @Inject constructor(
    private val api: ApiService
) : ViewModel() {

    private val _projects = MutableStateFlow<List<Project>>(emptyList())
    val projects: StateFlow<List<Project>> = _projects

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading

    private var currentPage = 1
    private var totalPages = 1
    var sort = "latest"

    fun load(page: Int = 1, category: String? = null) {
        viewModelScope.launch {
            _isLoading.value = true
            try {
                val params = mutableMapOf(
                    "page" to page.toString(),
                    "limit" to "12",
                    "sort" to sort
                )
                category?.let { params["category"] = it }
                val resp = api.getProjects(params)
                if (resp.isSuccessful) {
                    val body = resp.body()!!
                    _projects.value = if (page == 1) body.projects
                    else _projects.value + body.projects
                    currentPage = body.pagination?.page ?: page
                    totalPages = body.pagination?.pages ?: 1
                }
            } catch (_: Exception) {}
            _isLoading.value = false
        }
    }

    fun loadMore(category: String? = null) {
        if (currentPage < totalPages && !_isLoading.value) load(currentPage + 1, category)
    }

    fun refresh(category: String? = null) {
        currentPage = 1
        load(category = category)
    }
}

@HiltViewModel
class ProjectDetailViewModel @Inject constructor(
    private val api: ApiService
) : ViewModel() {

    private val _project = MutableStateFlow<Project?>(null)
    val project: StateFlow<Project?> = _project

    private val _comments = MutableStateFlow<List<Comment>>(emptyList())
    val comments: StateFlow<List<Comment>> = _comments

    private val _isLiked = MutableStateFlow(false)
    val isLiked: StateFlow<Boolean> = _isLiked

    private val _likesCount = MutableStateFlow(0)
    val likesCount: StateFlow<Int> = _likesCount

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading

    fun load(id: String) {
        viewModelScope.launch {
            _isLoading.value = true
            try {
                val resp = api.getProject(id)
                if (resp.isSuccessful) {
                    val p = resp.body()!!.project
                    _project.value = p
                    _isLiked.value = p.isLiked ?: false
                    _likesCount.value = p.count?.likes ?: p.likeCount ?: 0
                }
                val commentsResp = api.getComments(id)
                if (commentsResp.isSuccessful) {
                    _comments.value = commentsResp.body()?.comments ?: emptyList()
                }
            } catch (_: Exception) {}
            _isLoading.value = false
        }
    }

    fun toggleLike(projectId: String) {
        viewModelScope.launch {
            try {
                val resp = if (_isLiked.value) api.unlikeProject(projectId) else api.likeProject(projectId)
                if (resp.isSuccessful) {
                    val liked = resp.body()?.liked ?: !_isLiked.value
                    _isLiked.value = liked
                    _likesCount.value += if (liked) 1 else -1
                }
            } catch (_: Exception) {}
        }
    }

    fun addComment(projectId: String, text: String) {
        viewModelScope.launch {
            try {
                val resp = api.createComment(mapOf("content" to text, "projectId" to projectId))
                if (resp.isSuccessful) {
                    resp.body()?.let { _comments.value = listOf(it) + _comments.value }
                }
            } catch (_: Exception) {}
        }
    }

    fun deleteComment(id: String) {
        viewModelScope.launch {
            try {
                api.deleteComment(id)
                _comments.value = _comments.value.filter { it.id != id }
            } catch (_: Exception) {}
        }
    }
}
