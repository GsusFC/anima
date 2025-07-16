import { Request, Response, Router } from 'express';
import fs from 'fs';
import path from 'path';
import { PATHS } from '../config/directories';

/**
 * Router for health check, debug, and basic endpoints
 */
const healthRouter = Router();

/**
 * Health check endpoint for monitoring and deployment platforms
 * 
 * @route GET /api/health
 */
healthRouter.get('/api/health', (req: Request, res: Response) => {
  console.log('🏥 Health check requested');
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    env: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 3002,
    directories: {
      output: fs.existsSync(PATHS.outputDir),
      uploads: fs.existsSync(PATHS.tempDir),
      compositions: fs.existsSync(PATHS.compositionsDir)
    }
  });
});

/**
 * Debug endpoint with detailed system information
 * 
 * @route GET /debug
 */
healthRouter.get('/debug', (req: Request, res: Response) => {
  console.log('🔍 Debug endpoint requested');
  res.json({
    status: 'running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    env: process.env.NODE_ENV,
    port: process.env.PORT || 3002,
    platform: process.platform,
    nodeVersion: process.version,
    memoryUsage: process.memoryUsage(),
    directories: {
      output: fs.existsSync(PATHS.outputDir),
      temp: fs.existsSync(PATHS.tempDir),
      compositions: fs.existsSync(PATHS.compositionsDir),
      public: fs.existsSync(path.join(PATHS.root, '..', '..', 'public'))
    }
  });
});

/**
 * Favicon endpoint to prevent 404 errors
 * 
 * @route GET /favicon.ico
 */
healthRouter.get('/favicon.ico', (req: Request, res: Response) => {
  res.status(204).end(); // No content response for favicon
});

/**
 * Root endpoint to serve frontend or basic status
 * 
 * @route GET /
 */
healthRouter.get('/', (req: Request, res: Response) => {
  console.log('🏠 Root endpoint requested');
  try {
    const indexPath = path.join(PATHS.publicDir, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      console.log('❌ index.html not found, serving basic response');
      res.send(`
        <html>
          <body>
            <h1>AnimaGen Server</h1>
            <p>Status: Running</p>
            <p>Time: ${new Date().toISOString()}</p>
            <p><a href="/api/health">Health Check</a></p>
          </body>
        </html>
      `);
    }
  } catch (error: any) {
    console.error('❌ Error serving root:', error);
    res.status(500).send('Server Error');
  }
});

export default healthRouter;
