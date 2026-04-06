package com.folio.app.ui.profile

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.Send
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
import com.folio.app.data.models.Project
import com.folio.app.data.models.User
import com.folio.app.ui.components.ProjectCard
import com.folio.app.ui.navigation.Screen
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class ProfileViewModel @Inject constructor(
    private val api: ApiService,
    savedStateHandle: SavedStateHandle
) : ViewModel() {

    private val username: String = savedStateHandle["username"] ?: ""

    private val _user = MutableStateFlow<User?>(null)
    val user: StateFlow<User?> = _user

    private val _projects = MutableStateFlow<List<Project>>(emptyList())
    val projects: StateFlow<List<Project>> = _projects

    private val _isLoading = MutableStateFlow(true)
    val isLoading: StateFlow<Boolean> = _isLoading

    init {
        if (username.isNotEmpty()) loadProfile()
    }

    fun loadProfile() {
        viewModelScope.launch {
            _isLoading.value = true
            try {
                val resp = api.getUser(username)
                if (resp.isSuccessful) {
                    _user.value = resp.body()?.user
                }
                val projResp = api.getUserProjects(username)
                if (projResp.isSuccessful) {
                    _projects.value = projResp.body()?.projects ?: emptyList()
                }
            } catch (_: Exception) {}
            _isLoading.value = false
        }
    }

    fun toggleFollow() {
        val u = _user.value ?: return
        viewModelScope.launch {
            try {
                val resp = api.toggleFollow(u.id)
                if (resp.isSuccessful) {
                    val newFollowing = u.isFollowing != true
                    val delta = if (newFollowing) 1 else -1
                    _user.value = u.copy(
                        isFollowing = newFollowing,
                        count = u.count?.let { it.copy(followers = (it.followers ?: 0) + delta) }
                    )
                }
            } catch (_: Exception) {}
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProfileScreen(
    username: String,
    navController: NavController,
    authViewModel: com.folio.app.ui.auth.AuthViewModel,
    viewModel: ProfileViewModel = hiltViewModel()
) {
    val user by viewModel.user.collectAsState()
    val projects by viewModel.projects.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(user?.displayName ?: user?.username ?: "") },
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
            user?.let { u ->
                Column(Modifier.padding(padding).fillMaxSize()) {
                    // Profile header
                    Column(
                        modifier = Modifier.fillMaxWidth().padding(16.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        AsyncImage(
                            model = u.avatar,
                            contentDescription = null,
                            modifier = Modifier.size(96.dp).clip(CircleShape),
                            contentScale = ContentScale.Crop
                        )
                        Spacer(Modifier.height(12.dp))
                        Text(u.displayName ?: u.username, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
                        if (u.bio != null) {
                            Text(u.bio, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                        Spacer(Modifier.height(12.dp))

                        // Stats
                        Row(horizontalArrangement = Arrangement.spacedBy(24.dp)) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Text("${u.count?.projects ?: 0}", fontWeight = FontWeight.Bold)
                                Text("Проектов", style = MaterialTheme.typography.labelSmall)
                            }
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Text("${u.count?.followers ?: 0}", fontWeight = FontWeight.Bold)
                                Text("Подписчиков", style = MaterialTheme.typography.labelSmall)
                            }
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Text("${u.count?.following ?: 0}", fontWeight = FontWeight.Bold)
                                Text("Подписок", style = MaterialTheme.typography.labelSmall)
                            }
                        }

                        Spacer(Modifier.height(12.dp))

                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            Button(onClick = { viewModel.toggleFollow() }) {
                                Text(if (u.isFollowing == true) "Отписаться" else "Подписаться")
                            }
                            OutlinedButton(onClick = {
                                navController.navigate(Screen.Chat.create(u.id, u.displayName ?: u.username))
                            }) {
                                Icon(Icons.AutoMirrored.Filled.Send, null, Modifier.size(18.dp))
                                Spacer(Modifier.width(4.dp))
                                Text("Написать")
                            }
                        }

                        u.website?.let { site ->
                            Spacer(Modifier.height(8.dp))
                            Text(site, color = MaterialTheme.colorScheme.primary, style = MaterialTheme.typography.bodySmall)
                        }
                        u.location?.let { loc ->
                            Text(loc, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                    }

                    Divider()

                    // Projects grid
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
