const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const connectDB = require('./config/db');
const emailRoutes = require('./routes/emailRoutes');
const messageRoutes = require('./routes/messageRoutes');
const { startSMTPServer } = require('./services/smtpServer');
const { startWebSocketServer } = require('./services/webSocketServer');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Database connection
connectDB();

// Routes
app.use('/api/emails', emailRoutes);
app.use('/api/messages', messageRoutes);

// Start servers
const server = app.listen(PORT, () => {
  console.log(`HTTP server running on port ${PORT}`);
  const wss = startWebSocketServer(server);
  startSMTPServer(wss);
});