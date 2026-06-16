# Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files for dependency installation
COPY server/package*.json ./server/

# Install dependencies
RUN cd server && npm ci

# Copy the rest of the server code
COPY server/ ./server/

# Copy the static frontend code
COPY *.html ./
COPY *.css ./
COPY *.js ./
COPY assets/ ./assets/
COPY auth/ ./auth/

# Production Stage
FROM node:20-alpine

WORKDIR /app

# Set environment to production
ENV NODE_ENV=production

# Copy built artifacts from the builder stage
COPY --from=builder /app /app

# Expose the API and static server port
EXPOSE 5000

# Start the Node.js server
CMD ["node", "server/src/app.js"]
