package com.folio.app.ui.project

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavController
import coil.compose.AsyncImage
import com.folio.app.ui.navigation.Screen
import com.folio.app.util.formatRelativeDate

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProjectDetailScreen(
    projectId: String,
    navController: NavController,
    viewModel: ProjectDetailViewModel = hiltViewModel()
) {
    val project by viewModel.project.collectAsState()
    val comments by viewModel.comments.collectAsState()
    val isLiked by viewModel.isLiked.collectAsState()
    val likesCount by viewModel.likesCount.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    var commentText by remember { mutableStateOf("") }

    LaunchedEffect(projectId) { viewModel.load(projectId) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(project?.title ?: "") },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.Default.ArrowBack, "Назад")
                    }
                }
            )
        }
    ) { padding ->
        if (isLoading && project == null) {
            Box(Modifier.fillMaxSize().padding(padding), Alignment.Center) {
                CircularProgressIndicator()
            }
        } else project?.let { proj ->
            Column(
                modifier = Modifier
                    .padding(padding)
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState())
            ) {
                // Cover
                AsyncImage(
                    model = proj.cover,
                    contentDescription = proj.title,
                    contentScale = ContentScale.FillWidth,
                    modifier = Modifier.fillMaxWidth()
                )

                Column(modifier = Modifier.padding(16.dp)) {
                    // Title + Like
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(proj.title, style = MaterialTheme.typography.headlineSmall, modifier = Modifier.weight(1f))
                        IconButton(onClick = { viewModel.toggleLike(projectId) }) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(
                                    if (isLiked) Icons.Default.Favorite else Icons.Default.FavoriteBorder,
                                    null,
                                    tint = if (isLiked) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.onSurfaceVariant
                                )
                                Spacer(Modifier.width(4.dp))
                                Text("$likesCount", style = MaterialTheme.typography.bodySmall)
                            }
                        }
                    }

                    // Author
                    proj.author?.let { author ->
                        Spacer(Modifier.height(12.dp))
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.padding(vertical = 4.dp)
                        ) {
                            AsyncImage(
                                model = author.avatar,
                                contentDescription = null,
                                modifier = Modifier.size(36.dp).clip(CircleShape),
                                contentScale = ContentScale.Crop
                            )
                            Spacer(Modifier.width(10.dp))
                            Column {
                                Text(author.displayName ?: author.username, style = MaterialTheme.typography.bodyMedium)
                                Text("@${author.username}", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                        }
                    }

                    // Description
                    proj.description?.takeIf { it.isNotBlank() }?.let {
                        Spacer(Modifier.height(12.dp))
                        Text(it, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }

                    // Category + Tags
                    Spacer(Modifier.height(12.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        proj.category?.let {
                            AssistChip(onClick = {}, label = { Text(it.name) })
                        }
                        proj.tags?.forEach { tag ->
                            Text("#$tag", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                    }

                    // Stats
                    Spacer(Modifier.height(8.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Visibility, null, Modifier.size(16.dp))
                            Spacer(Modifier.width(4.dp))
                            Text("${proj.viewCount ?: 0}", style = MaterialTheme.typography.labelSmall)
                        }
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Favorite, null, Modifier.size(16.dp))
                            Spacer(Modifier.width(4.dp))
                            Text("$likesCount", style = MaterialTheme.typography.labelSmall)
                        }
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.ChatBubble, null, Modifier.size(16.dp))
                            Spacer(Modifier.width(4.dp))
                            Text("${comments.size}", style = MaterialTheme.typography.labelSmall)
                        }
                    }

                    // Media gallery
                    val mediaUrls = (proj.media ?: emptyList()).filter { it.url != proj.cover }
                    if (mediaUrls.isNotEmpty()) {
                        Spacer(Modifier.height(16.dp))
                        mediaUrls.forEach { media ->
                            AsyncImage(
                                model = media.url,
                                contentDescription = null,
                                contentScale = ContentScale.FillWidth,
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(8.dp))
                            )
                            Spacer(Modifier.height(12.dp))
                        }
                    }

                    // Comments
                    HorizontalDivider(modifier = Modifier.padding(vertical = 16.dp))
                    Text("Комментарии (${comments.size})", style = MaterialTheme.typography.titleSmall)
                    Spacer(Modifier.height(8.dp))

                    Row(verticalAlignment = Alignment.CenterVertically) {
                        OutlinedTextField(
                            value = commentText,
                            onValueChange = { commentText = it },
                            placeholder = { Text("Написать комментарий...") },
                            modifier = Modifier.weight(1f),
                            singleLine = true
                        )
                        Spacer(Modifier.width(8.dp))
                        IconButton(
                            onClick = {
                                viewModel.addComment(projectId, commentText)
                                commentText = ""
                            },
                            enabled = commentText.isNotBlank()
                        ) {
                            Icon(Icons.Default.Send, "Отправить")
                        }
                    }

                    Spacer(Modifier.height(12.dp))
                    comments.forEach { comment ->
                        Row(modifier = Modifier.padding(vertical = 6.dp)) {
                            AsyncImage(
                                model = comment.user?.avatar,
                                contentDescription = null,
                                modifier = Modifier.size(32.dp).clip(CircleShape),
                                contentScale = ContentScale.Crop
                            )
                            Spacer(Modifier.width(10.dp))
                            Column(modifier = Modifier.weight(1f)) {
                                Row {
                                    Text(
                                        comment.user?.displayName ?: comment.user?.username ?: "",
                                        style = MaterialTheme.typography.labelMedium
                                    )
                                    Spacer(Modifier.weight(1f))
                                    Text(
                                        formatRelativeDate(comment.createdAt),
                                        style = MaterialTheme.typography.labelSmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                                Text(comment.content, style = MaterialTheme.typography.bodySmall)
                            }
                        }
                    }
                }
            }
        }
    }
}
