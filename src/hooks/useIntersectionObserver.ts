import { useEffect, useRef, useState, useCallback } from 'react';

interface UseIntersectionObserverOptions {
  threshold?: number | number[];
  root?: Element | null;
  rootMargin?: string;
  freezeOnceVisible?: boolean;
}

interface UseIntersectionObserverResult {
  ref: React.RefObject<HTMLDivElement>;
  isIntersecting: boolean;
  entry: IntersectionObserverEntry | null;
}

/**
 * Hook for intersection observer
 * Used for lazy loading components and infinite scroll
 */
export function useIntersectionObserver({
  threshold = 0,
  root = null,
  rootMargin = '0px',
  freezeOnceVisible = false,
}: UseIntersectionObserverOptions = {}): UseIntersectionObserverResult {
  const ref = useRef<HTMLDivElement>(null);
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);

  const frozen = freezeOnceVisible && isIntersecting;

  const updateEntry = useCallback(
    ([entry]: IntersectionObserverEntry[]) => {
      setEntry(entry);
      setIsIntersecting(entry.isIntersecting);
    },
    []
  );

  useEffect(() => {
    const node = ref.current;
    const hasIOSupport = !!window.IntersectionObserver;

    if (!hasIOSupport || frozen || !node) return;

    const observer = new IntersectionObserver(updateEntry, {
      threshold,
      root,
      rootMargin,
    });

    observer.observe(node);

    return () => observer.disconnect();
  }, [threshold, root, rootMargin, frozen, updateEntry]);

  return { ref, isIntersecting, entry };
}

export default useIntersectionObserver;
