const { SMTPServer } = require('smtp-server');
const { simpleParser } = require('mailparser');
const { saveIncomingMessage } = require('../controllers/emailController');
const DOMAINS = require('../config/domains');
const WebSocket = require('ws'); // Add this import

let smtpServer;

const startSMTPServer = (wss) => {
  smtpServer = new SMTPServer({
    authOptional: true,
    disabledCommands: ['AUTH'],
    onData(stream, session, callback) {
      simpleParser(stream, async (err, parsed) => {
        if (err) {
          console.error('Email parsing error:', err);
          return callback(err);
        }

        try {
          const emailAddress = session.envelope.rcptTo[0].address;
          const domain = emailAddress.split('@')[1];
          
          if (!DOMAINS.includes(domain)) {
            console.log(`Rejected email for unknown domain: ${domain}`);
            return callback();
          }

          const message = await saveIncomingMessage(emailAddress, parsed);
          
          if (message) {
            console.log(`Message received for ${emailAddress}`);
            
            // Broadcast to all clients listening to this email
            wss.clients.forEach(client => {
              if (
                client.readyState === WebSocket.OPEN && 
                client.email === emailAddress
              ) {
                client.send(JSON.stringify({
                  type: 'new-message',
                  data: message
                }));
                console.log(`Broadcasted to ${emailAddress}`);
              }
            });
          }
          
          callback();
        } catch (error) {
          console.error('Error processing message:', error);
          callback(error);
        }
      });
    }
  });

  smtpServer.listen(2525, () => {
    console.log('SMTP server running on port 2525');
  });
};

module.exports = { startSMTPServer };