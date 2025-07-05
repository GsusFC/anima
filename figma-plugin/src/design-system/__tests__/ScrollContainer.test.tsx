import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ScrollContainer } from '../ScrollContainer';

describe('ScrollContainer Component', () => {
  it('renders children correctly', () => {
    render(
      <ScrollContainer>
        <div>Test content</div>
      </ScrollContainer>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('applies default styling', () => {
    const { container } = render(
      <ScrollContainer>
        <div>Content</div>
      </ScrollContainer>
    );

    const scrollContainer = container.firstChild as HTMLElement;
    expect(scrollContainer).toHaveStyle({
      flex: '1',
      overflow: 'auto',
      padding: '16px' // spacing.lg
    });
  });

  it('applies custom maxHeight when provided', () => {
    const { container } = render(
      <ScrollContainer maxHeight="300px">
        <div>Content</div>
      </ScrollContainer>
    );

    const scrollContainer = container.firstChild as HTMLElement;
    expect(scrollContainer).toHaveStyle('max-height: 300px');
  });

  it('applies custom padding when provided', () => {
    const { container } = render(
      <ScrollContainer padding="8px">
        <div>Content</div>
      </ScrollContainer>
    );

    const scrollContainer = container.firstChild as HTMLElement;
    expect(scrollContainer).toHaveStyle('padding: 8px');
  });

  it('merges custom styles with default styles', () => {
    const customStyle = {
      backgroundColor: 'red',
      border: '1px solid blue'
    };

    const { container } = render(
      <ScrollContainer style={customStyle}>
        <div>Content</div>
      </ScrollContainer>
    );

    const scrollContainer = container.firstChild as HTMLElement;
    expect(scrollContainer).toHaveStyle({
      backgroundColor: 'red',
      border: '1px solid blue',
      flex: '1',
      overflow: 'auto'
    });
  });

  it('renders multiple children', () => {
    render(
      <ScrollContainer>
        <div>First child</div>
        <div>Second child</div>
        <p>Third child</p>
      </ScrollContainer>
    );

    expect(screen.getByText('First child')).toBeInTheDocument();
    expect(screen.getByText('Second child')).toBeInTheDocument();
    expect(screen.getByText('Third child')).toBeInTheDocument();
  });

  it('handles empty children', () => {
    const { container } = render(<ScrollContainer>{null}</ScrollContainer>);

    const scrollContainer = container.firstChild as HTMLElement;
    expect(scrollContainer).toBeInTheDocument();
    expect(scrollContainer).toBeEmptyDOMElement();
  });

  it('applies overflow auto for scrolling', () => {
    const { container } = render(
      <ScrollContainer>
        <div>Content</div>
      </ScrollContainer>
    );

    const scrollContainer = container.firstChild as HTMLElement;
    expect(scrollContainer).toHaveStyle({
      overflow: 'auto'
    });
  });

  it('does not override maxHeight when not provided', () => {
    const { container } = render(
      <ScrollContainer>
        <div>Content</div>
      </ScrollContainer>
    );

    const scrollContainer = container.firstChild as HTMLElement;
    expect(scrollContainer.style.maxHeight).toBe('');
  });

  it('handles complex nested content', () => {
    render(
      <ScrollContainer>
        <div>
          <h1>Title</h1>
          <div>
            <p>Paragraph 1</p>
            <p>Paragraph 2</p>
          </div>
          <ul>
            <li>Item 1</li>
            <li>Item 2</li>
          </ul>
        </div>
      </ScrollContainer>
    );

    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Paragraph 1')).toBeInTheDocument();
    expect(screen.getByText('Paragraph 2')).toBeInTheDocument();
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
  });

  it('preserves custom style object reference', () => {
    const customStyle = { backgroundColor: 'blue' };
    const { container } = render(
      <ScrollContainer style={customStyle}>
        <div>Content</div>
      </ScrollContainer>
    );

    const scrollContainer = container.firstChild as HTMLElement;
    expect(scrollContainer).toHaveStyle('background-color: blue');
  });
});
