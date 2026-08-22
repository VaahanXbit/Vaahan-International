package com.vaahan.driver.ui.screens.profile

import android.content.Context
import android.widget.Toast
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Apps
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.ExitToApp
import androidx.compose.material.icons.filled.LinkOff
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material.icons.filled.DirectionsCar
import androidx.compose.material.icons.filled.ArrowDropDown
import androidx.compose.material3.*
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
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.vaahan.driver.data.api.RetrofitClient
import com.vaahan.driver.ui.theme.*
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProfileScreen(onNavigateBack: () -> Unit, onJoinFleet: () -> Unit, onLogout: () -> Unit) {
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()
    val sharedPref = remember { context.getSharedPreferences("vaahan_prefs", Context.MODE_PRIVATE) }
    
    var driverName by remember { mutableStateOf(sharedPref.getString("driver_name", "Driver Name") ?: "Driver Name") }
    val phoneNumber = remember { sharedPref.getString("phone_number", "") ?: "" }
    val initialCompanyName = remember { sharedPref.getString("company_name", "Independent Drivers") ?: "Independent Drivers" }
    var vehicleNumber by remember { mutableStateOf(sharedPref.getString("vehicle_number", "") ?: "") }
    var vehicleType by remember { mutableStateOf(sharedPref.getString("vehicle_type", "") ?: "") }
    
    var currentCompanyName by remember { mutableStateOf(initialCompanyName) }
    var isLoading by remember { mutableStateOf(false) }

    val vehicleOptions = remember {
        listOf("Bike", "Auto", "Car", "Van", "Bus", "Mini Truck (SCV)", "Pickup Truck (LCV)", "Truck (HCV)")
    }

    var showEditDialog by remember { mutableStateOf(false) }
    var editName by remember { mutableStateOf("") }
    var editVehicleNumber by remember { mutableStateOf("") }
    var editVehicleType by remember { mutableStateOf("") }
    var showVehicleTypeDropdown by remember { mutableStateOf(false) }

    val isConnected = currentCompanyName != "Independent Drivers"

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = "FleetSync",
                        fontWeight = FontWeight.ExtraBold,
                        fontSize = 20.sp,
                        color = TextPrimary
                    )
                },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "Back",
                            tint = TextPrimary
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.White)
            )
        }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(Background)
                .padding(innerPadding)
                .padding(Spacing.lg),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Spacer(modifier = Modifier.height(16.dp))

            // Screen Header "Profile"
            Text(
                text = "Profile",
                fontWeight = FontWeight.Bold,
                fontSize = 22.sp,
                color = TextPrimary,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = Spacing.md),
                textAlign = TextAlign.Start
            )

            // Main Info Card
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                shape = RoundedCornerShape(20.dp),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(Spacing.lg),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Spacer(modifier = Modifier.height(8.dp))

                    // Name Display
                    Text(
                        text = driverName,
                        fontWeight = FontWeight.ExtraBold,
                        fontSize = 20.sp,
                        color = TextPrimary,
                        textAlign = TextAlign.Center
                    )

                    Spacer(modifier = Modifier.height(8.dp))

                    // Phone Row
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.Phone,
                            contentDescription = "Phone",
                            tint = TextSecondary,
                            modifier = Modifier.size(16.dp)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = if (phoneNumber.startsWith("+91")) phoneNumber else "+91 $phoneNumber",
                            color = TextSecondary,
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Medium
                        )
                    }

                    if (vehicleNumber.isNotEmpty()) {
                        Spacer(modifier = Modifier.height(8.dp))
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.DirectionsCar,
                                contentDescription = "Vehicle",
                                tint = TextSecondary,
                                modifier = Modifier.size(16.dp)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = if (vehicleType.isNotEmpty()) "$vehicleType • $vehicleNumber" else vehicleNumber,
                                color = TextSecondary,
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Medium
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(28.dp))

                    // Connection status (Dynamic text)
                    if (isConnected) {
                        Text(
                            text = "Connected to $currentCompanyName",
                            color = Color(0xFF15803D), // Green text
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold
                        )
                    } else {
                        Text(
                            text = "Not connected to any fleet.",
                            color = TextSecondary,
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Normal
                        )
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    // 1. JOIN FLEET / DISCONNECT FROM FLEET (Toggle Button Layout)
                    if (isConnected) {
                        if (isLoading) {
                            CircularProgressIndicator(color = Color(0xFFDC2626))
                        } else {
                            // Disconnect Button (White container, Red outline, Red text)
                            OutlinedButton(
                                onClick = {
                                    isLoading = true
                                    coroutineScope.launch {
                                        try {
                                            val response = RetrofitClient.api.disconnectDriver(phoneNumber)
                                            if (response.isSuccessful) {
                                                sharedPref.edit().putString("company_name", "Independent Drivers").apply()
                                                currentCompanyName = "Independent Drivers"
                                                Toast.makeText(context, "Disconnected from fleet successfully", Toast.LENGTH_SHORT).show()
                                                onNavigateBack()
                                            } else {
                                                Toast.makeText(context, "Failed to disconnect from fleet", Toast.LENGTH_LONG).show()
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
                                    .height(50.dp),
                                border = BorderStroke(1.dp, Color(0xFFDC2626)),
                                shape = RoundedCornerShape(10.dp),
                                colors = ButtonDefaults.outlinedButtonColors(contentColor = Color(0xFFDC2626))
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.Center
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.LinkOff,
                                        contentDescription = null,
                                        tint = Color(0xFFDC2626),
                                        modifier = Modifier.size(18.dp)
                                    )
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text(
                                        text = "Disconnect from $currentCompanyName",
                                        color = Color(0xFFDC2626),
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 14.sp
                                    )
                                }
                            }
                        }
                    } else {
                        // JOIN FLEET Button (Green background) - Only shown when disconnected
                        Button(
                            onClick = {
                                onJoinFleet()
                            },
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(50.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF006E44)),
                            shape = RoundedCornerShape(10.dp)
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.Center
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Apps,
                                    contentDescription = null,
                                    modifier = Modifier.size(18.dp)
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    text = "JOIN FLEET",
                                    color = Color.White,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 14.sp
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    // 2. EDIT PROFILE Button (Light grey background)
                    Button(
                        onClick = {
                            editName = driverName
                            editVehicleNumber = vehicleNumber
                            editVehicleType = vehicleType
                            showEditDialog = true
                        },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(50.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFE5E7EB)),
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.Edit,
                                contentDescription = null,
                                tint = Color(0xFF374151),
                                modifier = Modifier.size(18.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "EDIT PROFILE",
                                color = Color(0xFF374151),
                                fontWeight = FontWeight.Bold,
                                fontSize = 14.sp
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    // 3. LOGOUT Button (White background, Red border, Red text)
                    OutlinedButton(
                        onClick = {
                            sharedPref.edit().clear().apply()
                            onLogout()
                        },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(50.dp),
                        border = BorderStroke(1.dp, Color(0xFFDC2626)),
                        shape = RoundedCornerShape(10.dp),
                        colors = ButtonDefaults.outlinedButtonColors(contentColor = Color(0xFFDC2626))
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.ExitToApp,
                                contentDescription = null,
                                tint = Color(0xFFDC2626),
                                modifier = Modifier.size(18.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "LOGOUT",
                                color = Color(0xFFDC2626),
                                fontWeight = FontWeight.Bold,
                                fontSize = 14.sp
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(8.dp))
                }
            }
        }
    }

    if (showEditDialog) {
        AlertDialog(
            onDismissRequest = { showEditDialog = false },
            title = { Text("Edit Profile", fontWeight = FontWeight.Bold) },
            text = {
                Column(
                    modifier = Modifier.fillMaxWidth(),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    // Name Field
                    OutlinedTextField(
                        value = editName,
                        onValueChange = { editName = it },
                        label = { Text("Name") },
                        modifier = Modifier.fillMaxWidth()
                    )

                    // Phone Field (Read-only / Disabled)
                    OutlinedTextField(
                        value = if (phoneNumber.startsWith("+91")) phoneNumber else "+91 $phoneNumber",
                        onValueChange = {},
                        label = { Text("Phone Number (Cannot be changed)") },
                        enabled = false,
                        modifier = Modifier.fillMaxWidth()
                    )

                    // Vehicle Number Field
                    OutlinedTextField(
                        value = editVehicleNumber,
                        onValueChange = { editVehicleNumber = it.uppercase() },
                        label = { Text("Vehicle Number") },
                        modifier = Modifier.fillMaxWidth()
                    )                    // Vehicle Type Dropdown Field
                    Box(modifier = Modifier.fillMaxWidth()) {
                        OutlinedTextField(
                            value = editVehicleType,
                            onValueChange = {},
                            label = { Text("Vehicle Type") },
                            readOnly = true,
                            trailingIcon = {
                                IconButton(onClick = { showVehicleTypeDropdown = true }) {
                                    Icon(
                                        imageVector = Icons.Default.ArrowDropDown,
                                        contentDescription = "Select Vehicle Type"
                                    )
                                }
                            },
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { showVehicleTypeDropdown = true }
                        )

                        DropdownMenu(
                            expanded = showVehicleTypeDropdown,
                            onDismissRequest = { showVehicleTypeDropdown = false },
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            vehicleOptions.forEach { option ->
                                DropdownMenuItem(
                                    text = { Text(option) },
                                    onClick = {
                                        editVehicleType = option
                                        showVehicleTypeDropdown = false
                                    }
                                )
                            }
                        }
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        val cleanedPlate = editVehicleNumber.trim().uppercase().replace(" ", "").replace("-", "")
                        val regex = Regex("^[A-Z]{2}[0-9]{2}[A-Z]{1,3}[0-9]{4}$")
                        if (editName.trim().isEmpty()) {
                            Toast.makeText(context, "Name cannot be empty", Toast.LENGTH_SHORT).show()
                            return@Button
                        }
                        if (cleanedPlate.isEmpty()) {
                            Toast.makeText(context, "Vehicle number cannot be empty", Toast.LENGTH_SHORT).show()
                            return@Button
                        }
                        if (!regex.matches(cleanedPlate)) {
                            Toast.makeText(context, "Invalid vehicle number format (e.g. GJ01AB1234)", Toast.LENGTH_LONG).show()
                            return@Button
                        }

                        // Detailed RTO validation
                        val stateCode = cleanedPlate.substring(0, 2)
                        val rtoNum = cleanedPlate.substring(2, 4).toIntOrNull()
                        val stateMaxRto = mapOf(
                            "AN" to 1, "AP" to 40, "AR" to 20, "AS" to 34, "BR" to 57, "CG" to 30,
                            "CH" to 4, "DD" to 3, "DN" to 9, "DL" to 13, "GA" to 12, "GJ" to 38,
                            "HR" to 99, "HP" to 97, "JK" to 22, "JH" to 24, "KA" to 72, "KL" to 99,
                            "LA" to 2, "LD" to 9, "MP" to 74, "MH" to 55, "MN" to 8, "ML" to 14,
                            "MZ" to 8, "NL" to 8, "OD" to 35, "OR" to 35, "PY" to 5, "PB" to 99,
                            "RJ" to 58, "SK" to 8, "TN" to 99, "TS" to 36, "TR" to 8, "UP" to 99,
                            "UK" to 20, "UA" to 20, "WB" to 99
                        )
                        if (!stateMaxRto.containsKey(stateCode)) {
                            Toast.makeText(context, "Invalid Indian state code: $stateCode", Toast.LENGTH_LONG).show()
                            return@Button
                        }
                        val maxRto = stateMaxRto[stateCode] ?: 0
                        if (rtoNum == null || rtoNum < 1 || rtoNum > maxRto) {
                            val formattedMax = "%02d".format(maxRto)
                            Toast.makeText(
                                context,
                                "Invalid district code for state $stateCode. Must be between 01 and $formattedMax",
                                Toast.LENGTH_LONG
                            ).show()
                            return@Button
                        }

                        if (editVehicleType.trim().isEmpty() || !vehicleOptions.contains(editVehicleType)) {
                            Toast.makeText(context, "Please select a valid vehicle type", Toast.LENGTH_SHORT).show()
                            return@Button
                        }

                        isLoading = true
                        coroutineScope.launch {
                            try {
                                val response = RetrofitClient.api.updateDriver(
                                    phoneNumber = phoneNumber,
                                    name = editName.trim(),
                                    vehicleNumber = cleanedPlate,
                                    vehicleType = editVehicleType.trim()
                                )
                                if (response.isSuccessful && response.body() != null) {
                                    val body = response.body()!!
                                    sharedPref.edit().apply {
                                        putString("driver_name", body.name)
                                        putString("vehicle_number", body.vehicle_number)
                                        putString("vehicle_type", body.vehicle_type)
                                        apply()
                                    }
                                    driverName = body.name ?: ""
                                    vehicleNumber = body.vehicle_number ?: ""
                                    vehicleType = body.vehicle_type ?: ""
                                    showEditDialog = false
                                    Toast.makeText(context, "Profile updated successfully", Toast.LENGTH_SHORT).show()
                                } else {
                                    val errMsg = response.errorBody()?.string() ?: "Failed to update profile"
                                    Toast.makeText(context, errMsg, Toast.LENGTH_LONG).show()
                                }
                            } catch (e: Exception) {
                                Toast.makeText(context, "Network error: ${e.message}", Toast.LENGTH_LONG).show()
                            } finally {
                                isLoading = false
                            }
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = PrimaryGreen)
                ) {
                    Text("Save", color = Color.White)
                }
            },
            dismissButton = {
                TextButton(onClick = { showEditDialog = false }) {
                    Text("Cancel", color = TextSecondary)
                }
            }
        )
    }
}
