from database import SessionLocal
from models import Trip, GPSCoordinate, TripEvent
import math
import statistics
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

# ALPHA = 0.8 smoothing factor for low-pass filter
ALPHA = 0.8

def remove_gravity(ax, ay, az, gravity):
    """
    Separates gravity component from linear acceleration.
    Input:  Raw ax, ay, az in m/s²
    Output: Linear ax, ay, az in G (gravity removed, converted)
    """
    gravity[0] = ALPHA * gravity[0] + (1 - ALPHA) * ax
    gravity[1] = ALPHA * gravity[1] + (1 - ALPHA) * ay
    gravity[2] = ALPHA * gravity[2] + (1 - ALPHA) * az

    # Remove gravity and convert m/s² to G
    linear_ax = (ax - gravity[0]) / 9.81
    linear_ay = (ay - gravity[1]) / 9.81
    linear_az = (az - gravity[2]) / 9.81

    return linear_ax, linear_ay, linear_az


def calculate_jerk_values(accel_readings: list, intervals: list) -> list:
    """
    Input:  List of (ax, ay, az) tuples in G (gravity already removed)
            intervals: list of time differences (dt) in seconds
    Output: List of jerk magnitude values in G/s
    """
    jerk_values = []
    for i in range(1, len(accel_readings)):
        ax_prev, ay_prev, az_prev = accel_readings[i - 1]
        ax_curr, ay_curr, az_curr = accel_readings[i]
        dt = intervals[i - 1]

        # Avoid division by zero if timestamps are identical
        if dt <= 0:
            dt = 0.001

        # Rate of change per axis
        jerk_x = (ax_curr - ax_prev) / dt
        jerk_y = (ay_curr - ay_prev) / dt
        jerk_z = (az_curr - az_prev) / dt

        # Combined jerk magnitude
        jerk_magnitude = math.sqrt(jerk_x**2 + jerk_y**2 + jerk_z**2)
        jerk_values.append(jerk_magnitude)

    return jerk_values


def classify_jerk(jerk_magnitude: float) -> str:
    """
    Classify jerk severity based on magnitude in G/s
    """
    if jerk_magnitude < 0.5:    return "normal"
    elif jerk_magnitude < 1.5:  return "moderate"
    elif jerk_magnitude < 3.0:  return "high"
    else:                       return "extreme"


def speed_consistency_score(speed_readings: list) -> float:
    """
    Input:  GPS speed values in km/h
    Output: Score 0 to 100
    """
    if len(speed_readings) < 2:
        return 100

    # Use standard library statistics instead of numpy
    std_dev = statistics.pstdev(speed_readings)

    if std_dev < 10:    return 100
    elif std_dev < 20:  return 95
    elif std_dev < 30:  return 85
    elif std_dev < 40:  return 70
    else:               return 50


def acceleration_smoothness_score(ay_readings: list, total_minutes: float) -> float:
    """
    Input:  Longitudinal G-force (ay) in G
            total_minutes: elapsed time of the trip
    Output: Score 0 to 100
    """
    THRESHOLD = 0.3  # G
    aggressive_count = sum(1 for ay in ay_readings if ay > THRESHOLD)

    if total_minutes <= 0:
        return 100

    events_per_hour = (aggressive_count / total_minutes) * 60

    if events_per_hour < 5:    return 100
    elif events_per_hour < 15: return 90
    elif events_per_hour < 30: return 75
    elif events_per_hour < 50: return 55
    else:                      return 35


def braking_smoothness_score(ay_readings: list, total_minutes: float) -> float:
    """
    Input:  Longitudinal G-force (ay) in G
            total_minutes: elapsed time of the trip
    Output: Score 0 to 100
    """
    THRESHOLD = -0.25  # G
    brake_events = sum(1 for ay in ay_readings if ay < THRESHOLD)

    if total_minutes <= 0:
        return 100

    events_per_hour = (brake_events / total_minutes) * 60

    if events_per_hour < 10:   return 100
    elif events_per_hour < 25: return 90
    elif events_per_hour < 40: return 75
    elif events_per_hour < 60: return 55
    else:                      return 35


def calculate_efficiency_score(
    speed_readings: list,
    ay_readings: list,
    total_minutes: float
) -> float:
    """
    Combines all three inputs with weighting.
    """
    speed_score = speed_consistency_score(speed_readings)
    accel_score = acceleration_smoothness_score(ay_readings, total_minutes)
    brake_score = braking_smoothness_score(ay_readings, total_minutes)
    
    return round(
        (speed_score * 0.40) +
        (accel_score * 0.30) +
        (brake_score * 0.30),
        2
    )


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the great-circle distance between two points in kilometers"""
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


def calculate_trip_scores_task(trip_id: str):
    """
    Async background task to calculate trip score, jerk events, and efficiency metrics
    """
    logger.info(f"⚙️ Background task started: calculating scores for Trip ID {trip_id}")
    session = SessionLocal()
    
    try:
        # Fetch the completed Trip record
        trip = session.query(Trip).filter(Trip.id == trip_id).first()
        if not trip:
            logger.error(f"Trip {trip_id} not found in database. Celery task aborted.")
            return False

        # Retrieve all GPSCoordinate telemetry points for the trip in chronological order
        coords = session.query(GPSCoordinate).filter(
            GPSCoordinate.trip_id == trip_id
        ).order_by(GPSCoordinate.timestamp.asc()).all()

        # Filter out invalid placeholder coordinates (0.0, 0.0) from calculations
        coords = [c for c in coords if float(c.latitude) != 0.0 or float(c.longitude) != 0.0]

        if not coords:
            logger.warning(f"No valid coordinates found for Trip {trip_id}. Cannot calculate scores.")
            # Set default scores
            trip.final_score = 100.0
            session.commit()
            return True

        # Lists for storing metric readings
        speed_readings = []
        accel_readings_g = []
        ay_readings_g = []
        intervals = []
        
        # Localized gravity filter state to prevent multithread concurrency bugs
        gravity = None

        # Parse coordinates list to build reading series
        for i in range(len(coords)):
            c = coords[i]
            
            # 1. Speeds consistency series
            speed_readings.append(float(c.speed_kmh or 0.0))

            # 2. Convert database Gs back to m/s² so the user's remove_gravity math works perfectly
            ax_raw_ms2 = float(c.accel_x or 0.0) * 9.81
            ay_raw_ms2 = float(c.accel_y or 0.0) * 9.81
            az_raw_ms2 = float(c.accel_z or 0.0) * 9.81

            # 3. Initialize gravity filter state on first reading to prevent startup settling artifacts
            if gravity is None:
                gravity = [ax_raw_ms2, ay_raw_ms2, az_raw_ms2]

            # 4. Apply gravity removal filter (outputs G values)
            lax, lay, laz = remove_gravity(ax_raw_ms2, ay_raw_ms2, az_raw_ms2, gravity)
            accel_readings_g.append((lax, lay, laz))
            ay_readings_g.append(lay)

            # 4. Compute intervals (dt) dynamically
            if i > 0:
                dt = (coords[i].timestamp - coords[i - 1].timestamp).total_seconds()
                intervals.append(dt)

        # Compute elapsed trip duration in minutes
        if len(coords) > 1:
            total_minutes = (coords[-1].timestamp - coords[0].timestamp).total_seconds() / 60.0
        else:
            total_minutes = 0.0

        # Calculate actual total distance dynamically using Haversine formula
        total_distance_km = 0.0
        for i in range(1, len(coords)):
            total_distance_km += haversine_distance(
                float(coords[i-1].latitude), float(coords[i-1].longitude),
                float(coords[i].latitude), float(coords[i].longitude)
            )

        # Calculate jerk values and search for extreme jerk events
        jerk_values = calculate_jerk_values(accel_readings_g, intervals)
        
        extreme_jerk_count = 0
        jerk_score_impact = 0
        
        for idx, jerk in enumerate(jerk_values):
            classification = classify_jerk(jerk)
            if classification == "moderate":
                jerk_score_impact += 1
            elif classification == "high":
                jerk_score_impact += 2
            elif classification == "extreme":
                extreme_jerk_count += 1
                
                # Flag as extreme jerk event in trip_events table
                corresponding_coord = coords[idx + 1]
                trip_event = TripEvent(
                    trip_id=trip.id,
                    driver_id=trip.driver_id,
                    event_type="extreme_jerk",
                    severity=min(jerk / 5.0, 1.0), # scale severity to 0-1
                    latitude=corresponding_coord.latitude,
                    longitude=corresponding_coord.longitude,
                    event_metadata={
                        "jerk_magnitude_g_s": jerk,
                        "accel_x": accel_readings_g[idx + 1][0],
                        "accel_y": accel_readings_g[idx + 1][1],
                        "accel_z": accel_readings_g[idx + 1][2]
                    },
                    created_at=corresponding_coord.timestamp
                )
                session.add(trip_event)

        # Calculate efficiency score
        efficiency_score = calculate_efficiency_score(speed_readings, ay_readings_g, total_minutes)

        # Penalize efficiency score based on moderate/high jerk impact
        final_trip_score = max(0.0, float(efficiency_score) - jerk_score_impact)

        # Count all safety events recorded during the trip
        events_list = session.query(TripEvent).filter(TripEvent.trip_id == trip_id).all()
        harsh_brake = sum(1 for e in events_list if e.event_type == "harsh_brake")
        harsh_corner = sum(1 for e in events_list if e.event_type == "harsh_corner")
        speeding = sum(1 for e in events_list if e.event_type == "speeding")
        harsh_accel = sum(1 for e in events_list if e.event_type == "harsh_accel")
        extreme_jerk = sum(1 for e in events_list if e.event_type == "extreme_jerk")

        # Commit final trip statistics to DB
        trip.final_score = round(final_trip_score, 2)
        trip.harsh_brake_count = harsh_brake
        trip.harsh_corner_count = harsh_corner
        trip.speeding_count = speeding
        trip.total_events = harsh_brake + harsh_corner + speeding + harsh_accel + extreme_jerk
        trip.notes = f"Scored asynchronously via Celery on {datetime.utcnow().isoformat()}"
        
        # Self-healing: if the client sent 0 for distance/duration, update with actual values from logged coordinates
        if not trip.distance_km or trip.distance_km == 0.0:
            trip.distance_km = round(total_distance_km, 2)
        if not trip.duration_minutes or trip.duration_minutes == 0:
            trip.duration_minutes = max(1, int(round(total_minutes)))
            
        session.commit()
        logger.info(f"🏆 Background task finished: Trip {trip_id} updated with score {trip.final_score}, distance {trip.distance_km} km, duration {trip.duration_minutes} min")
        return True

    except Exception as e:
        session.rollback()
        logger.error(f"❌ Error executing Celery scoring task: {str(e)}")
        return False
    finally:
        session.close()
