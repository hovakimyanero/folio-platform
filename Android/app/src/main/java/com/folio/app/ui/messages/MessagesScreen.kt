package com.folio.app.ui.messages

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
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
import com.folio.app.data.models.Conversation
import com.folio.app.data.models.Message
import com.folio.app.ui.navigation.Screen
import com.folio.app.util.formatRelativeDate
import com.folio.app.util.formatTime
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class ConversationsViewModel @Inject constructor(
    private val api: ApiService
) : ViewModel() {

    private val _conversations = MutableStateFlow<List<Conversation>>(emptyList())
    val conversations: StateFlow<List<Conversation>> = _conversations

    private val _isLoading = MutableStateFlow(true)
    val isLoading: StateFlow<Boolean> = _isLoading

    init { load() }

    fun load() {
        viewModelScope.launch {
            _isLoading.value = true
            try {
                val resp = api.getConversations()
                if (resp.isSuccessful) _conversations.value = resp.body()?.conversations ?: emptyList()
            } catch (_: Exception) {}
            _isLoading.value = false
        }
    }
}

@HiltViewModel
class ChatViewModel @Inject constructor(
    private val api: ApiService,
    savedStateHandle: SavedStateHandle
) : ViewModel() {

    private val recipientId: String = savedStateHandle["userId"] ?: ""

    private val _messages = MutableStateFlow<List<Message>>(emptyList())
    val messages: StateFlow<List<Message>> = _messages

    private val _isLoading = MutableStateFlow(true)
    val isLoading: StateFlow<Boolean> = _isLoading

    private val _partnerName = MutableStateFlow("")
    val partnerName: StateFlow<String> = _partnerName

    init { load() }

    private fun load() {
        viewModelScope.launch {
            _isLoading.value = true
            try {
                val resp = api.getMessages(recipientId)
                if (resp.isSuccessful) {
                    _messages.value = resp.body()?.messages ?: emptyList()
                }
            } catch (_: Exception) {}
            _isLoading.value = false
        }
    }

    fun send(content: String) {
        if (content.isBlank()) return
        viewModelScope.launch {
            try {
                val resp = api.sendMessage(mapOf("recipientId" to recipientId, "content" to content))
                if (resp.isSuccessful) {
                    resp.body()?.let { msg ->
                        _messages.value = _messages.value + msg
                    }
                }
            } catch (_: Exception) {}
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ConversationsScreen(
    navController: NavController,
    viewModel: ConversationsViewModel = hiltViewModel()
) {
    val conversations by viewModel.conversations.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()

    Scaffold(
        topBar = { TopAppBar(title = { Text("Сообщения") }) }
    ) { padding ->
        if (isLoading) {
            Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                CircularProgressIndicator()
            }
        } else if (conversations.isEmpty()) {
            Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                Text("Нет сообщений", color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        } else {
            LazyColumn(
                modifier = Modifier.padding(padding),
                contentPadding = PaddingValues(vertical = 8.dp)
            ) {
                items(conversations) { conv ->
                    ConversationRow(conv) {
                        navController.navigate(Screen.Chat.create(conv.partner?.id ?: "", conv.partner?.displayName ?: conv.partner?.username ?: ""))
                    }
                }
            }
        }
    }
}

@Composable
fun ConversationRow(conversation: Conversation, onClick: () -> Unit) {
    val partner = conversation.partner
    ListItem(
        headlineContent = {
            Text(partner?.displayName ?: partner?.username ?: "", fontWeight = FontWeight.Medium)
        },
        supportingContent = {
            Text(
                conversation.lastMessage?.text ?: "",
                maxLines = 1, style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        },
        leadingContent = {
            AsyncImage(
                model = partner?.avatar,
                contentDescription = null,
                modifier = Modifier.size(48.dp).clip(CircleShape),
                contentScale = ContentScale.Crop
            )
        },
        trailingContent = {
            Column(horizontalAlignment = Alignment.End) {
                conversation.lastMessage?.createdAt?.let {
                    Text(formatRelativeDate(it), style = MaterialTheme.typography.labelSmall)
                }
                if ((conversation.unread ?: 0) > 0) {
                    Badge { Text("${conversation.unread}") }
                }
            }
        },
        modifier = Modifier.clickable(onClick = onClick)
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ChatScreen(
    recipientId: String,
    recipientName: String,
    navController: NavController,
    viewModel: ChatViewModel = hiltViewModel()
) {
    val messages by viewModel.messages.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    var input by remember { mutableStateOf("") }
    val listState = rememberLazyListState()

    LaunchedEffect(messages.size) {
        if (messages.isNotEmpty()) listState.animateScrollToItem(messages.lastIndex)
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Чат") },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, "Назад")
                    }
                }
            )
        },
        bottomBar = {
            Row(
                modifier = Modifier.fillMaxWidth().padding(8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                OutlinedTextField(
                    value = input, onValueChange = { input = it },
                    placeholder = { Text("Сообщение...") },
                    modifier = Modifier.weight(1f),
                    singleLine = true,
                    shape = RoundedCornerShape(24.dp)
                )
                Spacer(Modifier.width(8.dp))
                IconButton(
                    onClick = { viewModel.send(input); input = "" },
                    enabled = input.isNotBlank()
                ) {
                    Icon(Icons.AutoMirrored.Filled.Send, "Отправить", tint = MaterialTheme.colorScheme.primary)
                }
            }
        }
    ) { padding ->
        if (isLoading) {
            Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                CircularProgressIndicator()
            }
        } else {
            LazyColumn(
                state = listState,
                modifier = Modifier.padding(padding).fillMaxSize(),
                contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp),
                verticalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                items(messages) { msg ->
                    MessageBubble(message = msg)
                }
            }
        }
    }
}

@Composable
fun MessageBubble(message: Message) {
    val isMine = message.senderId != null
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = if (isMine) Arrangement.End else Arrangement.Start
    ) {
        Surface(
            shape = RoundedCornerShape(16.dp),
            color = if (isMine) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.surfaceVariant,
            modifier = Modifier.widthIn(max = 280.dp)
        ) {
            Column(Modifier.padding(12.dp)) {
                Text(
                    message.text,
                    color = if (isMine) MaterialTheme.colorScheme.onPrimary else MaterialTheme.colorScheme.onSurfaceVariant
                )
                message.createdAt?.let {
                    Text(
                        formatTime(it),
                        style = MaterialTheme.typography.labelSmall,
                        color = if (isMine) MaterialTheme.colorScheme.onPrimary.copy(alpha = 0.7f)
                        else MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f)
                    )
                }
            }
        }
    }
}
