# AnimaGen - Professional Animation Tool
# Use Node.js 18 base image with FFmpeg
FROM node:18-bullseye

# Metadata
LABEL maintainer="GsusFC"
LABEL description="AnimaGen - Professional animation creation tool"

# Install FFmpeg and other dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install root dependencies (main deps are in backend)
RUN npm install --production

# Copy backend
COPY backend/ ./backend/
RUN cd backend && npm install --production

# Copy frontend
COPY frontend/ ./frontend/
RUN cd frontend && npm install && npm run build

# Move frontend build to backend public folder
RUN mkdir -p backend/public && cp -r frontend/dist/* backend/public/

# Clean up frontend source (keep only built files)
RUN rm -rf frontend/src frontend/node_modules

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3001/api/health || exit 1

# Set environment
ENV NODE_ENV=production

# Start the application
CMD ["node", "backend/index.js"]
