const router = require('express').Router();
const {
  placeOrder, getMyOrders, getFarmerOrders, getOrder, updateOrderStatus, cancelOrder,
} = require('../controllers/orderController');
const { placeOrderValidator, updateOrderStatusValidator } = require('../validators/orderValidators');
const validate = require('../middleware/validate');
const { protect, restrictTo } = require('../middleware/auth');

router.post('/', protect, restrictTo('buyer'), placeOrderValidator, validate, placeOrder);
router.get('/mine', protect, restrictTo('buyer'), getMyOrders);
router.get('/farmer', protect, restrictTo('farmer'), getFarmerOrders);
router.get('/:id', protect, getOrder);
router.patch('/:id/status', protect, restrictTo('farmer', 'admin'), updateOrderStatusValidator, validate, updateOrderStatus);
router.patch('/:id/cancel', protect, restrictTo('buyer'), cancelOrder);

module.exports = router;
