const Message = require('../models/Message')

exports.getMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Mark as read when fetched for details
    if (!message.read) {
      message.read = true;
      await message.save();
    }

    const response = message.toObject();
    response.attachments = response.attachments.map(a => ({
      filename: a.filename,
      contentType: a.contentType,
      size: a.size
    }));

    res.json(response);
  } catch (error) {
    console.error('Error fetching message:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

exports.getAttachment = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id)
    if (!message || !message.attachments[req.params.index]) {
      return res.status(404).json({ error: 'Attachment not found' })
    }

    const attachment = message.attachments[req.params.index]
    res.set('Content-Type', attachment.contentType)
    res.set('Content-Disposition', `attachment filename="${attachment.filename}"`)
    res.send(attachment.content)
  } catch (error) {
    console.error('Error fetching attachment:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}