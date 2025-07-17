/**
 * Scroll Navigation Hook
 * 
 * Reusable hook for scroll and navigation functionality in timeline components.
 * Provides smooth scrolling, keyboard navigation, and scroll position management.
 */

import { useState, useCallback, useRef, useEffect } from 'react';

// Scroll navigation configuration
export interface ScrollNavigationConfig {
  // Container configuration
  containerRef?: React.RefObject<HTMLElement>;
  itemSelector?: string;
  
  // Scroll behavior
  smoothScroll?: boolean;
  scrollBehavior?: ScrollBehavior;
  scrollPadding?: number;
  
  // Keyboard navigation
  enableKeyboardNav?: boolean;
  keyboardStep?: number;
  
  // Auto-scroll configuration
  autoScrollOnFocus?: boolean;
  autoScrollOnSelection?: boolean;
  
  // Callbacks
  onScroll?: (scrollLeft: number, scrollTop: number) => void;
  onScrollEnd?: (scrollLeft: number, scrollTop: number) => void;
  onItemFocus?: (itemIndex: number) => void;
  onItemSelect?: (itemIndex: number) => void;
}

// Scroll navigation state
export interface ScrollNavigationState {
  // Scroll position
  scrollLeft: number;
  scrollTop: number;
  
  // Scroll dimensions
  scrollWidth: number;
  scrollHeight: number;
  clientWidth: number;
  clientHeight: number;
  
  // Navigation state
  focusedItemIndex: number | null;
  selectedItemIndex: number | null;
  
  // Scroll state
  isScrolling: boolean;
  canScrollLeft: boolean;
  canScrollRight: boolean;
  canScrollUp: boolean;
  canScrollDown: boolean;
}

// Scroll navigation return type
export interface ScrollNavigationReturn {
  // State
  state: ScrollNavigationState;
  
  // Scroll actions
  scrollTo: (x: number, y?: number) => void;
  scrollToItem: (itemIndex: number) => void;
  scrollToStart: () => void;
  scrollToEnd: () => void;
  
  // Navigation actions
  navigateNext: () => void;
  navigatePrevious: () => void;
  navigateToItem: (itemIndex: number) => void;
  
  // Focus actions
  focusItem: (itemIndex: number) => void;
  selectItem: (itemIndex: number) => void;
  clearFocus: () => void;
  clearSelection: () => void;
  
  // Event handlers
  handleScroll: (e: React.UIEvent<HTMLElement>) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLElement>) => void;
  
  // Utility functions
  getItemPosition: (itemIndex: number) => { left: number; top: number; width: number; height: number } | null;
  isItemVisible: (itemIndex: number) => boolean;
  updateDimensions: () => void;
}

/**
 * Scroll Navigation Hook
 * 
 * Provides comprehensive scroll and navigation functionality for timeline-like components.
 */
export function useScrollNavigation(
  config: ScrollNavigationConfig = {}
): ScrollNavigationReturn {
  
  const {
    containerRef,
    itemSelector = '[data-item-index]',
    smoothScroll = true,
    scrollBehavior = 'smooth',
    scrollPadding: _scrollPadding = 20,
    enableKeyboardNav = true,
    keyboardStep = 100,
    autoScrollOnFocus = true,
    autoScrollOnSelection = true,
    onScroll,
    onScrollEnd,
    onItemFocus,
    onItemSelect
  } = config;

  // State
  const [scrollLeft, setScrollLeft] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);
  const [scrollWidth, setScrollWidth] = useState(0);
  const [scrollHeight, setScrollHeight] = useState(0);
  const [clientWidth, setClientWidth] = useState(0);
  const [clientHeight, setClientHeight] = useState(0);
  const [focusedItemIndex, setFocusedItemIndex] = useState<number | null>(null);
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);
  const [isScrolling, setIsScrolling] = useState(false);

  // Refs
  const internalContainerRef = useRef<HTMLElement>(null);
  const scrollEndTimer = useRef<NodeJS.Timeout | null>(null);
  
  // Use provided ref or internal ref
  const activeContainerRef = containerRef || internalContainerRef;

  // Computed state
  const canScrollLeft = scrollLeft > 0;
  const canScrollRight = scrollLeft < scrollWidth - clientWidth;
  const canScrollUp = scrollTop > 0;
  const canScrollDown = scrollTop < scrollHeight - clientHeight;

  // Update dimensions
  const updateDimensions = useCallback(() => {
    const container = activeContainerRef.current;
    if (!container) return;

    setScrollWidth(container.scrollWidth);
    setScrollHeight(container.scrollHeight);
    setClientWidth(container.clientWidth);
    setClientHeight(container.clientHeight);
  }, [activeContainerRef]);

  // Get item position
  const getItemPosition = useCallback((itemIndex: number) => {
    const container = activeContainerRef.current;
    if (!container) return null;

    const item = container.querySelector(`${itemSelector}[data-item-index="${itemIndex}"]`) as HTMLElement;
    if (!item) return null;

    const containerRect = container.getBoundingClientRect();
    const itemRect = item.getBoundingClientRect();

    return {
      left: itemRect.left - containerRect.left + container.scrollLeft,
      top: itemRect.top - containerRect.top + container.scrollTop,
      width: itemRect.width,
      height: itemRect.height
    };
  }, [activeContainerRef, itemSelector]);

  // Check if item is visible
  const isItemVisible = useCallback((itemIndex: number): boolean => {
    const container = activeContainerRef.current;
    if (!container) return false;

    const itemPos = getItemPosition(itemIndex);
    if (!itemPos) return false;

    const containerScrollLeft = container.scrollLeft;
    const containerScrollTop = container.scrollTop;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    return (
      itemPos.left >= containerScrollLeft &&
      itemPos.left + itemPos.width <= containerScrollLeft + containerWidth &&
      itemPos.top >= containerScrollTop &&
      itemPos.top + itemPos.height <= containerScrollTop + containerHeight
    );
  }, [activeContainerRef, getItemPosition]);

  // Scroll actions
  const scrollTo = useCallback((x: number, y: number = scrollTop) => {
    const container = activeContainerRef.current;
    if (!container) return;

    if (smoothScroll) {
      container.scrollTo({
        left: x,
        top: y,
        behavior: scrollBehavior
      });
    } else {
      container.scrollLeft = x;
      container.scrollTop = y;
    }
  }, [activeContainerRef, scrollTop, smoothScroll, scrollBehavior]);

  const scrollToItem = useCallback((itemIndex: number) => {
    const container = activeContainerRef.current;
    if (!container) return;

    const itemPos = getItemPosition(itemIndex);
    if (!itemPos) return;

    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    // Calculate scroll position to center the item
    const targetScrollLeft = Math.max(0, Math.min(
      itemPos.left - (containerWidth - itemPos.width) / 2,
      container.scrollWidth - containerWidth
    ));

    const targetScrollTop = Math.max(0, Math.min(
      itemPos.top - (containerHeight - itemPos.height) / 2,
      container.scrollHeight - containerHeight
    ));

    scrollTo(targetScrollLeft, targetScrollTop);
  }, [activeContainerRef, getItemPosition, scrollTo]);

  const scrollToStart = useCallback(() => {
    scrollTo(0, 0);
  }, [scrollTo]);

  const scrollToEnd = useCallback(() => {
    const container = activeContainerRef.current;
    if (!container) return;

    scrollTo(container.scrollWidth - container.clientWidth, scrollTop);
  }, [activeContainerRef, scrollTo, scrollTop]);

  // Navigation actions
  const navigateNext = useCallback(() => {
    if (focusedItemIndex !== null) {
      const nextIndex = focusedItemIndex + 1;
      focusItem(nextIndex);
    } else {
      scrollTo(scrollLeft + keyboardStep);
    }
  }, [focusedItemIndex, scrollLeft, keyboardStep, scrollTo]);

  const navigatePrevious = useCallback(() => {
    if (focusedItemIndex !== null) {
      const prevIndex = Math.max(0, focusedItemIndex - 1);
      focusItem(prevIndex);
    } else {
      scrollTo(Math.max(0, scrollLeft - keyboardStep));
    }
  }, [focusedItemIndex, scrollLeft, keyboardStep, scrollTo]);

  const navigateToItem = useCallback((itemIndex: number) => {
    focusItem(itemIndex);
    selectItem(itemIndex);
  }, []);

  // Focus actions
  const focusItem = useCallback((itemIndex: number) => {
    setFocusedItemIndex(itemIndex);
    
    if (autoScrollOnFocus && !isItemVisible(itemIndex)) {
      scrollToItem(itemIndex);
    }
    
    onItemFocus?.(itemIndex);
  }, [autoScrollOnFocus, isItemVisible, scrollToItem, onItemFocus]);

  const selectItem = useCallback((itemIndex: number) => {
    setSelectedItemIndex(itemIndex);
    
    if (autoScrollOnSelection && !isItemVisible(itemIndex)) {
      scrollToItem(itemIndex);
    }
    
    onItemSelect?.(itemIndex);
  }, [autoScrollOnSelection, isItemVisible, scrollToItem, onItemSelect]);

  const clearFocus = useCallback(() => {
    setFocusedItemIndex(null);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedItemIndex(null);
  }, []);

  // Event handlers
  const handleScroll = useCallback((e: React.UIEvent<HTMLElement>) => {
    const target = e.currentTarget;
    
    setScrollLeft(target.scrollLeft);
    setScrollTop(target.scrollTop);
    setIsScrolling(true);
    
    onScroll?.(target.scrollLeft, target.scrollTop);

    // Clear existing timer
    if (scrollEndTimer.current) {
      clearTimeout(scrollEndTimer.current);
    }

    // Set new timer for scroll end
    scrollEndTimer.current = setTimeout(() => {
      setIsScrolling(false);
      onScrollEnd?.(target.scrollLeft, target.scrollTop);
    }, 150);
  }, [onScroll, onScrollEnd]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLElement>) => {
    if (!enableKeyboardNav) return;

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        navigatePrevious();
        break;
      case 'ArrowRight':
        e.preventDefault();
        navigateNext();
        break;
      case 'Home':
        e.preventDefault();
        scrollToStart();
        break;
      case 'End':
        e.preventDefault();
        scrollToEnd();
        break;
      case 'Enter':
      case ' ':
        if (focusedItemIndex !== null) {
          e.preventDefault();
          selectItem(focusedItemIndex);
        }
        break;
      case 'Escape':
        e.preventDefault();
        clearFocus();
        clearSelection();
        break;
    }
  }, [enableKeyboardNav, navigatePrevious, navigateNext, scrollToStart, scrollToEnd, focusedItemIndex, selectItem, clearFocus, clearSelection]);

  // Update dimensions on mount and resize
  useEffect(() => {
    updateDimensions();
    
    const container = activeContainerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver(updateDimensions);
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, [activeContainerRef, updateDimensions]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scrollEndTimer.current) {
        clearTimeout(scrollEndTimer.current);
      }
    };
  }, []);

  // State object
  const state: ScrollNavigationState = {
    scrollLeft,
    scrollTop,
    scrollWidth,
    scrollHeight,
    clientWidth,
    clientHeight,
    focusedItemIndex,
    selectedItemIndex,
    isScrolling,
    canScrollLeft,
    canScrollRight,
    canScrollUp,
    canScrollDown
  };

  return {
    state,
    scrollTo,
    scrollToItem,
    scrollToStart,
    scrollToEnd,
    navigateNext,
    navigatePrevious,
    navigateToItem,
    focusItem,
    selectItem,
    clearFocus,
    clearSelection,
    handleScroll,
    handleKeyDown,
    getItemPosition,
    isItemVisible,
    updateDimensions
  };
}

export default useScrollNavigation;
