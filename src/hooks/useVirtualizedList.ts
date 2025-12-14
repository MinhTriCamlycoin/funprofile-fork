import { useState, useEffect, useRef, useMemo, useCallback } from 'react';

interface UseVirtualizedListOptions<T> {
  items: T[];
  itemHeight: number;
  overscan?: number;
  containerHeight?: number;
}

interface VirtualizedListResult<T> {
  visibleItems: Array<{ item: T; index: number; style: React.CSSProperties }>;
  totalHeight: number;
  containerRef: React.RefObject<HTMLDivElement>;
  onScroll: () => void;
}

/**
 * Hook for virtualizing long lists
 * Renders only visible items to improve performance
 * Essential for feeds with 100+ posts
 */
export function useVirtualizedList<T>({
  items,
  itemHeight,
  overscan = 3,
  containerHeight,
}: UseVirtualizedListOptions<T>): VirtualizedListResult<T> {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(containerHeight || 0);

  // Update viewport height on resize
  useEffect(() => {
    if (!containerHeight && containerRef.current) {
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          setViewportHeight(entry.contentRect.height);
        }
      });
      
      resizeObserver.observe(containerRef.current);
      return () => resizeObserver.disconnect();
    }
    
    if (containerHeight) {
      setViewportHeight(containerHeight);
    }
  }, [containerHeight]);

  const onScroll = useCallback(() => {
    if (containerRef.current) {
      setScrollTop(containerRef.current.scrollTop);
    }
  }, []);

  const { visibleItems, totalHeight } = useMemo(() => {
    const totalHeight = items.length * itemHeight;
    
    if (viewportHeight === 0) {
      return { visibleItems: [], totalHeight };
    }

    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + viewportHeight) / itemHeight) + overscan
    );

    const visibleItems = [];
    for (let i = startIndex; i <= endIndex; i++) {
      visibleItems.push({
        item: items[i],
        index: i,
        style: {
          position: 'absolute' as const,
          top: i * itemHeight,
          left: 0,
          right: 0,
          height: itemHeight,
        },
      });
    }

    return { visibleItems, totalHeight };
  }, [items, itemHeight, scrollTop, viewportHeight, overscan]);

  return {
    visibleItems,
    totalHeight,
    containerRef,
    onScroll,
  };
}

export default useVirtualizedList;
