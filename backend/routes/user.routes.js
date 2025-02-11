const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getCompanyEmployees,
  updateUser,
  getUserProfile,
  updateProfile,
  changePassword,
  uploadAvatar
} = require('../controllers/user.controller'); // Ensure correct path

const multer = require('multer');
const path = require('path');

// Configure multer for avatar uploads
const storage = multer.diskStorage({
  destination: 'uploads/avatars',
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 1024 * 1024 * 5 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only .png, .jpg and .jpeg format allowed!'));
  }
});

// Routes
router.get('/profile', protect, getUserProfile);
router.get('/employees', protect, authorize('company_admin'), getCompanyEmployees);
router.patch('/profile', protect, updateProfile); // Ensure this route is defined before any routes with :id parameter
router.patch('/profile/password', protect, changePassword); // New route for changing password
router.patch('/:id', protect, updateUser);
router.patch('/upload-avatar', protect, upload.single('avatar'), uploadAvatar);

module.exports = router;