package com.folio.app.ui.profile

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.navigation.NavController
import coil.compose.AsyncImage
import com.folio.app.data.api.ApiService
import com.folio.app.data.models.User
import com.folio.app.util.TokenManager
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.toRequestBody
import javax.inject.Inject

@HiltViewModel
class SettingsViewModel @Inject constructor(
    private val api: ApiService,
    private val tokenManager: TokenManager
) : ViewModel() {

    private val _user = MutableStateFlow<User?>(null)
    val user: StateFlow<User?> = _user

    private val _isSaving = MutableStateFlow(false)
    val isSaving: StateFlow<Boolean> = _isSaving

    private val _message = MutableStateFlow<String?>(null)
    val message: StateFlow<String?> = _message

    init { loadProfile() }

    private fun loadProfile() {
        viewModelScope.launch {
            try {
                val resp = api.getMe()
                if (resp.isSuccessful) _user.value = resp.body()
            } catch (_: Exception) {}
        }
    }

    fun save(displayName: String, bio: String, website: String, location: String) {
        viewModelScope.launch {
            _isSaving.value = true
            try {
                val body = mapOf(
                    "displayName" to displayName,
                    "bio" to bio,
                    "website" to website,
                    "location" to location
                )
                val resp = api.updateProfile(body)
                if (resp.isSuccessful) {
                    _user.value = resp.body()
                    _message.value = "Профиль обновлён"
                } else {
                    _message.value = "Ошибка сохранения"
                }
            } catch (e: Exception) {
                _message.value = e.message
            }
            _isSaving.value = false
        }
    }

    fun uploadAvatar(bytes: ByteArray) {
        viewModelScope.launch {
            _isSaving.value = true
            try {
                val requestBody = bytes.toRequestBody("image/jpeg".toMediaType())
                val part = MultipartBody.Part.createFormData("avatar", "avatar.jpg", requestBody)
                val resp = api.uploadAvatar(part)
                if (resp.isSuccessful) {
                    _user.value = resp.body()
                    _message.value = "Аватар обновлён"
                }
            } catch (e: Exception) {
                _message.value = e.message
            }
            _isSaving.value = false
        }
    }

    fun logout() {
        viewModelScope.launch {
            tokenManager.clearTokens()
        }
    }

    fun clearMessage() { _message.value = null }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(
    authViewModel: com.folio.app.ui.auth.AuthViewModel,
    onLogout: () -> Unit,
    viewModel: SettingsViewModel = hiltViewModel()
) {
    val context = LocalContext.current
    val user by viewModel.user.collectAsState()
    val isSaving by viewModel.isSaving.collectAsState()
    val message by viewModel.message.collectAsState()

    var displayName by remember(user) { mutableStateOf(user?.displayName ?: "") }
    var bio by remember(user) { mutableStateOf(user?.bio ?: "") }
    var website by remember(user) { mutableStateOf(user?.website ?: "") }
    var location by remember(user) { mutableStateOf(user?.location ?: "") }

    val avatarLauncher = rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { uri: Uri? ->
        uri?.let {
            val bytes = context.contentResolver.openInputStream(it)?.readBytes()
            bytes?.let { b -> viewModel.uploadAvatar(b) }
        }
    }

    LaunchedEffect(message) {
        if (message != null) {
            kotlinx.coroutines.delay(2000)
            viewModel.clearMessage()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Настройки") }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .padding(padding)
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(16.dp)
        ) {
            // Avatar
            Box(
                modifier = Modifier.fillMaxWidth(),
                contentAlignment = Alignment.Center
            ) {
                AsyncImage(
                    model = user?.avatar,
                    contentDescription = null,
                    modifier = Modifier.size(96.dp).clip(CircleShape).clickable { avatarLauncher.launch("image/*") },
                    contentScale = ContentScale.Crop
                )
            }
            TextButton(
                onClick = { avatarLauncher.launch("image/*") },
                modifier = Modifier.align(Alignment.CenterHorizontally)
            ) { Text("Изменить аватар") }

            Spacer(Modifier.height(16.dp))

            OutlinedTextField(
                value = displayName, onValueChange = { displayName = it },
                label = { Text("Имя") }, singleLine = true, modifier = Modifier.fillMaxWidth()
            )
            Spacer(Modifier.height(12.dp))
            OutlinedTextField(
                value = bio, onValueChange = { bio = it },
                label = { Text("О себе") }, maxLines = 3, modifier = Modifier.fillMaxWidth()
            )
            Spacer(Modifier.height(12.dp))
            OutlinedTextField(
                value = website, onValueChange = { website = it },
                label = { Text("Сайт") }, singleLine = true, modifier = Modifier.fillMaxWidth()
            )
            Spacer(Modifier.height(12.dp))
            OutlinedTextField(
                value = location, onValueChange = { location = it },
                label = { Text("Местоположение") }, singleLine = true, modifier = Modifier.fillMaxWidth()
            )

            message?.let {
                Spacer(Modifier.height(8.dp))
                Text(it, color = MaterialTheme.colorScheme.primary)
            }

            Spacer(Modifier.height(24.dp))

            Button(
                onClick = { viewModel.save(displayName, bio, website, location) },
                enabled = !isSaving,
                modifier = Modifier.fillMaxWidth()
            ) {
                if (isSaving) CircularProgressIndicator(Modifier.size(20.dp), strokeWidth = 2.dp)
                else Text("Сохранить")
            }

            Spacer(Modifier.height(32.dp))

            OutlinedButton(
                onClick = { viewModel.logout(); onLogout() },
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.outlinedButtonColors(contentColor = MaterialTheme.colorScheme.error)
            ) {
                Icon(Icons.Default.ExitToApp, null, Modifier.size(18.dp))
                Spacer(Modifier.width(8.dp))
                Text("Выйти")
            }
        }
    }
}
