const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const connectDB = require('./config/db');
const emailRoutes = require('./routes/emailRoutes');
const helmet = require('helmet')
const messageRoutes = require('./routes/messageRoutes');
const { startSMTPServer } = require('./services/smtpServer');
const { startWebSocketServer } = require('./services/webSocketServer');
// import compression from 'compression'

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
// app.use(cors({
//   origin: 'https://www.tempmailbox.org',
//   credentials: true
// }));
app.use(cors())
app.use(bodyParser.json());
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://www.googletagmanager.com", // also whitelist third party for analystics etc here
        "https://www.google-analytics.com",
      ],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://www.google-analytics.com", "wss://www.tempmailbox.org"],
      frameAncestors: ["'none'"],
    },
  })
);

// Database connection
connectDB();

// Routes
app.use('/api/emails', emailRoutes);
app.use('/api/messages', messageRoutes);
// app.use(compression());

// Start servers
const server = app.listen(PORT, () => {
  console.log(`HTTP server running on port ${PORT}`);
  const wss = startWebSocketServer(server);
  startSMTPServer(wss);
});