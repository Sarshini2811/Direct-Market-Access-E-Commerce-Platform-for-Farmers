const router = require('express').Router();
const { farmerAnalytics, adminAnalytics } = require('../controllers/analyticsController');
const { protect, restrictTo } = require('../middleware/auth');

router.get('/farmer', protect, restrictTo('farmer'), farmerAnalytics);
router.get('/admin', protect, restrictTo('admin'), adminAnalytics);

module.exports = router;
