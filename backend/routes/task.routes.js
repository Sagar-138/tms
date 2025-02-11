const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/fileUpload');
const {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  addComment,
  getTasksByHierarchy,
  getTaskAnalytics,
  getTasksByDepartment,
  getTaskTimeline
} = require('../controllers/task.controller');

// Task routes
router.post('/', protect, upload.array('attachments'), createTask);
router.get('/', protect, getTasks);
router.get('/:id', protect, getTaskById);
router.put('/:id', protect, upload.array('attachments'), updateTask);
router.delete('/:id', protect, deleteTask);
router.post('/:id/comments', protect, addComment);

// Task viewing and analytics
router.get('/hierarchy', protect, getTasksByHierarchy);
router.get('/analytics', protect, authorize('company_admin'), getTaskAnalytics);
router.get('/department/:dept', protect, getTasksByDepartment);
router.get('/timeline', protect, getTaskTimeline);

module.exports = router;