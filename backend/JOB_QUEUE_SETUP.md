# Job Queue System Setup Guide

## Overview

The AnimaGen backend now supports a robust job queue system for FFmpeg video processing operations using BullMQ and Redis. This replaces synchronous processing with an asynchronous queue system that can handle multiple video exports concurrently.

## Prerequisites

### Redis Installation

**macOS (using Homebrew):**
```bash
brew install redis
brew services start redis
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

**Windows:**
```bash
# Using WSL2 or download from Redis website
sudo apt install redis-server
sudo service redis-server start
```

**Docker:**
```bash
docker run -d --name redis -p 6379:6379 redis:latest
```

### Verify Redis Installation
```bash
redis-cli ping
# Should return: PONG
```

## Dependencies

The following packages have been added to package.json:

```json
{
  "bullmq": "^4.15.1",
  "ioredis": "^5.3.2", 
  "redis": "^4.6.10"
}
```

Install dependencies:
```bash
cd backend
npm install
```

## Configuration

### Environment Variables

Add to your `.env` file:

```env
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Worker Configuration
WORKER_COUNT=1
WORKER_CONCURRENCY=2
```

### Redis Configuration Options

- **REDIS_HOST**: Redis server hostname (default: localhost)
- **REDIS_PORT**: Redis server port (default: 6379)  
- **REDIS_PASSWORD**: Redis password (optional)
- **REDIS_DB**: Redis database number (default: 0)
- **WORKER_COUNT**: Number of worker processes (default: 1)
- **WORKER_CONCURRENCY**: Jobs processed simultaneously per worker (default: 2)

## Architecture

### Components

1. **Redis**: Message broker for job queues
2. **BullMQ**: Job queue library  
3. **Export Worker**: Handles FFmpeg processing
4. **Worker Manager**: Manages worker lifecycle
5. **Queue Routes**: API endpoints for job management

### File Structure

```
backend/
├── workers/
│   ├── exportWorker.js       # Main FFmpeg processing worker
│   └── workerManager.js      # Worker startup and management  
├── queues/
│   ├── videoQueue.js         # Job queue configuration
│   └── jobTypes.js           # Job type definitions
├── routes/
│   └── export.js             # Queue-based export endpoints
├── utils/
│   └── redis.js              # Redis connection setup
└── worker.js                 # Standalone worker process
```

## Usage

### Starting the System

**Option 1: Integrated Mode (Server + Workers)**
```bash
cd backend
npm start
```

**Option 2: Separate Processes (Recommended for Production)**

Terminal 1 - Start Server:
```bash
cd backend  
npm start
```

Terminal 2 - Start Workers:
```bash
cd backend
npm run worker
```

### Development Mode

```bash
# Server with auto-reload
npm run dev

# Worker with auto-reload  
npm run worker:dev
```

## API Endpoints

### Queue Management

- `GET /api/export/stats` - Get queue statistics
- `GET /api/export/status/:jobId` - Get job status and progress  
- `DELETE /api/export/:jobId` - Cancel/cleanup job

### Job Creation

- `POST /api/export/slideshow` - Queue slideshow export
- `POST /api/export/video` - Queue video export
- `POST /api/export/trim` - Queue video trim
- `POST /api/export/gif` - Queue GIF export
- `POST /api/export/convert` - Queue format conversion

### File Download

- `GET /api/export/download/:jobId` - Download completed export

## Job Types

### Slideshow Export

**Endpoint:** `POST /api/export/slideshow`

**Request Body:**
```json
{
  "images": [
    {"filename": "image1.jpg", "id": "img1"},
    {"filename": "image2.jpg", "id": "img2"}
  ],
  "transitions": [
    {"type": "fade", "duration": 500}
  ],
  "frameDurations": [2000, 2000],
  "quality": "standard",
  "sessionId": "session123",
  "format": "mp4"
}
```

**Response:**
```json
{
  "success": true,
  "jobId": "slideshow_session123_1707123456789",
  "message": "Slideshow export job queued successfully",
  "statusUrl": "/api/export/status/slideshow_session123_1707123456789",
  "downloadUrl": "/api/export/download/slideshow_session123_1707123456789"
}
```

### Video Export

**Endpoint:** `POST /api/export/video`

**Request Body:**
```json
{
  "videoPath": "/path/to/video.mp4",
  "startTime": 10.5,
  "endTime": 30.2,
  "quality": "high", 
  "resolution": {"width": 1920, "height": 1080},
  "fps": 30,
  "format": "mp4"
}
```

### Job Status Response

```json
{
  "success": true,
  "job": {
    "id": "slideshow_session123_1707123456789",
    "type": "slideshow_export",
    "status": "active",
    "progress": 65,
    "data": {...},
    "result": null,
    "error": null,
    "createdAt": "2024-02-05T10:30:56.789Z",
    "processedAt": "2024-02-05T10:31:02.123Z",
    "completedAt": null,
    "attempts": 1,
    "maxAttempts": 3
  }
}
```

## Quality Presets

- **web**: 720p, 24fps, 1M bitrate, CRF 28
- **standard**: 720p, 30fps, 2M bitrate, CRF 23  
- **high**: 1080p, 30fps, 4M bitrate, CRF 20
- **premium**: 1080p, 60fps, 8M bitrate, CRF 18
- **ultra**: 4K, 60fps, 20M bitrate, CRF 16

## Job Status States

- **waiting**: Job is queued waiting for processing
- **active**: Job is currently being processed
- **completed**: Job finished successfully
- **failed**: Job failed (will retry based on configuration)
- **delayed**: Job is delayed for retry
- **paused**: Queue is paused

## Error Handling

### Retry Logic

Jobs automatically retry on failure with exponential backoff:

- **Attempts**: 2-3 retries depending on job type
- **Backoff**: Exponential delay starting at 2 seconds
- **Cleanup**: Failed jobs kept for 24 hours, completed jobs for 1 hour

### Fallback Mode

If Redis is unavailable, the server falls back to synchronous processing using the original endpoints:

- `POST /export/gif`
- `POST /export/video` 
- `POST /export/mp4`
- `POST /export/webm`
- `POST /export/mov`

## Testing

### Basic Queue Test

1. Start Redis: `redis-server`
2. Start backend: `npm start`
3. Check status: `curl http://localhost:3001/api/status`
4. Verify job queue is enabled in response

### Job Processing Test

```bash
# Upload images first
curl -X POST -F "images=@image1.jpg" -F "images=@image2.jpg" \
  http://localhost:3001/upload?sessionId=test123

# Queue slideshow job
curl -X POST http://localhost:3001/api/export/slideshow \
  -H "Content-Type: application/json" \
  -d '{
    "images": [{"filename": "uploaded_filename1.jpg"}, {"filename": "uploaded_filename2.jpg"}],
    "sessionId": "test123",
    "quality": "standard"
  }'

# Check job status
curl http://localhost:3001/api/export/status/JOB_ID_HERE

# Download when completed
curl http://localhost:3001/api/export/download/JOB_ID_HERE -o output.mp4
```

### Performance Testing

The queue system supports concurrent processing. Test with multiple simultaneous jobs:

```bash
# Submit multiple jobs
for i in {1..5}; do
  curl -X POST http://localhost:3001/api/export/slideshow \
    -H "Content-Type: application/json" \
    -d "{\"images\":[...], \"sessionId\":\"test$i\"}" &
done

# Monitor queue stats  
curl http://localhost:3001/api/export/stats
```

## Monitoring

### Queue Statistics

```bash
curl http://localhost:3001/api/export/stats
```

Response:
```json
{
  "success": true,
  "stats": {
    "waiting": 2,
    "active": 1, 
    "completed": 15,
    "failed": 0,
    "total": 18
  }
}
```

### Redis Monitoring

```bash
# Monitor Redis activity
redis-cli monitor

# Check queue keys
redis-cli keys "bull:video-processing:*"

# Get queue info
redis-cli llen "bull:video-processing:waiting"
```

## Production Deployment

### Scaling Workers

Scale horizontally by running multiple worker processes:

```bash
# Terminal 1
WORKER_COUNT=2 npm run worker

# Terminal 2  
WORKER_COUNT=2 npm run worker

# Terminal 3
WORKER_COUNT=2 npm run worker
```

### Docker Compose Example

```yaml
version: '3.8'
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    
  backend:
    build: .
    ports:
      - "3001:3001"
    environment:
      - REDIS_HOST=redis
    depends_on:
      - redis
      
  worker:
    build: .
    command: npm run worker
    environment:
      - REDIS_HOST=redis
      - WORKER_COUNT=2
    depends_on:
      - redis
    deploy:
      replicas: 3
```

### Health Checks

The system includes health monitoring:

- Server health: `GET /api/health`
- Job queue status: `GET /api/status`
- Redis connectivity: Automatic testing on startup

## Troubleshooting

### Common Issues

**Redis Connection Failed:**
```
❌ Redis connection failed: connect ECONNREFUSED 127.0.0.1:6379
```
Solution: Ensure Redis is running and accessible

**Job Stuck in Waiting:**
- Check if workers are running
- Verify Redis connectivity
- Check worker logs for errors

**High Memory Usage:**
- Adjust job retention settings
- Increase cleanup frequency
- Monitor queue size

### Debug Commands

```bash
# Check Redis status
redis-cli ping

# List all jobs in queue
redis-cli keys "bull:video-processing:*"

# Clear all jobs (CAUTION!)
redis-cli flushdb

# Monitor worker logs
npm run worker:dev
```

## Benefits

1. **Asynchronous Processing**: Non-blocking video export operations
2. **Concurrent Jobs**: Multiple exports can run simultaneously  
3. **Retry Logic**: Automatic retry on failures with exponential backoff
4. **Progress Tracking**: Real-time progress updates via job status
5. **Scalability**: Horizontal scaling with multiple worker processes
6. **Reliability**: Job persistence and recovery on system restart
7. **Monitoring**: Built-in queue statistics and job tracking
8. **Graceful Shutdown**: Clean job cancellation and resource cleanup

## Next Steps

The job queue system is now ready for use. Key benefits include improved performance, scalability, and reliability for video processing operations. The system gracefully falls back to synchronous processing if Redis is unavailable, ensuring backward compatibility.
