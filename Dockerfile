# AnimaGen - Professional Animation Tool
FROM node:18-bullseye

# Install FFmpeg and system dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Install dependencies
RUN cd backend && npm ci --only=production
RUN cd frontend && npm ci

# Copy source code
COPY backend/ ./backend/
COPY frontend/ ./frontend/

# Build frontend
RUN cd frontend && npm run build

# Move built frontend to backend public folder
RUN mkdir -p backend/public && cp -r frontend/dist/* backend/public/

# Clean up to reduce image size
RUN rm -rf frontend/node_modules frontend/src

# Create necessary directories
RUN mkdir -p backend/temp backend/output backend/compositions

# Expose port
EXPOSE 3001

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001

# Start the application
CMD ["node", "backend/index.js"]
