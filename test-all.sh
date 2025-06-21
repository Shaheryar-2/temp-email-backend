#!/bin/bash

# Run With:
# chmod +x test-all.sh
# ./test-all.sh

# Exit on error
set -e

# Test API
echo "📡 Testing API server..."
API_RES=$(curl -s -X POST http://localhost:5000/api/emails)

# Check if jq is installed
if ! command -v jq &> /dev/null; then
  echo "❌ jq is not installed. Install it using: sudo apt install jq"
  exit 1
fi

EMAIL=$(echo "$API_RES" | jq -r '.email')
echo "✅ Created email: $EMAIL"

# Test SMTP
echo "📨 Sending test email..."
node -e "
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  host: 'localhost',
  port: 2525,
  secure: false,
  tls: { rejectUnauthorized: false }
});
transporter.sendMail({
  from: 'test@example.com',
  to: '$EMAIL',
  subject: 'Integration Test',
  text: 'This is an automated test'
}, (err, info) => {
  if (err) {
    console.error('❌ Error sending email:', err);
    process.exit(1);
  } else {
    console.log('✅ Email sent:', info.messageId);
  }
});
"

# Wait for processing
echo "⏳ Waiting for message to be stored..."
sleep 3

# Verify message
echo "📥 Checking messages for $EMAIL..."
curl -s http://localhost:5000/api/emails/$EMAIL/messages | jq .
