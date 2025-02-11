const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
    select: false, // Don't include password by default in queries
  },
  role: {
    type: String,
    enum: ['super_admin', 'company_admin', 'employee'],
    required: true,
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: function() {
      return this.role !== 'super_admin';
    }
  },
  hierarchyLevel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HierarchyLevel',
    required: function() {
      return this.role === 'employee';
    },
    default: null,
  },
  reportsTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() {
      return this.role === 'employee';
    },
    default: null,
  },
  phone: {
    type: String,
    default: '',
  },
  bio: {
    type: String,
    default: '',
  },
  avatar: {
    type: String,
    default: '',
  },
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);