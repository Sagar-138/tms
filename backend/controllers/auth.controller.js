const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Company = require('../models/Company');

exports.register = async (req, res) => {
  try {
    const { email, password, name, role, company } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Validate role
    const validRoles = ['super_admin', 'company_admin', 'employee'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    // If creating company_admin, verify company exists
    if (role === 'company_admin') {
      const companyExists = await Company.findById(company);
      if (!companyExists) {
        return res.status(400).json({ message: 'Company not found' });
      }

      // Check if company already has an admin
      const existingAdmin = await User.findOne({ company, role: 'company_admin' });
      if (existingAdmin) {
        return res.status(400).json({ message: 'Company already has an admin' });
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      company: role !== 'super_admin' ? company : undefined
    });

    // If creating company_admin, update company with admin reference
    if (role === 'company_admin') {
      await Company.findByIdAndUpdate(company, { admin: user._id });
    }

    // Create token
    const token = jwt.sign(
      { 
        id: user._id, 
        role: user.role,
        company: user.company 
      }, 
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      token,
      user: userResponse
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      message: 'Server error during registration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Find user and populate company details if exists
    const user = await User.findOne({ email })
      .populate('company', 'name')
      .select('+password'); // Include password field for comparison

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Create token
    const token = jwt.sign(
      { 
        id: user._id, 
        role: user.role,
        company: user.company?._id 
      }, 
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    // Send response
    res.json({
      token,
      user: userResponse
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      message: 'Server error during login',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};