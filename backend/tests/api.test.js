const request = require('supertest');
const path = require('path');
const fs = require('fs');

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.PORT = '3002'; // Use different port for testing

// Import the app after setting env vars
const app = require('../index.js');

describe('AnimaGen Backend API', () => {
  let server;
  const testSessionId = 'test-session-api';
  const testAssetsDir = path.join(__dirname, '../tests/assets');

  beforeAll((done) => {
    // Start server on test port
    server = app.listen(3002, done);
  });

  afterAll((done) => {
    // Cleanup test files and close server
    const tempDir = path.join(__dirname, '../temp', testSessionId);
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    server.close(done);
  });

  describe('GET /', () => {
    it('should return server info', async () => {
      const response = await request(app).get('/');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'AnimaGen Backend Server');
      expect(response.body).toHaveProperty('status', 'running');
      expect(response.body).toHaveProperty('version', '1.0.0');
      expect(response.body).toHaveProperty('endpoints');
    });
  });

  describe('POST /upload', () => {
    it('should upload images successfully', async () => {
      const response = await request(app)
        .post(`/upload?sessionId=${testSessionId}`)
        .attach('images', path.join(testAssetsDir, 'frame1.png'))
        .attach('images', path.join(testAssetsDir, 'frame2.png'))
        .attach('images', path.join(testAssetsDir, 'frame3.png'));

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('sessionId', testSessionId);
      expect(response.body).toHaveProperty('files');
      expect(response.body.files).toHaveLength(3);
      
      // Verify files were saved in correct location
      response.body.files.forEach(file => {
        expect(file.path).toContain(testSessionId);
        expect(fs.existsSync(file.path)).toBe(true);
      });
    });

    it('should return error when no files uploaded', async () => {
      const response = await request(app)
        .post(`/upload?sessionId=${testSessionId}`);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'No files uploaded');
    });
  });

  describe('POST /export/gif', () => {
    let uploadedFiles;

    beforeAll(async () => {
      // Upload test images first
      const uploadResponse = await request(app)
        .post(`/upload?sessionId=${testSessionId}`)
        .attach('images', path.join(testAssetsDir, 'frame1.png'))
        .attach('images', path.join(testAssetsDir, 'frame2.png'))
        .attach('images', path.join(testAssetsDir, 'frame3.png'));
      
      uploadedFiles = uploadResponse.body.files;
    });

    it('should generate GIF successfully', async () => {
      const exportData = {
        images: uploadedFiles.map(f => ({ filename: f.filename })),
        transitions: [
          { type: 'fade', duration: 0.5 },
          { type: 'fade', duration: 0.5 }
        ],
        duration: 1,
        quality: 'standard',
        sessionId: testSessionId
      };

      const response = await request(app)
        .post('/export/gif')
        .send(exportData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('filename');
      expect(response.body).toHaveProperty('downloadUrl');
      expect(response.body.filename).toMatch(/\.gif$/);
    }, 10000); // 10 second timeout for FFmpeg processing

    it('should return error when no images provided', async () => {
      const exportData = {
        images: [],
        sessionId: testSessionId
      };

      const response = await request(app)
        .post('/export/gif')
        .send(exportData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'No images provided');
    });

    it('should return error when sessionId missing', async () => {
      const exportData = {
        images: [{ filename: 'test.png' }]
      };

      const response = await request(app)
        .post('/export/gif')
        .send(exportData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Session ID is required');
    });
  });

  describe('POST /export/video', () => {
    let uploadedFiles;

    beforeAll(async () => {
      // Upload test images first
      const uploadResponse = await request(app)
        .post(`/upload?sessionId=${testSessionId}`)
        .attach('images', path.join(testAssetsDir, 'frame1.png'))
        .attach('images', path.join(testAssetsDir, 'frame2.png'))
        .attach('images', path.join(testAssetsDir, 'frame3.png'));
      
      uploadedFiles = uploadResponse.body.files;
    });

    it('should generate MP4 successfully', async () => {
      const exportData = {
        images: uploadedFiles.map(f => ({ filename: f.filename })),
        transitions: [
          { type: 'fade', duration: 0.5 },
          { type: 'fade', duration: 0.5 }
        ],
        duration: 1,
        quality: 'standard',
        format: 'mp4',
        sessionId: testSessionId
      };

      const response = await request(app)
        .post('/export/video')
        .send(exportData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('filename');
      expect(response.body).toHaveProperty('downloadUrl');
      expect(response.body.filename).toMatch(/\.mp4$/);
    }, 15000); // 15 second timeout for FFmpeg processing
  });

  describe('GET /download/:filename', () => {
    it('should return 404 for non-existent file', async () => {
      const response = await request(app)
        .get('/download/non-existent-file.gif');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'File not found');
    });
  });

  describe('DELETE /cleanup/:sessionId', () => {
    it('should cleanup session files', async () => {
      // First upload some files
      await request(app)
        .post(`/upload?sessionId=${testSessionId}-cleanup`)
        .attach('images', path.join(testAssetsDir, 'frame1.png'));

      // Then cleanup
      const response = await request(app)
        .delete(`/cleanup/${testSessionId}-cleanup`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Session files cleaned up');
    });

    it('should return 404 for non-existent session', async () => {
      const response = await request(app)
        .delete('/cleanup/non-existent-session');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Session not found');
    });
  });
}); 