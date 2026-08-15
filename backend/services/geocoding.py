import time
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

    # 2. Global Rate Limiter: Max 1 request per second globally
    global_elapsed = now - last_global_api_call_time
    if global_elapsed < 1.0:
        # If we have a cached value for this trip, return it immediately to avoid stalling telemetry
        if state and state["last_name"]:
            logger.debug(f"Global limit hit. Returning cached name for trip {trip_id}: {state['last_name']}")
            return state["last_name"]
        
        # If no cached value (e.g. first coordinate of a trip), pause execution to satisfy rate limit
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
    
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            response = await client.get(url, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
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
                # 3. Add city/town and postal code
                for key in ["city", "town", "village", "postcode"]:
                    val = address.get(key)
                    if val and val not in parts:
                        parts.append(val)
                
                # Fallback to display_name snippet if address keys are missing
                if not parts:
                    display_name = data.get("display_name", "")
                    if display_name:
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
                logger.warning(f"Nominatim returned non-200 status code: {response.status_code}")
    except Exception as e:
        logger.warning(f"Error calling Nominatim reverse geocode for {lat}, {lng}: {str(e)}")
        
    # Return previous cached location on any failure/timeout
    if state and state["last_name"]:
        return state["last_name"]
    return "Locating..."
