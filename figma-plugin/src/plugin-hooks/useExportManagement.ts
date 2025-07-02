// @ts-nocheck
import { useState, useCallback, useRef } from 'react';
import { API_BASE_URL } from '../constants';
import { ExportSettings } from '../types/slideshow.types';

export interface ExportJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  downloadUrl?: string;
  error?: string;
  createdAt: Date;
}

interface ExportJobResponse {
  success: boolean;
  jobId: string;
  message?: string;
}

interface ExportStatusResponse {
  success: boolean;
  job: {
    id: string;
    status: string;
    progress: number;
    downloadUrl?: string;
    error?: string;
  };
}

// API calls
const createExportJob = async (
  sessionId: string,
  timeline: any[],
  settings: ExportSettings
): Promise<ExportJobResponse> => {
  // Convert timeline to backend format
  const images = timeline.map(item => ({
    filename: `${item.imageId}.png`, // Use imageId as filename
    id: item.imageId
  }));
  
  const frameDurations = timeline.map(item => item.duration);
  const transitions = timeline.map(item => item.transition).filter(Boolean);

  const endpoint = settings.format === 'gif' ? '/api/export/gif' : '/api/export/slideshow';
  
  const payload = {
    sessionId,
    images,
    frameDurations,
    transitions,
    quality: settings.quality,
    format: settings.format,
    source: 'figma-plugin'
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Export failed: ${response.statusText}`);
  }

  return response.json();
};

const getJobStatus = async (jobId: string): Promise<ExportStatusResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/export/status/${jobId}`);
  
  if (!response.ok) {
    throw new Error(`Status check failed: ${response.statusText}`);
  }

  return response.json();
};

const downloadExport = async (jobId: string): Promise<Blob> => {
  const response = await fetch(`${API_BASE_URL}/api/export/download/${jobId}`);
  
  if (!response.ok) {
    throw new Error(`Download failed: ${response.statusText}`);
  }

  return response.blob();
};

export const useExportManagement = () => {
  const [currentJob, setCurrentJob] = useState<ExportJob | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Start polling for job status
  const startPolling = useCallback((jobId: string) => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }

    pollingRef.current = setInterval(async () => {
      try {
        const statusResponse = await getJobStatus(jobId);
        
        if (statusResponse.success) {
          const job = statusResponse.job;
          
          setCurrentJob(prev => prev ? {
            ...prev,
            status: job.status as any,
            progress: job.progress,
            downloadUrl: job.downloadUrl,
            error: job.error
          } : null);

          // Stop polling if job is complete or failed
          if (job.status === 'completed' || job.status === 'failed') {
            if (pollingRef.current) {
              clearInterval(pollingRef.current);
              pollingRef.current = null;
            }
            setIsExporting(false);
          }
        }
      } catch (err) {
        console.error('Polling error:', err);
        setError(err.message);
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
        setIsExporting(false);
      }
    }, 1000); // Poll every second
  }, []);

  // Stop polling
  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  // Start export
  const startExport = useCallback(async (
    sessionId: string,
    timeline: any[],
    settings: ExportSettings
  ) => {
    setIsExporting(true);
    setError(null);
    
    try {
      // Create export job
      const response = await createExportJob(sessionId, timeline, settings);
      
      if (response.success) {
        const newJob: ExportJob = {
          id: response.jobId,
          status: 'pending',
          progress: 0,
          createdAt: new Date()
        };
        
        setCurrentJob(newJob);
        startPolling(response.jobId);
        
        return response.jobId;
      } else {
        throw new Error(response.message || 'Export job creation failed');
      }
    } catch (err) {
      setError(err.message);
      setIsExporting(false);
      throw err;
    }
  }, [startPolling]);

  // Download completed export
  const downloadResult = useCallback(async () => {
    if (!currentJob?.downloadUrl || currentJob.status !== 'completed') {
      throw new Error('No completed export available for download');
    }

    try {
      const blob = await downloadExport(currentJob.id);
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `figma-slideshow-${currentJob.id}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [currentJob]);

  // Cancel current job
  const cancelExport = useCallback(() => {
    stopPolling();
    setCurrentJob(null);
    setIsExporting(false);
    setError(null);
  }, [stopPolling]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    currentJob,
    isExporting,
    error,
    startExport,
    downloadResult,
    cancelExport,
    clearError,
    
    // Status helpers
    isCompleted: currentJob?.status === 'completed',
    isFailed: currentJob?.status === 'failed',
    isProcessing: currentJob?.status === 'processing' || currentJob?.status === 'pending',
    canDownload: currentJob?.status === 'completed' && currentJob.downloadUrl
  };
};
