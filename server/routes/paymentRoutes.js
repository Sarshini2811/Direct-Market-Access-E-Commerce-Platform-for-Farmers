const router = require('express').Router();
const { confirm } = require('../controllers/paymentController');
const { protect, restrictTo } = require('../middleware/auth');

router.post('/confirm', protect, restrictTo('buyer'), confirm);

module.exports = router;
