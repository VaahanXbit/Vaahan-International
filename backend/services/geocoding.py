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

async def _query_nominatim(lat: float, lng: float) -> Optional[str]:
    """Helper to query Nominatim directly with rate limiting and retry protection"""
    global last_global_api_call_time
    now = time.time()
    
    # Global Rate Limiter: Max 1 request per second globally
    global_elapsed = now - last_global_api_call_time
    if global_elapsed < 1.0:
        wait_time = 1.0 - global_elapsed
        logger.debug(f"Global limit hit. Sleeping {wait_time:.2f}s before Nominatim request")
        await asyncio.sleep(wait_time)
        now = time.time()

    last_global_api_call_time = now
    url = f"https://nominatim.openstreetmap.org/reverse?lat={lat}&lon={lng}&format=json"
    headers = {
        "User-Agent": "VaahanFleetApp/1.0 (contact: info@vaahan.com)"
    }
    
    try:
        logger.info(f"🛰️ Calling public Nominatim reverse geocoding API for coordinates: ({lat}, {lng})")
        async with httpx.AsyncClient(timeout=6.0) as client:
            response = await client.get(url, headers=headers)
            if response.status_code == 200:
                data = response.json()
                address = data.get("address", {})
                
                parts = []
                for key in ["building", "amenity", "house_number", "industrial", "office"]:
                    val = address.get(key)
                    if val and val not in parts:
                        parts.append(val)
                for key in ["road", "neighbourhood", "suburb", "city_district"]:
                    val = address.get(key)
                    if val and val not in parts:
                        parts.append(val)
                for key in ["city", "town", "village", "county", "state", "postcode"]:
                    val = address.get(key)
                    if val and val not in parts:
                        parts.append(val)
                
                has_geo = any(k in address for k in ["building", "amenity", "house_number", "road", "neighbourhood", "suburb", "city_district", "city", "town", "village", "county"])
                if len(parts) < 2 or not has_geo:
                    display_name = data.get("display_name", "")
                    if display_name:
                        parts = [p.strip() for p in display_name.split(",")[:4]]
                
                return ", ".join(parts) if parts else "Locating..."
            else:
                logger.warning(f"Nominatim returned non-200 status code: {response.status_code}")
    except Exception as e:
        logger.warning(f"Error querying Nominatim fallback for {lat}, {lng}: {str(e)}", exc_info=True)
    return None

async def reverse_geocode(lat: float, lng: float, trip_id: str) -> Optional[str]:
    """
    Perform reverse geocoding for coordinates to a readable address.
    Queries Geoapify if key exists, with automatic fallback to OpenStreetMap Nominatim.
    """
    now = time.time()
    state = trip_geocode_state.get(trip_id)
    
    # 1. Throttling check: Only query API if > 30s passed AND moved > ~200m
    if state:
        time_elapsed = now - state["last_time"]
        lat_diff = lat - state["last_lat"]
        lng_diff = lng - state["last_lng"]
        dist_sq = lat_diff * lat_diff + lng_diff * lng_diff
        
        if time_elapsed < 30.0 and dist_sq < (0.0018 * 0.0018):
            logger.debug(f"Geocoding throttled for trip {trip_id}. Returning cached: {state['last_name']}")
            return state["last_name"]

    geoapify_key = os.getenv("GEOAPIFY_API_KEY")
    location_name = None

    if geoapify_key:
        url = f"https://api.geoapify.com/v1/geocode/reverse?lat={lat}&lon={lng}&apiKey={geoapify_key}"
        try:
            logger.info(f"🛰️ Calling Geoapify reverse geocoding API for coordinates: ({lat}, {lng})")
            async with httpx.AsyncClient(timeout=6.0) as client:
                response = await client.get(url)
                if response.status_code == 200:
                    data = response.json()
                    if "features" in data and len(data["features"]) > 0:
                        prop = data["features"][0].get("properties", {})
                        formatted = prop.get("formatted", "")
                        if formatted:
                            parts = [p.strip() for p in formatted.split(",") if p.strip()]
                            if parts and parts[-1].lower() in ["india", "in"]:
                                parts.pop()
                            parts = parts[:4]
                            location_name = ", ".join(parts)
                else:
                    logger.warning(f"Geoapify returned non-200 status code: {response.status_code}")
        except Exception as e:
            logger.warning(f"Geoapify failed for {lat}, {lng}: {str(e)}. Falling back to Nominatim...", exc_info=True)

    # 2. Fall back to Nominatim if Geoapify is not configured or failed
    if not location_name:
        location_name = await _query_nominatim(lat, lng)

    # 3. Update cache and return
    if location_name and location_name != "Locating...":
        trip_geocode_state[trip_id] = {
            "last_time": now,
            "last_lat": lat,
            "last_lng": lng,
            "last_name": location_name
        }
        return location_name
        
    # Return previous cached location on complete failure
    if state and state["last_name"]:
        return state["last_name"]
    return "Locating..."
