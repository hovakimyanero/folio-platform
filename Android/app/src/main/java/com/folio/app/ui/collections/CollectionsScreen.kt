package com.folio.app.ui.collections

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.navigation.NavController
import coil.compose.AsyncImage
import com.folio.app.data.api.ApiService
import com.folio.app.data.models.Collection
import com.folio.app.data.models.Project
import com.folio.app.ui.components.ProjectCard
import com.folio.app.ui.navigation.Screen
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class CollectionsViewModel @Inject constructor(
    private val api: ApiService
) : ViewModel() {

    private val _collections = MutableStateFlow<List<Collection>>(emptyList())
    val collections: StateFlow<List<Collection>> = _collections

    private val _isLoading = MutableStateFlow(true)
    val isLoading: StateFlow<Boolean> = _isLoading

    init { load() }

    fun load() {
        viewModelScope.launch {
            _isLoading.value = true
            try {
                val resp = api.getCollections()
                if (resp.isSuccessful) _collections.value = resp.body()?.collections ?: emptyList()
            } catch (_: Exception) {}
            _isLoading.value = false
        }
    }

    fun create(name: String, description: String, isPrivate: Boolean) {
        viewModelScope.launch {
            try {
                val body = mapOf("name" to name, "description" to description, "isPrivate" to isPrivate.toString())
                val resp = api.createCollection(body)
                if (resp.isSuccessful) load()
            } catch (_: Exception) {}
        }
    }

    fun delete(id: String) {
        viewModelScope.launch {
            try {
                val resp = api.deleteCollection(id)
                if (resp.isSuccessful) _collections.value = _collections.value.filter { it.id != id }
            } catch (_: Exception) {}
        }
    }
}

@HiltViewModel
class CollectionDetailViewModel @Inject constructor(
    private val api: ApiService,
    savedStateHandle: SavedStateHandle
) : ViewModel() {

    private val collectionId: String = savedStateHandle["id"] ?: ""

    private val _collection = MutableStateFlow<Collection?>(null)
    val collection: StateFlow<Collection?> = _collection

    private val _projects = MutableStateFlow<List<Project>>(emptyList())
    val projects: StateFlow<List<Project>> = _projects

    private val _isLoading = MutableStateFlow(true)
    val isLoading: StateFlow<Boolean> = _isLoading

    init { load() }

    private fun load() {
        viewModelScope.launch {
            _isLoading.value = true
            try {
                val resp = api.getCollection(collectionId)
                if (resp.isSuccessful) {
                    val body = resp.body()
                    _collection.value = body?.collection
                    _projects.value = body?.collection?.items?.mapNotNull { it.project } ?: emptyList()
                }
            } catch (_: Exception) {}
            _isLoading.value = false
        }
    }

    fun removeProject(projectId: String) {
        viewModelScope.launch {
            try {
                val resp = api.removeFromCollection(collectionId, projectId)
                if (resp.isSuccessful) {
                    _projects.value = _projects.value.filter { it.id != projectId }
                }
            } catch (_: Exception) {}
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CollectionsScreen(
    navController: NavController,
    viewModel: CollectionsViewModel = hiltViewModel()
) {
    val collections by viewModel.collections.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    var showCreate by remember { mutableStateOf(false) }
    var name by remember { mutableStateOf("") }
    var desc by remember { mutableStateOf("") }
    var isPrivate by remember { mutableStateOf(false) }

    if (showCreate) {
        AlertDialog(
            onDismissRequest = { showCreate = false },
            title = { Text("Новая коллекция") },
            text = {
                Column {
                    OutlinedTextField(value = name, onValueChange = { name = it }, label = { Text("Название") }, singleLine = true)
                    Spacer(Modifier.height(8.dp))
                    OutlinedTextField(value = desc, onValueChange = { desc = it }, label = { Text("Описание") })
                    Spacer(Modifier.height(8.dp))
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Checkbox(checked = isPrivate, onCheckedChange = { isPrivate = it })
                        Text("Приватная")
                    }
                }
            },
            confirmButton = {
                TextButton(onClick = {
                    viewModel.create(name, desc, isPrivate)
                    showCreate = false; name = ""; desc = ""; isPrivate = false
                }, enabled = name.isNotBlank()) { Text("Создать") }
            },
            dismissButton = { TextButton(onClick = { showCreate = false }) { Text("Отмена") } }
        )
    }

    Scaffold(
        topBar = { TopAppBar(title = { Text("Коллекции") }) },
        floatingActionButton = {
            FloatingActionButton(onClick = { showCreate = true }) {
                Icon(Icons.Default.Add, "Создать")
            }
        }
    ) { padding ->
        if (isLoading) {
            Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                CircularProgressIndicator()
            }
        } else if (collections.isEmpty()) {
            Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                Text("Нет коллекций", color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        } else {
            LazyColumn(
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
                modifier = Modifier.padding(padding)
            ) {
                items(collections) { col ->
                    CollectionCard(collection = col, onClick = {
                        navController.navigate(Screen.CollectionDetail.create(col.id))
                    }, onDelete = { viewModel.delete(col.id) })
                }
            }
        }
    }
}

@Composable
fun CollectionCard(collection: Collection, onClick: () -> Unit, onDelete: () -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth().clickable(onClick = onClick),
        shape = RoundedCornerShape(12.dp)
    ) {
        Row(Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Text(collection.title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                collection.description?.let {
                    Text(it, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant, maxLines = 2)
                }
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("${collection.count?.items ?: 0} проектов", style = MaterialTheme.typography.labelSmall)
                    if (collection.isPrivate == true) {
                        Icon(Icons.Default.Lock, null, Modifier.size(14.dp))
                    }
                }
            }
            IconButton(onClick = onDelete) {
                Icon(Icons.Default.Delete, "Удалить", tint = MaterialTheme.colorScheme.error)
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CollectionDetailScreen(
    collectionId: String,
    navController: NavController,
    viewModel: CollectionDetailViewModel = hiltViewModel()
) {
    val collection by viewModel.collection.collectAsState()
    val projects by viewModel.projects.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(collection?.title ?: "Коллекция") },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, "Назад")
                    }
                }
            )
        }
    ) { padding ->
        if (isLoading) {
            Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                CircularProgressIndicator()
            }
        } else {
            Column(Modifier.padding(padding)) {
                collection?.description?.let { desc ->
                    Text(desc, modifier = Modifier.padding(16.dp), style = MaterialTheme.typography.bodyMedium)
                }
                if (projects.isEmpty()) {
                    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        Text("Коллекция пуста", color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                } else {
                    LazyVerticalGrid(
                        columns = GridCells.Fixed(2),
                        contentPadding = PaddingValues(16.dp),
                        horizontalArrangement = Arrangement.spacedBy(12.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        items(projects) { project ->
                            ProjectCard(project = project) {
                                navController.navigate(Screen.ProjectDetail.create(project.id))
                            }
                        }
                    }
                }
            }
        }
    }
}
