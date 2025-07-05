import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TimelineItem } from '../TimelineItem';
import { TimelineItem as TimelineItemType } from '../../types/slideshow.types';

const mockImageFile = {
  id: 'image-1',
  name: 'test-image.png',
  preview: 'data:image/png;base64,test-preview'
};

const mockTimelineItem: TimelineItemType = {
  id: 'timeline-1',
  imageId: 'image-1',
  duration: 2000,
  position: 0,
  transition: {
    type: 'fade',
    duration: 500
  }
};

const defaultProps = {
  item: mockTimelineItem,
  image: mockImageFile,
  index: 0,
  totalItems: 3,
  onUpdate: jest.fn(),
  onRemove: jest.fn()
};

describe('TimelineItem Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders timeline item with image and basic info', () => {
    render(<TimelineItem {...defaultProps} />);

    expect(screen.getByText('test-image.png')).toBeInTheDocument();
    expect(screen.getByText('2.0s')).toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAttribute('src', 'data:image/png;base64,test-preview');
  });

  it('calls onUpdate when duration slider changes', () => {
    render(<TimelineItem {...defaultProps} />);

    const durationSlider = screen.getAllByRole('slider')[0]; // First slider is duration
    fireEvent.change(durationSlider, { target: { value: '3000' } });

    expect(defaultProps.onUpdate).toHaveBeenCalledWith('timeline-1', {
      duration: 3000
    });
  });

  it('calls onUpdate when transition type changes', () => {
    render(<TimelineItem {...defaultProps} />);

    const transitionSelect = screen.getByRole('combobox');
    fireEvent.change(transitionSelect, { target: { value: 'slide' } });

    expect(defaultProps.onUpdate).toHaveBeenCalledWith('timeline-1', {
      transition: { type: 'slide', duration: 500 }
    });
  });

  it('calls onRemove when remove button is clicked', () => {
    render(<TimelineItem {...defaultProps} />);

    const removeButton = screen.getByText('×');
    fireEvent.click(removeButton);

    expect(defaultProps.onRemove).toHaveBeenCalledWith('timeline-1');
  });

  it('does not show remove button when onRemove is not provided', () => {
    const propsWithoutRemove = { ...defaultProps, onRemove: undefined };
    render(<TimelineItem {...propsWithoutRemove} />);

    expect(screen.queryByText('×')).not.toBeInTheDocument();
  });

  it('shows transition controls', () => {
    render(<TimelineItem {...defaultProps} />);

    expect(screen.getByText('Transition:')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('handles different transition types', () => {
    const { rerender } = render(<TimelineItem {...defaultProps} />);

    // Test with cut transition
    const cutItem = {
      ...mockTimelineItem,
      transition: { type: 'cut' as const, duration: 0 }
    };
    rerender(<TimelineItem {...defaultProps} item={cutItem} />);

    const transitionSelect = screen.getByRole('combobox');
    expect(transitionSelect).toHaveValue('cut');
  });

  it('displays image preview correctly', () => {
    render(<TimelineItem {...defaultProps} />);

    const image = screen.getByRole('img');
    expect(image).toHaveAttribute('alt', 'test-image.png');
    expect(image).toHaveAttribute('src', 'data:image/png;base64,test-preview');
  });

  it('handles missing transition gracefully', () => {
    const itemWithoutTransition = {
      ...mockTimelineItem,
      transition: undefined
    };

    render(<TimelineItem {...defaultProps} item={itemWithoutTransition} />);

    // Should still render without errors
    expect(screen.getByText('test-image.png')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });
});
