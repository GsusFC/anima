import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ProgressBar } from '../ProgressBar';

describe('ProgressBar Component', () => {
  it('renders progress bar with correct value', () => {
    const { container } = render(<ProgressBar value={50} />);

    const progressBar = container.querySelector('div[style*="width: 50%"]');
    expect(progressBar).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('shows percentage by default', () => {
    render(<ProgressBar value={75} />);

    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('hides percentage when showPercentage is false', () => {
    render(<ProgressBar value={75} showPercentage={false} />);

    expect(screen.queryByText('75%')).not.toBeInTheDocument();
  });

  it('displays label when provided', () => {
    render(<ProgressBar value={50} label="Loading..." />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('clamps value to 0-100 range', () => {
    const { container, rerender } = render(<ProgressBar value={150} />);
    
    let progressBar = container.querySelector('div[style*="width: 100%"]');
    expect(progressBar).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();

    rerender(<ProgressBar value={-50} />);
    progressBar = container.querySelector('div[style*="width: 0%"]');
    expect(progressBar).toBeInTheDocument();
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('applies primary color by default', () => {
    const { container } = render(<ProgressBar value={50} />);

    const progressBar = container.querySelector('div[style*="width: 50%"]');
    expect(progressBar).toHaveStyle('background-color: rgb(24, 160, 251)'); // colors.accent.primary
  });

  it('applies success color when specified', () => {
    const { container } = render(<ProgressBar value={50} color="success" />);

    const progressBar = container.querySelector('div[style*="width: 50%"]');
    expect(progressBar).toHaveStyle('background-color: rgb(20, 174, 92)'); // colors.status.success
  });

  it('applies warning color when specified', () => {
    const { container } = render(<ProgressBar value={50} color="warning" />);

    const progressBar = container.querySelector('div[style*="width: 50%"]');
    expect(progressBar).toHaveStyle('background-color: rgb(255, 203, 71)'); // colors.status.warning
  });

  it('applies error color when specified', () => {
    const { container } = render(<ProgressBar value={50} color="error" />);

    const progressBar = container.querySelector('div[style*="width: 50%"]');
    expect(progressBar).toHaveStyle('background-color: rgb(242, 72, 34)'); // colors.status.error
  });

  it('handles zero value', () => {
    const { container } = render(<ProgressBar value={0} />);

    const progressBar = container.querySelector('div[style*="width: 0%"]');
    expect(progressBar).toBeInTheDocument();
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('handles full value', () => {
    const { container } = render(<ProgressBar value={100} />);

    const progressBar = container.querySelector('div[style*="width: 100%"]');
    expect(progressBar).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('handles decimal values', () => {
    const { container } = render(<ProgressBar value={33.33} />);

    const progressBar = container.querySelector('div[style*="width: 33.33%"]');
    expect(progressBar).toBeInTheDocument();
    expect(screen.getByText('33%')).toBeInTheDocument(); // Rounded value
  });

  it('shows only label when showPercentage is false', () => {
    render(<ProgressBar value={75} label="Processing" showPercentage={false} />);

    expect(screen.getByText('Processing')).toBeInTheDocument();
    expect(screen.queryByText('75%')).not.toBeInTheDocument();
  });

  it('handles empty label gracefully', () => {
    render(<ProgressBar value={50} label="" />);

    // Should still show percentage even with empty label
    expect(screen.getByText('50%')).toBeInTheDocument();
  });
});
