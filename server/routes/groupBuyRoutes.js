const router = require('express').Router();
const { listGroupBuys, getGroupBuy, createGroupBuy, joinGroupBuy, finalizeGroupBuy } = require('../controllers/groupBuyController');
const { protect, restrictTo } = require('../middleware/auth');

router.get('/', listGroupBuys);
router.get('/:id', getGroupBuy);
router.post('/', protect, restrictTo('buyer'), createGroupBuy);
router.post('/:id/join', protect, restrictTo('buyer'), joinGroupBuy);
router.post('/:id/finalize', protect, restrictTo('farmer', 'admin'), finalizeGroupBuy);

module.exports = router;
