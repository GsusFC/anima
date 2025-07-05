import { API_BASE_URL } from '../constants';
import { logger } from '../utils/logger';

export class APIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

class APIService {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const method = options.method || 'GET';
    const startTime = performance.now();
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    logger.debug('API', `Starting ${method} request to ${endpoint}`);

    try {
      const response = await fetch(url, config);
      const duration = performance.now() - startTime;
      
      logger.logAPICall(method, endpoint, response.status, duration);
      
      if (!response.ok) {
        const errorText = await response.text();
        const error = new APIError(
          `API request failed: ${response.statusText}`,
          response.status,
          errorText
        );
        
        logger.error('API', `Request failed: ${method} ${endpoint}`, error, {
          status: response.status,
          statusText: response.statusText,
          duration,
        });
        
        throw error;
      }

      const result = await response.json();
      logger.debug('API', `Request successful: ${method} ${endpoint}`, { duration });
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      
      if (error instanceof APIError) {
        throw error;
      }
      
      const networkError = new APIError(
        `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        0,
        error
      );
      
      logger.error('API', `Network error: ${method} ${endpoint}`, networkError, { duration });
      throw networkError;
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async downloadBlob(endpoint: string): Promise<Blob> {
    const url = `${this.baseURL}${endpoint}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new APIError(`Download failed: ${response.statusText}`, response.status);
    }
    
    return response.blob();
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.get('/api/health');
  }

  // Update base URL (for API configuration)
  updateBaseURL(newBaseURL: string): void {
    this.baseURL = newBaseURL;
  }

  getBaseURL(): string {
    return this.baseURL;
  }
}

// Singleton instance
export const apiService = new APIService();

// Export factory for testing
export const createAPIService = (baseURL: string) => new APIService(baseURL);
