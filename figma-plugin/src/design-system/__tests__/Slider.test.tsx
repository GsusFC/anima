import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Slider } from '../Slider';

const defaultProps = {
  value: 50,
  onChange: jest.fn(),
  min: 0,
  max: 100
};

describe('Slider Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders slider with correct value', () => {
    render(<Slider {...defaultProps} />);

    const slider = screen.getByRole('slider');
    expect(slider).toBeInTheDocument();
    expect(slider).toHaveValue('50');
  });

  it('calls onChange when value changes', () => {
    render(<Slider {...defaultProps} />);

    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '75' } });

    expect(defaultProps.onChange).toHaveBeenCalledWith(75);
  });

  it('respects min and max values', () => {
    render(<Slider {...defaultProps} min={10} max={90} />);

    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('min', '10');
    expect(slider).toHaveAttribute('max', '90');
  });

  it('applies step value when provided', () => {
    render(<Slider {...defaultProps} step={5} />);

    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('step', '5');
  });

  it('handles disabled state', () => {
    render(<Slider {...defaultProps} disabled />);

    const slider = screen.getByRole('slider');
    expect(slider).toBeDisabled();
  });

  it('applies default styling', () => {
    render(<Slider {...defaultProps} />);

    const slider = screen.getByRole('slider');
    expect(slider).toHaveStyle({
      height: '4px',
      width: '100%'
    });
  });

  it('converts string values to numbers in onChange', () => {
    render(<Slider {...defaultProps} />);

    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '42' } });

    expect(defaultProps.onChange).toHaveBeenCalledWith(42);
    expect(typeof defaultProps.onChange.mock.calls[0][0]).toBe('number');
  });

  it('handles edge values correctly', () => {
    render(<Slider {...defaultProps} min={0} max={100} />);

    const slider = screen.getByRole('slider');
    
    // Test minimum value
    fireEvent.change(slider, { target: { value: '0' } });
    expect(defaultProps.onChange).toHaveBeenCalledWith(0);

    // Test maximum value
    fireEvent.change(slider, { target: { value: '100' } });
    expect(defaultProps.onChange).toHaveBeenCalledWith(100);
  });

  it('converts decimal values to integers (due to parseInt usage)', () => {
    render(<Slider {...defaultProps} step={0.1} />);

    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '50.5' } });

    // The component uses parseInt, so decimal values become integers
    expect(defaultProps.onChange).toHaveBeenCalledWith(50);
  });

  it('handles negative values when min is negative', () => {
    render(<Slider {...defaultProps} min={-50} max={50} value={-25} />);

    const slider = screen.getByRole('slider');
    expect(slider).toHaveValue('-25');

    fireEvent.change(slider, { target: { value: '-10' } });
    expect(defaultProps.onChange).toHaveBeenCalledWith(-10);
  });

  it('applies primary color by default', () => {
    render(<Slider {...defaultProps} />);

    const slider = screen.getByRole('slider');
    // Primary color should be applied in the background gradient
    expect(slider).toHaveStyle({
      background: expect.stringContaining('rgb(24, 160, 251)')
    });
  });

  it('applies secondary color when specified', () => {
    render(<Slider {...defaultProps} color="secondary" />);

    const slider = screen.getByRole('slider');
    // Secondary color should be applied in the background gradient
    expect(slider).toHaveStyle({
      background: expect.stringContaining('rgb(88, 86, 214)')
    });
  });

  it('handles disabled opacity', () => {
    render(<Slider {...defaultProps} disabled />);

    const slider = screen.getByRole('slider');
    expect(slider).toHaveStyle('opacity: 0.5');
  });

  it('handles enabled opacity', () => {
    render(<Slider {...defaultProps} />);

    const slider = screen.getByRole('slider');
    expect(slider).toHaveStyle('opacity: 1');
  });
});
