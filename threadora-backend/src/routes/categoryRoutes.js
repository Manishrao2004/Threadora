const express = require('express');
const router = express.Router();
const { listCategories, createCategory, updateCategory, deleteCategory } = require('../controllers/categoryController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const superAdminMiddleware = require('../middleware/superAdminMiddleware');

router.get('/', listCategories);
router.post('/', authMiddleware, superAdminMiddleware, createCategory);
router.put('/:id', authMiddleware, superAdminMiddleware, updateCategory);
router.delete('/:id', authMiddleware, superAdminMiddleware, deleteCategory);

module.exports = router;
