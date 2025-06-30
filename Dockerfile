FROM node:20-bullseye

# Install FFmpeg
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy and install backend dependencies
COPY backend/package*.json ./backend/
RUN cd backend && npm install

# Copy and install frontend dependencies  
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm install

# Copy source code
COPY backend/ ./backend/
COPY frontend/ ./frontend/

# Build frontend and move to backend public folder
RUN cd frontend && npm run build && \
    mkdir -p ../backend/public && \
    cp -r dist/* ../backend/public/

# Create runtime directories
RUN mkdir -p backend/temp backend/output backend/compositions

EXPOSE 3001
ENV NODE_ENV=production

CMD ["node", "backend/index.js"]
