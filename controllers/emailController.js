const crypto = require('crypto');
const Email = require('../models/Email');
const Message = require('../models/Message');

// Your available domains
const DOMAINS = ['tempmail.app', 'disposable.me', 'quickinbox.net'];

/**
 * Generate a new disposable email
 */
exports.createEmail = async (req, res) => {
  try {
    const prefix = crypto.randomBytes(4).toString('hex');
    const randomDomain = DOMAINS[Math.floor(Math.random() * DOMAINS.length)];
    const emailAddress = `${prefix}@${randomDomain}`;

    const newEmail = new Email({
      address: emailAddress,
      domain: randomDomain
    });

    await newEmail.save();

    res.status(201).json({
      email: emailAddress,
      domain: randomDomain,
      expiresAt: new Date(newEmail.createdAt.getTime() + 24 * 60 * 60 * 1000)
    });
  } catch (error) {
    console.error('Error creating email:', error);
    res.status(500).json({ error: 'Server error while creating email' });
  }
};

/**
 * Get all messages for a given email address
 */
exports.getEmailMessages = async (req, res) => {
  try {
    const emailAddress = req.params.email;

    const email = await Email.findOne({ address: emailAddress });
    if (!email) {
      return res.status(404).json({ error: 'Email not found' });
    }

    const messages = await Message.find({ emailId: email._id }).sort({ receivedAt: -1 });

    res.json({ messages, inbox: emailAddress });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Server error while fetching messages' });
  }
};

/**
 * Save an incoming SMTP message (called from SMTP server)
 */
exports.saveIncomingMessage = async (recipientEmail, parsed) => {
  console.log('coming')
  const email = await Email.findOne({ address: recipientEmail });

  if (!email) {
    console.log(`No temp email found for: ${recipientEmail}`);
    return null;
  }

  const newMessage = new Message({
    emailId: email._id,
    from: parsed.from?.text || '(unknown)',
    subject: parsed.subject || '(no subject)',
    body: parsed.text || '',
    html: parsed.html || '',
    receivedAt: parsed.date || new Date(),
    attachments: parsed.attachments?.map((att) => ({
      filename: att.filename,
      contentType: att.contentType,
      size: att.size,
      content: att.content
    }))
  });

  return await newMessage.save();
}
