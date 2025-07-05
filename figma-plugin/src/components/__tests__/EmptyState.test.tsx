import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { EmptyState } from '../EmptyState';

describe('EmptyState Component', () => {
  const mockOnRefresh = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders empty state message', () => {
    render(<EmptyState onRefresh={mockOnRefresh} />);
    
    expect(screen.getByText('Select frames in Figma and click "Refresh" to load images')).toBeInTheDocument();
  });

  it('renders the frame icon', () => {
    render(<EmptyState onRefresh={mockOnRefresh} />);
    
    expect(screen.getByText('🖼️')).toBeInTheDocument();
  });

  it('renders refresh button', () => {
    render(<EmptyState onRefresh={mockOnRefresh} />);
    
    const refreshButton = screen.getByText('Refresh Selection');
    expect(refreshButton).toBeInTheDocument();
  });

  it('calls onRefresh when button is clicked', () => {
    render(<EmptyState onRefresh={mockOnRefresh} />);
    
    const refreshButton = screen.getByText('Refresh Selection');
    fireEvent.click(refreshButton);
    
    expect(mockOnRefresh).toHaveBeenCalledTimes(1);
  });

  it('has centered layout styling', () => {
    const { container } = render(<EmptyState onRefresh={mockOnRefresh} />);
    
    const emptyStateDiv = container.firstChild as HTMLElement;
    expect(emptyStateDiv).toHaveStyle({
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    });
  });

  it('has minimum height set', () => {
    const { container } = render(<EmptyState onRefresh={mockOnRefresh} />);
    
    const emptyStateDiv = container.firstChild as HTMLElement;
    expect(emptyStateDiv).toHaveStyle({
      minHeight: '200px'
    });
  });
});
