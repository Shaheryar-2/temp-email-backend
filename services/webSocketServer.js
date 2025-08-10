const WebSocket = require('ws');

module.exports = {
  startWebSocketServer: (server) => {
    const wss = new WebSocket.Server({ server });

    wss.on('connection', (ws, req) => {
      // Always use a dummy base to avoid relying on Host header
      const url = new URL(req.url, 'http://dummy');
      const email = url.searchParams.get('email');

      ws.email = email;
      console.log(`New WebSocket connection for: ${email}`);

      ws.on('message', (message) => {
        console.log(`Received message from ${email}: ${message}`);
      });

      ws.on('close', () => {
        console.log(`Connection closed for: ${email}`);
      });
    });

    console.log('WebSocket server started');
    return wss;
  }
};
