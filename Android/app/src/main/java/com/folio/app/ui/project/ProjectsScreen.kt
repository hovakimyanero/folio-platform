package com.folio.app.ui.project

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
import androidx.navigation.NavController
import com.folio.app.ui.components.ProjectCard
import com.folio.app.ui.navigation.Screen

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProjectsScreen(
    navController: NavController,
    viewModel: ProjectsViewModel = hiltViewModel()
) {
    val projects by viewModel.projects.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    var selectedSort by remember { mutableStateOf(0) }

    LaunchedEffect(Unit) {
        if (projects.isEmpty()) viewModel.load()
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Проекты") },
                actions = {
                    IconButton(onClick = { navController.navigate(Screen.Search.route) }) {
                        Icon(Icons.Default.Search, "Поиск")
                    }
                }
            )
        }
    ) { padding ->
        Column(modifier = Modifier.padding(padding)) {
            TabRow(selectedTabIndex = selectedSort) {
                Tab(selected = selectedSort == 0, onClick = {
                    selectedSort = 0
                    viewModel.sort = "latest"
                    viewModel.refresh()
                }) { Text("Новые", Modifier.padding(12.dp)) }
                Tab(selected = selectedSort == 1, onClick = {
                    selectedSort = 1
                    viewModel.sort = "popular"
                    viewModel.refresh()
                }) { Text("Популярные", Modifier.padding(12.dp)) }
            }

            if (isLoading && projects.isEmpty()) {
                Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator()
                }
            } else {
                LazyVerticalGrid(
                    columns = GridCells.Fixed(2),
                    contentPadding = PaddingValues(16.dp),
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    items(projects) { project ->
                        ProjectCard(
                            project = project,
                            onClick = { navController.navigate(Screen.ProjectDetail.create(project.id)) }
                        )
                    }

                    // Load more trigger
                    item {
                        LaunchedEffect(Unit) { viewModel.loadMore() }
                    }
                }
            }
        }
    }
}
