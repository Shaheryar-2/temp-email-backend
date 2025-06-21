FROM node:20

WORKDIR /app

# Copy only necessary files first for caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Install nodemon globally (optional if used for dev)
RUN npm install -g nodemon

# Copy rest of the app
COPY . .

# Expose the ports
EXPOSE 5000 2525 8080

# Start the app
CMD ["npm", "run", "dev"]

# for removing already build dockerize containers
# docker-compose down --volumes --remove-orphans
# docker system prune -af --volumes
# docker-compose up --build

