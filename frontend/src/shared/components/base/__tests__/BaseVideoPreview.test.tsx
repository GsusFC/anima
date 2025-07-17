/**
 * BaseVideoPreview Component Tests
 * 
 * Tests for the unified video preview component to ensure it works correctly
 * across both slideshow and video-editor modes.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import BaseVideoPreview from '../BaseVideoPreview';

// Mock CSS modules
jest.mock('../BaseVideoPreview.module.css', () => ({
  container: 'container',
  containerSlideshow: 'container-slideshow',
  containerVideoEditor: 'container-video-editor',
  video: 'video',
  overlay: 'overlay',
  loadingContainer: 'loading-container',
  errorContainer: 'error-container',
  emptyContainer: 'empty-container'
}));

describe('BaseVideoPreview', () => {
  const defaultProps = {
    videoSrc: 'test-video.mp4',
    mode: 'slideshow' as const,
    onVideoLoaded: jest.fn(),
    onVideoError: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders video element with correct src', () => {
      render(<BaseVideoPreview {...defaultProps} />);
      
      const video = screen.getByRole('video');
      expect(video).toBeInTheDocument();
      expect(video).toHaveAttribute('src', 'test-video.mp4');
    });

    it('applies correct mode-specific classes', () => {
      const { rerender } = render(<BaseVideoPreview {...defaultProps} mode="slideshow" />);
      
      let container = screen.getByRole('video').parentElement;
      expect(container).toHaveClass('container-slideshow');

      rerender(<BaseVideoPreview {...defaultProps} mode="video-editor" />);
      
      container = screen.getByRole('video').parentElement;
      expect(container).toHaveClass('container-video-editor');
    });

    it('applies custom className', () => {
      render(<BaseVideoPreview {...defaultProps} className="custom-class" />);
      
      const video = screen.getByRole('video');
      expect(video).toHaveClass('custom-class');
    });
  });

  describe('Video Controls', () => {
    it('shows controls when showControls is true', () => {
      render(<BaseVideoPreview {...defaultProps} showControls={true} />);
      
      const video = screen.getByRole('video');
      expect(video).toHaveAttribute('controls');
    });

    it('hides controls when showControls is false', () => {
      render(<BaseVideoPreview {...defaultProps} showControls={false} />);
      
      const video = screen.getByRole('video');
      expect(video).not.toHaveAttribute('controls');
    });

    it('sets autoPlay when specified', () => {
      render(<BaseVideoPreview {...defaultProps} autoPlay={true} />);
      
      const video = screen.getByRole('video');
      expect(video).toHaveAttribute('autoplay');
    });

    it('sets loop when specified', () => {
      render(<BaseVideoPreview {...defaultProps} loop={true} />);
      
      const video = screen.getByRole('video');
      expect(video).toHaveAttribute('loop');
    });

    it('sets muted when specified', () => {
      render(<BaseVideoPreview {...defaultProps} muted={true} />);
      
      const video = screen.getByRole('video');
      expect(video).toHaveAttribute('muted');
    });
  });

  describe('Loading State', () => {
    it('shows loading content when isLoading is true', () => {
      const loadingContent = <div data-testid="loading">Loading...</div>;
      
      render(
        <BaseVideoPreview 
          {...defaultProps} 
          isLoading={true} 
          loadingContent={loadingContent}
        />
      );
      
      expect(screen.getByTestId('loading')).toBeInTheDocument();
      expect(screen.queryByRole('video')).not.toBeInTheDocument();
    });

    it('shows default loading state when no custom loading content provided', () => {
      render(<BaseVideoPreview {...defaultProps} isLoading={true} />);
      
      expect(screen.getByText('Loading video...')).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('shows error content when error is provided', () => {
      const errorContent = <div data-testid="error">Error occurred</div>;
      
      render(
        <BaseVideoPreview 
          {...defaultProps} 
          error="Video failed to load"
          errorContent={errorContent}
        />
      );
      
      expect(screen.getByTestId('error')).toBeInTheDocument();
      expect(screen.queryByRole('video')).not.toBeInTheDocument();
    });

    it('shows default error state when no custom error content provided', () => {
      render(<BaseVideoPreview {...defaultProps} error="Video failed to load" />);
      
      expect(screen.getByText('Error loading video')).toBeInTheDocument();
      expect(screen.getByText('Video failed to load')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('shows empty state when no videoSrc provided', () => {
      render(<BaseVideoPreview {...defaultProps} videoSrc="" />);
      
      expect(screen.getByText('No video selected')).toBeInTheDocument();
      expect(screen.queryByRole('video')).not.toBeInTheDocument();
    });

    it('shows custom empty content when provided', () => {
      const emptyContent = <div data-testid="empty">No video</div>;
      
      render(
        <BaseVideoPreview 
          {...defaultProps} 
          videoSrc=""
          emptyContent={emptyContent}
        />
      );
      
      expect(screen.getByTestId('empty')).toBeInTheDocument();
    });
  });

  describe('Overlay Content', () => {
    it('shows overlay content when showOverlay is true', () => {
      const overlayContent = <div data-testid="overlay">Overlay content</div>;
      
      render(
        <BaseVideoPreview 
          {...defaultProps} 
          showOverlay={true}
          overlayContent={overlayContent}
        />
      );
      
      expect(screen.getByTestId('overlay')).toBeInTheDocument();
    });

    it('hides overlay content when showOverlay is false', () => {
      const overlayContent = <div data-testid="overlay">Overlay content</div>;
      
      render(
        <BaseVideoPreview 
          {...defaultProps} 
          showOverlay={false}
          overlayContent={overlayContent}
        />
      );
      
      expect(screen.queryByTestId('overlay')).not.toBeInTheDocument();
    });
  });

  describe('Event Handlers', () => {
    it('calls onVideoLoaded when video loads', async () => {
      render(<BaseVideoPreview {...defaultProps} />);
      
      const video = screen.getByRole('video');
      fireEvent.loadedData(video);
      
      await waitFor(() => {
        expect(defaultProps.onVideoLoaded).toHaveBeenCalledTimes(1);
      });
    });

    it('calls onVideoError when video fails to load', async () => {
      render(<BaseVideoPreview {...defaultProps} />);
      
      const video = screen.getByRole('video');
      const errorEvent = new Event('error');
      fireEvent(video, errorEvent);
      
      await waitFor(() => {
        expect(defaultProps.onVideoError).toHaveBeenCalledWith(errorEvent);
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<BaseVideoPreview {...defaultProps} />);
      
      const video = screen.getByRole('video');
      expect(video).toHaveAttribute('playsInline');
      expect(video).toHaveAttribute('crossOrigin', 'anonymous');
    });

    it('supports keyboard navigation when controls are shown', () => {
      render(<BaseVideoPreview {...defaultProps} showControls={true} />);
      
      const video = screen.getByRole('video');
      expect(video).toHaveAttribute('controls');
      
      // Video with controls should be focusable
      video.focus();
      expect(video).toHaveFocus();
    });
  });

  describe('Responsive Behavior', () => {
    it('applies responsive classes correctly', () => {
      render(<BaseVideoPreview {...defaultProps} containerClassName="responsive-container" />);
      
      const container = screen.getByRole('video').parentElement;
      expect(container).toHaveClass('responsive-container');
    });
  });
});
