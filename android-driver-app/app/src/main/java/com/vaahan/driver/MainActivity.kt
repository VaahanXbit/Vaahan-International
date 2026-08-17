package com.vaahan.driver

import android.content.Context
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.platform.LocalContext
import com.vaahan.driver.ui.screens.login.LoginScreen
import com.vaahan.driver.ui.screens.dashboard.DashboardScreen
import com.vaahan.driver.ui.screens.profile.ProfileScreen
import com.vaahan.driver.ui.theme.DriverPortalTheme

enum class Screen {
    LOGIN,
    DASHBOARD,
    PROFILE,
    ACTIVE_TRIP,
    TRIP_SUMMARY
}

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            DriverPortalTheme {
                val context = LocalContext.current
                val sharedPref = remember { context.getSharedPreferences("vaahan_prefs", Context.MODE_PRIVATE) }
                val savedDriverId = remember { sharedPref.getString("driver_id", null) }
                
                var currentScreen by remember { 
                    mutableStateOf(if (savedDriverId != null) Screen.DASHBOARD else Screen.LOGIN) 
                }
                var currentTripId by remember { mutableStateOf<String?>(null) }
                var startOnboarding by remember { mutableStateOf(false) }

                when (currentScreen) {
                    Screen.LOGIN -> LoginScreen(onNavigateToDashboard = { currentScreen = Screen.DASHBOARD })
                    Screen.DASHBOARD -> DashboardScreen(
                        onNavigateToProfile = { currentScreen = Screen.PROFILE },
                        onNavigateToActiveTrip = { tripId ->
                            currentTripId = tripId
                            currentScreen = Screen.ACTIVE_TRIP
                        },
                        startOnboarding = startOnboarding,
                        onOnboardingStarted = { startOnboarding = false }
                    )
                    Screen.PROFILE -> ProfileScreen(
                        onNavigateBack = { currentScreen = Screen.DASHBOARD },
                        onJoinFleet = {
                            startOnboarding = true
                            currentScreen = Screen.DASHBOARD
                        },
                        onLogout = { currentScreen = Screen.LOGIN }
                    )
                    Screen.ACTIVE_TRIP -> {
                        com.vaahan.driver.ui.screens.trip.ActiveTripScreen(
                            tripId = currentTripId ?: "",
                            onNavigateToSummary = { tripId ->
                                currentTripId = tripId
                                currentScreen = Screen.TRIP_SUMMARY
                            }
                        )
                    }
                    Screen.TRIP_SUMMARY -> {
                        com.vaahan.driver.ui.screens.trip.TripSummaryScreen(
                            tripId = currentTripId ?: "",
                            onNavigateToDashboard = {
                                currentScreen = Screen.DASHBOARD
                                currentTripId = null
                            }
                        )
                    }
                }
            }
        }
    }
}
