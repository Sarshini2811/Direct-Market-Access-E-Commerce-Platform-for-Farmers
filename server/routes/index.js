const router = require('express').Router();

router.use('/auth', require('./authRoutes'));
router.use('/farmers', require('./farmerProfileRoutes'));
router.use('/products', require('./productRoutes'));
router.use('/cart', require('./cartRoutes'));
router.use('/orders', require('./orderRoutes'));
router.use('/payments', require('./paymentRoutes'));
router.use('/reviews', require('./reviewRoutes'));
router.use('/notifications', require('./notificationRoutes'));
router.use('/preorders', require('./preOrderRoutes'));
router.use('/groupbuys', require('./groupBuyRoutes'));
router.use('/price-insights', require('./priceInsightRoutes'));
router.use('/reports', require('./reportRoutes'));
router.use('/verification', require('./verificationRoutes'));
router.use('/admin', require('./adminRoutes'));
router.use('/analytics', require('./analyticsRoutes'));

router.get('/health', (req, res) => res.json({ success: true, message: 'API is healthy' }));

module.exports = router;
