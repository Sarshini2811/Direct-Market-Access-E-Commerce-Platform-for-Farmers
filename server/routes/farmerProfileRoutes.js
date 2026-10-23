const router = require('express').Router();
const {
  getMyProfile, getPublicProfile, updateMyProfile, submitVerification,
} = require('../controllers/farmerProfileController');
const { protect, restrictTo } = require('../middleware/auth');

router.get('/me', protect, restrictTo('farmer'), getMyProfile);
router.patch('/me', protect, restrictTo('farmer'), updateMyProfile);
router.post('/me/verification', protect, restrictTo('farmer'), submitVerification);
router.get('/:farmerId', getPublicProfile);

module.exports = router;
