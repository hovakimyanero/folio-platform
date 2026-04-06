package com.folio.app.ui.auth

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Email
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp

@Composable
fun ForgotPasswordScreen(viewModel: AuthViewModel, onBack: () -> Unit) {
    val isLoading by viewModel.isLoading.collectAsState()
    val error by viewModel.error.collectAsState()
    val resetSent by viewModel.resetSent.collectAsState()
    var email by remember { mutableStateOf("") }

    Column(
        modifier = Modifier.fillMaxSize().padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Spacer(Modifier.height(60.dp))

        if (resetSent) {
            Icon(Icons.Default.Email, null, Modifier.size(64.dp), tint = MaterialTheme.colorScheme.primary)
            Spacer(Modifier.height(16.dp))
            Text("Письмо отправлено!", style = MaterialTheme.typography.headlineSmall)
            Spacer(Modifier.height(8.dp))
            Text("Проверьте почту для инструкций", textAlign = TextAlign.Center, color = MaterialTheme.colorScheme.onSurfaceVariant)
            Spacer(Modifier.height(24.dp))
            Button(onClick = onBack) { Text("Вернуться ко входу") }
        } else {
            Text("Восстановление пароля", style = MaterialTheme.typography.headlineSmall)
            Spacer(Modifier.height(24.dp))
            OutlinedTextField(
                value = email, onValueChange = { email = it },
                label = { Text("Email") },
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                singleLine = true, modifier = Modifier.fillMaxWidth()
            )
            error?.let {
                Spacer(Modifier.height(8.dp))
                Text(it, color = MaterialTheme.colorScheme.error)
            }
            Spacer(Modifier.height(24.dp))
            Button(
                onClick = { viewModel.forgotPassword(email) },
                enabled = email.isNotBlank() && !isLoading,
                modifier = Modifier.fillMaxWidth()
            ) {
                if (isLoading) CircularProgressIndicator(Modifier.size(20.dp), strokeWidth = 2.dp)
                else Text("Отправить")
            }
            TextButton(onClick = onBack) { Text("Вернуться ко входу") }
        }
    }
}
