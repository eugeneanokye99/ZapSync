const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  files: [{
    filename: String,
    path: String,
    size: Number,
    mimetype: String,
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    title: String,
    description: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  joinLink: {
    type: String,
    unique: true,
    sparse: true
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  allowSelfJoin: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Group', groupSchema);