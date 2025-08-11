const { SMTPServer } = require('smtp-server');
const { simpleParser } = require('mailparser');
const { saveIncomingMessage } = require('../controllers/emailController');
const DOMAINS = require('../config/domains');
const WebSocket = require('ws');
const fs = require('fs');

let smtpServerTls;
let smtpServerPlain;

function safeExists(p){ try { return fs.existsSync(p); } catch(e){ return false;} }

const startSMTPServer = (wss) => {
  const keyPath = '/etc/letsencrypt/live/mail.tempmailbox.org/privkey.pem';
  const certPath = '/etc/letsencrypt/live/mail.tempmailbox.org/fullchain.pem';

  const tlsAvailable = safeExists(keyPath) && safeExists(certPath);

  if (!tlsAvailable) {
    console.warn('⚠️ TLS certs not found at /etc/letsencrypt/live/mail.tempmailbox.org/. Will still start plain SMTP on port 25 for inbound delivery.');
    console.warn('If you want SMTPS (465), ensure certs are mounted into the container at /etc/letsencrypt/live/mail.tempmailbox.org/*');
  }

  // Plain SMTP on port 25 (accepts incoming SMTP from other MTAs)
  smtpServerPlain = new SMTPServer({
    secure: false,
    authOptional: true,
    disabledCommands: ['AUTH'],
    onData(stream, session, callback) {
      console.log('📡 [25] SMTP connection received:', session.envelope && session.envelope.rcptTo ? session.envelope.rcptTo.map(r=>r.address) : session.envelope);
      simpleParser(stream, async (err, parsed) => {
        if (err) { console.error('simpleParser error', err); return callback(err); }
        try {
          const rcpt = session.envelope && session.envelope.rcptTo && session.envelope.rcptTo[0] && session.envelope.rcptTo[0].address;
          if(!rcpt){
            console.warn('No rcpt found in session.envelope', session.envelope);
            return callback();
          }
          console.log('Parsed subject:', parsed.subject);
          const message = await saveIncomingMessage(rcpt.toLowerCase(), parsed, parsed.from?.text || session.envelope.mailFrom?.address, parsed.from?.text);
          if (message) {
            console.log(`📩 Saved message for ${rcpt}`);
            wss.clients.forEach(client => {
              if (client.readyState === WebSocket.OPEN && client.email === rcpt.toLowerCase()) {
                client.send(JSON.stringify({ type: 'new-message', data: message }));
              }
            });
          }
          callback();
        } catch (e) {
          console.error('Error processing email [25]:', e);
          callback(e);
        }
      });
    }
  });

  smtpServerPlain.on('error', err => console.error('SMTP plain error', err));
  smtpServerPlain.listen(25, () => console.log('✅ SMTP (plain) listening on port 25'));

  // SMTPS (implicit TLS) on 465 if certs present
  if (tlsAvailable) {
    smtpServerTls = new SMTPServer({
      secure: true,
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
      authOptional: true,
      disabledCommands: ['AUTH'],
      onData: smtpServerPlain.options.onData // reuse same handler
    });
    smtpServerTls.on('error', err => console.error('SMTP TLS error', err));
    smtpServerTls.listen(465, () => console.log('✅ SMTPS (implicit TLS) listening on port 465'));
  } else {
    console.log('ℹ️ SMTPS (465) not started because certs not available.');
  }
};

module.exports = { startSMTPServer };
