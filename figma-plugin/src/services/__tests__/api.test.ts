import { apiService, createAPIService, APIError } from '../api';

// Mock fetch globally
const mockFetch = jest.fn();
(global as any).fetch = mockFetch;

describe('APIService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createAPIService', () => {
    it('creates an API service with custom base URL', () => {
      const customService = createAPIService('https://custom.api.com');
      expect(customService).toBeDefined();
    });
  });

  describe('apiService singleton', () => {
    it('should be defined', () => {
      expect(apiService).toBeDefined();
    });
  });

  describe('APIError', () => {
    it('creates error with message', () => {
      const error = new APIError('Test error');
      expect(error.message).toBe('Test error');
      expect(error.name).toBe('APIError');
    });

    it('creates error with status and details', () => {
      const error = new APIError('Test error', 404, { detail: 'Not found' });
      expect(error.status).toBe(404);
      expect(error.details).toEqual({ detail: 'Not found' });
    });
  });

  describe('request methods', () => {
    const service = createAPIService('http://test.api');

    it('makes GET request successfully', async () => {
      const mockResponse = { success: true, data: 'test' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockResponse),
      });

      const result = await service.get('/test');
      
      expect(mockFetch).toHaveBeenCalledWith('http://test.api/test', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      expect(result).toEqual(mockResponse);
    });

    it('makes POST request with data', async () => {
      const mockResponse = { success: true };
      const testData = { name: 'test' };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockResponse),
      });

      const result = await service.post('/test', testData);
      
      expect(mockFetch).toHaveBeenCalledWith('http://test.api/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testData),
      });
      expect(result).toEqual(mockResponse);
    });

    it('throws APIError for failed requests', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: jest.fn().mockResolvedValueOnce('Server error details'),
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      await expect(service.get('/error')).rejects.toThrow(APIError);
      
      // Reset for second call
      mockFetch.mockResolvedValueOnce(mockResponse);
      await expect(service.get('/error')).rejects.toThrow('API request failed: Internal Server Error');
    });

    it('handles network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network failure'));

      await expect(service.get('/network-error')).rejects.toThrow(APIError);
      await expect(service.get('/network-error')).rejects.toThrow('Network error: Network failure');
    });

    it('downloads blob successfully', async () => {
      const mockBlob = new Blob(['test'], { type: 'text/plain' });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        blob: jest.fn().mockResolvedValueOnce(mockBlob),
      });

      const result = await service.downloadBlob('/download');
      
      expect(result).toEqual(mockBlob);
    });

    it('throws error for failed blob download', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(service.downloadBlob('/not-found')).rejects.toThrow(APIError);
    });
  });

  describe('updateBaseURL', () => {
    it('updates the base URL', () => {
      const service = createAPIService('http://old.api');
      service.updateBaseURL('http://new.api');
      
      // We can't directly test the private baseURL, but we can test that subsequent calls use the new URL
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({}),
      });

      service.get('/test');
      
      expect(mockFetch).toHaveBeenCalledWith('http://new.api/test', expect.any(Object));
    });
  });

  describe('healthCheck', () => {
    it('performs health check', async () => {
      const mockHealth = { status: 'ok', timestamp: '2023-01-01' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockHealth),
      });

      const result = await apiService.healthCheck();
      
      expect(result).toEqual(mockHealth);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/health'),
        expect.objectContaining({ method: 'GET' })
      );
    });
  });
});
