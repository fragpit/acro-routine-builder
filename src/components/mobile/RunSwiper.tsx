import { useEffect, useRef } from 'react';

interface Props {
  count: number;
  activeIndex: number;
  onActiveChange: (index: number) => void;
  renderPage: (index: number) => React.ReactNode;
}

/**
 * Horizontal scroll-snap swiper. Each page is full-width; the active page is
 * tracked by scroll position. Parent can drive `activeIndex` to programmatically
 * snap to a different run (e.g. after tapping a violation).
 */
export default function RunSwiper({ count, activeIndex, onActiveChange, renderPage }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lastReportedRef = useRef(activeIndex);
  const programmaticRef = useRef(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const width = el.clientWidth;
    if (!width) return;
    const target = activeIndex * width;
    if (Math.abs(el.scrollLeft - target) > 2) {
      programmaticRef.current = true;
      lastReportedRef.current = activeIndex;
      el.scrollTo({ left: target, behavior: 'smooth' });
      const t = window.setTimeout(() => {
        programmaticRef.current = false;
      }, 600);
      return () => {
        window.clearTimeout(t);
        programmaticRef.current = false;
      };
    }
  }, [activeIndex]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let raf = 0;
    function onScroll() {
      if (programmaticRef.current) return;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        if (!el) return;
        const width = el.clientWidth;
        if (!width) return;
        const idx = Math.round(el.scrollLeft / width);
        if (idx !== lastReportedRef.current && idx >= 0 && idx < count) {
          lastReportedRef.current = idx;
          onActiveChange(idx);
        }
      });
    }
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, [count, onActiveChange]);

  return (
    <div
      ref={containerRef}
      className="flex-1 min-h-0 flex overflow-x-auto overflow-y-hidden snap-x snap-mandatory overscroll-x-contain"
      style={{ scrollbarWidth: 'none' }}
    >
      {Array.from({ length: count }, (_, i) => (
        <section
          key={i}
          className="flex-none w-full h-full snap-start flex flex-col min-h-0"
        >
          {renderPage(i)}
        </section>
      ))}
    </div>
  );
}
