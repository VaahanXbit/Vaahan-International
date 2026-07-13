import sys
import os
import unittest
from unittest.mock import MagicMock, patch

# Set python path to allow importing app
sys.path.append(os.path.join(os.path.dirname(__file__), "../app"))

# We mock db BEFORE importing car_finder to avoid connection errors if Mongo is not running
mock_db = MagicMock()
sys.modules["db"] = MagicMock()
sys.modules["db.mongodb"] = MagicMock()
sys.modules["db.mongodb"].db = mock_db

# Mock statepricingrules
mock_rules = {
    "stateCode": "DL",
    "state": "Delhi",
    "isActive": True,
    "roadTax": {
        "ev": [{"minPrice": 0, "maxPrice": None, "ratePercent": 0}],
        "cng": [{"minPrice": 0, "maxPrice": None, "ratePercent": 7}],
        "petrolDiesel": [{"minPrice": 0, "maxPrice": None, "ratePercent": 10}]
    },
    "registration": {"flatFee": 5000, "additionalCharges": 1500},
    "insurance": {"comprehensiveRatePercent": 4, "minPremium": 8000},
    "fastag": {"issuanceFee": 100, "minBalance": 200},
    "handlingCharges": 10000,
    "luxuryTax": {"applicable": True, "thresholdPrice": 2000000, "ratePercent": 2},
    "evSubsidy": {"applicable": True, "flatSubsidy": 150000, "maxSubsidy": 150000}
}

# Setup mock database returns
mock_db.__getitem__.return_value = mock_db
mock_db.find_one.return_value = mock_rules

from llm.car_finder import (
    clean_int, clean_float, get_on_road_price, check_hard_filters, 
    calculate_car_score, find_matching_cars, parse_budget_range, MASS_MARKET_BRANDS
)
from fastapi.testclient import TestClient
from main import app

class TestMergedScoring(unittest.TestCase):
    
    def test_on_road_price_ev_vs_petrol(self):
        ev_on_road = get_on_road_price(1000000, "DL", "electric")
        petrol_on_road = get_on_road_price(1000000, "DL", "petrol")
        self.assertLess(ev_on_road, petrol_on_road)
        
    def test_check_hard_filters_automatic(self):
        variants_manual = [
            ({"transmission": "Manual", "driveType": "2WD", "fuelType": "Petrol", "groundClearance": "170", "airbags": 6}, 800000)
        ]
        variants_auto = [
            ({"transmission": "Auto", "driveType": "2WD", "fuelType": "Petrol", "groundClearance": "170", "airbags": 6}, 850000)
        ]
        self.assertFalse(check_hard_filters(variants_manual, ["automatic"]))
        self.assertTrue(check_hard_filters(variants_auto, ["automatic"]))
        
    def test_check_hard_filters_gc(self):
        variants_low = [
            ({"transmission": "Manual", "driveType": "2WD", "fuelType": "Petrol", "groundClearance": "165", "airbags": 6}, 800000)
        ]
        variants_high = [
            ({"transmission": "Manual", "driveType": "2WD", "fuelType": "Petrol", "groundClearance": "190", "airbags": 6}, 800000)
        ]
        self.assertFalse(check_hard_filters(variants_low, ["high_clearance"]))
        self.assertTrue(check_hard_filters(variants_high, ["high_clearance"]))

    def test_check_hard_filters_ev(self):
        variants_petrol = [
            ({"transmission": "Manual", "driveType": "2WD", "fuelType": "Petrol", "groundClearance": "170", "airbags": 6}, 800000)
        ]
        variants_ev = [
            ({"transmission": "Manual", "driveType": "2WD", "fuelType": "Electric", "groundClearance": "170", "airbags": 6}, 800000)
        ]
        self.assertFalse(check_hard_filters(variants_petrol, ["ev"]))
        self.assertTrue(check_hard_filters(variants_ev, ["ev"]))

    def test_check_hard_filters_awd(self):
        variants_2wd = [
            ({"transmission": "Manual", "driveType": "2WD", "fuelType": "Petrol", "groundClearance": "170", "airbags": 6}, 800000)
        ]
        variants_awd = [
            ({"transmission": "Manual", "driveType": "4WD", "fuelType": "Petrol", "groundClearance": "170", "airbags": 6}, 800000)
        ]
        self.assertFalse(check_hard_filters(variants_2wd, ["awd_4wd"]))
        self.assertTrue(check_hard_filters(variants_awd, ["awd_4wd"]))

    def test_check_hard_filters_airbags(self):
        variants_low_safety = [
            ({"transmission": "Manual", "driveType": "2WD", "fuelType": "Petrol", "groundClearance": "170", "airbags": 2}, 800000)
        ]
        variants_high_safety = [
            ({"transmission": "Manual", "driveType": "2WD", "fuelType": "Petrol", "groundClearance": "170", "airbags": 6}, 800000)
        ]
        self.assertFalse(check_hard_filters(variants_low_safety, ["airbags_6"]))
        self.assertTrue(check_hard_filters(variants_high_safety, ["airbags_6"]))
        
    def test_fuel_preference_soft_scoring(self):
        variants = [
            ({"transmission": "Manual", "driveType": "2WD", "fuelType": "Petrol", "groundClearance": "170", "airbags": 6}, 800000)
        ]
        self.assertTrue(check_hard_filters(variants, []))
        
        c = {"brand": "Maruti Suzuki", "matching_variants": variants}
        params = {"min_budget": 0, "max_budget": 1500000, "fuel_pref": "Electric (EV)"}
        score_mismatch = calculate_car_score(c, [], "Smooth", "Delhi", "DL", params, 900000)
        
        params_match = {"min_budget": 0, "max_budget": 1500000, "fuel_pref": "Petrol"}
        score_match = calculate_car_score(c, [], "Smooth", "Delhi", "DL", params_match, 900000)
        
        self.assertLess(score_mismatch, score_match)
        
    def test_score_normalization_bounds(self):
        variants = [
            ({"transmission": "Auto", "driveType": "4WD", "fuelType": "Electric", "groundClearance": "220", "airbags": 6, "seatingCapacity": "7", "category": "SUV", "bootSpace": "400", "turningRadius": "5.0", "hillAssist": True}, 900000)
        ]
        c = {"brand": "Maruti Suzuki", "matching_variants": variants}
        params = {
            "min_budget": 0, 
            "max_budget": 2000000, 
            "life_profile": "adventure",
            "fuel_pref": "Electric",
            "tenure": "7+",
            "resale_importance": "critical",
            "non_negotiables": ["low_service_cost", "resale_value"]
        }
        score = calculate_car_score(c, ["city", "adventure"], "Rough", "Delhi", "DL", params, 900000)
        self.assertLessEqual(score, 100)
        self.assertGreaterEqual(score, 0)
        
    def test_ownership_signals_cap(self):
        variants = [
            ({"transmission": "Manual", "driveType": "2WD", "fuelType": "Petrol", "groundClearance": "170"}, 800000)
        ]
        c = {"brand": "Maruti Suzuki", "matching_variants": variants}
        params = {
            "min_budget": 0,
            "max_budget": 1500000,
            "tenure": "7+",
            "resale_importance": "critical",
            "non_negotiables": ["low_service_cost", "resale_value"]
        }
        score = calculate_car_score(c, [], "Smooth", "Delhi", "DL", params, 900000)
        self.assertLessEqual(score, 100)

    def test_usage_match_limit(self):
        variants = [
            ({"transmission": "Auto", "driveType": "2WD", "fuelType": "Petrol", "groundClearance": "170", "category": "SUV"}, 800000)
        ]
        c = {"brand": "Maruti Suzuki", "matching_variants": variants}
        params = {"min_budget": 0, "max_budget": 1500000}
        score = calculate_car_score(c, ["city", "adventure", "weekend"], "Smooth", "Delhi", "DL", params, 900000)
        self.assertLessEqual(score, 100)

    def test_budget_80l_plus(self):
        min_b, max_b = parse_budget_range("80L+")
        self.assertEqual(min_b, 0)
        self.assertEqual(max_b, 9990000000)

    def test_on_road_price_exclusion(self):
        ex_showroom = 1900000
        on_road = get_on_road_price(ex_showroom, "DL", "Petrol")
        self.assertGreater(on_road, 2000000)
        
        mock_cars = [{
            "id": "60c72b2f9b1d8e001c8e4c11",
            "brand": "Honda",
            "name": "Civic",
            "slug": "honda-civic",
            "image": "civic.jpg",
            "variants": [
                {"name": "ZX", "price": "1900000", "exShowroomPrice": 1900000, "fuelType": "Petrol", "transmission": "Manual"}
            ]
        }]
        
        with patch("llm.car_finder.get_all_cars_data", return_value=mock_cars), \
             patch("llm.car_finder.generate", return_value=""):
            res = find_matching_cars(
                budget="up to 20L",
                seating="5 Seats",
                usage=["city"],
                terrain="Smooth",
                driver="Experienced",
                city="Delhi",
                state="DL"
            )
            self.assertTrue(res.get("noExactMatch", False))

    def test_fastapi_client_integration(self):
        mock_cars = [{
            "id": "60c72b2f9b1d8e001c8e4c11",
            "brand": "Honda",
            "name": "Civic",
            "slug": "honda-civic",
            "image": "civic.jpg",
            "variants": [
                {"name": "ZX", "price": "1000000", "exShowroomPrice": 1000000, "fuelType": "Petrol", "transmission": "Manual"}
            ]
        }]
        
        client = TestClient(app)
        payload = {
            "budget": "up to 15L",
            "seating": "5 Seats",
            "usage": ["city"],
            "terrain": "Smooth",
            "driver": "Experienced",
            "city": "Delhi",
            "state": "DL",
            "lifeProfile": "solo_commuter",
            "tenure": "3-5",
            "fuelPref": "Petrol",
            "resaleImportance": "moderate",
            "monthlyOpexBand": "under 3k",
            "nonNegotiables": ["automatic"]
        }
        
        with patch("llm.car_finder.get_all_cars_data", return_value=mock_cars), \
             patch("llm.car_finder.generate", return_value="[RECOMMENDATION]\nID: 60c72b2f9b1d8e001c8e4c11\nBRAND: Honda\nMODEL: Civic\nFOCUS: City commute\nVERDICT: Great fits.\n[END]"):
            response = client.post("/api/ai-car-finder", json=payload)
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertTrue(data.get("success"))
        
if __name__ == "__main__":
    unittest.main()
