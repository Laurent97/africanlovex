import { useEffect, useState } from 'react';

export const useKeyboard = () => {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const handleResize = () => {
      const visualViewport = (window as any).visualViewport;
      if (visualViewport) {
        // Use Visual Viewport API for better accuracy
        const heightDiff = window.innerHeight - visualViewport.height;
        setIsKeyboardVisible(heightDiff > 150);
        setKeyboardHeight(heightDiff);
      } else {
        // Fallback for browsers without Visual Viewport API
        const isVisible = window.innerHeight < window.outerHeight * 0.8;
        setIsKeyboardVisible(isVisible);
        setKeyboardHeight(isVisible ? window.outerHeight - window.innerHeight : 0);
      }
    };

    // Listen for both window resize and Visual Viewport changes
    window.addEventListener('resize', handleResize);
    
    const visualViewport = (window as any).visualViewport;
    if (visualViewport) {
      visualViewport.addEventListener('resize', handleResize);
    }

    // Initial check
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (visualViewport) {
        visualViewport.removeEventListener('resize', handleResize);
      }
    };
  }, []);

  return {
    isKeyboardVisible,
    keyboardHeight,
    avoidKeyboard: isKeyboardVisible ? keyboardHeight : 0
  };
};
