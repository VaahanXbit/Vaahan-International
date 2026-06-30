// backend/src/models/Benchmark.js

const mongoose = require('mongoose');

const BenchmarkSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  label: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    enum: ['engine', 'performance', 'dimensions', 'safety', 'pricing', 
           'drivingExperience', 'suspension', 'comfort', 'features', 
           'valueForMoney', 'cityDriving', 'highwayDriving', 'family', 
           'maintenance'],
    required: true,
  },
  subCategory: {
    type: String,
    enum: ['torque', 'power', 'mileage', 'displacement', 'bootSpace', 
           'groundClearance', 'turningRadius', 'fuelTank', 'price', 
           'safety', 'airbags', 'adas', 'ncapRating', 'braking', 'structuralSafety',
           'enginePowerFactor', 'torqueFactor', 'acceleration', 'highwayPerformance', 'gearboxResponse',
           'steeringFeedback', 'handling', 'stability', 'rideQuality', 'driverConfidence',
           'rideComfort', 'potholeAbsorption', 'highwayStability', 'corneringSupport',
           'seatQuality', 'cabinInsulation', 'acEffectiveness', 'rearSeatComfort', 'rideSmoothness',
           'infotainment', 'connectedCar', 'sunroof', 'ventilatedSeats', 'ambientLighting',
           'priceVsFeatures', 'safetyPackage', 'performanceValue', 'resaleValue', 'overallPackage',
           'steeringResponsiveness', 'turningRadiusFactor', 'visibility', 'easeOfParking', 'trafficManeuverability',
           'highSpeedStability', 'cruiseControl', 'overtakingAbility', 'fuelEfficiencyHighway', 'cabinNoise',
           'rearSeatSpace', 'bootCapacity', 'childSafety', 'easeOfEntry', 'familyFeatures',
           'serviceCost', 'spareParts', 'serviceNetwork', 'reliability', 'warranty'],
    required: true,
  },
  minValue: {
    type: Number,
    required: true,
  },
  maxValue: {
    type: Number,
    required: true,
  },
  unit: {
    type: String,
    required: true,
  },
  isHigherBetter: {
    type: Boolean,
    required: true,
    default: true,
  },
  icon: {
    type: String,
    default: '📊',
  },
  variantFieldPath: {
    type: String,
    required: true,
  },
  isEV: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  explanations: {
    excellent: {
      summary: String,
      details: [String],
    },
    good: {
      summary: String,
      details: [String],
    },
    average: {
      summary: String,
      details: [String],
    },
    needsImprovement: {
      summary: String,
      details: [String],
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

BenchmarkSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Benchmark', BenchmarkSchema);