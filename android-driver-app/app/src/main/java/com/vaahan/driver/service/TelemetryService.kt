package com.vaahan.driver.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.os.Build
import android.os.Bundle
import android.os.IBinder
import android.os.SystemClock
import android.util.Log
import androidx.core.app.NotificationCompat
import com.vaahan.driver.MainActivity
import com.vaahan.driver.config.AppConfig
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.MutableStateFlow
import okhttp3.*
import org.json.JSONObject
import java.time.Instant

object TelemetryState {
    val liveSpeed = MutableStateFlow(0.0)
    val liveLat = MutableStateFlow(0.0)
    val liveLng = MutableStateFlow(0.0)
    val liveLocationName = MutableStateFlow("Locating...")
    val harshBrakes = MutableStateFlow(0)
    val harshCorners = MutableStateFlow(0)
    val speeding = MutableStateFlow(0)
    val isConnected = MutableStateFlow(false)

    fun reset() {
        liveSpeed.value = 0.0
        liveLat.value = 0.0
        liveLng.value = 0.0
        liveLocationName.value = "Locating..."
        harshBrakes.value = 0
        harshCorners.value = 0
        speeding.value = 0
        isConnected.value = false
    }
}

class TelemetryService : Service() {

    private val serviceJob = SupervisorJob()
    private val serviceScope = CoroutineScope(Dispatchers.Default + serviceJob)

    private var tripId: String? = null
    private var webSocket: WebSocket? = null
    private var okHttpClient: OkHttpClient? = null

    private lateinit var sensorManager: SensorManager
    private lateinit var locationManager: LocationManager

    // Current raw values
    private var lat = 0.0
    private var lng = 0.0
    private var currentSpeed = 0.0
    private var accelX = 0.0
    private var accelY = 0.0
    private var accelZ = 0.0

    // Idle monitoring variables
    private var lastMovementTime = SystemClock.elapsedRealtime()
    private var lastKnownLat = 0.0
    private var lastKnownLng = 0.0
    private var idleNotificationSent = false
    private var idleCheckJob: Job? = null

    companion object {
        private const val CHANNEL_ID = "vaahan_telemetry_channel"
        private const val NOTIFICATION_ID = 1001
        private const val IDLE_NOTIFICATION_ID = 1002
        private const val TAG = "TelemetryService"
    }

    private val sensorListener = object : SensorEventListener {
        override fun onSensorChanged(event: SensorEvent?) {
            if (event != null && event.sensor.type == Sensor.TYPE_ACCELEROMETER) {
                accelX = event.values[0].toDouble() / 9.81
                accelY = event.values[1].toDouble() / 9.81
                accelZ = event.values[2].toDouble() / 9.81
            }
        }
        override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {}
    }

    private val locationListener = object : LocationListener {
        override fun onLocationChanged(location: Location) {
            lat = location.latitude
            lng = location.longitude
            currentSpeed = location.speed * 3.6 // m/s to km/h

            TelemetryState.liveLat.value = lat
            TelemetryState.liveLng.value = lng
            TelemetryState.liveSpeed.value = currentSpeed

            // Check if moving (speed > 5 km/h or moved significantly)
            val distance = FloatArray(1)
            Location.distanceBetween(lat, lng, lastKnownLat, lastKnownLng, distance)
            if (currentSpeed > 5.0 || distance[0] > 10f) {
                lastMovementTime = SystemClock.elapsedRealtime()
                lastKnownLat = lat
                lastKnownLng = lng
                idleNotificationSent = false
            }
        }
        override fun onStatusChanged(provider: String?, status: Int, extras: Bundle?) {}
        override fun onProviderEnabled(provider: String) {}
        override fun onProviderDisabled(provider: String) {}
    }

    override fun onCreate() {
        super.onCreate()
        sensorManager = getSystemService(Context.SENSOR_SERVICE) as SensorManager
        locationManager = getSystemService(Context.LOCATION_SERVICE) as LocationManager
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val incomingTripId = intent?.getStringExtra("tripId")
        if (incomingTripId != null && incomingTripId != tripId) {
            tripId = incomingTripId
            TelemetryState.reset()
            startTelemetry()
        }

        // Start as foreground service to keep it active
        val notification = createNotification("Trip tracking is active in the background")
        startForeground(NOTIFICATION_ID, notification)

        return START_STICKY
    }

    private fun startTelemetry() {
        // Unregister listeners and close sockets if already active
        stopTelemetry()

        // 1. Connect WebSocket
        val wsUrl = AppConfig.WS_URL + tripId
        okHttpClient = OkHttpClient()
        val request = Request.Builder().url(wsUrl).build()

        val listener = object : WebSocketListener() {
            override fun onOpen(webSocket: WebSocket, response: Response) {
                this@TelemetryService.webSocket = webSocket
                TelemetryState.isConnected.value = true
                Log.d(TAG, "WebSocket connection opened successfully.")
            }

            override fun onMessage(webSocket: WebSocket, text: String) {
                try {
                    val json = JSONObject(text)
                    if (json.optBoolean("received", false)) {
                        val event = json.optString("event_detected", "")
                        if (event == "harsh_brake") {
                            TelemetryState.harshBrakes.value++
                        } else if (event == "harsh_corner") {
                            TelemetryState.harshCorners.value++
                        } else if (event == "speeding") {
                            TelemetryState.speeding.value++
                        }
                        val resolvedLoc = json.optString("location_name", "")
                        if (resolvedLoc.isNotEmpty()) {
                            TelemetryState.liveLocationName.value = resolvedLoc
                        }
                    }
                } catch (e: Exception) {
                    e.printStackTrace()
                }
            }

            override fun onClosed(webSocket: WebSocket, code: Int, reason: String) {
                TelemetryState.isConnected.value = false
            }

            override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
                TelemetryState.isConnected.value = false
                Log.e(TAG, "WebSocket failure: ${t.message}")
            }
        }

        webSocket = okHttpClient?.newWebSocket(request, listener)

        // 2. Register Sensors
        val accelSensor = sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER)
        if (accelSensor != null) {
            sensorManager.registerListener(sensorListener, accelSensor, SensorManager.SENSOR_DELAY_UI)
        }

        // 3. Register Location updates (GPS + Network for indoor testing support)
        try {
            locationManager.requestLocationUpdates(
                LocationManager.GPS_PROVIDER,
                1000L,
                1f,
                locationListener
            )
            if (locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)) {
                locationManager.requestLocationUpdates(
                    LocationManager.NETWORK_PROVIDER,
                    1000L,
                    1f,
                    locationListener
                )
            }
        } catch (se: SecurityException) {
            se.printStackTrace()
        }

        // 4. Start Telemetry Send Loop
        serviceScope.launch {
            while (isActive) {
                if (TelemetryState.isConnected.value && webSocket != null) {
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
                        webSocket?.send(payload.toString())
                    } catch (e: Exception) {
                        e.printStackTrace()
                    }
                }
                delay(1000L)
            }
        }

        // 5. Start 5-Minute Idle Checker
        lastMovementTime = SystemClock.elapsedRealtime()
        idleNotificationSent = false
        idleCheckJob = serviceScope.launch {
            while (isActive) {
                delay(10000L) // Check every 10 seconds
                val elapsedIdleTimeMs = SystemClock.elapsedRealtime() - lastMovementTime
                if (elapsedIdleTimeMs > 5 * 60 * 1000L) { // 5 minutes in milliseconds
                    if (!idleNotificationSent) {
                        sendIdleReminderNotification()
                        idleNotificationSent = true
                    }
                }
            }
        }
    }

    private fun sendIdleReminderNotification() {
        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        
        val intent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        }
        val pendingIntent = android.app.PendingIntent.getActivity(
            this,
            0,
            intent,
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) android.app.PendingIntent.FLAG_IMMUTABLE else 0
        )

        val notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_dialog_alert)
            .setContentTitle("Are you still driving?")
            .setContentText("You have been idle for 5 minutes. Remember to end your trip in the app!")
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setDefaults(Notification.DEFAULT_ALL)
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)
            .build()

        notificationManager.notify(IDLE_NOTIFICATION_ID, notification)
    }

    private fun stopTelemetry() {
        try {
            sensorManager.unregisterListener(sensorListener)
            locationManager.removeUpdates(locationListener)
            webSocket?.close(1000, "Service stopped")
            webSocket = null
            okHttpClient = null
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    override fun onDestroy() {
        stopTelemetry()
        serviceJob.cancel()
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? {
        return null
    }

    private fun createNotification(content: String): Notification {
        val intent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP
        }
        val pendingIntent = android.app.PendingIntent.getActivity(
            this,
            0,
            intent,
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) android.app.PendingIntent.FLAG_IMMUTABLE else 0
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_menu_mylocation)
            .setContentTitle("Vaahan Driver Tracking")
            .setContentText(content)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setContentIntent(pendingIntent)
            .build()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val serviceChannel = NotificationChannel(
                CHANNEL_ID,
                "Vaahan Telemetry Service Channel",
                NotificationManager.IMPORTANCE_DEFAULT
            )
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(serviceChannel)
        }
    }
}
