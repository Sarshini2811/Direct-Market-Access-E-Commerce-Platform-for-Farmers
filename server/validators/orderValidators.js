const { body } = require('express-validator');
const { DELIVERY_METHODS, ORDER_STATUS } = require('../config/constants');

const placeOrderValidator = [
  body('deliveryMethod').isIn(DELIVERY_METHODS).withMessage(`Delivery method must be one of: ${DELIVERY_METHODS.join(', ')}`),
  body('deliveryAddress').custom((value, { req }) => {
    if (req.body.deliveryMethod === 'delivery' && (!value || !value.line1 || !value.city || !value.pincode)) {
      throw new Error('A complete delivery address is required for home delivery.');
    }
    return true;
  }),
];

const updateOrderStatusValidator = [
  body('status').isIn(ORDER_STATUS).withMessage(`Status must be one of: ${ORDER_STATUS.join(', ')}`),
  body('note').optional().isLength({ max: 300 }),
];

module.exports = { placeOrderValidator, updateOrderStatusValidator };
