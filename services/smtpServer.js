const { SMTPServer } = require('smtp-server');
const { simpleParser } = require('mailparser');
const { saveIncomingMessage } = require('../controllers/emailController');
const DOMAINS = require('../config/domains');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

let smtpServer;

const startSMTPServer = (wss) => {
  const keyPath = path.join(__dirname, '../certs/private.key');
  const certPath = path.join(__dirname, '../certs/certificate.crt');

  // Verify certificates exist
  if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
    console.error('❌ SSL certificates missing in backend/certs directory');
    console.error('Generate them using:');
    console.error('openssl genrsa -out private.key 4096');
    console.error('openssl req -new -key private.key -out csr.pem -subj "/CN=mail.tempmailbox.org"');
    console.error('openssl x509 -req -days 365 -in csr.pem -signkey private.key -out certificate.crt');
    process.exit(1);
  }

  smtpServer = new SMTPServer({
    secure: true,
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath),
    authOptional: true,
    disabledCommands: ['AUTH'],
    onData(stream, session, callback) {
      simpleParser(stream, async (err, parsed) => {
        if (err) return callback(err);

        try {
          const emailAddress = session.envelope.rcptTo[0].address.toLowerCase();
          const domainParts = emailAddress.split('@');
          
          if (domainParts.length !== 2) {
            console.log(`⚠️ Invalid email: ${emailAddress}`);
            return callback();
          }
          
          const domain = domainParts[1];
          const rootDomain = domain.split('.').slice(-2).join('.');
          
          if (!DOMAINS.includes(rootDomain)) {
            console.log(`🚫 Rejected email for domain: ${domain} (root: ${rootDomain})`);
            return callback();
          }
          
          const sender = parsed.from?.value?.[0]?.address || 
                         session.envelope.mailFrom?.address || 
                         'unknown@example.com';
          const senderName = parsed.from?.value?.[0]?.name || 
                             parsed.from?.text || 
                             'Unknown Sender';

          const message = await saveIncomingMessage(emailAddress, parsed, sender, senderName);

          if (message) {
            console.log(`📩 New message for ${emailAddress}`);
            
            // Broadcast to clients
            wss.clients.forEach(client => {
              if (client.readyState === WebSocket.OPEN && client.email === emailAddress) {
                client.send(JSON.stringify({
                  type: 'new-message',
                  data: message
                }));
                console.log(`📤 Broadcasted to ${emailAddress}`);
              }
            });
          }
          
          callback();
        } catch (error) {
          console.error('💥 Processing error:', error);
          callback(error);
        }
      });
    }
  });

  smtpServer.on('error', err => {
    console.error('🔥 SMTP Server Error:', err);
  });

  smtpServer.listen(465, () => {
    console.log('✅ Secure SMTP server running on port 465');
  });
};

module.exports = { startSMTPServer };