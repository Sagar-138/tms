const Notification = require('../models/Notification');
const { io } = require('../socket');
const { sendEmail } = require('../utils/emailService');

// Create a new notification
exports.createNotification = async ({ user, type, title, message, task, from, priority }) => {
  try {
    const notification = await Notification.create({
      user,
      type,
      title,
      message,
      task,
      from,
      priority
    });

    // Populate references for socket emission
    const populatedNotification = await notification
      .populate('task', 'title')
      .populate('from', 'name');

    // Emit socket event for real-time notification
    io.to(`user-${user}`).emit('notification', populatedNotification);

    // Send email notification if task exists
    if (task) {
      const taskData = await task.populate('assignedTo', 'email');
      await sendEmail(taskData.assignedTo.email, type, task);
      notification.emailSent = true;
      await notification.save();
    }

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

// Get user's notifications
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user.id })
      .populate('task', 'title')
      .populate('from', 'name')
      .sort('-createdAt')
      .limit(50);

    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Error fetching notifications' });
  }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json(notification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Error updating notification' });
  }
};

// Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user.id, read: false },
      { read: true }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ message: 'Error updating notifications' });
  }
};

// Delete a notification
exports.deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ message: 'Notification deleted' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ message: 'Error deleting notification' });
  }
};