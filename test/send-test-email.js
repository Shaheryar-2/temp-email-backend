// test/send-test-email.js
const nodemailer = require('nodemailer');

async function sendTest() {
  const transporter = nodemailer.createTransport({
    host: 'localhost',
    port: 2525,
    secure: false,
    tls: {
      rejectUnauthorized: false // disable cert verification
    },
    connectionTimeout: 5000
  });

  try {
    const info = await transporter.sendMail({
      from: '"Test Sender" <test@example.com>',
      to: 'dca40e38@tempmail.app', // ✅ your target email
      subject: 'Integration Test',
      text: 'This is a test email',
    });
    console.log('Email sent:', info.messageId);
  } catch (error) {
    console.error('Failed to send email:', error);
  }
}

sendTest();