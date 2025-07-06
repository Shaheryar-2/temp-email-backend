// Represents an email received at a temporary address

const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  emailId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Email', 
    required: true 
  },
  from: { 
    type: String, 
    required: true 
  },
  subject: { 
    type: String, 
    default: '(no subject)' 
  },
  body: { 
    type: String 
  },
  html: { 
    type: String 
  },
  read: { 
    type: Boolean 
  },
  receivedAt: { 
    type: Date, 
    default: Date.now 
  },
  attachments: [{
    filename: String,
    contentType: String,
    size: Number,
    content: Buffer
  }]
});

module.exports = mongoose.model('Message', MessageSchema);