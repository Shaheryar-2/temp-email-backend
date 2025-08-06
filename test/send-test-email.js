const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

async function sendTest() {
  const transporter = nodemailer.createTransport({
    host: 'localhost',
    port: 2525,
    secure: false,
    tls: {
      rejectUnauthorized: false
    },
    connectionTimeout: 5000
  });

  // Get absolute path to the PDF file
  const pdfPath = path.resolve(__dirname, '../assets/images/sample_pdf.pdf');
  
  try {
    // Check if file exists
    if (!fs.existsSync(pdfPath)) {
      throw new Error(`PDF file not found at: ${pdfPath}`);
    }

    const info = await transporter.sendMail({
      from: '"Test Sender" <testsender@example.com>',
      to: '2546c6f7@quickinbox.net',
      subject: 'TEST EMAIL WITH ATTACHMENT',
      text: 'This is a test email with attachment',
      html: '<p>This is a <b>test email</b> with attachment</p>',
      attachments: [
        // {
        //   filename: 'sample_pdf.pdf',
        //   path: pdfPath,
        //   contentType: 'application/pdf'
        // }
        {
          filename: 'text1.txt',
          content: 'Hello Shahbaz'
        },
         {
          filename: "buffer.txt",
          content: Buffer.from("Hello world!", "utf8"),
        },
        {
          filename: "report.pdf",
          path: pdfPath,
        },
      ]
    });
    
    console.log('Email sent successfully:', info.messageId);
    console.log('Attachment sent:', pdfPath);
  } catch (error) {
    console.error('Failed to send email:', error);
    
    if (error.code === 'ENOENT') {
      console.error(`File not found: ${pdfPath}`);
    }
  }
}

sendTest();