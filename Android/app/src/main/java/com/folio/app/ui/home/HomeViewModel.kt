package com.folio.app.ui.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.folio.app.data.api.ApiService
import com.folio.app.data.models.Project
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.async
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class HomeViewModel @Inject constructor(
    private val api: ApiService
) : ViewModel() {

    private val _trending = MutableStateFlow<List<Project>>(emptyList())
    val trending: StateFlow<List<Project>> = _trending

    private val _latest = MutableStateFlow<List<Project>>(emptyList())
    val latest: StateFlow<List<Project>> = _latest

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading

    val categories = listOf(
        "Графический дизайн", "UI/UX", "Иллюстрация", "3D",
        "Моушн-дизайн", "Фотография", "Веб-дизайн", "Брендинг"
    )

    fun load() {
        viewModelScope.launch {
            _isLoading.value = true
            try {
                val trendingDeferred = async {
                    api.getProjects(mapOf("sort" to "popular", "limit" to "8"))
                }
                val latestDeferred = async {
                    api.getProjects(mapOf("sort" to "latest", "limit" to "8"))
                }
                trendingDeferred.await().body()?.projects?.let { _trending.value = it }
                latestDeferred.await().body()?.projects?.let { _latest.value = it }
            } catch (_: Exception) {}
            _isLoading.value = false
        }
    }
}
