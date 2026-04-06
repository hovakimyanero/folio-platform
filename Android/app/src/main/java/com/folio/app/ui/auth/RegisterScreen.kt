package com.folio.app.ui.auth

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Email
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp

@Composable
fun RegisterScreen(viewModel: AuthViewModel, onLogin: () -> Unit) {
    val isLoading by viewModel.isLoading.collectAsState()
    val error by viewModel.error.collectAsState()
    val verificationSent by viewModel.verificationSent.collectAsState()

    var username by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var confirmPassword by remember { mutableStateOf("") }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Spacer(Modifier.height(40.dp))

        if (verificationSent) {
            Spacer(Modifier.height(40.dp))
            Icon(
                Icons.Default.Email,
                contentDescription = null,
                modifier = Modifier.size(64.dp),
                tint = MaterialTheme.colorScheme.primary
            )
            Spacer(Modifier.height(16.dp))
            Text("Проверьте почту!", style = MaterialTheme.typography.headlineSmall)
            Spacer(Modifier.height(8.dp))
            Text(
                "Мы отправили письмо для подтверждения на $email",
                textAlign = TextAlign.Center,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Spacer(Modifier.height(24.dp))
            OutlinedButton(onClick = { viewModel.resendVerification(email) }) {
                Text("Отправить повторно")
            }
            Spacer(Modifier.height(12.dp))
            Button(onClick = onLogin) { Text("Войти") }
        } else {
            Text("Регистрация", style = MaterialTheme.typography.headlineLarge)
            Spacer(Modifier.height(8.dp))
            Text(
                "Создайте аккаунт на Folio",
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Spacer(Modifier.height(32.dp))

            OutlinedTextField(
                value = username, onValueChange = { username = it },
                label = { Text("Имя пользователя") },
                singleLine = true, modifier = Modifier.fillMaxWidth()
            )
            Spacer(Modifier.height(12.dp))
            OutlinedTextField(
                value = email, onValueChange = { email = it },
                label = { Text("Email") },
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                singleLine = true, modifier = Modifier.fillMaxWidth()
            )
            Spacer(Modifier.height(12.dp))
            OutlinedTextField(
                value = password, onValueChange = { password = it },
                label = { Text("Пароль") },
                visualTransformation = PasswordVisualTransformation(),
                singleLine = true, modifier = Modifier.fillMaxWidth()
            )
            Spacer(Modifier.height(12.dp))
            OutlinedTextField(
                value = confirmPassword, onValueChange = { confirmPassword = it },
                label = { Text("Подтвердите пароль") },
                visualTransformation = PasswordVisualTransformation(),
                singleLine = true, modifier = Modifier.fillMaxWidth()
            )

            if (password.isNotEmpty() && confirmPassword.isNotEmpty() && password != confirmPassword) {
                Spacer(Modifier.height(4.dp))
                Text("Пароли не совпадают", color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall)
            }

            error?.let {
                Spacer(Modifier.height(8.dp))
                Text(it, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall)
            }

            Spacer(Modifier.height(24.dp))
            Button(
                onClick = { viewModel.register(username, email, password) },
                enabled = username.isNotBlank() && email.isNotBlank() && password.isNotBlank() && password == confirmPassword && !isLoading,
                modifier = Modifier.fillMaxWidth()
            ) {
                if (isLoading) CircularProgressIndicator(modifier = Modifier.size(20.dp), strokeWidth = 2.dp)
                else Text("Зарегистрироваться")
            }

            Row(verticalAlignment = Alignment.CenterVertically) {
                Text("Уже есть аккаунт?", color = MaterialTheme.colorScheme.onSurfaceVariant)
                TextButton(onClick = onLogin) { Text("Войти") }
            }
        }
    }
}
