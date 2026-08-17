package com.vaahan.driver.ui.screens.login

import android.content.Context
import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.DirectionsBike
import androidx.compose.material.icons.filled.DirectionsCar
import androidx.compose.material.icons.filled.AirportShuttle
import androidx.compose.material.icons.filled.DirectionsBus
import androidx.compose.material.icons.filled.LocalShipping
import androidx.compose.material3.Icon
import com.vaahan.driver.data.api.RetrofitClient
import com.vaahan.driver.ui.components.PrimaryButton
import com.vaahan.driver.ui.theme.Background
import com.vaahan.driver.ui.theme.Border
import com.vaahan.driver.ui.theme.PrimaryGreen
import com.vaahan.driver.ui.theme.Spacing
import com.vaahan.driver.ui.theme.TextPrimary
import com.vaahan.driver.ui.theme.TextSecondary
import kotlinx.coroutines.launch

data class VehicleOption(
    val id: String,
    val label: String,
    val icon: androidx.compose.ui.graphics.vector.ImageVector
)

@Composable
fun LoginScreen(onNavigateToDashboard: () -> Unit) {
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()

    var isLoginMode by remember { mutableStateOf(false) } // Default: Signup Mode
    var signupStep by remember { mutableStateOf(1) }
    var phoneNumber by remember { mutableStateOf("") }
    var driverName by remember { mutableStateOf("") }
    var vehicleNumber by remember { mutableStateOf("") }
    var selectedVehicleType by remember { mutableStateOf("Truck (HCV)") }
    var isLoading by remember { mutableStateOf(false) }

    val vehicleOptions = remember {
        listOf(
            VehicleOption("Bike", "Bike", Icons.Default.DirectionsBike),
            VehicleOption("Auto", "Auto", Icons.Default.DirectionsCar),
            VehicleOption("Car", "Car", Icons.Default.DirectionsCar),
            VehicleOption("Van", "Van", Icons.Default.AirportShuttle),
            VehicleOption("Bus", "Bus", Icons.Default.DirectionsBus),
            VehicleOption("Mini Truck (SCV)", "Mini Truck (SCV)", Icons.Default.LocalShipping),
            VehicleOption("Pickup Truck (LCV)", "Pickup Truck (LCV)", Icons.Default.LocalShipping),
            VehicleOption("Truck (HCV)", "Truck (HCV)", Icons.Default.LocalShipping)
        )
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Background)
            .padding(horizontal = Spacing.lg),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // Top Spacing
        Spacer(modifier = Modifier.height(80.dp))

        // Subtitle "FLEET MANAGEMENT"
        Text(
            text = "FLEET MANAGEMENT",
            fontSize = 12.sp,
            fontWeight = FontWeight.Bold,
            color = TextSecondary,
            letterSpacing = 1.sp
        )

        Spacer(modifier = Modifier.height(4.dp))

        // Main Title "DRIVER PORTAL"
        Text(
            text = "DRIVER PORTAL",
            fontSize = 26.sp,
            fontWeight = FontWeight.ExtraBold,
            color = TextPrimary,
            letterSpacing = 0.5.sp
        )

        Spacer(modifier = Modifier.height(32.dp))

        // Input Card Container
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            shape = RoundedCornerShape(20.dp),
            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(Spacing.lg)
            ) {
                if (isLoginMode) {
                    // 1. Phone Number Input with +91 Prefix
                    OutlinedTextField(
                        value = phoneNumber,
                        onValueChange = { phoneNumber = it },
                        placeholder = { Text("Phone Number", color = TextSecondary) },
                        leadingIcon = {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                modifier = Modifier.padding(start = 12.dp, end = 8.dp)
                            ) {
                                Text(
                                    text = "+91",
                                    fontWeight = FontWeight.Bold,
                                    color = TextPrimary,
                                    fontSize = 16.sp
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Box(
                                    modifier = Modifier
                                        .width(1.dp)
                                        .height(24.dp)
                                        .background(Border)
                                )
                            }
                        },
                        modifier = Modifier.fillMaxWidth(),
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                        singleLine = true,
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = PrimaryGreen,
                            unfocusedBorderColor = Border,
                            focusedContainerColor = Color.White,
                            unfocusedContainerColor = Color.White,
                            focusedTextColor = TextPrimary,
                            unfocusedTextColor = TextPrimary
                        ),
                        shape = RoundedCornerShape(12.dp)
                    )
                } else {
                    if (signupStep == 1) {
                        // Step 1: Phone number and Name
                        OutlinedTextField(
                            value = phoneNumber,
                            onValueChange = { phoneNumber = it },
                            placeholder = { Text("Phone Number", color = TextSecondary) },
                            leadingIcon = {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    modifier = Modifier.padding(start = 12.dp, end = 8.dp)
                                ) {
                                    Text(
                                        text = "+91",
                                        fontWeight = FontWeight.Bold,
                                        color = TextPrimary,
                                        fontSize = 16.sp
                                    )
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Box(
                                        modifier = Modifier
                                            .width(1.dp)
                                            .height(24.dp)
                                            .background(Border)
                                    )
                                }
                            },
                            modifier = Modifier.fillMaxWidth(),
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                            singleLine = true,
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = PrimaryGreen,
                                unfocusedBorderColor = Border,
                                focusedContainerColor = Color.White,
                                unfocusedContainerColor = Color.White,
                                focusedTextColor = TextPrimary,
                                unfocusedTextColor = TextPrimary
                            ),
                            shape = RoundedCornerShape(12.dp)
                        )

                        Spacer(modifier = Modifier.height(16.dp))

                        OutlinedTextField(
                            value = driverName,
                            onValueChange = { driverName = it },
                            placeholder = { Text("Driver Name", color = TextSecondary) },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true,
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = PrimaryGreen,
                                unfocusedBorderColor = Border,
                                focusedContainerColor = Color.White,
                                unfocusedContainerColor = Color.White,
                                focusedTextColor = TextPrimary,
                                unfocusedTextColor = TextPrimary
                            ),
                            shape = RoundedCornerShape(12.dp)
                        )
                    } else {
                        // Step 2: Vehicle details and Type Grid selector
                        OutlinedTextField(
                            value = vehicleNumber,
                            onValueChange = { vehicleNumber = it.uppercase() },
                            placeholder = { Text("Vehicle Number (e.g. GJ01AB1234)", color = TextSecondary) },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true,
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = PrimaryGreen,
                                unfocusedBorderColor = Border,
                                focusedContainerColor = Color.White,
                                unfocusedContainerColor = Color.White,
                                focusedTextColor = TextPrimary,
                                unfocusedTextColor = TextPrimary
                            ),
                            shape = RoundedCornerShape(12.dp)
                        )

                        Spacer(modifier = Modifier.height(20.dp))

                        Text(
                            text = "Select Vehicle Type",
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold,
                            color = TextPrimary,
                            modifier = Modifier.padding(bottom = 8.dp)
                        )

                        Column(modifier = Modifier.fillMaxWidth()) {
                            for (row in 0..1) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                                ) {
                                    for (col in 0..3) {
                                        val index = row * 4 + col
                                        if (index < vehicleOptions.size) {
                                            val option = vehicleOptions[index]
                                            val isSelected = selectedVehicleType == option.id
                                            Card(
                                                modifier = Modifier
                                                    .weight(1f)
                                                    .padding(vertical = 4.dp)
                                                    .clickable { selectedVehicleType = option.id },
                                                colors = CardDefaults.cardColors(
                                                    containerColor = if (isSelected) Color(0xFFE8F5E9) else Color(0xFFF9FAFB)
                                                ),
                                                border = BorderStroke(
                                                    1.dp,
                                                    if (isSelected) PrimaryGreen else Border
                                                ),
                                                shape = RoundedCornerShape(8.dp)
                                            ) {
                                                Column(
                                                    modifier = Modifier
                                                        .fillMaxWidth()
                                                        .padding(vertical = 8.dp, horizontal = 2.dp),
                                                    horizontalAlignment = Alignment.CenterHorizontally
                                                ) {
                                                    Icon(
                                                        imageVector = option.icon,
                                                        contentDescription = option.label,
                                                        tint = if (isSelected) PrimaryGreen else TextSecondary,
                                                        modifier = Modifier.size(20.dp)
                                                    )
                                                    Spacer(modifier = Modifier.height(4.dp))
                                                    Text(
                                                        text = option.label,
                                                        fontSize = 8.sp,
                                                        fontWeight = FontWeight.Bold,
                                                        color = if (isSelected) PrimaryGreen else TextPrimary,
                                                        textAlign = TextAlign.Center,
                                                        maxLines = 1
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

                Spacer(modifier = Modifier.height(24.dp))

                // Divider Line
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(1.dp)
                        .background(Border)
                )

                Spacer(modifier = Modifier.height(24.dp))

                // 4. Continue / Loading Indicator Button
                if (isLoading) {
                    Box(
                        modifier = Modifier.fillMaxWidth(),
                        contentAlignment = Alignment.Center
                    ) {
                        CircularProgressIndicator(color = PrimaryGreen)
                    }
                } else {
                    PrimaryButton(
                        text = if (!isLoginMode && signupStep == 1) "CONTINUE" else "SUBMIT",
                        onClick = {
                            if (phoneNumber.trim().isEmpty()) {
                                Toast.makeText(context, "Please enter phone number", Toast.LENGTH_SHORT).show()
                                return@PrimaryButton
                            }
                            if (!isLoginMode) {
                                if (signupStep == 1) {
                                    if (driverName.trim().isEmpty()) {
                                        Toast.makeText(context, "Please enter driver name", Toast.LENGTH_SHORT).show()
                                        return@PrimaryButton
                                    }
                                    signupStep = 2
                                    return@PrimaryButton
                                } else {
                                    // Step 2 Validation: Vehicle Number (Mandatory) matching standard Indian plate regex
                                    val formattedPlate = vehicleNumber.trim().uppercase().replace(" ", "").replace("-", "")
                                    val regex = Regex("^[A-Z]{2}[0-9]{2}[A-Z]{1,3}[0-9]{4}$")
                                    if (formattedPlate.isEmpty()) {
                                        Toast.makeText(context, "Please enter vehicle registration number", Toast.LENGTH_SHORT).show()
                                        return@PrimaryButton
                                    }
                                    if (!regex.matches(formattedPlate)) {
                                        Toast.makeText(context, "Invalid vehicle number format (e.g. GJ01AB1234)", Toast.LENGTH_LONG).show()
                                        return@PrimaryButton
                                    }
                                    if (selectedVehicleType.isEmpty()) {
                                        Toast.makeText(context, "Please select vehicle type", Toast.LENGTH_SHORT).show()
                                        return@PrimaryButton
                                    }
                                }
                            }

                            isLoading = true
                            coroutineScope.launch {
                                try {
                                    val response = RetrofitClient.api.authenticateDriver(
                                        phoneNumber = phoneNumber.trim(),
                                        name = if (isLoginMode) null else driverName.trim(),
                                        vehicleNumber = if (isLoginMode) null else vehicleNumber.trim().uppercase().replace(" ", "").replace("-", ""),
                                        vehicleType = if (isLoginMode) null else selectedVehicleType,
                                        isLogin = isLoginMode
                                    )

                                    if (response.isSuccessful && response.body() != null) {
                                        val body = response.body()!!
                                        // Save credentials to SharedPreferences
                                        val sharedPref = context.getSharedPreferences("vaahan_prefs", Context.MODE_PRIVATE)
                                        sharedPref.edit().apply {
                                            putString("driver_id", body.driver_id)
                                            putString("driver_name", body.name)
                                            putString("phone_number", body.phone_number)
                                            putString("vehicle_number", body.vehicle_number)
                                            putString("company_name", body.company_name)
                                            putString("access_token", body.access_token)
                                            putBoolean("has_shown_fleet_onboard", false)
                                            apply()
                                        }

                                        Toast.makeText(context, body.message, Toast.LENGTH_SHORT).show()
                                        onNavigateToDashboard()
                                    } else {
                                        val errMsg = response.errorBody()?.string() ?: "Authentication failed"
                                        Toast.makeText(context, errMsg, Toast.LENGTH_LONG).show()
                                    }
                                } catch (e: Exception) {
                                    Toast.makeText(context, "Network error: ${e.message}", Toast.LENGTH_LONG).show()
                                } finally {
                                    isLoading = false
                                }
                            }
                        }
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        // Mode Switch Link
        Text(
            text = if (isLoginMode) "New to Vaahan? Sign Up" else "Already have an account? Log In",
            color = Color(0xFF4F46E5),
            fontWeight = FontWeight.Bold,
            fontSize = 14.sp,
            textAlign = TextAlign.Center,
            modifier = Modifier
                .clickable { 
                    isLoginMode = !isLoginMode 
                    signupStep = 1
                }
                .padding(Spacing.sm)
        )
    }
}