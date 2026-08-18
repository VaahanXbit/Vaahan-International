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

import androidx.lifecycle.ViewModel
import androidx.compose.ui.Modifier
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.ui.unit.dp

enum class Screen {
    LOGIN,
    DASHBOARD,
    PROFILE,
    ACTIVE_TRIP,
    TRIP_SUMMARY
}

class TripViewModel : ViewModel() {
    var isTripActive by mutableStateOf(false)
    var isTripMinimized by mutableStateOf(false)
    var currentTripId by mutableStateOf<String?>(null)
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

                val viewModel = remember { TripViewModel() }
                var selectedTab by remember { mutableStateOf(0) }

                Box(modifier = Modifier.fillMaxSize()) {
                    when (currentScreen) {
                        Screen.LOGIN -> LoginScreen(onNavigateToDashboard = { currentScreen = Screen.DASHBOARD })
                        Screen.DASHBOARD -> DashboardScreen(
                            viewModel = viewModel,
                            selectedTab = selectedTab,
                            onTabSelected = { tab ->
                                selectedTab = tab
                                if (viewModel.isTripActive) {
                                    viewModel.isTripMinimized = true
                                }
                            },
                            onNavigateToProfile = { currentScreen = Screen.PROFILE },
                            onNavigateToActiveTrip = { tripId ->
                                currentTripId = tripId
                                viewModel.currentTripId = tripId
                                viewModel.isTripActive = true
                                viewModel.isTripMinimized = false
                                selectedTab = 0
                                currentScreen = Screen.DASHBOARD
                            },
                            onNavigateToSummary = { tripId ->
                                currentTripId = tripId
                                currentScreen = Screen.TRIP_SUMMARY
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
                            // Fallback, should not be hit as ACTIVE_TRIP is nested inside DASHBOARD
                            currentScreen = Screen.DASHBOARD
                            selectedTab = 0
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

                    if (viewModel.isTripActive && viewModel.isTripMinimized) {
                        val bottomPadding = if (currentScreen == Screen.DASHBOARD) 80.dp else 0.dp
                        com.vaahan.driver.ui.screens.trip.MinimizedTripOverlay(
                            viewModel = viewModel,
                            onExpand = {
                                viewModel.isTripMinimized = false
                                selectedTab = 0
                                currentScreen = Screen.DASHBOARD
                            },
                            onNavigateToSummary = { tripId ->
                                currentTripId = tripId
                                currentScreen = Screen.TRIP_SUMMARY
                            },
                            bottomPadding = bottomPadding
                        )
                    }
                }
            }
        }
    }
}
