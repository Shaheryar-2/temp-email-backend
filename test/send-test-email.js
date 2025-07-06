const nodemailer = require('nodemailer');
const path = require('path');

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

  // Use your specific PDF file path
  const pdfPath = 'assets/images/real_time_reception.png';

  try {
    const info = await transporter.sendMail({
      from: '"Test Sender" <testsender@example.com>',
      to: '78329a26@quickinbox.net',
      subject: 'SHHABAZ KI EMAIL',
      text: 'Please find the attached PDF file.',
      // html: `
        
      //   <p>This email was sent for testing purposes.</p>
      // `,
      attachments: [
        {
          filename: 'sample.pdf', // You can rename it here if needed
          path: pdfPath,
          contentType: 'application/pdf'
        }
      ]
    });
    
    console.log('Email sent successfully:', info.messageId);
    console.log('Attachment included:', pdfPath);
  } catch (error) {
    console.error('Failed to send email:', error);
    
    // Check if file exists
    const fs = require('fs');
    if (!fs.existsSync(pdfPath)) {
      console.error('Attachment file not found at:', pdfPath);
    }
  }
}

sendTest();