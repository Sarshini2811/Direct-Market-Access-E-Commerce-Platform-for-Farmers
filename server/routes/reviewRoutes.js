const router = require('express').Router();
const { createReview, getProductReviews, getEligibleReviewTargets } = require('../controllers/reviewController');
const { protect, restrictTo } = require('../middleware/auth');

router.post('/', protect, restrictTo('buyer'), createReview);
router.get('/eligible', protect, restrictTo('buyer'), getEligibleReviewTargets);
router.get('/product/:productId', getProductReviews);

module.exports = router;
