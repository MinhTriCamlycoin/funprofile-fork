import { useState, useRef, useEffect, VideoHTMLAttributes, memo } from 'react';
import { cn } from '@/lib/utils';
import { isSlowConnection, prefersReducedMotion } from '@/utils/performanceOptimizer';

interface LazyVideoProps extends VideoHTMLAttributes<HTMLVideoElement> {
  src: string;
  poster?: string;
  showControls?: boolean;
}

/**
 * High-performance lazy video component
 * - Lazy loads video only when in viewport
 * - Preload="none" to save bandwidth
 * - Respects reduced motion preference
 * - Slow connection handling
 */
export const LazyVideo = memo(({
  src,
  poster,
  className,
  showControls = true,
  autoPlay = false,
  muted = true,
  loop = false,
  ...props
}: LazyVideoProps) => {
  const [isInView, setIsInView] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showPlaceholder, setShowPlaceholder] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Detect slow connection or reduced motion
  const slowConnection = isSlowConnection();
  const reducedMotion = prefersReducedMotion();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { 
        rootMargin: slowConnection ? '0px' : '100px',
        threshold: 0.1 
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [slowConnection]);

  const handleLoadedData = () => {
    setIsLoaded(true);
    setShowPlaceholder(false);
  };

  const handleCanPlay = () => {
    if (autoPlay && !reducedMotion && videoRef.current) {
      videoRef.current.play().catch(() => {
        // Autoplay blocked, ignore
      });
    }
  };

  return (
    <div 
      ref={containerRef}
      className={cn('relative overflow-hidden bg-muted', className)}
    >
      {/* Placeholder */}
      {showPlaceholder && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted animate-pulse">
          {poster && (
            <img
              src={poster}
              alt="Video thumbnail"
              className="w-full h-full object-cover opacity-50"
              loading="lazy"
            />
          )}
        </div>
      )}

      {/* Video element */}
      {isInView && (
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          controls={showControls}
          muted={muted}
          loop={loop}
          playsInline
          preload="none"
          onLoadedData={handleLoadedData}
          onCanPlay={handleCanPlay}
          className={cn(
            'w-full h-full object-cover transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0'
          )}
          {...props}
        />
      )}
    </div>
  );
});

LazyVideo.displayName = 'LazyVideo';

export default LazyVideo;
