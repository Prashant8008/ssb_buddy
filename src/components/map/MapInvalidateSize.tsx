import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

/** Leaflet often renders a gray box on mobile until the container size is recalculated. */
export function MapInvalidateSize() {
  const map = useMap();

  useEffect(() => {
    const invalidate = () => map.invalidateSize({ animate: false });

    const raf = requestAnimationFrame(invalidate);
    const t1 = window.setTimeout(invalidate, 100);
    const t2 = window.setTimeout(invalidate, 400);

    const onResize = () => invalidate();
    const onOrientation = () => window.setTimeout(invalidate, 300);

    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onOrientation);

    let observer: ResizeObserver | undefined;
    const container = map.getContainer().parentElement;
    if (container && typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => invalidate());
      observer.observe(container);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onOrientation);
      observer?.disconnect();
    };
  }, [map]);

  return null;
}
