const express = require('express');
const router = express.Router();
const {
  compareCars,
  getBenchmarks,
  seedBenchmarks,
} = require('../controllers/compareController');

router.post('/compare', compareCars);
router.get('/benchmarks', getBenchmarks);
router.post('/benchmarks/seed', seedBenchmarks);

module.exports = router;