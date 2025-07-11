# AnimaGen Production Dockerfile
# Multi-stage build for optimized production image

# =============================================================================
# Build Stage - Frontend
# =============================================================================
FROM node:18-alpine AS frontend-builder

# Install build dependencies
RUN apk add --no-cache python3 make g++

WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package*.json ./

# Install ALL dependencies (including dev dependencies needed for build)
RUN npm ci

# Copy frontend source
COPY frontend/ ./

# Build frontend for production
RUN npm run build

# =============================================================================
# Build Stage - Backend Dependencies
# =============================================================================
FROM node:18-alpine AS backend-builder

WORKDIR /app/backend

# Copy backend package files
COPY backend/package*.json ./

# Install backend dependencies (production only for backend)
RUN npm ci --omit=dev

# =============================================================================
# Production Stage
# =============================================================================
FROM node:18-alpine AS production

# Install FFmpeg and other system dependencies
RUN apk add --no-cache \
    ffmpeg \
    && rm -rf /var/cache/apk/*

# Create app user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S animagen -u 1001

WORKDIR /app

# Copy backend dependencies
COPY --from=backend-builder /app/backend/node_modules ./node_modules

# Copy backend source code
COPY backend/ ./

# Copy built frontend to backend public directory
COPY --from=frontend-builder /app/frontend/dist ./public

# Create necessary directories with proper permissions
RUN mkdir -p output uploads logs compositions && \
    chown -R animagen:nodejs /app && \
    chmod -R 755 /app

# Switch to non-root user
USER animagen

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Expose port
EXPOSE 3001

# Set environment variables
ENV NODE_ENV=production \
    PORT=3001 \
    OUTPUT_DIR=output \
    TEMP_DIR=uploads

# Start the application
CMD ["node", "index.js"]
