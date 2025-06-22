📧 Temp Email App
A disposable email service with custom SMTP, WebSocket, and REST API built with Node.js. Easily test and interact with temporary email flows via Docker or manual setup.

🚀 Features
✅ RESTful API for email interactions
📬 Custom SMTP server to receive and log emails
🔌 WebSocket server to stream real-time updates
🐳 Dockerized environment for instant startup

📦 Tech Stack
Node.js (API, SMTP, WebSocket), MongoDB (Database), Docker + Docker Compose, React

🧪 Local Setup
1. Clone the Repo
git clone https://github.com/YOUR_USERNAME/temp-email-app.git
cd temp-email-app
2. Run with Docker
# Requires Docker and Docker Compose installed.
docker-compose up --build
# 🛠 Manual Setup (Without Docker)
Use this if you're developing/debugging services independently.

Terminal 1: Start API Server
node app.js
Terminal 2: Start SMTP Server
node services/smtpServer.js
Terminal 3: Start WebSocket Server
node services/webSocketServer.js

<!-- To start all servers -->
<!-- npm start - to start all servers --> 

# 🔗 Endpoints & Ports
Service	Protocol	URL / Address
API Server	HTTP	http://localhost:5000
WebSocket	WS	ws://localhost:8080
SMTP Server	SMTP	localhost:2525

# Check servers running;
lsof -i :5000  # API server
lsof -i :2525  # SMTP server
lsof -i :8080  # WebSocket

# Test Email Creation API Endpoint
curl -X POST http://localhost:5000/api/emails
# Check Received Messages
curl http://localhost:5000/api/emails/$TEST_EMAIL/messages

# Test SMTP Server
nc localhost 2525
EHLO localhost

# Test MongoDB Connection
mongo --eval "db.runCommand({ping: 1})"

# Verify all services are running
For Docker: 
    docker-compose ps
For Manual:
    chmod +x test-all.sh
    ./test-all.sh

# Database Check:
docker exec -it backend_mongodb_1 mongosh
use disposable-email
> db.emails.find().pretty()
> db.emails.find()
> db.messages.find()

# Test all at once
- chmod +x test-all.sh
- ./test-all.sh

