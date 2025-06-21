const express = require('express')
const router = express.Router()
const {
  getMessage,
  getAttachment
} = require('../controllers/messageController')

router.get('/:id', getMessage)
router.get('/:id/attachments/:index', getAttachment)

module.exports = router