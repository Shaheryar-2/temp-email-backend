const { SMTPServer } = require('smtp-server');
const { simpleParser } = require('mailparser');
const { saveIncomingMessage } = require('../controllers/emailController');
const DOMAINS = require('../config/domains');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

let smtpServer;

const startSMTPServer = (wss) => {
  const keyPath = '/etc/letsencrypt/live/mail.tempmailbox.org/privkey.pem';
  const certPath = '/etc/letsencrypt/live/mail.tempmailbox.org/fullchain.pem';

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
      console.log("📡 SMTP connection received");
      console.log("📧 RCPT TO:", session.envelope?.rcptTo);
      console.log("✉️ MAIL FROM:", session.envelope?.mailFrom);

      simpleParser(stream, async (err, parsed) => {
        if (err) {
          console.error("❌ simpleParser error:", err);
          return callback(err);
        }
        
        console.log("📜 Parsed email subject:", parsed.subject);
        console.log("📜 Parsed email from:", parsed.from?.text);
        console.log("📜 Parsed email to:", parsed.to?.text);
        
        try {
          const emailAddress = session.envelope.rcptTo[0].address.toLowerCase();
          console.log("🔍 Final recipient email address:", emailAddress);
          
          const domainParts = emailAddress.split('@');
          console.log("🌐 Domain parts:", domainParts);

          const rootDomain = domainParts[1].split('.').slice(-2).join('.');
          console.log("🌐 Root domain:", rootDomain);
          
          if (!DOMAINS.includes(rootDomain)) {
            console.log(`🚫 Rejected email for domain: ${domain} (root: ${rootDomain})`);
            return callback();
          }

          console.log("💾 Saving incoming message...");
          const message = await saveIncomingMessage(emailAddress, parsed, parsed.from?.text, parsed.from?.text);

          if (message) {
            console.log(`📩 Message saved for ${emailAddress}`);
            wss.clients.forEach(client => {
              if (client.readyState === WebSocket.OPEN && client.email === emailAddress) {
                console.log(`📤 Broadcasting to ${emailAddress}`);
                client.send(JSON.stringify({
                  type: 'new-message',
                  data: message
                }));
              }
            });
          }

          callback();
        } catch (error) {
          console.error("💥 Error processing email:", error);
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