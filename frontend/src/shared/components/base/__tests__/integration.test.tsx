/**
 * Base Components Integration Tests
 * 
 * Tests to ensure all base components work together correctly
 * and maintain consistency across slideshow and video-editor modes.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import BaseVideoPreview from '../BaseVideoPreview';
import { BaseExportBuilder } from '../BaseExportBuilder';
import BaseUpload from '../BaseUpload';

// Mock dependencies
jest.mock('../../export', () => ({
  UnifiedFormatSelector: ({ currentFormat, onFormatChange, mode }: any) => (
    <div data-testid="format-selector">
      <span>Format: {currentFormat}</span>
      <button onClick={() => onFormatChange('mp4')}>Change Format</button>
    </div>
  ),
  UnifiedQualitySelector: ({ currentQuality, onQualityChange }: any) => (
    <div data-testid="quality-selector">
      <span>Quality: {currentQuality}</span>
      <button onClick={() => onQualityChange('high')}>Change Quality</button>
    </div>
  ),
  UnifiedEmptyState: ({ mode }: any) => (
    <div data-testid="empty-state">Empty - {mode}</div>
  )
}));

jest.mock('../../unified', () => ({
  UnifiedUploadInterface: ({ children, mode }: any) => (
    <div data-testid="upload-interface">
      <span>Upload - {mode}</span>
      {children}
    </div>
  ),
  UnifiedUploadEmptyState: ({ mode }: any) => (
    <div data-testid="upload-empty">Upload Empty - {mode}</div>
  )
}));

jest.mock('../../Media/MediaList', () => ({
  MediaList: ({ items, mode }: any) => (
    <div data-testid="media-list">
      <span>Media List - {mode}</span>
      <span>Items: {items.length}</span>
    </div>
  )
}));

jest.mock('../../../hooks/useMediaUpload', () => ({
  useMediaUpload: () => ({
    uploadFiles: jest.fn(),
    errors: [],
    clearErrors: jest.fn()
  })
}));

jest.mock('../../../hooks/useExportValidation', () => ({
  useExportValidation: () => ({
    canExport: true,
    messages: []
  })
}));

jest.mock('../../types/export.types', () => ({
  convertToUnifiedFormat: (format: string) => format,
  convertToValidationQuality: (quality: string) => quality,
  isValidUnifiedFormat: () => true
}));

describe('Base Components Integration', () => {
  describe('Mode Consistency', () => {
    it('applies slideshow mode consistently across components', () => {
      const exportSettings = {
        format: 'mp4',
        quality: 'standard',
        fps: 30,
        resolution: { width: 1920, height: 1080, preset: 'original' as const }
      };

      const exportState = {
        isExporting: false,
        progress: 0,
        error: null,
        isCompleted: false
      };

      const uploadConfig = {
        accept: ['image/*'],
        multiple: true,
        maxSize: 10 * 1024 * 1024,
        autoUpload: false
      };

      render(
        <div>
          <BaseVideoPreview
            videoSrc="test.mp4"
            mode="slideshow"
            onVideoLoaded={() => {}}
            onVideoError={() => {}}
          />
          <BaseExportBuilder
            mode="slideshow"
            hasContent={true}
            exportSettings={exportSettings}
            exportState={exportState}
            onSettingsChange={() => {}}
            onExport={async () => {}}
          />
          <BaseUpload
            mode="slideshow"
            items={[]}
            uploadConfig={uploadConfig}
            onUpload={async () => {}}
            onItemAction={() => {}}
            convertToMediaItem={() => ({
              id: '1',
              file: new File([], 'test.jpg'),
              name: 'test.jpg',
              type: 'image' as const,
              size: 1000,
              createdAt: new Date(),
              updatedAt: new Date()
            })}
          />
        </div>
      );

      // Check that all components receive slideshow mode
      expect(screen.getByText('Upload - slideshow')).toBeInTheDocument();
      expect(screen.getByText('Upload Empty - slideshow')).toBeInTheDocument();
      expect(screen.getByText('Media List - slideshow')).toBeInTheDocument();
    });

    it('applies video-editor mode consistently across components', () => {
      const exportSettings = {
        format: 'mp4',
        quality: 'standard',
        fps: 30,
        resolution: { width: 1920, height: 1080, preset: 'original' as const }
      };

      const exportState = {
        isExporting: false,
        progress: 0,
        error: null,
        isCompleted: false
      };

      const uploadConfig = {
        accept: ['video/*'],
        multiple: false,
        maxSize: 500 * 1024 * 1024,
        autoUpload: false
      };

      render(
        <div>
          <BaseVideoPreview
            videoSrc="test.mp4"
            mode="video-editor"
            onVideoLoaded={() => {}}
            onVideoError={() => {}}
          />
          <BaseExportBuilder
            mode="video-editor"
            hasContent={true}
            exportSettings={exportSettings}
            exportState={exportState}
            onSettingsChange={() => {}}
            onExport={async () => {}}
          />
          <BaseUpload
            mode="video-editor"
            items={[]}
            uploadConfig={uploadConfig}
            onUpload={async () => {}}
            onItemAction={() => {}}
            convertToMediaItem={() => ({
              id: '1',
              file: new File([], 'test.mp4'),
              name: 'test.mp4',
              type: 'video' as const,
              size: 1000000,
              createdAt: new Date(),
              updatedAt: new Date()
            })}
          />
        </div>
      );

      // Check that all components receive video-editor mode
      expect(screen.getByText('Upload - video-editor')).toBeInTheDocument();
      expect(screen.getByText('Upload Empty - video-editor')).toBeInTheDocument();
      expect(screen.getByText('Media List - video-editor')).toBeInTheDocument();
    });
  });

  describe('State Management Integration', () => {
    it('handles state changes across components', async () => {
      const mockOnSettingsChange = jest.fn();
      const mockOnUpload = jest.fn();

      const exportSettings = {
        format: 'gif',
        quality: 'low',
        fps: 15,
        resolution: { width: 800, height: 600, preset: 'custom' as const }
      };

      const exportState = {
        isExporting: false,
        progress: 0,
        error: null,
        isCompleted: false
      };

      const uploadConfig = {
        accept: ['image/*'],
        multiple: true,
        maxSize: 10 * 1024 * 1024,
        autoUpload: false
      };

      render(
        <div>
          <BaseExportBuilder
            mode="slideshow"
            hasContent={true}
            exportSettings={exportSettings}
            exportState={exportState}
            onSettingsChange={mockOnSettingsChange}
            onExport={async () => {}}
          />
          <BaseUpload
            mode="slideshow"
            items={[]}
            uploadConfig={uploadConfig}
            onUpload={mockOnUpload}
            onItemAction={() => {}}
            convertToMediaItem={() => ({
              id: '1',
              file: new File([], 'test.jpg'),
              name: 'test.jpg',
              type: 'image' as const,
              size: 1000,
              createdAt: new Date(),
              updatedAt: new Date()
            })}
          />
        </div>
      );

      // Test export settings change
      fireEvent.click(screen.getByText('Change Format'));
      
      await waitFor(() => {
        expect(mockOnSettingsChange).toHaveBeenCalledWith({
          ...exportSettings,
          format: 'mp4'
        });
      });

      // Test quality change
      fireEvent.click(screen.getByText('Change Quality'));
      
      await waitFor(() => {
        expect(mockOnSettingsChange).toHaveBeenCalledWith({
          ...exportSettings,
          quality: 'high'
        });
      });
    });
  });

  describe('Error Handling Integration', () => {
    it('handles errors gracefully across components', () => {
      const exportSettings = {
        format: 'mp4',
        quality: 'standard',
        fps: 30,
        resolution: { width: 1920, height: 1080, preset: 'original' as const }
      };

      const exportStateWithError = {
        isExporting: false,
        progress: 0,
        error: 'Export failed',
        isCompleted: false
      };

      render(
        <div>
          <BaseVideoPreview
            videoSrc=""
            mode="slideshow"
            error="Video load failed"
            onVideoLoaded={() => {}}
            onVideoError={() => {}}
          />
          <BaseExportBuilder
            mode="slideshow"
            hasContent={false}
            exportSettings={exportSettings}
            exportState={exportStateWithError}
            onSettingsChange={() => {}}
            onExport={async () => {}}
          />
        </div>
      );

      // Check that error states are handled
      expect(screen.getByText('Error loading video')).toBeInTheDocument();
      expect(screen.getByText('Video load failed')).toBeInTheDocument();
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });
  });

  describe('Accessibility Integration', () => {
    it('maintains accessibility across components', () => {
      const exportSettings = {
        format: 'mp4',
        quality: 'standard',
        fps: 30,
        resolution: { width: 1920, height: 1080, preset: 'original' as const }
      };

      const exportState = {
        isExporting: false,
        progress: 0,
        error: null,
        isCompleted: false
      };

      render(
        <div>
          <BaseVideoPreview
            videoSrc="test.mp4"
            mode="slideshow"
            showControls={true}
            onVideoLoaded={() => {}}
            onVideoError={() => {}}
          />
          <BaseExportBuilder
            mode="slideshow"
            hasContent={true}
            exportSettings={exportSettings}
            exportState={exportState}
            onSettingsChange={() => {}}
            onExport={async () => {}}
          />
        </div>
      );

      // Check that interactive elements are accessible
      const video = screen.getByRole('video');
      expect(video).toBeInTheDocument();
      expect(video).toHaveAttribute('controls');

      const exportButton = screen.getByRole('button', { name: /export/i });
      expect(exportButton).toBeInTheDocument();
      expect(exportButton).toHaveAccessibleName();
    });
  });

  describe('Performance Integration', () => {
    it('handles large datasets efficiently', () => {
      const largeItemList = Array.from({ length: 1000 }, (_, i) => ({
        id: `item-${i}`,
        name: `Item ${i}`,
        file: new File([], `item-${i}.jpg`),
        type: 'image' as const,
        size: 1000,
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      const uploadConfig = {
        accept: ['image/*'],
        multiple: true,
        maxSize: 10 * 1024 * 1024,
        autoUpload: false
      };

      const startTime = performance.now();

      render(
        <BaseUpload
          mode="slideshow"
          items={largeItemList}
          uploadConfig={uploadConfig}
          onUpload={async () => {}}
          onItemAction={() => {}}
          convertToMediaItem={(item) => ({
            id: item.id,
            file: item.file,
            name: item.name,
            type: item.type,
            size: item.size,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt
          })}
        />
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render within reasonable time (less than 100ms for this test)
      expect(renderTime).toBeLessThan(100);
      expect(screen.getByText('Items: 1000')).toBeInTheDocument();
    });
  });
});
