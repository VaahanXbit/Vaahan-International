package com.vaahan.driver.ui.screens.trip

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.os.Bundle
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
import com.vaahan.driver.config.AppConfig
import com.vaahan.driver.data.api.RetrofitClient
import com.vaahan.driver.ui.theme.*
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.WebSocket
import okhttp3.WebSocketListener
import org.json.JSONObject
import java.time.Instant
import kotlin.math.roundToInt

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ActiveTripScreen(
    tripId: String,
    onNavigateToSummary: (String) -> Unit
) {
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()

    // Sensor states
    var currentSpeed by remember { mutableStateOf(0.0) }
    var lat by remember { mutableStateOf(0.0) }
    var lng by remember { mutableStateOf(0.0) }
    var accelX by remember { mutableStateOf(0.0) }
    var accelY by remember { mutableStateOf(0.0) }
    var accelZ by remember { mutableStateOf(0.0) }
    var locationName by remember { mutableStateOf("Locating...") }

    // Event states (incremented via WebSocket feedback)
    var harshBrakes by remember { mutableStateOf(0) }
    var harshCorners by remember { mutableStateOf(0) }
    var speeding by remember { mutableStateOf(0) }

    // Sliding button properties
    var slideOffset by remember { mutableStateOf(0f) }
    val maxSlideOffset = 220f // Maximum drag offset in dp
    val density = context.resources.displayMetrics.density

    // WebSocket state
    val webSocketRef = remember { mutableStateOf<WebSocket?>(null) }
    val isConnected = remember { mutableStateOf(false) }

    // Sensor managers
    val sensorManager = remember { context.getSystemService(Context.SENSOR_SERVICE) as SensorManager }
    val locationManager = remember { context.getSystemService(Context.LOCATION_SERVICE) as LocationManager }

    // Accelerometer listener
    val sensorListener = remember {
        object : SensorEventListener {
            override fun onSensorChanged(event: SensorEvent?) {
                if (event != null && event.sensor.type == Sensor.TYPE_ACCELEROMETER) {
                    accelX = event.values[0].toDouble() / 9.81
                    accelY = event.values[1].toDouble() / 9.81
                    accelZ = event.values[2].toDouble() / 9.81
                }
            }
            override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {}
        }
    }

    // Location GPS listener
    val locationListener = remember {
        object : LocationListener {
            override fun onLocationChanged(location: Location) {
                lat = location.latitude
                lng = location.longitude
                currentSpeed = location.speed * 3.6 // m/s to km/h
            }
            override fun onStatusChanged(provider: String?, status: Int, extras: Bundle?) {}
            override fun onProviderEnabled(provider: String) {}
            override fun onProviderDisabled(provider: String) {}
        }
    }

    // Connect WebSocket
    LaunchedEffect(tripId) {
        val wsUrl = AppConfig.WS_URL + tripId
        val client = OkHttpClient()
        val request = Request.Builder().url(wsUrl).build()

        val listener = object : WebSocketListener() {
            override fun onOpen(webSocket: WebSocket, response: okhttp3.Response) {
                isConnected.value = true
                webSocketRef.value = webSocket
            }
            override fun onMessage(webSocket: WebSocket, text: String) {
                try {
                    val json = JSONObject(text)
                    if (json.optBoolean("received", false)) {
                        val event = json.optString("event_detected", "")
                        if (event == "harsh_brake") {
                            harshBrakes++
                        } else if (event == "harsh_corner") {
                            harshCorners++
                        } else if (event == "speeding") {
                            speeding++
                        }
                        val resolvedLoc = json.optString("location_name", "")
                        if (resolvedLoc.isNotEmpty()) {
                            locationName = resolvedLoc
                        }
                    }
                } catch (e: Exception) {
                    e.printStackTrace()
                }
            }
            override fun onClosed(webSocket: WebSocket, code: Int, reason: String) {
                isConnected.value = false
            }
            override fun onFailure(webSocket: WebSocket, t: Throwable, response: okhttp3.Response?) {
                isConnected.value = false
            }
        }
        webSocketRef.value = client.newWebSocket(request, listener)
    }

    // Request Location Permission
    val launcher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission(),
        onResult = { granted ->
            if (granted) {
                try {
                    locationManager.requestLocationUpdates(
                        LocationManager.GPS_PROVIDER,
                        1000L,
                        1f,
                        locationListener
                    )
                } catch (se: SecurityException) {
                    se.printStackTrace()
                }
            } else {
                Toast.makeText(context, "Location permission is required for speedometer", Toast.LENGTH_SHORT).show()
            }
        }
    )

    // Register listeners
    DisposableEffect(Unit) {
        // Register accelerometer
        val accelSensor = sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER)
        if (accelSensor != null) {
            sensorManager.registerListener(sensorListener, accelSensor, SensorManager.SENSOR_DELAY_UI)
        }

        // Register location
        if (ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED) {
            try {
                locationManager.requestLocationUpdates(
                    LocationManager.GPS_PROVIDER,
                    1000L,
                    1f,
                    locationListener
                )
            } catch (se: SecurityException) {
                se.printStackTrace()
            }
        } else {
            launcher.launch(Manifest.permission.ACCESS_FINE_LOCATION)
        }

        onDispose {
            sensorManager.unregisterListener(sensorListener)
            locationManager.removeUpdates(locationListener)
            webSocketRef.value?.close(1000, "Trip exited active screen")
        }
    }

    // Telemetry Send Loop
    LaunchedEffect(isConnected.value) {
        while (isConnected.value) {
            val ws = webSocketRef.value
            if (ws != null) {
                try {
                    val payload = JSONObject().apply {
                        put("lat", lat)
                        put("lng", lng)
                        put("speed_kmh", currentSpeed)
                        put("accel_x", accelX)
                        put("accel_y", accelY)
                        put("accel_z", accelZ)
                        put("timestamp", Instant.now().toString())
                    }
                    ws.send(payload.toString())
                } catch (e: Exception) {
                    e.printStackTrace()
                }
            }
            delay(1000L)
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
            Text(
                text = "ACTIVE TRIP",
                fontSize = 13.sp,
                fontWeight = FontWeight.Bold,
                color = Color.Black,
                letterSpacing = 1.sp,
                modifier = Modifier.padding(top = 16.dp)
            )

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
                                            webSocketRef.value?.close(1000, "Trip slide-ended")
                                            val response = RetrofitClient.api.endTrip(tripId, 0.0, 0)
                                            if (response.isSuccessful) {
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
