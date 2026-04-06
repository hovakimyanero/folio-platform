package com.folio.app.ui.project

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.navigation.NavController
import coil.compose.AsyncImage
import com.folio.app.data.api.ApiService
import com.folio.app.ui.navigation.Screen
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import javax.inject.Inject

@HiltViewModel
class UploadViewModel @Inject constructor(
    private val api: ApiService
) : ViewModel() {

    private val _isUploading = MutableStateFlow(false)
    val isUploading: StateFlow<Boolean> = _isUploading

    private val _progress = MutableStateFlow("")
    val progress: StateFlow<String> = _progress

    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error

    private val _success = MutableStateFlow(false)
    val success: StateFlow<Boolean> = _success

    private val _createdProjectId = MutableStateFlow<String?>(null)
    val createdProjectId: StateFlow<String?> = _createdProjectId

    val categories = listOf(
        "Графический дизайн", "UI/UX", "Иллюстрация", "3D",
        "Моушн-дизайн", "Фотография", "Веб-дизайн", "Брендинг"
    )

    fun upload(
        title: String,
        description: String,
        category: String,
        tags: String,
        imageData: List<ByteArray>,
        coverIndex: Int
    ) {
        viewModelScope.launch {
            _isUploading.value = true
            _error.value = null
            try {
                // 1. Presign
                val files = imageData.mapIndexed { i, _ ->
                    mapOf("filename" to "image_$i.jpg", "contentType" to "image/jpeg")
                }
                val presignResp = api.presignUrls(mapOf("files" to files))
                if (!presignResp.isSuccessful) throw Exception("Ошибка получения URL")
                val uploads = presignResp.body()!!.uploads

                // 2. Upload to S3
                val urls = mutableListOf<String>()
                uploads.forEachIndexed { i, upload ->
                    _progress.value = "Загрузка ${i + 1} из ${uploads.size}..."
                    withContext(Dispatchers.IO) {
                        val req = Request.Builder()
                            .url(upload.uploadUrl)
                            .put(imageData[i].toRequestBody("image/jpeg".toMediaType()))
                            .build()
                        OkHttpClient().newCall(req).execute().close()
                    }
                    urls.add(upload.fileUrl)
                }

                // 3. Create project
                val tagList = tags.split(",").map { it.trim() }.filter { it.isNotEmpty() }
                val createBody = mapOf<String, Any>(
                    "title" to title,
                    "description" to description,
                    "category" to category,
                    "tags" to tagList,
                    "mediaUrls" to urls,
                    "coverUrl" to urls[coverIndex.coerceIn(0, urls.lastIndex)]
                )
                val createResp = api.createProject(createBody)
                if (createResp.isSuccessful) {
                    _createdProjectId.value = createResp.body()?.id
                    _success.value = true
                } else {
                    throw Exception("Ошибка создания проекта")
                }
            } catch (e: Exception) {
                _error.value = e.message ?: "Ошибка загрузки"
            }
            _isUploading.value = false
        }
    }

    fun reset() {
        _success.value = false
        _error.value = null
        _progress.value = ""
        _createdProjectId.value = null
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun UploadScreen(
    navController: NavController,
    viewModel: UploadViewModel = hiltViewModel()
) {
    val context = LocalContext.current
    val isUploading by viewModel.isUploading.collectAsState()
    val progress by viewModel.progress.collectAsState()
    val error by viewModel.error.collectAsState()
    val success by viewModel.success.collectAsState()
    val createdId by viewModel.createdProjectId.collectAsState()

    var title by remember { mutableStateOf("") }
    var description by remember { mutableStateOf("") }
    var category by remember { mutableStateOf("") }
    var tags by remember { mutableStateOf("") }
    var imageUris by remember { mutableStateOf<List<Uri>>(emptyList()) }
    var coverIndex by remember { mutableIntStateOf(0) }
    var expanded by remember { mutableStateOf(false) }

    val launcher = rememberLauncherForActivityResult(ActivityResultContracts.GetMultipleContents()) {
        imageUris = it
    }

    Scaffold(
        topBar = { TopAppBar(title = { Text("Загрузить проект") }) }
    ) { padding ->
        if (success) {
            Column(
                modifier = Modifier.fillMaxSize().padding(padding).padding(32.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
            ) {
                Icon(Icons.Default.CheckCircle, null, Modifier.size(64.dp), tint = MaterialTheme.colorScheme.primary)
                Spacer(Modifier.height(16.dp))
                Text("Проект загружен!", style = MaterialTheme.typography.headlineSmall)
                Spacer(Modifier.height(24.dp))
                createdId?.let { id ->
                    Button(onClick = { navController.navigate(Screen.ProjectDetail.create(id)) }) {
                        Text("Посмотреть проект")
                    }
                }
                Spacer(Modifier.height(8.dp))
                OutlinedButton(onClick = {
                    viewModel.reset()
                    title = ""; description = ""; category = ""; tags = ""
                    imageUris = emptyList(); coverIndex = 0
                }) {
                    Text("Загрузить ещё")
                }
            }
        } else {
            Column(
                modifier = Modifier
                    .padding(padding)
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState())
                    .padding(16.dp)
            ) {
                // Image picker
                OutlinedButton(onClick = { launcher.launch("image/*") }, Modifier.fillMaxWidth()) {
                    Icon(Icons.Default.AddPhotoAlternate, null)
                    Spacer(Modifier.width(8.dp))
                    Text(if (imageUris.isEmpty()) "Выбрать изображения" else "${imageUris.size} выбрано")
                }

                if (imageUris.isNotEmpty()) {
                    Spacer(Modifier.height(8.dp))
                    Row(
                        modifier = Modifier.horizontalScroll(rememberScrollState()),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        imageUris.forEachIndexed { i, uri ->
                            Box {
                                AsyncImage(
                                    model = uri,
                                    contentDescription = null,
                                    modifier = Modifier
                                        .size(80.dp)
                                        .clip(RoundedCornerShape(8.dp))
                                        .clickable { coverIndex = i },
                                    contentScale = ContentScale.Crop
                                )
                                if (coverIndex == i) {
                                    Badge(modifier = Modifier.align(Alignment.TopEnd)) { Text("Обл.") }
                                }
                            }
                        }
                    }
                    Text("Нажмите для выбора обложки", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }

                Spacer(Modifier.height(16.dp))

                OutlinedTextField(
                    value = title, onValueChange = { title = it },
                    label = { Text("Название *") },
                    singleLine = true, modifier = Modifier.fillMaxWidth()
                )
                Spacer(Modifier.height(12.dp))
                OutlinedTextField(
                    value = description, onValueChange = { description = it },
                    label = { Text("Описание") },
                    maxLines = 4, modifier = Modifier.fillMaxWidth()
                )
                Spacer(Modifier.height(12.dp))

                ExposedDropdownMenuBox(expanded = expanded, onExpandedChange = { expanded = it }) {
                    OutlinedTextField(
                        value = category,
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("Категория *") },
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded) },
                        modifier = Modifier.fillMaxWidth().menuAnchor()
                    )
                    ExposedDropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) {
                        viewModel.categories.forEach { cat ->
                            DropdownMenuItem(
                                text = { Text(cat) },
                                onClick = { category = cat; expanded = false }
                            )
                        }
                    }
                }

                Spacer(Modifier.height(12.dp))
                OutlinedTextField(
                    value = tags, onValueChange = { tags = it },
                    label = { Text("Теги (через запятую)") },
                    singleLine = true, modifier = Modifier.fillMaxWidth()
                )

                error?.let {
                    Spacer(Modifier.height(8.dp))
                    Text(it, color = MaterialTheme.colorScheme.error)
                }

                Spacer(Modifier.height(24.dp))

                Button(
                    onClick = {
                        val imageBytes = imageUris.mapNotNull { uri ->
                            context.contentResolver.openInputStream(uri)?.readBytes()
                        }
                        viewModel.upload(title, description, category, tags, imageBytes, coverIndex)
                    },
                    enabled = title.isNotBlank() && imageUris.isNotEmpty() && category.isNotBlank() && !isUploading,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    if (isUploading) {
                        CircularProgressIndicator(Modifier.size(20.dp), strokeWidth = 2.dp)
                        Spacer(Modifier.width(8.dp))
                        Text(progress)
                    } else {
                        Text("Опубликовать")
                    }
                }
            }
        }
    }
}
