# Railway Deployment Guide

> Complete guide for deploying AnimaGen to Railway from GitHub repository.

## 🚀 Quick Deployment

### Prerequisites

1. **GitHub Repository** ✅ - Already set up at https://github.com/GsusFC/anima
2. **Railway Account** - Sign up at [railway.app](https://railway.app)
3. **FFmpeg Support** - Railway supports FFmpeg out of the box

### Step-by-Step Deployment

#### 1. Connect GitHub to Railway

1. **Login to Railway**
   - Go to [railway.app](https://railway.app)
   - Sign in with GitHub account

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose `GsusFC/anima` repository

3. **Configure Deployment**
   - Railway will automatically detect the `railway.toml` configuration
   - The build process will start automatically

#### 2. Environment Variables (Auto-configured)

Railway will automatically set these from `railway.toml`:

```bash
NODE_ENV=production
PORT=$PORT                    # Railway auto-assigns
OUTPUT_DIR=output
TEMP_DIR=uploads
MAX_FILE_SIZE=104857600       # 100MB
MAX_FILES=100
FFMPEG_THREADS=2              # Optimized for Railway
MAX_CONCURRENT_JOBS=2
CORS_ORIGINS=$RAILWAY_PUBLIC_DOMAIN
```

#### 3. Build Process

Railway will execute:
```bash
# 1. Install backend dependencies
cd backend && npm install

# 2. Install frontend dependencies and build
cd ../frontend && npm install && npm run build

# 3. Copy built frontend to backend
mkdir -p ../backend/public && cp -r dist/* ../backend/public/

# 4. Start the application
cd backend && npm start
```

#### 4. Access Your Application

- **URL**: Railway will provide a public URL like `https://anima-production.up.railway.app`
- **Health Check**: Available at `/api/health`
- **API**: Full API available at `/api/*`

## 🔧 Configuration Details

### Railway.toml Explained

```toml
[build]
builder = "NIXPACKS"          # Railway's build system
buildCommand = "..."          # Custom build process

[deploy]
startCommand = "cd backend && npm start"
healthcheckPath = "/api/health"
healthcheckTimeout = 300      # 5 minutes for large exports
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10

[env]
# Environment variables automatically set
```

### Resource Limits

**Railway Hobby Plan:**
- **Memory**: 512MB RAM
- **CPU**: Shared vCPU
- **Storage**: 1GB persistent disk
- **Bandwidth**: 100GB/month
- **Build Time**: 10 minutes max

**Railway Pro Plan:**
- **Memory**: Up to 8GB RAM
- **CPU**: Dedicated vCPU
- **Storage**: Up to 100GB
- **Bandwidth**: Unlimited
- **Build Time**: 30 minutes max

## 🎯 Optimizations for Railway

### 1. Memory Optimization

The configuration is optimized for Railway's memory limits:

```bash
FFMPEG_THREADS=2              # Reduced for memory efficiency
MAX_CONCURRENT_JOBS=2         # Prevent memory overload
MAX_FILE_SIZE=104857600       # 100MB limit
```

### 2. Build Optimization

- **Cached Dependencies**: Railway caches `node_modules`
- **Incremental Builds**: Only rebuilds when code changes
- **Optimized Frontend**: Production build with minification

### 3. Runtime Optimization

- **Health Checks**: Automatic restart on failures
- **Process Management**: Single process optimized for Railway
- **File Cleanup**: Automatic cleanup of temporary files

## 🔍 Monitoring and Logs

### Viewing Logs

1. **Railway Dashboard**
   - Go to your project dashboard
   - Click on "Deployments" tab
   - View real-time logs

2. **CLI Access**
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli
   
   # Login and view logs
   railway login
   railway logs
   ```

### Health Monitoring

- **Health Endpoint**: `https://your-app.railway.app/api/health`
- **Status Response**:
  ```json
  {
    "status": "healthy",
    "uptime": 3600,
    "memory": { "used": 45.2, "total": 512.0 },
    "ffmpeg": { "available": true, "version": "4.4.0" }
  }
  ```

## 🚨 Troubleshooting

### Common Issues

#### 1. Build Timeout

**Error**: Build exceeds 10-minute limit

**Solutions**:
- Upgrade to Railway Pro for longer build times
- Optimize dependencies in `package.json`
- Use Railway's build cache effectively

#### 2. Memory Limit Exceeded

**Error**: Application crashes due to memory usage

**Solutions**:
```bash
# Reduce concurrent jobs
MAX_CONCURRENT_JOBS=1

# Reduce FFmpeg threads
FFMPEG_THREADS=1

# Reduce file size limits
MAX_FILE_SIZE=52428800  # 50MB
```

#### 3. FFmpeg Not Found

**Error**: FFmpeg command not found

**Solution**: Railway includes FFmpeg by default. If issues persist:
- Check logs for specific error messages
- Verify FFmpeg version in health endpoint
- Contact Railway support if needed

#### 4. CORS Issues

**Error**: Frontend can't connect to backend

**Solution**: CORS is automatically configured with `$RAILWAY_PUBLIC_DOMAIN`

If issues persist, manually set:
```bash
CORS_ORIGINS=https://your-frontend-domain.com,https://your-app.railway.app
```

### Debug Commands

```bash
# Railway CLI debugging
railway status
railway logs --tail
railway shell

# Check environment variables
railway variables

# Restart service
railway redeploy
```

## 🔄 Continuous Deployment

### Automatic Deployments

Railway automatically deploys when you push to GitHub:

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "feat: new feature"
   git push origin main
   ```

2. **Railway Auto-Deploy**:
   - Detects GitHub push
   - Starts build process
   - Deploys automatically
   - Updates live URL

### Manual Deployments

```bash
# Using Railway CLI
railway up

# Or redeploy current version
railway redeploy
```

## 📊 Performance Monitoring

### Built-in Metrics

Railway provides:
- **CPU Usage**: Real-time CPU monitoring
- **Memory Usage**: RAM consumption tracking
- **Network**: Bandwidth usage
- **Response Times**: API response monitoring

### Custom Monitoring

Add to your application:
```javascript
// backend/routes/metrics.js
app.get('/api/metrics', (req, res) => {
  res.json({
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
    timestamp: new Date().toISOString()
  });
});
```

## 💰 Cost Optimization

### Hobby Plan Tips

- **Optimize builds**: Reduce build time to stay under limits
- **Monitor usage**: Track bandwidth and storage
- **Efficient processing**: Use appropriate quality settings

### Scaling to Pro

Consider upgrading when:
- Build times exceed 10 minutes
- Memory usage consistently high
- Need more storage for exports
- Require dedicated resources

## 🔗 Integration with GitHub

### Webhook Configuration

Railway automatically configures webhooks for:
- **Push events**: Auto-deploy on code changes
- **Pull requests**: Preview deployments (Pro plan)
- **Branch protection**: Deploy only from main branch

### Environment Branches

```bash
# Deploy specific branch
railway up --branch staging

# Set environment variables per branch
railway variables set NODE_ENV=staging --environment staging
```

## 🎉 Success Checklist

After deployment, verify:

- [ ] Application accessible at Railway URL
- [ ] Health check returns 200 status
- [ ] Frontend loads correctly
- [ ] File upload works
- [ ] Export functionality works
- [ ] FFmpeg processing successful
- [ ] Logs show no errors
- [ ] Memory usage within limits

## 🆘 Support

### Railway Support

- **Documentation**: [docs.railway.app](https://docs.railway.app)
- **Discord**: Railway community Discord
- **Support**: help@railway.app

### AnimaGen Support

- **GitHub Issues**: [Report issues](https://github.com/GsusFC/anima/issues)
- **Documentation**: Complete guides in `/docs`

---

## 🚀 Ready to Deploy!

Your AnimaGen repository is fully configured for Railway deployment. Simply:

1. **Connect GitHub repo** to Railway
2. **Railway auto-detects** configuration
3. **Build and deploy** automatically
4. **Access your live app** at the provided URL

The deployment is optimized for Railway's infrastructure and will handle the full AnimaGen functionality including FFmpeg processing! 🎬✨
