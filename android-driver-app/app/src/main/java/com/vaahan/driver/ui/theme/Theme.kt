package com.vaahan.driver.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable

private val LightColorScheme = lightColorScheme(
    primary = PrimaryGreen,
    secondary = PrimaryGreenDark,
    background = Background,
    surface = Surface,
    onPrimary = Surface,
    onSecondary = Surface,
    onBackground = TextPrimary,
    onSurface = TextPrimary
)

private val DarkColorScheme = darkColorScheme(
    primary = PrimaryGreen,
    secondary = PrimaryGreenDark,
    background = Background,
    surface = Surface,
    onPrimary = Surface,
    onSecondary = Surface,
    onBackground = TextPrimary,
    onSurface = TextPrimary
)

@Composable
fun DriverPortalTheme(
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colorScheme = LightColorScheme,
        typography = Typography,
        content = content
    )
}