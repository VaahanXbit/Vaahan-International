// src/data/cars/index.js
/*
================================================================================
File Name : index.js
Author : Tahseen Raza
Created Date : 2026-06-22
Description : Car data service - Now fetches from backend API
Company : Vaahan International
Copyright : (c) 2026 Vaahan International. All rights reserved.
================================================================================
*/

import { api } from '../../services/api';

// Cache for car data
let carDataCache = null;
let isFetching = false;
let fetchPromise = null;

// Fetch car data from backend
const fetchCarData = async () => {
  if (carDataCache) return carDataCache;
  
  if (isFetching) {
    return fetchPromise;
  }
  
  isFetching = true;
  fetchPromise = api.getAllCars().then(result => {
    isFetching = false;
    if (result.success) {
      carDataCache = result.data;
      return carDataCache;
    }
    console.error('❌ Failed to fetch car data:', result.message);
    return [];
  }).catch(error => {
    isFetching = false;
    console.error('❌ Error fetching car data:', error);
    return [];
  });
  
  return fetchPromise;
};

// Get all cars with variants flattened
export const getAllCars = async () => {
  const data = await fetchCarData();
  const cars = [];
  data.forEach(brand => {
    brand.models.forEach(model => {
      model.variants.forEach(variant => {
        cars.push({
          id: `${brand.brand}-${model.name}-${variant.name}`,
          brand: brand.brand,
          model: model.name,
          variant: variant.name,
          slug: model.slug,
          image: model.image,
          price: variant.price,
          overallScore: variant.overallScore || 0,
          scores: variant.scores || null,
          factorScores: variant.factorScores || null,
        });
      });
    });
  });
  return cars;
};

// Get all brands
export const getAllBrands = async () => {
  const data = await fetchCarData();
  return data.map(brand => brand.brand);
};

// Get models by brand
export const getModelsByBrand = async (brandName) => {
  const data = await fetchCarData();
  const brand = data.find(b => b.brand === brandName);
  if (!brand) return [];
  return brand.models.map(model => model.name);
};

// Get variants by brand and model
export const getVariantsByBrandAndModel = async (brandName, modelName) => {
  const data = await fetchCarData();
  const brand = data.find(b => b.brand === brandName);
  if (!brand) return [];
  const model = brand.models.find(m => m.name === modelName);
  if (!model) return [];
  return model.variants.map(variant => ({
    name: variant.name,
    price: variant.price,
    overallScore: variant.overallScore || 0,
    scores: variant.scores || null,
    factorScores: variant.factorScores || null,
  }));
};

// Get full car data by brand, model, and variant
export const getCarByBrandModelVariant = async (brandName, modelName, variantName) => {
  const data = await fetchCarData();
  const brand = data.find(b => b.brand === brandName);
  if (!brand) return null;
  const model = brand.models.find(m => m.name === modelName);
  if (!model) return null;
  const variant = model.variants.find(v => v.name === variantName);
  if (!variant) return null;
  
  return {
    id: `${brand.brand}-${model.name}-${variant.name}`,
    brand: brand.brand,
    model: model.name,
    variant: variant.name,
    slug: model.slug,
    image: model.image,
    price: variant.price,
    overallScore: variant.overallScore || 0,
    scores: variant.scores || null,
    factorScores: variant.factorScores || null,
  };
};

// Search cars
export const searchCars = async (query) => {
  if (!query || query.trim() === '') return [];
  const result = await api.searchCars(query.trim());
  if (result.success) {
    return result.data;
  }
  return [];
};

// Popular comparisons (static - can be fetched from backend)
export const popularComparisons = [
  {
    id: 1,
    car1Id: 'Hyundai-Creta-SX(O) 1.5 Diesel AT',
    car2Id: 'Kia-Seltos-GTX+ 1.5 Diesel AT',
    title: "Creta vs Seltos",
    car1Name: "Creta",
    car2Name: "Seltos",
    car1Brand: "Hyundai",
    car2Brand: "Kia"
  },
  {
    id: 2,
    car1Id: 'Hyundai-Creta-SX(O) 1.5 Diesel AT',
    car2Id: 'Suzuki-Grand Vitara-Zeta+ Smart Hybrid',
    title: "Creta vs Grand Vitara",
    car1Name: "Creta",
    car2Name: "Grand Vitara",
    car1Brand: "Hyundai",
    car2Brand: "Suzuki"
  },
  {
    id: 3,
    car1Id: 'Tata-Nexon-Fearless Plus 1.5 Diesel',
    car2Id: 'Suzuki-Brezza-ZXi+ 1.5 Petrol',
    title: "Nexon vs Brezza",
    car1Name: "Nexon",
    car2Name: "Brezza",
    car1Brand: "Tata",
    car2Brand: "Suzuki"
  },
  {
    id: 4,
    car1Id: 'Mahindra-XUV700-AX7L 2.0 Diesel AT',
    car2Id: 'Kia-Seltos-GTX+ 1.5 Diesel AT',
    title: "XUV700 vs Seltos",
    car1Name: "XUV700",
    car2Name: "Seltos",
    car1Brand: "Mahindra",
    car2Brand: "Kia"
  }
];

export default {
  getAllCars,
  getAllBrands,
  getModelsByBrand,
  getVariantsByBrandAndModel,
  getCarByBrandModelVariant,
  searchCars,
  popularComparisons
};