import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Header } from '../Header';

describe('Header Component', () => {
  const defaultProps = {
    frameCount: 5,
    onSetAPI: jest.fn(),
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders frame count correctly', () => {
    render(<Header {...defaultProps} />);
    
    expect(screen.getByText('🎬 Slideshow (5 frames)')).toBeInTheDocument();
  });

  it('renders with zero frames', () => {
    render(<Header {...defaultProps} frameCount={0} />);
    
    expect(screen.getByText('🎬 Slideshow (0 frames)')).toBeInTheDocument();
  });

  it('calls onSetAPI when Set API button is clicked', () => {
    render(<Header {...defaultProps} />);
    
    const setApiButton = screen.getByText('Set API');
    fireEvent.click(setApiButton);
    
    expect(defaultProps.onSetAPI).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Close button is clicked', () => {
    render(<Header {...defaultProps} />);
    
    const closeButton = screen.getByText('Close');
    fireEvent.click(closeButton);
    
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('has correct styling structure', () => {
    const { container } = render(<Header {...defaultProps} />);
    
    const headerDiv = container.firstChild as HTMLElement;
    expect(headerDiv).toHaveStyle({
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    });
  });

  it('renders both action buttons', () => {
    render(<Header {...defaultProps} />);
    
    expect(screen.getByText('Set API')).toBeInTheDocument();
    expect(screen.getByText('Close')).toBeInTheDocument();
  });
});
