package com.folio.app.ui.search

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.navigation.NavController
import com.folio.app.data.api.ApiService
import com.folio.app.data.models.Project
import com.folio.app.ui.components.ProjectCard
import com.folio.app.ui.navigation.Screen
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class SearchViewModel @Inject constructor(
    private val api: ApiService
) : ViewModel() {

    private val _results = MutableStateFlow<List<Project>>(emptyList())
    val results: StateFlow<List<Project>> = _results

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading

    private var searchJob: Job? = null

    fun search(query: String) {
        searchJob?.cancel()
        if (query.isBlank()) {
            _results.value = emptyList()
            return
        }
        searchJob = viewModelScope.launch {
            delay(400)
            _isLoading.value = true
            try {
                val resp = api.getProjects(mapOf("search" to query, "limit" to "30"))
                if (resp.isSuccessful) {
                    _results.value = resp.body()?.projects ?: emptyList()
                }
            } catch (_: Exception) {}
            _isLoading.value = false
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SearchScreen(
    navController: NavController,
    viewModel: SearchViewModel = hiltViewModel()
) {
    val results by viewModel.results.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    var query by remember { mutableStateOf("") }

    Scaffold(
        topBar = { TopAppBar(title = { Text("Поиск") }) }
    ) { padding ->
        Column(Modifier.padding(padding).fillMaxSize()) {
            OutlinedTextField(
                value = query,
                onValueChange = { query = it; viewModel.search(it) },
                placeholder = { Text("Поиск проектов...") },
                leadingIcon = { Icon(Icons.Default.Search, null) },
                singleLine = true,
                modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp)
            )

            if (isLoading) {
                Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator()
                }
            } else if (results.isEmpty() && query.isNotBlank()) {
                Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text("Ничего не найдено", color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            } else {
                LazyVerticalGrid(
                    columns = GridCells.Fixed(2),
                    contentPadding = PaddingValues(16.dp),
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(results) { project ->
                        ProjectCard(project = project) {
                            navController.navigate(Screen.ProjectDetail.create(project.id))
                        }
                    }
                }
            }
        }
    }
}
