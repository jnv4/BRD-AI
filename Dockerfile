# Use lightweight Node image
FROM node:20-alpine

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy source code
COPY . .

# Cloud Run uses PORT env variable
ENV PORT=8080

# Expose port
EXPOSE 8080

# Start using package.json start script
CMD ["npm", "start"]
