package com.folio.app.ui.components

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.folio.app.data.models.Project

@Composable
fun ProjectCard(
    project: Project,
    modifier: Modifier = Modifier,
    onClick: () -> Unit
) {
    Column(
        modifier = modifier.clickable(onClick = onClick)
    ) {
        AsyncImage(
            model = project.cover,
            contentDescription = project.title,
            contentScale = ContentScale.Crop,
            modifier = Modifier
                .fillMaxWidth()
                .aspectRatio(4f / 3f)
                .clip(RoundedCornerShape(12.dp))
        )

        Spacer(Modifier.height(8.dp))

        Text(
            project.title,
            style = MaterialTheme.typography.bodyMedium,
            maxLines = 1
        )

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Author
            project.author?.let { author ->
                Row(verticalAlignment = Alignment.CenterVertically) {
                    AsyncImage(
                        model = author.avatar,
                        contentDescription = null,
                        modifier = Modifier.size(18.dp).clip(CircleShape),
                        contentScale = ContentScale.Crop
                    )
                    Spacer(Modifier.width(4.dp))
                    Text(
                        author.displayName ?: author.username,
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        maxLines = 1
                    )
                }
            }

            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        Icons.Default.Favorite, null,
                        modifier = Modifier.size(12.dp),
                        tint = MaterialTheme.colorScheme.error
                    )
                    Spacer(Modifier.width(2.dp))
                    Text("${project.count?.likes ?: project.likeCount ?: 0}", style = MaterialTheme.typography.labelSmall)
                }
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        Icons.Default.Visibility, null,
                        modifier = Modifier.size(12.dp),
                        tint = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Spacer(Modifier.width(2.dp))
                    Text("${project.viewCount ?: 0}", style = MaterialTheme.typography.labelSmall)
                }
            }
        }
    }
}
