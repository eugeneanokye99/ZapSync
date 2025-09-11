const User = require('../models/User');
const Group = require('../models/Group');
const File = require('../models/File');
const mongoose = require('mongoose');
const axios = require('axios'); 

// @desc    Get groups available to join
// @route   GET /api/groups/available
// @access  Private
exports.getAvailableGroups = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const groups = await Group.find({
      _id: { $nin: user.groups },
      $or: [
        { joinLink: { $exists: true } },
        { allowSelfJoin: true }
      ]
    }).populate('createdBy', 'fullname email');
    
    res.json(groups);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Join group with token
// @route   POST /api/groups/join
// @access  Private
exports.joinWithToken = async (req, res) => {
  try {
    const { token } = req.body;
    const group = await Group.findOne({ joinLink: token });
    
    if (!group) {
      return res.status(404).json({ error: 'Invalid join link' });
    }

    // Check if already a member
    const user = await User.findById(req.user.id);
    if (user.groups.includes(group._id)) {
      return res.status(400).json({ error: 'Already a member of this group' });
    }

    // Add user to group
    group.members.push(req.user.id);
    await group.save();

    // Add group to user's groups
    user.groups.push(group._id);
    await user.save();

    res.json({ success: true, group });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Get groups created by staff
// @route   GET /api/groups/staff
// @access  Private (Staff only)
exports.getStaffGroups = async (req, res) => {
  try {
    const groups = await Group.find({ createdBy: req.user.id })
      .populate('members', 'fullname email phone')
      .populate('files');
    
    res.json(groups);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Create a new group
// @route   POST /api/groups
// @access  Private (Staff only)
exports.createGroup = async (req, res) => {
  try {
    const { name, description, isPublic } = req.body;

    const group = new Group({
      name,
      description,
      isPublic,
      createdBy: req.user.id,
      members: [req.user.id] // Add creator as first member
    });

    await group.save();

    // Add group to user's groups
    await User.findByIdAndUpdate(
      req.user.id,
      { $push: { groups: group._id } }
    );

    res.status(201).json(group);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Update a group
// @route   PUT /api/groups/:id
// @access  Private (Staff only)
exports.updateGroup = async (req, res) => {
  try {
    const { name, description, isPublic } = req.body;
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Check if user is the creator
    if (group.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    group.name = name || group.name;
    group.description = description || group.description;
    group.isPublic = isPublic !== undefined ? isPublic : group.isPublic;

    await group.save();
    res.json(group);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Delete a group
// @route   DELETE /api/groups/:id
// @access  Private (Staff only)
exports.deleteGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Check if user is the creator
    if (group.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Remove group from all users' groups array
    await User.updateMany(
      { groups: group._id },
      { $pull: { groups: group._id } }
    );

    // Delete all files associated with the group
    await File.deleteMany({ group: group._id });

    await Group.findByIdAndDelete(req.params.id);
    res.json({ message: 'Group deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// SMS sending function using Arkesel
const sendGroupSMS = async (phoneNumber, groupName, fileName) => {
  try {
    // Format phone number (ensure it starts with 233 for Ghana)
    let formattedPhone = phoneNumber.trim();
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '233' + formattedPhone.substring(1);
    } else if (formattedPhone.startsWith('+233')) {
      formattedPhone = formattedPhone.substring(1);
    }

    const message = `Hello! A new file "${fileName}" has been uploaded to your group "${groupName}". Check it out now!`;

    const response = await axios.post(
      'https://sms.arkesel.com/api/v2/sms/send',
      {
        sender: "Ballotsky", // Change to your preferred sender ID
        message,
        recipients: [formattedPhone]
      },
      {
        headers: {
          'api-key': process.env.ARKESEL_API_KEY, // Make sure to set this in your environment variables
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('SMS sent successfully to:', formattedPhone);
    return true;
  } catch (error) {
    console.error('Failed to send SMS to', phoneNumber, ':', error.message);
    return false; // Don't throw error, just log it
  }
};

// @desc    Upload file to group
// @route   POST /api/groups/:id/files
// @access  Private (Staff only)
exports.uploadGroupFile = async (req, res) => {
  try {
    console.log('Upload group file request received:', {
      params: req.params,
      body: req.body,
      file: req.file ? {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      } : 'No file'
    });

    const group = await Group.findById(req.params.id);
    console.log('Found group:', group ? group._id : 'Not found');

    if (!group) {
      console.log('Group not found with ID:', req.params.id);
      return res.status(404).json({ error: 'Group not found' });
    }

    // Check if user is the creator
    if (group.createdBy.toString() !== req.user.id) {
      console.log('User not authorized. Group created by:', group.createdBy, 'User ID:', req.user.id);
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (!req.file) {
      console.log('No file uploaded in request');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('Processing file upload:', req.file.originalname);

    // Create file object to push to group's files array
    const fileData = {
      _id: new mongoose.Types.ObjectId(), // Generate a new ID for the file
      filename: req.file.originalname,
      path: req.file.path,
      size: req.file.size,
      mimetype: req.file.mimetype,
      uploadedBy: req.user.id,
      title: req.body.title || req.file.originalname,
      description: req.body.description || '',
      uploadedAt: new Date()
    };

    // Add file to group's files array
    group.files.push(fileData);
    await group.save();
    
    console.log('File added to group files array:', fileData._id);
    console.log('Group updated successfully:', group._id);

    // Send SMS notifications to all group members
    try {
      console.log('Sending SMS notifications to group members...');
      
      // Get all users in the group (populate to get phone numbers)
      const populatedGroup = await Group.findById(req.params.id)
        .populate('members', 'phone fullname');
      
      const fileName = req.body.title || req.file.originalname;
      
      // Send SMS to each member (excluding the uploader if you want)
      for (const member of populatedGroup.members) {
        if (member.phone) {
          console.log(`Sending SMS to ${member.fullname} at ${member.phone}`);
          await sendGroupSMS(member.phone, group.name, fileName);
        } else {
          console.log(`Skipping ${member.fullname} - no phone number`);
        }
      }
      
      console.log('SMS notifications sent successfully');
    } catch (smsError) {
      // Don't fail the upload if SMS fails, just log it
      console.error('Error sending SMS notifications:', smsError);
    }

    res.status(201).json({
      message: 'File uploaded successfully',
      file: fileData
    });

  } catch (error) {
    console.error('Error in uploadGroupFile:', {
      error: error.message,
      stack: error.stack,
      params: req.params,
      userId: req.user?.id
    });
    
    res.status(500).json({ 
      error: 'Server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @route   GET /api/groups/user
// @access  Private
// @desc    Get groups available to join (groups user is NOT a member of)
// @route   GET /api/groups/available
// @access  Private
exports.getAvailableGroups = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    // Find groups where user is NOT a member
    const groups = await Group.find({
      members: { $ne: req.user.id } // User is not in members array
    }).populate('createdBy', 'fullname email');
    
    res.json(groups);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Get groups user has joined (groups where user IS a member)
// @route   GET /api/groups/user
// @access  Private
exports.getUserGroups = async (req, res) => {
  try {
    // Find groups where user IS a member
    const groups = await Group.find({
      members: req.user.id // User is in members array
    }).populate('createdBy', 'fullname email');
    
    res.json(groups);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Delete file from group
// @route   DELETE /api/groups/:groupId/files/:fileId
// @access  Private (Staff only)
exports.deleteGroupFile = async (req, res) => {
  try {
    const { groupId, fileId } = req.params;
    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Check if user is the creator
    if (group.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const file = await File.findById(fileId);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Remove file from group
    await Group.findByIdAndUpdate(
      groupId,
      { $pull: { files: fileId } }
    );

    // Delete file
    await File.findByIdAndDelete(fileId);

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Generate join token for group
// @route   POST /api/groups/:id/token
// @access  Private (Staff only)
exports.generateJoinToken = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Check if user is the creator
    if (group.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Generate a random token
    const token = require('crypto').randomBytes(20).toString('hex');
    group.joinLink = token;
    await group.save();

    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};