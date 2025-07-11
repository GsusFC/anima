import React from 'react';
import { TimelineItem as TimelineItemType, ImageFile } from '../types/slideshow.types';
import TimelineItem from './TimelineItem';

/**
 * Builder pattern for TimelineItem components
 * Provides a fluent API for constructing timeline items with all their properties
 */
export class TimelineItemBuilder {
  private props: {
    item?: TimelineItemType;
    index?: number;
    image?: ImageFile;
    isDragged?: boolean;
    isDraggedOver?: boolean;
    onDragStart?: (e: React.DragEvent, itemId: string) => void;
    onDragEnd?: () => void;
    onDragOver?: (e: React.DragEvent, index: number) => void;
    onDragLeave?: () => void;
    onDrop?: (e: React.DragEvent, index: number) => void;
    onRemove?: (itemId: string) => void;
    onDurationChange?: (itemId: string, duration: number) => void;
    onTransitionClick?: (itemId: string) => void;
    formatDuration?: (duration: number) => string;
  } = {};

  /**
   * Set the timeline item data
   */
  setItem(item: TimelineItemType): TimelineItemBuilder {
    this.props.item = item;
    return this;
  }

  /**
   * Set the item index in timeline
   */
  setIndex(index: number): TimelineItemBuilder {
    this.props.index = index;
    return this;
  }

  /**
   * Set the associated image data
   */
  setImage(image: ImageFile): TimelineItemBuilder {
    this.props.image = image;
    return this;
  }

  /**
   * Set drag state (whether this item is being dragged)
   */
  setDragState(isDragged: boolean, isDraggedOver: boolean = false): TimelineItemBuilder {
    this.props.isDragged = isDragged;
    this.props.isDraggedOver = isDraggedOver;
    return this;
  }

  /**
   * Set drag event handlers
   */
  setDragHandlers(handlers: {
    onDragStart: (e: React.DragEvent, itemId: string) => void;
    onDragEnd: () => void;
    onDragOver: (e: React.DragEvent, index: number) => void;
    onDragLeave: () => void;
    onDrop: (e: React.DragEvent, index: number) => void;
  }): TimelineItemBuilder {
    this.props.onDragStart = handlers.onDragStart;
    this.props.onDragEnd = handlers.onDragEnd;
    this.props.onDragOver = handlers.onDragOver;
    this.props.onDragLeave = handlers.onDragLeave;
    this.props.onDrop = handlers.onDrop;
    return this;
  }

  /**
   * Set action handlers
   */
  setActionHandlers(handlers: {
    onRemove: (itemId: string) => void;
    onDurationChange: (itemId: string, duration: number) => void;
    onTransitionClick: (itemId: string) => void;
  }): TimelineItemBuilder {
    this.props.onRemove = handlers.onRemove;
    this.props.onDurationChange = handlers.onDurationChange;
    this.props.onTransitionClick = handlers.onTransitionClick;
    return this;
  }

  /**
   * Set utility functions
   */
  setUtilities(utils: {
    formatDuration: (duration: number) => string;
  }): TimelineItemBuilder {
    this.props.formatDuration = utils.formatDuration;
    return this;
  }

  /**
   * Validate that all required props are set
   */
  private validate(): void {
    const required = [
      'item', 'index', 'image', 'onDragStart', 'onDragEnd',
      'onDragOver', 'onDragLeave', 'onDrop', 'onRemove',
      'onDurationChange', 'onTransitionClick', 'formatDuration'
    ];

    for (const prop of required) {
      if (!(prop in this.props) || this.props[prop as keyof typeof this.props] === undefined) {
        throw new Error(`TimelineItemBuilder: Missing required prop '${prop}'`);
      }
    }
  }

  /**
   * Build and return the TimelineItem component
   */
  build(): React.ReactElement {
    this.validate();
    
    return React.createElement(TimelineItem, {
      item: this.props.item!,
      index: this.props.index!,
      image: this.props.image!,
      isDragged: this.props.isDragged || false,
      isDraggedOver: this.props.isDraggedOver || false,
      onDragStart: this.props.onDragStart!,
      onDragEnd: this.props.onDragEnd!,
      onDragOver: this.props.onDragOver!,
      onDragLeave: this.props.onDragLeave!,
      onDrop: this.props.onDrop!,
      onRemove: this.props.onRemove!,
      onDurationChange: this.props.onDurationChange!,
      onTransitionClick: this.props.onTransitionClick!,
      formatDuration: this.props.formatDuration!,
    });
  }

  /**
   * Static factory method for common use cases
   */
  static create(
    item: TimelineItemType,
    index: number,
    image: ImageFile
  ): TimelineItemBuilder {
    return new TimelineItemBuilder()
      .setItem(item)
      .setIndex(index)
      .setImage(image);
  }

  /**
   * Static factory method with default drag state
   */
  static createWithDragState(
    item: TimelineItemType,
    index: number,
    image: ImageFile,
    draggedItemId: string | null,
    dragOverIndex: number | null
  ): TimelineItemBuilder {
    const isDragged = draggedItemId === item.id;
    const isDraggedOver = dragOverIndex === index;
    
    return new TimelineItemBuilder()
      .setItem(item)
      .setIndex(index)
      .setImage(image)
      .setDragState(isDragged, isDraggedOver);
  }
}

/**
 * Convenience function for creating timeline items
 */
export const createTimelineItem = (
  item: TimelineItemType,
  index: number,
  image: ImageFile,
  draggedItemId: string | null = null,
  dragOverIndex: number | null = null
): TimelineItemBuilder => {
  return TimelineItemBuilder.createWithDragState(
    item,
    index,
    image,
    draggedItemId,
    dragOverIndex
  );
};
