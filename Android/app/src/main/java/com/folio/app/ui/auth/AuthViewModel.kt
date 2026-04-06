package com.folio.app.ui.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.folio.app.data.api.ApiService
import com.folio.app.data.models.User
import com.folio.app.util.TokenManager
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class AuthViewModel @Inject constructor(
    private val api: ApiService,
    private val tokenManager: TokenManager
) : ViewModel() {

    sealed class AuthState {
        object Loading : AuthState()
        data class Authenticated(val user: User) : AuthState()
        object Unauthenticated : AuthState()
    }

    private val _authState = MutableStateFlow<AuthState>(AuthState.Loading)
    val authState: StateFlow<AuthState> = _authState

    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading

    private val _verificationSent = MutableStateFlow(false)
    val verificationSent: StateFlow<Boolean> = _verificationSent

    private val _resetSent = MutableStateFlow(false)
    val resetSent: StateFlow<Boolean> = _resetSent

    init {
        checkAuth()
    }

    fun checkAuth() {
        viewModelScope.launch {
            val token = tokenManager.getAccessToken()
            if (token.isNullOrEmpty()) {
                _authState.value = AuthState.Unauthenticated
                return@launch
            }
            try {
                val resp = api.getMe()
                if (resp.isSuccessful && resp.body() != null) {
                    _authState.value = AuthState.Authenticated(resp.body()!!)
                } else {
                    tokenManager.clearTokens()
                    _authState.value = AuthState.Unauthenticated
                }
            } catch (e: Exception) {
                tokenManager.clearTokens()
                _authState.value = AuthState.Unauthenticated
            }
        }
    }

    fun login(email: String, password: String) {
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null
            try {
                val resp = api.login(mapOf("email" to email, "password" to password))
                if (resp.isSuccessful) {
                    val body = resp.body()
                    body?.accessToken?.let { token ->
                        tokenManager.saveTokens(token, body.refreshToken)
                        body.user?.let { _authState.value = AuthState.Authenticated(it) }
                            ?: checkAuth()
                    }
                } else {
                    _error.value = "Неверный email или пароль"
                }
            } catch (e: Exception) {
                _error.value = e.localizedMessage ?: "Ошибка сети"
            }
            _isLoading.value = false
        }
    }

    fun register(username: String, email: String, password: String) {
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null
            _verificationSent.value = false
            try {
                val resp = api.register(
                    mapOf("username" to username, "email" to email, "password" to password)
                )
                if (resp.isSuccessful) {
                    _verificationSent.value = true
                } else {
                    _error.value = "Ошибка регистрации"
                }
            } catch (e: Exception) {
                _error.value = e.localizedMessage ?: "Ошибка сети"
            }
            _isLoading.value = false
        }
    }

    fun forgotPassword(email: String) {
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null
            _resetSent.value = false
            try {
                val resp = api.forgotPassword(mapOf("email" to email))
                if (resp.isSuccessful) {
                    _resetSent.value = true
                } else {
                    _error.value = "Ошибка отправки"
                }
            } catch (e: Exception) {
                _error.value = e.localizedMessage ?: "Ошибка сети"
            }
            _isLoading.value = false
        }
    }

    fun resendVerification(email: String) {
        viewModelScope.launch {
            try {
                api.resendVerification(mapOf("email" to email))
            } catch (_: Exception) {}
        }
    }

    fun logout() {
        viewModelScope.launch {
            tokenManager.clearTokens()
            _authState.value = AuthState.Unauthenticated
        }
    }

    fun clearError() { _error.value = null }
}
