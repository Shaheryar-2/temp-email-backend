const WebSocket = require('ws')

const clients = new Map()

let wss

const startWebSocketServer = (httpServer) => {
  wss = new WebSocket.Server({ server: httpServer })
  
  wss.on('connection', (ws) => {
    console.log('New WebSocket client connected')
    
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message)
        if (data.type === 'subscribe' && data.email) {
          if (!clients.has(data.email)) {
            clients.set(data.email, new Set())
          }
          clients.get(data.email).add(ws)
          console.log(`Client subscribed to ${data.email}`)
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error)
      }
    })

    ws.on('close', () => {
      for (const [email, sockets] of clients.entries()) {
        if (sockets.has(ws)) {
          sockets.delete(ws)
          if (sockets.size === 0) {
            clients.delete(email)
          }
        }
      }
      console.log('WebSocket client disconnected')
    })
  })
}

const broadcastNewMessage = (emailAddress, message) => {
  if (clients.has(emailAddress)) {
    clients.get(emailAddress).forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'new-message',
          data: message
        }))
      }
    })
  }
}

module.exports = { 
  startWebSocketServer,
  broadcastNewMessage
}