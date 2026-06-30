// backend/src/services/ratingService.js

class RatingService {
  
  calculateRating(value, benchmark) {
    if (value === null || value === undefined || value === 'N/A' || value === '') {
      return {
        rating: null,
        value: value,
        label: benchmark.label,
        unit: benchmark.unit,
        icon: benchmark.icon,
        explanation: null,
        color: null,
        isHigherBetter: benchmark.isHigherBetter,
      };
    }

    const numericValue = this.parseNumericValue(value);
    if (numericValue === null) {
      return {
        rating: null,
        value: value,
        label: benchmark.label,
        unit: benchmark.unit,
        icon: benchmark.icon,
        explanation: null,
        color: null,
        isHigherBetter: benchmark.isHigherBetter,
      };
    }

    const { minValue, maxValue, isHigherBetter } = benchmark;
    const clampedValue = Math.min(Math.max(numericValue, minValue), maxValue);
    
    let rating;
    if (isHigherBetter) {
      rating = ((clampedValue - minValue) / (maxValue - minValue)) * 9 + 1;
    } else {
      rating = ((maxValue - clampedValue) / (maxValue - minValue)) * 9 + 1;
    }
    
    rating = Math.round(rating * 10) / 10;
    const color = this.getColorForRating(rating);
    const explanation = this.getExplanationForRating(rating, benchmark);
    
    return {
      rating,
      value: numericValue,
      displayValue: `${numericValue} ${benchmark.unit}`,
      label: benchmark.label,
      unit: benchmark.unit,
      icon: benchmark.icon,
      color,
      explanation,
      isHigherBetter,
    };
  }
  
  calculateMultipleRatings(data, benchmarks) {
    const results = {};
    benchmarks.forEach(benchmark => {
      const fieldPath = benchmark.variantFieldPath;
      const value = this.getValueByPath(data, fieldPath);
      
      console.log(`📊 Calculating ${benchmark.key}:`, {
        fieldPath,
        value,
        data: data,
      });
      
      results[benchmark.key] = this.calculateRating(value, benchmark);
    });
    return results;
  }
  
  compareCars(car1Data, car2Data, benchmarks) {
    const car1Ratings = this.calculateMultipleRatings(car1Data, benchmarks);
    const car2Ratings = this.calculateMultipleRatings(car2Data, benchmarks);
    
    let car1Wins = 0, car2Wins = 0, ties = 0;
    
    Object.keys(car1Ratings).forEach(key => {
      const r1 = car1Ratings[key];
      const r2 = car2Ratings[key];
      if (r1.rating !== null && r2.rating !== null) {
        if (r1.rating > r2.rating) car1Wins++;
        else if (r2.rating > r1.rating) car2Wins++;
        else ties++;
      }
    });
    
    return {
      car1: {
        id: car1Data._id,
        name: car1Data.name,
        model: car1Data.modelName,
        brand: car1Data.brandName,
        price: car1Data.price,
        image: car1Data.image,
        brandIcon: car1Data.brandIcon,
        overallScore: car1Data.overallScore || null,
        ratings: car1Ratings,
      },
      car2: {
        id: car2Data._id,
        name: car2Data.name,
        model: car2Data.modelName,
        brand: car2Data.brandName,
        price: car2Data.price,
        image: car2Data.image,
        brandIcon: car2Data.brandIcon,
        overallScore: car2Data.overallScore || null,
        ratings: car2Ratings,
      },
      summary: {
        car1Wins,
        car2Wins,
        ties,
        overallWinner: car1Wins > car2Wins ? 'car1' : car2Wins > car1Wins ? 'car2' : 'tie',
      },
    };
  }
  
  getColorForRating(rating) {
    if (rating >= 8) return 'green';
    if (rating >= 5) return 'yellow';
    return 'red';
  }
  
  getExplanationForRating(rating, benchmark) {
    const { explanations } = benchmark;
    if (rating >= 8) return explanations.excellent;
    if (rating >= 5) return explanations.good;
    if (rating >= 3) return explanations.average;
    return explanations.needsImprovement;
  }
  
  parseNumericValue(value) {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      // Handle values like "375 L", "190 mm", "5.3 m"
      const match = value.match(/^[\d.]+/);
      if (match) return parseFloat(match[0]);
    }
    return null;
  }
  
  getValueByPath(obj, path) {
    if (!path) return null;
    const parts = path.split('.');
    let current = obj;
    for (const part of parts) {
      if (current === null || current === undefined) return null;
      current = current[part];
    }
    return current;
  }
}

module.exports = new RatingService();