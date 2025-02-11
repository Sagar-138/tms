const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification
} = require('../controllers/notification.controller');

// Get user's notifications
router.get('/', auth, getNotifications);

// Mark notification as read
router.put('/:id/read', auth, markAsRead);

// Mark all notifications as read
router.put('/mark-all-read', auth, markAllAsRead);

// Delete a notification
router.delete('/:id', auth, deleteNotification);

module.exports = router;