const router = require('express').Router();
const { createReport, listReports, resolveReport } = require('../controllers/reportController');
const { protect, restrictTo } = require('../middleware/auth');

router.post('/', protect, createReport);
router.get('/', protect, restrictTo('admin'), listReports);
router.patch('/:id/resolve', protect, restrictTo('admin'), resolveReport);

module.exports = router;
