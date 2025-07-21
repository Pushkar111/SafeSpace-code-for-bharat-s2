import { useEffect } from 'react';

const MobileOptimizer = () => {
  useEffect(() => {
    // Fix iOS viewport height issues
    const setVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    // Initial set
    setVH();

    // Handle orientation changes and resize
    const handleResize = () => {
      setTimeout(setVH, 100); // Small delay to ensure proper calculation
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    // Prevent zoom on input focus (iOS Safari)
    const preventZoom = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
        e.target.style.fontSize = '16px';
      }
    };

    document.addEventListener('touchstart', preventZoom, { passive: true });

    // Fix scroll issues on mobile
    const fixScrollBehavior = () => {
      // Prevent body scroll when modals are open
      const body = document.body;
      const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
      
      if (scrollBarWidth > 0) {
        body.style.paddingRight = `${scrollBarWidth}px`;
      }
    };

    fixScrollBehavior();

    // Handle touch events better
    const handleTouchStart = (e) => {
      // Improve touch responsiveness
      if (e.target.closest('button') || e.target.closest('[role="button"]')) {
        e.target.style.transform = 'scale(0.98)';
      }
    };

    const handleTouchEnd = (e) => {
      if (e.target.closest('button') || e.target.closest('[role="button"]')) {
        setTimeout(() => {
          e.target.style.transform = '';
        }, 150);
      }
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    // Prevent horizontal scrolling
    document.body.style.overflowX = 'hidden';
    document.documentElement.style.overflowX = 'hidden';

    // Improve performance on mobile
    if ('ontouchstart' in window) {
      document.body.classList.add('touch-device');
      
      // Reduce motion for better performance
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        document.body.classList.add('reduced-motion');
      }
    }

    // Handle Android Chrome address bar
    const handleAddressBar = () => {
      if (window.navigator.userAgent.includes('Android')) {
        const viewport = document.querySelector('meta[name=viewport]');
        if (viewport) {
          viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=no');
        }
      }
    };

    handleAddressBar();

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      document.removeEventListener('touchstart', preventZoom);
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
      document.body.style.overflowX = '';
      document.documentElement.style.overflowX = '';
    };
  }, []);

  // Add CSS variables for safe areas
  useEffect(() => {
    const updateSafeArea = () => {
      const root = document.documentElement;
      root.style.setProperty('--safe-area-inset-top', 'env(safe-area-inset-top, 0px)');
      root.style.setProperty('--safe-area-inset-right', 'env(safe-area-inset-right, 0px)');
      root.style.setProperty('--safe-area-inset-bottom', 'env(safe-area-inset-bottom, 0px)');
      root.style.setProperty('--safe-area-inset-left', 'env(safe-area-inset-left, 0px)');
    };

    updateSafeArea();
    window.addEventListener('resize', updateSafeArea);
    
    return () => window.removeEventListener('resize', updateSafeArea);
  }, []);

  return null; // This component doesn't render anything
};

export default MobileOptimizer;
