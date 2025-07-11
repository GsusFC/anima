# AnimaGen API Documentation

> Complete REST API reference for AnimaGen backend services

## Base URL

```
http://localhost:3001
```

## Authentication

Currently, AnimaGen operates without authentication for local development. All endpoints are publicly accessible.

## Response Format

All API responses follow this structure:

```json
{
  "success": boolean,
  "data": object | array,
  "error": string | null,
  "timestamp": string
}
```

## Error Handling

HTTP Status Codes:
- `200` - Success
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

Error Response:
```json
{
  "success": false,
  "error": "Error description",
  "code": "ERROR_CODE",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## 📡 Server Endpoints

### GET /
Get server status and available endpoints.

**Response:**
```json
{
  "message": "AnimaGen Backend Server",
  "status": "running",
  "version": "1.0.0",
  "endpoints": {
    "upload": "/upload",
    "export": "/export/*",
    "preview": "/preview",
    "status": "/api/status"
  }
}
```

### GET /api/status
Get detailed server status and configuration.

**Response:**
```json
{
  "status": "running",
  "version": "1.0.0",
  "features": {
    "queueEnabled": false,
    "processingEnabled": true,
    "mockMode": false
  },
  "limits": {
    "maxFileSize": 52428800,
    "maxFiles": 50,
    "maxDuration": 300
  }
}
```

### GET /api/health
Health check endpoint for monitoring.

**Response:**
```json
{
  "status": "healthy",
  "uptime": 3600,
  "memory": {
    "used": 45.2,
    "total": 100.0
  },
  "ffmpeg": {
    "available": true,
    "version": "4.4.0"
  }
}
```

---

## 📤 Upload Endpoints

### POST /upload
Upload images for slideshow creation.

**Content-Type:** `multipart/form-data`

**Parameters:**
- `images` (files) - Image files (JPG, PNG, GIF)
- `sessionId` (string) - Unique session identifier

**Example:**
```bash
curl -X POST http://localhost:3001/upload \
  -F "images=@image1.jpg" \
  -F "images=@image2.png" \
  -F "sessionId=session_123"
```

**Response:**
```json
{
  "success": true,
  "sessionId": "session_123",
  "uploadedFiles": [
    {
      "filename": "image1.jpg",
      "originalName": "photo1.jpg",
      "size": 1024000,
      "path": "/temp/session_123/image1.jpg"
    }
  ],
  "totalFiles": 2
}
```

### POST /upload/video
Upload video files for video editor.

**Content-Type:** `multipart/form-data`

**Parameters:**
- `videos` (files) - Video files (MP4, WebM, MOV)
- `sessionId` (string) - Unique session identifier

**Response:**
```json
{
  "success": true,
  "sessionId": "session_123",
  "uploadedVideos": [
    {
      "filename": "video1.mp4",
      "originalName": "clip1.mp4",
      "size": 10240000,
      "duration": 30.5,
      "resolution": "1920x1080",
      "fps": 30
    }
  ]
}
```

---

## 🎬 Export Endpoints

### POST /export/gif
Export slideshow as animated GIF.

**Content-Type:** `application/json`

**Request Body:**
```json
{
  "sessionId": "session_123",
  "images": [
    {
      "filename": "image1.jpg",
      "id": "img_1"
    }
  ],
  "frameDurations": [1000, 1500, 2000],
  "transitions": [
    {
      "type": "fade",
      "duration": 500
    }
  ],
  "quality": "standard",
  "resolution": "1080p",
  "loop": true
}
```

**Quality Options:**
- `draft` - Fast, lower quality
- `standard` - Balanced quality/speed
- `high` - Best quality, slower

**Resolution Options:**
- `480p` - 854x480
- `720p` - 1280x720
- `1080p` - 1920x1080
- `4k` - 3840x2160

**Response:**
```json
{
  "success": true,
  "filename": "animagen_1234567890.gif",
  "downloadUrl": "/output/animagen_1234567890.gif",
  "size": 2048000,
  "duration": 5.5,
  "frames": 165
}
```

### POST /export/mp4
Export slideshow as MP4 video.

**Request Body:** (Same as GIF export)

**Additional Parameters:**
```json
{
  "fps": 30,
  "bitrate": "2M",
  "codec": "h264"
}
```

### POST /export/webm
Export slideshow as WebM video.

**Request Body:** (Same as MP4 export)

**Additional Parameters:**
```json
{
  "codec": "vp9",
  "quality": "standard"
}
```

### POST /export/mov
Export slideshow as MOV video.

**Request Body:** (Same as MP4 export)

---

## 🔄 Preview Endpoints

### POST /preview
Generate preview of slideshow.

**Request Body:**
```json
{
  "sessionId": "session_123",
  "images": [
    {
      "filename": "image1.jpg",
      "id": "img_1"
    }
  ],
  "frameDurations": [1000],
  "transitions": [],
  "quality": "draft",
  "maxDuration": 10
}
```

**Response:**
```json
{
  "success": true,
  "previewUrl": "/output/preview_session_123_1234567890.mp4",
  "duration": 3.5,
  "size": 512000
}
```

---

## 🧹 Utility Endpoints

### DELETE /cleanup/:sessionId
Clean up temporary files for a session.

**Parameters:**
- `sessionId` (path) - Session to clean up

**Response:**
```json
{
  "success": true,
  "message": "Session cleaned up successfully",
  "filesRemoved": 5
}
```

### GET /output/:filename
Download exported file.

**Parameters:**
- `filename` (path) - Name of exported file

**Response:** File download with appropriate headers

---

## 🔌 WebSocket Events

### Connection
```javascript
const socket = io('http://localhost:3001');
```

### Events

#### `export-progress`
Emitted during export processing.

**Data:**
```json
{
  "sessionId": "session_123",
  "progress": 45,
  "stage": "processing",
  "message": "Applying transitions..."
}
```

#### `export-complete`
Emitted when export finishes.

**Data:**
```json
{
  "sessionId": "session_123",
  "success": true,
  "filename": "animagen_1234567890.gif",
  "downloadUrl": "/output/animagen_1234567890.gif"
}
```

#### `export-error`
Emitted when export fails.

**Data:**
```json
{
  "sessionId": "session_123",
  "success": false,
  "error": "FFmpeg processing failed",
  "code": "FFMPEG_ERROR"
}
```

---

## 📝 Rate Limits

Current rate limits (per IP):
- Upload: 10 requests/minute
- Export: 5 requests/minute
- Preview: 20 requests/minute

## 🔧 Configuration

Server configuration via environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3001` |
| `MAX_FILE_SIZE` | Max upload size (bytes) | `52428800` |
| `MAX_FILES` | Max files per upload | `50` |
| `OUTPUT_DIR` | Export directory | `output` |
| `TEMP_DIR` | Upload directory | `uploads` |
| `CORS_ORIGINS` | Allowed origins | `localhost:5173` |

## 🐛 Common Errors

### `FFMPEG_NOT_FOUND`
FFmpeg is not installed or not in PATH.

### `FILE_TOO_LARGE`
Uploaded file exceeds size limit.

### `INVALID_FORMAT`
Unsupported file format.

### `SESSION_NOT_FOUND`
Session ID doesn't exist or expired.

### `PROCESSING_FAILED`
FFmpeg processing encountered an error.
