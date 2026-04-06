package com.folio.app.ui.home

import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavController
import com.folio.app.ui.components.ProjectCard
import com.folio.app.ui.navigation.Screen

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(
    navController: NavController,
    viewModel: HomeViewModel = hiltViewModel()
) {
    val trending by viewModel.trending.collectAsState()
    val latest by viewModel.latest.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()

    LaunchedEffect(Unit) {
        if (trending.isEmpty()) viewModel.load()
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Folio") },
                actions = {
                    IconButton(onClick = { navController.navigate(Screen.Search.route) }) {
                        Icon(Icons.Default.Search, "Поиск")
                    }
                }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .padding(padding)
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
        ) {
            if (isLoading && trending.isEmpty()) {
                Box(Modifier.fillMaxWidth().height(200.dp), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator()
                }
            }

            // Categories
            Text("Категории", style = MaterialTheme.typography.titleMedium, modifier = Modifier.padding(16.dp, 8.dp))
            Row(
                modifier = Modifier.horizontalScroll(rememberScrollState()).padding(horizontal = 16.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                viewModel.categories.forEach { cat ->
                    AssistChip(
                        onClick = { navController.navigate("projects?category=$cat") },
                        label = { Text(cat) }
                    )
                }
            }

            Spacer(Modifier.height(16.dp))

            // Trending
            Row(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("Популярное", style = MaterialTheme.typography.titleMedium)
                TextButton(onClick = { navController.navigate(Screen.Projects.route) }) {
                    Text("Все")
                }
            }

            Row(
                modifier = Modifier.horizontalScroll(rememberScrollState()).padding(horizontal = 16.dp),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                trending.forEach { project ->
                    ProjectCard(
                        project = project,
                        modifier = Modifier.width(260.dp),
                        onClick = { navController.navigate(Screen.ProjectDetail.create(project.id)) }
                    )
                }
            }

            Spacer(Modifier.height(24.dp))

            // Latest
            Row(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("Новое", style = MaterialTheme.typography.titleMedium)
                TextButton(onClick = { navController.navigate(Screen.Projects.route) }) {
                    Text("Все")
                }
            }

            Column(modifier = Modifier.padding(horizontal = 16.dp)) {
                latest.chunked(2).forEach { row ->
                    Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        row.forEach { project ->
                            ProjectCard(
                                project = project,
                                modifier = Modifier.weight(1f),
                                onClick = { navController.navigate(Screen.ProjectDetail.create(project.id)) }
                            )
                        }
                        if (row.size == 1) Spacer(Modifier.weight(1f))
                    }
                    Spacer(Modifier.height(12.dp))
                }
            }

            Spacer(Modifier.height(24.dp))
        }
    }
}
