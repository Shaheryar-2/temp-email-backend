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
    if (!message) return res.status(404).json({ error: 'Message not found' })

    const idx = parseInt(req.params.index, 10)
    if (isNaN(idx) || idx < 0 || idx >= message.attachments.length) {
      return res.status(404).json({ error: 'Attachment not found' })
    }

    const attachment = message.attachments[idx]
    res.setHeader('Content-Type', attachment.contentType)
    res.setHeader('Content-Disposition', `attachment; filename="${attachment.filename}"`)
    res.send(attachment.content)
  } catch (err) {
    console.error('Error fetching attachment:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}

exports.deleteMessage = async (req, res) => {
  try {
    const message = await Message.findByIdAndDelete(req.params.id);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }
    res.status(200).json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

