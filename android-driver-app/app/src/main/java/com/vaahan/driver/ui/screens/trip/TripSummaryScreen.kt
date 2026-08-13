package com.vaahan.driver.ui.screens.trip

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.vaahan.driver.data.api.RetrofitClient
import com.vaahan.driver.data.api.TripDetails
import com.vaahan.driver.ui.theme.*
import kotlinx.coroutines.launch
import kotlin.math.roundToInt

@Composable
fun TripSummaryScreen(
    tripId: String,
    onNavigateToDashboard: () -> Unit
) {
    val context = LocalContext.current
    var tripDetails by remember { mutableStateOf<TripDetails?>(null) }
    var isLoading by remember { mutableStateOf(true) }

    LaunchedEffect(tripId) {
        try {
            val response = RetrofitClient.api.getTrip(tripId)
            if (response.isSuccessful && response.body()?.status == "success") {
                tripDetails = response.body()?.trip
            } else {
                Toast.makeText(context, "Could not fetch summary: ${response.message()}", Toast.LENGTH_SHORT).show()
            }
        } catch (e: Exception) {
            Toast.makeText(context, "Network error: ${e.message}", Toast.LENGTH_SHORT).show()
        } finally {
            isLoading = false
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFFF6F8F9))
            .padding(24.dp)
            .statusBarsPadding()
            .navigationBarsPadding(),
        contentAlignment = Alignment.Center
    ) {
        if (isLoading) {
            CircularProgressIndicator(color = Color(0xFF006E44))
        } else {
            Column(
                modifier = Modifier.fillMaxWidth(),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = "COMPLETED",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.Gray,
                    letterSpacing = 1.sp
                )

                Text(
                    text = "TRIP SUMMARY",
                    fontSize = 24.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = Color.Black,
                    modifier = Modifier.padding(top = 4.dp, bottom = 24.dp)
                )

                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 32.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    shape = RoundedCornerShape(16.dp),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(20.dp)
                    ) {
                        SummaryRow(label = "Trip ID", value = "#${tripId.take(15)}...")
                        SummaryRow(label = "Duration", value = "${tripDetails?.duration_minutes ?: 0} min")
                        SummaryRow(label = "Distance", value = String.format("%.2f km", tripDetails?.distance_km ?: 0.0))
                        
                        Divider(modifier = Modifier.padding(vertical = 12.dp), color = Color(0xFFEEEEEE))

                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 6.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "Safety Score",
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color.DarkGray
                            )
                            Text(
                                text = "${tripDetails?.final_score?.roundToInt() ?: 100}/100",
                                fontSize = 16.sp,
                                fontWeight = FontWeight.ExtraBold,
                                color = Color(0xFF006E44)
                            )
                        }

                        Divider(modifier = Modifier.padding(vertical = 12.dp), color = Color(0xFFEEEEEE))

                        SummaryRow(label = "Harsh Brakes", value = "${tripDetails?.harsh_brake_count ?: 0} events")
                        SummaryRow(label = "Harsh Corners", value = "${tripDetails?.harsh_corner_count ?: 0} events")
                        SummaryRow(label = "Speeding Incidents", value = "${tripDetails?.speeding_count ?: 0} events")
                    }
                }

                Button(
                    onClick = onNavigateToDashboard,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(50.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF006E44)),
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Text(
                        text = "BACK TO DASHBOARD",
                        color = Color.White,
                        fontWeight = FontWeight.Bold,
                        fontSize = 15.sp
                    )
                }
            }
        }
    }
}

@Composable
fun SummaryRow(label: String, value: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = label,
            fontSize = 13.sp,
            fontWeight = FontWeight.Medium,
            color = Color.Gray
        )
        Text(
            text = value,
            fontSize = 14.sp,
            fontWeight = FontWeight.Bold,
            color = Color.Black
        )
    }
}
