package com.folio.app.ui.theme

import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.platform.LocalContext

private val LightColorScheme = lightColorScheme(
    primary = Blue700,
    onPrimary = androidx.compose.ui.graphics.Color.White,
    primaryContainer = Blue200,
    secondary = Pink500,
    background = androidx.compose.ui.graphics.Color.White,
    surface = androidx.compose.ui.graphics.Color.White,
    surfaceVariant = Gray100,
)

private val DarkColorScheme = darkColorScheme(
    primary = Blue200,
    onPrimary = Gray900,
    primaryContainer = Blue700,
    secondary = Pink500,
    background = Gray900,
    surface = Gray900,
)

@Composable
fun FolioTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    dynamicColor: Boolean = true,
    content: @Composable () -> Unit
) {
    val colorScheme = when {
        dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
            val context = LocalContext.current
            if (darkTheme) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
        }
        darkTheme -> DarkColorScheme
        else -> LightColorScheme
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography(),
        content = content
    )
}
