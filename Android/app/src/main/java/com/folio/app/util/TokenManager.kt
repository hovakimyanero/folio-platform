package com.folio.app.util

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

private val Context.dataStore by preferencesDataStore(name = "folio_tokens")

@Singleton
class TokenManager @Inject constructor(
    @ApplicationContext private val context: Context
) {
    companion object {
        private val ACCESS_TOKEN = stringPreferencesKey("access_token")
        private val REFRESH_TOKEN = stringPreferencesKey("refresh_token")
    }

    suspend fun getAccessToken(): String? {
        return context.dataStore.data.map { it[ACCESS_TOKEN] }.first()
    }

    suspend fun getRefreshToken(): String? {
        return context.dataStore.data.map { it[REFRESH_TOKEN] }.first()
    }

    suspend fun saveTokens(accessToken: String, refreshToken: String? = null) {
        context.dataStore.edit { prefs ->
            prefs[ACCESS_TOKEN] = accessToken
            refreshToken?.let { prefs[REFRESH_TOKEN] = it }
        }
    }

    suspend fun clearTokens() {
        context.dataStore.edit { prefs ->
            prefs.remove(ACCESS_TOKEN)
            prefs.remove(REFRESH_TOKEN)
        }
    }
}
