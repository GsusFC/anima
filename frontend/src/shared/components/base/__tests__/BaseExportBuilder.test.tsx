/**
 * BaseExportBuilder Component Tests
 * 
 * Tests for the unified export builder component to ensure it works correctly
 * across both slideshow and video-editor modes.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BaseExportBuilder, BaseExportSettings, BaseExportState } from '../BaseExportBuilder';

// Mock unified components
jest.mock('../../export', () => ({
  UnifiedFormatSelector: ({ currentFormat, onFormatChange, mode }: any) => (
    <div data-testid="format-selector">
      <span>Format: {currentFormat}</span>
      <span>Mode: {mode}</span>
      <button onClick={() => onFormatChange('mp4')}>Change to MP4</button>
    </div>
  ),
  UnifiedQualitySelector: ({ currentQuality, onQualityChange, mode }: any) => (
    <div data-testid="quality-selector">
      <span>Quality: {currentQuality}</span>
      <span>Mode: {mode}</span>
      <button onClick={() => onQualityChange('high')}>Change to High</button>
    </div>
  ),
  UnifiedEmptyState: ({ mode }: any) => (
    <div data-testid="empty-state">No content - {mode}</div>
  )
}));

// Mock validation hook
jest.mock('../../../hooks/useExportValidation', () => ({
  useExportValidation: () => ({
    canExport: true,
    messages: []
  })
}));

// Mock type conversion utilities
jest.mock('../../types/export.types', () => ({
  convertToUnifiedFormat: (format: string) => format,
  convertToValidationQuality: (quality: string) => quality,
  isValidUnifiedFormat: () => true
}));

describe('BaseExportBuilder', () => {
  const mockExportSettings: BaseExportSettings = {
    format: 'mp4',
    quality: 'standard',
    fps: 30,
    resolution: {
      width: 1920,
      height: 1080,
      preset: 'original'
    }
  };

  const mockExportState: BaseExportState = {
    isExporting: false,
    progress: 0,
    error: null,
    isCompleted: false
  };

  const defaultProps = {
    mode: 'slideshow' as const,
    hasContent: true,
    exportSettings: mockExportSettings,
    exportState: mockExportState,
    onSettingsChange: jest.fn(),
    onExport: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders export controls when content is available', () => {
      render(<BaseExportBuilder {...defaultProps} />);
      
      expect(screen.getByTestId('format-selector')).toBeInTheDocument();
      expect(screen.getByTestId('quality-selector')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /export mp4/i })).toBeInTheDocument();
    });

    it('shows empty state when no content available', () => {
      render(<BaseExportBuilder {...defaultProps} hasContent={false} />);
      
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      expect(screen.getByText('No content - slideshow')).toBeInTheDocument();
    });

    it('applies correct mode to child components', () => {
      render(<BaseExportBuilder {...defaultProps} mode="video-editor" />);
      
      expect(screen.getByText('Mode: video-editor')).toBeInTheDocument();
    });
  });

  describe('Export Settings', () => {
    it('displays current format and quality', () => {
      render(<BaseExportBuilder {...defaultProps} />);
      
      expect(screen.getByText('Format: mp4')).toBeInTheDocument();
      expect(screen.getByText('Quality: standard')).toBeInTheDocument();
    });

    it('calls onSettingsChange when format changes', async () => {
      render(<BaseExportBuilder {...defaultProps} />);
      
      fireEvent.click(screen.getByText('Change to MP4'));
      
      await waitFor(() => {
        expect(defaultProps.onSettingsChange).toHaveBeenCalledWith({
          ...mockExportSettings,
          format: 'mp4'
        });
      });
    });

    it('calls onSettingsChange when quality changes', async () => {
      render(<BaseExportBuilder {...defaultProps} />);
      
      fireEvent.click(screen.getByText('Change to High'));
      
      await waitFor(() => {
        expect(defaultProps.onSettingsChange).toHaveBeenCalledWith({
          ...mockExportSettings,
          quality: 'high'
        });
      });
    });
  });

  describe('Export Progress', () => {
    it('shows progress bar when exporting', () => {
      const exportingState = {
        ...mockExportState,
        isExporting: true,
        progress: 50
      };

      render(
        <BaseExportBuilder 
          {...defaultProps} 
          exportState={exportingState}
        />
      );
      
      expect(screen.getByText('Exporting... 50%')).toBeInTheDocument();
      
      const progressBar = screen.getByRole('progressbar', { hidden: true });
      expect(progressBar).toHaveStyle('width: 50%');
    });

    it('shows custom progress content when provided', () => {
      const exportingState = {
        ...mockExportState,
        isExporting: true,
        progress: 75
      };

      const customProgress = <div data-testid="custom-progress">Custom progress: 75%</div>;

      render(
        <BaseExportBuilder 
          {...defaultProps} 
          exportState={exportingState}
          progressContent={customProgress}
        />
      );
      
      expect(screen.getByTestId('custom-progress')).toBeInTheDocument();
    });
  });

  describe('Export Button', () => {
    it('shows correct button text for different modes', () => {
      const { rerender } = render(<BaseExportBuilder {...defaultProps} mode="slideshow" />);
      
      expect(screen.getByRole('button', { name: /export mp4/i })).toBeInTheDocument();

      rerender(<BaseExportBuilder {...defaultProps} mode="video-editor" />);
      
      expect(screen.getByRole('button', { name: /export mp4/i })).toBeInTheDocument();
    });

    it('shows custom button text when provided', () => {
      render(
        <BaseExportBuilder 
          {...defaultProps} 
          exportButtonText="🚀 Custom Export"
        />
      );
      
      expect(screen.getByRole('button', { name: '🚀 Custom Export' })).toBeInTheDocument();
    });

    it('disables button when exporting', () => {
      const exportingState = {
        ...mockExportState,
        isExporting: true
      };

      render(
        <BaseExportBuilder 
          {...defaultProps} 
          exportState={exportingState}
        />
      );
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveTextContent(/exporting mp4/i);
    });

    it('calls onExport when button is clicked', async () => {
      render(<BaseExportBuilder {...defaultProps} />);
      
      fireEvent.click(screen.getByRole('button', { name: /export mp4/i }));
      
      await waitFor(() => {
        expect(defaultProps.onExport).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Additional Controls', () => {
    it('renders additional controls when provided', () => {
      const additionalControls = (
        <div data-testid="additional-controls">
          <button>Custom Control</button>
        </div>
      );

      render(
        <BaseExportBuilder 
          {...defaultProps} 
          additionalControls={additionalControls}
        />
      );
      
      expect(screen.getByTestId('additional-controls')).toBeInTheDocument();
      expect(screen.getByText('Custom Control')).toBeInTheDocument();
    });
  });

  describe('Validation', () => {
    it('shows validation messages when export is invalid', () => {
      const customValidation = () => ({
        canExport: false,
        messages: ['Invalid format', 'Missing required field']
      });

      render(
        <BaseExportBuilder 
          {...defaultProps} 
          customValidation={customValidation}
        />
      );
      
      expect(screen.getByText('Configuration Issues:')).toBeInTheDocument();
      expect(screen.getByText('Invalid format')).toBeInTheDocument();
      expect(screen.getByText('Missing required field')).toBeInTheDocument();
    });

    it('disables export button when validation fails', () => {
      const customValidation = () => ({
        canExport: false,
        messages: ['Validation error']
      });

      render(
        <BaseExportBuilder 
          {...defaultProps} 
          customValidation={customValidation}
        />
      );
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveTextContent(/invalid configuration/i);
    });
  });

  describe('Error Handling', () => {
    it('handles export errors gracefully', async () => {
      const onExportWithError = jest.fn().mockRejectedValue(new Error('Export failed'));

      render(
        <BaseExportBuilder 
          {...defaultProps} 
          onExport={onExportWithError}
        />
      );
      
      fireEvent.click(screen.getByRole('button', { name: /export mp4/i }));
      
      // Should not throw error
      await waitFor(() => {
        expect(onExportWithError).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<BaseExportBuilder {...defaultProps} />);
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      
      // Button should be properly labeled
      expect(button).toHaveAccessibleName();
    });

    it('provides tooltip for disabled button', () => {
      const customValidation = () => ({
        canExport: false,
        messages: ['Validation error']
      });

      render(
        <BaseExportBuilder 
          {...defaultProps} 
          customValidation={customValidation}
        />
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('title');
    });
  });
});
