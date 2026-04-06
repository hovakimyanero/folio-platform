package com.folio.app.ui.notifications

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.navigation.NavController
import com.folio.app.data.api.ApiService
import com.folio.app.data.models.AppNotification
import com.folio.app.ui.navigation.Screen
import com.folio.app.util.formatRelativeDate
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class NotificationsViewModel @Inject constructor(
    private val api: ApiService
) : ViewModel() {

    private val _notifications = MutableStateFlow<List<AppNotification>>(emptyList())
    val notifications: StateFlow<List<AppNotification>> = _notifications

    private val _isLoading = MutableStateFlow(true)
    val isLoading: StateFlow<Boolean> = _isLoading

    init { load() }

    fun load() {
        viewModelScope.launch {
            _isLoading.value = true
            try {
                val resp = api.getNotifications()
                if (resp.isSuccessful) _notifications.value = resp.body()?.notifications ?: emptyList()
            } catch (_: Exception) {}
            _isLoading.value = false
        }
    }

    fun markRead(id: String) {
        viewModelScope.launch {
            try {
                val resp = api.markNotificationRead(id)
                if (resp.isSuccessful) {
                    _notifications.value = _notifications.value.map {
                        if (it.id == id) it.copy(read = true) else it
                    }
                }
            } catch (_: Exception) {}
        }
    }

    fun markAllRead() {
        viewModelScope.launch {
            try {
                val resp = api.markAllNotificationsRead()
                if (resp.isSuccessful) {
                    _notifications.value = _notifications.value.map { it.copy(read = true) }
                }
            } catch (_: Exception) {}
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NotificationsScreen(
    navController: NavController,
    viewModel: NotificationsViewModel = hiltViewModel()
) {
    val notifications by viewModel.notifications.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    val unreadCount = notifications.count { it.read != true }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Уведомления") },
                actions = {
                    if (unreadCount > 0) {
                        TextButton(onClick = { viewModel.markAllRead() }) {
                            Text("Прочитать все")
                        }
                    }
                }
            )
        }
    ) { padding ->
        if (isLoading) {
            Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                CircularProgressIndicator()
            }
        } else if (notifications.isEmpty()) {
            Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(Icons.Default.Notifications, null, Modifier.size(48.dp), tint = MaterialTheme.colorScheme.onSurfaceVariant)
                    Spacer(Modifier.height(8.dp))
                    Text("Нет уведомлений", color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
        } else {
            LazyColumn(
                modifier = Modifier.padding(padding),
                contentPadding = PaddingValues(vertical = 4.dp)
            ) {
                items(notifications) { notification ->
                    NotificationRow(notification = notification, onClick = {
                        if (notification.read != true) viewModel.markRead(notification.id)
                        // Navigate based on entity type
                        when (notification.entityType) {
                            "project" -> notification.entityId?.let {
                                navController.navigate(Screen.ProjectDetail.create(it))
                            }
                            "user" -> notification.actor?.username?.let {
                                navController.navigate(Screen.Profile.create(it))
                            }
                            "challenge" -> notification.entityId?.let {
                                navController.navigate(Screen.ChallengeDetail.create(it))
                            }
                        }
                    })
                }
            }
        }
    }
}

@Composable
fun NotificationRow(notification: AppNotification, onClick: () -> Unit) {
    val (icon, color) = getNotificationIcon(notification.type)
    val bg = if (notification.read != true) MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.15f)
    else MaterialTheme.colorScheme.surface

    Surface(color = bg) {
        ListItem(
            headlineContent = {
                Text(
                    buildNotificationText(notification),
                    fontWeight = if (notification.read != true) FontWeight.Medium else FontWeight.Normal,
                    maxLines = 2
                )
            },
            supportingContent = {
                notification.createdAt?.let {
                    Text(formatRelativeDate(it), style = MaterialTheme.typography.labelSmall)
                }
            },
            leadingContent = {
                Icon(icon, null, tint = color, modifier = Modifier.size(24.dp))
            },
            modifier = Modifier.fillMaxWidth().then(
                Modifier.let { mod ->
                    @Suppress("USELESS_CAST")
                    mod as Modifier
                }
            ),
            colors = ListItemDefaults.colors(containerColor = bg)
        )
    }
}

@Composable
fun getNotificationIcon(type: String?): Pair<ImageVector, androidx.compose.ui.graphics.Color> {
    return when (type) {
        "like" -> Icons.Default.Favorite to MaterialTheme.colorScheme.error
        "comment" -> Icons.Default.ChatBubble to MaterialTheme.colorScheme.primary
        "follow" -> Icons.Default.PersonAdd to MaterialTheme.colorScheme.tertiary
        "message" -> Icons.Default.Email to MaterialTheme.colorScheme.secondary
        else -> Icons.Default.Notifications to MaterialTheme.colorScheme.onSurfaceVariant
    }
}

fun buildNotificationText(notification: AppNotification): String {
    val actor = notification.actor?.displayName ?: notification.actor?.username ?: "Кто-то"
    return when (notification.type) {
        "like" -> "$actor оценил(а) ваш проект"
        "comment" -> "$actor прокомментировал(а) ваш проект"
        "follow" -> "$actor подписался(-ась) на вас"
        "message" -> "$actor отправил(а) вам сообщение"
        else -> notification.type ?: "Новое уведомление"
    }
}
