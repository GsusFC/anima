import { useState, useCallback, useRef } from 'react';
import { apiService } from '../services/api';
import { ExportSettings, TimelineItem } from '../types/slideshow.types';
import { GifConfig } from '../context/PluginContext';

export interface ExportJob {
    id: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress: number;
    downloadUrl?: string;
    error?: string;
    logUrl?: string;
    createdAt: Date;
    result?: any;
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
        logUrl?: string;
        result?: any;
    };
}

// API calls
const createExportJob = async (
    sessionId: string,
    timeline: TimelineItem[],
    settings: ExportSettings,
    gifConfig?: GifConfig
): Promise<any> => {
    // Convert timeline to backend format (filenames come from timeline)
    const images = timeline.map(item => ({
        filename: item.filename,
        id: item.imageId
    }));

    const frameDurations = timeline.map(item => item.duration);

    // Transitions for all but last frame, default to cut if undefined
    const transitions = timeline.slice(0, -1).map(item => {
        if (item.transition) return item.transition;
        return { type: 'cut', duration: 0 };
    });

    // Use simple endpoints for both GIF and video
    const endpoint = settings.format === 'gif' ? '/gif-simple' : '/video-simple';

    // Simplified payload for both GIF and video
    const payload = settings.format === 'gif' ? {
        sessionId,
        images,
        frameDurations
    } : {
        sessionId,
        images,
        frameDurations,
        format: settings.format,
        fps: settings.fps,
        quality: settings.quality,
        resolution: settings.resolution?.preset || 'auto',
        videoConfig: {
            resolution: settings.resolution?.preset === 'custom' ? {
                width: settings.resolution?.width || 1920,
                height: settings.resolution?.height || 1080
            } : undefined
        }
    };

    console.log('🎬 Export payload:', JSON.stringify({
        sessionId,
        imagesCount: images.length,
        frameDurations,
        transitions,
        quality: settings.quality,
        format: settings.format,
        fps: settings.fps,
        resolution: settings.resolution?.preset,
        endpoint: endpoint,
        videoConfigData: payload.videoConfig,
        FULL_SETTINGS: settings
    }, null, 2));

    const fullURL = `${apiService.getBaseURL()}${endpoint}`;
    console.log(`🚀 Starting export to: ${fullURL}`);
    console.log(`📤 Export payload:`, payload);

    const response = await fetch(fullURL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        // read error payload once
        const errorText = await response.text();
        console.error(`❌ Export failed with status ${response.status}:`, errorText);
        console.error(`❌ Request was sent to: ${fullURL}`);
        throw new Error(`Export failed: ${response.statusText}`);
    }

    return response.json();
};

const getJobStatus = async (jobId: string): Promise<ExportStatusResponse> => {
    const statusURL = `${apiService.getBaseURL()}/api/export/status/${jobId}`;
    console.log(`📊 Checking job status: ${statusURL}`);

    const response = await fetch(statusURL);

    if (!response.ok) {
        console.error(`❌ Status check failed: ${response.status} ${response.statusText}`);
        throw new Error(`Status check failed: ${response.statusText}`);
    }

    const result = await response.json();
    console.log(`📊 Job status result:`, result);
    return result;
};

const downloadExport = async (jobId: string): Promise<Blob> => {
    const downloadURL = `${apiService.getBaseURL()}/api/export/download/${jobId}`;
    console.log(`⬇️ Downloading from: ${downloadURL}`);

    const response = await fetch(downloadURL);

    if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
    }

    return response.blob();
};

export const useExportManagement = () => {
    const [currentJob, setCurrentJob] = useState<ExportJob | null>(null);
    const [isExporting, setIsExporting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const pollingRef = useRef<number | null>(null);

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
                        error: job.error,
                        logUrl: job.logUrl,
                        result: job.result
                    } : null);

                    // Stop polling if job is complete or failed
                    if (job.status === 'completed' || job.status === 'failed') {
                        if (pollingRef.current) {
                            clearInterval(pollingRef.current);
                            pollingRef.current = null;
                        }
                        setIsExporting(false);

                        // Set error state if job failed
                        if (job.status === 'failed') {
                            setError(job.error || 'Export job failed');
                        }
                    }
                }
            } catch (err) {
                console.error('Polling error:', err);
                setError(err instanceof Error ? err.message : 'Polling failed');
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
        timeline: TimelineItem[],
        settings: ExportSettings,
        gifConfig?: GifConfig
    ) => {
        setIsExporting(true);
        setError(null);

        try {
            // Direct export (no job queue)
            const response = await createExportJob(sessionId, timeline, settings, gifConfig);

            if (response.success) {
                // Simulate completion
                const completedJob: ExportJob = {
                    id: `direct_${Date.now()}`,
                    status: 'completed',
                    progress: 100,
                    createdAt: new Date(),
                    downloadUrl: response.downloadUrl
                };

                setCurrentJob(completedJob);
                setIsExporting(false);

                // Show completion message and trigger download
                console.log('🎉 Export completed! Starting automatic download...');
                
                if (response.downloadUrl) {
                    const link = document.createElement('a');
                    link.href = `${apiService.getBaseURL()}${response.downloadUrl}`;
                    link.download = response.filename || 'export';
                    link.style.display = 'none';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    
                    console.log('✅ File downloaded automatically:', response.filename);
                }

                return completedJob.id;
            } else {
                throw new Error(response.message || 'Export failed');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Export failed');
            setIsExporting(false);
            throw err;
        }
    }, []);

    // Download completed export
    const downloadResult = useCallback(async () => {
        if (!currentJob?.downloadUrl || currentJob.status !== 'completed') {
            throw new Error('No completed export available for download');
        }

        try {
            const blob = await downloadExport(currentJob.id);

            // Usar el nombre real del archivo si está disponible
            let filename = `figma-slideshow-${currentJob.id}`;
            if (currentJob.result && currentJob.result.filename) {
                filename = currentJob.result.filename;
            } else if (currentJob.downloadUrl) {
                // Try to infer extension from downloadUrl
                if (currentJob.downloadUrl.endsWith('.gif')) filename += '.gif';
                else if (currentJob.downloadUrl.endsWith('.webm')) filename += '.webm';
                else filename += '.mp4';
            } else {
                filename += '.mp4';
            }

            // Crear el enlace de descarga
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            return true;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Download failed');
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
        canDownload: currentJob?.status === 'completed' && currentJob.downloadUrl,
        logUrl: currentJob?.logUrl
    };
};
