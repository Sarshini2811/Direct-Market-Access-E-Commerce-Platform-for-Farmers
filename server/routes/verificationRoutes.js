const router = require('express').Router();
const { listRequests, getRequest, decideRequest } = require('../controllers/verificationController');
const { protect, restrictTo } = require('../middleware/auth');

router.use(protect, restrictTo('admin'));
router.get('/', listRequests);
router.get('/:id', getRequest);
router.patch('/:id/decide', decideRequest);

module.exports = router;
