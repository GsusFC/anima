// AnimaGen API service for backend communication
import { APIKeyValidation, UserInfo, AnimaGenUploadResponse, FrameExportResult } from '../types';
import { ErrorHandler } from '../utils/ErrorHandler';

export class AnimaGenAPIService {
  private baseURL: string;
  private timeout: number;

  constructor() {
    // Use production server (Railway) - development mode bypasses auth
    this.baseURL = 'https://anima-production-3dad.up.railway.app';
    this.timeout = 30000; // 30 seconds
  }

  async validateAPIKey(apiKey: string): Promise<APIKeyValidation> {
    try {
      console.log('🔍 Validating API key with AnimaGen...');

      // Add network check first
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        throw new Error('No internet connection')
      }

      const response = await this.makeRequest('/api/auth/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'X-Plugin-Version': '2.0.0',
          'X-Plugin-Source': 'figma'
        },
        body: JSON.stringify({
          source: 'figma-plugin',
          version: '2.0.0'
        })
      });

      if (response.valid) {
        console.log('✅ API key validation successful');
        return {
          valid: true,
          user: response.user,
          expiresAt: response.expiresAt ? new Date(response.expiresAt) : undefined
        };
      } else {
        console.log('❌ API key validation failed');
        return {
          valid: false,
          error: response.error || 'Invalid API key'
        };
      }

    } catch (error) {
      console.error('❌ API key validation error:', error);
      return {
        valid: false,
        error: this.getErrorMessage(error)
      };
    }
  }

  async renewAPIKey(apiKey: string): Promise<any> {
    try {
      console.log('🔄 Attempting API key renewal...');
      
      const response = await this.makeRequest('/api/auth/renew', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          source: 'figma-plugin',
          autoRenewal: true
        })
      });

      if (response.success) {
        console.log('✅ API key renewal successful');
        return {
          success: true,
          newApiKey: response.newApiKey,
          user: response.user,
          expiresAt: new Date(response.expiresAt)
        };
      } else {
        return {
          success: false,
          error: response.error || 'Renewal failed'
        };
      }

    } catch (error) {
      console.error('❌ API key renewal error:', error);
      return {
        success: false,
        error: this.getErrorMessage(error)
      };
    }
  }

  async uploadFrames(
    frameResults: FrameExportResult[],
    settings: any
  ): Promise<AnimaGenUploadResponse> {
    try {
      console.log(`📤 Uploading ${frameResults.length} frames to AnimaGen...`);

      // Figma environment doesn't support FormData/File APIs
      // Use JSON approach but with AnimaGen-compatible structure
      const sessionId = `session_${Date.now()}`;

      // Prepare files data in the format AnimaGen expects
      console.log('🔍 Analyzing frame results before filtering:')
      frameResults.forEach((result, index) => {
        console.log(`Frame ${index + 1}: ${result.frameName}`, {
          success: result.success,
          hasImageData: !!result.imageData,
          imageDataLength: result.imageData?.length || 0
        })
      })

      // Upload in batches to prevent server overload
      const BATCH_SIZE = 5; // Upload 5 frames at a time
      return await this.uploadFramesInBatches(frameResults, settings, sessionId, BATCH_SIZE);

    } catch (error) {
      console.error('❌ Frame upload error:', error);
      ErrorHandler.handleNetworkError(error, '/api/figma/import');
      throw error;
    }
  }

  async updateProjectSettings(projectId: string, settings: any, apiKey: string): Promise<any> {
    try {
      const response = await this.makeRequest(`/api/figma/project/${projectId}/settings`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ settings })
      });

      return response;

    } catch (error) {
      console.error('❌ Failed to update project settings:', error);
      throw error;
    }
  }

  private async uploadFramesInBatches(
    frameResults: FrameExportResult[],
    settings: any,
    sessionId: string,
    batchSize: number
  ): Promise<AnimaGenUploadResponse> {
    // Filter successful frames
    const successfulFrames = frameResults.filter(result => {
      if (!result.success || !result.imageData) {
        console.log(`❌ Filtering out frame: ${result.frameName}`, {
          success: result.success,
          hasImageData: !!result.imageData
        })
        return false
      }
      return true
    })

    if (successfulFrames.length === 0) {
      throw new Error('No valid frames to upload')
    }

    // Sort frames by selection order to preserve user's intended sequence
    const sortedFrames = successfulFrames.sort((a, b) => {
      const indexA = a.selectionIndex ?? a.order ?? 999999
      const indexB = b.selectionIndex ?? b.order ?? 999999
      return indexA - indexB
    })

    console.log(`📦 Uploading ${sortedFrames.length} frames in batches of ${batchSize}`)
    console.log('🔢 Frames sorted by selection order:', sortedFrames.map(f => `${f.frameName} (${f.selectionIndex})`))

    // Use sorted frames for processing
    const framesToProcess = sortedFrames

    // Split frames into batches
    const batches = []
    for (let i = 0; i < framesToProcess.length; i += batchSize) {
      batches.push(framesToProcess.slice(i, i + batchSize))
    }

    console.log(`📦 Created ${batches.length} batches`)

    let allUploadedFiles: any[] = []
    let currentBatch = 1

    // Upload each batch
    for (const batch of batches) {
      console.log(`📤 Uploading batch ${currentBatch}/${batches.length} (${batch.length} frames)`)

      try {
        const batchFiles = batch.map((result, index) => {
          // Use selection index for filename to preserve user's intended order
          const selectionIndex = result.selectionIndex ?? framesToProcess.indexOf(result)
          const cleanName = result.frameName.replace(/[^a-zA-Z0-9]/g, '_')
          const filename = `${String(selectionIndex + 1).padStart(2, '0')}_${cleanName}.${settings.format.toLowerCase()}`

          return {
            filename: filename,
            originalname: result.frameName,
            mimetype: settings.format === 'JPG' ? 'image/jpeg' : 'image/png',
            size: result.imageData?.length || 0,
            buffer: Array.from(result.imageData || []),
            fieldname: 'images',
            selectionIndex: selectionIndex // Include selection index in upload data
          }
        })

        // Upload this batch
        const batchResponse = await this.makeRequest('/api/figma/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Plugin-Version': '2.0.0',
            'X-Plugin-Source': 'figma'
          },
          body: JSON.stringify({
            sessionId: sessionId,
            files: batchFiles,
            source: 'figma-plugin',
            batchInfo: {
              current: currentBatch,
              total: batches.length,
              isLastBatch: currentBatch === batches.length
            }
          })
        })

        if (batchResponse.success) {
          console.log(`✅ Batch ${currentBatch}/${batches.length} uploaded successfully`)
          allUploadedFiles = allUploadedFiles.concat(batchResponse.files || [])
        } else {
          throw new Error(`Batch ${currentBatch} failed: ${batchResponse.error}`)
        }

        currentBatch++

        // Small delay between batches to prevent overwhelming the server
        if (currentBatch <= batches.length) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }

      } catch (error) {
        console.error(`❌ Batch ${currentBatch} upload failed:`, error)
        throw new Error(`Upload failed at batch ${currentBatch}: ${error}`)
      }
    }

    console.log(`✅ All ${batches.length} batches uploaded successfully`)
    console.log(`📊 Total files uploaded: ${allUploadedFiles.length}`)

    // Return final response
    const slideshowUrl = `${this.baseURL.replace('/api', '')}/slideshow?sessionId=${sessionId}`

    return {
      success: true,
      sessionId: sessionId,
      files: allUploadedFiles,
      projectUrl: slideshowUrl,
      projectId: sessionId,
      framesImported: allUploadedFiles.length,
      defaultSettings: {
        transitions: [{
          type: 'fade',
          duration: 1000
        }],
        frameDurations: [3000],
        exportSettings: {
          quality: 'high',
          resolution: '1920x1080',
          fps: 30,
          format: 'mp4'
        }
      },
      message: `${allUploadedFiles.length} frames uploaded successfully in ${batches.length} batches`
    }
  }

  private async makeRequest(endpoint: string, options: RequestInit): Promise<any> {
    const url = `${this.baseURL}${endpoint}`;

    try {
      console.log(`🌐 Making request to: ${url}`);

      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout - please check your connection')), this.timeout);
      });

      // Create the fetch promise
      const fetchPromise = fetch(url, options);

      // Race between fetch and timeout
      const response = await Promise.race([fetchPromise, timeoutPromise]) as Response;

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      return data;

    } catch (error) {
      if (error instanceof Error && error.message.includes('timeout')) {
        throw new Error('Request timeout - please check your connection');
      }

      throw error;
    }
  }

  private getErrorMessage(error: any): string {
    if (error.message) {
      return error.message;
    }
    
    if (typeof error === 'string') {
      return error;
    }
    
    return 'An unexpected error occurred';
  }

  // Utility method to check API health
  async checkAPIHealth(): Promise<boolean> {
    try {
      const response = await this.makeRequest('/api/health', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      return response.status === 'ok';
    } catch (error) {
      console.warn('⚠️ API health check failed:', error);
      return false;
    }
  }
}
