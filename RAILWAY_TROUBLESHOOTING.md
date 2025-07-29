# Railway Deployment Troubleshooting Guide

## Problem Identified
The Railway deployment is experiencing issues with the job queue system, specifically:
- `workerManager.start is not a function` error
- Redis connection problems with Railway's environment variables

## Quick Fix Steps

### 1. Environment Variables Configuration
Railway provides Redis variables in a different format than expected. The application has been updated to handle both formats:

**Railway Variables (automatically provided):**
- `REDISHOST`
- `REDISPORT`
- `REDISUSER` (optional)
- `REDISPASSWORD`

**Alternative:** `REDIS_URL` (also provided by Railway)

### 2. Run Diagnostics
Execute the diagnostic script to test all Railway-specific configurations:

```bash
npm run railway:diagnose
```

### 3. Verify Redis Connection
The diagnostic script will test:
- Redis connection using Railway variables
- Worker manager import
- BullMQ queue creation

### 4. Resource Optimization for Railway Hobby Plan
For Railway's 512MB RAM limit, use these optimized settings:

```bash
# In Railway dashboard, set these variables:
FFMPEG_THREADS=1
MAX_CONCURRENT_JOBS=1
MAX_FILE_SIZE=52428800  # 50MB
MEMORY_WARNING_THRESHOLD=400
```

### 5. Check Railway Logs
1. Go to your Railway project dashboard
2. Navigate to **Deployments** → **Logs**
3. Look for:
   - Redis connection errors
   - FFmpeg availability messages
   - Memory warnings
   - Worker initialization messages

## Manual Testing

### Test Redis Connection
```bash
# SSH into Railway deployment
railway shell

# Test Redis connection
node backend/scripts/test-railway-connection.js
```

### Check Environment Variables
```bash
# View all environment variables in Railway
railway variables

# Set specific variables
railway variables set FFMPEG_THREADS=1
railway variables set MAX_CONCURRENT_JOBS=1
```

## Common Issues & Solutions

### Issue 1: "workerManager.start is not a function"
**Solution:** The import handling has been fixed in `backend/src/server.ts` to support both ES modules and CommonJS patterns.

### Issue 2: Redis Connection Refused
**Solution:** 
1. Ensure Redis service is added to your Railway project
2. Check that `REDISHOST` and `REDISPORT` are correctly set
3. Verify Redis is not in maintenance mode

### Issue 3: Memory Issues
**Solution:**
1. Reduce `MAX_CONCURRENT_JOBS` to 1
2. Lower `FFMPEG_THREADS` to 1
3. Decrease `MAX_FILE_SIZE` to 50MB or less
4. Enable memory monitoring

### Issue 4: FFmpeg Not Found
**Solution:**
1. FFmpeg is included in the Railway build
2. Check the deployment logs for FFmpeg availability messages
3. Verify FFmpeg path is correctly detected

## Deployment Checklist

Before deploying:
- [ ] Redis service added to Railway project
- [ ] Environment variables configured
- [ ] Diagnostic script passes locally
- [ ] Resource limits set for Railway Hobby plan
- [ ] Frontend build completes successfully

## Environment Variables Reference

**Required:**
- `NODE_ENV=production`
- `PORT=3001`

**Railway Redis (auto-provided):**
- `REDISHOST`
- `REDISPORT`
- `REDISPASSWORD`

**Optimizations:**
- `FFMPEG_THREADS=1`
- `MAX_CONCURRENT_JOBS=1`
- `MAX_FILE_SIZE=52428800`
- `MEMORY_WARNING_THRESHOLD=400`

**Optional:**
- `CORS_ORIGINS=https://your-frontend-url.com`
- `USE_QUEUE_SYSTEM=true`

## Support Commands

```bash
# Test Railway connection locally
npm run railway:diagnose

# Check Railway variables
railway variables

# View logs
railway logs

# Restart deployment
railway restart
```

## Next Steps
1. Run the diagnostic script: `npm run railway:diagnose`
2. Check Railway logs for specific error messages
3. Verify Redis service is provisioned in Railway
4. Adjust environment variables based on Railway plan limits
5. Re-deploy after making changes