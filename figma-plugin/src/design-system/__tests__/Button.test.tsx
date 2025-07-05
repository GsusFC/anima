import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../Button';

describe('Button Component', () => {
  it('renders children correctly', () => {
    render(<Button>Click me</Button>);
    
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const mockClick = jest.fn();
    render(<Button onClick={mockClick}>Click me</Button>);
    
    const button = screen.getByText('Click me');
    fireEvent.click(button);
    
    expect(mockClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    const mockClick = jest.fn();
    render(<Button disabled onClick={mockClick}>Click me</Button>);
    
    const button = screen.getByText('Click me');
    expect(button).toBeDisabled();
    
    fireEvent.click(button);
    expect(mockClick).not.toHaveBeenCalled();
  });

  it('renders as submit button when type is submit', () => {
    render(<Button type="submit">Submit</Button>);
    
    const button = screen.getByText('Submit');
    expect(button).toHaveAttribute('type', 'submit');
  });

  it('renders as regular button by default', () => {
    render(<Button>Default</Button>);
    
    const button = screen.getByText('Default');
    expect(button).toHaveAttribute('type', 'button');
  });

  it('applies custom styles', () => {
    const customStyle = { backgroundColor: 'red' };
    render(<Button style={customStyle}>Styled</Button>);
    
    const button = screen.getByText('Styled');
    expect(button).toHaveStyle({ backgroundColor: 'red' });
  });

  it('handles hover state correctly', () => {
    render(<Button>Hover me</Button>);
    
    const button = screen.getByText('Hover me');
    
    fireEvent.mouseEnter(button);
    fireEvent.mouseLeave(button);
    
    // Button should not crash on hover events
    expect(button).toBeInTheDocument();
  });

  it('handles press state correctly', () => {
    render(<Button>Press me</Button>);
    
    const button = screen.getByText('Press me');
    
    fireEvent.mouseDown(button);
    fireEvent.mouseUp(button);
    
    // Button should not crash on press events
    expect(button).toBeInTheDocument();
  });

  it('renders with different variants', () => {
    const { rerender } = render(<Button variant="primary">Primary</Button>);
    expect(screen.getByText('Primary')).toBeInTheDocument();

    rerender(<Button variant="secondary">Secondary</Button>);
    expect(screen.getByText('Secondary')).toBeInTheDocument();

    rerender(<Button variant="success">Success</Button>);
    expect(screen.getByText('Success')).toBeInTheDocument();

    rerender(<Button variant="error">Error</Button>);
    expect(screen.getByText('Error')).toBeInTheDocument();

    rerender(<Button variant="ghost">Ghost</Button>);
    expect(screen.getByText('Ghost')).toBeInTheDocument();
  });

  it('renders with different sizes', () => {
    const { rerender } = render(<Button size="sm">Small</Button>);
    expect(screen.getByText('Small')).toBeInTheDocument();

    rerender(<Button size="base">Base</Button>);
    expect(screen.getByText('Base')).toBeInTheDocument();

    rerender(<Button size="lg">Large</Button>);
    expect(screen.getByText('Large')).toBeInTheDocument();
  });

  it('applies fullWidth styling when fullWidth is true', () => {
    render(<Button fullWidth>Full Width</Button>);
    
    const button = screen.getByText('Full Width');
    expect(button).toHaveStyle({ width: '100%' });
  });
});
