const express = require('express')
const router = express.Router()
const {
  createEmail,
  getEmailMessages,
  deleteEmail
} = require('../controllers/emailController')

router.post('/', createEmail)
router.get('/:email/messages', getEmailMessages)
router.delete('/emails/:id', deleteEmail);

module.exports = router