// backend/services/smtpServer.js
const { SMTPServer } = require('smtp-server');
const { simpleParser } = require('mailparser');
const { saveIncomingMessage } = require('../controllers/emailController');
const DOMAINS = require('../config/domains'); // expected e.g. ['karad.life','ioasd.xyz']
const WebSocket = require('ws');
const fs = require('fs');

let smtpServerTls;
let smtpServerPlain;

function safeExists(p) { try { return fs.existsSync(p); } catch (e) { return false; } }

// -------------------- Rate limiter (per IP) --------------------
const RATE_WINDOW_MS = Number(process.env.RATE_WINDOW_MS || 60_000); // window size (ms)
const RATE_MAX_MSGS_PER_WINDOW = Number(process.env.RATE_MAX_MSGS_PER_WINDOW || 60); // max messages per IP per window
const ipTimestamps = new Map(); // ip -> array of epoch ms timestamps

function pruneWindow(arr, windowMs) {
  const cutoff = Date.now() - windowMs;
  while (arr.length && arr[0] < cutoff) arr.shift();
}

function allowIpMessage(ip) {
  if (!ip) return true;
  // normalize ipv4-mapped ipv6: ::ffff:1.2.3.4
  if (ip.startsWith('::ffff:')) ip = ip.replace('::ffff:', '');
  let arr = ipTimestamps.get(ip);
  if (!arr) {
    arr = [];
    ipTimestamps.set(ip, arr);
  }
  pruneWindow(arr, RATE_WINDOW_MS);
  if (arr.length >= RATE_MAX_MSGS_PER_WINDOW) return false;
  arr.push(Date.now());
  return true;
}

// periodic cleanup (keeps memory small)
setInterval(() => {
  const cutoff = Date.now() - RATE_WINDOW_MS;
  for (const [k, arr] of ipTimestamps.entries()) {
    pruneWindow(arr, RATE_WINDOW_MS);
    if (arr.length === 0) ipTimestamps.delete(k);
  }
}, RATE_WINDOW_MS);

// -------------------- Helper: domain check --------------------
function rootDomainFrom(address) {
  if (!address) return '';
  const parts = address.split('@')[1];
  if (!parts) return '';
  const partsArr = parts.split('.');
  if (partsArr.length >= 2) return partsArr.slice(-2).join('.');
  return parts;
}

// -------------------- SMTP server start --------------------
const startSMTPServer = (wss) => {
  const keyPath = '/etc/letsencrypt/live/mail.tempmailbox.org/privkey.pem';
  const certPath = '/etc/letsencrypt/live/mail.tempmailbox.org/fullchain.pem';
  const tlsAvailable = safeExists(keyPath) && safeExists(certPath);

  if (!tlsAvailable) {
    console.warn('⚠️ TLS certs not found at /etc/letsencrypt/live/mail.tempmailbox.org/. SMTPS (465) won\'t start.');
  }

  // RCPT-time handler (validate domain + IP rate-limiting)
  async function onRcptTo(address, session, callback) {
    try {
      const rcpt = (address.address || '').toLowerCase();
      const clientIp = (session.remoteAddress || (session.connection && session.connection.remoteAddress) || '').toString();
      console.log(`RCPT TO: ${rcpt} from IP: ${clientIp}`);

      // domain check
      const root = rootDomainFrom(rcpt);
      if (!root || !DOMAINS.includes(root)) {
        console.warn(`Rejected RCPT: domain not served (${root}) for ${rcpt}`);
        // 550 permanent failure for recipient not handled by this MTA
        return callback(new Error('550 5.1.1 Recipient domain not accepted here'));
      }

      // rate-limit by IP (messages)
      if (!allowIpMessage(clientIp)) {
        console.warn(`Rate limit exceeded for IP ${clientIp} (rcpt ${rcpt})`);
        // 450 temporary failure - ask sender to retry later
        return callback(new Error('450 4.7.1 Rate limit exceeded, try again later'));
      }

      // Accept RCPT
      return callback();
    } catch (err) {
      console.error('Error in onRcptTo:', err);
      return callback(new Error('451 4.3.0 Internal server error'));
    }
  }

  // onData: parse and save (only reached for accepted RCPT)
  async function onData(stream, session, callback) {
    const rcpts = session.envelope && session.envelope.rcptTo ? session.envelope.rcptTo.map(r => r.address) : [];
    const clientIp = (session.remoteAddress || (session.connection && session.connection.remoteAddress) || '').toString();

    console.log(`📡 [DATA] incoming message from ${session.envelope && session.envelope.mailFrom ? session.envelope.mailFrom.address : 'unknown'} ip=${clientIp} rcpts=${JSON.stringify(rcpts)}`);

    simpleParser(stream, async (err, parsed) => {
      if (err) {
        console.error('❌ simpleParser error:', err);
        return callback(err);
      }

      try {
        // We support multiple RCPTs but your app likely expects a single
        for (const r of rcpts) {
          const rcptLower = (r || '').toLowerCase();
          const root = rootDomainFrom(rcptLower);
          if (!root || !DOMAINS.includes(root)) {
            console.log(`Skipping save: ${rcptLower} not a supported domain (${root})`);
            continue; // don't save or broadcast
          }

          console.log('Parsed subject:', parsed.subject);
          // call your controller to save into DB
          const message = await saveIncomingMessage(rcptLower, parsed, parsed.from?.text || session.envelope.mailFrom?.address, parsed.from?.text);
          if (message) {
            console.log(`📩 Saved message for ${rcptLower} (id: ${message._id || '(no id)'}). Broadcasting to WS clients...`);
            wss.clients.forEach(client => {
              if (client.readyState === WebSocket.OPEN && client.email === rcptLower) {
                client.send(JSON.stringify({ type: 'new-message', data: message }));
              }
            });
          } else {
            console.log(`No mailbox found for ${rcptLower}; message not saved.`);
          }
        }

        return callback();
      } catch (e) {
        console.error('💥 Error processing message in onData:', e);
        return callback(new Error('451 4.3.0 Internal error saving message'));
      }
    });
  }

  // create plain SMTP server (port 25)
  smtpServerPlain = new SMTPServer({
    secure: false,
    authOptional: true,
    disabledCommands: ['AUTH'],
    onRcptTo,
    onData
  });

  smtpServerPlain.on('error', err => console.error('SMTP plain error:', err));
  smtpServerPlain.listen(25, () => console.log('✅ SMTP (plain) listening on port 25'));

  // SMTPS (implicit TLS on 465) if certs present
  if (tlsAvailable) {
    smtpServerTls = new SMTPServer({
      secure: true,
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
      authOptional: true,
      disabledCommands: ['AUTH'],
      onRcptTo,
      onData
    });
    smtpServerTls.on('error', err => console.error('SMTP TLS error:', err));
    smtpServerTls.listen(465, () => console.log('✅ SMTPS (implicit TLS) listening on port 465'));
  } else {
    console.log('ℹ️ SMTPS (465) not started because certs not available.');
  }
};

module.exports = { startSMTPServer };
