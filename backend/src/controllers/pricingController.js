// backend/src/controllers/pricingController.js
/*
================================================================================
File Name : pricingController.js
Description : GET /api/pricing — takes a variant + city/state and returns
              the full on-road price breakdown. This is the only place
              that bridges the vehicle database (Variant) and the pricing
              engine (services/pricing) — the engine itself never imports
              Variant, keeping it fully reusable and testable in isolation.
Company : Vaahan International
Copyright : (c) 2026 Vaahan International. All rights reserved.
================================================================================
*/

const Variant = require('../models/Variant');
const { calculateOnRoadPrice } = require('../services/pricing/calculator');
const { resolveStateRule } = require('../services/pricing/stateRuleResolver');

/**
 * GET /api/pricing?variantId=...&city=Hyderabad&state=Telangana&stateCode=TG
 */
exports.getOnRoadPrice = async (req, res) => {
  try {
    const { variantId, city, state, stateCode } = req.query;

    if (!variantId) {
      return res.status(400).json({
        success: false,
        message: 'variantId is required',
      });
    }
    if (!state && !stateCode) {
      return res.status(400).json({
        success: false,
        message: 'state or stateCode is required to calculate on-road price',
      });
    }

    const variant = await Variant.findById(variantId).lean();
    if (!variant) {
      return res.status(404).json({ success: false, message: 'Variant not found' });
    }
    if (!variant.exShowroomPrice) {
      return res.status(422).json({
        success: false,
        message: 'This variant has no exShowroomPrice on record',
      });
    }

    const { rule, isFallback } = await resolveStateRule({ state, stateCode });

    const pricing = calculateOnRoadPrice({
      exShowroomPrice: variant.exShowroomPrice,
      fuelType: variant.fuelType,
      city,
      state: state || rule.state,
      stateRule: rule,
    });

    return res.status(200).json({
      success: true,
      data: {
        variantId,
        ...pricing,
        stateRuleUsed: isFallback ? 'national-average-fallback' : rule.state,
      },
    });
  } catch (error) {
    console.error('❌ Get on-road price error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to calculate on-road price',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * POST /api/pricing/bulk
 * Body: { variantIds: [...], city, state, stateCode }
 * Used by pages that need on-road price for multiple variants at once
 * (e.g. Compare Cars) without N separate round trips.
 */
exports.getOnRoadPriceBulk = async (req, res) => {
  try {
    const { variantIds, city, state, stateCode } = req.body;

    if (!Array.isArray(variantIds) || variantIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'variantIds must be a non-empty array',
      });
    }
    if (!state && !stateCode) {
      return res.status(400).json({
        success: false,
        message: 'state or stateCode is required to calculate on-road price',
      });
    }

    const variants = await Variant.find({ _id: { $in: variantIds } }).lean();
    const { rule, isFallback } = await resolveStateRule({ state, stateCode });

    const data = variants.map((variant) => {
      if (!variant.exShowroomPrice) {
        return { variantId: String(variant._id), error: 'No exShowroomPrice on record' };
      }
      const pricing = calculateOnRoadPrice({
        exShowroomPrice: variant.exShowroomPrice,
        fuelType: variant.fuelType,
        city,
        state: state || rule.state,
        stateRule: rule,
      });
      return { variantId: String(variant._id), ...pricing };
    });

    return res.status(200).json({
      success: true,
      stateRuleUsed: isFallback ? 'national-average-fallback' : rule.state,
      data,
    });
  } catch (error) {
    console.error('❌ Get bulk on-road price error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to calculate on-road prices',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};
