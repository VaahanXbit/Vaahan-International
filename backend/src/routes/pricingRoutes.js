// backend/src/routes/pricingRoutes.js
const express = require('express');
const router = express.Router();
const {
  getOnRoadPrice,
  getOnRoadPriceBulk,
} = require('../controllers/pricingController');

router.get('/', getOnRoadPrice);
router.post('/bulk', getOnRoadPriceBulk);

module.exports = router;
