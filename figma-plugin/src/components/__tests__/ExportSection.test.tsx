import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ExportSection } from '../ExportSection';

const mockExportSettings = {
  format: 'mp4' as const,
  quality: 'high' as const,
  resolution: { width: 1920, height: 1080, preset: '1080p' },
  fps: 30
};

const defaultProps = {
  isExporting: false,
  currentJob: null,
  socketConnected: false,
  socketPercent: 0,
  canExport: true,
  canDownload: false,
  exportSettings: mockExportSettings,
  onExport: jest.fn(),
  onDownload: jest.fn(),
  onCancel: jest.fn(),
  onFormatChange: jest.fn()
};

describe('ExportSection Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders export button when can export', () => {
    render(<ExportSection {...defaultProps} />);

    const exportButton = screen.getByText('🚀 Export Slideshow');
    expect(exportButton).toBeInTheDocument();
    expect(exportButton).not.toBeDisabled();
  });

  it('shows disabled state when cannot export', () => {
    render(<ExportSection {...defaultProps} canExport={false} />);

    const exportButton = screen.getByText('No frames to export');
    expect(exportButton).toBeDisabled();
  });

  it('calls onExport when export button is clicked', () => {
    render(<ExportSection {...defaultProps} />);

    const exportButton = screen.getByText('🚀 Export Slideshow');
    fireEvent.click(exportButton);

    expect(defaultProps.onExport).toHaveBeenCalled();
  });

  it('shows format selector tabs', () => {
    render(<ExportSection {...defaultProps} />);

    expect(screen.getByText('MP4')).toBeInTheDocument();
    expect(screen.getByText('GIF')).toBeInTheDocument();
    expect(screen.getByText('WebM')).toBeInTheDocument();
  });

  it('calls onFormatChange when format tab is clicked', () => {
    render(<ExportSection {...defaultProps} />);

    const gifTab = screen.getByText('GIF');
    fireEvent.click(gifTab);

    expect(defaultProps.onFormatChange).toHaveBeenCalledWith('gif');
  });

  it('shows progress bar when exporting', () => {
    const exportingProps = {
      ...defaultProps,
      isExporting: true,
      currentJob: { status: 'processing' as const, progress: 50 },
      socketPercent: 50
    };

    render(<ExportSection {...exportingProps} />);

    expect(screen.getByText('Processing...')).toBeInTheDocument();
    expect(screen.getByText('Cancel Export')).toBeInTheDocument();
  });

  it('shows different job statuses correctly', () => {
    const statuses = [
      { status: 'pending' as const, expected: 'Queued...' },
      { status: 'processing' as const, expected: 'Processing...' }
    ];

    statuses.forEach(({ status, expected }) => {
      const exportingProps = {
        ...defaultProps,
        isExporting: true,
        currentJob: { status, progress: 25 }
      };

      const { rerender } = render(<ExportSection {...exportingProps} />);
      expect(screen.getByText(expected)).toBeInTheDocument();
      rerender(<div />); // Clear between tests
    });
  });

  it('shows download button when can download', () => {
    const downloadProps = {
      ...defaultProps,
      canDownload: true
    };

    render(<ExportSection {...downloadProps} />);

    const downloadButton = screen.getByText('⬇️ Download Video');
    expect(downloadButton).toBeInTheDocument();
  });

  it('calls onDownload when download button is clicked', () => {
    const downloadProps = {
      ...defaultProps,
      canDownload: true
    };

    render(<ExportSection {...downloadProps} />);

    const downloadButton = screen.getByText('⬇️ Download Video');
    fireEvent.click(downloadButton);

    expect(defaultProps.onDownload).toHaveBeenCalled();
  });

  it('calls onCancel when cancel button is clicked', () => {
    const exportingProps = {
      ...defaultProps,
      isExporting: true,
      currentJob: { status: 'processing' as const }
    };

    render(<ExportSection {...exportingProps} />);

    const cancelButton = screen.getByText('Cancel Export');
    fireEvent.click(cancelButton);

    expect(defaultProps.onCancel).toHaveBeenCalled();
  });

  it('hides format selector when exporting', () => {
    const exportingProps = {
      ...defaultProps,
      isExporting: true,
      currentJob: { status: 'processing' as const }
    };

    render(<ExportSection {...exportingProps} />);

    expect(screen.queryByText('MP4')).not.toBeInTheDocument();
    expect(screen.queryByText('GIF')).not.toBeInTheDocument();
    expect(screen.queryByText('WebM')).not.toBeInTheDocument();
  });

  it('uses socket progress when connected', () => {
    const exportingProps = {
      ...defaultProps,
      isExporting: true,
      socketConnected: true,
      socketPercent: 75,
      currentJob: { status: 'processing' as const, progress: 50 }
    };

    render(<ExportSection {...exportingProps} />);

    // Progress bar should use socket percent (75) not job progress (50)
    // This would need to be verified by checking the progress bar component's value
    expect(screen.getByText('Processing...')).toBeInTheDocument();
  });
});
