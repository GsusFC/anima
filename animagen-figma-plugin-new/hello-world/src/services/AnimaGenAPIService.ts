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
      const files = frameResults
        .filter(result => result.success && result.imageData)
        .map((result, index) => {
          const filename = `${result.frameName.replace(/[^a-zA-Z0-9]/g, '_')}.${settings.format.toLowerCase()}`;
          return {
            filename: filename,
            originalname: result.frameName,
            mimetype: settings.format === 'JPG' ? 'image/jpeg' : 'image/png',
            size: result.imageData?.length || 0,
            buffer: Array.from(result.imageData || []), // Convert Uint8Array to regular array
            fieldname: 'images'
          };
        });

      // Use a custom endpoint that mimics the /upload behavior for Figma
      const response = await this.makeRequest('/api/figma/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Plugin-Version': '2.0.0',
          'X-Plugin-Source': 'figma'
        },
        body: JSON.stringify({
          sessionId: sessionId,
          files: files,
          source: 'figma-plugin'
        })
      });

      if (response.success) {
        console.log('✅ Frames uploaded successfully');

        // Create slideshow URL using the sessionId (same as AnimaGen)
        const slideshowUrl = `${this.baseURL.replace('/api', '')}/slideshow/${sessionId}`;

        return {
          success: true,
          sessionId: response.sessionId || sessionId,
          files: response.files || [],
          projectUrl: slideshowUrl,
          projectId: sessionId,
          framesImported: response.files?.length || 0,
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
          message: response.message || 'Frames uploaded successfully'
        };
      } else {
        throw new Error(response.error || 'Upload failed');
      }

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
