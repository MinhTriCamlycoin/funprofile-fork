import { Suspense, lazy, ReactNode, memo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface LazyComponentProps {
  children: ReactNode;
  fallback?: ReactNode;
  minHeight?: string;
}

/**
 * Wrapper for lazy-loaded components with skeleton fallback
 */
export const LazyWrapper = memo(({
  children,
  fallback,
  minHeight = '200px',
}: LazyComponentProps) => {
  const defaultFallback = (
    <div 
      className="flex items-center justify-center animate-pulse bg-muted rounded-lg"
      style={{ minHeight }}
    >
      <Skeleton className="w-full h-full" />
    </div>
  );

  return (
    <Suspense fallback={fallback || defaultFallback}>
      {children}
    </Suspense>
  );
});

LazyWrapper.displayName = 'LazyWrapper';

/**
 * Create a lazy-loaded component with proper typing
 * Usage: const LazyFeed = lazyWithFallback(() => import('./pages/Feed'))
 */
export function lazyWithFallback<T extends React.ComponentType<unknown>>(
  importFn: () => Promise<{ default: T }>
) {
  return lazy(importFn);
}

export default LazyWrapper;
