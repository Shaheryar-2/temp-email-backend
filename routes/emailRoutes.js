const express = require('express')
const router = express.Router()
const {
  createEmail,
  getEmailMessages
} = require('../controllers/emailController')

router.post('/', createEmail)
router.get('/:email/messages', getEmailMessages)

module.exports = router