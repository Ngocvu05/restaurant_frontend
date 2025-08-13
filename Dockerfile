# ===== Build Stage =====
FROM node:20-alpine AS build
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci && npm cache clean --force

# Copy source code
COPY . .

# Build the React app
RUN npm run build

# ===== Runtime Stage =====
FROM nginx:alpine

# Install curl for health checks
RUN apk add --no-cache curl

WORKDIR /usr/share/nginx/html

# Remove default nginx content
RUN rm -rf /usr/share/nginx/html/*

# Copy build output (React build -> html root)
COPY --from=build /app/build ./

# Copy nginx configuration template
COPY ./nginx/default.conf /etc/nginx/templates/default.conf
COPY ./nginx/nginx.conf /etc/nginx/nginx.conf

# Copy health check script
COPY ./nginx/healthcheck.sh /usr/local/bin/healthcheck.sh
RUN chmod +x /usr/local/bin/healthcheck.sh

# Create logs directory
RUN mkdir -p /var/log/nginx

# Set environment variables with defaults
ENV API_GATEWAY_HOST=api-gateway
ENV API_GATEWAY_PORT=8080
ENV SERVER_NAME=localhost

# Expose ports
EXPOSE 80 443

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD /usr/local/bin/healthcheck.sh

# Start nginx
CMD ["nginx", "-g", "daemon off;"]