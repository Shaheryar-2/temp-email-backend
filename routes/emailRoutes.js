const express = require('express')
const router = express.Router()
const {
  createEmail,
  getEmailMessages,
  deleteEmail,
  getAllEmails
} = require('../controllers/emailController')

router.get('/', getAllEmails)
router.post('/', createEmail)
router.get('/:email/messages', getEmailMessages)
router.delete('/:id', deleteEmail);

module.exports = router