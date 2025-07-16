const { Worker } = require('bullmq');
const path = require('path');
const fs = require('fs');
const { createRedisConnection } = require('../utils/redis');
const { JobTypes } = require('../queues/jobTypes');
const exportService = require('../services/exportService');

class ExportWorker {
  constructor() {
    this.connection = createRedisConnection();
    this.outputDir = path.join(__dirname, '..', process.env.OUTPUT_DIR || 'output');
    this.tempDir = path.join(__dirname, '..', process.env.TEMP_DIR || 'uploads');
    this.compositionsDir = path.join(__dirname, '..', 'compositions');
    this.logsDir = path.join(__dirname, '..', 'logs');
    
    // Ensure directories exist
    this.ensureDirectories();

    this.worker = new Worker('video-processing', this.processJob.bind(this), {
      connection: this.connection,
      concurrency: parseInt(process.env.WORKER_CONCURRENCY) || 2,
      removeOnComplete: { count: 50 },
      removeOnFail: { count: 100 }
    });

    this.setupEventHandlers();

    // Ensure logs directory
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
    }
  }

  ensureDirectories() {
    [this.outputDir, this.tempDir, this.compositionsDir, this.logsDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`✅ Created directory: ${dir}`);
      }
    });
  }

  setupEventHandlers() {
    this.worker.on('ready', () => {
      console.log('✅ Export worker ready');
    });

    this.worker.on('error', (error) => {
      console.error('❌ Export worker error:', error);
    });

    this.worker.on('failed', (job, error) => {
      console.error(`❌ Job ${job.id} failed:`, error.message);
    });

    this.worker.on('completed', (job, result) => {
      console.log(`✅ Job ${job.id} completed:`, result.filename);
    });
    
    this.worker.on('active', (job) => {
      console.log(`🚀 [WORKER] Job started: ${job.id}, type: ${job.name}`);
      console.log('🔍 Job data:', job.data);
    });
  }

  async processJob(job) {
    const type = job.name;
    const data = job.data;
    
    try {
      console.log(`🔄 Processing job ${job.id}: ${type}`);
      
      job.updateProgress(10);
      
      let result;
      
      switch (type) {
        case JobTypes.SLIDESHOW_EXPORT:
          // Use simple slideshow export (no complex transitions)
          result = await exportService.createSimpleSlideshow(data);
          break;
        
        case JobTypes.VIDEO_EXPORT:
          // Video export is essentially a format conversion
          result = await exportService.createFormatConversion({
            ...data,
            outputFormat: data.format || 'mp4'
          });
          break;
        
        case JobTypes.VIDEO_TRIM:
          result = await exportService.createVideoTrim(data);
          break;
        
        case JobTypes.GIF_EXPORT:
          // GIF export is a unified export with format=gif
          result = await exportService.createUnifiedExport({
            ...data,
            format: 'gif'
          });
          break;
        
        case JobTypes.FORMAT_CONVERSION:
          result = await exportService.createFormatConversion(data);
          break;
        
        case 'unified_export':
        case JobTypes.UNIFIED_EXPORT:
          result = await exportService.createUnifiedExport(data);
          break;
        
        default:
          throw new Error(`Unknown job type: ${type}`);
      }
      
      job.updateProgress(100);
      return result;
      
    } catch (error) {
      console.error(`❌ Job ${job.id} processing failed:`, error.message);
      // Write error log
      try {
        const logPath = path.join(this.logsDir, `job_${job.id}.log`);
        fs.writeFileSync(logPath, `[${new Date().toISOString()}] ${error.stack || error.message}`);
      } catch (logErr) {
        console.warn('Could not write job error log:', logErr.message);
      }
      throw error;
    }
  }

  async close() {
    try {
      await this.worker.close();
      await this.connection.disconnect();
      console.log('✅ Export worker closed');
    } catch (error) {
      console.error('❌ Failed to close export worker:', error);
    }
  }
}

module.exports = ExportWorker;
