const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Get Company Employees
const getCompanyEmployees = async (req, res) => {
  try {
    const employees = await User.find({ 
      company: req.user.company,
      role: 'employee'
    })
    .populate('hierarchyLevel', 'name level')
    .populate('reportsTo', 'name email')
    .select('-password');

    res.json(employees);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update User
const updateUser = async (req, res) => {
  try {
    const { name, email, hierarchyLevel, reportsTo } = req.body;
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (req.user.role !== 'company_admin' && req.user.id !== req.params.id) {
      return res.status(403).json({ message: 'Not authorized to update this user' });
    }

    user.name = name || user.name;
    user.email = email || user.email;

    if (req.user.role === 'company_admin') {
      user.hierarchyLevel = hierarchyLevel || user.hierarchyLevel;
      user.reportsTo = reportsTo || user.reportsTo;
    }

    await user.save();
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get User Profile
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate('company', 'name')
      .populate('hierarchyLevel', 'name level')
      .populate('reportsTo', 'name email');

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update Profile
const updateProfile = async (req, res) => {
  try {
    const { name, phone, bio } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update fields dynamically
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (bio) user.bio = bio;

    await user.save();
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Change Password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id).select('+password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    user.password = await bcrypt.hash(newPassword, 10);

    await user.save();
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Upload Avatar
const uploadAvatar = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.avatar = req.file.path;
    await user.save();

    res.json({ avatar: user.avatar });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Ensure controllers are properly exported
module.exports = {
  getCompanyEmployees,
  updateUser,
  getUserProfile,
  updateProfile,
  changePassword,
  uploadAvatar
};