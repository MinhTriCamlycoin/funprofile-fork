/**
 * Performance Optimization Utilities
 * Target: LCP <2s, PageSpeed >95
 */

// Preload critical resources
export const preloadCriticalResources = () => {
  // Preload critical fonts
  const fontPreload = document.createElement('link');
  fontPreload.rel = 'preload';
  fontPreload.as = 'font';
  fontPreload.type = 'font/woff2';
  fontPreload.crossOrigin = 'anonymous';
  fontPreload.href = 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff2';
  document.head.appendChild(fontPreload);
};

// Intersection Observer for lazy loading
let observer: IntersectionObserver | null = null;

export const getLazyLoadObserver = (): IntersectionObserver => {
  if (!observer) {
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const target = entry.target as HTMLElement;
            const src = target.dataset.src;
            
            if (src) {
              if (target.tagName === 'IMG') {
                (target as HTMLImageElement).src = src;
              } else if (target.tagName === 'VIDEO') {
                (target as HTMLVideoElement).src = src;
              }
              target.removeAttribute('data-src');
              observer?.unobserve(target);
            }
          }
        });
      },
      {
        rootMargin: '100px 0px',
        threshold: 0.01,
      }
    );
  }
  return observer;
};

// Debounce function for scroll/resize handlers
export const debounce = <T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

// Throttle function for frequent events
export const throttle = <T extends (...args: unknown[]) => unknown>(
  fn: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle = false;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// Memory cleanup utility
export const cleanupEventListeners = (
  element: HTMLElement | Window | Document,
  listeners: Array<{ event: string; handler: EventListener }>
) => {
  listeners.forEach(({ event, handler }) => {
    element.removeEventListener(event, handler);
  });
};

// Image loading with blur placeholder
export const loadImageWithPlaceholder = (
  src: string,
  onLoad: (dataUrl: string) => void
) => {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  
  img.onload = () => {
    // Create blur placeholder
    const canvas = document.createElement('canvas');
    canvas.width = 20;
    canvas.height = 20;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(img, 0, 0, 20, 20);
      onLoad(canvas.toDataURL('image/webp', 0.1));
    }
  };
  
  img.src = src;
};

// Request idle callback polyfill
export const requestIdleCallbackPolyfill = (
  callback: IdleRequestCallback,
  options?: IdleRequestOptions
): number => {
  if ('requestIdleCallback' in window) {
    return window.requestIdleCallback(callback, options);
  }
  return setTimeout(() => {
    callback({
      didTimeout: false,
      timeRemaining: () => 50,
    });
  }, 1) as unknown as number;
};

// Cancel idle callback polyfill
export const cancelIdleCallbackPolyfill = (id: number): void => {
  if ('cancelIdleCallback' in window) {
    window.cancelIdleCallback(id);
  } else {
    clearTimeout(id);
  }
};

// Batch DOM updates
export const batchDOMUpdates = (updates: Array<() => void>) => {
  requestAnimationFrame(() => {
    updates.forEach((update) => update());
  });
};

// Detect slow connection
export const isSlowConnection = (): boolean => {
  const connection = (navigator as Navigator & { connection?: { effectiveType?: string; saveData?: boolean } }).connection;
  if (connection) {
    return connection.saveData || 
           connection.effectiveType === 'slow-2g' || 
           connection.effectiveType === '2g';
  }
  return false;
};

// Reduce motion preference
export const prefersReducedMotion = (): boolean => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};
