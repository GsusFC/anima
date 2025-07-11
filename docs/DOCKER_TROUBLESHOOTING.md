# Docker Troubleshooting Guide

> Solutions for common Docker build and runtime issues with AnimaGen.

## 🚨 Common Build Issues

### Issue 1: `tsc: not found` during frontend build

**Error:**
```
sh: tsc: not found
✕ [frontend-builder 6/6] RUN npm run build 
process "/bin/sh -c npm run build" did not complete successfully: exit code: 127
```

**Cause:** Using `npm ci --only=production` doesn't install dev dependencies needed for TypeScript compilation.

**Solution:**
```dockerfile
# ❌ Wrong - excludes dev dependencies
RUN npm ci --only=production

# ✅ Correct - includes dev dependencies for build
RUN npm ci
```

**Fixed in:** The current Dockerfile uses `npm ci` for frontend build stage.

### Issue 2: Backend build fails with exit code 137

**Error:**
```
✕ [backend-builder 4/4] RUN npm ci --only=production 
process "/bin/sh -c npm ci --only=production" did not complete successfully: exit code: 137
```

**Cause:** Memory limit exceeded during npm install.

**Solutions:**
1. **Increase Docker memory limit:**
   ```bash
   # Docker Desktop: Settings > Resources > Memory > 4GB+
   ```

2. **Use npm ci with memory optimization:**
   ```dockerfile
   RUN npm ci --omit=dev --maxsockets 1
   ```

3. **Alternative package manager:**
   ```dockerfile
   RUN yarn install --production --frozen-lockfile
   ```

### Issue 3: Build context too large

**Error:**
```
ERROR: failed to build: failed to solve: failed to read dockerfile: failed to load cache key
```

**Cause:** Large files in build context (node_modules, output files, etc.).

**Solution:** Update `.dockerignore`:
```dockerignore
# Dependencies
node_modules/
*/node_modules/

# Build outputs
frontend/dist/
backend/output/
backend/uploads/
backend/logs/
backend/temp/

# Development files
*.log
.env.local
.env.development
coverage/
.nyc_output/

# OS files
.DS_Store
Thumbs.db
```

### Issue 4: FFmpeg not found in container

**Error:**
```
Error: FFmpeg not found. Please install FFmpeg
```

**Cause:** FFmpeg not installed in the Alpine image.

**Solution:** Ensure FFmpeg installation in Dockerfile:
```dockerfile
RUN apk add --no-cache ffmpeg
```

**Verify installation:**
```bash
docker run --rm animagen:latest ffmpeg -version
```

## 🔧 Runtime Issues

### Issue 1: Permission denied errors

**Error:**
```
Error: EACCES: permission denied, mkdir '/app/output'
```

**Cause:** Incorrect file permissions in container.

**Solution:**
```dockerfile
# Create directories with proper permissions
RUN mkdir -p output uploads logs compositions && \
    chown -R animagen:nodejs /app && \
    chmod -R 755 /app

# Switch to non-root user
USER animagen
```

### Issue 2: Port already in use

**Error:**
```
Error: listen EADDRINUSE: address already in use :::3001
```

**Solutions:**
1. **Check running containers:**
   ```bash
   docker ps
   docker stop <container-id>
   ```

2. **Use different port:**
   ```bash
   docker run -p 3002:3001 animagen:latest
   ```

3. **Kill process using port:**
   ```bash
   lsof -ti:3001 | xargs kill -9
   ```

### Issue 3: Out of memory errors

**Error:**
```
<--- Last few GCs --->
[1:0x5555] JavaScript heap out of memory
```

**Solutions:**
1. **Increase Node.js memory:**
   ```dockerfile
   CMD ["node", "--max-old-space-size=2048", "index.js"]
   ```

2. **Increase Docker memory limit:**
   ```bash
   docker run -m 2g animagen:latest
   ```

## 🐳 Docker Compose Issues

### Issue 1: Services fail to start

**Error:**
```
ERROR: Service 'animagen' failed to build
```

**Debug steps:**
```bash
# Check logs
docker-compose logs animagen

# Build manually
docker-compose build --no-cache animagen

# Start with verbose output
docker-compose up --build
```

### Issue 2: Volume mount issues

**Error:**
```
Error: ENOENT: no such file or directory
```

**Solution:** Ensure volumes exist:
```yaml
volumes:
  - ./backend/output:/app/output
  - ./backend/uploads:/app/uploads
```

**Create directories:**
```bash
mkdir -p backend/{output,uploads,logs}
```

## 🔍 Debugging Commands

### Build Debugging
```bash
# Build with no cache
docker build --no-cache -t animagen:debug .

# Build specific stage
docker build --target frontend-builder -t animagen:frontend .

# Inspect build layers
docker history animagen:latest

# Check build context size
docker build --dry-run .
```

### Runtime Debugging
```bash
# Run with shell access
docker run -it --entrypoint /bin/sh animagen:latest

# Check container logs
docker logs <container-id>

# Inspect running container
docker exec -it <container-id> /bin/sh

# Check container resources
docker stats <container-id>
```

### Network Debugging
```bash
# Check container networking
docker network ls
docker network inspect bridge

# Test connectivity
docker run --rm --network container:<container-id> nicolaka/netshoot
```

## 🛠 Performance Optimization

### Multi-stage Build Optimization
```dockerfile
# Use specific Node.js version
FROM node:18.17-alpine AS frontend-builder

# Optimize layer caching
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
```

### Image Size Optimization
```dockerfile
# Remove unnecessary packages
RUN apk add --no-cache --virtual .build-deps \
    python3 make g++ && \
    npm ci && \
    apk del .build-deps

# Use .dockerignore effectively
# Clean up in same layer
RUN npm ci && npm cache clean --force
```

### Build Speed Optimization
```bash
# Use BuildKit
export DOCKER_BUILDKIT=1
docker build .

# Parallel builds
docker build --build-arg BUILDKIT_INLINE_CACHE=1 .
```

## 📊 Monitoring and Health Checks

### Health Check Configuration
```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"
```

### Container Monitoring
```bash
# Monitor resource usage
docker stats --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"

# Check health status
docker inspect --format='{{.State.Health.Status}}' <container-id>

# View health check logs
docker inspect --format='{{range .State.Health.Log}}{{.Output}}{{end}}' <container-id>
```

## 🆘 Emergency Procedures

### Complete Docker Reset
```bash
# Stop all containers
docker stop $(docker ps -aq)

# Remove all containers
docker rm $(docker ps -aq)

# Remove all images
docker rmi $(docker images -q)

# Remove all volumes
docker volume prune -f

# Remove all networks
docker network prune -f

# Clean build cache
docker builder prune -a -f
```

### Backup and Restore
```bash
# Backup container data
docker run --rm -v animagen_output:/data -v $(pwd):/backup alpine tar czf /backup/output-backup.tar.gz -C /data .

# Restore container data
docker run --rm -v animagen_output:/data -v $(pwd):/backup alpine tar xzf /backup/output-backup.tar.gz -C /data
```

## 📞 Getting Help

### Useful Commands for Support
```bash
# System information
docker version
docker info
docker system df

# Container information
docker inspect <container-id>
docker logs --details <container-id>

# Build information
docker build --progress=plain .
```

### Log Collection
```bash
# Collect all relevant logs
mkdir -p debug-logs
docker logs animagen > debug-logs/container.log 2>&1
docker-compose logs > debug-logs/compose.log 2>&1
docker system events > debug-logs/events.log 2>&1 &
```

Remember: Always check the [main documentation](DEPLOYMENT.md) for the latest Docker configurations and best practices.
