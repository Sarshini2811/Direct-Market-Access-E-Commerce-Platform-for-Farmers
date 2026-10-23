const router = require('express').Router();
const {
  listPreOrders, getPreOrder, getMyPreOrders, createPreOrder,
  updatePreOrder, reservePreOrder, cancelReservation, confirmHarvest,
} = require('../controllers/preOrderController');
const { protect, restrictTo } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', listPreOrders);
router.get('/mine', protect, restrictTo('farmer'), getMyPreOrders);
router.get('/:id', getPreOrder);

router.post('/', protect, restrictTo('farmer'), upload.single('image'), createPreOrder);
router.patch('/:id', protect, restrictTo('farmer'), updatePreOrder);
router.post('/:id/confirm-harvest', protect, restrictTo('farmer'), confirmHarvest);

router.post('/:id/reserve', protect, restrictTo('buyer'), reservePreOrder);
router.patch('/:id/reservations/:reservationId/cancel', protect, restrictTo('buyer'), cancelReservation);

module.exports = router;
