package com.folio.app.ui.challenges

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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.navigation.NavController
import coil.compose.AsyncImage
import com.folio.app.data.api.ApiService
import com.folio.app.data.models.Challenge
import com.folio.app.data.models.Project
import com.folio.app.ui.components.ProjectCard
import com.folio.app.ui.navigation.Screen
import com.folio.app.util.formatDate
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class ChallengesViewModel @Inject constructor(
    private val api: ApiService
) : ViewModel() {

    private val _challenges = MutableStateFlow<List<Challenge>>(emptyList())
    val challenges: StateFlow<List<Challenge>> = _challenges

    private val _isLoading = MutableStateFlow(true)
    val isLoading: StateFlow<Boolean> = _isLoading

    init { load() }

    private fun load() {
        viewModelScope.launch {
            _isLoading.value = true
            try {
                val resp = api.getChallenges()
                if (resp.isSuccessful) _challenges.value = resp.body()?.challenges ?: emptyList()
            } catch (_: Exception) {}
            _isLoading.value = false
        }
    }
}

@HiltViewModel
class ChallengeDetailViewModel @Inject constructor(
    private val api: ApiService,
    savedStateHandle: SavedStateHandle
) : ViewModel() {

    private val challengeId: String = savedStateHandle["id"] ?: ""

    private val _challenge = MutableStateFlow<Challenge?>(null)
    val challenge: StateFlow<Challenge?> = _challenge

    private val _entries = MutableStateFlow<List<Project>>(emptyList())
    val entries: StateFlow<List<Project>> = _entries

    private val _isLoading = MutableStateFlow(true)
    val isLoading: StateFlow<Boolean> = _isLoading

    init { load() }

    private fun load() {
        viewModelScope.launch {
            _isLoading.value = true
            try {
                val resp = api.getChallenge(challengeId)
                if (resp.isSuccessful) {
                    val c = resp.body()?.challenge
                    _challenge.value = c
                    _entries.value = c?.entries?.mapNotNull { it.project } ?: emptyList()
                }
            } catch (_: Exception) {}
            _isLoading.value = false
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ChallengesScreen(
    navController: NavController,
    viewModel: ChallengesViewModel = hiltViewModel()
) {
    val challenges by viewModel.challenges.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()

    Scaffold(
        topBar = { TopAppBar(title = { Text("Челленджи") }) }
    ) { padding ->
        if (isLoading) {
            Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                CircularProgressIndicator()
            }
        } else if (challenges.isEmpty()) {
            Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                Text("Нет активных челленджей", color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        } else {
            LazyColumn(
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
                modifier = Modifier.padding(padding)
            ) {
                items(challenges) { challenge ->
                    ChallengeCard(challenge) {
                        navController.navigate(Screen.ChallengeDetail.create(challenge.id))
                    }
                }
            }
        }
    }
}

@Composable
fun ChallengeCard(challenge: Challenge, onClick: () -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth().clickable(onClick = onClick),
        shape = RoundedCornerShape(12.dp)
    ) {
        Column(Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(challenge.title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, modifier = Modifier.weight(1f))
                if (challenge.isActive == true) {
                    Badge { Text("Активный") }
                }
            }
            challenge.description?.let {
                Spacer(Modifier.height(4.dp))
                Text(it, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant, maxLines = 2)
            }
            Spacer(Modifier.height(8.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                challenge.deadline?.let {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.CalendarMonth, null, Modifier.size(14.dp))
                        Spacer(Modifier.width(4.dp))
                        Text("до ${formatDate(it)}", style = MaterialTheme.typography.labelSmall)
                    }
                }
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.Group, null, Modifier.size(14.dp))
                    Spacer(Modifier.width(4.dp))
                    Text("${challenge.count?.entries ?: 0} работ", style = MaterialTheme.typography.labelSmall)
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ChallengeDetailScreen(
    challengeId: String,
    navController: NavController,
    viewModel: ChallengeDetailViewModel = hiltViewModel()
) {
    val challenge by viewModel.challenge.collectAsState()
    val entries by viewModel.entries.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(challenge?.title ?: "Челлендж") },
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
                challenge?.let { c ->
                    Column(Modifier.padding(16.dp)) {
                        c.description?.let {
                            Text(it, style = MaterialTheme.typography.bodyMedium)
                            Spacer(Modifier.height(8.dp))
                        }
                        Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                            c.deadline?.let {
                                Text("Дедлайн: ${formatDate(it)}", style = MaterialTheme.typography.labelMedium)
                            }
                            if (c.isActive == true) Badge { Text("Активный") }
                        }
                    }
                    Divider()
                }

                if (entries.isEmpty()) {
                    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        Text("Пока нет работ", color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                } else {
                    LazyVerticalGrid(
                        columns = GridCells.Fixed(2),
                        contentPadding = PaddingValues(16.dp),
                        horizontalArrangement = Arrangement.spacedBy(12.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        items(entries) { project ->
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
