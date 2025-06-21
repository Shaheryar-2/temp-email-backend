const mongoose = require('mongoose');

const EmailSchema = new mongoose.Schema({
  address: { 
    type: String, 
    required: true, 
    unique: true 
  },
  domain: {
    type: String,
    required: true,
    enum: ['tempmail.app', 'disposable.me', 'quickinbox.net'] // Add your domains
  },
  createdAt: { 
    type: Date, 
    default: Date.now, 
    expires: '24h' 
  }
});

module.exports = mongoose.model('Email', EmailSchema);