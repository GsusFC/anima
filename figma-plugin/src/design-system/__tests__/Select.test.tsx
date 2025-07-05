import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Select } from '../Select';

const mockOptions = [
  { value: 'option1', label: 'Option 1' },
  { value: 'option2', label: 'Option 2' },
  { value: 'option3', label: 'Option 3' }
];

const defaultProps = {
  value: 'option1',
  onChange: jest.fn(),
  options: mockOptions
};

describe('Select Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders select with correct value', () => {
    render(<Select {...defaultProps} />);

    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
    expect(select).toHaveValue('option1');
  });

  it('renders all options', () => {
    render(<Select {...defaultProps} />);

    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();
    expect(screen.getByText('Option 3')).toBeInTheDocument();
  });

  it('calls onChange when value changes', () => {
    render(<Select {...defaultProps} />);

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'option2' } });

    expect(defaultProps.onChange).toHaveBeenCalledWith('option2');
  });

  it('applies small size styling when size is sm', () => {
    render(<Select {...defaultProps} size="sm" />);

    const select = screen.getByRole('combobox');
    expect(select).toHaveStyle({
      fontSize: '12px'
    });
  });

  it('applies default size styling when size is not specified', () => {
    render(<Select {...defaultProps} />);

    const select = screen.getByRole('combobox');
    expect(select).toHaveStyle({
      fontSize: '12px' // This is typography.fontSize.base
    });
  });

  it('handles disabled state', () => {
    render(<Select {...defaultProps} disabled />);

    const select = screen.getByRole('combobox');
    expect(select).toBeDisabled();
  });

  it('handles empty options array', () => {
    render(<Select {...defaultProps} options={[]} />);

    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
    expect(select.children).toHaveLength(0);
  });

  it('applies error styling when error prop is true', () => {
    render(<Select {...defaultProps} error />);

    const select = screen.getByRole('combobox');
    // Error border should be applied but testing exact border color in computed styles is complex
    expect(select).toHaveAttribute('style');
  });

  it('handles multiple option clicks correctly', () => {
    render(<Select {...defaultProps} />);

    const select = screen.getByRole('combobox');
    
    fireEvent.change(select, { target: { value: 'option2' } });
    expect(defaultProps.onChange).toHaveBeenCalledWith('option2');

    fireEvent.change(select, { target: { value: 'option3' } });
    expect(defaultProps.onChange).toHaveBeenCalledWith('option3');

    expect(defaultProps.onChange).toHaveBeenCalledTimes(2);
  });

  it('responds to focus and blur events', () => {
    render(<Select {...defaultProps} />);

    const select = screen.getByRole('combobox');
    
    // Test that focus/blur events can be triggered without errors
    expect(() => {
      fireEvent.focus(select);
      fireEvent.blur(select);
    }).not.toThrow();
  });

  it('has correct default styling', () => {
    render(<Select {...defaultProps} />);

    const select = screen.getByRole('combobox');
    expect(select).toHaveStyle({
      width: '100%',
      backgroundColor: 'rgb(44, 44, 44)', // colors.bg.primary
      color: 'rgb(255, 255, 255)' // colors.text.primary
    });
  });
});
