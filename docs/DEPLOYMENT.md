# Deployment Guide

> Complete guide for deploying AnimaGen to production environments.

## 🎯 Deployment Options

### 1. **Local Production**
- Single server deployment
- PM2 process management
- Local file storage

### 2. **Docker Deployment**
- Containerized application
- Easy scaling and management
- Consistent environments

### 3. **Cloud Deployment**
- Railway, Heroku, DigitalOcean
- Managed services
- Auto-scaling capabilities

### 4. **Self-Hosted**
- VPS or dedicated server
- Full control over environment
- Custom configurations

---

## 🚀 Local Production Deployment

### Prerequisites

```bash
# System requirements
- Ubuntu 20.04+ / CentOS 8+ / macOS 10.15+
- Node.js 18+
- FFmpeg 4.4+
- PM2 (process manager)
- Nginx (reverse proxy)
- 4GB+ RAM
- 20GB+ storage
```

### Installation Steps

1. **Prepare the server**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Install FFmpeg
   sudo apt install ffmpeg -y
   
   # Install PM2 globally
   sudo npm install -g pm2
   
   # Install Nginx
   sudo apt install nginx -y
   ```

2. **Clone and setup application**
   ```bash
   # Clone repository
   git clone https://github.com/GsusFC/anima.git
   cd anima
   
   # Install dependencies
   npm install
   cd backend && npm install && cd ..
   cd frontend && npm install && cd ..
   
   # Build frontend
   cd frontend && npm run build && cd ..
   
   # Copy built files to backend
   mkdir -p backend/public
   cp -r frontend/dist/* backend/public/
   ```

3. **Configure environment**
   ```bash
   # Create production environment file
   cp backend/.env.example backend/.env.production
   
   # Edit configuration
   nano backend/.env.production
   ```

   **Production Environment:**
   ```bash
   NODE_ENV=production
   PORT=3001
   
   # File directories
   OUTPUT_DIR=/var/animagen/output
   TEMP_DIR=/var/animagen/uploads
   
   # Security
   CORS_ORIGINS=https://yourdomain.com
   
   # Performance
   MAX_FILE_SIZE=104857600  # 100MB
   MAX_FILES=100
   
   # Optional Redis for queue processing
   REDIS_URL=redis://localhost:6379
   ```

4. **Create directories and set permissions**
   ```bash
   # Create application directories
   sudo mkdir -p /var/animagen/{output,uploads,logs}
   sudo chown -R $USER:$USER /var/animagen
   
   # Set proper permissions
   chmod 755 /var/animagen
   chmod 755 /var/animagen/{output,uploads,logs}
   ```

5. **Start with PM2**
   ```bash
   cd backend
   
   # Start application
   pm2 start ecosystem.config.js --env production
   
   # Save PM2 configuration
   pm2 save
   
   # Setup PM2 startup script
   pm2 startup
   sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp $HOME
   ```

6. **Configure Nginx**
   ```bash
   # Create Nginx configuration
   sudo nano /etc/nginx/sites-available/animagen
   ```

   **Nginx Configuration:**
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com www.yourdomain.com;
       
       # Redirect HTTP to HTTPS
       return 301 https://$server_name$request_uri;
   }
   
   server {
       listen 443 ssl http2;
       server_name yourdomain.com www.yourdomain.com;
       
       # SSL Configuration
       ssl_certificate /path/to/ssl/certificate.crt;
       ssl_certificate_key /path/to/ssl/private.key;
       
       # Security headers
       add_header X-Frame-Options DENY;
       add_header X-Content-Type-Options nosniff;
       add_header X-XSS-Protection "1; mode=block";
       
       # File upload limits
       client_max_body_size 100M;
       
       # Proxy to Node.js application
       location / {
           proxy_pass http://localhost:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
           
           # Timeouts for long-running exports
           proxy_connect_timeout 60s;
           proxy_send_timeout 300s;
           proxy_read_timeout 300s;
       }
       
       # Static file serving with caching
       location /output/ {
           alias /var/animagen/output/;
           expires 1h;
           add_header Cache-Control "public, immutable";
       }
   }
   ```

   ```bash
   # Enable site and restart Nginx
   sudo ln -s /etc/nginx/sites-available/animagen /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

---

## 🐳 Docker Deployment

### Dockerfile

```dockerfile
# Multi-stage build for production
FROM node:18-alpine AS builder

# Install FFmpeg
RUN apk add --no-cache ffmpeg

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY frontend/package*.json ./frontend/
COPY backend/package*.json ./backend/

# Install dependencies
RUN npm ci --only=production
RUN cd frontend && npm ci --only=production
RUN cd backend && npm ci --only=production

# Copy source code
COPY . .

# Build frontend
RUN cd frontend && npm run build

# Copy built frontend to backend public directory
RUN mkdir -p backend/public && cp -r frontend/dist/* backend/public/

# Production stage
FROM node:18-alpine AS production

# Install FFmpeg in production image
RUN apk add --no-cache ffmpeg

WORKDIR /app

# Copy built application
COPY --from=builder /app/backend ./

# Create necessary directories
RUN mkdir -p output uploads logs

# Set proper permissions
RUN chown -R node:node /app
USER node

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

EXPOSE 3001

CMD ["node", "index.js"]
```

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  animagen:
    build: .
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - PORT=3001
      - OUTPUT_DIR=output
      - TEMP_DIR=uploads
      - REDIS_URL=redis://redis:6379
    volumes:
      - animagen_output:/app/output
      - animagen_uploads:/app/uploads
      - animagen_logs:/app/logs
    depends_on:
      - redis
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - animagen
    restart: unless-stopped

volumes:
  animagen_output:
  animagen_uploads:
  animagen_logs:
  redis_data:
```

### Deployment Commands

```bash
# Build and start services
docker-compose up -d

# View logs
docker-compose logs -f animagen

# Scale application
docker-compose up -d --scale animagen=3

# Update application
docker-compose pull
docker-compose up -d

# Backup volumes
docker run --rm -v animagen_output:/data -v $(pwd):/backup alpine tar czf /backup/output-backup.tar.gz -C /data .
```

---

## ☁️ Cloud Deployment

### Railway Deployment

1. **Prepare for Railway**
   ```bash
   # Create railway.toml
   cat > railway.toml << EOF
   [build]
   builder = "NIXPACKS"
   
   [deploy]
   startCommand = "cd backend && npm start"
   healthcheckPath = "/api/health"
   healthcheckTimeout = 300
   restartPolicyType = "ON_FAILURE"
   restartPolicyMaxRetries = 10
   
   [env]
   NODE_ENV = "production"
   PORT = "3001"
   EOF
   ```

2. **Deploy to Railway**
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli
   
   # Login and deploy
   railway login
   railway init
   railway up
   ```

### Heroku Deployment

1. **Prepare for Heroku**
   ```json
   // Add to package.json
   {
     "scripts": {
       "heroku-postbuild": "cd backend && npm install && cd ../frontend && npm install && npm run build && mkdir -p ../backend/public && cp -r dist/* ../backend/public/"
     },
     "engines": {
       "node": "18.x"
     }
   }
   ```

2. **Deploy to Heroku**
   ```bash
   # Install Heroku CLI and login
   heroku login
   
   # Create application
   heroku create your-app-name
   
   # Add FFmpeg buildpack
   heroku buildpacks:add --index 1 https://github.com/jonathanong/heroku-buildpack-ffmpeg-latest.git
   heroku buildpacks:add --index 2 heroku/nodejs
   
   # Set environment variables
   heroku config:set NODE_ENV=production
   heroku config:set OUTPUT_DIR=output
   heroku config:set TEMP_DIR=uploads
   
   # Deploy
   git push heroku main
   ```

### DigitalOcean App Platform

```yaml
# .do/app.yaml
name: animagen
services:
- name: backend
  source_dir: /
  github:
    repo: GsusFC/anima
    branch: main
  run_command: cd backend && npm start
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  env:
  - key: NODE_ENV
    value: production
  - key: PORT
    value: "3001"
  - key: OUTPUT_DIR
    value: output
  - key: TEMP_DIR
    value: uploads
```

---

## 🔧 Production Configuration

### Environment Variables

```bash
# Required
NODE_ENV=production
PORT=3001

# File handling
OUTPUT_DIR=/var/animagen/output
TEMP_DIR=/var/animagen/uploads
MAX_FILE_SIZE=104857600
MAX_FILES=100

# Security
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Performance
FFMPEG_THREADS=4
MAX_CONCURRENT_JOBS=3

# Optional Redis
REDIS_URL=redis://localhost:6379

# Monitoring
LOG_LEVEL=info
ENABLE_METRICS=true
```

### PM2 Ecosystem Configuration

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'animagen',
    script: 'index.js',
    cwd: './backend',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development',
      PORT: 3001
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001,
      OUTPUT_DIR: '/var/animagen/output',
      TEMP_DIR: '/var/animagen/uploads'
    },
    error_file: '/var/animagen/logs/err.log',
    out_file: '/var/animagen/logs/out.log',
    log_file: '/var/animagen/logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }]
};
```

### Monitoring and Logging

```bash
# PM2 monitoring
pm2 monit

# View logs
pm2 logs animagen

# Application metrics
pm2 web

# System monitoring
htop
df -h
free -h
```

### Backup Strategy

```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/var/backups/animagen"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup output files
tar -czf $BACKUP_DIR/output_$DATE.tar.gz /var/animagen/output

# Backup application code
tar -czf $BACKUP_DIR/app_$DATE.tar.gz /path/to/anima

# Clean old backups (keep 7 days)
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
```

### SSL Certificate Setup

```bash
# Using Let's Encrypt with Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

---

## 🔍 Troubleshooting

### Common Issues

**FFmpeg not found:**
```bash
# Check FFmpeg installation
which ffmpeg
ffmpeg -version

# Install if missing
sudo apt install ffmpeg
```

**Permission errors:**
```bash
# Fix file permissions
sudo chown -R $USER:$USER /var/animagen
chmod -R 755 /var/animagen
```

**Memory issues:**
```bash
# Increase Node.js memory limit
node --max-old-space-size=2048 index.js

# Monitor memory usage
pm2 monit
```

**Port conflicts:**
```bash
# Check what's using port 3001
sudo lsof -i :3001

# Kill process if needed
sudo kill -9 <PID>
```

### Performance Optimization

```bash
# Enable gzip compression in Nginx
gzip on;
gzip_types text/plain application/json application/javascript text/css;

# Optimize PM2 cluster mode
pm2 start ecosystem.config.js --env production

# Monitor and tune based on usage
pm2 monit
```
