package com.vaahan.driver.config

object AppConfig {
    // TODO: Comment/uncomment the block below based on your active build target (Local vs Production Render)

    // --- TARGET: LOCAL EMULATOR TESTING ---
    // const val BASE_URL = "http://10.0.2.2:8001/api/v1/"
    // const val WS_URL = "ws://10.0.2.2:8001/api/v1/auth/ws/trip/"

    // --- TARGET: PRODUCTION RENDER SERVER (Real Phone APK) ---
    const val BASE_URL = "https://vaahan-international-1-yro3.onrender.com/api/v1/"
    const val WS_URL = "wss://vaahan-international-1-yro3.onrender.com/api/v1/auth/ws/trip/"
}
