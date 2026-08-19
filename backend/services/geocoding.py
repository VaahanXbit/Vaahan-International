import time
import os
import httpx
import logging
import asyncio
from typing import Optional

logger = logging.getLogger(__name__)

# Cache dictionary to store per-trip geolocation state
# Structure: { trip_id: { "last_time": float, "last_lat": float, "last_lng": float, "last_name": str } }
trip_geocode_state = {}

# Global variable that tracks the timestamp of the last Nominatim API call across the entire app
last_global_api_call_time = 0.0

async def reverse_geocode(lat: float, lng: float, trip_id: str) -> Optional[str]:
    """
    Perform reverse geocoding for coordinates to a readable address using OpenStreetMap Nominatim.
    Implements per-trip cache-throttling and global 1s rate-limiting.
    """
    global last_global_api_call_time
    now = time.time()
    
    state = trip_geocode_state.get(trip_id)
    
    # 1. Throttling check: Only query Nominatim if > 30s passed AND moved > ~200m
    if state:
        time_elapsed = now - state["last_time"]
        
        # Simple bounding box distance check: 0.0018 degrees is roughly 200 meters
        lat_diff = lat - state["last_lat"]
        lng_diff = lng - state["last_lng"]
        dist_sq = lat_diff * lat_diff + lng_diff * lng_diff
        
        if time_elapsed < 30.0 and dist_sq < (0.0018 * 0.0018):
            logger.debug(f"Geocoding throttled for trip {trip_id}. Returning cached: {state['last_name']}")
            return state["last_name"]

    geoapify_key = os.getenv("GEOAPIFY_API_KEY")

    if not geoapify_key:
        # 2. Global Rate Limiter (Only needed for free public Nominatim): Max 1 request per second globally
        global_elapsed = now - last_global_api_call_time
        if global_elapsed < 1.0:
            # If we have a cached value for this trip, return it immediately to avoid stalling telemetry
            if state and state["last_name"]:
                logger.debug(f"Global limit hit. Returning cached name for trip {trip_id}: {state['last_name']}")
                return state["last_name"]
            
            # If no cached value, pause execution to satisfy rate limit
            wait_time = 1.0 - global_elapsed
            logger.debug(f"Global limit hit. Sleeping {wait_time:.2f}s before Nominatim request")
            await asyncio.sleep(wait_time)
            now = time.time()

        # Update global API timestamp
        last_global_api_call_time = now
        url = f"https://nominatim.openstreetmap.org/reverse?lat={lat}&lon={lng}&format=json"
        headers = {
            "User-Agent": "VaahanFleetApp/1.0 (contact: info@vaahan.com)"
        }
    else:
        # Query Geoapify (no global 1s throttling required)
        url = f"https://api.geoapify.com/v1/geocode/reverse?lat={lat}&lon={lng}&apiKey={geoapify_key}"
        headers = None
        
    try:
        if geoapify_key:
            logger.info(f"🛰️ Calling Geoapify reverse geocoding API for coordinates: ({lat}, {lng})")
        else:
            logger.info(f"🛰️ Calling public Nominatim reverse geocoding API for coordinates: ({lat}, {lng})")

        async with httpx.AsyncClient(timeout=3.0) as client:
            response = await client.get(url, headers=headers) if headers else await client.get(url)
            
            if response.status_code == 200:
                data = response.json()
                
                if geoapify_key:
                    # Parse Geoapify structure: features[0].properties
                    if "features" in data and len(data["features"]) > 0:
                        prop = data["features"][0].get("properties", {})
                        formatted = prop.get("formatted", "")
                        if formatted:
                            parts = [p.strip() for p in formatted.split(",") if p.strip()]
                            # Remove trailing country to keep it short for UI card displays
                            if parts and parts[-1].lower() in ["india", "in"]:
                                parts.pop()
                            parts = parts[:4]
                            location_name = ", ".join(parts)
                        else:
                            location_name = "Locating..."
                    else:
                        location_name = "Locating..."
                else:
                    # Parse standard Nominatim structure
                    address = data.get("address", {})
                    
                    # Construct detailed, readable display name: building/amenity + house_number + road + suburb + city + postcode
                    parts = []
                    # 1. Add specific landmarks / buildings / house numbers first
                    for key in ["building", "amenity", "house_number", "industrial", "office"]:
                        val = address.get(key)
                        if val and val not in parts:
                            parts.append(val)
                    # 2. Add road and suburb/neighborhood
                    for key in ["road", "neighbourhood", "suburb", "city_district"]:
                        val = address.get(key)
                        if val and val not in parts:
                            parts.append(val)
                    # 3. Add city/town/county/state and postal code
                    for key in ["city", "town", "village", "county", "state", "postcode"]:
                        val = address.get(key)
                        if val and val not in parts:
                            parts.append(val)
                    
                    # Check if the generated parts list has too little detail (e.g., only postcode, or only 1 part)
                    has_geo = any(k in address for k in ["building", "amenity", "house_number", "road", "neighbourhood", "suburb", "city_district", "city", "town", "village", "county"])
                    if len(parts) < 2 or not has_geo:
                        display_name = data.get("display_name", "")
                        if display_name:
                            # Extract first 4 segments of the formatted display name
                            parts = [p.strip() for p in display_name.split(",")[:4]]
                    
                    location_name = ", ".join(parts) if parts else "Locating..."
                
                # Update trip cache
                trip_geocode_state[trip_id] = {
                    "last_time": now,
                    "last_lat": lat,
                    "last_lng": lng,
                    "last_name": location_name
                }
                return location_name
            else:
                logger.warning(f"Geocoding service returned non-200 status code: {response.status_code}")
    except Exception as e:
        logger.warning(f"Error calling geocoding service for {lat}, {lng}: {str(e)}", exc_info=True)
        
    # Return previous cached location on any failure/timeout
    if state and state["last_name"]:
        return state["last_name"]
    return "Locating..."
