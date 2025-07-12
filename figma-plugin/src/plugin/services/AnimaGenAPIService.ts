// AnimaGen API service for backend communication
import { APIKeyValidation, UserInfo, AnimaGenUploadResponse, FrameExportResult } from '@shared/types';
import { ErrorHandler } from '../utils/ErrorHandler';

export class AnimaGenAPIService {
  private baseURL: string;
  private timeout: number;

  constructor() {
    // Use environment variable or default to Railway for production
    this.baseURL = process.env.ANIMAGEN_API_BASE || 'https://anima-production-3dad.up.railway.app';
    this.timeout = 30000; // 30 seconds
  }

  async validateAPIKey(apiKey: string): Promise<APIKeyValidation> {
    try {
      console.log('🔍 Validating API key with AnimaGen...');
      
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
      ErrorHandler.handleNetworkError(error, '/api/auth/validate');
      
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
      
      // Create FormData for file upload
      const formData = new FormData();
      
      // Add metadata
      formData.append('source', 'figma-plugin');
      formData.append('pluginVersion', '2.0.0');
      formData.append('sessionId', `session_${Date.now()}`);
      
      // Add frame data and metadata
      frameResults.forEach((result, index) => {
        if (result.success && result.imageData) {
          // Convert Uint8Array to Blob
          const blob = new Blob([result.imageData], { 
            type: settings.format === 'PNG' ? 'image/png' : 'image/jpeg' 
          });
          
          formData.append('images', blob, `frame_${index}.${settings.format.toLowerCase()}`);
          
          // Add metadata for each frame
          formData.append(`metadata[${index}]`, JSON.stringify({
            originalName: result.frameName,
            order: result.order,
            dimensions: {
              width: result.metadata?.width || 0,
              height: result.metadata?.height || 0
            },
            format: settings.format,
            figmaFrameId: result.frameId,
            exportSettings: settings
          }));
        }
      });

      const response = await this.makeRequest('/api/figma/import', {
        method: 'POST',
        headers: {
          'X-Plugin-Version': '2.0.0',
          'X-Plugin-Source': 'figma'
          // Don't set Content-Type for FormData, let browser set it
        },
        body: formData
      });

      if (response.success) {
        console.log('✅ Frames uploaded successfully');
        return response;
      } else {
        throw new Error(response.error || 'Upload failed');
      }

    } catch (error) {
      console.error('❌ Frame upload error:', error);
      ErrorHandler.handleNetworkError(error, '/api/figma/import');
      throw error;
    }
  }

  async getProjectSettings(projectId: string, apiKey: string): Promise<any> {
    try {
      const response = await this.makeRequest(`/api/figma/project/${projectId}/settings`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      return response;

    } catch (error) {
      console.error('❌ Failed to get project settings:', error);
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
    
    // Add timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorMessage;
        } catch {
          // Use default error message
        }
        
        throw new Error(errorMessage);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      } else {
        return await response.text();
      }

    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
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

  // Get API base URL for external links
  getBaseURL(): string {
    return this.baseURL.replace('/api', '');
  }
}
