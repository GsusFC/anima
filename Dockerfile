FROM node:20-bullseye

# Install FFmpeg and build dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy and install backend dependencies
COPY backend/package*.json ./backend/
RUN cd backend && npm install --only=production

# Copy frontend package files
COPY frontend/package*.json ./frontend/
COPY frontend/.npmrc ./frontend/

# Install frontend dependencies with proper native modules
RUN cd frontend && \
    npm ci && \
    npm rebuild

# Copy source code
COPY backend/ ./backend/
COPY frontend/ ./frontend/

# Build frontend with explicit architecture
RUN cd frontend && \
    npm run build && \
    mkdir -p ../backend/public && \
    cp -r dist/* ../backend/public/

# Create runtime directories
RUN mkdir -p backend/temp backend/output backend/compositions

# Clean up build dependencies
RUN apt-get remove -y python3 make g++ && apt-get autoremove -y

EXPOSE 3001
ENV NODE_ENV=production

CMD ["node", "backend/index.js"]
