const WebSocket = require('ws');

module.exports = { startWebSocketServer: (server) => {
  const wss = new WebSocket.Server({ server });
  
  wss.on('connection', (ws, req) => {
    // Extract email from query parameters
    const url = new URL(req.url, `http://${req.headers.host}`);
    const email = url.searchParams.get('email');
    
    // Store email on the WebSocket connection
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
  return wss; // Return WebSocket server instance
}};