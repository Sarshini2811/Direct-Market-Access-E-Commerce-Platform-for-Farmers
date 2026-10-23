const router = require('express').Router();
const {
  listProducts, getProduct, getMyProducts, createProduct,
  updateProduct, deleteProduct, deleteProductImage, updateStock, getCategories,
} = require('../controllers/productController');
const { createProductValidator, updateProductValidator } = require('../validators/productValidators');
const validate = require('../middleware/validate');
const { protect, restrictTo } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/meta/categories', getCategories);
router.get('/', listProducts);
router.get('/mine', protect, restrictTo('farmer'), getMyProducts);
router.get('/:id', getProduct);

router.post('/', protect, restrictTo('farmer'), upload.array('images', 6), createProductValidator, validate, createProduct);
router.patch('/:id', protect, restrictTo('farmer', 'admin'), upload.array('images', 6), updateProductValidator, validate, updateProduct);
router.patch('/:id/stock', protect, restrictTo('farmer'), updateStock);
router.delete('/:id/image', protect, restrictTo('farmer', 'admin'), deleteProductImage);
router.delete('/:id', protect, restrictTo('farmer', 'admin'), deleteProduct);

module.exports = router;
