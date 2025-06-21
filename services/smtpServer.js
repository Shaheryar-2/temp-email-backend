const { SMTPServer } = require('smtp-server')
const { simpleParser } = require('mailparser')
const { saveIncomingMessage } = require('../controllers/emailController')
const DOMAINS = require('../config/domains')

let smtpServer

const startSMTPServer = () => {
  smtpServer = new SMTPServer({
    // secure: true, only for prod
    authOptional: true,
    disabledCommands: ['AUTH'],
    onData(stream, session, callback) {
      simpleParser(stream, async (err, parsed) => {
        if (err) {
          console.error('Email parsing error:', err)
          return callback(err)
        }

        try {
           const emailAddress = session.envelope.rcptTo[0].address
           const domain = emailAddress.split('@')[1]
            if (!DOMAINS.includes(domain)) {
              console.log(`Rejected email for unknown domain: ${domain}`)
              return callback()
            }

           const message = await saveIncomingMessage(emailAddress, parsed)
          
          if (message) {
            console.log(`Message received for ${emailAddress} from ${parsed.from.value[0].address}`)
          }
          
          callback()
        } catch (error) {
          console.error('Error processing message:', error)
          callback(error)
        }
      })
    }
  })

  smtpServer.listen(2525, () => {
    console.log('SMTP server running on port 2525')
  })

  // const SMTP_PORT = process.env.SMTP_PORT || 25;
  // smtpServer.listen(SMTP_PORT, () => {
  //   console.log(`SMTP server running on port ${SMTP_PORT}`);
  // });

}

module.exports = { startSMTPServer }