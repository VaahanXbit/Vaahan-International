package com.vaahan.driver.data.api

import retrofit2.Response
import retrofit2.http.POST
import retrofit2.http.Query
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import com.vaahan.driver.config.AppConfig

data class DriverResponse(
    val status: String,
    val message: String,
    val driver_id: String?,
    val name: String?,
    val phone_number: String?,
    val vehicle_number: String?,
    val vehicle_type: String?,
    val company_name: String?,
    val access_token: String?,
    val refresh_token: String?
)

data class DisconnectResponse(
    val status: String,
    val message: String
)

data class StartTripResponse(
    val status: String,
    val trip_id: String
)

data class EndTripResponse(
    val status: String
)

data class TripDetails(
    val id: String,
    val status: String,
    val final_score: Double,
    val distance_km: Double,
    val duration_minutes: Int,
    val total_events: Int,
    val harsh_brake_count: Int,
    val speeding_count: Int,
    val harsh_corner_count: Int
)

data class GetTripResponse(
    val status: String,
    val trip: TripDetails
)

interface VaahanApi {
    @POST("auth/driver-direct")
    suspend fun authenticateDriver(
        @Query("phone_number") phoneNumber: String,
        @Query("name") name: String? = null,
        @Query("vehicle_number") vehicleNumber: String? = null,
        @Query("vehicle_type") vehicleType: String? = null,
        @Query("is_login") isLogin: Boolean
    ): Response<DriverResponse>

    @POST("auth/verify-driver")
    suspend fun verifyDriver(
        @Query("phone_number") phoneNumber: String,
        @Query("otp") otp: String,
        @Query("name") name: String,
        @Query("vehicle_number") vehicleNumber: String,
        @Query("vehicle_type") vehicleType: String? = null
    ): Response<DriverResponse>

    @POST("auth/disconnect-driver")
    suspend fun disconnectDriver(
        @Query("phone_number") phoneNumber: String
    ): Response<DisconnectResponse>

    @POST("auth/update-driver")
    suspend fun updateDriver(
        @Query("phone_number") phoneNumber: String,
        @Query("name") name: String? = null,
        @Query("vehicle_number") vehicleNumber: String? = null,
        @Query("vehicle_type") vehicleType: String? = null
    ): Response<DriverResponse>

    @POST("trips/start")
    suspend fun startTrip(
        @Query("driver_id") driverId: String,
        @Query("vehicle_id") vehicleId: String? = null
    ): Response<StartTripResponse>

    @POST("trips/{trip_id}/end")
    suspend fun endTrip(
        @retrofit2.http.Path("trip_id") tripId: String,
        @Query("distance_km") distanceKm: Double,
        @Query("duration_minutes") durationMinutes: Int
    ): Response<EndTripResponse>

    @retrofit2.http.GET("trips/{trip_id}")
    suspend fun getTrip(
        @retrofit2.http.Path("trip_id") tripId: String
    ): Response<GetTripResponse>
}

object RetrofitClient {
    val api: VaahanApi by lazy {
        Retrofit.Builder()
            .baseUrl(AppConfig.BASE_URL)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(VaahanApi::class.java)
    }
}
