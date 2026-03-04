# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application (generates static files in out/)
RUN npm run build

# Production stage - use nginx to serve static files
FROM nginx:alpine

# Copy built static files from builder
COPY --from=builder /app/out /usr/share/nginx/html

# Copy custom nginx config for Cloud Run
COPY nginx.conf /etc/nginx/nginx.conf

# Expose Cloud Run default port
EXPOSE 8080

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
