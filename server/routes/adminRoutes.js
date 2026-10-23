const router = require('express').Router();
const {
  dashboardStats, listUsers, updateUserStatus,
  listAllListings, moderateListing, listAllOrders, getAuditLog,
} = require('../controllers/adminController');
const { protect, restrictTo } = require('../middleware/auth');

router.use(protect, restrictTo('admin'));

router.get('/dashboard', dashboardStats);
router.get('/users', listUsers);
router.patch('/users/:id/status', updateUserStatus);
router.get('/listings', listAllListings);
router.patch('/listings/:id/moderate', moderateListing);
router.get('/orders', listAllOrders);
router.get('/audit-log', getAuditLog);

module.exports = router;
