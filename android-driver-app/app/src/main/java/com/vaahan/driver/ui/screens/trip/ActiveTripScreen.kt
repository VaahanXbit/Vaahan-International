package com.vaahan.driver.ui.screens.trip

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.Orientation
import androidx.compose.foundation.gestures.draggable
import androidx.compose.foundation.gestures.rememberDraggableState
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowForward
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import com.vaahan.driver.data.api.RetrofitClient
import com.vaahan.driver.ui.theme.*
import kotlinx.coroutines.launch
import android.content.Intent
import android.os.Build
import androidx.compose.runtime.collectAsState
import com.vaahan.driver.service.TelemetryService
import com.vaahan.driver.service.TelemetryState
import kotlin.math.roundToInt

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ActiveTripScreen(
    tripId: String,
    viewModel: com.vaahan.driver.TripViewModel,
    onNavigateToSummary: (String) -> Unit,
    onMinimize: () -> Unit
) {
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()

    // Collect state flows from the background TelemetryService
    val currentSpeed by TelemetryState.liveSpeed.collectAsState()
    val lat by TelemetryState.liveLat.collectAsState()
    val lng by TelemetryState.liveLng.collectAsState()
    val locationName by TelemetryState.liveLocationName.collectAsState()
    val harshBrakes by TelemetryState.harshBrakes.collectAsState()
    val harshCorners by TelemetryState.harshCorners.collectAsState()
    val speeding by TelemetryState.speeding.collectAsState()
    val isConnected by TelemetryState.isConnected.collectAsState()

    // Intercept system back click to minimize trip
    androidx.activity.compose.BackHandler(enabled = true) {
        onMinimize()
    }

    // Sliding button properties
    var slideOffset by remember { mutableStateOf(0f) }
    val maxSlideOffset = 220f // Maximum drag offset in dp
    val density = context.resources.displayMetrics.density

    // Request permissions launcher (Location + Notification permissions needed for background tracking)
    val permissionsLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestMultiplePermissions(),
        onResult = { permissions ->
            val fineLocationGranted = permissions[Manifest.permission.ACCESS_FINE_LOCATION] ?: false
            if (fineLocationGranted) {
                // Permissions granted, launch TelemetryService in foreground
                val intent = Intent(context, TelemetryService::class.java).apply {
                    putExtra("tripId", tripId)
                }
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    context.startForegroundService(intent)
                } else {
                    context.startService(intent)
                }
            } else {
                Toast.makeText(context, "Location permission is required for telematic speedometer", Toast.LENGTH_SHORT).show()
            }
        }
    )

    // Launch Background Telemetry Service and setup shared state
    LaunchedEffect(tripId) {
        viewModel.isTripActive = true
        viewModel.isTripMinimized = false
        viewModel.currentTripId = tripId

        val permissionsToRequest = mutableListOf(
            Manifest.permission.ACCESS_FINE_LOCATION,
            Manifest.permission.ACCESS_COARSE_LOCATION
        )
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            permissionsToRequest.add(Manifest.permission.POST_NOTIFICATIONS)
        }

        // Check if fine location permission is already granted
        val hasFineLocation = ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
        if (hasFineLocation) {
            val intent = Intent(context, TelemetryService::class.java).apply {
                putExtra("tripId", tripId)
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        } else {
            permissionsLauncher.launch(permissionsToRequest.toTypedArray())
        }
    }

    // Main layout container
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.White)
            .padding(24.dp)
            .statusBarsPadding()
            .navigationBarsPadding(),
        contentAlignment = Alignment.TopCenter
    ) {
        Column(
            modifier = Modifier.fillMaxSize(),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(onClick = { onMinimize() }) {
                    Icon(
                        imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                        contentDescription = "Back",
                        tint = Color.Black
                    )
                }
                Text(
                    text = "ACTIVE TRIP",
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.Black,
                    letterSpacing = 1.sp,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.weight(1f).padding(end = 48.dp)
                )
            }

            Text(
                text = "#$tripId",
                fontSize = 11.sp,
                color = Color.Gray,
                fontWeight = FontWeight.SemiBold,
                textAlign = TextAlign.Center,
                modifier = Modifier.padding(top = 4.dp, bottom = 24.dp)
            )

            // Speed Card
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 8.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFFF9F9F9)),
                shape = RoundedCornerShape(12.dp)
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        text = "CURRENT SPEED",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.DarkGray,
                        letterSpacing = 0.5.sp
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    Row(
                        verticalAlignment = Alignment.Bottom,
                        horizontalArrangement = Arrangement.Center
                    ) {
                        Text(
                            text = "${currentSpeed.roundToInt()}",
                            fontSize = 64.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = Color.Black
                        )
                        Text(
                            text = " km/h",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color.Gray,
                            modifier = Modifier.padding(bottom = 12.dp)
                        )
                    }
                }
            }

            // Location Card
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 8.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFFF9F9F9)),
                shape = RoundedCornerShape(12.dp)
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp)
                ) {
                    Text(
                        text = "CURRENT LOCATION",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.DarkGray
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = locationName,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.Black
                    )
                }
            }

            // Metrics Cards Row
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 8.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                // Harsh Brakes
                Card(
                    modifier = Modifier.weight(1f),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFFF9F9F9)),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp)
                    ) {
                        Text(
                            text = "HARSH\nBRAKES",
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color.DarkGray,
                            lineHeight = 12.sp
                        )
                        Spacer(modifier = Modifier.height(12.dp))
                        Text(
                            text = "$harshBrakes",
                            fontSize = 22.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color.Black
                        )
                    }
                }

                // Harsh Corners
                Card(
                    modifier = Modifier.weight(1f),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFFF9F9F9)),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp)
                    ) {
                        Text(
                            text = "HARSH\nCORNERS",
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color.DarkGray,
                            lineHeight = 12.sp
                        )
                        Spacer(modifier = Modifier.height(12.dp))
                        Text(
                            text = "$harshCorners",
                            fontSize = 22.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color.Black
                        )
                    }
                }

                // Speeding
                Card(
                    modifier = Modifier.weight(1f),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFFF9F9F9)),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp)
                    ) {
                        Text(
                            text = "SPEEDING\n",
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color.DarkGray,
                            lineHeight = 12.sp
                        )
                        Spacer(modifier = Modifier.height(12.dp))
                        Text(
                            text = "$speeding",
                            fontSize = 22.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color.Black
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.weight(1f))

            // Slide to End Trip Button
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(56.dp)
                    .background(Color(0xFFFFDCDA), RoundedCornerShape(28.dp))
                    .padding(4.dp),
                contentAlignment = Alignment.CenterStart
            ) {
                Text(
                    text = "Slide to End Trip →",
                    modifier = Modifier.fillMaxWidth(),
                    textAlign = TextAlign.Center,
                    fontWeight = FontWeight.Bold,
                    fontSize = 14.sp,
                    color = Color(0xFF8B201D)
                )

                Box(
                    modifier = Modifier
                        .offset { IntOffset((slideOffset * density).roundToInt(), 0) }
                        .size(48.dp)
                        .background(Color(0xFFF9C8C6), CircleShape)
                        .draggable(
                            orientation = Orientation.Horizontal,
                            state = rememberDraggableState { delta ->
                                val computed = slideOffset + delta / density
                                slideOffset = computed.coerceIn(0f, maxSlideOffset)
                            },
                            onDragStopped = {
                                if (slideOffset >= maxSlideOffset - 10f) {
                                    // Slide success! End the trip.
                                    coroutineScope.launch {
                                        try {
                                            context.stopService(Intent(context, TelemetryService::class.java))
                                            val response = RetrofitClient.api.endTrip(tripId, 0.0, 0)
                                            if (response.isSuccessful) {
                                                viewModel.isTripActive = false
                                                viewModel.isTripMinimized = false
                                                onNavigateToSummary(tripId)
                                            } else {
                                                Toast.makeText(context, "Failed to end trip: ${response.message()}", Toast.LENGTH_SHORT).show()
                                            }
                                        } catch (e: Exception) {
                                            Toast.makeText(context, "Error: ${e.message}", Toast.LENGTH_SHORT).show()
                                        }
                                    }
                                } else {
                                    // Reset back
                                    slideOffset = 0f
                                }
                            }
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.ArrowForward,
                        contentDescription = "Slide Arrow",
                        tint = Color(0xFF8B201D)
                    )
                }
            }
            Spacer(modifier = Modifier.height(16.dp))
        }
    }
}
