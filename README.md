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
docker-compose up --build (in backend directory)
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


docker issues
# 1. to delete volumes
# docker-compose down --remove-orphans --volumes
# 2. docker system prune --all --volumes
# 3. docker-compose up


to login to vps commands locally:
ssh root@31.97.143.240
root password


if want to login on vps hostinger;
username: root
password: Miraz.457@..


-> Generate Private Key and Self-Signed Certificate
# Generate private key (4096-bit RSA)
openssl genrsa -out private.key 4096
# Create Certificate Signing Request (CSR)
openssl req -new -key private.key -out csr.pem -subj "/CN=mail.tempmailbox.org"
# Generate self-signed certificate (valid 365 days)
openssl x509 -req -days 365 -in csr.pem -signkey private.key -out certificate.crt
# Clean up CSR
rm csr.pem


Already saved PTR record name: srv949994.hstgr.cloud


# Create renewal script
sudo nano /etc/cron.weekly/certbot-renew
#!/bin/bash
certbot renew --quiet --post-hook "docker-compose -f /root/TempEmailApp/docker-compose.yml restart backend"
 then ->  Make executable:
bash
sudo chmod +x /etc/cron.weekly/certbot-renew


Nginx file:
sudo nano /etc/nginx/sites-available/tempmailbox.org



For certificates on VPS server:
root@srv949994:~/TempEmailApp# sudo systemctl stop nginx
root@srv949994:~/TempEmailApp# sudo ss -ltnp | grep ':80' || true
LISTEN 0      4096         0.0.0.0:8080       0.0.0.0:*    users:(("docker-proxy",pid=19115,fd=4))  
LISTEN 0      4096            [::]:8080          [::]:*    users:(("docker-proxy",pid=19121,fd=4))  
root@srv949994:~/TempEmailApp# sudo certbot certonly --standalone \
  -d tempmailbox.org -d www.tempmailbox.org \
  -m sharymirza457@gmail.com --agree-tos --no-eff-email
Saving debug log to /var/log/letsencrypt/letsencrypt.log
Requesting a certificate for tempmailbox.org and www.tempmailbox.org

Successfully received certificate.
Certificate is saved at: /etc/letsencrypt/live/tempmailbox.org/fullchain.pem
Key is saved at:         /etc/letsencrypt/live/tempmailbox.org/privkey.pem
This certificate expires on 2025-11-08.
These files will be updated when the certificate renews.
Certbot has set up a scheduled task to automatically renew this certificate in the background.

- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
If you like Certbot, please consider supporting our work by:
 * Donating to ISRG / Let's Encrypt:   https://letsencrypt.org/donate
 * Donating to EFF:                    https://eff.org/donate-le
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
root@srv949994:~/TempEmailApp# sudo systemctl start nginx
root@srv949994:~/TempEmailApp# sudo certbot certificates
Saving debug log to /var/log/letsencrypt/letsencrypt.log

- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
Found the following certs:
  Certificate Name: mail.tempmailbox.org
    Serial Number: 6274993d1c4b3a3c362452605b1f3ef96a9
    Key Type: RSA
    Domains: mail.tempmailbox.org
    Expiry Date: 2025-11-08 08:11:38+00:00 (VALID: 89 days)
    Certificate Path: /etc/letsencrypt/live/mail.tempmailbox.org/fullchain.pem
    Private Key Path: /etc/letsencrypt/live/mail.tempmailbox.org/privkey.pem
  Certificate Name: tempmailbox.org
    Serial Number: 69c3f5e8ea06a15a8ddbbf3d0fe7843f9d8
    Key Type: RSA
    Domains: tempmailbox.org www.tempmailbox.org
    Expiry Date: 2025-11-08 15:30:49+00:00 (VALID: 89 days)
    Certificate Path: /etc/letsencrypt/live/tempmailbox.org/fullchain.pem
    Private Key Path: /etc/letsencrypt/live/tempmailbox.org/privkey.pem
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
root@srv949994:~/TempEmailApp# 