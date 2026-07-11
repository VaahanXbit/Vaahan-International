// backend/src/services/pricing/calculator.js
/*
================================================================================
File Name : calculator.js
Description : Single entry point for the entire pricing engine.
              calculateOnRoadPrice() is the ONLY function the rest of the
              app should call — it composes all the individual tax/fee
              services and returns a full breakdown plus the final price.

              This module is intentionally the sole place that knows about
              all the sub-services; it has zero knowledge of Mongoose
              models beyond receiving a plain `stateRule` object, which
              keeps the pricing engine independent from the vehicle
              database (SOLID: Dependency Inversion).
Company : Vaahan International
Copyright : (c) 2026 Vaahan International. All rights reserved.
================================================================================
*/

const { calculateRoadTax } = require('./roadTaxService');
const { calculateRegistration } = require('./registrationService');
const { calculateInsurance } = require('./insuranceService');
const { calculateGreenTax } = require('./greenTaxService');
const { calculateLuxuryTax } = require('./luxuryTaxService');
const { calculateEvSubsidy } = require('./evSubsidyService');

/**
 * @param {Object} params
 * @param {number} params.exShowroomPrice - required
 * @param {string} params.fuelType - 'Petrol' | 'Diesel' | 'Electric' | 'CNG' | 'Hybrid' ...
 * @param {string} [params.vehicleType] - reserved for future 2W/4W/commercial differentiation
 * @param {string} params.city
 * @param {string} params.state
 * @param {Object} params.stateRule - a StatePricingRule document (lean), resolved by the caller
 * @param {number} [params.batteryCapacityKwh] - optional, for EV subsidy schemes
 *
 * @returns {{
 *   exShowroomPrice: number,
 *   city: string,
 *   state: string,
 *   roadTax: number,
 *   registration: number,
 *   insurance: number,
 *   fastag: number,
 *   handlingCharges: number,
 *   greenTax: number,
 *   luxuryTax: number,
 *   evSubsidy: number,
 *   totalOtherCharges: number,
 *   onRoadPrice: number,
 *   breakdown: Array<{ label: string, amount: number }>
 * }}
 */
const calculateOnRoadPrice = ({
  exShowroomPrice,
  fuelType,
  vehicleType = 'car',
  city,
  state,
  stateRule,
  batteryCapacityKwh,
}) => {
  if (!exShowroomPrice || exShowroomPrice <= 0) {
    throw new Error('A valid exShowroomPrice is required to calculate on-road price');
  }
  if (!stateRule) {
    throw new Error('A resolved StatePricingRule is required to calculate on-road price');
  }

  const roadTax = calculateRoadTax({ exShowroomPrice, fuelType, stateRule });
  const registration = calculateRegistration({ stateRule });
  const insurance = calculateInsurance({ exShowroomPrice, stateRule });
  const greenTax = calculateGreenTax({ fuelType, stateRule });
  const luxuryTax = calculateLuxuryTax({ exShowroomPrice, stateRule });
  const evSubsidy = calculateEvSubsidy({ fuelType, batteryCapacityKwh, stateRule });

  const fastagAmount =
    (stateRule.fastag?.issuanceFee ?? 0) + (stateRule.fastag?.minBalance ?? 0);
  const handlingCharges = stateRule.handlingCharges ?? 0;

  const totalOtherCharges =
    roadTax.amount +
    registration.amount +
    insurance.amount +
    fastagAmount +
    handlingCharges +
    greenTax.amount +
    luxuryTax.amount -
    evSubsidy.amount;

  const onRoadPrice = Math.round(exShowroomPrice + totalOtherCharges);

  const breakdown = [
    { label: 'Ex-Showroom Price', amount: exShowroomPrice },
    { label: 'Road Tax', amount: roadTax.amount },
    { label: 'Registration Charges', amount: registration.amount },
    { label: 'Insurance (1-Year Comprehensive)', amount: insurance.amount },
    { label: 'FASTag', amount: fastagAmount },
    { label: 'Handling Charges', amount: handlingCharges },
  ];

  if (greenTax.applicable) {
    breakdown.push({ label: 'Green Tax', amount: greenTax.amount });
  }
  if (luxuryTax.applicable) {
    breakdown.push({ label: 'Luxury Tax', amount: luxuryTax.amount });
  }
  if (evSubsidy.applicable) {
    breakdown.push({ label: 'EV Subsidy', amount: -evSubsidy.amount });
  }

  breakdown.push({ label: 'On-Road Price', amount: onRoadPrice });

  return {
    exShowroomPrice,
    city,
    state,
    fuelType,
    vehicleType,
    roadTax: roadTax.amount,
    roadTaxRatePercent: roadTax.ratePercent,
    registration: registration.amount,
    insurance: insurance.amount,
    fastag: fastagAmount,
    handlingCharges,
    greenTax: greenTax.amount,
    luxuryTax: luxuryTax.amount,
    evSubsidy: evSubsidy.amount,
    totalOtherCharges: Math.round(totalOtherCharges),
    onRoadPrice,
    breakdown,
  };
};

module.exports = { calculateOnRoadPrice };
