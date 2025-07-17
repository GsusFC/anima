import React from 'react';
import { render, screen } from '@testing-library/react';
import { BaseEmptyState } from './BaseEmptyState';

// Mock icon for testing
const TestIcon = () => (
  <svg data-testid="test-icon" width="24" height="24">
    <circle cx="12" cy="12" r="10" />
  </svg>
);

describe('BaseEmptyState', () => {
  const defaultProps = {
    title: 'Test Title',
    subtitle: 'Test Subtitle',
    icon: <TestIcon />
  };

  it('renders title and subtitle correctly', () => {
    render(<BaseEmptyState {...defaultProps} />);
    
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Subtitle')).toBeInTheDocument();
  });

  it('renders the provided icon', () => {
    render(<BaseEmptyState {...defaultProps} />);
    
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  });

  it('applies slideshow title color correctly', () => {
    render(<BaseEmptyState {...defaultProps} titleColor="slideshow" />);
    
    const title = screen.getByText('Test Title');
    expect(title).toHaveClass('titleSlideshow');
  });

  it('applies video-editor title color correctly', () => {
    render(<BaseEmptyState {...defaultProps} titleColor="video-editor" />);
    
    const title = screen.getByText('Test Title');
    expect(title).toHaveClass('titleVideoEditor');
  });

  it('applies neutral title color correctly', () => {
    render(<BaseEmptyState {...defaultProps} titleColor="neutral" />);
    
    const title = screen.getByText('Test Title');
    expect(title).toHaveClass('titleNeutral');
  });

  it('applies custom title color as inline style', () => {
    render(<BaseEmptyState {...defaultProps} titleColor="#ff0000" />);
    
    const title = screen.getByText('Test Title');
    expect(title).toHaveStyle({ color: '#ff0000' });
  });

  it('applies custom className', () => {
    const { container } = render(
      <BaseEmptyState {...defaultProps} className="custom-class" />
    );
    
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('has fade-in animation class', () => {
    const { container } = render(<BaseEmptyState {...defaultProps} />);
    
    expect(container.firstChild).toHaveClass('fadeIn');
  });
});
