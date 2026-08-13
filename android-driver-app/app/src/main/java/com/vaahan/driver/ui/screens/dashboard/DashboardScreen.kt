package com.vaahan.driver.ui.screens.dashboard

import android.content.Context
import android.widget.Toast
import androidx.compose.ui.platform.LocalContext
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.CreditCard
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.ArrowForward
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.vaahan.driver.data.api.RetrofitClient
import com.vaahan.driver.ui.theme.*
import kotlinx.coroutines.launch

enum class OnboardingStage {
    NONE,
    FLEET_ONBOARD,
    ENTER_OTP
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardScreen(
    onNavigateToProfile: () -> Unit,
    onNavigateToActiveTrip: (String) -> Unit
) {
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()
    val sharedPref = remember { context.getSharedPreferences("vaahan_prefs", Context.MODE_PRIVATE) }
    
    val initialCompanyName = remember { sharedPref.getString("company_name", null) }
    var currentCompanyName by remember { mutableStateOf(initialCompanyName ?: "Independent Drivers") }
    var isLoading by remember { mutableStateOf(false) }

    var onboardingStage by remember { 
        mutableStateOf(
            if (initialCompanyName == null || initialCompanyName == "Independent Drivers") 
                OnboardingStage.FLEET_ONBOARD 
            else 
                OnboardingStage.NONE
        ) 
    }

    var selectedTab by remember { mutableStateOf(0) }

    // Focus requesters and digits for 6-digit OTP fields
    val focusRequesters = remember { List(6) { FocusRequester() } }
    val otpDigits = remember { mutableStateListOf("", "", "", "", "", "") }

    Scaffold(
        bottomBar = {
            NavigationBar(
                containerColor = Color.White,
                tonalElevation = 8.dp
            ) {
                NavigationBarItem(
                    selected = selectedTab == 0,
                    onClick = { selectedTab = 0 },
                    icon = {
                        Icon(
                            imageVector = Icons.Default.Home,
                            contentDescription = "Dashboard"
                        )
                    },
                    label = { Text("Dashboard", fontSize = 11.sp) },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = Color.White,
                        selectedTextColor = PrimaryGreen,
                        unselectedIconColor = TextSecondary,
                        unselectedTextColor = TextSecondary,
                        indicatorColor = Color(0xFF4F46E5)
                    )
                )
                NavigationBarItem(
                    selected = selectedTab == 1,
                    onClick = { selectedTab = 1 },
                    icon = {
                        Icon(
                            imageVector = Icons.Default.Description,
                            contentDescription = "RTO Documents"
                        )
                    },
                    label = { Text("RTO Documents", fontSize = 11.sp) },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = Color.White,
                        selectedTextColor = PrimaryGreen,
                        unselectedIconColor = TextSecondary,
                        unselectedTextColor = TextSecondary,
                        indicatorColor = Color(0xFF4F46E5)
                    )
                )
                NavigationBarItem(
                    selected = selectedTab == 2,
                    onClick = { selectedTab = 2 },
                    icon = {
                        Icon(
                            imageVector = Icons.Default.CreditCard,
                            contentDescription = "Fastag"
                        )
                    },
                    label = { Text("Fastag", fontSize = 11.sp) },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = Color.White,
                        selectedTextColor = PrimaryGreen,
                        unselectedIconColor = TextSecondary,
                        unselectedTextColor = TextSecondary,
                        indicatorColor = Color(0xFF4F46E5)
                    )
                )
            }
        }
    ) { innerPadding ->
        // Onboarding Dialog Flow
        if (onboardingStage != OnboardingStage.NONE) {
            Dialog(
                onDismissRequest = { /* Force onboarding choice */ },
                properties = DialogProperties(usePlatformDefaultWidth = false)
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(Color.Black.copy(alpha = 0.5f)),
                    contentAlignment = Alignment.Center
                ) {
                    Card(
                        modifier = Modifier
                            .fillMaxWidth(0.88f)
                            .wrapContentHeight(),
                        colors = CardDefaults.cardColors(containerColor = Color.White),
                        shape = RoundedCornerShape(24.dp)
                    ) {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(24.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            // Header Close row
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.End
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(32.dp)
                                        .background(Color(0xFFF3F4F6), CircleShape)
                                        .clickable { onboardingStage = OnboardingStage.NONE },
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Close,
                                        contentDescription = "Close",
                                        tint = Color(0xFF4B5563),
                                        modifier = Modifier.size(16.dp)
                                    )
                                }
                            }

                            if (onboardingStage == OnboardingStage.FLEET_ONBOARD) {
                                Spacer(modifier = Modifier.height(8.dp))

                                Text(
                                    text = "Onboard with Fleet",
                                    fontSize = 22.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = TextPrimary
                                )

                                Spacer(modifier = Modifier.height(10.dp))

                                Text(
                                    text = "Connect using a Fleet OTP.",
                                    fontSize = 14.sp,
                                    color = TextSecondary,
                                    textAlign = TextAlign.Center
                                )

                                Spacer(modifier = Modifier.height(28.dp))

                                Button(
                                    onClick = { onboardingStage = OnboardingStage.ENTER_OTP },
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .height(48.dp),
                                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF4F46E5)),
                                    shape = RoundedCornerShape(12.dp)
                                ) {
                                    Text(
                                        text = "PROCEED",
                                        color = Color.White,
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 14.sp
                                    )
                                }
                            } else if (onboardingStage == OnboardingStage.ENTER_OTP) {
                                Spacer(modifier = Modifier.height(4.dp))

                                // Lock Icon
                                Box(
                                    modifier = Modifier
                                        .size(48.dp)
                                        .background(Color(0xFFEEF2FF), CircleShape),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Lock,
                                        contentDescription = null,
                                        tint = Color(0xFF4F46E5),
                                        modifier = Modifier.size(24.dp)
                                    )
                                }

                                Spacer(modifier = Modifier.height(16.dp))

                                Text(
                                    text = "Enter Fleet OTP",
                                    fontSize = 20.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = TextPrimary
                                )

                                Spacer(modifier = Modifier.height(8.dp))

                                Text(
                                    text = "Enter the 6-digit code provided by your Fleet Manager.",
                                    fontSize = 13.sp,
                                    color = TextSecondary,
                                    textAlign = TextAlign.Center,
                                    modifier = Modifier.padding(horizontal = 8.dp)
                                )

                                Spacer(modifier = Modifier.height(24.dp))

                                // 6 side-by-side digit input boxes
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceEvenly
                                ) {
                                    for (i in 0..5) {
                                        OutlinedTextField(
                                            value = otpDigits[i],
                                            onValueChange = { value ->
                                                if (value.length <= 1) {
                                                    val wasEmpty = otpDigits[i].isEmpty()
                                                    otpDigits[i] = value
                                                    if (value.isNotEmpty() && i < 5) {
                                                        focusRequesters[i + 1].requestFocus()
                                                    } else if (value.isEmpty() && !wasEmpty && i > 0) {
                                                        focusRequesters[i - 1].requestFocus()
                                                    }
                                                }
                                            },
                                            modifier = Modifier
                                                .width(42.dp)
                                                .focusRequester(focusRequesters[i]),
                                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                            singleLine = true,
                                            textStyle = LocalTextStyle.current.copy(textAlign = TextAlign.Center),
                                            colors = OutlinedTextFieldDefaults.colors(
                                                focusedBorderColor = Color(0xFF4F46E5),
                                                unfocusedBorderColor = Border,
                                                focusedContainerColor = Color.White,
                                                unfocusedContainerColor = Color.White,
                                                focusedTextColor = TextPrimary,
                                                unfocusedTextColor = TextPrimary
                                            ),
                                            shape = RoundedCornerShape(8.dp)
                                        )
                                    }
                                }

                                Spacer(modifier = Modifier.height(28.dp))

                                if (isLoading) {
                                    CircularProgressIndicator(color = Color(0xFF4F46E5))
                                } else {
                                    Button(
                                        onClick = {
                                            val otpVal = otpDigits.joinToString("")
                                            if (otpVal.length < 6) {
                                                Toast.makeText(context, "Please enter 6 digit PIN", Toast.LENGTH_SHORT).show()
                                                return@Button
                                            }

                                            isLoading = true
                                            coroutineScope.launch {
                                                try {
                                                    val phone = sharedPref.getString("phone_number", "") ?: ""
                                                    val name = sharedPref.getString("driver_name", "") ?: ""
                                                    val vehicle = sharedPref.getString("vehicle_number", "") ?: ""

                                                    val response = RetrofitClient.api.verifyDriver(
                                                        phoneNumber = phone,
                                                        otp = otpVal,
                                                        name = name,
                                                        vehicleNumber = vehicle
                                                    )

                                                    if (response.isSuccessful && response.body() != null) {
                                                        val body = response.body()!!
                                                        sharedPref.edit().putString("company_name", body.company_name).apply()
                                                        currentCompanyName = body.company_name ?: "Independent Drivers"
                                                        Toast.makeText(context, body.message, Toast.LENGTH_SHORT).show()
                                                        onboardingStage = OnboardingStage.NONE
                                                    } else {
                                                        val err = response.errorBody()?.string() ?: "Invalid Fleet PIN"
                                                        Toast.makeText(context, err, Toast.LENGTH_LONG).show()
                                                    }
                                                } catch (e: Exception) {
                                                    Toast.makeText(context, "Network error: ${e.message}", Toast.LENGTH_LONG).show()
                                                } finally {
                                                    isLoading = false
                                                }
                                            }
                                        },
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .height(48.dp),
                                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF4F46E5)),
                                        shape = RoundedCornerShape(12.dp)
                                    ) {
                                        Row(
                                            verticalAlignment = Alignment.CenterVertically,
                                            horizontalArrangement = Arrangement.Center
                                        ) {
                                            Text(
                                                text = "Enter Fleet",
                                                color = Color.White,
                                                fontWeight = FontWeight.Bold,
                                                fontSize = 14.sp
                                            )
                                            Spacer(modifier = Modifier.width(6.dp))
                                            Icon(
                                                imageVector = Icons.Default.ArrowForward,
                                                contentDescription = null,
                                                modifier = Modifier.size(16.dp)
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        // Tab Content Router
        when (selectedTab) {
            0 -> {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(Background)
                        .padding(innerPadding)
                        .padding(horizontal = Spacing.lg),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    // Header bar with FleetSync title and Profile icon on the right
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = Spacing.md),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "FleetSync",
                            fontWeight = FontWeight.ExtraBold,
                            fontSize = 20.sp,
                            color = TextPrimary
                        )

                        Box(
                            modifier = Modifier
                                .size(40.dp)
                                .background(Color.White, CircleShape)
                                .clickable { onNavigateToProfile() },
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.Person,
                                contentDescription = "Profile",
                                tint = TextSecondary
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    // Status Indicator Chip (Dynamic based on connection)
                    if (currentCompanyName == "Independent Drivers") {
                        Card(
                            colors = CardDefaults.cardColors(containerColor = Color(0xFFFEF3C7)),
                            shape = RoundedCornerShape(16.dp),
                            elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(8.dp)
                                        .background(Color(0xFFD97706), CircleShape)
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    text = "NOT CONNECTED TO ANY FLEET",
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color(0xFFD97706)
                                )
                            }
                        }
                    } else {
                        Card(
                            colors = CardDefaults.cardColors(containerColor = Color(0xFFDCFCE7)),
                            shape = RoundedCornerShape(16.dp),
                            elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(8.dp)
                                        .background(Color(0xFF16A34A), CircleShape)
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    text = "PORT CONNECTED: ${currentCompanyName.uppercase()}",
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color(0xFF15803D)
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    Text(
                        text = "FLEET MANAGEMENT",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = TextSecondary,
                        letterSpacing = 1.sp
                    )

                    Spacer(modifier = Modifier.height(4.dp))

                    Text(
                        text = "DRIVER PORTAL",
                        fontSize = 26.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = TextPrimary,
                        letterSpacing = 0.5.sp
                    )

                    Spacer(modifier = Modifier.weight(1f))

                    Button(
                        onClick = {
                            coroutineScope.launch {
                                try {
                                    val driverId = sharedPref.getString("driver_id", "") ?: ""
                                    if (driverId.isEmpty()) {
                                        Toast.makeText(context, "Driver profile not found. Please log in again.", Toast.LENGTH_SHORT).show()
                                        return@launch
                                    }
                                    val response = RetrofitClient.api.startTrip(driverId)
                                    if (response.isSuccessful && response.body()?.status == "success") {
                                        val tripId = response.body()?.trip_id ?: ""
                                        onNavigateToActiveTrip(tripId)
                                    } else {
                                        Toast.makeText(context, "Failed to start trip: ${response.message()}", Toast.LENGTH_SHORT).show()
                                    }
                                } catch (e: Exception) {
                                    Toast.makeText(context, "Connection error: ${e.message}", Toast.LENGTH_SHORT).show()
                                }
                            }
                        },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(56.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF006E44)),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Text(
                            text = "START TRIP",
                            color = Color.White,
                            fontWeight = FontWeight.Bold,
                            fontSize = 16.sp
                        )
                    }
                    Spacer(modifier = Modifier.height(16.dp))
                }
            }
            1 -> {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(Background)
                        .padding(innerPadding),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "RTO Documents Screen\n(Under Construction)",
                        color = TextSecondary,
                        fontSize = 16.sp,
                        textAlign = TextAlign.Center
                    )
                }
            }
            2 -> {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(Background)
                        .padding(innerPadding),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "Fastag Screen\n(Under Construction)",
                        color = TextSecondary,
                        fontSize = 16.sp,
                        textAlign = TextAlign.Center
                    )
                }
            }
        }
    }
}
