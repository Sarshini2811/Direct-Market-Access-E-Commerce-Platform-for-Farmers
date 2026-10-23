const router = require('express').Router();
const { compareListings, priceTrend, externalReferences, estimateRevenue } = require('../controllers/priceInsightController');
const { protect } = require('../middleware/auth');

router.get('/compare', protect, compareListings);
router.get('/trend', protect, priceTrend);
router.get('/external', protect, externalReferences);
router.get('/estimate-revenue', protect, estimateRevenue);

module.exports = router;
