const express = require('express');
const router = express.Router();
const { createReport, getReports, resolveReport } = require('../controllers/reportController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

router.post('/', authMiddleware, createReport);
router.get('/', authMiddleware, adminMiddleware, getReports);
router.delete('/:id', authMiddleware, adminMiddleware, resolveReport);

module.exports = router;
