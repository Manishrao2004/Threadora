const Category = require('../models/Category');
const Thread   = require('../models/Thread');
const Comment  = require('../models/Comment');

// GET /api/categories
const listCategories = async (req, res, next) => {
  try {
    const categories = await Category.find().sort({ createdAt: 1 });
    res.status(200).json(categories);
  } catch (error) {
    next(error);
  }
};

// POST /api/categories  (Admin only)
// Mongoose will return a duplicate-key error if the name already exists;
// the global error handler maps that to a 400 with a clean message.
const createCategory = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const category = new Category({ name, description });
    await category.save();
    res.status(201).json(category);
  } catch (error) {
    next(error);
  }
};

// PUT /api/categories/:id  (Admin only)
const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const category = await Category.findByIdAndUpdate(
      id,
      { name, description },
      { new: true, runValidators: true }
    );
    if (!category) return res.status(404).json({ message: 'Category not found' });
    res.status(200).json(category);
  } catch (error) {
    next(error);
  }
};

// DELETE /api/categories/:id  (SuperAdmin only)
// Cascade-deletes all threads in the category (and their comments) in parallel.
// Votes and reports attached to those threads are intentionally left to be
// cleaned up by the garbage collection pass in userCleanupService if needed.
const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const category = await Category.findById(id);
    if (!category) return res.status(404).json({ message: 'Category not found' });

    const threads   = await Thread.find({ categoryId: id });
    const threadIds = threads.map(t => t._id);

    await Promise.all([
      Comment.deleteMany({ threadId: { $in: threadIds } }),
      Thread.deleteMany({ categoryId: id }),
      Category.findByIdAndDelete(id)
    ]);

    res.status(200).json({ message: 'Category and all associated content deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { listCategories, createCategory, updateCategory, deleteCategory };
