import { useState, useEffect } from 'react';

/**
 * Device detection utilities for mobile/desktop detection
 */

/**
 * Detects if the current device is a mobile device
 * @returns true if running on mobile device
 */
export const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }

  // Check user agent for mobile patterns
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
  const isMobileUserAgent = mobileRegex.test(navigator.userAgent);

  // Check for touch capability
  const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  // Check screen size (mobile-like dimensions)
  const isSmallScreen = window.innerWidth <= 768;

  // Device is considered mobile if it has mobile user agent OR (has touch + small screen)
  return isMobileUserAgent || (hasTouchScreen && isSmallScreen);
};

/**
 * Detects if the device has camera capabilities
 * @returns Promise<boolean> true if camera is available
 */
export const hasCameraSupport = async (): Promise<boolean> => {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
    return false;
  }

  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.some(device => device.kind === 'videoinput');
  } catch {
    return false;
  }
};

/**
 * React hook for mobile device detection
 * @returns boolean indicating if current device is mobile
 */
export const useIsMobile = (): boolean => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(isMobileDevice());
    };

    // Check on mount
    checkIsMobile();

    // Check on resize
    window.addEventListener('resize', checkIsMobile);

    return () => {
      window.removeEventListener('resize', checkIsMobile);
    };
  }, []);

  return isMobile;
};

