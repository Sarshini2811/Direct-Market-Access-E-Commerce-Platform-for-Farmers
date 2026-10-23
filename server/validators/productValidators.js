const { body } = require('express-validator');
const { PRODUCT_CATEGORIES, PRODUCT_UNITS, QUALITY_GRADES } = require('../config/constants');

const createProductValidator = [
  body('name').trim().notEmpty().withMessage('Product name is required').isLength({ max: 150 }),
  body('category').isIn(PRODUCT_CATEGORIES).withMessage(`Category must be one of: ${PRODUCT_CATEGORIES.join(', ')}`),
  body('unit').isIn(PRODUCT_UNITS).withMessage(`Unit must be one of: ${PRODUCT_UNITS.join(', ')}`),
  body('grade').optional().isIn(QUALITY_GRADES),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('quantityAvailable').isFloat({ min: 0 }).withMessage('Quantity must be a positive number'),
  body('description').optional().isLength({ max: 2000 }),
  body('wholesale.enabled').optional().isBoolean(),
  body('wholesale.minQuantity').optional().isFloat({ min: 0 }),
  body('wholesale.pricePerUnit').optional().isFloat({ min: 0 }),
  body('harvestDate').optional().isISO8601(),
  body('expiryOrFreshUntil').optional().isISO8601(),
];

const updateProductValidator = [
  body('name').optional().trim().isLength({ max: 150 }),
  body('category').optional().isIn(PRODUCT_CATEGORIES),
  body('unit').optional().isIn(PRODUCT_UNITS),
  body('grade').optional().isIn(QUALITY_GRADES),
  body('price').optional().isFloat({ min: 0 }),
  body('quantityAvailable').optional().isFloat({ min: 0 }),
  body('surplusDiscountPercent').optional().isFloat({ min: 0, max: 90 }),
];

module.exports = { createProductValidator, updateProductValidator };
