// backend/scripts/seedBenchmarks.js
/*
================================================================================
File Name : seedBenchmarks.js
Author : Tahseen Raza
Created Date : 2026-06-26
Description : Seed benchmark data for car comparison
Company : Vaahan International
Copyright : (c) 2026 Vaahan International. All rights reserved.
================================================================================
*/

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Benchmark = require('../models/Benchmark');

dotenv.config();

const benchmarkData = [
  {
    key: "torque",
    label: "Max Torque",
    category: "engine",
    subCategory: "torque",
    minValue: 100,
    maxValue: 400,
    unit: "Nm",
    isHigherBetter: true,
    icon: "⚡",
    variantFieldPath: "torqueNumeric",
    isEV: false,
    explanations: {
      excellent: {
        summary: "Excellent torque output. Effortless overtaking and highway cruising.",
        details: ["Strong pulling power from low RPMs", "Minimal downshifting required", "Confident highway overtaking"]
      },
      good: {
        summary: "Good torque for daily driving. Reliable performance.",
        details: ["Smooth acceleration in city traffic", "Adequate for highway overtaking", "Good balance of performance and efficiency"]
      },
      average: {
        summary: "Average torque. Gets the job done but lacks excitement.",
        details: ["Requires planning for highway overtakes", "May feel underpowered with full load", "More gear changes required"]
      },
      needsImprovement: {
        summary: "Below average torque. Consider higher power variants.",
        details: ["Struggles with highway overtaking", "Frequent downshifting needed", "Feels strained with passengers"]
      }
    }
  },
  {
    key: "power",
    label: "Max Power",
    category: "engine",
    subCategory: "power",
    minValue: 60,
    maxValue: 200,
    unit: "PS",
    isHigherBetter: true,
    icon: "🏎️",
    variantFieldPath: "powerNumeric",
    isEV: false,
    explanations: {
      excellent: {
        summary: "Powerful engine. Thrilling performance.",
        details: ["Quick acceleration", "High-speed stability", "Confident overtaking"]
      },
      good: {
        summary: "Good power for everyday driving.",
        details: ["Adequate for city and highway", "Balanced performance", "Good drivability"]
      },
      average: {
        summary: "Average power output. Functional but not exciting.",
        details: ["Decent for city use", "May feel underpowered on highways", "Fine for daily commute"]
      },
      needsImprovement: {
        summary: "Low power output. Consider upgrading.",
        details: ["Feels strained at highway speeds", "Overtaking requires planning", "Better suited for city driving"]
      }
    }
  },
  {
    key: "mileage",
    label: "Fuel Efficiency",
    category: "performance",
    subCategory: "mileage",
    minValue: 10,
    maxValue: 30,
    unit: "km/l",
    isHigherBetter: true,
    icon: "⛽",
    variantFieldPath: "mileageNumeric",
    isEV: false,
    explanations: {
      excellent: {
        summary: "Excellent fuel efficiency. Saves money on every trip.",
        details: ["Great for daily commuting", "Low running costs", "Environment friendly"]
      },
      good: {
        summary: "Good fuel economy. Decent savings.",
        details: ["Balanced efficiency", "Decent for city/highway mix", "Competitive in segment"]
      },
      average: {
        summary: "Average efficiency. Typical for this segment.",
        details: ["Acceptable running costs", "Similar to competitors", "Consider driving style"]
      },
      needsImprovement: {
        summary: "Below average efficiency. Higher running costs.",
        details: ["More frequent fuel stops", "Higher monthly running cost", "Consider alternative fuel options"]
      }
    }
  },
  {
    key: "bootSpace",
    label: "Boot Space",
    category: "dimensions",
    subCategory: "bootSpace",
    minValue: 200,
    maxValue: 600,
    unit: "L",
    isHigherBetter: true,
    icon: "🧳",
    variantFieldPath: "specifications.bootSpace",
    isEV: false,
    explanations: {
      excellent: {
        summary: "Spacious boot. Great for families and road trips.",
        details: ["Fits multiple large suitcases", "Perfect for weekend getaways", "Family-friendly cargo space"]
      },
      good: {
        summary: "Good boot capacity. Suitable for most needs.",
        details: ["Fits standard luggage", "Adequate for daily use", "Good for small families"]
      },
      average: {
        summary: "Average boot space. Basic needs covered.",
        details: ["Limited for large items", "Works for daily essentials", "Consider folding seats for more space"]
      },
      needsImprovement: {
        summary: "Limited boot space. May need to fold seats.",
        details: ["Tight for large luggage", "Better for city use", "Limited cargo capacity"]
      }
    }
  },
  {
    key: "groundClearance",
    label: "Ground Clearance",
    category: "dimensions",
    subCategory: "groundClearance",
    minValue: 150,
    maxValue: 220,
    unit: "mm",
    isHigherBetter: true,
    icon: "🛤️",
    variantFieldPath: "specifications.groundClearance",
    isEV: false,
    explanations: {
      excellent: {
        summary: "Excellent ground clearance. Conquer bad roads with ease.",
        details: ["Glides over speed bumps", "Perfect for rural roads", "No scraping on uneven terrain"]
      },
      good: {
        summary: "Good clearance. Handles most road conditions.",
        details: ["Adequate for speed bumps", "Works on rough patches", "Balanced for city and rural"]
      },
      average: {
        summary: "Average clearance. Fine for city roads.",
        details: ["May scrape on steep speed bumps", "Ok for urban driving", "Be careful on rough roads"]
      },
      needsImprovement: {
        summary: "Low clearance. Best for smooth roads only.",
        details: ["Avoid steep speed bumps", "Not for rural roads", "Careful on uneven surfaces"]
      }
    }
  },
  {
    key: "turningRadius",
    label: "Turning Radius",
    category: "dimensions",
    subCategory: "turningRadius",
    minValue: 4.5,
    maxValue: 6.0,
    unit: "m",
    isHigherBetter: false,
    icon: "🔄",
    variantFieldPath: "specifications.turningRadius",
    isEV: false,
    explanations: {
      excellent: {
        summary: "Tight turning radius. Effortless U-turns and parking.",
        details: ["Easy city maneuverability", "Simple parking in tight spots", "Great for narrow lanes"]
      },
      good: {
        summary: "Good turning radius. City-friendly.",
        details: ["Decent U-turns", "Adequate parking ease", "Works in most city conditions"]
      },
      average: {
        summary: "Average turning radius. Typical for this segment.",
        details: ["May need 3-point turns", "Fine for most situations", "Expected in this category"]
      },
      needsImprovement: {
        summary: "Wide turning radius. More effort in city.",
        details: ["Challenging U-turns", "Tight parking is difficult", "Better for highways"]
      }
    }
  },
  {
    key: "price",
    label: "Ex-Showroom Price",
    category: "pricing",
    subCategory: "price",
    minValue: 500000,
    maxValue: 8000000,
    unit: "₹",
    isHigherBetter: false,
    icon: "💰",
    variantFieldPath: "exShowroomPrice",
    isEV: false,
    explanations: {
      excellent: {
        summary: "Excellent value. Great features for the price.",
        details: ["Competitive pricing", "Great value proposition", "Affordable for the segment"]
      },
      good: {
        summary: "Good pricing. Competitive in the segment.",
        details: ["Fairly priced", "Competitive with rivals", "Good value"]
      },
      average: {
        summary: "Average pricing. Nothing special.",
        details: ["On par with competitors", "Expected price range", "Consider offers"]
      },
      needsImprovement: {
        summary: "Premium pricing. Check for value additions.",
        details: ["Higher than rivals", "Check for features", "Consider waiting for offers"]
      }
    }
  }
];

const seedBenchmarks = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected');

    // Clear existing benchmarks
    await Benchmark.deleteMany({});
    console.log('🗑️ Cleared existing benchmarks');

    // Insert new benchmarks
    const result = await Benchmark.insertMany(benchmarkData);
    console.log(`✅ Inserted ${result.length} benchmarks`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding benchmarks:', error);
    process.exit(1);
  }
};

seedBenchmarks();