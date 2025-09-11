const User = require('../models/User');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

// @desc    Register new user
// @route   POST /api/users/register
// @access  Public
const register = async (req, res) => {
  const { fullname, email, password, phone, role, captcha_token, device_type, browser, screen_width, screen_height, userAgent, platform } = req.body;
  console.log(req.body)
  try {
    let user = await User.findOne({ email });

    if (user) {
      return res.status(400).json({ error: 'User already exists' });
    }

    user = new User({
      fullname,  // Now matches schema
      email,
      phone,
      role: role ,
      password,
      device_info: {  // Matches schema structure
        device_type,
        browser,
        screen_width,
        screen_height,
        userAgent,
        platform
      },
      captcha_token
    });

    await user.save();
    const token = generateToken(res, user._id);

    res.status(201).json({
      message: 'User registered successfully'
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
};
// @desc    Authenticate a user
// @route   POST /api/users/login
// @access  Public
const login = async (req, res) => {
  const { email, password, latitude, longitude, ip_address, country, city } = req.body;

  try {
    // Find user and include password (normally excluded)
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' }); // 401 for unauthorized
    }

    // Verify password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Prepare updates
    const updates = {};
    
    // Update location if provided
    if (latitude && longitude) {
      updates.location = {
        latitude,
        longitude
      };
    }
    
    // Update additional info
    if (ip_address) updates.ip_address = ip_address;
    if (country) updates.country = country;
    if (city) updates.city = city;
    
    // Apply updates if any
    if (Object.keys(updates).length > 0) {
      await User.findByIdAndUpdate(
        user._id,
        { $set: updates },
        { new: true, runValidators: true }
      );
    }

    // Generate token
    const token = generateToken(res, user._id);



    res.status(200).json({
      success: true,
      message: 'Login successful',
      token: token,
      role: user.role
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ 
      success: false,
      error: 'Server error',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password -__v');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error('Error getting user profile:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  const { fullname, phone } = req.body;

  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.fullname = fullname || user.fullname;
    user.phone = phone || user.phone;

    const updatedUser = await user.save();

    res.status(200).json({
      _id: updatedUser._id,
      fullname: updatedUser.fullname,
      email: updatedUser.email,
      phone: updatedUser.phone,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Reset password
// @route   POST /api/users/reset-password
// @access  Public
const resetPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }

    const token = crypto.randomBytes(20).toString('hex');
    const resetPasswordExpires = Date.now() + 3600000; // 1 hour

    await User.findByIdAndUpdate(user._id, {
      resetPasswordToken: token,
      resetPasswordExpires
    });

    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    const resetUrl = `${req.protocol}://${req.get('host')}/api/users/reset-password/${token}`;

    const mailOptions = {
      to: user.email,
      from: process.env.EMAIL_FROM,
      subject: 'Password Reset',
      text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n
        Please click on the following link, or paste this into your browser to complete the process:\n\n
        ${resetUrl}\n\n
        If you did not request this, please ignore this email and your password will remain unchanged.\n`
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: 'Recovery email sent' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

// Generate JWT token and set cookie
const generateToken = (res, userId) => {
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  });

  // Set cookie
  res.cookie('jwt', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
  });

  return token;
};

module.exports = {
  register,
  login,
  getUserProfile,
  updateUserProfile,
  resetPassword
};