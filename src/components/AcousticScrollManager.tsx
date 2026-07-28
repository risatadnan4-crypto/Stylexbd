import { useEffect, useRef } from 'react';
import Lenis from 'lenis';

export default function AcousticScrollManager() {
  const lenisRef = useRef<Lenis | null>(null);
  const overscrollYRef = useRef<number>(0);
  const lastScrollY = useRef(window.scrollY);
  const animationFrameIdRef = useRef<number | null>(null);

  // Hook into all anchor links to scroll smoothly using Lenis
  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      if (anchor && anchor.getAttribute('href')?.startsWith('#')) {
        const href = anchor.getAttribute('href');
        if (href && href !== '#') {
          const targetElement = document.querySelector(href) as HTMLElement | null;
          if (targetElement) {
            e.preventDefault();
            if (lenisRef.current) {
              lenisRef.current.scrollTo(targetElement, {
                offset: -80, // Offset for sticky navbar
                duration: 1.4,
              });
            } else {
              // Fallback for native mobile smooth scroll with sticky header offset
              const elementPosition = targetElement.getBoundingClientRect().top + window.scrollY;
              const offsetPosition = elementPosition - 80;
              window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
              });
            }
          }
        }
      }
    };

    document.addEventListener('click', handleAnchorClick);
    return () => {
      document.removeEventListener('click', handleAnchorClick);
    };
  }, []);

  // Monkeypatch window.scrollTo so all programmatic smooth scrolls use Lenis automatically
  useEffect(() => {
    const originalScrollTo = window.scrollTo;
    
    window.scrollTo = (optionsOrX?: ScrollToOptions | number, y?: number) => {
      if (lenisRef.current && typeof optionsOrX === 'object' && optionsOrX.behavior === 'smooth') {
        lenisRef.current.scrollTo(optionsOrX.top ?? 0, {
          duration: 1.3,
        });
      } else {
        if (typeof optionsOrX === 'number') {
          originalScrollTo(optionsOrX, y ?? 0);
        } else {
          originalScrollTo(optionsOrX || {});
        }
      }
    };

    return () => {
      window.scrollTo = originalScrollTo;
    };
  }, []);

  // Initialize/Update Lenis Smooth Scrolling Engine
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    // Skip Lenis smooth scroll on mobile devices entirely to restore 100% native momentum scrolling!
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 1024;
    if (isMobileDevice) {
      document.documentElement.style.scrollBehavior = 'smooth';
      return;
    }

    // Force native auto scrolling behavior to prevent browser jitter vs Lenis
    document.documentElement.style.scrollBehavior = 'auto';

    // Premium, hyper-tuned smooth scroll parameters for elite buttery responsiveness
    const lenis = new Lenis({
      lerp: 0.055, // Lower value = smoother, lazier ease out. Extremely buttery!
      duration: 1.3, // Rich duration for standard scroll momentum
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Luxurious exponential decay
      wheelMultiplier: 1.0, // Natural scroll amount match
      touchMultiplier: 1.6, // Amplified touch multiplier for highly responsive mobile scrolling
      infinite: false,
    });

    lenisRef.current = lenis;
    (window as any).lenis = lenis;

    lenis.on('scroll', (e) => {
      lastScrollY.current = e.scroll;
    });

    return () => {
      if (lenisRef.current) {
        lenisRef.current.destroy();
        lenisRef.current = null;
        (window as any).lenis = null;
      }
    };
  }, []);

  // Continuous animation loop for Lenis smooth scroll updates
  useEffect(() => {
    const updateFrame = (time: number) => {
      // Advance Lenis smooth scroll frame
      if (lenisRef.current) {
        const isModalActive = document.body.style.overflow === 'hidden';
        if (isModalActive) {
          lenisRef.current.stop();
        } else {
          lenisRef.current.start();
        }
        lenisRef.current.raf(time);
      }

      animationFrameIdRef.current = requestAnimationFrame(updateFrame);
    };

    animationFrameIdRef.current = requestAnimationFrame(updateFrame);

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, []);

  return null;
}
