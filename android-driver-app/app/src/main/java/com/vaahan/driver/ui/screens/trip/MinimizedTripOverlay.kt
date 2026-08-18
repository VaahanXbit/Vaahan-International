package com.vaahan.driver.ui.screens.trip

import android.content.Context
import android.content.Intent
import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.Orientation
import androidx.compose.foundation.gestures.draggable
import androidx.compose.foundation.gestures.rememberDraggableState
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowForward
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
import com.vaahan.driver.TripViewModel
import com.vaahan.driver.data.api.RetrofitClient
import com.vaahan.driver.service.TelemetryService
import com.vaahan.driver.service.TelemetryState
import kotlinx.coroutines.launch
import kotlin.math.roundToInt

@Composable
fun MinimizedTripOverlay(
    viewModel: TripViewModel,
    onExpand: () -> Unit,
    onNavigateToSummary: (String) -> Unit,
    bottomPadding: androidx.compose.ui.unit.Dp
) {
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()

    val currentSpeed by TelemetryState.liveSpeed.collectAsState()
    val locationName by TelemetryState.liveLocationName.collectAsState()
    val tripId = viewModel.currentTripId ?: ""

    // Sliding button properties
    var slideOffset by remember { mutableStateOf(0f) }
    val maxSlideOffset = 220f
    val density = context.resources.displayMetrics.density

    Box(
        modifier = Modifier
            .fillMaxSize()
            .navigationBarsPadding()
            .padding(bottom = bottomPadding),
        contentAlignment = Alignment.BottomCenter
    ) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .wrapContentHeight()
                .clickable { onExpand() },
            colors = CardDefaults.cardColors(containerColor = Color(0xFFF9F9F9)),
            shape = RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp),
            elevation = CardDefaults.cardElevation(defaultElevation = 16.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // Pulse Green indicator for Active Status
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.Center,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Box(
                        modifier = Modifier
                            .size(8.dp)
                            .background(Color(0xFF00C853), CircleShape)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = "ACTIVE TRIP",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFF006E44),
                        letterSpacing = 1.sp
                    )
                }

                Spacer(modifier = Modifier.height(12.dp))

                // Location and Speed display Row
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "CURRENT LOCATION",
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color.Gray
                        )
                        Spacer(modifier = Modifier.height(2.dp))
                        Text(
                            text = locationName,
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color.Black,
                            maxLines = 1
                        )
                    }

                    Spacer(modifier = Modifier.width(16.dp))

                    Column(horizontalAlignment = Alignment.End) {
                        Text(
                            text = "SPEED",
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color.Gray
                        )
                        Row(verticalAlignment = Alignment.Bottom) {
                            Text(
                                text = "${currentSpeed.roundToInt()}",
                                fontSize = 28.sp,
                                fontWeight = FontWeight.Black,
                                color = Color.Black
                            )
                            Text(
                                text = " km/h",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color.Gray
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

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
                                                    slideOffset = 0f
                                                }
                                            } catch (e: Exception) {
                                                Toast.makeText(context, "Error: ${e.message}", Toast.LENGTH_SHORT).show()
                                                slideOffset = 0f
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
            }
        }
    }
}
